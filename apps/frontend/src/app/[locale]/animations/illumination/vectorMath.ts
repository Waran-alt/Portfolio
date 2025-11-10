/**
 * @file Vector Math Utilities
 * 
 * Optimized vector operations for illumination calculations.
 */

import { DEFAULT_FORWARD_VECTOR, MATRIX_DEFAULT_VALUE, ZERO_MAGNITUDE_THRESHOLD } from './constants';
import type { Vector3 } from './types';

/**
 * Calculate the magnitude (length) of a vector
 */
export function vectorMagnitude(v: Vector3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

/**
 * Normalize a vector to unit length
 */
export function vectorNormalize(v: Vector3): Vector3 {
  const magnitude = vectorMagnitude(v);
  if (magnitude === ZERO_MAGNITUDE_THRESHOLD) {
    return DEFAULT_FORWARD_VECTOR; // Default to forward if zero vector
  }
  const invMag = 1 / magnitude;
  return {
    x: v.x * invMag,
    y: v.y * invMag,
    z: v.z * invMag,
  };
}

/**
 * Calculate dot product of two vectors
 */
export function vectorDot(a: Vector3, b: Vector3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/**
 * Calculate distance between two points
 */
export function vectorDistance(a: Vector3, b: Vector3): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculate direction vector from point A to point B (normalized)
 */
export function vectorDirection(from: Vector3, to: Vector3): Vector3 {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dz = to.z - from.z;
  return vectorNormalize({ x: dx, y: dy, z: dz });
}

/**
 * Transform a direction vector by a rotation matrix (3x3)
 * Used for rotating plane normals in world space
 */
export function vectorTransform(v: Vector3, matrix: number[]): Vector3 {
  // Column-major 3x3 matrix: [m00, m10, m20, m01, m11, m21, m02, m12, m22]
  // Ensure matrix has at least 9 elements, default to MATRIX_DEFAULT_VALUE if missing
  const m00 = matrix[0] ?? MATRIX_DEFAULT_VALUE;
  const m10 = matrix[1] ?? MATRIX_DEFAULT_VALUE;
  const m20 = matrix[2] ?? MATRIX_DEFAULT_VALUE;
  const m01 = matrix[3] ?? MATRIX_DEFAULT_VALUE;
  const m11 = matrix[4] ?? MATRIX_DEFAULT_VALUE;
  const m21 = matrix[5] ?? MATRIX_DEFAULT_VALUE;
  const m02 = matrix[6] ?? MATRIX_DEFAULT_VALUE;
  const m12 = matrix[7] ?? MATRIX_DEFAULT_VALUE;
  const m22 = matrix[8] ?? MATRIX_DEFAULT_VALUE;
  
  return {
    x: m00 * v.x + m01 * v.y + m02 * v.z,
    y: m10 * v.x + m11 * v.y + m12 * v.z,
    z: m20 * v.x + m21 * v.y + m22 * v.z,
  };
}

