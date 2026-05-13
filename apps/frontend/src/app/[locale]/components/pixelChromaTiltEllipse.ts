/**
 * Tilt-space elliptical foil tint (`PIXEL_CHROMA_TILT_ELLIPSE` in `BusinessCardHero`).
 * Used by `fillPixelChromaFoilGrid` (after force-weighted ellipse merge per cell) and any other code that
 * needs the same math.
 */

/**
 * Ellipse + color ramp in **tilt degrees** (same space as `--tilt-x` / `--tilt-y` on the
 * card). The foil appears only while the current tilt lies inside the ellipse; the inward
 * blend is controlled by the ramp flags and `rampExponent`.
 */
export type PixelChromaTiltEllipseConfig = {
  /**
   * Ellipse center on the **tilt-X** axis. **Raising** shifts the sweet spot toward positive
   * `rotateY` (tilt right in typical setups); **lowering** shifts it the other way. Keep at
   * `0` if the strongest tint should occur at neutral horizontal tilt.
   */
  centerTiltX: number;
  /**
   * Ellipse center on the **tilt-Y** axis. **Raising** shifts the sweet spot toward positive
   * `rotateX` (tilt "top" of card toward the viewer); **lowering** shifts the opposite.
   */
  centerTiltY: number;
  /**
   * Half-width of the ellipse along tilt-X (`--tilt-x`). **Larger** values make the effect
   * stay on across a wider horizontal tilt range (easier to keep the cell tinted); **smaller**
   * values shrink the region where any foil appears (needs a precise tilt to see it).
   */
  semiAxisTiltX: number;
  /**
   * Half-height along tilt-Y (`--tilt-y`). Same trade-off as `semiAxisTiltX`, but for
   * vertical tilt. **Unequal** X/Y produces a tilt-space ellipse stretched on the looser axis.
   */
  semiAxisTiltY: number;
  /**
   * Outside test: treat as outside when `q > 1 + boundaryEps`. **Slightly larger** positive
   * values forgive float noise at the rim (less edge flicker, tiny risk of drawing when
   * barely outside). **Too large** visibly enlarges the active region past the true ellipse.
   * **Smaller / zero** is stricter but can shimmer when `q` hovers near `1`.
   */
  boundaryEps: number;
  /**
   * Color at the ellipse rim (`q = 1`), RGBA 0–255. **RGB** sets the hue you see first when
   * entering the ellipse; **alpha** sets how visible that rim is (`0` = invisible edge,
   * higher = a colored ring even before reaching center).
   */
  edgeRgba: readonly [number, number, number, number];
  /**
   * Color at the ellipse center (`q = 0`). **RGB** is the peak tint hue; **alpha** caps how
   * strong the overlay can get at max inward blend. **Raising** alpha increases maximum
   * opacity; **lowering** makes the whole effect subtler even at center.
   */
  centerRgba: readonly [number, number, number, number];
  /**
   * **When `true`:** the inward factor uses a quintic smootherstep (gentle start/end in
   * `s`). **When `false`:** mapping from `q` to blend is piecewise linear in the raw inward
   * factor (sharper, more "mechanical" transition). Toggle to compare feel without changing
   * ellipse geometry; combine with `rampExponent` for final opacity curve.
   */
  useSmoothRamp: boolean;
  /**
   * After computing inward `s` (0 at boundary, 1 at center), blend uses `t = s ** rampExponent`.
   * **Below `1`:** opacity and RGB approach `centerRgba` **sooner** as you tilt inward (strong
   * tint closer to the rim). **`1`:** no extra curve (linear in `s` after smooth/linear step).
   * **Above `1`:** tint builds **slowly** until you are near the center. Very small positives
   * approach a step-like jump near the boundary; extremely large values flatten the effect
   * until the last part of the inward motion.
   */
  rampExponent: number;
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpRgba(
  c0: readonly [number, number, number, number],
  c1: readonly [number, number, number, number],
  t: number
): [number, number, number, number] {
  const k = Math.min(1, Math.max(0, t));
  return [
    Math.round(lerp(c0[0], c1[0], k)),
    Math.round(lerp(c0[1], c1[1], k)),
    Math.round(lerp(c0[2], c1[2], k)),
    Math.round(lerp(c0[3], c1[3], k)),
  ];
}

/** Perceptually softer ramp from boundary (0) toward center (1). */
function smootherstep01(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
}

/**
 * `q = ((tx-cx)/ax)² + ((ty-cy)/ay)²`. Outside ellipse → `null`. Inside → inward factor `s`
 * (0 on boundary, 1 at center), optional smootherstep, then `t = s ** rampExponent`, then
 * lerp `edgeRgba` → `centerRgba`.
 */
export function tiltEllipticalFoilRgba(
  tiltX: number,
  tiltY: number,
  cfg: PixelChromaTiltEllipseConfig
): [number, number, number, number] | null {
  const dx = tiltX - cfg.centerTiltX;
  const dy = tiltY - cfg.centerTiltY;
  const ax = Math.max(1e-6, cfg.semiAxisTiltX);
  const ay = Math.max(1e-6, cfg.semiAxisTiltY);
  // Squared normalized distance: 1 on rim, 0 at center, >1 outside.
  const q = (dx / ax) ** 2 + (dy / ay) ** 2;
  if (q > 1 + cfg.boundaryEps) return null;
  // Raw inward blend: 0 on boundary, 1 at center.
  const rawS = 1 - Math.min(1, q);
  const s = cfg.useSmoothRamp ? smootherstep01(rawS) : rawS;
  // Exponent < 1 lifts edge→center lerp faster (opacity peaks sooner).
  const exp = Math.max(1e-6, cfg.rampExponent);
  const t = Math.min(1, Math.max(0, s ** exp));
  return lerpRgba(cfg.edgeRgba, cfg.centerRgba, t);
}
