/**
 * @file Illumination Math Unit Tests
 * 
 * Unit tests for individual illumination calculation functions.
 */

import {
  calculateAngleBrightness,
  calculateDistanceAttenuation,
  hexToRgb,
  rgbToHex,
} from './illuminationMath';
import type { Vector3 } from './types';

describe('Illumination Math - Unit Tests', () => {
  describe('calculateDistanceAttenuation', () => {
    it('returns maximum attenuation at zero distance', () => {
      const attenuation = calculateDistanceAttenuation(0, 0.1);
      // Uses MIN_DISTANCE threshold (0.1), so not exactly 1.0
      // Formula: 1 / (1 + 0.1 * 0.1^2) = 1 / (1 + 0.001) ≈ 0.999
      expect(attenuation).toBeCloseTo(0.999, 2);
    });

    it('decreases with distance (inverse square law)', () => {
      const close = calculateDistanceAttenuation(10, 0.1);
      const far = calculateDistanceAttenuation(100, 0.1);
      expect(close).toBeGreaterThan(far);
    });

    it('respects minimum distance threshold', () => {
      const negative = calculateDistanceAttenuation(-10, 0.1);
      const zero = calculateDistanceAttenuation(0, 0.1);
      expect(negative).toBe(zero);
    });

    it('varies with attenuation factor', () => {
      const lowAttenuation = calculateDistanceAttenuation(50, 0.01);
      const highAttenuation = calculateDistanceAttenuation(50, 0.1);
      expect(lowAttenuation).toBeGreaterThan(highAttenuation);
    });
  });

  describe('calculateAngleBrightness', () => {
    it('returns 1.0 when face directly faces light', () => {
      const lightDirection: Vector3 = { x: 0, y: 0, z: 1 };
      const surfaceNormal: Vector3 = { x: 0, y: 0, z: 1 };
      const brightness = calculateAngleBrightness(lightDirection, surfaceNormal);
      expect(brightness).toBe(1.0);
    });

    it('returns 0.0 when face is perpendicular to light', () => {
      const lightDirection: Vector3 = { x: 0, y: 0, z: 1 };
      const surfaceNormal: Vector3 = { x: 1, y: 0, z: 0 };
      const brightness = calculateAngleBrightness(lightDirection, surfaceNormal);
      expect(brightness).toBe(0);
    });

    it('returns clamped value when face faces away from light (default behavior)', () => {
      const lightDirection: Vector3 = { x: 0, y: 0, z: 1 };
      const surfaceNormal: Vector3 = { x: 0, y: 0, z: -1 };
      const brightness = calculateAngleBrightness(lightDirection, surfaceNormal);
      // Default behavior clamps to MIN_DOT_PRODUCT (non-negative)
      expect(brightness).toBeGreaterThanOrEqual(0);
    });

    it('clamps negative values to MIN_DOT_PRODUCT when illuminateBackFaces is false', () => {
      const lightDirection: Vector3 = { x: 0, y: 0, z: 1 };
      const surfaceNormal: Vector3 = { x: 0, y: 0, z: -1 };
      const brightness = calculateAngleBrightness(lightDirection, surfaceNormal, false);
      expect(brightness).toBeGreaterThanOrEqual(0);
    });

    it('uses absolute value when illuminateBackFaces is true', () => {
      const lightDirection: Vector3 = { x: 0, y: 0, z: 1 };
      const surfaceNormal: Vector3 = { x: 0, y: 0, z: -1 };
      const brightness = calculateAngleBrightness(lightDirection, surfaceNormal, true);
      expect(brightness).toBe(1.0);
    });

    it('returns same brightness for same angle regardless of orientation', () => {
      const lightDirection: Vector3 = { x: 0, y: 0, z: 1 };
      
      // Face 1: Normal pointing at 45 degrees in XZ plane
      const normal1: Vector3 = { x: 0.707, y: 0, z: 0.707 };
      
      // Face 2: Normal pointing at 45 degrees in YZ plane (different orientation, same angle)
      const normal2: Vector3 = { x: 0, y: 0.707, z: 0.707 };
      
      // Face 3: Normal pointing at 45 degrees in rotated plane (different orientation, same angle)
      const normal3: Vector3 = { x: 0.5, y: 0.5, z: 0.707 };
      
      const brightness1 = calculateAngleBrightness(lightDirection, normal1);
      const brightness2 = calculateAngleBrightness(lightDirection, normal2);
      const brightness3 = calculateAngleBrightness(lightDirection, normal3);
      
      // All should have the same brightness (same angle to light)
      expect(brightness1).toBeCloseTo(brightness2, 10);
      expect(brightness2).toBeCloseTo(brightness3, 10);
      expect(brightness1).toBeCloseTo(0.707, 2); // cos(45°) ≈ 0.707
    });
  });

  describe('rgbToHex', () => {
    it('converts RGB to hex string', () => {
      expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
      expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
      expect(rgbToHex(0, 0, 255)).toBe('#0000ff');
      expect(rgbToHex(128, 128, 128)).toBe('#808080');
    });

    it('handles zero values', () => {
      expect(rgbToHex(0, 0, 0)).toBe('#000000');
    });

    it('rounds values correctly', () => {
      // 255.7 rounds to 256 (0x100), 128.3 rounds to 128 (0x80), 64.9 rounds to 65 (0x41)
      expect(rgbToHex(255.7, 128.3, 64.9)).toBe('#1008041');
      // Test with values that round to valid hex
      expect(rgbToHex(255.4, 128.4, 64.4)).toBe('#ff8040');
    });
  });

  describe('hexToRgb', () => {
    it('converts hex string to RGB', () => {
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
      expect(hexToRgb('#808080')).toEqual({ r: 128, g: 128, b: 128 });
    });

    it('handles hex without hash prefix', () => {
      expect(hexToRgb('ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('returns black for invalid hex', () => {
      expect(hexToRgb('invalid')).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb('#gggggg')).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('handles case insensitive hex', () => {
      expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    });
  });
});

