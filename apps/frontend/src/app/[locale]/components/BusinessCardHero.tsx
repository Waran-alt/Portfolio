'use client';

/**
 * BusinessCardHero — interactive 3D business card (tilt + holo foil + flip).
 *
 * ## Layout (DOM)
 * - `<main className={css.heroRoot} data-portfolio-home>`: `data-portfolio-home` lets `global.css`
 *   use `body:has(...)` so the viewport flex shell applies on **first paint** (no `useEffect` delay).
 * - `tiltArea`: perspective + CSS variables for foil (`--foil-rotate-front/back`, origins).
 * - `tiltLayer`: receives `rotateX/rotateY` from JS (pointer parallax).
 * - `flipInner`: one panel; we swap its contents at flip midpoint (MemoOn landing pattern).
 *   **Face 0 (title):** pixel grid + `fillPixelChromaFoilGrid`: each ref carries a full
 *   `PixelChromaTiltEllipseConfig` (`ellipse`); per cell those keys are weighted then the foil
 *   runs once. Baseline preset: `PIXEL_CHROMA_TILT_ELLIPSE` + `withChromaEllipse` for refs.
 *   **Face 1 (about):** one ambient + one masked back holo. **Face 2 (contact):** same front holo stack as earlier title variant.
 *   Same CSS variables on `tiltArea`; back / contact faces use `.foilPaused` when inactive.
 * - **Corner flip chip** (front only): layered depth + pointer parallax like the title marks — see
 *   `features/card-effects/README.md` § “Corner flip chip”.
 * - Clicking runs a **two-step** `rotate3d` flip: rotate to 90°, swap content, rotate back to 0°.
 *
 * Pointer-driven tilt, foil angle, and halo mask: `useCardTiltAndFoil` in `features/card-effects`
 * (single RAF lerp; only the visible face updates `--foil-rotate-*`; hidden faces use `.foilPaused`).
 * Pointer tilt unlocks only after `.cardShell` entrance **and** title-face chroma stagger
 * (`pixelStaggerComplete`), unless reduced motion or a non-title face (no stagger).
 * Tilt tracks the cursor on the page (`pointerTiltTracksDocument`) except the card shell, title marks, and
 * corner chip while the pointer is over the card (`cardTiltFrozenOverCardBounds`); foil, halo, and chroma
 * still follow the pointer everywhere.
 * On touch devices, `touchSwipeTiltEnabled` maps screen swipes to the same tilt and resets when the finger lifts.
 *
 * ## Performance tactics
 * - No idle RAF: schedule frames only while something is easing.
 * - Snap near-target values to avoid infinite micro-lerp.
 * - Skip `transform` / `--foil-rotate-*` writes when change is below `*_DOM_EPS`.
 * - `will-change: transform` only while animating (`.tiltLayerHot`).
 * - Passive pointer listeners; `content-visibility` on paused foil layers (CSS).
 *
 * When `prefers-reduced-motion: reduce`, the pointer-driven effect is disabled entirely (see effect guard).
 */

import { useLocale } from 'i18n';
import { Comic_Neue, DM_Sans, Silkscreen, Unica_One } from 'next/font/google';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
/** Imported CSS module object; cast below so class names are checked against a fixed key union. */
import { ContactQrCode } from '@/app/[locale]/components/ContactQrCode';
import { useCardTiltAndFoil } from '@/features/card-effects';
import rawFx from '@/features/card-effects/cardEffects.module.css';
import rawStyles from './BusinessCardHero.module.css';
import { FOCUS_MARK_VIEWBOX, FocusMarkVisiblePaths } from './focusMarkSvg';
import {
    fillPixelChromaFoilGrid,
    type PixelChromaFoilGridRef,
} from './pixelChromaGridFill';
import type { PixelChromaTiltEllipseConfig } from './pixelChromaTiltEllipse';
import {
    PIXEL_SQUARE_REVEAL_DURATION_MS,
    PIXEL_SQUARE_REVEAL_SPAN_MS,
    PIXEL_WORD_FACE_CELL_KEYS,
    pixelSquareRevealOpacity,
} from './pixelMarkMetrics';
import { FocusMarkLayered, ProjectMarkLayered } from './TitleMarks';

export type { PixelChromaTiltEllipseConfig } from './pixelChromaTiltEllipse';

/**
 * Default **tilt-space ellipse** preset (degrees + colors). Each grid ref embeds its own copy
 * (often via `withChromaEllipse`); at each cell all contributing refs’ `ellipse` keys are
 * weighted together before evaluating foil once.
 */
export const PIXEL_CHROMA_TILT_ELLIPSE: PixelChromaTiltEllipseConfig = {
  /** Strongest tint when horizontal tilt is neutral; raise/lower to require tilting left/right to peak. */
  centerTiltX: 0,
  /** Strongest tint when vertical tilt is neutral; raise/lower to require tilting up/down to peak. */
  centerTiltY: 0,
  /** Larger → foil stays visible across a wider horizontal tilt range; smaller → tighter horizontal "sweet spot". */
  semiAxisTiltX: 14,
  /** Same as `semiAxisTiltX` but for vertical tilt; unequal X/Y stretches the active region into an ellipse. */
  semiAxisTiltY: 11,
  /** Larger → more forgiving at the tilt rim (less flicker), risk of tint slightly outside true ellipse; smaller → stricter edge, possible shimmer. */
  boundaryEps: 0.004,
  /** RGB at ellipse rim in tilt space; alpha 0 = invisible edge; higher alpha = visible colored ring before center. */
  edgeRgba: [220, 60, 60, 0],
  /** RGB + max alpha at ellipse center; higher alpha = stronger overlay cap; RGB sets the peak tint hue. */
  centerRgba: [48, 105, 210, Math.round(0.4 * 255)],
  /** `true` = softer quintic ramp in the inward factor; `false` = linear (sharper, more mechanical feel). */
  useSmoothRamp: true,
  /** Below 1 → reach center color/opacity sooner as you tilt inward; 1 = linear after smooth step; above 1 → tint builds mostly near center. */
  rampExponent: 0.12,
};

/** Dedicated foil preset for “-pixel” face-grid cells (not blended with `PIXEL_CHROMA_GRID_REFS`). */
export const PIXEL_WORD_CHROMA_TILT_ELLIPSE: PixelChromaTiltEllipseConfig = {
  centerTiltX: 0,
  centerTiltY: 0,
  semiAxisTiltX: 30,
  semiAxisTiltY: 25,
  boundaryEps: 0.004,
  edgeRgba: [200, 120, 40, Math.round(0.7 * 255)],
  centerRgba: [15, 23, 42, Math.round(1 * 255)],
  useSmoothRamp: true,
  rampExponent: 1.75,
};

/** Shallow merge over `PIXEL_CHROMA_TILT_ELLIPSE` for per-ref `ellipse` payloads. */
function withChromaEllipse(over: Partial<PixelChromaTiltEllipseConfig>): PixelChromaTiltEllipseConfig {
  const b = PIXEL_CHROMA_TILT_ELLIPSE;
  return {
    ...b,
    ...over,
    edgeRgba: over.edgeRgba ?? b.edgeRgba,
    centerRgba: over.centerRgba ?? b.centerRgba,
  };
}

/**
 * Influence disks in grid **cell indices** (0-based, aligned with `--pixel-grid-cell` on the face).
 * `forceCenter` / `forceEdge` / `radius` weight each ref’s `ellipse` fields into the blended preset
 * at each cell (see `fillPixelChromaFoilGrid`).
 */
