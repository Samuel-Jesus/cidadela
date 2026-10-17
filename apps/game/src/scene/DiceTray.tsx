import { useCallback, useEffect, useRef } from "react";
import { Physics, useBox, usePlane } from "@react-three/cannon";
import type { ThreeEvent } from "@react-three/fiber";
import type { DiceRoll, DieFace } from "@cidadela/engine";
import { BOARD_Y } from "./layout";
import { PhysicsDie } from "./dice/PhysicsDie";

type Props = {
  rolling: boolean;
  rollId: number;
  canRoll: boolean;
  onRollRequest: () => void;
  onRollComplete: (roll: DiceRoll) => void;
};

function TableFloor() {
  const [ref] = usePlane(() => ({
    type: "Static",
    position: [0, BOARD_Y + 0.08, 0],
    rotation: [-Math.PI / 2, 0, 0],
    material: { friction: 0.45, restitution: 0.35 },
  }));
  return <mesh ref={ref} visible={false} />;
}

function InvisibleWall({
  position,
  args,
}: {
  position: [number, number, number];
  args: [number, number, number];
}) {
  const [ref] = useBox(() => ({
    type: "Static",
    position,
    args,
    material: { friction: 0.4, restitution: 0.35 },
  }));
  return <mesh ref={ref} visible={false} />;
}

function DoubleTapRollZone({
  enabled,
  onRoll,
}: {
  enabled: boolean;
  onRoll: () => void;
}) {
  const lastTapAt = useRef(0);

  const roll = (e: ThreeEvent<PointerEvent | MouseEvent>) => {
    if (!enabled) return;
    e.stopPropagation();
    onRoll();
  };

  return (
    <mesh
      position={[0, BOARD_Y + 0.55, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      onDoubleClick={roll}
      onPointerDown={(e) => {
        if (!enabled) return;
        if (e.pointerType === "mouse") return;
        const now = performance.now();
        if (now - lastTapAt.current < 350) {
          lastTapAt.current = 0;
          roll(e);
        } else {
          lastTapAt.current = now;
        }
      }}
    >
      <circleGeometry args={[1.85, 48]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

function DiceWorld({
  rolling,
  rollId,
  canRoll,
  onRollRequest,
  onRollComplete,
}: Props) {
  const faces = useRef<(DieFace | null)[]>([null, null]);
  const done = useRef(false);
  const onCompleteRef = useRef(onRollComplete);
  onCompleteRef.current = onRollComplete;

  useEffect(() => {
    faces.current = [null, null];
    done.current = false;
  }, [rollId]);

  const onFace = useCallback((index: number, face: DieFace) => {
    faces.current[index] = face;
    const [a, b] = faces.current;
    if (a != null && b != null && !done.current) {
      done.current = true;
      onCompleteRef.current({
        die1: a,
        die2: b,
        total: a + b,
        isDouble: a === b,
      });
    }
  }, []);

  const y = BOARD_Y + 0.9;
  const wallH = 1.4;

  return (
    <group>
      <TableFloor />
      <InvisibleWall position={[0, y, 1.55]} args={[3.2, wallH, 0.12]} />
      <InvisibleWall position={[0, y, -1.55]} args={[3.2, wallH, 0.12]} />
      <InvisibleWall position={[1.55, y, 0]} args={[0.12, wallH, 3.2]} />
      <InvisibleWall position={[-1.55, y, 0]} args={[0.12, wallH, 3.2]} />

      <PhysicsDie index={0} rolling={rolling} rollId={rollId} onFace={onFace} />
      <PhysicsDie index={1} rolling={rolling} rollId={rollId} onFace={onFace} />

      <DoubleTapRollZone enabled={canRoll && !rolling} onRoll={onRollRequest} />
    </group>
  );
}

export function DiceTray({
  rolling,
  rollId,
  canRoll,
  onRollRequest,
  onRollComplete,
}: Props) {
  return (
    <Physics
      gravity={[0, -28, 0]}
      allowSleep
      defaultContactMaterial={{ restitution: 0.4, friction: 0.35 }}
    >
      <DiceWorld
        rolling={rolling}
        rollId={rollId}
        canRoll={canRoll}
        onRollRequest={onRollRequest}
        onRollComplete={onRollComplete}
      />
    </Physics>
  );
}
