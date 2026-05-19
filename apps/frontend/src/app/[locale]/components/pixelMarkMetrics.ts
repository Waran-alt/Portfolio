/** Staggered chroma reveal timing on the face pixel grid. */
export const PIXEL_SQUARE_REVEAL_SPAN_MS = 300;
export const PIXEL_SQUARE_REVEAL_DURATION_MS = 75;

/** Face-grid anchor for the “-pixel” mark (internal word indices add to this origin). */
export const PIXEL_MARK_GRID_ORIGIN = { col: 16, row: 15 } as const;

/** Face-grid cells for “-pixel” chroma (absolute `col`, `row`). */
export const PIXEL_WORD_FACE_CELLS: readonly [number, number][] = [
  [14, 15],
  [15, 15],
  [16, 15],
  [19, 13],
  [20, 13],
  [21, 13],
  [19, 14],
  [22, 14],
  [19, 15],
  [20, 15],
  [21, 15],
  [19, 16],
  [19, 17],
  [25, 13],
  [25, 14],
  [25, 15],
  [25, 16],
  [25, 17],
  [28, 13],
  [32, 13],
  [29, 14],
  [31, 14],
  [30, 15],
  [29, 16],
  [31, 16],
  [28, 17],
  [32, 17],
  [35, 13],
  [36, 13],
  [37, 13],
  [35, 14],
  [35, 15],
  [36, 15],
  [37, 15],
  [35, 16],
  [35, 17],
  [36, 17],
  [37, 17],
  [40, 13],
  [40, 14],
  [40, 15],
  [40, 16],
  [40, 17],
  [41, 17],
  [42, 17],
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
