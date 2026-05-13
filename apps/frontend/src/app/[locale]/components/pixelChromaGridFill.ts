import {
  tiltEllipticalFoilRgba,
  type PixelChromaTiltEllipseConfig,
} from './pixelChromaTiltEllipse';

/**
 * One influence disk in **grid cell** space (same indices as the title-face CSS grid and chroma
 * canvas: `col` → right, `row` → down, origin top-left of the face padding box). Each reference
 * carries a full `PixelChromaTiltEllipseConfig` (`ellipse`). At each cell, every ref within
 * `radius` contributes a radial `force`; all `ellipse` keys are weighted-averaged, then foil is
 * evaluated once on a force-weighted tilt sample.
 */
export type PixelChromaFoilGridRef = {
  col: number;
  row: number;
  radius: number;
  forceCenter: number;
  forceEdge: number;
  /** Full per-ref foil preset; keys are merged by weight with other refs covering the cell. */
  ellipse: PixelChromaTiltEllipseConfig;
};

export type FillPixelChromaFoilGridOptions = {
  /**
   * Per ref, effective tilt X offset is `(col - ref.col) * tiltCouplingPerCol` before averaging
   * across contributing refs for the final sample.
   */
  tiltCouplingPerCol?: number;
  /**
   * Per ref, effective tilt Y offset is `(row - ref.row) * tiltCouplingPerRow` before averaging.
   */
  tiltCouplingPerRow?: number;
};

const DEFAULT_FILL_OPTIONS: Required<FillPixelChromaFoilGridOptions> = {
  tiltCouplingPerCol: 0.18,
  tiltCouplingPerRow: 0.14,
};

export type PixelChromaFoilGridCell = readonly [number, number, number, number] | null;

function clamp255(n: number): number {
  return Math.min(255, Math.max(0, Math.round(n)));
}

function refForceAtCell(ref: PixelChromaFoilGridRef, col: number, row: number): number {
  const dx = col - ref.col;
  const dy = row - ref.row;
  const dist = Math.hypot(dx, dy);
  if (dist > ref.radius) return 0;
  const tEdge = ref.radius > 0 ? dist / ref.radius : 0;
  return ref.forceCenter + (ref.forceEdge - ref.forceCenter) * tEdge;
}

/**
 * Weighted average of every scalar / RGBA channel in `PixelChromaTiltEllipseConfig`.
 * Alpha channels (`edgeRgba[3]`, `centerRgba[3]`) use the same force weights as RGB; foil then
 * lerps those blended alphas with `rampExponent`. `useSmoothRamp` uses force weights (true = 1).
 */
function blendWeightedTiltEllipseConfigs(
  parts: readonly { cfg: PixelChromaTiltEllipseConfig; w: number }[]
): PixelChromaTiltEllipseConfig | null {
  let totalWeight = 0;
  let centerTiltX = 0;
  let centerTiltY = 0;
  let semiAxisTiltX = 0;
  let semiAxisTiltY = 0;
  let boundaryEps = 0;
  let rampExponent = 0;
  let smoothRampScore = 0;
  let edgeR = 0;
  let edgeG = 0;
  let edgeB = 0;
  let edgeA = 0;
  let centerR = 0;
  let centerG = 0;
  let centerB = 0;
  let centerA = 0;

  for (const { cfg, w } of parts) {
    if (!(w > 0)) continue;
    totalWeight += w;
    centerTiltX += cfg.centerTiltX * w;
    centerTiltY += cfg.centerTiltY * w;
    semiAxisTiltX += cfg.semiAxisTiltX * w;
    semiAxisTiltY += cfg.semiAxisTiltY * w;
    boundaryEps += cfg.boundaryEps * w;
    rampExponent += cfg.rampExponent * w;
    smoothRampScore += (cfg.useSmoothRamp ? 1 : 0) * w;
    const er = cfg.edgeRgba;
    const cr = cfg.centerRgba;
    edgeR += er[0] * w;
    edgeG += er[1] * w;
    edgeB += er[2] * w;
    edgeA += er[3] * w;
    centerR += cr[0] * w;
    centerG += cr[1] * w;
    centerB += cr[2] * w;
    centerA += cr[3] * w;
  }

  if (!(totalWeight > 0)) return null;

  const inv = 1 / totalWeight;
  return {
    centerTiltX: centerTiltX * inv,
    centerTiltY: centerTiltY * inv,
    semiAxisTiltX: Math.max(1e-6, semiAxisTiltX * inv),
    semiAxisTiltY: Math.max(1e-6, semiAxisTiltY * inv),
    boundaryEps: boundaryEps * inv,
    edgeRgba: [clamp255(edgeR * inv), clamp255(edgeG * inv), clamp255(edgeB * inv), clamp255(edgeA * inv)],
    centerRgba: [
      clamp255(centerR * inv),
      clamp255(centerG * inv),
      clamp255(centerB * inv),
      clamp255(centerA * inv),
    ],
    useSmoothRamp: smoothRampScore * inv >= 0.5,
    rampExponent: Math.max(1e-6, rampExponent * inv),
  };
}

