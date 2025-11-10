'use client';

/**
 * @file Illumination Effect Component
 * 
 * React component that applies dynamic directional illumination to plane surfaces.
 * Updates plane colors based on light position, plane orientation, and material configuration.
 * Optimized with requestAnimationFrame for smooth, performant updates.
 */

import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';
import { BRIGHTNESS_AMPLIFICATION, MIN_BRIGHTNESS_THRESHOLD, OPACITY_MAX, OPACITY_MIN, OVERLAY_Z_INDEX } from './constants';
import { calculatePlaneIllumination, rgbToHex } from './illuminationMath';
import type { LightConfig, MaterialConfig, Vector3 } from './types';

/**
 * Props for IlluminationEffect component
 */
export interface IlluminationEffectProps {
  /** Plane position in 3D space */
  planePosition: Vector3;
  /** Plane normal vector (must be normalized) */
  planeNormal: Vector3;
  /** Light source configuration */
  lightConfig: LightConfig;
  /** Material configuration */
  materialConfig: MaterialConfig;
  /** Ref to the DOM element (plane container) */
  elementRef: RefObject<HTMLElement | null>;
  /** Optional ref for dynamic plane position (overrides planePosition if provided) */
  positionRef?: RefObject<Vector3>;
  /** Optional ref for dynamic plane normal (overrides planeNormal if provided) */
  normalRef?: RefObject<Vector3>;
}

/**
 * Applies dynamic illumination to a single plane surface
 * 
 * Updates the element's background color based on:
 * - Angle between plane normal and light direction
 * - Distance from light to plane
 * - Light color and intensity
 * - Material base color and reflectivity
 * - Blending mode (multiply or additive)
 * 
 * Optimized with requestAnimationFrame to batch updates and reduce DOM writes.
 */
export function IlluminationEffect({
  planePosition,
  planeNormal,
  lightConfig,
  materialConfig,
  elementRef,
  positionRef,
  normalRef,
}: IlluminationEffectProps) {
  // Store latest config values for RAF updates
  const configRef = useRef({
    planePosition,
    planeNormal,
    lightConfig,
    materialConfig,
    elementRef,
    positionRef,
    normalRef,
  });

  // Ref to the overlay element (created dynamically)
  const overlayRef = useRef<HTMLDivElement | null>(null);

  // RAF ID for animation loop
  const rafIdRef = useRef<number | null>(null);

  // Update config ref when props change
  useEffect(() => {
    configRef.current = {
      planePosition,
      planeNormal,
      lightConfig,
      materialConfig,
      elementRef,
      positionRef,
      normalRef,
    };
  }, [planePosition, planeNormal, lightConfig, materialConfig, elementRef, positionRef, normalRef]);

  // Create overlay element on mount
  useEffect(() => {
    if (!elementRef.current || overlayRef.current) return;

    const container = elementRef.current;

    // Create overlay div for illumination effect
    const overlay = document.createElement('div');
    overlay.className = 'illumination-overlay';
    // Use 'screen' blend mode to brighten the base color with light
    // Screen inverts both colors, multiplies, then inverts: creates brightening effect
    // This works for both multiply and additive material blend modes
    overlay.style.cssText = `
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: ${OVERLAY_Z_INDEX};
      mix-blend-mode: screen;
    `;
    
    container.appendChild(overlay);
    overlayRef.current = overlay;

    return () => {
      if (overlayRef.current && container && container.contains(overlayRef.current)) {
        container.removeChild(overlayRef.current);
        overlayRef.current = null;
      }
    };
  }, [elementRef, materialConfig.blendMode]);

  // RAF-based update loop for smooth, optimized updates
  useEffect(() => {
    if (!overlayRef.current) {
      console.warn('⚠️ IlluminationEffect: overlayRef.current is null on mount');
      return;
    }

    const update = () => {
      const config = configRef.current;
      if (!overlayRef.current) return;

      // Use dynamic refs if provided, otherwise use static props
      const currentPosition = config.positionRef?.current ?? config.planePosition;
      const currentNormal = config.normalRef?.current ?? config.planeNormal;

      // Calculate brightness only (we use light color directly on overlay)
      const { brightness } = calculatePlaneIllumination(
        currentPosition,
        currentNormal,
        config.lightConfig,
        config.materialConfig
      );

      // Get light color for overlay
      const lightColorHex = rgbToHex(
        config.lightConfig.color.r,
        config.lightConfig.color.g,
        config.lightConfig.color.b
      );
      
      // Calculate opacity from brightness and reflectivity
      // Amplify brightness for visible effect, then apply reflectivity
      const baseOpacity = Math.min(OPACITY_MAX, Math.max(OPACITY_MIN, brightness * BRIGHTNESS_AMPLIFICATION));
      const opacity = baseOpacity * config.materialConfig.reflectivity;

      // When brightness is 0 or negative, opacity should be 0
      // Note: With illuminateBackFaces enabled, brightness uses absolute value of dot product,
      // so back faces are illuminated. Without it, back faces get brightness 0.
      const finalOpacity = brightness <= MIN_BRIGHTNESS_THRESHOLD ? OPACITY_MIN : opacity;

      // Update DOM every frame for smooth animation
      overlayRef.current.style.backgroundColor = lightColorHex;
      overlayRef.current.style.opacity = finalOpacity.toString();

      // Continue animation loop
      rafIdRef.current = requestAnimationFrame(update);
    };

    // Start animation loop
    rafIdRef.current = requestAnimationFrame(update);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [overlayRef]);

  // Component doesn't render anything, it only updates element styles
  return null;
}

