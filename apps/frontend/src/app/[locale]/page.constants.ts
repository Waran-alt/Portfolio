/**
 * @file Landing Page Constants
 * 
 * Constants specific to the landing page cube and illumination configuration.
 */

import type { LightConfig, MaterialConfig } from './animations/illumination';

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

// ============================================================================
// Cube Face Configuration
// ============================================================================

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
 * Outer cube face transforms
 */
export const CUBE_FACE_TRANSFORMS = createCubeFaceTransforms(CUBE_HALF_SIZE);

/**
 * Inner cube face transforms
 */
export const INNER_CUBE_FACE_TRANSFORMS = createCubeFaceTransforms(INNER_CUBE_HALF_SIZE);

// ============================================================================
// Cube Corner Positions
// ============================================================================

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

export const CUBE_FACE_BACKGROUND = rgba(COLORS.darkGrayLight, 0.6);
export const CUBE_FACE_BORDER = rgba(COLORS.darkGray, 0.6);
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
// Entrance Animation Constants
// ============================================================================

/**
 * ANIMATION SEQUENCE OVERVIEW:
 * 
 * The entrance animation consists of 3 sequential stages:
 * 
 * Stage 1: Inner Cube Materialization
 *   - Inner cube fades in at center
 *   - Cube rotates to perspective view
 *   - Duration: ~1500ms total
 * 
 * Stage 2: Outer Face Assembly
 *   - 6 outer faces fade in with stagger
 *   - Each face performs a "crash" animation (backstep → accelerate → impact)
 *   - Faces trigger structure bounce on impact
 *   - Duration: ~1600ms total (varies with stagger)
 * 
 * Stage 3: Connecting Line Growth
 *   - 8 lines grow from inner cube corners to outer cube corners
 *   - Lines fade in and grow with stagger
 *   - Duration: ~280ms total (varies with stagger)
 * 
 * After all stages complete:
 *   - Cursor becomes visible
 *   - Interactive cube rotation begins (follows cursor)
 *   - Pulse animation starts
 *   - Guide lines become interactive
 */

/**
 * Initial delay before entrance animation starts (for script optimization)
 * This gives the page time to load and render before animations begin.
 */
export const CUBE_ENTRANCE_INITIAL_DELAY_MS = 200;

// ============================================================================
// Stage 1: Inner Cube Materialization
// ============================================================================

/**
 * Stage 1: Delay before inner cube starts materializing (after initial delay)
 * The inner cube waits briefly before appearing to ensure smooth start.
 */
export const STAGE1_INNER_CUBE_DELAY_MS = 100;

/**
 * Stage 1: Duration of inner cube sharp fade-in animation
 * The inner cube fades in from opacity 0 to 1 using ease-out timing.
 * This creates a sharp, materialized appearance.
 */
export const STAGE1_INNER_CUBE_FADE_DURATION_MS = 300;

/**
 * Stage 1: Delay after inner cube materializes before cube rotation begins
 * Brief pause after fade-in completes, then rotation starts.
 * This creates a clear separation between fade and rotation phases.
 */
export const STAGE1_ROTATION_DELAY_MS = 400;

/**
 * Stage 1: Duration of rotation animation to initial perspective pose
 * The cube rotates from its initial position (0,0,0) to a perspective view
 * using a bouncy ease-out curve for a dynamic feel.
 */
export const STAGE1_ROTATION_DURATION_MS = 700;

/**
 * Cube animation: Delay after entrance completes before cube animations (pulse and rotation) start
 * After Stage 1 rotation completes, there's a brief pause before interactive animations begin.
 * This ensures the entrance sequence feels complete before interactivity starts.
 */
export const CUBE_ANIMATION_START_DELAY_MS = 50;

// ============================================================================
// Stage 2: Outer Face Assembly
// ============================================================================

/**
 * Stage 2: Delay after Stage 1 completes before outer faces start assembling
 * 
 * NOTE: Negative values allow Stage 2 to overlap with Stage 1 rotation.
 * This creates a more dynamic, overlapping animation sequence.
 * 
 * Helps keep DOM minimal until the simulation begins.
 */
export const STAGE2_START_AFTER_STAGE1_MS = -200;

/**
 * Stage 2: Fade-in configuration for simulated faces before crash animation
 * 
 * Each face fades in sequentially before performing its crash animation.
 * This creates a staggered appearance effect.
 */
export const STAGE2_FACE_FADE_DURATION_MS = 100;
/**
 * Stagger between each face's fade-in start time.
 * Face 0 starts immediately, Face 1 starts after 100ms, Face 2 after 200ms, etc.
 */
export const STAGE2_FACE_FADE_STAGGER_MS = 100;

