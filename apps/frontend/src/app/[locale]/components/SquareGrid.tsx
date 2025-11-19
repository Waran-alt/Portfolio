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
  SQUARE_GRID_GAP_PX,
  SQUARE_GRID_MAX_ROTATION_DEG,
  SQUARE_GRID_SIZE_PX,
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
 */
export default function SquareGrid() {
  const [gridDimensions, setGridDimensions] = useState({ columns: 20, rows: 20 });
  const [squareTransforms, setSquareTransforms] = useState<Array<{ x: number; y: number; rotation: number }>>([]);
  
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

  // Generate random translations and rotations for each square when grid dimensions change
  useEffect(() => {
    const transforms = Array.from({ length: totalSquares }, () => {
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
      
      return { x, y, rotation };
    });
    // Defer state update to avoid cascading renders
    queueMicrotask(() => {
      setSquareTransforms(transforms);
    });
  }, [totalSquares, maxTranslation]);

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
      } as React.CSSProperties}
      data-testid="square-grid"
    >
      {Array.from({ length: totalSquares }, (_, index) => {
        const transform = squareTransforms[index] || { x: 0, y: 0, rotation: 0 };
        return (
          <div
            key={index}
            className={styles['square']}
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) rotate(${transform.rotation}deg)`,
            }}
            data-testid={`square-${index}`}
          />
        );
      })}
    </div>
  );
}

