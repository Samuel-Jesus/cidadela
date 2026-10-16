import type { SpaceLayout } from "./layout";

export function pawnSlotOffset(
  slotIndex: number,
  slotCount: number,
  layout: SpaceLayout,
): [number, number] {
  if (slotCount <= 1) return [0, 0];

  const radius = Math.min(layout.width, layout.depth) * 0.28;
  const outwardX = Math.sign(layout.x) * layout.width * 0.12;
  const outwardZ = Math.sign(layout.z) * layout.depth * 0.12;

  if (slotCount === 2) {
    const side = slotIndex === 0 ? -1 : 1;
    return [side * radius * 0.7 + outwardX * 0.3, outwardZ];
  }

  const angle = (slotIndex / slotCount) * Math.PI * 2 - Math.PI / 2;
  return [
    Math.cos(angle) * radius + outwardX * 0.25,
    Math.sin(angle) * radius + outwardZ * 0.25,
  ];
}
