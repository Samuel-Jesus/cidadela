import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { PawnId } from "@cidadela/shared";
import { PawnTypeFx } from "../pawns/PawnTypeFx";
import { PawnVisual } from "../pawns/PawnVisual";
import {
  getPawnKind,
  stepDurationFor,
  yawFollowFor,
} from "../pawns/pawnKind";
import { BOARD_Y, TILE_THICKNESS, type SpaceLayout } from "./layout";
import { pawnSlotOffset } from "./pawnSlots";

const BOARD_SIZE = 40;
const SLOT_SLIDE_DURATION = 0.4;

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

type Waypoint = { x: number; y: number; z: number };

function spacePoint(
  layout: SpaceLayout,
  slotIndex: number,
  slotCount: number,
): Waypoint {
  const [ox, oz] = pawnSlotOffset(slotIndex, slotCount, layout);
  return {
    x: layout.x + ox,
    y: BOARD_Y + TILE_THICKNESS + 0.02,
    z: layout.z + oz,
  };
}

function buildPath(from: number, to: number): number[] {
  const steps = (to - from + BOARD_SIZE) % BOARD_SIZE;
  if (steps === 0) return [];
  const path: number[] = [];
  for (let i = 1; i <= steps; i++) {
    path.push((from + i) % BOARD_SIZE);
  }
  return path;
}

