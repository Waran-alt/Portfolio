export const SLERP_INTERPOLATION_FACTOR = 6.0; // Speed of interpolation
export const AUTO_ROTATION_SPEED_X = 0.5; // Radians per second for X-axis auto-rotation
export const AUTO_ROTATION_SPEED_Y = 0.7; // Radians per second for Y-axis auto-rotation
export const AUTO_ROTATION_SPEED_Z = 0.4; // Radians per second for Z-axis auto-rotation

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

