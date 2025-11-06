/**
 * @file Illumination Constants
 * 
 * Default configurations and constants for the illumination system.
 */

import type { LightConfig, MaterialConfig, RGB, Vector3 } from './types';

// ============================================================================
// Color Constants
// ============================================================================

/**
 * Maximum RGB color value
 */
export const RGB_MAX = 255;

/**
 * Minimum RGB color value
 */
export const RGB_MIN = 0;

/**
 * Color normalization divisor (RGB values are 0-255)
 */
export const RGB_NORMALIZATION_DIVISOR = 255;

/**
 * Hex color radix (base 16)
 */
export const HEX_RADIX = 16;

/**
 * Hex color padding length
 */
export const HEX_PADDING_LENGTH = 2;

/**
 * Default black RGB color
 */
export const RGB_BLACK: RGB = { r: 0, g: 0, b: 0 };

/**
 * Hex color validation regex pattern
 */
export const HEX_COLOR_REGEX = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;

// ============================================================================
// Vector Constants
// ============================================================================

/**
 * Zero magnitude threshold for vector normalization
 */
export const ZERO_MAGNITUDE_THRESHOLD = 0;

/**
 * Default forward vector (used when normalizing zero vector)
 */
export const DEFAULT_FORWARD_VECTOR: Vector3 = { x: 0, y: 0, z: 1 };

// ============================================================================
// Illumination Calculation Constants
// ============================================================================

/**
 * Minimum dot product value to avoid negative illumination
 */
export const MIN_DOT_PRODUCT = 0.0;

/**
 * Minimum distance to avoid division by zero in attenuation
 */
export const MIN_DISTANCE = 0.1;

/**
 * Multiplicative blend base factor (1.0 for brightening)
 */
export const MULTIPLICATIVE_BLEND_BASE = 1.0;

/**
 * Brightness amplification factor for visible illumination effects
 * Multiplies brightness to make illumination more noticeable
 */
export const BRIGHTNESS_AMPLIFICATION = 500.0;

// ============================================================================
// Component Defaults
// ============================================================================

/**
 * Default CSS property for illumination effect
 */
export const DEFAULT_CSS_PROPERTY = 'backgroundColor';

// ============================================================================
// Default Configurations
// ============================================================================

/**
 * Default light configuration
 */
export const DEFAULT_LIGHT_CONFIG: LightConfig = {
  position: { x: 0, y: 0, z: 100 },
  color: { r: 255, g: 255, b: 255 },
  intensity: 1.0,
  attenuation: 0.01,
};

/**
 * Default material configuration
 */
export const DEFAULT_MATERIAL_CONFIG: MaterialConfig = {
  baseColor: { r: 100, g: 100, b: 200 },
  reflectivity: 0.5,
  blendMode: 'multiply',
};

