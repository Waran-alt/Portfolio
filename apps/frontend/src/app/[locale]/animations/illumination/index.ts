/**
 * @file Illumination Module Exports
 * 
 * Central export point for the dynamic directional illumination system.
 */

export { IlluminationEffect } from './IlluminationEffect';
export type { IlluminationEffectProps } from './IlluminationEffect';

export { calculateAngleBrightness, calculateDistanceAttenuation, calculatePlaneIllumination, hexToRgb, rgbToHex } from './illuminationMath';

export {
  vectorDirection, vectorDistance, vectorDot, vectorMagnitude,
  vectorNormalize, vectorTransform
} from './vectorMath';

export type {
  IlluminationResult, LightConfig,
  MaterialConfig,
  Plane, RGB, Vector3
} from './types';

export {
  DEFAULT_LIGHT_CONFIG,
  DEFAULT_MATERIAL_CONFIG, MATRIX_DEFAULT_VALUE, MIN_BRIGHTNESS_THRESHOLD, MIN_DISTANCE, MIN_DOT_PRODUCT, OPACITY_MAX, OPACITY_MIN, OVERLAY_Z_INDEX
} from './constants';

