/**
 * @file Illumination Math
 * 
 * Core calculations for dynamic directional illumination.
 */

import {
  BRIGHTNESS_AMPLIFICATION,
  HEX_COLOR_REGEX,
  HEX_PADDING_LENGTH,
  HEX_RADIX,
  MIN_DISTANCE,
  MIN_DOT_PRODUCT,
  MULTIPLICATIVE_BLEND_BASE,
  RGB_BLACK,
  RGB_MAX,
  RGB_MIN,
  RGB_NORMALIZATION_DIVISOR,
} from './constants';
import type { LightConfig, MaterialConfig, RGB, Vector3 } from './types';
import { vectorDirection, vectorDistance, vectorDot } from './vectorMath';

/**
 * Calculate distance attenuation factor
 * Uses inverse square law with configurable attenuation strength
 */
export function calculateDistanceAttenuation(
  distance: number,
  attenuation: number
): number {
  const clampedDistance = Math.max(distance, MIN_DISTANCE);
  // Inverse square law: 1 / (1 + attenuation * distance^2)
  return MULTIPLICATIVE_BLEND_BASE / (MULTIPLICATIVE_BLEND_BASE + attenuation * clampedDistance * clampedDistance);
}

/**
 * Calculate brightness factor based on angle between light and surface normal
 * Uses dot product: 1.0 when facing light, 0.0 when perpendicular, negative when facing away
 * 
 * @param lightDirection - Direction vector from plane to light (normalized)
 * @param surfaceNormal - Surface normal vector (normalized)
 * @param illuminateBackFaces - If true, use absolute value so back faces are also illuminated
 */
export function calculateAngleBrightness(
  lightDirection: Vector3,
  surfaceNormal: Vector3,
  illuminateBackFaces: boolean = false
): number {
  const dotProduct = vectorDot(lightDirection, surfaceNormal);
  
  if (illuminateBackFaces) {
    // Use absolute value: -1 becomes 1, so back faces are illuminated
    return Math.abs(dotProduct);
  }
  
  // Clamp to minimum to avoid negative illumination (standard behavior)
  return Math.max(dotProduct, MIN_DOT_PRODUCT);
}

/**
 * Multiply RGB color by a scalar factor
 */
function multiplyRGB(rgb: RGB, factor: number): RGB {
  return {
    r: Math.round(rgb.r * factor),
    g: Math.round(rgb.g * factor),
    b: Math.round(rgb.b * factor),
  };
}

/**
 * Add two RGB colors
 */
function addRGB(a: RGB, b: RGB): RGB {
  return {
    r: Math.min(RGB_MAX, Math.round(a.r + b.r)),
    g: Math.min(RGB_MAX, Math.round(a.g + b.g)),
    b: Math.min(RGB_MAX, Math.round(a.b + b.b)),
  };
}


/**
 * Calculate illumination for a single plane surface
 */
export function calculatePlaneIllumination(
  planePosition: Vector3,
  planeNormal: Vector3,
  lightConfig: LightConfig,
  materialConfig: MaterialConfig
): { color: RGB; brightness: number } {
  // Calculate distance from light to plane
  const distance = vectorDistance(lightConfig.position, planePosition);
  
  // Calculate distance attenuation
  const distanceAttenuation = calculateDistanceAttenuation(
    distance,
    lightConfig.attenuation
  );
  
  // Calculate direction from plane to light (normalized)
  const lightDirection = vectorDirection(planePosition, lightConfig.position);
  
  // Calculate angle-based brightness (dot product with surface normal)
  const angleBrightness = calculateAngleBrightness(
    lightDirection,
    planeNormal,
    materialConfig.illuminateBackFaces ?? false
  );
  
  // Combine angle brightness, distance attenuation, and light intensity
  const brightness = angleBrightness * distanceAttenuation * lightConfig.intensity;
  
  // Amplify brightness for visible illumination effects
  const amplifiedBrightness = brightness * BRIGHTNESS_AMPLIFICATION;
  
  // Blend light color with material base color
  let finalColor: RGB;
  if (materialConfig.blendMode === 'multiply') {
    // Multiplicative blending: brightens material color where light hits
    // Normalize light color to 0-1 range
    const normalizedLight = {
      r: lightConfig.color.r / RGB_NORMALIZATION_DIVISOR,
      g: lightConfig.color.g / RGB_NORMALIZATION_DIVISOR,
      b: lightConfig.color.b / RGB_NORMALIZATION_DIVISOR,
    };
    
    // Calculate light contribution: baseColor * (1.0 + lightColor * amplifiedBrightness * reflectivity)
    // This produces visible brightening where light hits
    const reflectivityFactor = materialConfig.reflectivity;
    const lightContribution = amplifiedBrightness * reflectivityFactor;
    
    finalColor = {
      r: Math.round(materialConfig.baseColor.r * (MULTIPLICATIVE_BLEND_BASE + normalizedLight.r * lightContribution)),
      g: Math.round(materialConfig.baseColor.g * (MULTIPLICATIVE_BLEND_BASE + normalizedLight.g * lightContribution)),
      b: Math.round(materialConfig.baseColor.b * (MULTIPLICATIVE_BLEND_BASE + normalizedLight.b * lightContribution)),
    };
  } else {
    // Additive blending: adds light to material
    const effectiveLightColor = multiplyRGB(lightConfig.color, amplifiedBrightness);
    const lightContribution = multiplyRGB(effectiveLightColor, materialConfig.reflectivity);
    finalColor = addRGB(materialConfig.baseColor, lightContribution);
  }
  
  // Clamp RGB values to valid range
  finalColor.r = Math.max(RGB_MIN, Math.min(RGB_MAX, finalColor.r));
  finalColor.g = Math.max(RGB_MIN, Math.min(RGB_MAX, finalColor.g));
  finalColor.b = Math.max(RGB_MIN, Math.min(RGB_MAX, finalColor.b));
  
  return {
    color: finalColor,
    brightness,
  };
}

/**
 * Convert RGB color to hex string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${Math.round(r).toString(HEX_RADIX).padStart(HEX_PADDING_LENGTH, '0')}${Math.round(g).toString(HEX_RADIX).padStart(HEX_PADDING_LENGTH, '0')}${Math.round(b).toString(HEX_RADIX).padStart(HEX_PADDING_LENGTH, '0')}`;
}

/**
 * Convert hex string to RGB
 */
export function hexToRgb(hex: string): RGB {
  const result = HEX_COLOR_REGEX.exec(hex);
  if (!result || !result[1] || !result[2] || !result[3]) {
    return RGB_BLACK;
  }
  return {
    r: parseInt(result[1], HEX_RADIX),
    g: parseInt(result[2], HEX_RADIX),
    b: parseInt(result[3], HEX_RADIX),
  };
}

