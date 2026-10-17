import type { SpaceLayout } from "../layout";

export const LANDMARK_Y = 0.02;

const GLTF_LANDMARK_INDEXES = new Set([
  0, 1, 2, 3, 4, 5, 6, 10, 12, 15, 17, 20, 25, 27, 28, 30, 33, 35, 39,
]);

export function isSideTile(yaw: number) {
  return Math.abs(Math.abs(yaw) - Math.PI / 2) < 0.2;
}

export function isCornerTile(index: number) {
  return index % 10 === 0;
}

export function isGltfLandmark(index: number) {
  return GLTF_LANDMARK_INDEXES.has(index);
}

export type LandmarkSlot = {
  slotWidth: number;
  slotDepth: number;
  landmarkPos: [number, number, number];
};

export function computeLandmarkSlot(layout: SpaceLayout): LandmarkSlot {
  const side = isSideTile(layout.yaw);
  const corner = isCornerTile(layout.index);
  const ox = Math.sign(layout.x || 1);
  const oz = Math.sign(layout.z || 1);

  const trackWidth = side ? layout.depth : layout.width;
  const radialDepth = side ? layout.width : layout.depth;
  const cornerSize = Math.min(layout.width, layout.depth);
  const gltf = isGltfLandmark(layout.index);

  let landmarkPos: [number, number, number];
  if (corner) {
    const insetFactor =
      layout.index === 0 || layout.index === 10
        ? 0.12
        : gltf
          ? 0.03
          : 0.18;
    const inset = cornerSize * insetFactor;
    landmarkPos = [ox * inset, 0, oz * inset];
  } else if (side) {
    const backFactor =
      layout.index === 39 ? 0.24 : gltf ? 0.18 : 0.28;
    const back = layout.width * backFactor;
    landmarkPos = [ox * back, 0, 0];
  } else {
    const back = layout.depth * (gltf ? 0.18 : 0.28);
    landmarkPos = [0, 0, oz * back];
  }

  const cornerSlot =
    layout.index === 0 ? cornerSize * 0.96 : cornerSize * 0.9;

  return {
    slotWidth: corner ? cornerSlot : trackWidth,
    slotDepth: corner ? cornerSlot : radialDepth,
    landmarkPos,
  };
}
