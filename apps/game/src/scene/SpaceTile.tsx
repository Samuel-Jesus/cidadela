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

export function SpaceTile({ layout, selected, onSelect }: Props) {
  const space = getSpace(layout.index);
  const groupRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const color = tileColor(space);
  const stripe = stripeColor(space);

  const landmarkScale = useMemo(() => {
    const m = Math.min(layout.width, layout.depth);
    return Math.min(0.85, m * 0.42);
  }, [layout.width, layout.depth]);

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

      {stripe ? <Stripe layout={layout} color={stripe} /> : null}

      <group position={[0, TILE_THICKNESS * 0.55, 0]} rotation={[0, layout.yaw, 0]} scale={landmarkScale}>
        <Landmark index={layout.index} />
      </group>

      {selected ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -TILE_THICKNESS * 0.48, 0]}>
          <ringGeometry args={[Math.min(layout.width, layout.depth) * 0.35, Math.min(layout.width, layout.depth) * 0.48, 32]} />
          <meshBasicMaterial color="#ffd166" transparent opacity={0.85} />
        </mesh>
      ) : null}
    </group>
  );
}

function Stripe({ layout, color }: { layout: SpaceLayout; color: string }) {
  const isWide = layout.width >= layout.depth;
  const band = 0.22;
  const meshRef = useRef<Mesh>(null);

  let position: [number, number, number];
  let args: [number, number, number];

  if (isWide) {
    // faixa na borda voltada ao centro (z → 0)
    const toward = layout.z > 0 ? -1 : 1;
    args = [layout.width * 0.92, 0.04, layout.depth * band];
    position = [0, TILE_THICKNESS * 0.52, toward * (layout.depth * (0.5 - band / 2) * 0.92)];
  } else {
    const toward = layout.x > 0 ? -1 : 1;
    args = [layout.width * band, 0.04, layout.depth * 0.92];
    position = [toward * (layout.width * (0.5 - band / 2) * 0.92), TILE_THICKNESS * 0.52, 0];
  }

  return (
    <mesh ref={meshRef} position={position} castShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} roughness={0.55} />
    </mesh>
  );
}