const PIXEL_CHROMA_GRID_REFS: PixelChromaFoilGridRef[] = [
  {
    col: 5,
    row: 5,
    radius: 35,
    forceCenter: 20,
    forceEdge: 0,
    ellipse: withChromaEllipse({
      centerTiltX: -5,
      centerTiltY: -25,
      semiAxisTiltX: 11,
      semiAxisTiltY: 14,
      boundaryEps: 0.004,
      edgeRgba: [200, 120, 40, 40],
      centerRgba: [120, 90, 160, Math.round(0.45 * 255)],
      rampExponent: 0.75,
    }),
  },
  {
    col: 5,
    row: 15,
    radius: 10,
    forceCenter: 15,
    forceEdge: 0,
    ellipse: withChromaEllipse({
      centerTiltX: 85,
      centerTiltY: -85,
      semiAxisTiltX: 20,
      semiAxisTiltY: 29,
      boundaryEps: 0.004,
      edgeRgba: [200, 120, 40, 40],
      centerRgba: [120, 90, 160, Math.round(0.45 * 255)],
      rampExponent: 0.75,
    }),
  },
  {
    col: 10,
    row: 30,
    radius: 35,
    forceCenter: 20,
    forceEdge: 0,
    ellipse: withChromaEllipse({
      centerTiltX: -25,
      centerTiltY: 25,
      semiAxisTiltX: 11,
      semiAxisTiltY: 14,
      boundaryEps: 0.004,
      edgeRgba: [200, 120, 40, 40],
      centerRgba: [120, 90, 160, Math.round(0.45 * 255)],
      rampExponent: 0.75,
    }),
  },
  {
    col: 25,
    row: 5,
    radius: 35,
    forceCenter: 20,
    forceEdge: 0,
    ellipse: withChromaEllipse({
      centerTiltX: -15,
      centerTiltY: -15,
      semiAxisTiltX: 11,
      semiAxisTiltY: 14,
      boundaryEps: 0.004,
      edgeRgba: [200, 120, 40, 40],
      centerRgba: [120, 90, 160, Math.round(0.45 * 255)],
      rampExponent: 0.75,
    }),
  },
  {
    col: 15,
    row: 15,
    radius: 35,
    forceCenter: 20,
    forceEdge: 0,
    ellipse: withChromaEllipse({
      centerTiltX: -15,
      centerTiltY: -15,
      semiAxisTiltX: 11,
      semiAxisTiltY: 14,
      boundaryEps: 0.004,
      edgeRgba: [200, 120, 40, 40],
      centerRgba: [120, 90, 160, Math.round(0.45 * 255)],
      rampExponent: 0.75,
    }),
  },
  {
    col: 5,
    row: 25,
    radius: 35,
    forceCenter: 20,
    forceEdge: 0,
    ellipse: withChromaEllipse({
      centerTiltX: -25,
      centerTiltY: -25,
      semiAxisTiltX: 11,
      semiAxisTiltY: 14,
      boundaryEps: 0.004,
      edgeRgba: [200, 120, 40, 40],
      centerRgba: [120, 90, 160, Math.round(0.45 * 255)],
      rampExponent: 0.75,
    }),
  },
  {
    col: 40,
    row: 5,
    radius: 35,
    forceCenter: 20,
    forceEdge: 0,
    ellipse: withChromaEllipse({
      centerTiltX: 0,
      centerTiltY: 0,
      semiAxisTiltX: 11,
      semiAxisTiltY: 14,
      boundaryEps: 0.004,
      edgeRgba: [200, 120, 40, 40],
      centerRgba: [120, 90, 160, Math.round(0.45 * 255)],
      rampExponent: 0.75,
    }),
  },
  {
    col: 25,
    row: 15,
    radius: 35,
    forceCenter: 20,
    forceEdge: 0,
    ellipse: withChromaEllipse({
      centerTiltX: 0,
      centerTiltY: 0,
      semiAxisTiltX: 11,
      semiAxisTiltY: 14,
      boundaryEps: 0.004,
      edgeRgba: [200, 120, 40, 40],
      centerRgba: [120, 90, 160, Math.round(0.45 * 255)],
      rampExponent: 0.75,
    }),
  },
  {
    col: 10,
    row: 25,
    radius: 35,
    forceCenter: 20,
    forceEdge: 0,
    ellipse: withChromaEllipse({
      centerTiltX: 0,
      centerTiltY: 0,
      semiAxisTiltX: 11,
      semiAxisTiltY: 14,
      boundaryEps: 0.004,
      edgeRgba: [200, 120, 40, 40],
      centerRgba: [120, 90, 160, Math.round(0.45 * 255)],
      rampExponent: 0.75,
    }),
  },
  {
    col: 50,
    row: 5,
    radius: 35,
    forceCenter: 20,
    forceEdge: 0,
    ellipse: withChromaEllipse({
      centerTiltX: 15,
      centerTiltY: 15,
      semiAxisTiltX: 11,
      semiAxisTiltY: 14,
      boundaryEps: 0.004,
      edgeRgba: [200, 120, 40, 40],
      centerRgba: [120, 90, 160, Math.round(0.45 * 255)],
      rampExponent: 0.75,
    }),
  },
  {
    col: 35,
    row: 15,
    radius: 35,
    forceCenter: 20,
    forceEdge: 0,
    ellipse: withChromaEllipse({
      centerTiltX: 15,
      centerTiltY: 15,
      semiAxisTiltX: 11,
      semiAxisTiltY: 14,
      boundaryEps: 0.004,
      edgeRgba: [200, 120, 40, 40],
      centerRgba: [120, 90, 160, Math.round(0.45 * 255)],
      rampExponent: 0.75,
    }),
  },
  {
    col: 20,
    row: 25,
    radius: 35,
    forceCenter: 40,
    forceEdge: 0,
    ellipse: withChromaEllipse({
      centerTiltX: 15,
      centerTiltY: 15,
      semiAxisTiltX: 11,
      semiAxisTiltY: 14,
      boundaryEps: 0.004,
      edgeRgba: [200, 120, 40, 40],
      centerRgba: [120, 90, 160, Math.round(0.45 * 255)],
      rampExponent: 0.75,
    }),
  },
  {
    col: 42,
    row: 25,
    radius: 40,
    forceCenter: 5,
    forceEdge: 0,
    ellipse: withChromaEllipse({
      centerTiltX: 85,
      centerTiltY: 65,
      semiAxisTiltX: 11,
      semiAxisTiltY: 14,
      boundaryEps: 0.004,
      edgeRgba: [200, 120, 40, 40],
      centerRgba: [120, 90, 160, Math.round(0.45 * 255)],
      rampExponent: 0.75,
    }),
  },
  {
    col: 45,
    row: 10,
    radius: 15,
    forceCenter: 20,
    forceEdge: 0,
    ellipse: withChromaEllipse({
      centerTiltX: -15,
      centerTiltY: 15,
      semiAxisTiltX: 11,
      semiAxisTiltY: 14,
      boundaryEps: 0.004,
      edgeRgba: [200, 120, 40, 40],
      centerRgba: [120, 90, 160, Math.round(0.45 * 255)],
      rampExponent: 0.75,
    }),
  },
];

/**
 * Square period for the title-face CSS grid (`--pixel-grid-cell` on `.faceFront` / `.pixelGridBg`).
 * Formula: `22cqh * (PIXEL_MARK_TILE / PIXEL_MARK_HEIGHT)` with `cqh` = 1% of the face query container.
 */
const PIXEL_GRID_CELL_CQH = 22;
const PIXEL_GRID_CELL_TILE_UNITS = 12.5;
const PIXEL_GRID_CELL_MARK_HEIGHT_UNITS = 62.5;

/**
 * Resolved square `--pixel-grid-cell` in CSS px (width === height). Prefer the resolved
 * `background-size` on `.pixelGridBg` (same value the browser tiles with); then a px custom
 * property; then a hidden 1×1 tile probe; finally mirror the CSS `22cqh` formula from the face
 * content height (cqh excludes vertical padding on the size container).
 */
function readPixelGridCellPx(faceEl: HTMLElement, gridEl: HTMLElement | null): number | null {
  const host = gridEl ?? faceEl;

  if (gridEl) {
    const bgSize = getComputedStyle(gridEl).backgroundSize;
    const firstLayer = bgSize.split(',')[0]?.trim() ?? '';
    const bgMatch = /^([\d.]+)px(?:\s+([\d.]+)px)?$/i.exec(firstLayer);
    if (bgMatch?.[1]) {
      const w = parseFloat(bgMatch[1]);
      const h = bgMatch[2] ? parseFloat(bgMatch[2]) : w;
      if (Number.isFinite(w) && Number.isFinite(h) && w >= 0.75 && h >= 0.75) {
        return Math.abs(w - h) <= 0.05 ? w : Math.min(w, h);
      }
    }
  }

  const sources = [host, faceEl];
  for (const el of sources) {
    const raw = getComputedStyle(el).getPropertyValue('--pixel-grid-cell').trim();
    if (!raw) continue;
    const pxMatch = /^([\d.]+)px$/i.exec(raw);
    if (pxMatch?.[1]) {
      const value = parseFloat(pxMatch[1]);
      if (Number.isFinite(value) && value >= 0.75) return value;
    }
  }

  if (typeof document !== 'undefined') {
    const probe = document.createElement('div');
    probe.style.cssText =
      'position:absolute;visibility:hidden;pointer-events:none;top:0;left:0;width:var(--pixel-grid-cell);height:var(--pixel-grid-cell);';
    host.appendChild(probe);
    const rect = probe.getBoundingClientRect();
    host.removeChild(probe);
    const w = rect.width;
    const h = rect.height;
    if (w >= 0.75 && h >= 0.75) {
      return Math.abs(w - h) <= 0.05 ? w : Math.min(w, h);
    }
  }

  const faceStyle = getComputedStyle(faceEl);
  const paddingBlock =
    (parseFloat(faceStyle.paddingTop) || 0) + (parseFloat(faceStyle.paddingBottom) || 0);
  const contentHeight = faceEl.clientHeight - paddingBlock;
  if (contentHeight >= 2) {
    const estimated =
      contentHeight *
      (PIXEL_GRID_CELL_CQH / 100) *
      (PIXEL_GRID_CELL_TILE_UNITS / PIXEL_GRID_CELL_MARK_HEIGHT_UNITS);
    if (Number.isFinite(estimated) && estimated >= 0.75) return estimated;
  }

  return null;
}

