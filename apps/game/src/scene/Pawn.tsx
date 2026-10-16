import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { PawnId } from "@cidadela/shared";
import { PawnVisual } from "../pawns/PawnVisual";
import { BOARD_Y, TILE_THICKNESS, type SpaceLayout } from "./layout";
import { pawnSlotOffset } from "./pawnSlots";

const BOARD_SIZE = 40;
const STEP_DURATION = 0.32;
const HOP_HEIGHT = 0.28;
const SLOT_SLIDE_DURATION = 0.35;

type Props = {
  pawnId: PawnId;
  spaceIndex: number;
  layoutsByIndex: Map<number, SpaceLayout>;
  slotIndex: number;
  slotCount: number;
  active?: boolean;
  onClick?: () => void;
  onArrive?: (spaceIndex: number) => void;
};

type Waypoint = { x: number; y: number; z: number; hop: boolean };

function spacePoint(
  layout: SpaceLayout,
  slotIndex: number,
  slotCount: number,
): Omit<Waypoint, "hop"> {
  const [ox, oz] = pawnSlotOffset(slotIndex, slotCount, layout);
  return {
    x: layout.x + ox,
    y: BOARD_Y + TILE_THICKNESS + 0.02,
    z: layout.z + oz,
  };
}

/** Sempre casa a casa no sentido horário (inclui voltas longas / cartas). */
function buildPath(from: number, to: number): number[] {
  const steps = (to - from + BOARD_SIZE) % BOARD_SIZE;
  if (steps === 0) return [];
  const path: number[] = [];
  for (let i = 1; i <= steps; i++) {
    path.push((from + i) % BOARD_SIZE);
  }
  return path;
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function Pawn({
  pawnId,
  spaceIndex,
  layoutsByIndex,
  slotIndex,
  slotCount,
  active,
  onClick,
  onArrive,
}: Props) {
  const group = useRef<Group>(null);
  const spaceRef = useRef(spaceIndex);
  const slotRef = useRef({ slotIndex, slotCount });
  const queueRef = useRef<Waypoint[]>([]);
  const fromRef = useRef<Waypoint | null>(null);
  const progressRef = useRef(1);
  const durationRef = useRef(STEP_DURATION);
  const readyRef = useRef(false);
  const notifyArriveRef = useRef(false);
  const onArriveRef = useRef(onArrive);
  onArriveRef.current = onArrive;

  useEffect(() => {
    const layout = layoutsByIndex.get(spaceIndex);
    if (!layout) return;

    const destPoint = spacePoint(layout, slotIndex, slotCount);
    const g = group.current;

    if (!readyRef.current) {
      readyRef.current = true;
      spaceRef.current = spaceIndex;
      slotRef.current = { slotIndex, slotCount };
      fromRef.current = { ...destPoint, hop: false };
      progressRef.current = 1;
      queueRef.current = [];
      if (g) g.position.set(destPoint.x, destPoint.y, destPoint.z);
      return;
    }

    if (spaceIndex !== spaceRef.current) {
      const from = spaceRef.current;
      spaceRef.current = spaceIndex;
      slotRef.current = { slotIndex, slotCount };

      const indices = buildPath(from, spaceIndex);
      fromRef.current = g
        ? { x: g.position.x, y: destPoint.y, z: g.position.z, hop: true }
        : { ...destPoint, hop: true };

      queueRef.current = indices.map((idx, i) => {
        const lay = layoutsByIndex.get(idx);
        if (!lay) return { ...destPoint, hop: true };
        const last = i === indices.length - 1;
        const point = last ? destPoint : spacePoint(lay, 0, 1);
        return { ...point, hop: true };
      });

      durationRef.current = STEP_DURATION;
      progressRef.current = queueRef.current.length ? 0 : 1;
      notifyArriveRef.current = queueRef.current.length > 0;
      if (!queueRef.current.length) onArriveRef.current?.(spaceIndex);
      return;
    }

    const slotChanged =
      slotRef.current.slotIndex !== slotIndex || slotRef.current.slotCount !== slotCount;
    slotRef.current = { slotIndex, slotCount };

    if (!slotChanged) return;
    if (queueRef.current.length > 0 || progressRef.current < 1) return;
    if (!g) return;

    const dx = destPoint.x - g.position.x;
    const dz = destPoint.z - g.position.z;
    if (dx * dx + dz * dz < 1e-8) return;

    fromRef.current = { x: g.position.x, y: g.position.y, z: g.position.z, hop: false };
    queueRef.current = [{ ...destPoint, hop: false }];
    durationRef.current = SLOT_SLIDE_DURATION;
    progressRef.current = 0;
    notifyArriveRef.current = false;
  }, [spaceIndex, slotIndex, slotCount, layoutsByIndex]);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;

    const idle =
      queueRef.current.length === 0 && progressRef.current >= 1;
    const bounce = active && idle ? Math.sin(performance.now() * 0.005) * 0.03 : 0;

    if (queueRef.current.length > 0) {
      const to = queueRef.current[0];
      const from = fromRef.current ?? to;
      progressRef.current = Math.min(1, progressRef.current + dt / durationRef.current);
      const t = easeInOutCubic(progressRef.current);
      const hop = to.hop ? Math.sin(progressRef.current * Math.PI) * HOP_HEIGHT : 0;

      g.position.x = from.x + (to.x - from.x) * t;
      g.position.z = from.z + (to.z - from.z) * t;
      g.position.y = from.y + (to.y - from.y) * t + hop;

      if (progressRef.current >= 1) {
        queueRef.current.shift();
        fromRef.current = { ...to, hop: false };
        g.position.set(to.x, to.y, to.z);

        if (queueRef.current.length > 0) {
          progressRef.current = 0;
        } else {
          progressRef.current = 1;
          if (notifyArriveRef.current) {
            notifyArriveRef.current = false;
            onArriveRef.current?.(spaceRef.current);
          }
        }
      }
    } else if (bounce !== 0) {
      const baseY = fromRef.current?.y ?? g.position.y;
      g.position.y = baseY + bounce;
    }

    const scaleTarget = active ? 1.06 : 1;
    const s = g.scale.x + (scaleTarget - g.scale.x) * Math.min(1, dt * 5);
    g.scale.setScalar(s);
  });

  return (
    <group
      ref={group}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default";
      }}
    >
      <PawnVisual pawnId={pawnId} targetHeight={0.72} />

      {active ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[0.28, 0.36, 24]} />
          <meshBasicMaterial color="#ffd166" transparent opacity={0.9} />
        </mesh>
      ) : null}
    </group>
  );
}
