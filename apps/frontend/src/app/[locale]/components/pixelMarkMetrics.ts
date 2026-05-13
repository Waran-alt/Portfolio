/** Staggered chroma reveal timing on the face pixel grid. */
export const PIXEL_SQUARE_REVEAL_SPAN_MS = 300;
export const PIXEL_SQUARE_REVEAL_DURATION_MS = 75;

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
