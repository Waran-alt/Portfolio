/**
 * @file Guide Overlay Component
 *
 * SVG overlay component for rendering guide lines between cursor and cube corners.
 */

import React, { useEffect } from 'react';
import {
  CUBE_CORNER_OFFSETS,
  CURSOR_GUIDE_GRADIENT_COLOR,
  CURSOR_GUIDE_GRADIENT_STOPS,
  STAGE3_LINE_FADE_DURATION_MS,
  STAGE3_LINE_GROWTH_DURATION_MS,
  STAGE3_LINE_GROWTH_EASING,
  STAGE3_LINE_GROWTH_STAGGER_MS,
  TESSERACT_LINE_COLOR,
  TESSERACT_LINE_STROKE_WIDTH,
} from '../page.constants';
import styles from '../page.module.css';

export interface GuideOverlayProps {
  lineRefs: React.RefObject<SVGLineElement | null>[];
  tesseractLineRefs: React.RefObject<SVGLineElement | null>[];
  gradientRefs: React.RefObject<SVGLinearGradientElement | null>[];
  innerCornerRefs: React.RefObject<HTMLDivElement | null>[];
  cornerRefs: React.RefObject<HTMLDivElement | null>[];
  isCursorInitialized: boolean;
  isStage3Active: boolean;
}


/**
 * Guide overlay component for rendering cursor-to-corner guide lines.
 *
 * Renders SVG lines connecting the cursor to cube corners and connecting
 * outer and inner cube corners (tesseract lines).
 */
export default function GuideOverlay({
  lineRefs,
  tesseractLineRefs,
  gradientRefs,
  innerCornerRefs,
  cornerRefs,
  isCursorInitialized,
  isStage3Active,
}: GuideOverlayProps) {
  // Show cursor guide lines only when Stage 3 is active and cursor has moved
  const shouldShowCursorGuides = isStage3Active && isCursorInitialized;
  
  // Set up Stage 3 line growth animation: calculate lengths and apply staggered animations
  useEffect(() => {
    if (!isStage3Active) {
      return;
    }

    let animationFrameId: number;
    let setupComplete = false;

    // Wait for lines to be positioned, then calculate lengths and apply animations
    const setupLineGrowth = () => {
      // Check if all lines have valid coordinates from useGuideLines hook
      const allLinesPositioned = tesseractLineRefs.every((tesseractLineRef) => {
        const lineElement = tesseractLineRef.current;
        if (!lineElement) {
          return false;
        }
        const x1 = lineElement.getAttribute('x1');
        const y1 = lineElement.getAttribute('y1');
        const x2 = lineElement.getAttribute('x2');
        const y2 = lineElement.getAttribute('y2');
        return x1 !== null && y1 !== null && x2 !== null && y2 !== null && 
               parseFloat(x1) !== 0 && parseFloat(y1) !== 0;
      });

      // Retry next frame if lines aren't ready yet
      if (!allLinesPositioned && !setupComplete) {
        animationFrameId = requestAnimationFrame(setupLineGrowth);
        return;
      }

      if (setupComplete) {
        return;
      }

      setupComplete = true;

      // Calculate line length and apply growth animation for each line
      tesseractLineRefs.forEach((tesseractLineRef, index) => {
        const innerCornerRef = innerCornerRefs[index];
        const outerCornerRef = cornerRefs[index];
        const lineElement = tesseractLineRef.current;

        if (!innerCornerRef || !outerCornerRef || !lineElement) {
          return;
        }

        const innerElement = innerCornerRef.current;
        const outerElement = outerCornerRef.current;

        if (!innerElement || !outerElement) {
          return;
        }

        // Read coordinates (useGuideLines sets x1/y1 to inner, x2/y2 to outer when Stage 3 active)
        const innerX = parseFloat(lineElement.getAttribute('x1') || '0');
        const innerY = parseFloat(lineElement.getAttribute('y1') || '0');
        const outerX = parseFloat(lineElement.getAttribute('x2') || '0');
        const outerY = parseFloat(lineElement.getAttribute('y2') || '0');

        // Calculate line length for stroke-dashoffset animation
        const lineLength = Math.sqrt(Math.pow(outerX - innerX, 2) + Math.pow(outerY - innerY, 2));

        if (lineLength === 0) {
          return;
        }

        // Set CSS variables for fade-in and growth animations
        lineElement.style.setProperty('--line-length', `${lineLength}px`);
        lineElement.style.setProperty('--stage3-fade-duration', `${STAGE3_LINE_FADE_DURATION_MS}ms`);
        lineElement.style.setProperty('--stage3-growth-duration', `${STAGE3_LINE_GROWTH_DURATION_MS}ms`);
        lineElement.style.setProperty('--stage3-growth-delay', `${index * STAGE3_LINE_GROWTH_STAGGER_MS}ms`);
        lineElement.style.setProperty('--stage3-growth-easing', STAGE3_LINE_GROWTH_EASING);

        // Apply animation class to trigger CSS keyframes
        const stage3LineClass = styles['stage3LineGrowth'];
        if (stage3LineClass) {
          lineElement.classList.add(stage3LineClass);
        }
      });
    };

    // Start setup on next animation frame to ensure lines are positioned
    animationFrameId = requestAnimationFrame(setupLineGrowth);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isStage3Active, tesseractLineRefs, innerCornerRefs, cornerRefs]);

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
        const baseClass = styles['cursorGuideLine'] ?? '';
        const visibleClass = styles['cursorGuideVisible'] ?? '';
        const className = shouldShowCursorGuides ? `${baseClass} ${visibleClass}`.trim() : baseClass;

        return (
          <line
            key={corner.key}
            ref={lineRef}
            className={className}
            stroke={`url(#cursor-guide-gradient-${corner.key})`}
            data-testid="cursor-guide-line"
            strokeLinecap="round"
          />
        );
      })}
      {/* Tesseract lines - only render when Stage 3 is active */}
      {isStage3Active &&
        CUBE_CORNER_OFFSETS.map((corner, index) => {
          const tesseractLineRef = tesseractLineRefs[index];
          if (!tesseractLineRef) {
            return null;
          }

          return (
            <line
              key={`tesseract-${corner.key}`}
              ref={tesseractLineRef}
              stroke={TESSERACT_LINE_COLOR}
              strokeWidth={TESSERACT_LINE_STROKE_WIDTH}
              data-testid="tesseract-connecting-line"
              strokeLinecap="round"
            />
          );
        })}
    </svg>
  );
}

