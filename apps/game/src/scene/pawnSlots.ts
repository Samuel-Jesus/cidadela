import type { SpaceLayout } from "./layout";


export function pawnSlotOffset(
  slotIndex: number,
  slotCount: number,
  layout: SpaceLayout,
): [number, number] {
  const outwardX = Math.sign(layout.x || 1) * layout.width * 0.18;
  const outwardZ = Math.sign(layout.z || 1) * layout.depth * 0.18;

  if (slotCount <= 1) {
    return [outwardX, outwardZ];
  }

  const radius = Math.min(layout.width, layout.depth) * 0.18;

  if (slotCount === 2) {
    const side = slotIndex === 0 ? -1 : 1;
    return [side * radius * 0.7 + outwardX, outwardZ];
  }

  const angle = (slotIndex / slotCount) * Math.PI * 2 - Math.PI / 2;
  return [
    Math.cos(angle) * radius + outwardX,
    Math.sin(angle) * radius + outwardZ,
  ];
}