/**
 * Stage 2: Outer face crash animation configuration
 * 
 * The crash animation consists of 3 phases:
 * 1. Hold: Face appears and stays still briefly
 * 2. Backstep: Face moves backward (ease-out) with jiggle for momentum
 * 3. Crash: Face accelerates forward (strong ease-in) to final position
 * 
 * On impact, the entire structure bounces to simulate collision.
 */
export const STAGE2_FACE_CRASH_DELAY_MS = 100; // Delay after fade-in completes before crash starts
export const STAGE2_FACE_CRASH_DURATION_MS = 400; // Total duration of crash animation (hold + backstep + crash)
export const STAGE2_FACE_OFFSET_Z_PX = 140; // Initial Z offset (how far away face starts)
export const STAGE2_FACE_EASING = 'cubic-bezier(.73,-0.3,.83,.67)'; // Strong ease-in for crash acceleration
export const STAGE2_FACE_BACKSTEP_DELTA_PX = 16; // How far backward face moves before accelerating

/**
 * Stage 2: Per-face stagger between crash animation starts
 * 
 * Each subsequent face's crash animation starts after:
 * fade-in delay + crash delay + (face_index * STAGE2_FACE_STAGGER_MS)
 * 
 * This creates a cascading effect where faces crash one after another.
 */
export const STAGE2_FACE_STAGGER_MS = 40;

/**
 * Stage 2: Impact jiggle configuration (structure bounce on face impact)
 * 
 * When a face reaches its final position, it triggers an impact.
 * The entire cube structure bounces with a decaying oscillation.
 * Multiple impacts can be mixed together for combined bounce effects.
 */
export const STAGE2_IMPACT_JIGGLE_DURATION_MS = 500; // How long the bounce oscillation lasts
export const STAGE2_IMPACT_JIGGLE_INTENSITY_PX = 16; // Maximum bounce displacement in pixels
export const STAGE2_IMPACT_JIGGLE_FREQUENCY_HZ = 12; // Oscillation frequency (waves per second)

/**
 * Stage 2: Total duration calculation
 * 
 * Calculates when the last face finishes its crash animation.
 * This is used to determine when Stage 3 should begin.
 * 
 * Timeline for last face (face 5):
 * - Fade-in starts: (5 * STAGE2_FACE_FADE_STAGGER_MS) = 500ms
 * - Fade-in ends: 500ms + STAGE2_FACE_FADE_DURATION_MS = 600ms
 * - Crash starts: 600ms + STAGE2_FACE_CRASH_DELAY_MS + (5 * STAGE2_FACE_STAGGER_MS) = 600 + 100 + 200 = 900ms
 * - Crash ends: 900ms + STAGE2_FACE_CRASH_DURATION_MS = 1300ms
 * 
 * Total Stage 2 duration: ~1300ms
 */
const NUM_STAGE2_FACES = 6; // front, back, right, left, top, bottom
const STAGE2_LAST_FACE_FADE_END_MS = (NUM_STAGE2_FACES - 1) * STAGE2_FACE_FADE_STAGGER_MS + STAGE2_FACE_FADE_DURATION_MS;
const STAGE2_LAST_FACE_CRASH_START_MS = STAGE2_LAST_FACE_FADE_END_MS + STAGE2_FACE_CRASH_DELAY_MS + (NUM_STAGE2_FACES - 1) * STAGE2_FACE_STAGGER_MS;
export const STAGE2_TOTAL_DURATION_MS = STAGE2_LAST_FACE_CRASH_START_MS + STAGE2_FACE_CRASH_DURATION_MS;

// ============================================================================
// Stage 3: Connecting Line Growth
// ============================================================================

/**
 * Stage 3: Delay after Stage 2 completes before connecting lines begin growing
 * 
 * Brief pause after all faces have crashed into place.
 * This creates a clear separation between face assembly and line growth.
 */
export const STAGE3_START_AFTER_STAGE2_MS = 100;

/**
 * Stage 3: Connecting line growth animation configuration
 * 
 * Each of the 8 lines connects an inner cube corner to its corresponding outer cube corner.
 * Lines grow from inner to outer using SVG stroke-dashoffset animation.
 * 
 * Animation consists of two simultaneous effects:
 * 1. Fade-in: Line opacity goes from 0 to 1
 * 2. Growth: Line grows from inner corner to outer corner (stroke-dashoffset animation)
 */
export const STAGE3_LINE_GROWTH_DURATION_MS = 200; // How long it takes a line to fully grow
export const STAGE3_LINE_GROWTH_STAGGER_MS = 10; // Delay between each line starting to grow
export const STAGE3_LINE_GROWTH_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)'; // Ease-out for natural, organic growth
export const STAGE3_LINE_FADE_DURATION_MS = 300; // Fade-in duration (longer than growth for smooth appearance)

