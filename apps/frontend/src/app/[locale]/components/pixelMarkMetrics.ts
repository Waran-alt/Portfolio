/** Staggered chroma reveal timing on the face pixel grid. */
export const PIXEL_SQUARE_REVEAL_SPAN_MS = 300;
export const PIXEL_SQUARE_REVEAL_DURATION_MS = 75;

/** Face-grid anchor for the “-pixel” mark (internal word indices add to this origin). */
export const PIXEL_MARK_GRID_ORIGIN = { col: 16, row: 15 } as const;

/** Face-grid cells for “-pixel” chroma (absolute `col`, `row`). */
export const PIXEL_WORD_FACE_CELLS: readonly [number, number][] = [
  [16, 17],
  [17, 17],
  [18, 17],
  [21, 15],
  [22, 15],
  [23, 15],
  [21, 16],
  [24, 16],
  [21, 17],
  [22, 17],
  [23, 17],
  [21, 18],
  [21, 19],
  [27, 15],
  [27, 16],
  [27, 17],
  [27, 18],
  [27, 19],
  [30, 15],
  [34, 15],
  [31, 16],
  [33, 16],
  [32, 17],
  [31, 18],
  [33, 18],
  [30, 19],
  [34, 19],
  [37, 15],
  [38, 15],
  [39, 15],
  [37, 16],
  [37, 17],
  [38, 17],
  [39, 17],
  [37, 18],
  [37, 19],
  [38, 19],
  [39, 19],
  [42, 15],
  [42, 16],
  [42, 17],
  [42, 18],
  [42, 19],
  [43, 19],
  [44, 19],
] as const;

export const PIXEL_WORD_FACE_CELL_KEYS: ReadonlySet<string> = new Set(
  PIXEL_WORD_FACE_CELLS.map(([col, row]) => `${col},${row}`)
);

export function isPixelWordFaceCell(col: number, row: number): boolean {
  return PIXEL_WORD_FACE_CELL_KEYS.has(`${col},${row}`);
}

/**
 * Deterministic pseudo-random delay in `[0, spanMs)` from integer grid indices (stable across frames).
 */
export function pixelSquareRevealDelayMs(ix: number, iy: number, spanMs: number): number {
  const u = Math.sin(ix * 12.9898 + iy * 78.233 + 2.9143) * 43758.5453;
  const t = u - Math.floor(u);
  return t * spanMs;
}

/** Opacity factor in `[0, 1]` for a square given elapsed ms since wave start. */
export function pixelSquareRevealOpacity(
  ix: number,
  iy: number,
  elapsedMs: number,
  spanMs: number,
  durationMs: number
): number {
  if (!(durationMs > 0)) return elapsedMs >= pixelSquareRevealDelayMs(ix, iy, spanMs) ? 1 : 0;
  const start = pixelSquareRevealDelayMs(ix, iy, spanMs);
  const u = (elapsedMs - start) / durationMs;
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  return u * u * (3 - 2 * u);
}
