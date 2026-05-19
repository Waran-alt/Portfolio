import { useId, type HTMLAttributes, type ReactNode } from 'react';

import rawFx from '@/features/card-effects/cardEffects.module.css';
import rawStyles from './BusinessCardHero.module.css';
import {
  FOCUS_MARK_H,
  FOCUS_MARK_VIEWBOX,
  FOCUS_MARK_W,
  FOCUS_O_CX,
  FOCUS_O_CY,
  FOCUS_O_R,
  FOCUS_O_STROKE_USER,
  FocusMarkFlatFill,
  FocusMarkMaskPaths,
} from './focusMarkSvg';
import {
  PROJECT_MARK_H,
  PROJECT_MARK_VIEWBOX,
  PROJECT_MARK_W,
  PROJECT_MARK_X,
  PROJECT_MARK_Y,
  ProjectMarkFlatFill,
  ProjectMarkMaskPaths,
  ProjectMarkVisibleStrokes,
} from './projectMarkSvg';

const heroCss = rawStyles as Record<
  'titleTriFocusSvg' | 'titleTriOnSvg' | 'titleTriProjectSvg',
  string
>;

const fx = rawFx as Record<
  | 'markLayered'
  | 'markLayeredOffsetY'
  | 'markSurfaceShadow'
  | 'markDetachedFloat'
  | 'markDetachedFloatLiftStrong'
  | 'markFoilHost'
  | 'markFoilBg'
  | 'markFoilAmbient'
  | 'markFoilMasked',
  string
>;

/** Flat fill on WebKit face 0 (no `foreignObject` holo). Matches `.markFoilBg` mid-tone. */
export const MARK_FLAT_NAVY = '#0f172a';

type MarkFoilLayerProps = {
  flatFoil: boolean;
  maskId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  flatFill: ReactNode;
};

function MarkFoilLayer({ flatFoil, flatFill, maskId, x, y, width, height }: MarkFoilLayerProps) {
  if (flatFoil) {
    /* Masked paths only — a masked `<rect>` paints a card-sized slab on WebKit. */
    return (
      <g mask={`url(#${maskId})`} fill={MARK_FLAT_NAVY} stroke="none" color={MARK_FLAT_NAVY}>
        {flatFill}
      </g>
    );
  }

  return (
    <foreignObject x={x} y={y} width={width} height={height} mask={`url(#${maskId})`}>
      <MarkFoilForeignObjectBody />
    </foreignObject>
  );
}

/** XHTML root for SVG `foreignObject` — required for reliable sizing/clipping on iOS Safari. */
function MarkFoilForeignObjectBody() {
  const rootProps = {
    xmlns: 'http://www.w3.org/1999/xhtml',
    className: fx.markFoilHost,
    style: { display: 'block', width: '100%', height: '100%', overflow: 'hidden' as const },
  } as HTMLAttributes<HTMLDivElement> & { xmlns: string };

  return (
    <div {...rootProps}>
      <div className={fx.markFoilBg} />
      <div className={fx.markFoilAmbient} />
      <div className={fx.markFoilMasked} />
    </div>
  );
}

export function FocusMarkLayered({ flatFoil = false }: { flatFoil?: boolean }) {
  const id = useId();
  const maskId = `focusFoilMask-${id}`;
  const shadowMaskId = `focusFoilMaskShadow-${id}`;

  return (
    <span className={fx.markLayered} aria-hidden>
      <svg
        className={`${heroCss.titleTriFocusSvg} ${fx.markSurfaceShadow}`}
        viewBox={FOCUS_MARK_VIEWBOX}
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMinYMin meet"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <mask
            id={shadowMaskId}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width={FOCUS_MARK_W}
            height={FOCUS_MARK_H}
          >
            <rect x="0" y="0" width={FOCUS_MARK_W} height={FOCUS_MARK_H} fill="#000" />
            <g fill="#fff" stroke="none">
              <FocusMarkMaskPaths />
            </g>
          </mask>
        </defs>
        <g mask={`url(#${shadowMaskId})`} transform="translate(0 4)" opacity="0.28">
          <rect x="0" y="0" width={FOCUS_MARK_W} height={FOCUS_MARK_H} fill="#000" />
        </g>
      </svg>

      <svg
        className={`${heroCss.titleTriFocusSvg} ${fx.markDetachedFloat}`}
        viewBox={FOCUS_MARK_VIEWBOX}
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMinYMin meet"
        aria-hidden
        style={{ overflow: 'visible' }}
      >
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={FOCUS_MARK_W} height={FOCUS_MARK_H}>
            <rect x="0" y="0" width={FOCUS_MARK_W} height={FOCUS_MARK_H} fill="#000" />
            <g fill="#fff" stroke="none">
              <FocusMarkMaskPaths />
            </g>
          </mask>
        </defs>

        <MarkFoilLayer
          flatFoil={flatFoil}
          flatFill={<FocusMarkFlatFill />}
          maskId={maskId}
          x={0}
          y={0}
          width={FOCUS_MARK_W}
          height={FOCUS_MARK_H}
        />

        <g fill="none" stroke="currentColor" strokeWidth={FOCUS_O_STROKE_USER} vectorEffect="non-scaling-stroke">
          <circle cx={FOCUS_O_CX} cy={FOCUS_O_CY} r={FOCUS_O_R} fill="none" />
        </g>
      </svg>
    </span>
  );
}

