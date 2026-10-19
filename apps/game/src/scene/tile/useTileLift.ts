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
    const target = baseY + (selected ? 0.12 : hovered ? 0.06 : 0);
    const dy = target - g.position.y;
    if (!selected && !hovered && Math.abs(dy) < 0.0004) {
      if (g.position.y !== baseY) g.position.y = baseY;
      return;
    }
    if (Math.abs(dy) < 0.0004) {
      if (g.position.y !== target) g.position.y = target;
      return;
    }
    g.position.y += dy * Math.min(1, dt * 8);
  });
}
