export const SLERP_INTERPOLATION_FACTOR = 6.0; // Speed of interpolation

// Auto-rotation speed ranges (radians per second)
export const AUTO_ROTATION_SPEED_X_MIN = -0.15;
export const AUTO_ROTATION_SPEED_X_MAX = 0.25;
export const AUTO_ROTATION_SPEED_Y_MIN = -0.2;
export const AUTO_ROTATION_SPEED_Y_MAX = 0.25;
export const AUTO_ROTATION_SPEED_Z_MIN = -0.2;
export const AUTO_ROTATION_SPEED_Z_MAX = 0.15;

// Speed transition control
export const AUTO_ROTATION_SPEED_SMOOTHING_FACTOR = 0.005; // Rate at which speed adjusts towards target
export const AUTO_ROTATION_SPEED_HOLD_DURATION_MIN = 4.0; // Minimum seconds to hold speed before changing
export const AUTO_ROTATION_SPEED_HOLD_DURATION_MAX = 5.0; // Maximum seconds to hold speed before changing
export const INITIAL_CUBE_HOLD_DURATION = 3.0; // Seconds to keep cube fixed before starting rotation

export const IDLE_TIMEOUT_MS = 2000;   // Pause duration before auto-rotate resumes
export const NEAR_ZERO_EPS = 0.2;      // Threshold to consider angles/velocity settled

export const PERSPECTIVE_PX = 800;     // Perspective distance in px

// Mouse-follow calculations
export const CURSOR_Z_DEPTH_MULTIPLIER = 1.0; // Multiplier for cursor z-depth (1.0 = PERSPECTIVE_PX)
export const MIN_ROTATION_ANGLE_RAD = 0.001; // Minimum rotation angle to trigger update (radians)
export const QUATERNION_TOLERANCE = 0.9995; // Tolerance for quaternion dot product comparisons

// Frame-rate normalization
export const TARGET_FPS = 60; // Target frames per second for time-based calculations

// Vector constants
export const FRONT_FACE_Z = 1; // Z-component of the front face vector in local space
export const SAFE_MAGNITUDE = 1; // Fallback value for vector magnitude normalization

// Light effect constants
export const LIGHT_INITIAL_X = 50; // Initial light X position (percent)
export const LIGHT_INITIAL_Y = 50; // Initial light Y position (percent)
export const LIGHT_SMOOTH_FACTOR = 0.15; // Smooth interpolation factor (0 to 1, higher = faster)
export const LIGHT_MAX_SPEED = 2.0; // Maximum speed in percent per frame
export const LIGHT_OPACITY = 0.2; // Light opacity (0 to 1)
export const LIGHT_RADIUS_PERCENT = 70; // Light radius as percentage
export const LIGHT_COLOR_RGB = '155, 155, 155'; // Light color RGB values
export const BG_GRADIENT_START = 'rgb(15, 23, 42)'; // Background gradient start (slate-900)
export const BG_GRADIENT_END = 'rgb(51, 65, 85)'; // Background gradient end (slate-700)

// Pulse effect configuration
export const CLICK_PULSE_CONFIG = {
  direction: "shrink",
  duration: 396,
  maxRadius: 202,
  outerBlur: 33,
  outerSpread: 25,
  innerBlur: 13,
  innerSpread: 3,
  fadeInDuration: 0,
  fadeInToAnimationDuration: 100,
  fadeOutDuration: 153,
  initialOpacity: 0,
  animationOpacity: 1,
  finalOpacity: 0,
  easing: "ease-in",
  ringColor: "rgba(255, 255, 255, 1)"
};

export const AUTO_PULSE_CONFIG = {
  direction: 'expand' as const,
  duration: 8000,
  ringColor: 'rgba(255, 255, 255)',
  maxRadius: 500,
  outerBlur: 0,
  outerSpread: 0,
  innerBlur: 100,
  innerSpread: 120,
  fadeInDuration: 0,
  fadeInToAnimationDuration: 2000,
  fadeOutDuration: 5000,
  initialOpacity: 0,
  animationOpacity: 0.8,
  finalOpacity: 0,
  easing: 'ease-in-out' as const,
};
