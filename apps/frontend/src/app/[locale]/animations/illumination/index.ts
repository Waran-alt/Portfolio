/**
 * @file Illumination Module Exports
 * 
 * Central export point for the dynamic directional illumination system.
 */

export { IlluminationEffect } from './IlluminationEffect';
export type { IlluminationEffectProps } from './IlluminationEffect';

export { calculatePlaneIllumination, rgbToHex, hexToRgb } from './illuminationMath';
export { calculateDistanceAttenuation, calculateAngleBrightness } from './illuminationMath';

export {
  vectorMagnitude,
  vectorNormalize,
  vectorDot,
  vectorDistance,
  vectorDirection,
  vectorTransform,
} from './vectorMath';

export type {
  Vector3,
  RGB,
  LightConfig,
  MaterialConfig,
  Plane,
  IlluminationResult,
} from './types';

export {
  DEFAULT_LIGHT_CONFIG,
  DEFAULT_MATERIAL_CONFIG,
  MIN_DOT_PRODUCT,
  MIN_DISTANCE,
} from './constants';

