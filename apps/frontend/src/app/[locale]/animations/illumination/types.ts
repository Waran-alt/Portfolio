/**
 * @file Illumination Types
 * 
 * Type definitions for the dynamic directional illumination system.
 */

/**
 * 3D vector representation
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * RGB color representation
 */
export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Light source configuration
 */
export interface LightConfig {
  /** Light position in 3D space */
  position: Vector3;
  /** Light color (RGB values 0-255) */
  color: RGB;
  /** Light intensity (0.0 to 1.0) */
  intensity: number;
  /** Distance attenuation factor (higher = faster falloff) */
  attenuation: number;
}

/**
 * Material configuration for illuminated objects
 */
export interface MaterialConfig {
  /** Base color of the material (RGB values 0-255) */
  baseColor: RGB;
  /** Reflectivity factor (0.0 = matte, 1.0 = fully reflective) */
  reflectivity: number;
  /** Blending mode: 'multiply' or 'additive' */
  blendMode: 'multiply' | 'additive';
  /** If true, illuminate faces even when facing away from light (uses absolute value of dot product) */
  illuminateBackFaces?: boolean;
}

/**
 * Plane definition for illumination calculation
 */
export interface Plane {
  /** Unique identifier */
  id: string;
  /** Center position in 3D space */
  position: Vector3;
  /** Normal vector (must be normalized) */
  normal: Vector3;
  /** Material configuration */
  material: MaterialConfig;
}

/**
 * Calculated illumination result for a plane
 */
export interface IlluminationResult {
  /** Final RGB color after illumination */
  color: RGB;
  /** Brightness factor (0.0 to 1.0+) */
  brightness: number;
}

