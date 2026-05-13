import React from 'react';

/** Matches exported “focus-” artwork viewBox `0 0 295.8 71.201`. */
export const FOCUS_MARK_VIEWBOX = '0 0 295.8 71.201';
export const FOCUS_MARK_W = 295.8;
export const FOCUS_MARK_H = 71.201;

/**
 * Circled “o” in the same spirit as `OnMarkLayered` (stroke ring, open center): center/radius
 * chosen to sit between “f” and “c” without overlapping neighbors.
 */
export const FOCUS_O_CX = 75.9;
export const FOCUS_O_CY = 44.5;
export const FOCUS_O_R = 26.5;
/** Clears foil in the center of “o” so only a ring shows (mask paints black over white). */
export const FOCUS_O_MASK_INNER_R = 18.5;
/** User-space stroke so the ring reads at this viewBox width (thin mm strokes vanish when scaled). */
export const FOCUS_O_STROKE_USER = 1.35;

const PATH_DS_NO_O: readonly string[] = [
  'M 9.6 70 L 0 70 L 0 18.2 Q 0 12.9 2.35 8.8 Q 4.7 4.7 8.85 2.35 Q 13 0 18.2 0 L 43.1 0 L 43.1 8.5 L 19.3 8.5 Q 14.9 8.5 12.25 11.25 Q 9.6 14 9.6 18.2 L 9.6 32.4 L 39.4 32.4 L 39.4 40.9 L 9.6 40.9 L 9.6 70 Z',
  'M 145.2 70 L 139.2 70 Q 131.3 70 125.1 66.6 Q 118.9 63.2 115.3 57.45 Q 111.7 51.7 111.7 44.5 Q 111.7 37.3 115.3 31.55 Q 118.9 25.8 125.1 22.4 Q 131.3 19 139.2 19 L 145.2 19 L 145.2 26.9 L 138.9 26.9 Q 133.8 26.9 129.75 29.25 Q 125.7 31.6 123.35 35.6 Q 121 39.6 121 44.5 Q 121 49.4 123.35 53.4 Q 125.7 57.4 129.75 59.75 Q 133.8 62.1 138.9 62.1 L 145.2 62.1 L 145.2 70 Z',
  'M 155.7 48.5 L 155.7 19 L 165 19 L 165 48.4 Q 165 53 167 56.35 Q 169 59.7 172.35 61.5 Q 175.7 63.3 179.5 63.3 Q 183.4 63.3 186.75 61.5 Q 190.1 59.7 192.15 56.35 Q 194.2 53 194.2 48.4 L 194.2 19 L 203.5 19 L 203.5 48.5 Q 203.5 55.3 200.4 60.4 Q 197.3 65.5 191.9 68.35 Q 186.5 71.2 179.6 71.2 Q 172.7 71.2 167.25 68.35 Q 161.8 65.5 158.75 60.4 Q 155.7 55.3 155.7 48.5 Z',
  'M 242.9 70 L 217.4 70 L 217.4 62.1 L 241.8 62.1 Q 244.2 62.1 245.95 61.05 Q 247.7 60 248.6 58.3 Q 249.5 56.6 249.5 54.7 Q 249.5 52.9 248.7 51.35 Q 247.9 49.8 246.25 48.85 Q 244.6 47.9 242.3 47.9 L 232 47.9 Q 227.1 47.9 223.45 46.25 Q 219.8 44.6 217.75 41.4 Q 215.7 38.2 215.7 33.6 Q 215.7 29.7 217.6 26.4 Q 219.5 23.1 222.9 21.05 Q 226.3 19 230.7 19 L 254.2 19 L 254.2 26.9 L 231.6 26.9 Q 228.5 26.9 226.7 28.8 Q 224.9 30.7 224.9 33.3 Q 224.9 35.8 226.75 37.65 Q 228.6 39.5 232 39.5 L 241.8 39.5 Q 247.3 39.5 251.05 41.25 Q 254.8 43 256.75 46.3 Q 258.7 49.6 258.7 54.4 Q 258.7 58.5 256.7 62.05 Q 254.7 65.6 251.15 67.8 Q 247.6 70 242.9 70 Z',
  'M 295.8 48.1 L 267.5 48.1 L 267.5 39.7 L 295.8 39.7 L 295.8 48.1 Z',
];

/** White-filled paths for `<mask>` holes (focus word silhouette). “o” = filled disk like `OnMarkLayered` masks. */
export function FocusMarkMaskPaths() {
  return (
    <>
      <path key="f" d={PATH_DS_NO_O[0]!} />
      <circle key="o-outer" cx={FOCUS_O_CX} cy={FOCUS_O_CY} r={FOCUS_O_R} fill="#fff" />
      <circle key="o-hole" cx={FOCUS_O_CX} cy={FOCUS_O_CY} r={FOCUS_O_MASK_INNER_R} fill="#000" />
      {PATH_DS_NO_O.slice(1).map((d, i) => (
        <path key={`rest-${i}`} d={d} />
      ))}
    </>
  );
}

/** Stroked/filled paths for visible SVG (inherits `currentColor`). “o” = stroke ring like `OnMarkLayered`. */
export function FocusMarkVisiblePaths() {
  return (
    <>
      <path key="f" d={PATH_DS_NO_O[0]!} vectorEffect="non-scaling-stroke" />
      <circle
        key="o"
        cx={FOCUS_O_CX}
        cy={FOCUS_O_CY}
        r={FOCUS_O_R}
        fill="none"
        stroke="currentColor"
        strokeWidth={FOCUS_O_STROKE_USER}
        vectorEffect="non-scaling-stroke"
      />
      {PATH_DS_NO_O.slice(1).map((d, i) => (
        <path key={`rest-${i}`} d={d} vectorEffect="non-scaling-stroke" />
      ))}
    </>
  );
}
