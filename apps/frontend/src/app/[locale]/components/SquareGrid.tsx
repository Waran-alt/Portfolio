/**
 * @file Square Grid Component
 *
 * Background grid of identical squares that appears when the cube disappears.
 */

import { useEffect, useState } from 'react';
import {
  SQUARE_GRID_BACKGROUND_COLOR,
  SQUARE_GRID_BORDER_COLOR,
  SQUARE_GRID_BORDER_WIDTH_PX,
  SQUARE_GRID_FADE_IN_DURATION_MS,
  SQUARE_GRID_GAP_PX,
  SQUARE_GRID_JIGGLE_DURATION_MS,
  SQUARE_GRID_JIGGLE_INTENSITY_PX,
  SQUARE_GRID_MAX_APPEAR_DELAY_MS,
  SQUARE_GRID_MAX_ROTATION_DEG,
  SQUARE_GRID_SIZE_PX,
  SQUARE_GRID_TRANSFORM_DELAY_MS,
} from '../page.constants';
import styles from './SquareGrid.module.css';

/**
 * Generates a rotation angle following a Gaussian-like distribution.
 * 
 * Distribution:
 * - 30% = 0deg (no rotation)
 * - 20% = 0 to 1deg
 * - 15% = 1 to 2deg
 * - 10% = 2 to 3deg
 * - 10% = 3 to 4deg
 * - 10% = 4 to 5deg
 * - 5% = 5deg (maximum)
 * 
 * @param maxRotationDeg Maximum rotation angle in degrees
 * @returns Rotation angle in degrees (can be positive or negative)
 */
function generateGaussianRotation(maxRotationDeg: number): number {
  const random = Math.random();
  const sign = Math.random() < 0.5 ? -1 : 1; // Randomly choose positive or negative rotation
  
  // Cumulative probability distribution
  if (random < 0.3) {
    // 30% chance: no rotation
    return 0;
  } else if (random < 0.5) {
    // 20% chance: 0 to 1deg
    return sign * Math.random() * 1;
  } else if (random < 0.65) {
    // 15% chance: 1 to 2deg
    return sign * (1 + Math.random() * 1);
  } else if (random < 0.75) {
    // 10% chance: 2 to 3deg
    return sign * (2 + Math.random() * 1);
  } else if (random < 0.85) {
    // 10% chance: 3 to 4deg
    return sign * (3 + Math.random() * 1);
  } else if (random < 0.95) {
    // 10% chance: 4 to 5deg
    return sign * (4 + Math.random() * 1);
  } else {
    // 5% chance: maximum rotation
    return sign * maxRotationDeg;
  }
}

/**
 * Square grid background component.
 * 
 * Renders a grid of identical squares filling the viewport.
 * Squares are positioned using CSS Grid for optimal performance.
 * Each square is randomly translated and rotated for an organic appearance.
 * 
 * @param isVisible - When true, squares become visible and animations start
 */
interface SquareGridProps {
  isVisible?: boolean;
}