/**
 * Same radial disks as `fillPixelChromaFoilGrid`, but **tilt-agnostic**: per cell, max radial
 * `force` normalized to `[0, 1]`. Use for effects (e.g. depth) that should track **where** the
 * chroma field exists, not only cells that currently pass `tiltEllipticalFoilRgba` (often `null`
 * at neutral tilt).
 */
export function fillPixelChromaDiskAmbient01(
  refs: readonly PixelChromaFoilGridRef[],
  cols: number,
  rows: number
): number[][] {
  let fMax = 1e-6;
  for (const ref of refs) {
    fMax = Math.max(fMax, ref.forceCenter, ref.forceEdge);
  }
  const inv = 1 / fMax;
  const out: number[][] = [];
  for (let row = 0; row < rows; row++) {
    const line: number[] = [];
    for (let col = 0; col < cols; col++) {
      let mx = 0;
      for (const ref of refs) {
        const force = refForceAtCell(ref, col, row);
        if (force > mx) mx = force;
      }
      line.push(mx > 0 ? Math.min(1, mx * inv) : 0);
    }
    out.push(line);
  }
  return out;
}

/**
 * Builds `[row][col]` of foil RGBA (0–255) or `null` where no reference reaches the cell **or**
 * the blended ellipse yields no tint at the sampled tilt.
 *
 * Same structure as the reference `fillGrid`: for each cell, accumulate `value * force` for every
 * ref inside its disk, divide by `totalWeight`, then evaluate foil once on the blended
 * `PixelChromaTiltEllipseConfig` and force-weighted tilt sample.
 */
export function fillPixelChromaFoilGrid(
  refs: readonly PixelChromaFoilGridRef[],
  cols: number,
  rows: number,
  tiltX: number,
  tiltY: number,
  options?: FillPixelChromaFoilGridOptions
): PixelChromaFoilGridCell[][] {
  const grid: PixelChromaFoilGridCell[][] = [];

  for (let row = 0; row < rows; row++) {
    const line: PixelChromaFoilGridCell[] = [];
    for (let col = 0; col < cols; col++) {
      line.push(pickPixelChromaFoilRgbaForCell(refs, col, row, tiltX, tiltY, options));
    }
    grid.push(line);
  }

  return grid;
}

/** Force-weighted ellipse blend + single foil evaluation at the cell. */
export function pickPixelChromaFoilRgbaForCell(
  refs: readonly PixelChromaFoilGridRef[],
  col: number,
  row: number,
  tiltX: number,
  tiltY: number,
  options?: FillPixelChromaFoilGridOptions
): PixelChromaFoilGridCell {
  const cpc = options?.tiltCouplingPerCol ?? DEFAULT_FILL_OPTIONS.tiltCouplingPerCol;
  const cpr = options?.tiltCouplingPerRow ?? DEFAULT_FILL_OPTIONS.tiltCouplingPerRow;

  const parts: { cfg: PixelChromaTiltEllipseConfig; w: number }[] = [];
  let sampleTx = 0;
  let sampleTy = 0;
  let sampleWeight = 0;

  for (const ref of refs) {
    const force = refForceAtCell(ref, col, row);
    if (!(force > 0)) continue;

    parts.push({ cfg: ref.ellipse, w: force });
    const dx = col - ref.col;
    const dy = row - ref.row;
    sampleTx += (tiltX + dx * cpc) * force;
    sampleTy += (tiltY + dy * cpr) * force;
    sampleWeight += force;
  }

  const blended = blendWeightedTiltEllipseConfigs(parts);
  if (!blended || !(sampleWeight > 0)) return null;

  const inv = 1 / sampleWeight;
  return tiltEllipticalFoilRgba(sampleTx * inv, sampleTy * inv, blended);
}
