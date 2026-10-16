import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import type { Group, Mesh } from "three";
import { getSpace } from "@cidadela/shared";
import { Landmark } from "../landmarks/Landmark";
import { stripeColor, tileColor } from "./colors";
import type { SpaceLayout } from "./layout";
import { BOARD_Y, TILE_THICKNESS } from "./layout";

type Props = {
  layout: SpaceLayout;
  selected: boolean;
  onSelect: (index: number) => void;
};

function isSideTile(yaw: number) {
  return Math.abs(Math.abs(yaw) - Math.PI / 2) < 0.2;
}

export function SpaceTile({ layout, selected, onSelect }: Props) {
  const space = getSpace(layout.index);
  const groupRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const color = tileColor(space);
  const stripe = stripeColor(space);

  const { slotWidth, slotDepth, landmarkScale, landmarkFrontOffset } = useMemo(() => {
    const side = isSideTile(layout.yaw);
    const slotWidth = side ? layout.depth : layout.width;
    const slotDepth = side ? layout.width : layout.depth;

    const landmarkScale = layout.index === 15 ? 1 : Math.min(0.85, Math.min(layout.width, layout.depth) * 0.42);

    // +Z local = frente (borda interna) — igual para todos os landmarks
    const landmarkFrontOffset = slotDepth * (layout.index === 15 ? 0.28 : 0.22);

    return { slotWidth, slotDepth, landmarkScale, landmarkFrontOffset };
  }, [layout]);

  useFrame((_, dt) => {
    const g = groupRef.current;
    if (!g) return;
    const target = selected ? 0.12 : hovered ? 0.06 : 0;
    g.position.y += (BOARD_Y + TILE_THICKNESS / 2 + target - g.position.y) * Math.min(1, dt * 8);
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(layout.index);
  };

  return (
    <group
      ref={groupRef}
      position={[layout.x, BOARD_Y + TILE_THICKNESS / 2, layout.z]}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "default";
      }}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[layout.width * 0.96, TILE_THICKNESS, layout.depth * 0.96]} />
        <meshStandardMaterial
          color={selected ? "#ffe08a" : color}
          roughness={0.7}
          metalness={0.05}
          emissive={selected ? "#664400" : "#000000"}
          emissiveIntensity={selected ? 0.25 : 0}
        />
      </mesh>

      {stripe ? <Stripe layout={layout} color={stripe} slotDepth={slotDepth} /> : null}

      <group position={[0, TILE_THICKNESS * 0.55, 0]} rotation={[0, layout.yaw, 0]} scale={landmarkScale}>
        <group position={[0, 0, landmarkFrontOffset]}>
          <Landmark
            index={layout.index}
            accent={selected || hovered}
            slotWidth={slotWidth}
            slotDepth={slotDepth}
          />
        </group>
      </group>

      {selected ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -TILE_THICKNESS * 0.48, 0]}>
          <ringGeometry
            args={[
              Math.min(layout.width, layout.depth) * 0.35,
              Math.min(layout.width, layout.depth) * 0.48,
              32,
            ]}
          />
          <meshBasicMaterial color="#ffd166" transparent opacity={0.85} />
        </mesh>
      ) : null}
    </group>
  );
}

function Stripe({
  layout,
  color,
  slotDepth,
}: {
  layout: SpaceLayout;
  color: string;
  slotDepth: number;
}) {
  const band = 0.22;
  const meshRef = useRef<Mesh>(null);
  const side = isSideTile(layout.yaw);
  const stripeWidth = (side ? layout.depth : layout.width) * 0.92;
  const stripeDepth = slotDepth * band;

  return (
    <group rotation={[0, layout.yaw, 0]}>
      <mesh
        ref={meshRef}
        position={[0, TILE_THICKNESS * 0.52, -(slotDepth * (0.5 - band / 2) * 0.92)]}
        castShadow
      >
        <boxGeometry args={[stripeWidth, 0.04, stripeDepth]} />
        <meshStandardMaterial color={color} roughness={0.55} />
      </mesh>
    </group>
  );
}
