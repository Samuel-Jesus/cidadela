import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { getPawnDef, type PawnId } from "@cidadela/shared";
import { BOARD_Y, TILE_THICKNESS, type SpaceLayout } from "./layout";
import { pawnSlotOffset } from "./pawnSlots";

type Props = {
  pawnId: PawnId;
  layout: SpaceLayout;
  slotIndex: number;
  slotCount: number;
  active?: boolean;
  onClick?: () => void;
};

export function Pawn({ pawnId, layout, slotIndex, slotCount, active, onClick }: Props) {
  const def = getPawnDef(pawnId);
  const group = useRef<Group>(null);
  const [ox, oz] = useMemo(
    () => pawnSlotOffset(slotIndex, slotCount, layout),
    [slotIndex, slotCount, layout],
  );

  const target = useMemo(
    () => ({
      x: layout.x + ox,
      y: BOARD_Y + TILE_THICKNESS + 0.02,
      z: layout.z + oz,
    }),
    [layout.x, layout.z, ox, oz],
  );

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const k = Math.min(1, dt * 6);
    const bounce = active ? Math.sin(performance.now() * 0.006) * 0.04 : 0;
    g.position.x += (target.x - g.position.x) * k;
    g.position.y += (target.y + bounce - g.position.y) * k;
    g.position.z += (target.z - g.position.z) * k;
    const scaleTarget = active ? 1.08 : 1;
    const s = g.scale.x + (scaleTarget - g.scale.x) * k;
    g.scale.setScalar(s);
  });

  return (
    <group
      ref={group}
      position={[target.x, target.y, target.z]}
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
      {/* Base */}
      <mesh castShadow receiveShadow position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.22, 0.26, 0.08, 16]} />
        <meshStandardMaterial color={def.accent} roughness={0.55} metalness={0.15} />
      </mesh>

      {/* Corpo */}
      <mesh castShadow position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.1, 0.2, 0.42, 16]} />
        <meshStandardMaterial color={def.color} roughness={0.45} metalness={0.12} />
      </mesh>

      {/* Cabeça */}
      <mesh castShadow position={[0, 0.58, 0]}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color={def.color} roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Detalhe no topo */}
      <mesh castShadow position={[0, 0.74, 0]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color={def.accent} roughness={0.35} metalness={0.2} />
      </mesh>

      {active ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[0.28, 0.36, 24]} />
          <meshBasicMaterial color="#ffd166" transparent opacity={0.9} />
        </mesh>
      ) : null}
    </group>
  );
}
