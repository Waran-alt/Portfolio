/**
 * @file Guide Overlay Component
 *
 * SVG overlay component for rendering guide lines between cursor and cube corners.
 */

import React from 'react';
import {
  CUBE_CORNER_OFFSETS,
  CUBE_FACE_KEYS,
  CURSOR_GUIDE_GRADIENT_COLOR,
  CURSOR_GUIDE_GRADIENT_STOPS,
  INNER_CUBE_CORNER_OFFSETS,
  TESSERACT_LINE_COLOR,
  TESSERACT_LINE_STROKE_WIDTH,
} from '../page.constants';
import { calculateEntranceDelays } from '../utils/entranceDelays';
import styles from '../page.module.css';

export interface GuideOverlayProps {
  cornerRefs: React.RefObject<HTMLDivElement>[];
  innerCornerRefs: React.RefObject<HTMLDivElement>[];
  lineRefs: React.RefObject<SVGLineElement>[];
  tesseractLineRefs: React.RefObject<SVGLineElement>[];
  gradientRefs: React.RefObject<SVGLinearGradientElement>[];
}

const entranceDelays = calculateEntranceDelays();

/**
 * Guide overlay component for rendering cursor-to-corner guide lines.
 *
 * Renders SVG lines connecting the cursor to cube corners and connecting
 * outer and inner cube corners (tesseract lines).
 */
export default function GuideOverlay({
  cornerRefs,
  innerCornerRefs,
  lineRefs,
  tesseractLineRefs,
  gradientRefs,
}: GuideOverlayProps) {
  return (
    <svg className={styles['guideOverlay']} width="100%" height="100%" role="presentation">
      <defs>
        {CUBE_CORNER_OFFSETS.map((corner, index) => {
          const gradientRef = gradientRefs[index];
          if (!gradientRef) {
            return null;
          }

          return (
            <linearGradient
              key={corner.key}
              id={`cursor-guide-gradient-${corner.key}`}
              ref={gradientRef}
              gradientUnits="userSpaceOnUse"
            >
              {CURSOR_GUIDE_GRADIENT_STOPS.map((stop) => (
                <stop
                  key={`${corner.key}-${stop.offset}`}
                  offset={stop.offset}
                  stopColor={CURSOR_GUIDE_GRADIENT_COLOR}
                  stopOpacity={stop.opacity}
                />
              ))}
            </linearGradient>
          );
        })}
      </defs>
      {CUBE_CORNER_OFFSETS.map((corner, index) => {
        const lineRef = lineRefs[index];
        if (!lineRef) {
          return null;
        }

        return (
          <line
            key={corner.key}
            ref={lineRef}
            stroke={`url(#cursor-guide-gradient-${corner.key})`}
            data-testid="cursor-guide-line"
            strokeLinecap="round"
          />
        );
      })}
      {CUBE_CORNER_OFFSETS.map((corner, index) => {
        const tesseractLineRef = tesseractLineRefs[index];
        if (!tesseractLineRef) {
          return null;
        }

        const delay =
          entranceDelays[
            CUBE_FACE_KEYS.length + // outer faces
            CUBE_CORNER_OFFSETS.length + // outer corners
            CUBE_FACE_KEYS.length + // inner faces
            INNER_CUBE_CORNER_OFFSETS.length + // inner corners
            index // tesseract lines
          ];
        return (
          <line
            key={`tesseract-${corner.key}`}
            ref={tesseractLineRef}
            stroke={TESSERACT_LINE_COLOR}
            strokeWidth={TESSERACT_LINE_STROKE_WIDTH}
            data-testid="tesseract-connecting-line"
            strokeLinecap="round"
            className={styles['cubeEntrance']}
            style={{
              animationDelay: `${delay}ms`,
            }}
          />
        );
      })}
    </svg>
  );
}

