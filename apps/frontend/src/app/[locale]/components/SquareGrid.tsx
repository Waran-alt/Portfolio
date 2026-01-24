/**
 * @file Square Grid Component
 *
 * Background grid of identical squares that appears when the cube disappears.
 * Implements gravity effect where squares bend toward the hovered square.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  SQUARE_GRID_BACKGROUND_COLOR,
  SQUARE_GRID_BORDER_COLOR,
  SQUARE_GRID_BORDER_WIDTH_PX,
  SQUARE_GRID_FADE_IN_DURATION_MS,
  SQUARE_GRID_GAP_PX,
  SQUARE_GRID_GRAVITY_DECIMAL_PLACES,
  SQUARE_GRID_GRAVITY_FULL_STRENGTH_PX,
  SQUARE_GRID_GRAVITY_IS_INVERTED,
  SQUARE_GRID_GRAVITY_MAX_Z_LIMIT_PX,
  SQUARE_GRID_GRAVITY_MIN_INFLUENCE_THRESHOLD,
  SQUARE_GRID_GRAVITY_PROPAGATION_DECAY,
  SQUARE_GRID_GRAVITY_ROTATION_XY_SCALE,
  SQUARE_GRID_JIGGLE_DURATION_MS,
  SQUARE_GRID_JIGGLE_INTENSITY_PX,
  SQUARE_GRID_MAX_APPEAR_DELAY_MS,
  SQUARE_GRID_MAX_ROTATION_DEG,
  SQUARE_GRID_SIZE_PX,
  SQUARE_GRID_TRANSFORM_DELAY_MS,
} from '../page.constants';
import styles from './SquareGrid.module.css';

/**
 * Round number to specified decimal places
 */
