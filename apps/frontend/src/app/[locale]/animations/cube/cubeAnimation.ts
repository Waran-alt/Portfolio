/**
 * @file Cube Animation Module
 * 
 * Manages interactive 3D cube animation with quaternion-based rotation:
 * - Frame-rate independent animation using deltaTime
 * - Auto-rotates around X, Y, Z axes with configurable speeds
 * - Follows cursor on mouse movement using SLERP interpolation
 * - Resumes auto-rotation after idle timeout
 */

import { RefObject } from 'react';
import {
  AUTO_ROTATION_SPEED_X,
  AUTO_ROTATION_SPEED_Y,
  AUTO_ROTATION_SPEED_Z,
  CURSOR_Z_DEPTH_MULTIPLIER,
  FRONT_FACE_Z,
  IDLE_TIMEOUT_MS,
  MIN_ROTATION_ANGLE_RAD,
  PERSPECTIVE_PX,
  QUATERNION_TOLERANCE,
  SAFE_MAGNITUDE,
  SLERP_INTERPOLATION_FACTOR,
  TARGET_FPS
} from '../constants';

// --- Quaternion Math ---
// All quaternions are in [w, x, y, z] order.

export type quat = [number, number, number, number];

/** Creates an identity quaternion. */
export const quat_create = (): quat => [1, 0, 0, 0];

/**
 * Creates a quaternion from an axis and an angle.
 * @param axis The axis of rotation.
 * @param angle The angle in radians.
 */
export const quat_fromAxisAngle = (axis: [number, number, number], angle: number): quat => {
    const halfAngle = angle / 2;
    const s = Math.sin(halfAngle);
    return [Math.cos(halfAngle), axis[0] * s, axis[1] * s, axis[2] * s];
};

/** Calculates the dot product of two quaternions. */
const quat_dot = (a: quat, b: quat): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];

/** Normalizes a quaternion. */
export const quat_normalize = (q: quat): quat => {
    const len = Math.sqrt(quat_dot(q, q));
    if (len === 0) return [1, 0, 0, 0];
    return [q[0] / len, q[1] / len, q[2] / len, q[3] / len];
  };

/**
 * Performs spherical linear interpolation between two quaternions.
 * This provides the shortest path for rotation, avoiding gimbal lock.
 * 
 * @param q1 The starting quaternion [w, x, y, z]
 * @param q2 The ending quaternion [w, x, y, z]
 * @param t Interpolation factor (0 to 1), where 0 = q1 and 1 = q2
 * @returns Interpolated quaternion smoothly transitioning from q1 to q2
 */
export const quat_slerp = (q1: quat, q2: quat, t: number): quat => {
    // Calculate angle between quaternions using dot product
    let cosTheta = quat_dot(q1, q2);

    // Handle negative dot product by flipping q2 for shortest path
    let q2_ = [...q2] as quat;
    if (cosTheta < 0) {
        cosTheta = -cosTheta;
        q2_ = [-q2[0], -q2[1], -q2[2], -q2[3]];
    }

    // If quaternions are very close (cosTheta > tolerance), use linear interpolation
    if (cosTheta > QUATERNION_TOLERANCE) {
        return quat_normalize([
            q1[0] + t * (q2_[0] - q1[0]),
            q1[1] + t * (q2_[1] - q1[1]),
            q1[2] + t * (q2_[2] - q1[2]),
            q1[3] + t * (q2_[3] - q1[3]),
        ]);
    }

    // Perform spherical interpolation for smooth rotation
    const theta = Math.acos(cosTheta);
    const sinTheta = Math.sin(theta);
    const scale1 = Math.sin((1 - t) * theta) / sinTheta;
    const scale2 = Math.sin(t * theta) / sinTheta;

    return [
        q1[0] * scale1 + q2_[0] * scale2,
        q1[1] * scale1 + q2_[1] * scale2,
        q1[2] * scale1 + q2_[2] * scale2,
        q1[3] * scale1 + q2_[3] * scale2,
    ];
};

/** Converts a quaternion to a CSS `matrix3d()` string. */
export const quat_toMatrix3d = (q: quat): string => {
    const [w, x, y, z] = q;
    const x2 = x * x, y2 = y * y, z2 = z * z;
    const wx = w * x, wy = w * y, wz = w * z;
    const xy = x * y, xz = x * z, yz = y * z;

    const m = [
        1 - 2 * (y2 + z2), 2 * (xy + wz), 2 * (xz - wy), 0,
        2 * (xy - wz), 1 - 2 * (x2 + z2), 2 * (yz + wx), 0,
        2 * (xz + wy), 2 * (yz - wx), 1 - 2 * (x2 + y2), 0,
        0, 0, 0, 1
    ];
    return `matrix3d(${m.join(',')})`;
};

/** Multiplies two quaternions. */
export const quat_multiply = (q1: quat, q2: quat): quat => {
    const [w1, x1, y1, z1] = q1;
    const [w2, x2, y2, z2] = q2;
    return [
        w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2,
        w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2,
        w1 * y2 - x1 * z2 + y1 * w2 + z1 * x2,
        w1 * z2 + x1 * y2 - y1 * x2 + z1 * w2,
    ];
};

/**
 * Animation state interface
 */
export interface CubeAnimationState {
  currentQuat: quat;
  targetQuat: quat;
  following: boolean;
}

/**
 * Creates and manages the cube animation loop
 * 
 * @param innerRef Reference to the DOM element receiving transforms
 * @param stateRef Reference to animation state (currentQuat, targetQuat, following)
 * @returns Cleanup function to stop animation loop
 */
