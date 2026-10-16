/** Layout do tabuleiro no plano XZ (Three.js: Y = cima). */

export const BOARD_SIZE = 20;
export const TILE_THICKNESS = 0.35;
export const BOARD_Y = 0.4;

export type SpaceLayout = {
  index: number;
  x: number;
  z: number;
  width: number;
  depth: number;
  /** Rotação Y do landmark para “olhar” para o centro. */
  yaw: number;
};

/**
 * Casa 0 = canto +X/+Z (Chegada).
 * Sentido horário visto de cima: -X no lado +Z, depois -Z no lado -X, etc.
 */
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

  // 0 — canto +X +Z
  push(0, half - corner, half - corner, corner, corner, Math.PI);

  // 1–9 — lado +Z, de +X para -X
  for (let i = 1; i <= 9; i++) {
    push(i, half - corner - i * step, half - corner, step, corner, Math.PI);
  }

  // 10 — canto -X +Z
  push(10, -half, half - corner, corner, corner, -Math.PI / 2);

  // 11–19 — lado -X, de +Z para -Z
  for (let i = 1; i <= 9; i++) {
    push(10 + i, -half, half - corner - i * step, corner, step, -Math.PI / 2);
  }

  // 20 — canto -X -Z
  push(20, -half, -half, corner, corner, 0);

  // 21–29 — lado -Z, de -X para +X
  for (let i = 1; i <= 9; i++) {
    push(20 + i, -half + corner + (i - 1) * step, -half, step, corner, 0);
  }

  // 30 — canto +X -Z
  push(30, half - corner, -half, corner, corner, Math.PI / 2);

  // 31–39 — lado +X, de -Z para +Z
  for (let i = 1; i <= 9; i++) {
    push(30 + i, half - corner, -half + corner + (i - 1) * step, corner, step, Math.PI / 2);
  }

  return layouts;
}