type PixelChromaRevealDraw = {
  startMs: number;
  nowMs: number;
  spanMs: number;
  durationMs: number;
};

function chromaInkForGridCell(
  rgba: readonly [number, number, number, number],
  m: number
): string {
  const [r, g, b, a] = rgba;
  /** Darken RGB before multiply; `a` is 0–255 from foil, `m` is reveal 0–1. */
  const mix = 0.24;
  const ir = Math.round(r * (1 - mix) + 12 * mix);
  const ig = Math.round(g * (1 - mix) + 20 * mix);
  const ib = Math.round(b * (1 - mix) + 38 * mix);
  return `rgba(${ir},${ig},${ib},${(a * m) / 255})`;
}

/**
 * Paints chroma on the title-face canvas. Logical grid `(col, row)` matches `PIXEL_CHROMA_GRID_REFS`
 * and the CSS repeating grid: cell `(i, j)` is drawn at `(ox + i * cell, oy + j * cell)` with size
 * `cell` (full period; hairlines are painted by `.pixelGridBg` above).
 */
function drawPixelGridChromaCanvas(
  canvas: HTMLCanvasElement,
  faceEl: HTMLElement,
  gridEl: HTMLElement | null,
  tiltX: number,
  tiltY: number,
  reducedMotion: boolean,
  reveal: PixelChromaRevealDraw | null
): void {
  const w = faceEl.clientWidth;
  const h = faceEl.clientHeight;
  if (w < 2 || h < 2) {
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }

  canvas.width = Math.round(w);
  canvas.height = Math.round(h);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  const cell = readPixelGridCellPx(faceEl, gridEl);
  if (cell === null) {
    ctx.clearRect(0, 0, w, h);
    return;
  }

  /** Canvas and `.pixelGridBg` share the face padding box (`inset: 0`); keep cell origin local. */
  const ox = 0;
  const oy = 0;

  /** Cover the face; last row/col may be narrower than `cell` (same as CSS partial periods). */
  const cols = Math.ceil(w / cell);
  const rows = Math.ceil(h / cell);
  if (cols < 1 || rows < 1) {
    return;
  }

  if (reducedMotion) {
    ctx.clearRect(0, 0, w, h);
    return;
  }

  const grid = fillPixelChromaFoilGrid(PIXEL_CHROMA_GRID_REFS, cols, rows, tiltX, tiltY, {
    wordFaceCells: PIXEL_WORD_FACE_CELL_KEYS,
    wordEllipse: PIXEL_WORD_CHROMA_TILT_ELLIPSE,
  });

  ctx.clearRect(0, 0, w, h);

  const elapsedMs = reveal ? reveal.nowMs - reveal.startMs : 0;
  const revealDone =
    !reveal || elapsedMs >= reveal.spanMs + reveal.durationMs;

  for (let j = 0; j < rows; j++) {
    const rowLine = grid[j];
    if (!rowLine) continue;
    for (let i = 0; i < cols; i++) {
      const rgba = rowLine[i];
      if (!rgba || rgba[3] <= 0) continue;
      const xf = ox + i * cell;
      const yf = oy + j * cell;
      const rwf = Math.min(cell, w - xf);
      const rhf = Math.min(cell, h - yf);
      if (rwf <= 0 || rhf <= 0) continue;
      const m =
        !reveal || revealDone
          ? 1
          : pixelSquareRevealOpacity(
              i,
              j,
              elapsedMs,
              reveal.spanMs,
              reveal.durationMs
            );
      if (m <= 0) continue;
      ctx.fillStyle = chromaInkForGridCell(rgba, m);
      ctx.fillRect(xf, yf, rwf, rhf);
    }
  }
}


const unicaOne = Unica_One({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-unica-one',
  fallback: ['system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
});
/** Readable sans for contact face (name, links, role); Unica One stays on title marks only. */
const contactSans = DM_Sans({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-contact-sans',
});
const silkscreen = Silkscreen({ weight: '400', subsets: ['latin'], display: 'swap' });
const comicNeue = Comic_Neue({ weight: '700', subsets: ['latin'], display: 'swap' });

/** CSS module typings use an index signature; keep class names type-safe locally. */
const css = rawStyles as Record<
  | 'heroRoot'
  | 'heroCursorBright'
  | 'heroCursorDark'
  | 'perspective'
  | 'tiltLayerCenter'
  | 'cardCastShadow'
  | 'cardShell'
  | 'flipHost'
  | 'flipHit'
  | 'flipHitPassthrough'
  | 'flipInner'
  | 'face'
  | 'faceFront'
  | 'faceContact'
  | 'faceBack'
  | 'contourHatch'
  | 'contourHatchLaminate'
  | 'contourHatchLaminateAmbient'
  | 'contourHatchLaminateFoil'
  | 'contourHatchLines'
  | 'contourSvg'
  | 'pixelGridBg'
  | 'pixelGridChromaWave'
  | 'sheen'
  | 'faceContent'
  | 'faceFrontTitleOnly'
  | 'faceContactContent'
  | 'faceContactLayout'
  | 'faceContactDetailsSlot'
  | 'faceContactRoleSlot'
  | 'faceContactQrSlot'
  | 'faceContactSlotLayer'
  | 'faceContactPanelFlat'
  | 'faceContactDetailsShadow'
  | 'faceContactPanel'
  | 'faceContactDetailsFloat'
  | 'faceContactDetailsFootFloat'
  | 'faceContactDetailsFoot'
  | 'faceContactDetailsFootShadow'
  | 'faceContactDetails'
  | 'faceContactLinks'
  | 'faceContactName'
  | 'faceContactNameGiven'
  | 'faceContactNameFamily'
  | 'faceContactRole'
  | 'faceContactPhone'
  | 'faceContactEmail'
  | 'faceContactQrPanel'
  | 'faceContactQr'
  | 'titleTriHeading'
  | 'titleTriLayout'
  | 'titleTriFocus'
  | 'titleTriFocusSvg'
  | 'titleTriRow2'
  | 'titleTriOn'
  | 'titleTriProject'
  | 'cornerArrowPerspective'
  | 'cornerArrow3dHost'
  | 'cornerArrowFloating'
  | 'cornerArrowDetachedFloat'
  | 'cornerArrowFloatingLight'
  | 'cornerArrowStack'
  | 'cornerArrowFaceBg'
  | 'cornerArrowFaceBgLight'
  | 'cornerArrowChipUsesBackAngle'
  | 'cornerArrowSvg',
  string
>;

const fx = rawFx as Record<
  | 'tiltArea'
  | 'tiltLayer'
  | 'tiltLayerHot'
  | 'parallaxTiltHost'
  | 'markLayered'
  | 'markSurfaceShadow'
  | 'markDetachedFloat'
  | 'foil'
  | 'foilFront'
  | 'foilFrontAmbient'
  | 'foilFrontSecondary'
  | 'foilFrontSecondaryAmbient'
  | 'foilBack'
  | 'foilBackAmbient'
  | 'foilChipUsesFrontAngle'
  | 'foilSubstrateLight'
  | 'foilPaused',
  string
>;

/**
 * `focus` / `focus-` prefix uses Comic Neue; any following characters (e.g. circled “on”) stay Unica One.
 */
function TitlePrefixSpans({ text }: { text: string }) {
  if (!text) return null;
  if (/^focus$/i.test(text)) {
    return <span className={comicNeue.className}>{text}</span>;
  }
  const m = text.match(/^focus-/i);
  if (m) {
    const n = m[0].length;
    return (
      <>
        {/* `focus-` rendered as SVG for the title mark (no animation yet). */}
        <span aria-hidden className={`${css.titleTriFocusSvg} ${fx.markDetachedFloat}`}>
          <svg
            viewBox={FOCUS_MARK_VIEWBOX}
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMinYMin meet"
            style={{ overflow: 'visible' }}
          >
            <g
              strokeLinecap="round"
              fillRule="evenodd"
              stroke="currentColor"
              strokeWidth="0.25mm"
              fill="currentColor"
              style={{ stroke: 'currentColor', strokeWidth: '0.25mm', fill: 'currentColor' }}
            >
              <FocusMarkVisiblePaths />
            </g>
          </svg>
        </span>
        <span className={unicaOne.className}>{text.slice(n)}</span>
      </>
    );
  }
  return <span className={unicaOne.className}>{text}</span>;
}

// --- Flip tuning copied from MemoOn-Card landing defaults (simple path) ---
const FLIP_HALF_MS = 160;
const FLIP_SETTLE_BUFFER_MS = 10;
const FLIP_FIRST_HALF_BEZIER = '0.4, 0, 1, 1';
const FLIP_SECOND_HALF_BEZIER = '0, 0, 1, 1';
const FLIP_AXIS = { x: -0.48, y: 0.55, z: 0.1 };
const FLIP_PIVOT = { x: 55, y: 40 };

/** QR + link target for the contact face (public URL, not a secret). */
const CONTACT_QR_URL = 'https://focus-on-pixel.com';
const CONTACT_FIRST_NAME = 'GILLES';
const CONTACT_LAST_NAME = 'axence';
const CONTACT_PHONE_DISPLAY = '+33 7 88 00 19 82';
const CONTACT_PHONE_HREF = 'tel:+33788001982';
const CONTACT_EMAIL = 'contact@focus-on-pixel.com';
/** Quantized viewport grid for contact-face contour seed (higher = finer cursor response). */
const CONTOUR_POINTER_SEED_GRID = 12;
/** Duration to reach a committed contour seed target from the current displayed seed. */
const CONTOUR_SEED_TRANSITION_DURATION_MS = 400;
/** Max seed transition updates per second while `requestAnimationFrame` drives timing. */
const CONTOUR_SEED_TRANSITION_HZ = 60;
/** Minimum interval before the cursor may commit a new contour seed target cell. */
const CONTOUR_SEED_TARGET_UPDATE_MS = 500;
/**
 * Canvas-space shift of the contour field and laminate foil per grid unit on X/Y.
 * Lower = adjacent seeds stay closer; higher = stronger cursor response.
 */
const CONTOUR_SEED_GRID_SPREAD = 24;

type CardFace = 0 | 1 | 2;

type ContourSeedCell = { x: number; y: number };

function hashContourBaseSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) h = Math.imul(h ^ input.charCodeAt(i), 16777619);
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