export function OnMarkLayered({ flatFoil = false }: { flatFoil?: boolean }) {
  const id = useId();
  const maskId = `onHolesMask-${id}`;
  const shadowMaskId = `onHolesMaskShadow-${id}`;

  // Tighter box around the two r=40 circles so the mark scales up in its container,
  // making the same translateZ feel as lifted as "focus".
  const vb = { x: -15, y: -15, w: 170, h: 85 };

  return (
    <span className={`${fx.markLayered} ${fx.markLayeredOffsetY}`} aria-hidden>
      <svg
        className={`${heroCss.titleTriOnSvg} ${fx.markSurfaceShadow}`}
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMinYMin meet"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <mask
            id={shadowMaskId}
            maskUnits="userSpaceOnUse"
            x={vb.x}
            y={vb.y}
            width={vb.w}
            height={vb.h}
          >
            <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="#000" />
            <circle cx="26.801" cy="26.701" r="40" fill="#fff" />
            <circle cx="112.201" cy="26.701" r="40" fill="#fff" />
            <path
              d="M 26.801 53.401 Q 19.001 53.401 13.001 49.851 Q 7.001 46.301 3.501 40.251 Q 0.001 34.201 0.001 26.701 Q 0.001 19.201 3.501 13.151 Q 7.001 7.101 13.001 3.551 Q 19.001 0.001 26.801 0.001 Q 34.601 0.001 40.651 3.551 Q 46.701 7.101 50.151 13.101 Q 53.601 19.101 53.601 26.701 Q 53.601 34.201 50.151 40.251 Q 46.701 46.301 40.651 49.851 Q 34.601 53.401 26.801 53.401 Z M 26.801 45.501 Q 21.601 45.501 17.651 43.001 Q 13.701 40.501 11.501 36.251 Q 9.301 32.001 9.301 26.701 Q 9.301 21.401 11.501 17.151 Q 13.701 12.901 17.651 10.401 Q 21.601 7.901 26.801 7.901 Q 32.101 7.901 36.001 10.401 Q 39.901 12.901 42.101 17.151 Q 44.301 21.401 44.301 26.701 Q 44.301 32.001 42.101 36.251 Q 39.901 40.501 36.001 43.001 Q 32.101 45.501 26.801 45.501 Z"
              fill="#000"
            />
            <g transform="translate(23 0)">
              <path
                d="M 74.601 52.201 L 65.401 52.201 L 65.401 22.701 Q 65.401 15.901 68.451 10.801 Q 71.501 5.701 76.901 2.851 Q 82.301 0.001 89.201 0.001 Q 96.201 0.001 101.551 2.851 Q 106.901 5.701 109.951 10.801 Q 113.001 15.901 113.001 22.701 L 113.001 52.201 L 103.801 52.201 L 103.801 22.801 Q 103.801 18.201 101.751 14.851 Q 99.701 11.501 96.351 9.701 Q 93.001 7.901 89.201 7.901 Q 85.401 7.901 82.051 9.701 Q 78.701 11.501 76.651 14.851 Q 74.601 18.201 74.601 22.801 L 74.601 52.201 Z"
                fill="#000"
              />
            </g>
          </mask>
        </defs>
        <g mask={`url(#${shadowMaskId})`} transform="translate(0 4)" opacity="0.28">
          <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="#000" />
        </g>
      </svg>

      <svg
        className={`${heroCss.titleTriOnSvg} ${fx.markDetachedFloat} ${fx.markDetachedFloatLiftStrong}`}
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMinYMin meet"
        aria-hidden
        style={{ overflow: 'visible' }}
      >
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x={vb.x} y={vb.y} width={vb.w} height={vb.h}>
            <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="#000" />
            <circle cx="26.801" cy="26.701" r="40" fill="#fff" />
            <circle cx="112.201" cy="26.701" r="40" fill="#fff" />
            <path
              d="M 26.801 53.401 Q 19.001 53.401 13.001 49.851 Q 7.001 46.301 3.501 40.251 Q 0.001 34.201 0.001 26.701 Q 0.001 19.201 3.501 13.151 Q 7.001 7.101 13.001 3.551 Q 19.001 0.001 26.801 0.001 Q 34.601 0.001 40.651 3.551 Q 46.701 7.101 50.151 13.101 Q 53.601 19.101 53.601 26.701 Q 53.601 34.201 50.151 40.251 Q 46.701 46.301 40.651 49.851 Q 34.601 53.401 26.801 53.401 Z M 26.801 45.501 Q 21.601 45.501 17.651 43.001 Q 13.701 40.501 11.501 36.251 Q 9.301 32.001 9.301 26.701 Q 9.301 21.401 11.501 17.151 Q 13.701 12.901 17.651 10.401 Q 21.601 7.901 26.801 7.901 Q 32.101 7.901 36.001 10.401 Q 39.901 12.901 42.101 17.151 Q 44.301 21.401 44.301 26.701 Q 44.301 32.001 42.101 36.251 Q 39.901 40.501 36.001 43.001 Q 32.101 45.501 26.801 45.501 Z"
              fill="#000"
            />
            <g transform="translate(23 0)">
              <path
                d="M 74.601 52.201 L 65.401 52.201 L 65.401 22.701 Q 65.401 15.901 68.451 10.801 Q 71.501 5.701 76.901 2.851 Q 82.301 0.001 89.201 0.001 Q 96.201 0.001 101.551 2.851 Q 106.901 5.701 109.951 10.801 Q 113.001 15.901 113.001 22.701 L 113.001 52.201 L 103.801 52.201 L 103.801 22.801 Q 103.801 18.201 101.751 14.851 Q 99.701 11.501 96.351 9.701 Q 93.001 7.901 89.201 7.901 Q 85.401 7.901 82.051 9.701 Q 78.701 11.501 76.651 14.851 Q 74.601 18.201 74.601 22.801 L 74.601 52.201 Z"
                fill="#000"
              />
            </g>
          </mask>
        </defs>

        <MarkFoilLayer
          flatFoil={flatFoil}
          flatFill={
            <>
              <circle cx="26.801" cy="26.701" r="40" />
              <circle cx="112.201" cy="26.701" r="40" />
            </>
          }
          maskId={maskId}
          x={vb.x}
          y={vb.y}
          width={vb.w}
          height={vb.h}
        />

        <g fill="none" stroke="currentColor" strokeWidth="0.25mm" vectorEffect="non-scaling-stroke">
          <circle cx="26.801" cy="26.701" r="40" />
          <circle cx="112.201" cy="26.701" r="40" />
        </g>
      </svg>
    </span>
  );
}