export default function SquareGrid({ isVisible = false }: SquareGridProps) {
  const [gridDimensions, setGridDimensions] = useState({ columns: 20, rows: 20 });
  const [squareTransforms, setSquareTransforms] = useState<Array<{ x: number; y: number; rotation: number; appearDelay: number }>>([]);
  
  // Calculate maximum translation offset (half of gap, truncated)
  const maxTranslation = Math.trunc(SQUARE_GRID_GAP_PX / 2);

  // Calculate number of squares needed to fill viewport
  useEffect(() => {
    const calculateGridDimensions = () => {
      if (typeof window === 'undefined') {
        return { columns: 20, rows: 20 };
      }
      
      const squareWithGap = SQUARE_GRID_SIZE_PX + SQUARE_GRID_GAP_PX;
      const columns = Math.ceil(window.innerWidth / squareWithGap) + 2; // +2 for overflow
      const rows = Math.ceil(window.innerHeight / squareWithGap) + 2; // +2 for overflow
      
      return { columns, rows };
    };

    // Defer state update to avoid cascading renders
    queueMicrotask(() => {
      setGridDimensions(calculateGridDimensions());
    });

    // Recalculate on window resize
    const handleResize = () => {
      queueMicrotask(() => {
        setGridDimensions(calculateGridDimensions());
      });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const { columns, rows } = gridDimensions;
  const totalSquares = columns * rows;

  // Calculate center of grid for distance-based delays
  const centerColumn = (columns - 1) / 2;
  const centerRow = (rows - 1) / 2;
  const maxDistance = Math.sqrt(centerColumn ** 2 + centerRow ** 2);

  // Generate random translations, rotations, and appearance delays for each square
  useEffect(() => {
    const transforms = Array.from({ length: totalSquares }, (_, index) => {
      // Calculate grid position (column, row) for this square
      const column = index % columns;
      const row = Math.floor(index / columns);
      
      // Calculate distance from center
      const deltaX = column - centerColumn;
      const deltaY = row - centerRow;
      const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
      
      // Normalize distance to delay (0 to max delay)
      const normalizedDistance = maxDistance > 0 ? distance / maxDistance : 0;
      const appearDelay = normalizedDistance * SQUARE_GRID_MAX_APPEAR_DELAY_MS;
      
      // Randomly decide which axis to translate (x, y, or both)
      const translateX = Math.random() < 0.5;
      const translateY = Math.random() < 0.5;
      
      // If neither axis is selected, translate both
      const finalTranslateX = translateX || (!translateX && !translateY);
      const finalTranslateY = translateY || (!translateX && !translateY);
      
      // Generate random translation values within maxTranslation
      const x = finalTranslateX ? (Math.random() * 2 - 1) * maxTranslation : 0;
      const y = finalTranslateY ? (Math.random() * 2 - 1) * maxTranslation : 0;
      
      // Generate rotation following Gaussian-like distribution
      const rotation = generateGaussianRotation(SQUARE_GRID_MAX_ROTATION_DEG);
      
      return { x, y, rotation, appearDelay };
    });
    // Defer state update to avoid cascading renders
    queueMicrotask(() => {
      setSquareTransforms(transforms);
    });
  }, [totalSquares, maxTranslation, columns, centerColumn, centerRow, maxDistance]);

  return (
    <div
      className={styles['squareGrid']}
      style={{
        '--square-size': `${SQUARE_GRID_SIZE_PX}px`,
        '--square-gap': `${SQUARE_GRID_GAP_PX}px`,
        '--square-border-width': `${SQUARE_GRID_BORDER_WIDTH_PX}px`,
        '--square-border-color': SQUARE_GRID_BORDER_COLOR,
        '--square-background-color': SQUARE_GRID_BACKGROUND_COLOR,
        '--grid-columns': columns,
        '--grid-rows': rows,
        // Keep grid hidden until isVisible is true
        pointerEvents: isVisible ? 'none' : 'none',
      } as React.CSSProperties}
      data-testid="square-grid"
    >
      {Array.from({ length: totalSquares }, (_, index) => {
        const transform = squareTransforms[index] || { x: 0, y: 0, rotation: 0, appearDelay: 0 };
        // Fade-in completes
        const fadeInEnd = transform.appearDelay + SQUARE_GRID_FADE_IN_DURATION_MS;
        // Jiggle starts after fade-in with a delay, and ends right before transform
        // Transform starts during the jiggle (near the end) so jiggle appears to cause the transform
        const transformDelay = fadeInEnd + SQUARE_GRID_TRANSFORM_DELAY_MS;
        // Jiggle starts earlier so it's happening when transform begins (jiggle causes transform)
        const jiggleDelay = transformDelay - SQUARE_GRID_JIGGLE_DURATION_MS;
        return (
          <div
            key={index}
            className={styles['square']}
            style={{
              '--translate-x': `${transform.x}px`,
              '--translate-y': `${transform.y}px`,
              '--rotate': `${transform.rotation}deg`,
              '--fade-in-delay': isVisible ? `${transform.appearDelay}ms` : '0ms',
              '--fade-in-duration': `${SQUARE_GRID_FADE_IN_DURATION_MS}ms`,
              '--jiggle-delay': isVisible ? `${jiggleDelay}ms` : '0ms',
              '--jiggle-duration': `${SQUARE_GRID_JIGGLE_DURATION_MS}ms`,
              '--jiggle-intensity': `${SQUARE_GRID_JIGGLE_INTENSITY_PX}px`,
              '--transform-delay': isVisible ? `${transformDelay}ms` : '0ms',
              '--transform-duration': `${SQUARE_GRID_FADE_IN_DURATION_MS}ms`,
              // Keep squares hidden and non-transformed until isVisible is true
              ...(isVisible
                ? {}
                : {
                    opacity: 0,
                    visibility: 'hidden',
                    transform: 'translate(0, 0) rotate(0deg)',
                    animation: 'none',
                  }),
            } as React.CSSProperties}
            data-testid={`square-${index}`}
          />
        );
      })}
    </div>
  );
}