type ContourBump = { x: number; y: number; a: number; s: number };

function evalContourRawField(
  x: number,
  y: number,
  bumps: ContourBump[],
  offsetX: number,
  offsetY: number,
  phase: number,
  width: number,
  height: number
): number {
  let v = 0;
  for (const bump of bumps) {
    const dx = x - (bump.x + offsetX);
    const dy = y - (bump.y + offsetY);
    const r2 = dx * dx + dy * dy;
    v += bump.a * Math.exp(-r2 / (2 * bump.s * bump.s));
  }
  v +=
    0.14 * Math.sin((x / width) * Math.PI * 2 + 0.65 + phase) +
    0.1 * Math.cos((y / height) * Math.PI * 2 + phase * 0.75);
  v += 0.22 * (x / width) - 0.14 * (y / height) + phase * 0.05;
  return v;
}

function contourSeedFoilOffsetVars(seed: ContourSeedCell): Record<string, string> {
  const spread = CONTOUR_SEED_GRID_SPREAD;
  return {
    '--contour-seed-foil-angle-offset': `${(seed.x - seed.y) * spread * 0.085}deg`,
    '--contour-seed-foil-at-x-offset': `${seed.x * spread * 0.06}%`,
    '--contour-seed-foil-at-y-offset': `${seed.y * spread * 0.06}%`,
    '--contour-seed-foil-hatch-angle-offset': `${seed.x * spread * 0.07}deg`,
  };
}

