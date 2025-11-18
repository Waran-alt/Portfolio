/**
 * @file Guide Lines Hook
 *
 * Custom hook for managing guide line updates between cursor and cube corners.
 */

import { createRef, useEffect, useMemo } from 'react';
import {
  CUBE_CORNER_OFFSETS,
  INNER_CUBE_CORNER_OFFSETS,
} from '../page.constants';

export interface UseGuideLinesReturn {
  cornerRefs: React.RefObject<HTMLDivElement | null>[];
  innerCornerRefs: React.RefObject<HTMLDivElement | null>[];
  lineRefs: React.RefObject<SVGLineElement | null>[];
  tesseractLineRefs: React.RefObject<SVGLineElement | null>[];
  gradientRefs: React.RefObject<SVGLinearGradientElement | null>[];
}

/**
 * Custom hook for managing guide line references and updates.
 *
 * Creates refs for all guide line elements and updates their positions
 * based on cursor position and cube corner positions.
 *
 * @param cursorPositionRef - Reference to current cursor position
 * @param isStage3Active - Whether Stage 3 is active (affects tesseract line direction)
 * @param areAnimationsComplete - Whether all entrance animations are complete (cursor guide lines only update after this)
 * @returns Refs for all guide line elements
 */
export function useGuideLines(
  cursorPositionRef: React.MutableRefObject<{ x: number; y: number }>,
  isStage3Active: boolean = false,
  areAnimationsComplete: boolean = false
): UseGuideLinesReturn {
  const cornerRefs = useMemo(
    () => CUBE_CORNER_OFFSETS.map(() => createRef<HTMLDivElement>()),
    []
  );
  const innerCornerRefs = useMemo(
    () => INNER_CUBE_CORNER_OFFSETS.map(() => createRef<HTMLDivElement>()),
    []
  );
  const lineRefs = useMemo(
    () => CUBE_CORNER_OFFSETS.map(() => createRef<SVGLineElement>()),
    []
  );
  const tesseractLineRefs = useMemo(
    () => CUBE_CORNER_OFFSETS.map(() => createRef<SVGLineElement>()),
    []
  );
  const gradientRefs = useMemo(
    () => CUBE_CORNER_OFFSETS.map(() => createRef<SVGLinearGradientElement>()),
    []
  );

  // Continuously update guide line positions based on cursor and corner positions
  useEffect(() => {
    let animationFrameId: number;

    const updateGuideLines = () => {
      const cursor = cursorPositionRef.current;

      // Update cursor-to-corner guide lines (only after animations complete)
      if (areAnimationsComplete) {
        cornerRefs.forEach((cornerRef, index) => {
          const lineRef = lineRefs[index];
          const gradientRef = gradientRefs[index];
          if (!cornerRef || !lineRef || !gradientRef) {
            return;
          }

          const cornerElement = cornerRef.current;
          const lineElement = lineRef.current;
          const gradientElement = gradientRef.current;

          if (!cornerElement || !lineElement || !gradientElement) {
            return;
          }

          // Calculate corner center position
          const rect = cornerElement.getBoundingClientRect();
          const cornerX = rect.left + rect.width / 2;
          const cornerY = rect.top + rect.height / 2;

          // Update line endpoints (cursor to corner)
          lineElement.setAttribute('x1', `${cursor.x}`);
          lineElement.setAttribute('y1', `${cursor.y}`);
          lineElement.setAttribute('x2', `${cornerX}`);
          lineElement.setAttribute('y2', `${cornerY}`);

          // Update gradient endpoints to match line
          gradientElement.setAttribute('x1', `${cursor.x}`);
          gradientElement.setAttribute('y1', `${cursor.y}`);
          gradientElement.setAttribute('x2', `${cornerX}`);
          gradientElement.setAttribute('y2', `${cornerY}`);
        });
      }

      // Update tesseract connecting lines (inner cube to outer cube)
      cornerRefs.forEach((outerCornerRef, index) => {
        const innerCornerRef = innerCornerRefs[index];
        const tesseractLineRef = tesseractLineRefs[index];
        if (!outerCornerRef || !innerCornerRef || !tesseractLineRef) {
          return;
        }

        const outerElement = outerCornerRef.current;
        const innerElement = innerCornerRef.current;
        const lineElement = tesseractLineRef.current;

        if (!outerElement || !innerElement || !lineElement) {
          return;
        }

        // Calculate corner center positions
        const outerRect = outerElement.getBoundingClientRect();
        const innerRect = innerElement.getBoundingClientRect();

        const outerX = outerRect.left + outerRect.width / 2;
        const outerY = outerRect.top + outerRect.height / 2;
        const innerX = innerRect.left + innerRect.width / 2;
        const innerY = innerRect.top + innerRect.height / 2;

        // Set line direction based on Stage 3: inner→outer for growth, outer→inner otherwise
        if (isStage3Active) {
          lineElement.setAttribute('x1', `${innerX}`);
          lineElement.setAttribute('y1', `${innerY}`);
          lineElement.setAttribute('x2', `${outerX}`);
          lineElement.setAttribute('y2', `${outerY}`);
        } else {
          lineElement.setAttribute('x1', `${outerX}`);
          lineElement.setAttribute('y1', `${outerY}`);
          lineElement.setAttribute('x2', `${innerX}`);
          lineElement.setAttribute('y2', `${innerY}`);
        }
      });

      animationFrameId = requestAnimationFrame(updateGuideLines);
    };

    animationFrameId = requestAnimationFrame(updateGuideLines);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [cornerRefs, gradientRefs, lineRefs, innerCornerRefs, tesseractLineRefs, cursorPositionRef, isStage3Active, areAnimationsComplete]);

  return {
    cornerRefs,
    innerCornerRefs,
    lineRefs,
    tesseractLineRefs,
    gradientRefs,
  };
}

