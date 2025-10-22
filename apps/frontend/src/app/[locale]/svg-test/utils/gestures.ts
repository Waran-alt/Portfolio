/**
 * @file Gesture detection utilities for advanced pan interactions.
 * Supports velocity calculation, inertia, and multi-touch gestures.
 */

// --- TYPES AND INTERFACES ---

/**
 * Represents a pointer event with timestamp for velocity calculations.
 */
export interface TimestampedPointerEvent {
  x: number;
  y: number;
  timestamp: number;
}

/**
 * Represents a pan gesture with calculated properties.
 */
export interface PanGesture {
  /** Velocity in pixels per millisecond */
  velocity: { x: number; y: number };
  /** Total distance traveled */
  distance: number;
  /** Duration of the gesture in milliseconds */
  duration: number;
  /** Primary direction of the gesture */
  direction: 'horizontal' | 'vertical' | 'diagonal';
  /** Whether the gesture was fast enough to trigger inertia */
  shouldInertia: boolean;
  /** Average velocity for inertia calculations */
  averageVelocity: { x: number; y: number };
}

/**
 * Configuration for gesture detection.
 */
export interface GestureConfig {
  /** Minimum velocity threshold for inertia (pixels/ms) */
  inertiaThreshold?: number;
  /** Maximum number of events to keep for velocity calculation */
  maxEventHistory?: number;
  /** Time window for velocity calculation (ms) */
  velocityWindow?: number;
  /** Minimum distance to consider a gesture valid */
  minDistance?: number;
  /** Minimum duration to consider a gesture valid (ms) */
  minDuration?: number;
}

/**
 * Result of gesture analysis.
 */
export interface GestureAnalysis {
  /** Whether the gesture is valid */
  isValid: boolean;
  /** Calculated pan gesture properties */
  gesture: PanGesture | null;
  /** Reason for invalidation if applicable */
  reason?: string;
}

// --- CONSTANTS ---

const DEFAULT_INERTIA_THRESHOLD = 0.5; // pixels/ms
const DEFAULT_MAX_EVENT_HISTORY = 10;
const DEFAULT_VELOCITY_WINDOW = 100; // ms
const DEFAULT_MIN_DISTANCE = 5; // pixels
const DEFAULT_MIN_DURATION = 50; // ms

// --- UTILITY FUNCTIONS ---

/**
 * Calculates the distance between two points.
 */