function contourFillMaskDataUrl(fillMask: Uint8Array, width: number, height: number): string {
  if (!fillMask.length || typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const image = ctx.createImageData(width, height);
  for (let i = 0; i < fillMask.length; i += 1) {
    if (!fillMask[i]) continue;
    const offset = i * 4;
    image.data[offset] = 255;
    image.data[offset + 1] = 255;
    image.data[offset + 2] = 255;
    image.data[offset + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL('image/png');
}

function contourSeedAtTransitionProgress(
  from: ContourSeedCell,
  to: ContourSeedCell,
  progress: number
): ContourSeedCell {
  const t = Math.min(1, Math.max(0, progress));
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
  };
}

function contourPointerSeedCell(clientX: number, clientY: number): { x: number; y: number } {
  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);
  const x = Math.min(
    CONTOUR_POINTER_SEED_GRID - 1,
    Math.max(0, Math.floor((clientX / width) * CONTOUR_POINTER_SEED_GRID))
  );
  const y = Math.min(
    CONTOUR_POINTER_SEED_GRID - 1,
    Math.max(0, Math.floor((clientY / height) * CONTOUR_POINTER_SEED_GRID))
  );
  return { x, y };
}

function normAxis(a: { x: number; y: number; z: number }): [number, number, number] {
  const m = Math.hypot(a.x, a.y, a.z);
  if (!m) return [0, 1, 0];
  return [a.x / m, a.y / m, a.z / m];
}

function waitForMs(ms: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) return Promise.resolve();
  return new Promise((resolve) => {
    const id = window.setTimeout(resolve, ms);
    const onAbort = () => {
      window.clearTimeout(id);
      resolve();
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

/** Circled Latin small o + n (U+24DE ⓞ, U+24DD ⓝ) — stylized “on”, non-inverted circles. */
const CIRCLED_LOWER_ON = String.fromCodePoint(0x24de, 0x24dd);

export function BusinessCardHero({
  title = 'Focus-On-Pixel',
  backBody,
}: {
  title?: string;
  /** Optional override; defaults to locale-specific copy. */
  backBody?: string;
}) {
  const { locale } = useLocale();

  /** Strings for back face + accessible labels; French when `locale === 'fr'`. */
  const copy = useMemo(() => {
    const lang = locale === 'fr' ? 'fr' : 'en';
    if (lang === 'fr') {
      return {
        about: 'À propos',
        backBodyDefault:
          'Conception d’interfaces soignées et produits full-stack fiables — du prototype au déploiement.',
        ariaShowFront: 'Afficher le recto de la carte',
        ariaShowBack: 'Afficher le verso de la carte',
        ariaNextToAbout: 'Afficher la face À propos',
        ariaNextToContact: 'Afficher la face Contact',
        ariaNextToTitle: 'Afficher la face titre',
        contactRole: 'Développeur Javascript',
      };
    }
    return {
      about: 'About',
      backBodyDefault:
        'Building thoughtful interfaces and solid full-stack products — from prototype to deployment.',
      ariaShowFront: 'Show front of card',
      ariaShowBack: 'Show back of card',
      ariaNextToAbout: 'Show About face',
      ariaNextToContact: 'Show Contact face',
      ariaNextToTitle: 'Show title face',
      contactRole: 'Javascript Developer',
    };
  }, [locale]);

  const resolvedBackBody = backBody ?? copy.backBodyDefault;

  /**
   * Front title: stacked `…-on-Pixel` uses merged SVG (`ProjectMarkLayered`) + Silkscreen `Pixel`;
   * other shapes fall back to `FocusMarkLayered` + text. Inline modes keep Unica + optional Silkscreen.
   */
  const titleFrontLayout = useMemo(() => {
    const parts = title.split('-');
    const last = parts[parts.length - 1] ?? '';
    if (parts.length >= 3 && /^pixel$/i.test(last)) {
      const middle = parts.slice(1, -1);
      const isSimpleOn = middle.length === 1 && /^on$/i.test(middle[0] ?? '');
      const line2 = isSimpleOn
        ? 'on'
        : middle.map((seg) => (/^on$/i.test(seg) ? CIRCLED_LOWER_ON : seg)).join('-');
      return {
        mode: 'stacked' as const,
        onIsSvg: isSimpleOn,
        line2,
        pixel: last,
      };
    }
    if (parts.length > 0 && /^pixel$/i.test(last)) {
      const head = parts.slice(0, -1);
      let prefix = '';
      head.forEach((seg, i) => {
        if (i > 0) prefix += '-';
        prefix += /^on$/i.test(seg) ? CIRCLED_LOWER_ON : seg;
      });
      /* Leading hyphen before `Pixel` is rendered in Silkscreen with the word (not Unica). */
      return { mode: 'inline' as const, titlePrefixUnica: prefix, titlePixelSilk: last };
    }
    return {
      mode: 'inline' as const,
      titlePrefixUnica: title.replace(/-on-/gi, `-${CIRCLED_LOWER_ON}-`),
      titlePixelSilk: null as string | null,
    };
  }, [title]);
  const titleAriaLabel = useMemo(() => title.replace(/-/g, ' '), [title]);

  /** Active face inside `flipInner` (0 title, 1 about, 2 contact); swapped at flip midpoint. */
  const [cardFace, setCardFace] = useState<CardFace>(0);
  /** Face 1 (about) drives back-side holo variables; faces 0 and 2 use front holo. */
  const showingBackFoil = cardFace === 1;
  /** Mirrors OS “reduce motion”; when true, pointer-driven animation effect does not run. */
  const [reducedMotion, setReducedMotion] = useState(false);
  /** After `.cardShell` `cardEntrance` (200ms) ends, or immediately when `prefers-reduced-motion`. */
  const [cardEntranceDone, setCardEntranceDone] = useState(false);
  /**
   * After a title-face stagger wave starts, stays false until chroma mask reveals can finish
   * (`PIXEL_SQUARE_REVEAL_SPAN_MS` + `PIXEL_SQUARE_REVEAL_DURATION_MS`); then pointer tilt unlocks.
   */
  const [pixelStaggerComplete, setPixelStaggerComplete] = useState(true);
  const [contourSeedCell, setContourSeedCell] = useState({ x: 0, y: 0 });

  const flipAriaLabel = useMemo(() => {
    if (cardFace === 0) return copy.ariaNextToAbout;
    if (cardFace === 1) return copy.ariaNextToContact;
    return copy.ariaNextToTitle;
  }, [cardFace, copy]);

  const cardCursorClass = cardFace === 1 ? css.heroCursorBright : css.heroCursorDark;
  const cornerArrowChipLight = cardFace === 1 || cardFace === 2;
  const cornerArrowChipFoilSubstrateClass = cornerArrowChipLight ? fx.foilSubstrateLight : '';
  const cornerArrowChipFoilAngleClass =
    cardFace === 1 ? css.cornerArrowChipUsesBackAngle : fx.foilChipUsesFrontAngle;

  // --- Refs for pointer / animation (avoid re-renders on every move) ---

  const tiltAreaRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const flipInnerRef = useRef<HTMLDivElement>(null);
  /** `.cardShell` runs `cardEntrance`; pixel snap waits for it so rects/CTM match the settled card. */
  const cardShellRef = useRef<HTMLDivElement>(null);
  /** Face 0 root: chroma canvas + `.pixelGridBg` share this element for grid alignment. */
  const faceFront0Ref = useRef<HTMLDivElement>(null);
  /** Same layer as `.pixelGridBg` — exact grid origin for snap math. */
  const pixelGridBgRef = useRef<HTMLDivElement>(null);
  const pixelChromaCanvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;
  const cardFaceRef = useRef(cardFace);
  cardFaceRef.current = cardFace;
  /** Flip driver state (MemoOn style): one animation at a time, abortable. */
  const flipBusyRef = useRef(false);
  const flipAbortRef = useRef<AbortController | null>(null);
  /** `performance.now()` anchor for staggered chroma alpha; cleared when not on title / reduced motion. */
  const chromaRevealStartMsRef = useRef<number | null>(null);
  const chromaRevealRafRef = useRef(0);
  /** Previous `cardFace` for one-shot “entered title face” detection (`-1` = never synced). */
  const prevFaceForRevealRef = useRef<number>(-1);
  const prevEntranceForRevealRef = useRef(false);
  const pixelStaggerGateTidRef = useRef(0);
  const contourSeedPendingTargetRef = useRef({ x: 0, y: 0 });
  const contourSeedTargetRef = useRef({ x: 0, y: 0 });
  const contourSeedCellRef = useRef({ x: 0, y: 0 });
  const contourSeedTransitionFromRef = useRef({ x: 0, y: 0 });
  const contourSeedTransitionToRef = useRef({ x: 0, y: 0 });
  const contourSeedTransitionActiveRef = useRef(false);
  const contourSeedTransitionStartedAtRef = useRef(0);
  const contourSeedTransitionRafRef = useRef(0);
  const contourSeedTransitionLastSampleAtRef = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (cardFace !== 2 || reducedMotion) return;

    const onPointerMove = (event: PointerEvent) => {
      contourSeedPendingTargetRef.current = contourPointerSeedCell(event.clientX, event.clientY);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, [cardFace, reducedMotion]);

  useEffect(() => {
    if (cardFace !== 2 || reducedMotion) return;

    const transitionSampleIntervalMs = 1000 / CONTOUR_SEED_TRANSITION_HZ;

    const pumpContourSeedTransition = () => {
      window.cancelAnimationFrame(contourSeedTransitionRafRef.current);
      const step = (now: number) => {
        if (cardFaceRef.current !== 2 || reducedMotionRef.current || !contourSeedTransitionActiveRef.current) {
          return;
        }

        const elapsed = now - contourSeedTransitionStartedAtRef.current;
        const progress = Math.min(1, elapsed / CONTOUR_SEED_TRANSITION_DURATION_MS);
        const shouldSample =
          contourSeedTransitionLastSampleAtRef.current === 0 ||
          progress >= 1 ||
          now - contourSeedTransitionLastSampleAtRef.current >= transitionSampleIntervalMs;

        if (shouldSample) {
          contourSeedTransitionLastSampleAtRef.current = now;
          const next = contourSeedAtTransitionProgress(
            contourSeedTransitionFromRef.current,
            contourSeedTransitionToRef.current,
            progress
          );
          contourSeedCellRef.current = next;
          setContourSeedCell(next);
        }

        if (progress < 1) {
          contourSeedTransitionRafRef.current = window.requestAnimationFrame(step);
          return;
        }

        contourSeedTransitionActiveRef.current = false;
      };

      contourSeedTransitionRafRef.current = window.requestAnimationFrame(step);
    };

    const beginContourSeedTransition = (from: ContourSeedCell, to: ContourSeedCell) => {
      contourSeedTransitionFromRef.current = { x: from.x, y: from.y };
      contourSeedTransitionToRef.current = { x: to.x, y: to.y };
      contourSeedTransitionStartedAtRef.current = performance.now();
      contourSeedTransitionLastSampleAtRef.current = 0;
      contourSeedTransitionActiveRef.current = true;
      pumpContourSeedTransition();
    };

    const commitContourSeedTarget = () => {
      const pending = contourSeedPendingTargetRef.current;
      const target = contourSeedTargetRef.current;
      if (pending.x === target.x && pending.y === target.y) return;
      contourSeedTargetRef.current = pending;
      beginContourSeedTransition(contourSeedCellRef.current, pending);
    };

    const targetIntervalId = window.setInterval(commitContourSeedTarget, CONTOUR_SEED_TARGET_UPDATE_MS);
    return () => {
      window.clearInterval(targetIntervalId);
      window.cancelAnimationFrame(contourSeedTransitionRafRef.current);
      contourSeedTransitionActiveRef.current = false;
    };
  }, [cardFace, reducedMotion]);

  const refreshPixelChroma = useCallback((tiltX?: number, tiltY?: number) => {
    const canvas = pixelChromaCanvasRef.current;
    const face = faceFront0Ref.current;
    if (!canvas || !face || cardFaceRef.current !== 0) return;
    let tx: number;
    let ty: number;
    if (typeof tiltX === 'number' && typeof tiltY === 'number') {
      tx = tiltX;
      ty = tiltY;
    } else {
      const area = tiltAreaRef.current;
      if (area && !reducedMotionRef.current) {
        tx = parseFloat(getComputedStyle(area).getPropertyValue('--tilt-x')) || 0;
        ty = parseFloat(getComputedStyle(area).getPropertyValue('--tilt-y')) || 0;
      } else {
        tx = 0;
        ty = 0;
      }
    }
    const start = chromaRevealStartMsRef.current;
    const reveal: PixelChromaRevealDraw | null =
      !reducedMotionRef.current && start !== null
        ? {
            startMs: start,
            nowMs: performance.now(),
            spanMs: PIXEL_SQUARE_REVEAL_SPAN_MS,
            durationMs: PIXEL_SQUARE_REVEAL_DURATION_MS,
          }
        : null;
    drawPixelGridChromaCanvas(
      canvas,
      face,
      pixelGridBgRef.current,
      tx,
      ty,
      reducedMotionRef.current,
      reveal
    );
  }, []);

  const onTiltApplied = useCallback(
    (tiltX: number, tiltY: number) => {
      refreshPixelChroma(tiltX, tiltY);
    },
    [refreshPixelChroma]
  );

  const pointerTiltUnlocked =
    cardEntranceDone &&
    (reducedMotion || cardFace !== 0 || pixelStaggerComplete);

  const { scheduleMotionTick } = useCardTiltAndFoil({
    reducedMotion,
    pointerTiltEnabled: pointerTiltUnlocked,
    pointerTiltTracksDocument: true,
    cardTiltFrozenOverCardBounds: true,
    showingBack: showingBackFoil,
    areaRef: tiltAreaRef,
    tiltLayerRef: tiltRef,
    haloBoundsRef: flipInnerRef,
    tiltLayerHotClassName: fx.tiltLayerHot,
    onTiltApplied,
  });

  /** After we swap faces or when pointer tilt unlocks post-entrance, nudge foil toward the current target. */
  useEffect(() => {
    if (reducedMotion) return;
    scheduleMotionTick();
  }, [cardFace, cardEntranceDone, pixelStaggerComplete, reducedMotion, scheduleMotionTick]);

  /** Keep chroma canvas aligned with the face grid after layout / unlock (not only on pointer RAF). */
  useLayoutEffect(() => {
    if (cardFace !== 0 || reducedMotion || !cardEntranceDone) return;
    const face = faceFront0Ref.current;
    if (!face) return;

    let frame = 0;
    const paint = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = 0;
        refreshPixelChroma();
      });
    };

    paint();
    const ro = new ResizeObserver(paint);
    ro.observe(face);

    return () => {
      ro.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [cardFace, reducedMotion, cardEntranceDone, pixelStaggerComplete, refreshPixelChroma]);

  /** Defer pixel grid / PIXEL snap until `cardEntrance` on `.cardShell` finishes (layout was unstable mid-animation). */
  useLayoutEffect(() => {
    if (reducedMotion) {
      setCardEntranceDone(true);
      return;
    }
    setCardEntranceDone(false);
    const shell = cardShellRef.current;
    if (!shell) {
      setCardEntranceDone(true);
      return;
    }
    const cs = getComputedStyle(shell);
    const dur = parseFloat(cs.animationDuration || '0');
    if (cs.animationName === 'none' || dur < 0.01) {
      queueMicrotask(() => setCardEntranceDone(true));
      return;
    }
    let alive = true;
    const finish = () => {
      if (alive) setCardEntranceDone(true);
    };
    shell.addEventListener('animationend', finish, { once: true });
    const fallbackMs = Math.max(400, Math.round(dur * 1000) + 200);
    const tid = window.setTimeout(finish, fallbackMs);
    return () => {
      alive = false;
      shell.removeEventListener('animationend', finish);
      window.clearTimeout(tid);
    };
  }, [reducedMotion]);

  /** Staggered chroma reveal on the face grid. Pointer tilt waits until the wave can finish. */
  useLayoutEffect(() => {
    if (chromaRevealRafRef.current) {
      cancelAnimationFrame(chromaRevealRafRef.current);
      chromaRevealRafRef.current = 0;
    }

    const clearStaggerGateTimer = () => {
      if (pixelStaggerGateTidRef.current) {
        window.clearTimeout(pixelStaggerGateTidRef.current);
        pixelStaggerGateTidRef.current = 0;
      }
    };

    const surface = cardEntranceDone && cardFace === 0 && !reducedMotion;
    if (!surface) {
      chromaRevealStartMsRef.current = null;
      prevFaceForRevealRef.current = cardFace;
      prevEntranceForRevealRef.current = cardEntranceDone;
      clearStaggerGateTimer();
      setPixelStaggerComplete(true);
      return () => {
        clearStaggerGateTimer();
      };
    }

    const entered =
      (!prevEntranceForRevealRef.current && cardEntranceDone) ||
      (prevFaceForRevealRef.current !== 0 && cardFace === 0);

    if (entered) {
      chromaRevealStartMsRef.current = performance.now();
      clearStaggerGateTimer();
      setPixelStaggerComplete(false);
      const staggerMs = PIXEL_SQUARE_REVEAL_SPAN_MS + PIXEL_SQUARE_REVEAL_DURATION_MS;
      pixelStaggerGateTidRef.current = window.setTimeout(() => {
        pixelStaggerGateTidRef.current = 0;
        setPixelStaggerComplete(true);
      }, staggerMs);
      const span = staggerMs;
      const tick = () => {
        refreshPixelChroma();
        const s = chromaRevealStartMsRef.current;
        if (s !== null && performance.now() - s < span) {
          chromaRevealRafRef.current = requestAnimationFrame(tick);
        } else {
          chromaRevealRafRef.current = 0;
        }
      };
      chromaRevealRafRef.current = requestAnimationFrame(tick);
      refreshPixelChroma();
    }

    prevFaceForRevealRef.current = cardFace;
    prevEntranceForRevealRef.current = cardEntranceDone;

    return () => {
      if (chromaRevealRafRef.current) {
        cancelAnimationFrame(chromaRevealRafRef.current);
        chromaRevealRafRef.current = 0;
      }
    };
  }, [cardEntranceDone, cardFace, reducedMotion, refreshPixelChroma]);

  const runMemoOnSimpleFlip = useCallback(
    async (el: HTMLElement, onMidpoint: () => void, signal: AbortSignal) => {
      const [ax, ay, az] = normAxis(FLIP_AXIS);
      const origin = `${FLIP_PIVOT.x}% ${FLIP_PIVOT.y}%`;
      const t3 = (deg: number) => `rotate3d(${ax},${ay},${az},${deg}deg)`;

      el.style.willChange = 'transform';
      el.style.transformOrigin = origin;

      el.style.transition = `transform ${FLIP_HALF_MS}ms cubic-bezier(${FLIP_FIRST_HALF_BEZIER})`;
      el.style.transform = t3(90);

      await waitForMs(FLIP_HALF_MS, signal);
      if (signal.aborted) return;

      onMidpoint();

      // Force the back content to start on the “other side” before the second half begins.
      el.style.transition = 'none';
      el.style.transform = t3(-90);
      void el.offsetWidth;
      el.style.transition = `transform ${FLIP_HALF_MS}ms cubic-bezier(${FLIP_SECOND_HALF_BEZIER})`;
      el.style.transform = t3(0);

      await waitForMs(FLIP_HALF_MS + FLIP_SETTLE_BUFFER_MS, signal);
    },
    []
  );

  const toggleFlip = useCallback(
    (e?: React.MouseEvent | React.KeyboardEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      if (flipBusyRef.current) return;
      const el = flipInnerRef.current;
      if (!el) return;

      const nextFace = (((cardFace + 1) % 3) as CardFace);
      flipBusyRef.current = true;
      flipAbortRef.current?.abort();
      const ac = new AbortController();
      flipAbortRef.current = ac;

      void (async () => {
        try {
          await runMemoOnSimpleFlip(el, () => setCardFace(nextFace), ac.signal);
        } finally {
          // Clear inline flip styles so tilt/holo remains in control.
          if (!ac.signal.aborted) {
            el.style.transition = '';
            el.style.transform = '';
            el.style.transformOrigin = '';
            el.style.willChange = '';
          }
          flipBusyRef.current = false;
        }
      })();
    },
    [runMemoOnSimpleFlip, cardFace]
  );

  /**
   * Procedural laminate mask + contour strokes for the contact face.
   * Base bumps are seeded from title/locale; cursor grid nudges the field by `CONTOUR_SEED_GRID_SPREAD`.
   */
  const contourHatch = useMemo(() => {
    const rand = mulberry32(hashContourBaseSeed(`${title}::${locale}`));
    const gridOffsetX = contourSeedCell.x * CONTOUR_SEED_GRID_SPREAD;
    const gridOffsetY = contourSeedCell.y * CONTOUR_SEED_GRID_SPREAD;
    const gridPhase = (contourSeedCell.x - contourSeedCell.y) * CONTOUR_SEED_GRID_SPREAD * 0.004;

    const W = 600;
    const H = 400;
    const NX = 96; // grid resolution: higher = smoother/denser (CPU cost is tiny at this size)
    const NY = 64;

    // Build a smooth scalar field as a sum of Gaussian "bumps" + a weak directional gradient.
    const bumps: ContourBump[] = [];
    const bumpCount = 6;
    for (let i = 0; i < bumpCount; i += 1) {
      bumps.push({
        x: rand() * W,
        y: rand() * H,
        a: (rand() * 2 - 1) * 1.0,
        s: 55 + rand() * 120,
      });
    }

    let minV = Infinity;
    let maxV = -Infinity;
    for (let j = 0; j <= NY; j += 1) {
      const y = (j / NY) * H;
      for (let i = 0; i <= NX; i += 1) {
        const x = (i / NX) * W;
        const v = evalContourRawField(x, y, bumps, 0, 0, 0, W, H);
        if (v < minV) minV = v;
        if (v > maxV) maxV = v;
      }
    }
    const normSpan = maxV - minV || 1;
    const norm = (v: number) => Math.min(1, Math.max(0, (v - minV) / normSpan));

    const field: number[][] = Array.from({ length: NY + 1 }, () => Array(NX + 1).fill(0));
    const getF = (yy: number, xx: number) => field[yy]![xx]!;

    for (let j = 0; j <= NY; j += 1) {
      const y = (j / NY) * H;
      for (let i = 0; i <= NX; i += 1) {
        const x = (i / NX) * W;
        field[j]![i] = norm(
          evalContourRawField(x, y, bumps, gridOffsetX, gridOffsetY, gridPhase, W, H)
        );
      }
    }

    const sampleField = (x: number, y: number) => {
      const gx = (x / W) * NX;
      const gy = (y / H) * NY;
      const i0 = Math.min(NX - 1, Math.max(0, Math.floor(gx)));
      const j0 = Math.min(NY - 1, Math.max(0, Math.floor(gy)));
      const i1 = Math.min(NX, i0 + 1);
      const j1 = Math.min(NY, j0 + 1);
      const tx = gx - i0;
      const ty = gy - j0;
      const v00 = getF(j0, i0);
      const v10 = getF(j0, i1);
      const v11 = getF(j1, i1);
      const v01 = getF(j1, i0);
      return (
        v00 * (1 - tx) * (1 - ty) +
        v10 * tx * (1 - ty) +
        v11 * tx * ty +
        v01 * (1 - tx) * ty
      );
    };

    const baseStep = 0.09 + rand() * 0.01;
    const fillLevels: number[] = [];
    for (let v = 0.12; v <= 0.86; v += baseStep) fillLevels.push(v);

    const lineLevels: number[] = [];
    for (let v = 0.12; v <= 0.86; v += baseStep / 3) lineLevels.push(v);

    type Pt = { x: number; y: number };
    type Seg = { a: Pt; b: Pt };

    const lerpPt = (p1: Pt, p2: Pt, t: number): Pt => ({
      x: p1.x + (p2.x - p1.x) * t,
      y: p1.y + (p2.y - p1.y) * t,
    });

    const isoSegmentsForLevel = (level: number): Seg[] => {
      const segs: Seg[] = [];
      const cellW = W / NX;
      const cellH = H / NY;

      for (let y = 0; y < NY; y += 1) {
        for (let x = 0; x < NX; x += 1) {
          const v0 = getF(y, x);
          const v1 = getF(y, x + 1);
          const v2 = getF(y + 1, x + 1);
          const v3 = getF(y + 1, x);
          const c0 = v0 >= level ? 1 : 0;
          const c1 = v1 >= level ? 1 : 0;
          const c2 = v2 >= level ? 1 : 0;
          const c3 = v3 >= level ? 1 : 0;
          const idx = (c0 << 3) | (c1 << 2) | (c2 << 1) | c3;
          if (idx === 0 || idx === 15) continue;

          const p0: Pt = { x: x * cellW, y: y * cellH };
          const p1: Pt = { x: (x + 1) * cellW, y: y * cellH };
          const p2: Pt = { x: (x + 1) * cellW, y: (y + 1) * cellH };
          const p3: Pt = { x: x * cellW, y: (y + 1) * cellH };
          const t01 = (level - v0) / (v1 - v0 || 1e-6);
          const t12 = (level - v1) / (v2 - v1 || 1e-6);
          const t23 = (level - v2) / (v3 - v2 || 1e-6);
          const t30 = (level - v3) / (v0 - v3 || 1e-6);
          const e0 = lerpPt(p0, p1, t01);
          const e1 = lerpPt(p1, p2, t12);
          const e2 = lerpPt(p2, p3, t23);
          const e3 = lerpPt(p3, p0, t30);
          const avg = (v0 + v1 + v2 + v3) * 0.25;
          const saddlePrefersA = avg >= level;
          const push = (a: Pt, b: Pt) => segs.push({ a, b });

          switch (idx) {
            case 1:
            case 14:
              push(e2, e3);
              break;
            case 2:
            case 13:
              push(e1, e2);
              break;
            case 3:
            case 12:
              push(e1, e3);
              break;
            case 4:
            case 11:
              push(e0, e1);
              break;
            case 6:
            case 9:
              push(e0, e2);
              break;
            case 7:
            case 8:
              push(e0, e3);
              break;
            case 5:
            case 10:
              if (idx === 5) {
                if (saddlePrefersA) {
                  push(e0, e1);
                  push(e2, e3);
                } else {
                  push(e0, e3);
                  push(e1, e2);
                }
              } else if (saddlePrefersA) {
                push(e0, e3);
                push(e1, e2);
              } else {
                push(e0, e1);
                push(e2, e3);
              }
              break;
            default:
              break;
          }
        }
      }
      return segs;
    };

    const keyOf = (p: Pt) => `${Math.round(p.x * 10) / 10},${Math.round(p.y * 10) / 10}`;

    const stitch = (segs: Seg[]): Pt[][] => {
      const adj = new Map<string, Pt[]>();
      const addAdj = (a: Pt, b: Pt) => {
        const ka = keyOf(a);
        const kb = keyOf(b);
        if (!adj.has(ka)) adj.set(ka, []);
        if (!adj.has(kb)) adj.set(kb, []);
        adj.get(ka)!.push(b);
        adj.get(kb)!.push(a);
      };
      for (const s of segs) addAdj(s.a, s.b);

      const visitedEdge = new Set<string>();
      const edgeKey = (a: Pt, b: Pt) => {
        const ka = keyOf(a);
        const kb = keyOf(b);
        return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
      };

      const polylines: Pt[][] = [];
      for (const [startKey, neighs] of adj.entries()) {
        for (const n of neighs) {
          const startParts = startKey.split(',');
          const start: Pt = {
            x: Number(startParts[0] ?? 0),
            y: Number(startParts[1] ?? 0),
          };
          const ek = edgeKey(start, n);
          if (visitedEdge.has(ek)) continue;

          const line: Pt[] = [start, n];
          visitedEdge.add(ek);
          let cur = n;
          let prev = start;
          for (let guard = 0; guard < 20000; guard += 1) {
            const options = adj.get(keyOf(cur)) || [];
            let next: Pt | null = null;
            for (const cand of options) {
              if (keyOf(cand) === keyOf(prev)) continue;
              const cek = edgeKey(cur, cand);
              if (visitedEdge.has(cek)) continue;
              next = cand;
              visitedEdge.add(cek);
              break;
            }
            if (!next) break;
            line.push(next);
            prev = cur;
            cur = next;
            if (keyOf(cur) === keyOf(start)) break;
          }
          polylines.push(line);
        }
      }
      return polylines.filter((l) => l.length >= 18);
    };

    const smoothPolylinePath = (line: Pt[]): string => {
      if (line.length < 3) {
        const p0 = line[0]!;
        let d = `M ${p0.x.toFixed(1)} ${p0.y.toFixed(1)}`;
        for (let i = 1; i < line.length; i += 1) {
          const pi = line[i]!;
          d += ` L ${pi.x.toFixed(1)} ${pi.y.toFixed(1)}`;
        }
        return d;
      }

      const p0 = line[0]!;
      let d = `M ${p0.x.toFixed(1)} ${p0.y.toFixed(1)}`;
      for (let i = 1; i < line.length - 1; i += 1) {
        const pi = line[i]!;
        const next = line[i + 1]!;
        const ex = (pi.x + next.x) * 0.5;
        const ey = (pi.y + next.y) * 0.5;
        d += ` Q ${pi.x.toFixed(1)} ${pi.y.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
      }
      const last = line[line.length - 1]!;
      d += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
      return d;
    };

    const strokePaths: Array<{ d: string; faint: boolean }> = [];
    for (let li = 0; li < lineLevels.length; li += 1) {
      const level = lineLevels[li]!;
      if (li % 2 === 1) continue;
      const segs = isoSegmentsForLevel(level);
      const lines = stitch(segs);
      for (const line of lines) {
        const d = smoothPolylinePath(line);
        const faint = (Math.floor(level * 1000) % 3) === 0;
        strokePaths.push({ d, faint });
      }
    }

    const fillMask = new Uint8Array(W * H);
    for (let j = 0; j < H; j += 1) {
      for (let i = 0; i < W; i += 1) {
        const v = sampleField(i + 0.5, j + 0.5);
        let inBand = false;
        for (let li = 0; li < fillLevels.length - 1; li += 1) {
          if (li % 2 !== 0) continue;
          if (v >= fillLevels[li]! && v < fillLevels[li + 1]!) {
            inBand = true;
            break;
          }
        }
        if (inBand) fillMask[j * W + i] = 1;
      }
    }

    return {
      fillMask,
      fillMaskDataUrl: contourFillMaskDataUrl(fillMask, W, H),
      strokePaths,
      width: W,
      height: H,
    };
  }, [locale, title, contourSeedCell.x, contourSeedCell.y]);

  const contourLaminateStyle = useMemo(() => {
    if (!contourHatch.fillMaskDataUrl) return undefined;
    return {
      ...contourSeedFoilOffsetVars(contourSeedCell),
      WebkitMaskImage: `url(${contourHatch.fillMaskDataUrl})`,
      maskImage: `url(${contourHatch.fillMaskDataUrl})`,
    };
  }, [contourHatch.fillMaskDataUrl, contourSeedCell]);

  return (
    <main
      className={`${css.heroRoot} ${unicaOne.variable} ${contactSans.variable}`}
      data-portfolio-home
      data-testid="portfolio-hero"
    >
      <div className={css.perspective}>
        <div ref={tiltAreaRef} className={fx.tiltArea}>
          <div ref={tiltRef} className={`${fx.tiltLayer} ${css.tiltLayerCenter}`}>
            <div ref={cardShellRef} className={css.cardShell}>
            {/* Blurred ellipse behind the card (translateZ); tilts with the shell. */}
            <div className={css.cardCastShadow} aria-hidden />
            {/* 3D host is a div (NOT button) so translateZ children (chip) actually float. */}
            <div className={`${css.flipHost} ${cardCursorClass}`}>
              {/* 3D flip: three faces in one box; CSS `backface-visibility` hides inactive faces. */}
              <div ref={flipInnerRef} className={css.flipInner}>
                {cardFace === 0 ? (
                  <div
                    ref={faceFront0Ref}
                    className={`${css.face} ${css.faceFront}`}
                  >
                  <div className={css.sheen} aria-hidden />
                  <canvas ref={pixelChromaCanvasRef} className={css.pixelGridChromaWave} aria-hidden />
                  {/* Grid above multiply chroma so line color isn’t re-tinted per cell (avoids moiré / false major lines). */}
                  <div ref={pixelGridBgRef} className={css.pixelGridBg} aria-hidden />
                  <div className={`${css.faceContent} ${css.faceFrontTitleOnly}`}>
                    <h1
                      className={
                        titleFrontLayout.mode === 'stacked'
                          ? css.titleTriHeading
                          : 'flex flex-col items-start gap-1.5 text-left text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 max-w-[95%] leading-none'
                      }
                      aria-label={titleAriaLabel}
                    >
                      {titleFrontLayout.mode === 'stacked' ? (
                        <div className={`${css.titleTriLayout} ${fx.parallaxTiltHost}`}>
                          {titleFrontLayout.onIsSvg ? (
                            <>
                              <div className={css.titleTriProject}>
                                <ProjectMarkLayered />
                              </div>
                            </>
                          ) : (
                            <>
                              <div className={css.titleTriFocus}>
                                <FocusMarkLayered />
                              </div>
                              <div className={css.titleTriRow2}>
                                <div className={css.titleTriOn}>
                                  <span className={unicaOne.className}>{titleFrontLayout.line2}</span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <>
                          <TitlePrefixSpans text={titleFrontLayout.titlePrefixUnica} />
                          {titleFrontLayout.titlePixelSilk != null ? (
                            <span className={silkscreen.className}>
                              {titleFrontLayout.titlePrefixUnica ? '-' : ''}
                              {titleFrontLayout.titlePixelSilk}
                            </span>
                          ) : null}
                        </>
                      )}
                    </h1>
                  </div>
                </div>
                ) : cardFace === 1 ? (
                  <div className={`${css.face} ${css.faceBack}`}>
                  <div
                    className={`${fx.foilBackAmbient} ${cardFace !== 1 ? fx.foilPaused : ''}`}
                    aria-hidden
                  />
                  {/* Back holo: paused unless About face is active. */}
                  <div
                    className={`${fx.foil} ${fx.foilBack} ${cardFace !== 1 ? fx.foilPaused : ''}`}
                    aria-hidden
                  />
                  <div className={css.sheen} aria-hidden />
                  <div className={css.faceContent}>
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400 mb-3">
                      {copy.about}
                    </p>
                    <p className="text-base leading-relaxed text-slate-200">{resolvedBackBody}</p>
                    <p className="mt-6 text-xs text-slate-500">focus-on-pixel.com</p>
                  </div>
                </div>
                ) : (
                  <div className={`${css.face} ${css.faceFront} ${css.faceContact}`}>
                  <div className={css.contourHatch} aria-hidden>
                    {contourLaminateStyle ? (
                      <div
                        className={`${css.contourSvg} ${css.contourHatchLaminate}`}
                        style={contourLaminateStyle}
                        aria-hidden
                      >
                        <span className={css.contourHatchLaminateAmbient} aria-hidden />
                        <span className={css.contourHatchLaminateFoil} aria-hidden />
                      </div>
                    ) : null}

                    <svg
                      className={`${css.contourSvg} ${css.contourHatchLines}`}
                      viewBox="0 0 600 400"
                      xmlns="http://www.w3.org/2000/svg"
                      preserveAspectRatio="xMidYMid slice"
                      aria-hidden
                    >
                      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                        {contourHatch.strokePaths.map((p, i) => (
                          <path
                            key={`${i}-${p.d.slice(0, 28)}`}
                            d={p.d}
                            strokeWidth={p.faint ? 0.85 : 1.1}
                            data-faint={p.faint ? 'true' : 'false'}
                          />
                        ))}
                      </g>
                    </svg>
                  </div>
                    <div className={`${css.faceContent} ${css.faceContactContent} ${contactSans.className}`}>
                      <div className={css.faceContactLayout}>
                        <div
                          className={`${fx.markLayered} ${css.faceContactSlotLayer} ${css.faceContactDetailsSlot}`}
                        >
                          <span
                            className={`${fx.markSurfaceShadow} ${css.faceContactDetailsShadow}`}
                            aria-hidden
                          />
                          <div
                            className={`${fx.markDetachedFloat} ${css.faceContactPanelFlat} ${css.faceContactPanel} ${css.faceContactDetailsFloat}`}
                          >
                            <div className={css.faceContactDetails}>
                              <p
                                className={`${css.faceContactName} ${unicaOne.className}`}
                                aria-label={`${CONTACT_FIRST_NAME} Maxence`}
                              >
                                <span className={css.faceContactNameGiven}>{CONTACT_FIRST_NAME}</span>{' '}
                                <span className={css.faceContactNameGiven}>M</span>
                                <span className={css.faceContactNameFamily}>{CONTACT_LAST_NAME}</span>
                              </p>
                              <div className={css.faceContactLinks}>
                                <a href={CONTACT_PHONE_HREF} className={css.faceContactPhone}>
                                  {CONTACT_PHONE_DISPLAY}
                                </a>
                                <a href={`mailto:${CONTACT_EMAIL}`} className={css.faceContactEmail}>
                                  {CONTACT_EMAIL}
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div
                          className={`${fx.markLayered} ${css.faceContactSlotLayer} ${css.faceContactRoleSlot}`}
                        >
                          <div
                            className={`${fx.markDetachedFloat} ${css.faceContactPanelFlat} ${css.faceContactPanel} ${css.faceContactDetailsFootFloat}`}
                          >
                            <p className={`${css.faceContactDetailsFoot} ${css.faceContactRole}`}>
                              {copy.contactRole}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`${fx.markLayered} ${css.faceContactSlotLayer} ${css.faceContactQrSlot}`}
                        >
                          <span
                            className={`${fx.markSurfaceShadow} ${css.faceContactDetailsShadow}`}
                            aria-hidden
                          />
                          <a
                            href={CONTACT_QR_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${fx.markDetachedFloat} ${css.faceContactPanelFlat} ${css.faceContactPanel} ${css.faceContactQrPanel}`}
                            aria-label={CONTACT_QR_URL}
                          >
                            <ContactQrCode url={CONTACT_QR_URL} className={css.faceContactQr} />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Floating “sub-container” affordance: every face; positioned relative to flipInner. */}
                <div className={css.cornerArrowPerspective}>
                    <div className={`${fx.parallaxTiltHost} ${fx.markLayered} ${css.cornerArrow3dHost}`}>
                      <button
                        type="button"
                        className={`${css.cornerArrowFloating} ${css.cornerArrowDetachedFloat} ${cornerArrowChipLight ? css.cornerArrowFloatingLight : ''}`}
                        onClick={toggleFlip}
                        aria-label={flipAriaLabel}
                      >
                        <span className={css.cornerArrowStack} aria-hidden>
                          <span
                            className={`${css.cornerArrowFaceBg} ${cornerArrowChipLight ? css.cornerArrowFaceBgLight : ''}`}
                          />
                          <span
                            className={`${fx.foilBackAmbient} ${cornerArrowChipFoilAngleClass} ${cornerArrowChipFoilSubstrateClass}`}
                          />
                          <span
                            className={`${fx.foil} ${fx.foilBack} ${cornerArrowChipFoilAngleClass} ${cornerArrowChipFoilSubstrateClass}`}
                          />
                        </span>
                        <svg
                          className={css.cornerArrowSvg}
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M7 7L17 17"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M10 17H17V10"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                <button
                  type="button"
                  className={`${css.flipHit} ${cardCursorClass}`}
                  onClick={toggleFlip}
                  aria-label={flipAriaLabel}
                />
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