/**
 * Stage 3: Total duration calculation
 * 
 * Calculates when the last line finishes growing.
 * This is used to determine when all entrance animations are complete.
 * 
 * Timeline for last line (line 7):
 * - Starts: (7 * STAGE3_LINE_GROWTH_STAGGER_MS) = 70ms
 * - Ends: 70ms + STAGE3_LINE_GROWTH_DURATION_MS = 270ms
 * 
 * Total Stage 3 duration: ~270ms
 */
const NUM_STAGE3_LINES = CUBE_CORNER_OFFSETS.length; // 8 lines (one per corner)
const STAGE3_LAST_LINE_START_MS = (NUM_STAGE3_LINES - 1) * STAGE3_LINE_GROWTH_STAGGER_MS;
export const STAGE3_TOTAL_DURATION_MS = STAGE3_LAST_LINE_START_MS + STAGE3_LINE_GROWTH_DURATION_MS;

// ============================================================================
// Inner Cube Expansion
// ============================================================================

/**
 * Inner cube expansion duration in milliseconds (ease-out)
 * 
 * When user presses mouse or keyboard, the inner cube expands to fill the outer cube.
 * Uses a slow, smooth ease-out curve for a dramatic effect.
 * During expansion, the outer cube vibrates with increasing intensity.
 */
export const INNER_CUBE_EXPAND_DURATION_MS = 3000;

/**
 * Inner cube contraction duration in milliseconds (swift return)
 * 
 * When user releases mouse/keyboard, the inner cube quickly contracts back to its original size.
 * Much faster than expansion for a snappy, responsive feel.
 */
export const INNER_CUBE_CONTRACT_DURATION_MS = 300;

// ============================================================================
// Cube Pulse Animation
// ============================================================================

/**
 * Cube Pulse Animation Overview:
 * 
 * The pulse animation creates a continuous, breathing effect on the cube.
 * It consists of two layers:
 * 1. Primary pulse: Larger, more visible pulse wave
 * 2. Secondary pulse: Smaller, subtler pulse wave that follows
 * 
 * Both pulses expand outward from the cube faces, fade out, and loop continuously.
 * The animation starts after all entrance animations complete.
 */

/**
 * Primary pulse configuration
 */
export const CUBE_PULSE_SCALE = 1.25; // How much larger the pulse faces are compared to cube faces
export const CUBE_PULSE_DURATION_MS = 1200; // Duration of one pulse cycle (expand + fade)
export const CUBE_PULSE_DELAY_MS = 0; // Delay before first pulse starts
export const CUBE_PULSE_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)'; // Ease-out for smooth expansion
export const CUBE_PULSE_OPACITY_START = 0.7; // Initial opacity when pulse appears
export const CUBE_PULSE_OPACITY_MID = 0.3; // Opacity at midpoint (peak expansion)
export const CUBE_PULSE_OPACITY_END = 0; // Final opacity (fully faded)

/**
 * Pulse visual effects
 */
export const CUBE_PULSE_GLOW_RADIUS_PX = 48; // Blur radius for glow effect
export const CUBE_PULSE_GLOW_COLOR = rgba(COLORS.darkGreen, 0.05); // Subtle green glow
export const CUBE_PULSE_FACE_BACKGROUND = rgba(COLORS.darkGray, 0.18); // Pulse face background color
export const CUBE_PULSE_BORDER_COLOR = rgba(COLORS.darkGray, 0.75); // Pulse border color
export const CUBE_PULSE_THICKNESS_PX = 10; // Thickness of pulse faces
export const CUBE_PULSE_EDGE_OPACITY = 0.42; // Opacity at pulse edges (for gradient effect)
export const CUBE_PULSE_EDGE_BLUR_PX = 42; // Blur at pulse edges for soft appearance

/**
 * Secondary pulse configuration
 * 
 * The secondary pulse is a smaller, subtler wave that follows the primary pulse.
 * Creates depth and visual interest with a layered effect.
 */
export const CUBE_PULSE_SECONDARY_DELAY_MS = 200; // Delay after primary pulse starts
export const CUBE_PULSE_SECONDARY_SCALE_MULTIPLIER = 1.02; // Slightly larger than primary (1.25 * 1.02)
export const CUBE_PULSE_SECONDARY_OPACITY_START = 0.8; // Higher initial opacity for visibility
export const CUBE_PULSE_SECONDARY_OPACITY_MID = 0.1; // Lower mid opacity (more subtle)

/**
 * Pulse loop configuration
 * 
 * After each pulse completes, there's a brief pause before the next pulse starts.
 * This creates a breathing rhythm rather than continuous expansion.
 */
export const CUBE_PULSE_LOOP_DELAY_MS = 400; // Pause between primary pulse loops
export const CUBE_PULSE_SECONDARY_LOOP_DELAY_MS = 400; // Pause between secondary pulse loops

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