export function calculateDistance(
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates the angle between two points in radians.
 */
export function calculateAngle(
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number {
  return Math.atan2(point2.y - point1.y, point2.x - point1.x);
}

/**
 * Determines the primary direction of a gesture.
 */
export function determineDirection(
  startPoint: { x: number; y: number },
  endPoint: { x: number; y: number }
): 'horizontal' | 'vertical' | 'diagonal' {
  const dx = Math.abs(endPoint.x - startPoint.x);
  const dy = Math.abs(endPoint.y - startPoint.y);
  
  const threshold = 0.3; // 30% threshold for direction determination
  
  if (dx > dy * (1 + threshold)) {
    return 'horizontal';
  } else if (dy > dx * (1 + threshold)) {
    return 'vertical';
  } else {
    return 'diagonal';
  }
}

/**
 * Calculates velocity from a series of timestamped events.
 */
export function calculateVelocity(
  events: TimestampedPointerEvent[],
  windowMs: number = DEFAULT_VELOCITY_WINDOW
): { x: number; y: number } {
  if (events.length < 2) {
    return { x: 0, y: 0 };
  }

  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Filter events within the time window
  const recentEvents = events.filter(event => event.timestamp >= windowStart);
  
  if (recentEvents.length < 2) {
    return { x: 0, y: 0 };
  }

  const firstEvent = recentEvents[0];
  const lastEvent = recentEvents[recentEvents.length - 1];
  
  // Check if both events exist to avoid undefined access
  if (!firstEvent || !lastEvent) {
    return { x: 0, y: 0 };
  }
  
  const timeDelta = lastEvent.timestamp - firstEvent.timestamp;
  if (timeDelta === 0) {
    return { x: 0, y: 0 };
  }

  const distanceX = lastEvent.x - firstEvent.x;
  const distanceY = lastEvent.y - firstEvent.y;
  
  return {
    x: distanceX / timeDelta,
    y: distanceY / timeDelta
  };
}

/**
 * Calculates average velocity from multiple velocity samples.
 */
export function calculateAverageVelocity(
  velocities: { x: number; y: number }[]
): { x: number; y: number } {
  if (velocities.length === 0) {
    return { x: 0, y: 0 };
  }

  const sumX = velocities.reduce((sum, v) => sum + v.x, 0);
  const sumY = velocities.reduce((sum, v) => sum + v.y, 0);
  
  return {
    x: sumX / velocities.length,
    y: sumY / velocities.length
  };
}

/**
 * Analyzes a series of pointer events to detect pan gestures.
 */
export function analyzePanGesture(
  events: TimestampedPointerEvent[],
  config: GestureConfig = {}
): GestureAnalysis {
  const {
    inertiaThreshold = DEFAULT_INERTIA_THRESHOLD,
    maxEventHistory = DEFAULT_MAX_EVENT_HISTORY,
    velocityWindow = DEFAULT_VELOCITY_WINDOW,
    minDistance = DEFAULT_MIN_DISTANCE,
    minDuration = DEFAULT_MIN_DURATION
  } = config;

  // Validate input
  if (events.length < 2) {
    return {
      isValid: false,
      gesture: null,
      reason: 'Insufficient events'
    };
  }

  const startEvent = events[0];
  const endEvent = events[events.length - 1];
  
  // Validate that both events exist
  if (!startEvent || !endEvent) {
    return {
      isValid: false,
      gesture: null,
      reason: 'Invalid events'
    };
  }
  
  // Calculate basic properties
  const distance = calculateDistance(startEvent, endEvent);
  const duration = endEvent.timestamp - startEvent.timestamp;
  const direction = determineDirection(startEvent, endEvent);
  
  // Check minimum requirements
  if (distance < minDistance) {
    return {
      isValid: false,
      gesture: null,
      reason: `Distance too small: ${distance} < ${minDistance}`
    };
  }
  
  if (duration < minDuration) {
    return {
      isValid: false,
      gesture: null,
      reason: `Duration too short: ${duration} < ${minDuration}`
    };
  }

  // Calculate velocities
  const currentVelocity = calculateVelocity(events, velocityWindow);
  const averageVelocity = calculateAverageVelocity(
    events.slice(-maxEventHistory).map((_, index, arr) => {
      if (index === 0) return { x: 0, y: 0 };
      const prev = arr[index - 1];
      const curr = arr[index];
      
      // Validate that both events exist
      if (!prev || !curr) return { x: 0, y: 0 };
      
      const timeDelta = curr.timestamp - prev.timestamp;
      if (timeDelta === 0) return { x: 0, y: 0 };
      return {
        x: (curr.x - prev.x) / timeDelta,
        y: (curr.y - prev.y) / timeDelta
      };
    }).filter(v => v.x !== 0 || v.y !== 0)
  );

  // Determine if inertia should be applied
  const velocityMagnitude = Math.sqrt(
    currentVelocity.x * currentVelocity.x + currentVelocity.y * currentVelocity.y
  );
  const shouldInertia = velocityMagnitude > inertiaThreshold;

  const gesture: PanGesture = {
    velocity: currentVelocity,
    distance,
    duration,
    direction,
    shouldInertia,
    averageVelocity
  };

  return {
    isValid: true,
    gesture
  };
}

/**
 * Calculates inertia decay for smooth stopping.
 */
export function calculateInertiaDecay(
  initialVelocity: { x: number; y: number },
  friction: number = 0.95,
  maxSteps: number = 50
): Array<{ x: number; y: number; step: number }> {
  const steps: Array<{ x: number; y: number; step: number }> = [];
  const currentVelocity = { ...initialVelocity };
  const currentPosition = { x: 0, y: 0 };
  
  for (let step = 0; step < maxSteps; step++) {
    // Apply friction
    currentVelocity.x *= friction;
    currentVelocity.y *= friction;
    
    // Update position
    currentPosition.x += currentVelocity.x;
    currentPosition.y += currentVelocity.y;
    
    steps.push({
      x: currentPosition.x,
      y: currentPosition.y,
      step
    });
    
    // Stop if velocity is very small
    const velocityMagnitude = Math.sqrt(
      currentVelocity.x * currentVelocity.x + currentVelocity.y * currentVelocity.y
    );
    if (velocityMagnitude < 0.1) {
      break;
    }
  }
  
  return steps;
}

/**
 * Detects multi-touch gestures like pinch-to-zoom.
 */
export function detectMultiTouchGesture(
  events: Array<{ pointers: TimestampedPointerEvent[]; timestamp: number }>
): {
  type: 'pinch' | 'rotate' | 'pan' | 'none';
  scale?: number;
  rotation?: number;
  translation?: { x: number; y: number };
} {
  if (events.length < 2 || !events[0] || events[0].pointers.length < 2) {
    return { type: 'none' };
  }

  const firstEvent = events[0];
  const lastEvent = events[events.length - 1];
  
  if (!firstEvent || !lastEvent || firstEvent.pointers.length !== 2 || lastEvent.pointers.length !== 2) {
    return { type: 'none' };
  }

  // Validate pointer arrays
  if (firstEvent.pointers.length < 2 || lastEvent.pointers.length < 2) {
    return { type: 'none' };
  }

  const firstPointer1 = firstEvent.pointers[0];
  const firstPointer2 = firstEvent.pointers[1];
  const lastPointer1 = lastEvent.pointers[0];
  const lastPointer2 = lastEvent.pointers[1];

  if (!firstPointer1 || !firstPointer2 || !lastPointer1 || !lastPointer2) {
    return { type: 'none' };
  }

  // Calculate initial and final distances
  const initialDistance = calculateDistance(firstPointer1, firstPointer2);
  const finalDistance = calculateDistance(lastPointer1, lastPointer2);

  // Calculate initial and final angles
  const initialAngle = calculateAngle(firstPointer1, firstPointer2);
  const finalAngle = calculateAngle(lastPointer1, lastPointer2);

  // Calculate center points
  const initialCenter = {
    x: (firstPointer1.x + firstPointer2.x) / 2,
    y: (firstPointer1.y + firstPointer2.y) / 2
  };
  const finalCenter = {
    x: (lastPointer1.x + lastPointer2.x) / 2,
    y: (lastPointer1.y + lastPointer2.y) / 2
  };

  const scale = finalDistance / initialDistance;
  const rotation = finalAngle - initialAngle;
  const translation = {
    x: finalCenter.x - initialCenter.x,
    y: finalCenter.y - initialCenter.y
  };

  // Determine gesture type based on dominant transformation
  const scaleChange = Math.abs(scale - 1);
  const rotationChange = Math.abs(rotation);
  const translationDistance = calculateDistance(initialCenter, finalCenter);

  const threshold = 0.1;
  
  if (scaleChange > threshold && scaleChange > rotationChange && scaleChange > translationDistance / 100) {
    return { type: 'pinch', scale };
  } else if (rotationChange > threshold && rotationChange > scaleChange) {
    return { type: 'rotate', rotation };
  } else if (translationDistance > 10) {
    return { type: 'pan', translation };
  }

  return { type: 'none' };
}

/**
 * Debounces gesture detection to prevent rapid firing.
 */
export function debounceGesture<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttles gesture updates for performance.
 */
export function throttleGesture<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}