export const createCubeAnimation = (
  innerRef: RefObject<HTMLElement | null>,
  stateRef: RefObject<CubeAnimationState>
): (() => void) => {
  let rafId: number | null = null;
  let lastTime = 0;
  let timeoutId: number | null = null;

  /**
   * Main animation loop: runs continuously using requestAnimationFrame.
   * Implements frame-rate independent animation using deltaTime.
   * 
   * @param time Current timestamp from requestAnimationFrame (milliseconds)
   */
  const step = (time: number) => {
    if (!stateRef.current) return;

    // Calculate deltaTime for frame-rate independent animation
    // First frame: initialize lastTime
    if (lastTime === 0) {
      lastTime = time;
    }
    const deltaTime = (time - lastTime) / 1000; // DeltaTime in seconds
    lastTime = time;

    if (stateRef.current.following) {
      // --- Follow Mode: Cursor-Following Animation ---
      // Interpolate current quaternion towards target quaternion using SLERP
      // Scale interpolation by deltaTime * TARGET_FPS for consistent speed across all refresh rates
      const interpolationFactor = Math.min(SLERP_INTERPOLATION_FACTOR * deltaTime * TARGET_FPS, 1);
      stateRef.current.currentQuat = quat_slerp(stateRef.current.currentQuat, stateRef.current.targetQuat, interpolationFactor);
    } else {
      // --- Auto-Rotation Mode: Continuous Rotation ---
      // Apply small rotation each frame, scaled by deltaTime for frame-rate independence
      // Rotates around X, Y, and Z axes simultaneously with different speeds for complex 3D motion
      const rotationX = quat_fromAxisAngle([1, 0, 0], AUTO_ROTATION_SPEED_X * deltaTime);
      const rotationY = quat_fromAxisAngle([0, 1, 0], AUTO_ROTATION_SPEED_Y * deltaTime);
      const rotationZ = quat_fromAxisAngle([0, 0, 1], AUTO_ROTATION_SPEED_Z * deltaTime);
      const autoRotationQuat = quat_multiply(quat_multiply(rotationX, rotationY), rotationZ);
      stateRef.current.currentQuat = quat_multiply(autoRotationQuat, stateRef.current.currentQuat);
    }

    if (innerRef.current) {
      innerRef.current.style.transform = quat_toMatrix3d(stateRef.current.currentQuat);
    }

    rafId = requestAnimationFrame(step);
  };

  rafId = requestAnimationFrame(step);

  /**
   * Mouse move handler: Calculates target quaternion to align front face with cursor.
   * 
   * Algorithm:
   * 1. Project cursor position into 3D space (relative to viewport center)
   * 2. Normalize to create direction vector
   * 3. Calculate rotation axis and angle to align front face (0,0,1) with cursor vector
   * 4. Convert to quaternion for smooth interpolation
   */
  const handleMove = (e: MouseEvent) => {
    if (!stateRef.current) return;

    stateRef.current.following = true;

    // Get viewport dimensions and center point
    const vw = window.innerWidth || 1;
    const vh = window.innerHeight || 1;
    const cx = vw / 2;
    const cy = vh / 2;
    
    // Calculate cursor offset from center
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;

    // Project cursor into 3D space using perspective depth
    const zDepth = PERSPECTIVE_PX * CURSOR_Z_DEPTH_MULTIPLIER;
    const targetVec = { x: dx, y: dy, z: zDepth };
    
    // Normalize vector to get pure direction
    const mag = Math.sqrt(targetVec.x**2 + targetVec.y**2 + targetVec.z**2) || SAFE_MAGNITUDE;
    const normTargetVec = { x: targetVec.x / mag, y: targetVec.y / mag, z: targetVec.z / mag };

    // Front face points along positive Z-axis in cube's local space
    const frontVec = { x: 0, y: 0, z: FRONT_FACE_Z };

    // Calculate rotation angle using dot product (angle between vectors)
    const dot = frontVec.x * normTargetVec.x + frontVec.y * normTargetVec.y + frontVec.z * normTargetVec.z;
    const angle = Math.acos(dot);

    // Skip if rotation angle is too small (already aligned)
    if (Math.abs(angle) < MIN_ROTATION_ANGLE_RAD) {
      stateRef.current.targetQuat = stateRef.current.currentQuat; // No rotation needed
      return;
    }
    
    // Calculate rotation axis using cross product (perpendicular to both vectors)
    const axis = {
      x: frontVec.y * normTargetVec.z - frontVec.z * normTargetVec.y,
      y: frontVec.z * normTargetVec.x - frontVec.x * normTargetVec.z,
      z: frontVec.x * normTargetVec.y - frontVec.y * normTargetVec.x,
    };
    
    // Normalize rotation axis
    const axisMag = Math.sqrt(axis.x**2 + axis.y**2 + axis.z**2) || SAFE_MAGNITUDE;
    const normAxis: [number, number, number] = [axis.x / axisMag, axis.y / axisMag, axis.z / axisMag];
    
    // Convert axis-angle representation to quaternion
    stateRef.current.targetQuat = quat_fromAxisAngle(normAxis, angle);

    // Reset idle timer: resume auto-rotation after IDLE_TIMEOUT_MS of no movement
    if (timeoutId) window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      if (stateRef.current) {
        stateRef.current.following = false;
      }
    }, IDLE_TIMEOUT_MS);
  };

  document.addEventListener('mousemove', handleMove);

  return () => {
    document.removeEventListener('mousemove', handleMove);
    if (timeoutId) window.clearTimeout(timeoutId);
    if (rafId) cancelAnimationFrame(rafId);
  };
};
