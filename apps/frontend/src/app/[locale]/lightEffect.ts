/**
 * @file Light Effect Module
 * 
 * Provides a smooth, discrete light effect that follows the cursor.
 * Uses radial gradient with smooth interpolation for a responsive feel.
 */

import { RefObject } from 'react';
import {
  BG_GRADIENT_END,
  BG_GRADIENT_START,
  LIGHT_COLOR_RGB,
  LIGHT_INITIAL_X,
  LIGHT_INITIAL_Y,
  LIGHT_OPACITY,
  LIGHT_RADIUS_PERCENT,
  LIGHT_SMOOTH_FACTOR,
} from './landing.constants';

export interface LightPosition {
  x: number;
  y: number;
}

/**
 * Creates a smooth light-following effect that responds to mouse movement.
 * 
 * @param lightPositionRef Reference to current light position state
 * @returns Cleanup function to remove event listeners
 */
export const createLightEffect = (
  lightPositionRef: RefObject<LightPosition>
): (() => void) => {
  let rafId: number | null = null;
  let targetPosition = { x: LIGHT_INITIAL_X, y: LIGHT_INITIAL_Y };
  const currentPosition = { x: LIGHT_INITIAL_X, y: LIGHT_INITIAL_Y };

  /**
   * Smooth interpolation loop for discrete light movement
   * Uses requestAnimationFrame for smooth updates
   */
  const animate = () => {
    const dx = targetPosition.x - currentPosition.x;
    const dy = targetPosition.y - currentPosition.y;

    // Apply smooth interpolation for responsive feel
    currentPosition.x += dx * LIGHT_SMOOTH_FACTOR;
    currentPosition.y += dy * LIGHT_SMOOTH_FACTOR;

    if (lightPositionRef.current) {
      lightPositionRef.current.x = currentPosition.x;
      lightPositionRef.current.y = currentPosition.y;
    }

    rafId = requestAnimationFrame(animate);
  };

  rafId = requestAnimationFrame(animate);

  /**
   * Mouse move handler: updates target position for smooth interpolation
   */
  const handleMouseMove = (e: MouseEvent) => {
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    targetPosition = { x, y };
  };

  window.addEventListener('mousemove', handleMouseMove);

  return () => {
    window.removeEventListener('mousemove', handleMouseMove);
    if (rafId) cancelAnimationFrame(rafId);
  };
};

/**
 * Generates CSS background gradient string for light effect
 * 
 * @param position Light position (x, y as percentages 0-100)
 * @returns CSS radial-gradient string
 */
export const createLightGradient = (position: LightPosition): string => {
  return `radial-gradient(circle at ${position.x}% ${position.y}%, rgba(${LIGHT_COLOR_RGB}, ${LIGHT_OPACITY}), transparent ${LIGHT_RADIUS_PERCENT}%), linear-gradient(to bottom, ${BG_GRADIENT_START}, ${BG_GRADIENT_END})`;
};

