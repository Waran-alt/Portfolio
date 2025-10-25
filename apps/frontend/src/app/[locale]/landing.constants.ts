export const ROTATION_MAX_DEG = 25; // Clamp angle in degrees

export const INERTIA_STIFFNESS = 0.15; // Attraction toward target (0..1)
export const INERTIA_DAMPING = 0.85;   // Velocity decay (0..1), higher = more inertia
export const INERTIA_TICK_MS = 3;     // Interval step in ms (~30 FPS)

export const IDLE_TIMEOUT_MS = 2000;   // Pause duration before auto-rotate resumes
export const NEAR_ZERO_EPS = 0.2;      // Threshold to consider angles/velocity settled

export const PERSPECTIVE_PX = 800;     // Perspective distance in px

// Auto-rotation speed ramp (Web Animations API)
export const WAAPI_BASE_RATE = 0.1;       // 1x base speed
export const WAAPI_MAX_RATE = 1;        // up to 3x speed
export const WAAPI_RAMP_MS = 2500;      // ramp duration in ms
export const WAAPI_EASE = { x1: 0.22, y1: 1, x2: 0.36, y2: 1 }; // ease-out expo-like