function smootherstep(t: number) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerpAngle(a: number, b: number, t: number) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
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
  const kind = getPawnKind(pawnId);
  const group = useRef<Group>(null);
  const visual = useRef<Group>(null);
  const spaceRef = useRef(spaceIndex);
  const slotRef = useRef({ slotIndex, slotCount });
  const queueRef = useRef<Waypoint[]>([]);
  const fromRef = useRef<Waypoint | null>(null);
  const progressRef = useRef(1);
  const durationRef = useRef(stepDurationFor(kind));
  const readyRef = useRef(false);
  const notifyArriveRef = useRef(false);
  const movingRef = useRef(false);
  const yawRef = useRef(0);
  const yawVelRef = useRef(0);
  const leanRef = useRef(0);
  const pitchRef = useRef(0);
  const bobPhase = useRef(Math.random() * Math.PI * 2);
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
      fromRef.current = { ...destPoint };
      progressRef.current = 1;
      queueRef.current = [];
      movingRef.current = false;
      if (g) g.position.set(destPoint.x, destPoint.y, destPoint.z);
      return;
    }

    if (spaceIndex !== spaceRef.current) {
      const from = spaceRef.current;
      spaceRef.current = spaceIndex;
      slotRef.current = { slotIndex, slotCount };

      const indices = buildPath(from, spaceIndex);
      fromRef.current = g
        ? { x: g.position.x, y: destPoint.y, z: g.position.z }
        : { ...destPoint };

      queueRef.current = indices.map((idx, i) => {
        const lay = layoutsByIndex.get(idx);
        if (!lay) return { ...destPoint };
        const last = i === indices.length - 1;
        return last ? destPoint : spacePoint(lay, 0, 1);
      });

      durationRef.current = stepDurationFor(kind);
      progressRef.current = queueRef.current.length ? 0 : 1;
      movingRef.current = queueRef.current.length > 0;
      notifyArriveRef.current = queueRef.current.length > 0;
      if (!queueRef.current.length) onArriveRef.current?.(spaceIndex);
      return;
    }

    const slotChanged =
      slotRef.current.slotIndex !== slotIndex ||
      slotRef.current.slotCount !== slotCount;
    slotRef.current = { slotIndex, slotCount };

    if (!slotChanged) return;
    if (queueRef.current.length > 0 || progressRef.current < 1) return;
    if (!g) return;

    const dx = destPoint.x - g.position.x;
    const dz = destPoint.z - g.position.z;
    if (dx * dx + dz * dz < 1e-8) return;

    fromRef.current = {
      x: g.position.x,
      y: g.position.y,
      z: g.position.z,
    };
    queueRef.current = [{ ...destPoint }];
    durationRef.current = SLOT_SLIDE_DURATION;
    progressRef.current = 0;
    movingRef.current = true;
    notifyArriveRef.current = false;
  }, [spaceIndex, slotIndex, slotCount, layoutsByIndex, kind]);

  useFrame((_, dt) => {
    const g = group.current;
    const v = visual.current;
    if (!g) return;

    const tNow = performance.now() * 0.001 + bobPhase.current;

    if (queueRef.current.length > 0) {
      const to = queueRef.current[0]!;
      const from = fromRef.current ?? to;
      const look = queueRef.current[1] ?? to;

      progressRef.current = Math.min(
        1,
        progressRef.current + dt / durationRef.current,
      );
      const t = smootherstep(progressRef.current);

      g.position.x = from.x + (to.x - from.x) * t;
      g.position.z = from.z + (to.z - from.z) * t;

      const groundY = from.y + (to.y - from.y) * t;
      if (kind === "ship") {
        const wave =
          Math.sin(tNow * 1.8) * 0.018 + Math.sin(tNow * 2.7 + 1.1) * 0.01;
        g.position.y = groundY + wave;
      } else {
        const bump = Math.sin(progressRef.current * Math.PI) * 0.012;
        g.position.y = groundY + bump;
      }

      const dx = look.x - g.position.x;
      const dz = look.z - g.position.z;
      if (dx * dx + dz * dz > 1e-6) {
        const targetYaw = Math.atan2(dx, dz);
        const prev = yawRef.current;
        const next = lerpAngle(
          prev,
          targetYaw,
          Math.min(1, dt * yawFollowFor(kind)),
        );
        let d = next - prev;
        if (d > Math.PI) d -= Math.PI * 2;
        if (d < -Math.PI) d += Math.PI * 2;
        yawVelRef.current = yawVelRef.current * 0.85 + (d / Math.max(dt, 1e-4)) * 0.15;
        yawRef.current = next;
      }

      const leanTarget =
        kind === "kart"
          ? Math.max(-0.22, Math.min(0.22, -yawVelRef.current * 0.045))
          : Math.sin(tNow * 1.4) * 0.04;
      leanRef.current += (leanTarget - leanRef.current) * Math.min(1, dt * 5);

      const pitchTarget =
        kind === "kart"
          ? Math.sin(progressRef.current * Math.PI) * -0.03
          : Math.sin(tNow * 1.9) * 0.035;
      pitchRef.current += (pitchTarget - pitchRef.current) * Math.min(1, dt * 4);

      if (progressRef.current >= 1) {
        queueRef.current.shift();
        fromRef.current = { ...to };
        g.position.x = to.x;
        g.position.z = to.z;
        g.position.y = to.y;

        if (queueRef.current.length > 0) {
          progressRef.current = 0;
        } else {
          progressRef.current = 1;
          movingRef.current = false;
          if (notifyArriveRef.current) {
            notifyArriveRef.current = false;
            onArriveRef.current?.(spaceRef.current);
          }
        }
      }
    } else {
      movingRef.current = false;
      yawVelRef.current *= 1 - dt * 4;

      const baseY = fromRef.current?.y ?? g.position.y;
      if (kind === "ship") {
        const wave =
          Math.sin(tNow * 1.5) * 0.022 + Math.sin(tNow * 2.3 + 0.7) * 0.012;
        g.position.y = baseY + wave;
        leanRef.current +=
          (Math.sin(tNow * 1.2) * 0.045 - leanRef.current) * Math.min(1, dt * 3);
        pitchRef.current +=
          (Math.sin(tNow * 1.7 + 0.4) * 0.03 - pitchRef.current) *
          Math.min(1, dt * 3);
      } else {
        const idleBob = active ? Math.sin(tNow * 3.2) * 0.008 : 0;
        g.position.y = baseY + idleBob;
        leanRef.current += (0 - leanRef.current) * Math.min(1, dt * 4);
        pitchRef.current +=
          ((active ? Math.sin(tNow * 2.8) * 0.012 : 0) - pitchRef.current) *
          Math.min(1, dt * 4);
      }
    }

    if (v) {
      v.rotation.y = yawRef.current;
      v.rotation.z = leanRef.current;
      v.rotation.x = pitchRef.current;
    }

    const scaleTarget = active ? 1.04 : 1;
    const s = g.scale.x + (scaleTarget - g.scale.x) * Math.min(1, dt * 4);
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
      <group ref={visual}>
        <PawnVisual pawnId={pawnId} />
        <PawnTypeFx kind={kind} movingRef={movingRef} />
      </group>

      {active ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[0.28, 0.36, 24]} />
          <meshBasicMaterial color="#ffd166" transparent opacity={0.85} />
        </mesh>
      ) : null}
    </group>
  );
}
