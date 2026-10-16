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

function isCornerTile(index: number) {
  return index % 10 === 0;
}

export function SpaceTile({ layout, selected, onSelect }: Props) {
  const space = getSpace(layout.index);
  const groupRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const color = tileColor(space);
  const stripe = stripeColor(space);

  const { slotWidth, slotDepth, landmarkPos } = useMemo(() => {
    const side = isSideTile(layout.yaw);
    const corner = isCornerTile(layout.index);
    const ox = Math.sign(layout.x || 1);
    const oz = Math.sign(layout.z || 1);

    const trackWidth = side ? layout.depth : layout.width;
    const radialDepth = side ? layout.width : layout.depth;
    const cornerSize = Math.min(layout.width, layout.depth);

    const isGltf =
      layout.index === 10 ||
      layout.index === 15 ||
      layout.index === 27 ||
      layout.index === 28 ||
      layout.index === 35;
    let landmarkPos: [number, number, number];
    if (corner) {
      const inset = cornerSize * (isGltf ? 0.03 : 0.18);
      landmarkPos = [ox * inset, 0, oz * inset];
    } else if (side) {
      const back = layout.width * (isGltf ? 0.18 : 0.28);
      landmarkPos = [ox * back, 0, 0];
    } else {
      const back = layout.depth * (isGltf ? 0.18 : 0.28);
      landmarkPos = [0, 0, oz * back];
    }

    return {
      slotWidth: corner ? cornerSize * 0.9 : trackWidth,
      slotDepth: corner ? cornerSize * 0.9 : radialDepth,
      landmarkPos,
    };
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

      {stripe ? <Stripe layout={layout} color={stripe} /> : null}

      <group position={[landmarkPos[0], TILE_THICKNESS * 0.55, landmarkPos[2]]}>
        <group rotation={[0, layout.yaw, 0]}>
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

function Stripe({ layout, color }: { layout: SpaceLayout; color: string }) {
  const band = 0.22;
  const meshRef = useRef<Mesh>(null);
  const side = isSideTile(layout.yaw);
  const ox = Math.sign(layout.x || 1);
  const oz = Math.sign(layout.z || 1);

  if (side) {
    const radial = layout.width;
    const front = radial * (0.5 - band / 2) * 0.92;
    return (
      <mesh
        ref={meshRef}
        position={[-ox * front, TILE_THICKNESS * 0.52, 0]}
        castShadow
      >
        <boxGeometry args={[radial * band, 0.04, layout.depth * 0.92]} />
        <meshStandardMaterial color={color} roughness={0.55} />
      </mesh>
    );
  }

  const radial = layout.depth;
  const front = radial * (0.5 - band / 2) * 0.92;
  return (
    <mesh ref={meshRef} position={[0, TILE_THICKNESS * 0.52, -oz * front]} castShadow>
      <boxGeometry args={[layout.width * 0.92, 0.04, radial * band]} />
      <meshStandardMaterial color={color} roughness={0.55} />
    </mesh>
  );
}
