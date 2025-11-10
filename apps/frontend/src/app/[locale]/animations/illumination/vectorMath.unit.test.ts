/**
 * @file Vector Math Unit Tests
 * 
 * Unit tests for vector math utilities used in illumination calculations.
 */

import {
  vectorDirection,
  vectorDistance,
  vectorDot,
  vectorMagnitude,
  vectorNormalize,
  vectorTransform,
} from './vectorMath';
import type { Vector3 } from './types';

describe('Vector Math - Unit Tests', () => {
  describe('vectorMagnitude', () => {
    it('calculates magnitude of a 3D vector', () => {
      const v: Vector3 = { x: 3, y: 4, z: 0 };
      expect(vectorMagnitude(v)).toBe(5);
    });

    it('calculates magnitude of unit vector', () => {
      const v: Vector3 = { x: 1, y: 0, z: 0 };
      expect(vectorMagnitude(v)).toBe(1);
    });

    it('calculates magnitude of zero vector', () => {
      const v: Vector3 = { x: 0, y: 0, z: 0 };
      expect(vectorMagnitude(v)).toBe(0);
    });

    it('calculates magnitude of 3D vector with all components', () => {
      const v: Vector3 = { x: 1, y: 2, z: 2 };
      expect(vectorMagnitude(v)).toBe(3);
    });
  });

  describe('vectorNormalize', () => {
    it('normalizes a vector to unit length', () => {
      const v: Vector3 = { x: 3, y: 4, z: 0 };
      const normalized = vectorNormalize(v);
      expect(vectorMagnitude(normalized)).toBeCloseTo(1, 10);
    });

    it('normalizes preserves direction', () => {
      const v: Vector3 = { x: 1, y: 1, z: 1 };
      const normalized = vectorNormalize(v);
      expect(normalized.x).toBeCloseTo(normalized.y, 10);
      expect(normalized.y).toBeCloseTo(normalized.z, 10);
    });

    it('handles zero vector by returning default forward vector', () => {
      const v: Vector3 = { x: 0, y: 0, z: 0 };
      const normalized = vectorNormalize(v);
      expect(normalized).toEqual({ x: 0, y: 0, z: 1 });
    });

    it('normalizes unit vector correctly', () => {
      const v: Vector3 = { x: 1, y: 0, z: 0 };
      const normalized = vectorNormalize(v);
      expect(normalized).toEqual({ x: 1, y: 0, z: 0 });
    });
  });

  describe('vectorDot', () => {
    it('calculates dot product of perpendicular vectors', () => {
      const a: Vector3 = { x: 1, y: 0, z: 0 };
      const b: Vector3 = { x: 0, y: 1, z: 0 };
      expect(vectorDot(a, b)).toBe(0);
    });

    it('calculates dot product of parallel vectors', () => {
      const a: Vector3 = { x: 1, y: 0, z: 0 };
      const b: Vector3 = { x: 2, y: 0, z: 0 };
      expect(vectorDot(a, b)).toBe(2);
    });

    it('calculates dot product of opposite vectors', () => {
      const a: Vector3 = { x: 1, y: 0, z: 0 };
      const b: Vector3 = { x: -1, y: 0, z: 0 };
      expect(vectorDot(a, b)).toBe(-1);
    });

    it('calculates dot product of unit vectors at 45 degrees', () => {
      const a: Vector3 = { x: 1, y: 0, z: 0 };
      const b: Vector3 = { x: 0.707, y: 0.707, z: 0 };
      expect(vectorDot(a, b)).toBeCloseTo(0.707, 2);
    });
  });

  describe('vectorDistance', () => {
    it('calculates distance between two points', () => {
      const a: Vector3 = { x: 0, y: 0, z: 0 };
      const b: Vector3 = { x: 3, y: 4, z: 0 };
      expect(vectorDistance(a, b)).toBe(5);
    });

    it('calculates distance in 3D space', () => {
      const a: Vector3 = { x: 0, y: 0, z: 0 };
      const b: Vector3 = { x: 1, y: 2, z: 2 };
      expect(vectorDistance(a, b)).toBe(3);
    });

    it('calculates zero distance for same point', () => {
      const a: Vector3 = { x: 1, y: 2, z: 3 };
      const b: Vector3 = { x: 1, y: 2, z: 3 };
      expect(vectorDistance(a, b)).toBe(0);
    });
  });

  describe('vectorDirection', () => {
    it('calculates normalized direction vector', () => {
      const from: Vector3 = { x: 0, y: 0, z: 0 };
      const to: Vector3 = { x: 3, y: 4, z: 0 };
      const direction = vectorDirection(from, to);
      expect(vectorMagnitude(direction)).toBeCloseTo(1, 10);
      expect(direction.x).toBeCloseTo(0.6, 1);
      expect(direction.y).toBeCloseTo(0.8, 1);
    });

    it('handles zero distance by returning default forward vector', () => {
      const from: Vector3 = { x: 1, y: 2, z: 3 };
      const to: Vector3 = { x: 1, y: 2, z: 3 };
      const direction = vectorDirection(from, to);
      expect(direction).toEqual({ x: 0, y: 0, z: 1 });
    });
  });

  describe('vectorTransform', () => {
    it('transforms vector by identity matrix', () => {
      const v: Vector3 = { x: 1, y: 2, z: 3 };
      const identityMatrix = [1, 0, 0, 0, 1, 0, 0, 0, 1]; // Column-major identity
      const result = vectorTransform(v, identityMatrix);
      expect(result).toEqual({ x: 1, y: 2, z: 3 });
    });

    it('transforms vector by 90-degree rotation around Z axis', () => {
      const v: Vector3 = { x: 1, y: 0, z: 0 };
      // 90-degree rotation around Z: (1,0,0) -> (0,1,0)
      const rotationMatrix = [0, 1, 0, -1, 0, 0, 0, 0, 1]; // Column-major
      const result = vectorTransform(v, rotationMatrix);
      expect(result.x).toBeCloseTo(0, 10);
      expect(result.y).toBeCloseTo(1, 10);
      expect(result.z).toBeCloseTo(0, 10);
    });

    it('preserves vector magnitude for rotation matrices', () => {
      const v: Vector3 = { x: 1, y: 2, z: 3 };
      const originalMagnitude = vectorMagnitude(v);
      // 180-degree rotation around Y axis
      const rotationMatrix = [-1, 0, 0, 0, 1, 0, 0, 0, -1]; // Column-major
      const result = vectorTransform(v, rotationMatrix);
      expect(vectorMagnitude(result)).toBeCloseTo(originalMagnitude, 10);
    });

    it('handles incomplete matrix by using default values', () => {
      const v: Vector3 = { x: 1, y: 2, z: 3 };
      const incompleteMatrix = [1, 0, 0]; // Only 3 elements
      const result = vectorTransform(v, incompleteMatrix);
      // Should use MATRIX_DEFAULT_VALUE (0) for missing elements
      expect(result.x).toBe(1);
      expect(result.y).toBe(0);
      expect(result.z).toBe(0);
    });
  });
});

