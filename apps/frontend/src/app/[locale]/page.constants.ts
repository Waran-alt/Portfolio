/**
 * @file Landing Page Constants
 * 
 * Constants specific to the landing page cube and illumination configuration.
 */

import type { LightConfig, MaterialConfig, Vector3 } from './animations/illumination';

export type CubeCornerOffset = {
  key: string;
  x: number;
  y: number;
  z: number;
};

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

/**
 * Inner cube size ratio (relative to outer cube)
 */
export const INNER_CUBE_SIZE_RATIO = 0.4;

/**
 * Inner cube size in pixels
 */
export const INNER_CUBE_SIZE_PX = CUBE_SIZE_PX * INNER_CUBE_SIZE_RATIO;

/**
 * Half inner cube size (face offset from center)
 */
export const INNER_CUBE_HALF_SIZE = INNER_CUBE_SIZE_PX / 2;

/**
 * Inner cube expansion scale when mouse/key is pressed
 */
export const INNER_CUBE_EXPAND_SCALE = 1 / INNER_CUBE_SIZE_RATIO;

/**
 * Inner cube expansion duration in milliseconds (ease-out)
 */
export const INNER_CUBE_EXPAND_DURATION_MS = 3000;

/**
 * Inner cube contraction duration in milliseconds (swift return)
 */
export const INNER_CUBE_CONTRACT_DURATION_MS = 300;

/**
 * Inner cube pulse scale (how much it expands during pulse animation)
 */
export const INNER_CUBE_PULSE_SCALE = 1.15;

/**
 * Maximum vibration intensity in pixels (applied to outer cube during expansion)
 */
export const CUBE_VIBRATION_MAX_INTENSITY_PX = 4;

/**
 * Vibration frequency (oscillations per second)
 */
export const CUBE_VIBRATION_FREQUENCY_HZ = 12;

/**
 * Corner positions relative to cube center for guide lines (outer cube)
 */
export const CUBE_CORNER_OFFSETS: readonly CubeCornerOffset[] = [
  { key: 'front-top-right', x: CUBE_HALF_SIZE, y: -CUBE_HALF_SIZE, z: CUBE_HALF_SIZE },
  { key: 'front-top-left', x: -CUBE_HALF_SIZE, y: -CUBE_HALF_SIZE, z: CUBE_HALF_SIZE },
  { key: 'front-bottom-right', x: CUBE_HALF_SIZE, y: CUBE_HALF_SIZE, z: CUBE_HALF_SIZE },
  { key: 'front-bottom-left', x: -CUBE_HALF_SIZE, y: CUBE_HALF_SIZE, z: CUBE_HALF_SIZE },
  { key: 'back-top-right', x: CUBE_HALF_SIZE, y: -CUBE_HALF_SIZE, z: -CUBE_HALF_SIZE },
  { key: 'back-top-left', x: -CUBE_HALF_SIZE, y: -CUBE_HALF_SIZE, z: -CUBE_HALF_SIZE },
  { key: 'back-bottom-right', x: CUBE_HALF_SIZE, y: CUBE_HALF_SIZE, z: -CUBE_HALF_SIZE },
  { key: 'back-bottom-left', x: -CUBE_HALF_SIZE, y: CUBE_HALF_SIZE, z: -CUBE_HALF_SIZE },
] as const;

/**
 * Inner cube corner positions relative to cube center
 */
