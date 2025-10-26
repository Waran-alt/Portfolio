export const SLERP_INTERPOLATION_FACTOR = 6.0; // Speed of interpolation
export const AUTO_ROTATION_SPEED = 0.5; // Radians per second for auto-rotation

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

