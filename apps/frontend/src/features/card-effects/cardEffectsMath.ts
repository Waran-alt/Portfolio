export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** True when the point lies inside the rectangle (inclusive edges). */
export function isPointInRect(px: number, py: number, rect: DOMRect): boolean {
  return px >= rect.left && px <= rect.right && py >= rect.top && py <= rect.bottom;
}

/** Distance from point to axis-aligned rectangle (0 if inside). */
export function distancePointToRect(px: number, py: number, rect: DOMRect): number {
  const nx = clamp(px, rect.left, rect.right);
  const ny = clamp(py, rect.top, rect.bottom);
  return Math.hypot(px - nx, py - ny);
}

/**
 * Shortest signed angle from `from` to `to` in degrees (range (−180, 180]).
 */
export function shortestDeltaDeg(from: number, to: number): number {
  let delta = to - from;
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;
  return delta;
}
