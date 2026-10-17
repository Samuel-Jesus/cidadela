import { useMemo, useRef, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import type { Group } from "three";
import { getSpace } from "@cidadela/shared";
import { Landmark } from "../landmarks/Landmark";
import { stripeColor, tileColor } from "./colors";
import type { SpaceLayout } from "./layout";
import { BOARD_Y } from "./layout";
import { StreetSign, streetSignCopy } from "./tile/StreetSign";
import { computeLandmarkSlot, LANDMARK_Y } from "./tile/tileLayout";
import { useTileLift } from "./tile/useTileLift";

const SURFACE_Y = BOARD_Y + 0.06;

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
  const accent = stripe ?? color;

  const { slotWidth, slotDepth, landmarkPos } = useMemo(
    () => computeLandmarkSlot(layout),
    [layout],
  );

  useTileLift(groupRef, selected, hovered, SURFACE_Y);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(layout.index);
  };

  return (
    <group
      ref={groupRef}
      position={[layout.x, SURFACE_Y, layout.z]}
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[layout.width * 0.96, layout.depth * 0.96]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <StreetSign
        layout={layout}
        accent={accent}
        {...streetSignCopy(space)}
      />

      <group position={[landmarkPos[0], LANDMARK_Y, landmarkPos[2]]}>
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
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
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