export const INNER_CUBE_CORNER_OFFSETS: readonly CubeCornerOffset[] = [
  { key: 'inner-front-top-right', x: INNER_CUBE_HALF_SIZE, y: -INNER_CUBE_HALF_SIZE, z: INNER_CUBE_HALF_SIZE },
  { key: 'inner-front-top-left', x: -INNER_CUBE_HALF_SIZE, y: -INNER_CUBE_HALF_SIZE, z: INNER_CUBE_HALF_SIZE },
  { key: 'inner-front-bottom-right', x: INNER_CUBE_HALF_SIZE, y: INNER_CUBE_HALF_SIZE, z: INNER_CUBE_HALF_SIZE },
  { key: 'inner-front-bottom-left', x: -INNER_CUBE_HALF_SIZE, y: INNER_CUBE_HALF_SIZE, z: INNER_CUBE_HALF_SIZE },
  { key: 'inner-back-top-right', x: INNER_CUBE_HALF_SIZE, y: -INNER_CUBE_HALF_SIZE, z: -INNER_CUBE_HALF_SIZE },
  { key: 'inner-back-top-left', x: -INNER_CUBE_HALF_SIZE, y: -INNER_CUBE_HALF_SIZE, z: -INNER_CUBE_HALF_SIZE },
  { key: 'inner-back-bottom-right', x: INNER_CUBE_HALF_SIZE, y: INNER_CUBE_HALF_SIZE, z: -INNER_CUBE_HALF_SIZE },
  { key: 'inner-back-bottom-left', x: -INNER_CUBE_HALF_SIZE, y: INNER_CUBE_HALF_SIZE, z: -INNER_CUBE_HALF_SIZE },
] as const;

/**
 * Ordered cube face keys for iteration
 */
export const CUBE_FACE_KEYS = ['front', 'back', 'right', 'left', 'top', 'bottom'] as const;

export type CubeFaceKey = (typeof CUBE_FACE_KEYS)[number];

const createCubeFaceTransforms = (halfSize: number): Record<CubeFaceKey, string> => ({
  front: `rotateY(0deg) translateZ(${halfSize}px)`,
  back: `rotateY(180deg) translateZ(${halfSize}px)`,
  right: `rotateY(90deg) translateZ(${halfSize}px)`,
  left: `rotateY(-90deg) translateZ(${halfSize}px)`,
  top: `rotateX(90deg) translateZ(${halfSize}px)`,
  bottom: `rotateX(-90deg) translateZ(${halfSize}px)`,
});

/**
 * Inner cube face transforms
 */
export const INNER_CUBE_FACE_TRANSFORMS = createCubeFaceTransforms(INNER_CUBE_HALF_SIZE);

export const CUBE_FACE_TRANSFORMS = createCubeFaceTransforms(CUBE_HALF_SIZE);

// ============================================================================
// Color Palette
// ============================================================================

/**
 * Base color values (RGB 0-255)
 */
export const COLORS = {
  // Dark grays (slate-900 range)
  darkGray: { r: 19, g: 21, b: 25 },
  darkGrayAlt: { r: 26, g: 28, b: 32 },
  darkGrayLight: { r: 31, g: 41, b: 55 },
  darkGrayLighter: { r: 34, g: 42, b: 55 },
  
  // Black
  black: { r: 0, g: 0, b: 0 },
  
  // Light blue accents (for glows and highlights)
  lightBlue: { r: 148, g: 181, b: 255 },
  lightBlueDark: { r: 191, g: 219, b: 254 },
  
  // Very dark green (for pulse glow)
  darkGreen: { r: 4, g: 8, b: 5 },
} as const;

/**
 * Helper to create rgba string from RGB object and opacity
 */
export const rgba = (color: { r: number; g: number; b: number }, opacity: number): string =>
  `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`;

/**
 * Helper to create rgb string from RGB object
 */
export const rgb = (color: { r: number; g: number; b: number }): string =>
  `rgb(${color.r}, ${color.g}, ${color.b})`;

// ============================================================================
// Cube Face Colors
// ============================================================================

export const CUBE_FACE_BACKGROUND = rgba(COLORS.darkGrayLight, 0.6); // #1f293799
export const CUBE_FACE_BORDER = rgba(COLORS.darkGray, 0.6); // #1a1c2099
export const CUBE_FACE_SHADOW = rgba(COLORS.black, 0.25);

export const INNER_CUBE_FACE_BACKGROUND = rgba(COLORS.darkGrayLight, 0.18);
export const INNER_CUBE_FACE_BORDER = rgba(COLORS.darkGray, 0.75);
export const INNER_CUBE_FACE_SHADOW = rgba(COLORS.black, 0.2);

