/**
 * @file Entrance Delays Utility
 *
 * Utility functions for calculating entrance animation delays.
 */

import {
  CUBE_CORNER_OFFSETS,
  CUBE_ENTRANCE_DURATION_MS,
  CUBE_ENTRANCE_INITIAL_DELAY_MS,
  CUBE_ENTRANCE_STAGGER_DELAY_MS,
  CUBE_FACE_KEYS,
  INNER_CUBE_CORNER_OFFSETS,
} from '../page.constants';

/**
 * Calculate entrance delay for each element based on its index
 */
function getEntranceDelay(elementIndex: number): number {
  return CUBE_ENTRANCE_INITIAL_DELAY_MS + (elementIndex * CUBE_ENTRANCE_STAGGER_DELAY_MS);
}

/**
 * Pre-calculate entrance delays for all cube elements.
 *
 * Elements are ordered as:
 * 1. Outer cube faces (6)
 * 2. Outer corners (8)
 * 3. Inner cube faces (6)
 * 4. Inner corners (8)
 * 5. Tesseract lines (8)
 *
 * @returns Array of entrance delays in milliseconds
 */
export function calculateEntranceDelays(): number[] {
  const delays: number[] = [];
  let index = 0;

  // Outer cube faces (6)
  for (let i = 0; i < CUBE_FACE_KEYS.length; i++) {
    delays.push(getEntranceDelay(index++));
  }

  // Outer corners (8)
  for (let i = 0; i < CUBE_CORNER_OFFSETS.length; i++) {
    delays.push(getEntranceDelay(index++));
  }

  // Inner cube faces (6)
  for (let i = 0; i < CUBE_FACE_KEYS.length; i++) {
    delays.push(getEntranceDelay(index++));
  }

  // Inner corners (8)
  for (let i = 0; i < INNER_CUBE_CORNER_OFFSETS.length; i++) {
    delays.push(getEntranceDelay(index++));
  }

  // Tesseract lines (8)
  for (let i = 0; i < CUBE_CORNER_OFFSETS.length; i++) {
    delays.push(getEntranceDelay(index++));
  }

  return delays;
}

/**
 * Total entrance animation duration including initial delay
 */
export const TOTAL_ENTRANCE_DURATION_MS =
  CUBE_ENTRANCE_INITIAL_DELAY_MS + CUBE_ENTRANCE_DURATION_MS;

