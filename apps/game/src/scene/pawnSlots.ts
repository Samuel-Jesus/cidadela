import type { SpaceLayout } from "./layout";

export function pawnSlotOffset(
  slotIndex: number,
  slotCount: number,
  layout: SpaceLayout,
): [number, number] {
  const inwardX = -Math.sign(layout.x || 1) * layout.width * 0.18;
  const inwardZ = -Math.sign(layout.z || 1) * layout.depth * 0.18;

  if (slotCount <= 1) {
    return [inwardX, inwardZ];
  }

  const radius = Math.min(layout.width, layout.depth) * 0.18;

  if (slotCount === 2) {
    const side = slotIndex === 0 ? -1 : 1;
    return [side * radius * 0.7 + inwardX, inwardZ];
  }

  const angle = (slotIndex / slotCount) * Math.PI * 2 - Math.PI / 2;
  return [
    Math.cos(angle) * radius + inwardX,
    Math.sin(angle) * radius + inwardZ,
  ];
}
