'use client';

/**
 * @file Landing Page
 *
 * Interactive 3D cube animation with pure JavaScript quaternion-based rotation:
 * - Frame-rate independent animation using deltaTime calculations
 * - Auto-rotates continuously when idle
 * - Follows cursor on mouse movement using SLERP interpolation
 * - Resumes auto-rotation after IDLE_TIMEOUT_MS of no cursor movement
 * - All parameters configurable in landing.constants.ts
 */

import { useEffect, useRef, useState } from 'react';
import {
  AUTO_ROTATION_SPEED,
  CURSOR_Z_DEPTH_MULTIPLIER,
  FRONT_FACE_Z,
  IDLE_TIMEOUT_MS,
  MIN_ROTATION_ANGLE_RAD,
  PERSPECTIVE_PX,
  QUATERNION_TOLERANCE,
  SAFE_MAGNITUDE,
  SLERP_INTERPOLATION_FACTOR,
  TARGET_FPS
} from './landing.constants';
import styles from './page.module.css';

// --- Quaternion Math ---
// All quaternions are in [w, x, y, z] order as requested.

type quat = [number, number, number, number];

/** Creates an identity quaternion. */
const quat_create = (): quat => [1, 0, 0, 0];

/**
 * Creates a quaternion from an axis and an angle.
 * @param axis The axis of rotation.
 * @param angle The angle in radians.
 */
const quat_fromAxisAngle = (axis: [number, number, number], angle: number): quat => {
    const halfAngle = angle / 2;
    const s = Math.sin(halfAngle);
    return [Math.cos(halfAngle), axis[0] * s, axis[1] * s, axis[2] * s];
};

/** Calculates the dot product of two quaternions. */
const quat_dot = (a: quat, b: quat): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];

/** Normalizes a quaternion. */
const quat_normalize = (q: quat): quat => {
    const len = Math.sqrt(quat_dot(q, q));
    if (len === 0) return [1, 0, 0, 0];
    return [q[0] / len, q[1] / len, q[2] / len, q[3] / len];
  };

  /**
 * Performs spherical linear interpolation between two quaternions.
 * 
 * @param q1 The starting quaternion [w, x, y, z]
 * @param q2 The ending quaternion [w, x, y, z]
 * @param t Interpolation factor (0 to 1), where 0 = q1 and 1 = q2
 * @returns Interpolated quaternion smoothly transitioning from q1 to q2
 */
const quat_slerp = (q1: quat, q2: quat, t: number): quat => {
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
const quat_toMatrix3d = (q: quat): string => {
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
const quat_multiply = (q1: quat, q2: quat): quat => {
    const [w1, x1, y1, z1] = q1;
    const [w2, x2, y2, z2] = q2;
    return [
        w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2,
        w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2,
        w1 * y2 - x1 * z2 + y1 * w2 + z1 * x2,
        w1 * z2 + x1 * y2 - y1 * x2 + z1 * w2,
    ];
};


export default function LandingPage() {
  const [following, setFollowing] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);

  // --- Quaternion-based Animation State ---
  const targetQuatRef = useRef<quat>(quat_create());
  const currentQuatRef = useRef<quat>(quat_create());
  const followingRef = useRef(false); // Ref to use inside rAF loop

  useEffect(() => {
    followingRef.current = following;
  }, [following]);

  useEffect(() => {
    let rafId: number | null = null;
    let lastTime = 0; // Track last frame timestamp for deltaTime calculation

    /**
     * Main animation loop: runs continuously using requestAnimationFrame.
     * Implements frame-rate independent animation using deltaTime.
     * 
     * @param time Current timestamp from requestAnimationFrame (milliseconds)
     */
    const step = (time: number) => {
      // Calculate deltaTime for frame-rate independent animation
      // First frame: initialize lastTime
      if (lastTime === 0) {
        lastTime = time;
      }
      const deltaTime = (time - lastTime) / 1000; // DeltaTime in seconds
      lastTime = time;

      if (followingRef.current) {
        // --- Follow Mode: Cursor-Following Animation ---
        // Interpolate current quaternion towards target quaternion using SLERP
        // Scale interpolation by deltaTime * TARGET_FPS for consistent speed across all refresh rates
        const interpolationFactor = Math.min(SLERP_INTERPOLATION_FACTOR * deltaTime * TARGET_FPS, 1);
        currentQuatRef.current = quat_slerp(currentQuatRef.current, targetQuatRef.current, interpolationFactor);
      } else {
        // --- Auto-Rotation Mode: Continuous Rotation ---
        // Apply small rotation each frame, scaled by deltaTime for frame-rate independence
        // Rotates around both X and Y axes simultaneously for complex motion
        const rotationX = quat_fromAxisAngle([1, 0, 0], AUTO_ROTATION_SPEED * deltaTime);
        const rotationY = quat_fromAxisAngle([0, 1, 0], AUTO_ROTATION_SPEED * deltaTime);
        const autoRotationQuat = quat_multiply(rotationX, rotationY);
        currentQuatRef.current = quat_multiply(autoRotationQuat, currentQuatRef.current);
      }

      if (innerRef.current) {
        innerRef.current.style.transform = quat_toMatrix3d(currentQuatRef.current);
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
      setFollowing(true);

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
        targetQuatRef.current = currentQuatRef.current; // No rotation needed
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
      targetQuatRef.current = quat_fromAxisAngle(normAxis, angle);

      // Reset idle timer: resume auto-rotation after IDLE_TIMEOUT_MS of no movement
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        setFollowing(false);
      }, IDLE_TIMEOUT_MS);
    };

    document.addEventListener('mousemove', handleMove);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <main className="LandingPage min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-700" data-testid="landing-root">
      <div className="relative" style={{ perspective: `${PERSPECTIVE_PX}px` }} data-testid="cube-wrapper">
        <div className={styles['followWrapper']} ref={innerRef}>
          <div className={`${styles['cube']}`} data-testid="cube">
            <div className={`${styles['cubeFace']} ${styles['cubeFront']}`} />
            <div className={`${styles['cubeFace']} ${styles['cubeBack']}`} />
            <div className={`${styles['cubeFace']} ${styles['cubeRight']}`} />
            <div className={`${styles['cubeFace']} ${styles['cubeLeft']}`} />
            <div className={`${styles['cubeFace']} ${styles['cubeTop']}`} />
            <div className={`${styles['cubeFace']} ${styles['cubeBottom']}`} />
              </div>
        </div>
      </div>
    </main>
  );
} 