export function ProjectMarkLayered({ flatFoil = false }: { flatFoil?: boolean }) {
  const id = useId();
  const maskId = `projectFoilMask-${id}`;
  const shadowMaskId = `projectFoilMaskShadow-${id}`;

  return (
    <span className={fx.markLayered} aria-hidden>
      <svg
        className={`${heroCss.titleTriProjectSvg} ${fx.markSurfaceShadow}`}
        viewBox={PROJECT_MARK_VIEWBOX}
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMinYMin meet"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <mask
            id={shadowMaskId}
            maskUnits="userSpaceOnUse"
            x={PROJECT_MARK_X}
            y={PROJECT_MARK_Y}
            width={PROJECT_MARK_W}
            height={PROJECT_MARK_H}
          >
            <rect x={PROJECT_MARK_X} y={PROJECT_MARK_Y} width={PROJECT_MARK_W} height={PROJECT_MARK_H} fill="#000" />
            <g fill="#fff" stroke="none">
              <ProjectMarkMaskPaths />
            </g>
          </mask>
        </defs>
        <g mask={`url(#${shadowMaskId})`} transform="translate(0 4)" opacity="0.28">
          <rect x={PROJECT_MARK_X} y={PROJECT_MARK_Y} width={PROJECT_MARK_W} height={PROJECT_MARK_H} fill="#000" />
        </g>
      </svg>

      <svg
        className={`${heroCss.titleTriProjectSvg} ${fx.markDetachedFloat}`}
        viewBox={PROJECT_MARK_VIEWBOX}
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMinYMin meet"
        aria-hidden
        data-pixel-mark-grid
        style={{ overflow: 'visible' }}
      >
        <defs>
          <mask
            id={maskId}
            maskUnits="userSpaceOnUse"
            x={PROJECT_MARK_X}
            y={PROJECT_MARK_Y}
            width={PROJECT_MARK_W}
            height={PROJECT_MARK_H}
          >
            <rect x={PROJECT_MARK_X} y={PROJECT_MARK_Y} width={PROJECT_MARK_W} height={PROJECT_MARK_H} fill="#000" />
            <g fill="#fff" stroke="none">
              <ProjectMarkMaskPaths />
            </g>
          </mask>
        </defs>

        <MarkFoilLayer
          flatFoil={flatFoil}
          flatFill={<ProjectMarkFlatFill />}
          maskId={maskId}
          x={PROJECT_MARK_X}
          y={PROJECT_MARK_Y}
          width={PROJECT_MARK_W}
          height={PROJECT_MARK_H}
        />

        <ProjectMarkVisibleStrokes />
      </svg>
    </span>
  );
}
