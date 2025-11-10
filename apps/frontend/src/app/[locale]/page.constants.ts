/**
 * @file Landing Page Constants
 * 
 * Constants specific to the landing page cube and illumination configuration.
 */

import type { LightConfig, MaterialConfig, Vector3 } from './animations/illumination';

// ============================================================================
// Cube Geometry Constants
// ============================================================================

/**
 * Cube size in pixels (width, height, depth)
 */
export const CUBE_SIZE_PX = 160;

/**
 * Half cube size (face offset from center)
 */
export const CUBE_HALF_SIZE = CUBE_SIZE_PX / 2;

/**
 * Base normals for each cube face (in local cube space)
 */
export const BASE_NORMALS = {
  front: { x: 0, y: 0, z: 1 } as Vector3,
  back: { x: 0, y: 0, z: -1 } as Vector3,
  right: { x: 1, y: 0, z: 0 } as Vector3,
  left: { x: -1, y: 0, z: 0 } as Vector3,
  top: { x: 0, y: 1, z: 0 } as Vector3,
  bottom: { x: 0, y: -1, z: 0 } as Vector3,
} as const satisfies Record<string, Vector3>;

/**
 * Base positions for each cube face (in local cube space)
 * Faces are positioned at half cube size from center
 */
export const BASE_POSITIONS = {
  front: { x: 0, y: 0, z: CUBE_HALF_SIZE } as Vector3,
  back: { x: 0, y: 0, z: -CUBE_HALF_SIZE } as Vector3,
  right: { x: CUBE_HALF_SIZE, y: 0, z: 0 } as Vector3,
  left: { x: -CUBE_HALF_SIZE, y: 0, z: 0 } as Vector3,
  top: { x: 0, y: CUBE_HALF_SIZE, z: 0 } as Vector3,
  bottom: { x: 0, y: -CUBE_HALF_SIZE, z: 0 } as Vector3,
} as const satisfies Record<string, Vector3>;

// ============================================================================
// Light Configuration Constants
// ============================================================================

/**
 * Initial light Z position (distance from cube center)
 */
export const LIGHT_INITIAL_Z = 300;

/**
 * Light Z position when following cursor (distance from cube center)
 */
export const LIGHT_CURSOR_Z = 300;

/**
 * Mouse position scaling factor for light position
 * Scales down mouse movement for smoother light following
 */
export const MOUSE_POSITION_SCALE = 0.5;

// ============================================================================
// Material Configuration Constants
// ============================================================================

/**
 * Cube face base color (gray-800)
 */
export const CUBE_BASE_COLOR = { r: 31, g: 41, b: 55 };

/**
 * Cube face reflectivity (0.0 = matte, 1.0 = fully reflective)
 */
export const CUBE_REFLECTIVITY = 0.1;

/**
 * Default material configuration for cube faces
 */
export const CUBE_MATERIAL_CONFIG: MaterialConfig = {
  baseColor: CUBE_BASE_COLOR,
  reflectivity: CUBE_REFLECTIVITY,
  blendMode: 'multiply',
};

/**
 * Deterministic light configuration for the landing page cube
 */
export const HOME_PAGE_LIGHT_CONFIG: LightConfig = {
  position: { x: 0, y: 0, z: LIGHT_INITIAL_Z },
  color: { r: 255, g: 255, b: 255 },
  intensity: 1,
  attenuation: 0,
};

