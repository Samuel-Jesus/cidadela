import { useFrame } from "@react-three/fiber";
import type { RefObject } from "react";
import type { Group } from "three";
import { BOARD_Y, TILE_THICKNESS } from "../layout";

export function useTileLift(
  groupRef: RefObject<Group | null>,
  selected: boolean,
  hovered: boolean,
  baseY = BOARD_Y + TILE_THICKNESS / 2,
) {
  useFrame((_, dt) => {
    const g = groupRef.current;
    if (!g) return;
    const target = selected ? 0.12 : hovered ? 0.06 : 0;
    g.position.y += (baseY + target - g.position.y) * Math.min(1, dt * 8);
  });
}