function roundToDecimals(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

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
 * Gravity transform state for a square
 */
interface GravityTransform {
  translateZ: number;
  rotateX: number; // Neighbor tilt (X-axis)
  rotateY: number; // Neighbor tilt (Y-axis)
}

/**
 * Square data structure with neighbor graph and gravity state
 */
interface SquareData {
  id: number;
  column: number;
  row: number;
  centerX: number; // Screen coordinates
  centerY: number;
  neighbors: {
    top: number | null;
    right: number | null;
    bottom: number | null;
    left: number | null;
  };
  baseTransform: { x: number; y: number; rotation: number }; // From initial animation
  entranceCompletionTime: number; // Time in ms when entrance animation completes (relative to grid visibility)
  gravityTransform: GravityTransform;
  propagationStrength: number; // Full strength for propagation (uncapped)
  lastInfluenceParams: {
    sourceId: number | null;
    strength: number;
    direction: { x: number; y: number };
  } | null;
}

/**
 * Calculate tilt (rotateX/Y) toward the target square
 * Uses grid-relative coordinates (column/row) for uniform behavior regardless of screen position
 */
function calculateTiltTowardTarget(
  square: SquareData,
  targetSquare: SquareData,
  strength: number
): { rotateX: number; rotateY: number } {
  // Calculate direction from square to target using grid coordinates
  const dx = targetSquare.column - square.column;
  const dy = targetSquare.row - square.row;
  const distance = Math.sqrt(dx ** 2 + dy ** 2);
  
  if (distance === 0) {
    return { rotateX: 0, rotateY: 0 };
  }
  
  // Normalize direction
  const normalizedDx = dx / distance;
  const normalizedDy = dy / distance;
  
  // Calculate rotation toward target
  // For X rotation: tilt based on vertical displacement (dy affects rotateX)
  // For Y rotation: tilt based on horizontal displacement (dx affects rotateY)
  const rotateX = normalizedDy * strength * SQUARE_GRID_GRAVITY_ROTATION_XY_SCALE;
  const rotateY = normalizedDx * strength * SQUARE_GRID_GRAVITY_ROTATION_XY_SCALE;
  
  return { rotateX, rotateY };
}


/**
 * Propagate gravity influence through neighbor graph
 * Only affects squares whose entrance animation has completed
 * Squares beyond influence radius automatically return to original state
 * 
 * @param squares - Array of square data
 * @param targetSquareId - ID of the square being hovered (source of gravity)
 * @param isPulled - If true, squares are pulled (positive Z), if false, pushed (negative Z)
 * @param elapsedTime - Elapsed time since grid appeared
 */
function propagateGravity(
  squares: SquareData[],
  targetSquareId: number,
  isPulled: boolean,
  elapsedTime: number
): void {
  // 0. Reset all gravity transforms to 0 for squares with completed entrance
  // This makes squares return to original state when cursor moves away
  squares.forEach(sq => {
    if (elapsedTime >= sq.entranceCompletionTime) {
      sq.gravityTransform = {
        translateZ: 0,
        rotateX: 0,
        rotateY: 0,
      };
      sq.propagationStrength = 0;
      sq.lastInfluenceParams = null;
    }
  });
  
  // 1. Find target square
  const targetSquare = squares.find(sq => sq.id === targetSquareId);
  if (!targetSquare || elapsedTime < targetSquare.entranceCompletionTime) {
    return;
  }
  
  // 2. Calculate initial influence using uniform strength
  const fullStrength = SQUARE_GRID_GRAVITY_FULL_STRENGTH_PX;
  const cappedStrength = Math.min(fullStrength, SQUARE_GRID_GRAVITY_MAX_Z_LIMIT_PX);
  
  // 3. Apply to target square (no rotation for the target itself)
  targetSquare.gravityTransform = {
    translateZ: isPulled ? cappedStrength : -cappedStrength,
    rotateX: 0,
    rotateY: 0,
  };
  targetSquare.propagationStrength = fullStrength; // Use full for propagation
  targetSquare.lastInfluenceParams = {
    sourceId: null, // Direct from hover
    strength: fullStrength,
    direction: { x: 0, y: 0 }, // Not used for grid-relative calculations
  };
  
  // 4. Propagate through neighbors
  const queue: Array<{ square: SquareData; strength: number }> = [
    { square: targetSquare, strength: fullStrength },
  ];
  const visited = new Set<number>();
  
  while (queue.length > 0) {
    const { square, strength } = queue.shift()!;
    if (visited.has(square.id)) continue;
    visited.add(square.id);
    
    // Propagate to neighbors with decay
    const decayedStrength = strength * SQUARE_GRID_GRAVITY_PROPAGATION_DECAY;
    if (decayedStrength < SQUARE_GRID_GRAVITY_MIN_INFLUENCE_THRESHOLD) continue;
    
    Object.values(square.neighbors).forEach((neighborId) => {
      if (neighborId === null || visited.has(neighborId)) return;
      
      const neighbor = squares[neighborId];
      if (!neighbor) return;
      
      // Skip neighbors whose entrance animation hasn't completed
      if (elapsedTime < neighbor.entranceCompletionTime) {
        return;
      }
      
      // Combine with existing influence (if any)
      const combinedStrength = Math.max(
        neighbor.propagationStrength || 0,
        decayedStrength
      );
      
      // Calculate transform using uniform strength
      const cappedStrength = Math.min(combinedStrength, SQUARE_GRID_GRAVITY_MAX_Z_LIMIT_PX);
      const tilt = calculateTiltTowardTarget(neighbor, targetSquare, cappedStrength);
      
      // Apply uniform transform regardless of screen position
      neighbor.gravityTransform = {
        translateZ: isPulled ? cappedStrength : -cappedStrength,
        rotateX: tilt.rotateX,
        rotateY: tilt.rotateY,
      };
      
      neighbor.propagationStrength = combinedStrength;
      neighbor.lastInfluenceParams = {
        sourceId: square.id,
        strength: decayedStrength,
        direction: { x: 0, y: 0 }, // Not used for grid-relative calculations
      };
      
      queue.push({ square: neighbor, strength: decayedStrength });
    });
  }
}

interface SquareGridProps {
  isVisible?: boolean;
}

export default function SquareGrid({ isVisible = false }: SquareGridProps) {
  const [gridDimensions, setGridDimensions] = useState({ columns: 20, rows: 20 });
  const [squareTransforms, setSquareTransforms] = useState<Array<{ x: number; y: number; rotation: number; appearDelay: number }>>([]);
  const [squareData, setSquareData] = useState<SquareData[]>([]);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const gridVisibleStartTimeRef = useRef<number | null>(null);
  
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
  // Also build neighbor graph and calculate square centers
  useEffect(() => {
    if (!gridRef.current) return;
    
    const gridRect = gridRef.current.getBoundingClientRect();
    const squareWithGap = SQUARE_GRID_SIZE_PX + SQUARE_GRID_GAP_PX;
    
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
    
    // Build neighbor graph and calculate square centers
    const data: SquareData[] = transforms.map((transform, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      
      // Calculate screen center coordinates
      const gridX = column * squareWithGap + SQUARE_GRID_SIZE_PX / 2;
      const gridY = row * squareWithGap + SQUARE_GRID_SIZE_PX / 2;
      const centerX = gridRect.left + gridX;
      const centerY = gridRect.top + gridY;
      
      // Build neighbor links
      const neighbors = {
        top: row > 0 ? index - columns : null,
        right: column < columns - 1 ? index + 1 : null,
        bottom: row < rows - 1 ? index + columns : null,
        left: column > 0 ? index - 1 : null,
      };
      
      // Calculate entrance animation completion time
      // Entrance completes when jiggle animation finishes
      const fadeInEnd = transform.appearDelay + SQUARE_GRID_FADE_IN_DURATION_MS;
      const transformDelay = fadeInEnd + SQUARE_GRID_TRANSFORM_DELAY_MS;
      const entranceCompletionTime = transformDelay;
      
      return {
        id: index,
        column,
        row,
        centerX,
        centerY,
        neighbors,
        baseTransform: { x: transform.x, y: transform.y, rotation: transform.rotation },
        entranceCompletionTime,
        gravityTransform: { translateZ: 0, rotateX: 0, rotateY: 0 },
        propagationStrength: 0,
        lastInfluenceParams: null,
      };
    });
    
    // Defer state update to avoid cascading renders
    queueMicrotask(() => {
      setSquareTransforms(transforms);
      setSquareData(data);
      // Set start time when squares are first created (when grid appears)
      if (gridVisibleStartTimeRef.current === null) {
        gridVisibleStartTimeRef.current = performance.now();
      }
    });
  }, [totalSquares, maxTranslation, columns, rows, centerColumn, centerRow, maxDistance]);

  // Store square data in ref to avoid dependency issues
  const squareDataRef = useRef<SquareData[]>([]);
  useEffect(() => {
    squareDataRef.current = squareData;
  }, [squareData]);

  // Reset start time when grid is completely hidden
  useEffect(() => {
    if (!isVisible && squareData.length === 0 && gridVisibleStartTimeRef.current !== null) {
      gridVisibleStartTimeRef.current = null;
    }
  }, [isVisible, squareData.length]);

  // Store refs to wrapper elements for direct DOM updates
  const wrapperRefsRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const hoveredSquareIdRef = useRef<number | null>(null);
  
  /**
   * Apply the current gravity transforms to DOM nodes and sync state.
   */
  const applyTransformsToDom = useCallback((updatedSquares: SquareData[]) => {
    for (const sq of updatedSquares) {
      const wrapperElement = wrapperRefsRef.current.get(sq.id);
      if (!wrapperElement) {
        continue;
      }
      const gravity = sq.gravityTransform;
      const translateZ = roundToDecimals(gravity.translateZ, SQUARE_GRID_GRAVITY_DECIMAL_PLACES);
      const rotateX = roundToDecimals(gravity.rotateX, SQUARE_GRID_GRAVITY_DECIMAL_PLACES);
      const rotateY = roundToDecimals(gravity.rotateY, SQUARE_GRID_GRAVITY_DECIMAL_PLACES);
      
      wrapperElement.style.setProperty('--gravity-translate-z', `${translateZ}px`);
      wrapperElement.style.setProperty('--gravity-rotate-x', `${rotateX}deg`);
      wrapperElement.style.setProperty('--gravity-rotate-y', `${rotateY}deg`);
    }
    
    setSquareData(updatedSquares);
  }, []);
  
  /**
   * Recalculate gravity influence when hovered square changes.
   */
  const applyGravityForSquare = useCallback(
    (squareId: number | null) => {
      if (!gridRef.current || gridVisibleStartTimeRef.current === null || squareDataRef.current.length === 0) {
        return;
      }
      
      const gridRect = gridRef.current.getBoundingClientRect();
      const squareWithGap = SQUARE_GRID_SIZE_PX + SQUARE_GRID_GAP_PX;
      const currentSquareData = squareDataRef.current.map(sq => ({ ...sq }));
      
      currentSquareData.forEach(sq => {
        const gridX = sq.column * squareWithGap + SQUARE_GRID_SIZE_PX / 2;
        const gridY = sq.row * squareWithGap + SQUARE_GRID_SIZE_PX / 2;
        sq.centerX = gridRect.left + gridX;
        sq.centerY = gridRect.top + gridY;
      });
      
      const elapsedTime = performance.now() - gridVisibleStartTimeRef.current;
      
      if (squareId === null) {
        currentSquareData.forEach(sq => {
          if (elapsedTime >= sq.entranceCompletionTime) {
            sq.gravityTransform = { translateZ: 0, rotateX: 0, rotateY: 0 };
            sq.propagationStrength = 0;
            sq.lastInfluenceParams = null;
          }
        });
        applyTransformsToDom(currentSquareData);
        return;
      }
      
      const targetSquare = currentSquareData.find(sq => sq.id === squareId);
      if (!targetSquare) {
        return;
      }
      
      // Use push mode (squares are pushed down, negative Z) by default
      // Set to true for pull mode (squares are pulled up, positive Z)
      propagateGravity(
        currentSquareData,
        squareId,
        SQUARE_GRID_GRAVITY_IS_INVERTED, // false = push (default), true = pull
        elapsedTime,
      );
      
      applyTransformsToDom(currentSquareData);
    },
    [applyTransformsToDom],
  );
  
  const handleSquarePointerEnter = useCallback(
    (squareId: number) => {
      if (!isVisible || hoveredSquareIdRef.current === squareId) {
        return;
      }
      hoveredSquareIdRef.current = squareId;
      applyGravityForSquare(squareId);
    },
    [applyGravityForSquare, isVisible],
  );
  
  const handleGridPointerLeave = useCallback(() => {
    if (hoveredSquareIdRef.current === null) {
      return;
    }
    hoveredSquareIdRef.current = null;
    applyGravityForSquare(null);
  }, [applyGravityForSquare]);
  
  useEffect(() => {
    if (!isVisible) {
      hoveredSquareIdRef.current = null;
      applyGravityForSquare(null);
    }
  }, [applyGravityForSquare, isVisible]);

  return (
    <div
      ref={gridRef}
      className={styles['squareGrid']}
      style={{
        '--square-size': `${SQUARE_GRID_SIZE_PX}px`,
        '--square-gap': `${SQUARE_GRID_GAP_PX}px`,
        '--square-border-width': `${SQUARE_GRID_BORDER_WIDTH_PX}px`,
        '--square-border-color': SQUARE_GRID_BORDER_COLOR,
        '--square-background-color': SQUARE_GRID_BACKGROUND_COLOR,
        '--grid-columns': columns,
        '--grid-rows': rows,
        pointerEvents: isVisible ? 'auto' : 'none',
      } as React.CSSProperties}
      onPointerLeave={handleGridPointerLeave}
      data-testid="square-grid"
    >
      {Array.from({ length: totalSquares }, (_, index) => {
        const transform = squareTransforms[index] || { x: 0, y: 0, rotation: 0, appearDelay: 0 };
        const gravity = squareData[index]?.gravityTransform || { translateZ: 0, rotateX: 0, rotateY: 0 };
        
        // Calculate row position for z-index stacking
        // Top rows should have higher z-index than bottom rows
        const row = Math.floor(index / columns);
        const baseZIndex = rows - row; // Top row (0) gets highest z-index (rows), bottom row gets lowest (1)
        
        const fadeInEnd = transform.appearDelay + SQUARE_GRID_FADE_IN_DURATION_MS;
        const transformDelay = fadeInEnd + SQUARE_GRID_TRANSFORM_DELAY_MS;
        const jiggleDelay = transformDelay - SQUARE_GRID_JIGGLE_DURATION_MS;
        
        return (
          <div
            key={index}
            ref={(el) => {
              if (el) {
                wrapperRefsRef.current.set(index, el);
              } else {
                wrapperRefsRef.current.delete(index);
              }
            }}
            className={styles['squareWrapper']}
            onPointerEnter={() => handleSquarePointerEnter(index)}
            style={{
              '--base-translate-x': `${transform.x}px`,
              '--base-translate-y': `${transform.y}px`,
              '--base-rotate': `${transform.rotation}deg`,
              '--gravity-translate-z': `${gravity.translateZ}px`,
              '--gravity-rotate-x': `${gravity.rotateX}deg`,
              '--gravity-rotate-y': `${gravity.rotateY}deg`,
              zIndex: baseZIndex,
            } as React.CSSProperties}
            data-testid={`square-wrapper-${index}`}
          >
            <div
              className={styles['square']}
              style={{
                '--fade-in-delay': isVisible ? `${transform.appearDelay}ms` : '0ms',
                '--fade-in-duration': `${SQUARE_GRID_FADE_IN_DURATION_MS}ms`,
                '--jiggle-delay': isVisible ? `${jiggleDelay}ms` : '0ms',
                '--jiggle-duration': `${SQUARE_GRID_JIGGLE_DURATION_MS}ms`,
                '--jiggle-intensity': `${SQUARE_GRID_JIGGLE_INTENSITY_PX}px`,
                ...(isVisible
                  ? {}
                  : {
                      opacity: 0,
                      visibility: 'hidden',
                      animation: 'none',
                    }),
              } as React.CSSProperties}
              data-testid={`square-${index}`}
            />
          </div>
        );
      })}
    </div>
  );
}
