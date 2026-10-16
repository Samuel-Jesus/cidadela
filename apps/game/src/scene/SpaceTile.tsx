import { useMemo, useRef, useState } from "react";
import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import type { Group } from "three";
import { getSpace } from "@cidadela/shared";
import { Landmark } from "../landmarks/Landmark";
import { stripeColor, tileColor } from "./colors";
import type { SpaceLayout } from "./layout";
import { BOARD_Y, TILE_THICKNESS } from "./layout";

const STRIPE_BAND = 0.28;
const NAME_FONT =
  "https://cdn.jsdelivr.net/fontsource/fonts/fredoka@5.2.5/latin-700-normal.woff";

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

function inkOn(hex: string): string {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  if (Number.isNaN(n)) return "#2a1810";
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.55 ? "#2a1810" : "#fffef8";
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
      layout.index === 4 ||
      layout.index === 5 ||
      layout.index === 10 ||
      layout.index === 12 ||
      layout.index === 15 ||
      layout.index === 20 ||
      layout.index === 25 ||
      layout.index === 27 ||
      layout.index === 28 ||
      layout.index === 35 ||
      layout.index === 39;
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
    g.position.y +=
      (BOARD_Y + TILE_THICKNESS / 2 + target - g.position.y) *
      Math.min(1, dt * 8);
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
        <boxGeometry
          args={[layout.width * 0.96, TILE_THICKNESS, layout.depth * 0.96]}
        />
        <meshStandardMaterial
          color={selected ? "#ffe08a" : color}
          roughness={0.7}
          metalness={0.05}
          emissive={selected ? "#664400" : "#000000"}
          emissiveIntensity={selected ? 0.25 : 0}
        />
      </mesh>

      {stripe ? (
        <ColorStripe layout={layout} color={stripe} name={space.name} />
      ) : (
        <NameBand layout={layout} name={space.name} fill={color} />
      )}

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
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -TILE_THICKNESS * 0.48, 0]}
        >
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

function stripePlacement(layout: SpaceLayout) {
  const side = isSideTile(layout.yaw);
  const ox = Math.sign(layout.x || 1);
  const oz = Math.sign(layout.z || 1);
  const radial = side ? layout.width : layout.depth;
  const along = side ? layout.depth * 0.9 : layout.width * 0.9;
  const across = radial * STRIPE_BAND;
  const front = radial * (0.5 - STRIPE_BAND / 2) * 0.94;

  const position: [number, number, number] = side
    ? [-ox * front, TILE_THICKNESS * 0.52, 0]
    : [0, TILE_THICKNESS * 0.52, -oz * front];

  const boxArgs: [number, number, number] = side
    ? [across, 0.045, along]
    : [along, 0.045, across];

  return { side, position, boxArgs, along, across };
}

function ColorStripe({
  layout,
  color,
  name,
}: {
  layout: SpaceLayout;
  color: string;
  name: string;
}) {
  const { position, boxArgs, along, across } = stripePlacement(layout);
  const ink = inkOn(color);

  return (
    <group>
      <mesh position={position} castShadow>
        <boxGeometry args={boxArgs} />
        <meshStandardMaterial color={color} roughness={0.55} />
      </mesh>
      <TileName
        layout={layout}
        name={name}
        position={[position[0], position[1] + 0.028, position[2]]}
        maxWidth={along * 0.92}
        bandHeight={across * 0.88}
        color={ink}
        outline={ink === "#fffef8" ? "#1a1008" : "#fffef8"}
      />
    </group>
  );
}

function NameBand({
  layout,
  name,
  fill,
}: {
  layout: SpaceLayout;
  name: string;
  fill: string;
}) {
  const { position, boxArgs, along, across } = stripePlacement(layout);
  const ink = inkOn(fill);

  return (
    <group>
      <mesh position={position}>
        <boxGeometry args={boxArgs} />
        <meshStandardMaterial
          color="#fff8ef"
          roughness={0.65}
          transparent
          opacity={0.92}
        />
      </mesh>
      <TileName
        layout={layout}
        name={name}
        position={[position[0], position[1] + 0.028, position[2]]}
        maxWidth={along * 0.92}
        bandHeight={across * 0.88}
        color={ink}
        outline="#fff8ef"
      />
    </group>
  );
}

function TileName({
  layout,
  name,
  position,
  maxWidth,
  bandHeight,
  color,
  outline,
}: {
  layout: SpaceLayout;
  name: string;
  position: [number, number, number];
  maxWidth: number;
  bandHeight: number;
  color: string;
  outline: string;
}) {
  const fontSize = Math.min(
    0.20,
    bandHeight * 0.36,
    maxWidth / Math.max(6, name.length * 0.45),
  );

  return (
    <group position={position} rotation={[0, layout.yaw, 0]}>
      <Text
        rotation={[-Math.PI / 2, 0, Math.PI / 1]}
        font={NAME_FONT}
        fontSize={fontSize}
        maxWidth={maxWidth}
        lineHeight={1}
        letterSpacing={0.1}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        color={color}
        outlineWidth={fontSize * 0.06}
        outlineColor={outline}
        overflowWrap="break-word"
        whiteSpace="normal"
        depthOffset={-1}
      >
        {name}
      </Text>
    </group>
  );
}