// ============================================================================
// Tesseract Connecting Lines
// ============================================================================

export const TESSERACT_LINE_COLOR = rgba(COLORS.darkGrayAlt, 0.4);
export const TESSERACT_LINE_STROKE_WIDTH = 1;

// ============================================================================
// Entrance Animation Constants
// ============================================================================

/**
 * Initial delay before entrance animation starts (for script optimization)
 */
export const CUBE_ENTRANCE_INITIAL_DELAY_MS = 200;

/**
 * Total duration of the entrance animation sequence
 */
export const CUBE_ENTRANCE_DURATION_MS = 1000;

/**
 * Number of cube elements to animate (faces + corners + inner elements + lines)
 * Used to calculate staggered delays
 */
export const CUBE_ENTRANCE_ELEMENT_COUNT = 
  CUBE_FACE_KEYS.length + // 6 outer faces
  CUBE_CORNER_OFFSETS.length + // 8 outer corners
  CUBE_FACE_KEYS.length + // 6 inner faces
  INNER_CUBE_CORNER_OFFSETS.length + // 8 inner corners
  CUBE_CORNER_OFFSETS.length; // 8 tesseract lines

/**
 * Delay between each element appearing (in milliseconds)
 */
export const CUBE_ENTRANCE_STAGGER_DELAY_MS = 
  CUBE_ENTRANCE_DURATION_MS / CUBE_ENTRANCE_ELEMENT_COUNT;

// ============================================================================
// Cursor Guide Styling
// ============================================================================

export const CURSOR_GUIDE_GRADIENT_COLOR = rgb(COLORS.darkGrayLighter);

export const CURSOR_GUIDE_GRADIENT_STOPS = [
  { offset: '0%', opacity: 0 },
  { offset: '15%', opacity: 0 },
  { offset: '30%', opacity: 0.9 },
  { offset: '50%', opacity: 0.9 },
  { offset: '70%', opacity: 0 },
  { offset: '100%', opacity: 0 },
] as const;

// ============================================================================
// Cube Pulse Animation
// ============================================================================

export const CUBE_PULSE_SCALE = 1.25;
export const CUBE_PULSE_DURATION_MS = 1200;
export const CUBE_PULSE_DELAY_MS = 0;
export const CUBE_PULSE_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';
export const CUBE_PULSE_OPACITY_START = 0.7;
export const CUBE_PULSE_OPACITY_MID = 0.3;
export const CUBE_PULSE_OPACITY_END = 0;
export const CUBE_PULSE_GLOW_RADIUS_PX = 48;
export const CUBE_PULSE_GLOW_COLOR = rgba(COLORS.darkGreen, 0.05);
export const CUBE_PULSE_FACE_BACKGROUND = rgba(COLORS.darkGray, 0.18);
export const CUBE_PULSE_BORDER_COLOR = rgba(COLORS.darkGray, 0.75);
export const CUBE_PULSE_SECONDARY_DELAY_MS = 200;
export const CUBE_PULSE_SECONDARY_SCALE_MULTIPLIER = 1.02;
export const CUBE_PULSE_SECONDARY_OPACITY_START = 0.8;
export const CUBE_PULSE_SECONDARY_OPACITY_MID = 0.1;
export const CUBE_PULSE_THICKNESS_PX = 10;
export const CUBE_PULSE_EDGE_OPACITY = 0.42;
export const CUBE_PULSE_EDGE_BLUR_PX = 42;
export const CUBE_PULSE_LOOP_DELAY_MS = 400;
export const CUBE_PULSE_SECONDARY_LOOP_DELAY_MS = 400;

export const CUBE_PULSE_TRANSFORMS = createCubeFaceTransforms(CUBE_HALF_SIZE * CUBE_PULSE_SCALE);
export const CUBE_PULSE_SECONDARY_TRANSFORMS = createCubeFaceTransforms(
  CUBE_HALF_SIZE * CUBE_PULSE_SCALE * CUBE_PULSE_SECONDARY_SCALE_MULTIPLIER
);

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

