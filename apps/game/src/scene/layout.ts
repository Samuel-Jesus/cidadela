export const BOARD_SIZE = 20;
export const TILE_THICKNESS = 0.35;
export const BOARD_Y = 0.4;

export type SpaceLayout = {
  index: number;
  x: number;
  z: number;
  width: number;
  depth: number;
  yaw: number;
};

export function computeSpaceLayouts(boardSize = BOARD_SIZE): SpaceLayout[] {
  const half = boardSize / 2;
  const corner = boardSize * 0.14;
  const sideSpan = boardSize - 2 * corner;
  const step = sideSpan / 9;
  const layouts: SpaceLayout[] = [];

  const push = (
    index: number,
    xMin: number,
    zMin: number,
    width: number,
    depth: number,
    yaw: number,
  ) => {
    layouts.push({
      index,
      x: xMin + width / 2,
      z: zMin + depth / 2,
      width,
      depth,
      yaw,
    });
  };

  push(0, half - corner, half - corner, corner, corner, Math.PI);

  for (let i = 1; i <= 9; i++) {
    push(i, half - corner - i * step, half - corner, step, corner, Math.PI);
  }

  push(10, -half, half - corner, corner, corner, Math.PI / 2);

  for (let i = 1; i <= 9; i++) {
    push(10 + i, -half, half - corner - i * step, corner, step, Math.PI / 2);
  }

  push(20, -half, -half, corner, corner, 0);

  for (let i = 1; i <= 9; i++) {
    push(20 + i, -half + corner + (i - 1) * step, -half, step, corner, 0);
  }

  push(30, half - corner, -half, corner, corner, -Math.PI / 2);

  for (let i = 1; i <= 9; i++) {
    push(30 + i, half - corner, -half + corner + (i - 1) * step, corner, step, -Math.PI / 2);
  }

  return layouts;
}
