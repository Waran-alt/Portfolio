/**
 * @file Illumination Math Integration Tests
 * 
 * Integration tests for the complete illumination calculation system.
 * Focuses on verifying that faces with the same angle to light produce
 * the same illumination regardless of their orientation in space.
 */

import { quat_fromAxisAngle, quat_toRotationMatrix3x3 } from '../cube';
import { DEFAULT_LIGHT_CONFIG, DEFAULT_MATERIAL_CONFIG } from './constants';
import { calculatePlaneIllumination } from './illuminationMath';
import type { LightConfig, MaterialConfig, Vector3 } from './types';
import { vectorNormalize, vectorTransform } from './vectorMath';

describe('Illumination Math - Integration Tests', () => {
  const baseLightConfig: LightConfig = {
    ...DEFAULT_LIGHT_CONFIG,
    position: { x: 0, y: 0, z: 100 },
    intensity: 1.0,
  };

  const baseMaterialConfig: MaterialConfig = {
    ...DEFAULT_MATERIAL_CONFIG,
    baseColor: { r: 100, g: 100, b: 100 },
    reflectivity: 0.5,
  };

  describe('calculatePlaneIllumination - Basic Functionality', () => {
    it('calculates illumination for face directly facing light', () => {
      const planePosition: Vector3 = { x: 0, y: 0, z: 0 };
      const planeNormal: Vector3 = { x: 0, y: 0, z: 1 };
      
      const result = calculatePlaneIllumination(
        planePosition,
        planeNormal,
        baseLightConfig,
        baseMaterialConfig
      );
      
      expect(result.brightness).toBeGreaterThan(0);
      expect(result.color.r).toBeGreaterThan(baseMaterialConfig.baseColor.r);
    });

    it('calculates minimal illumination for face perpendicular to light', () => {
      const planePosition: Vector3 = { x: 0, y: 0, z: 0 };
      const planeNormal: Vector3 = { x: 1, y: 0, z: 0 };
      
      const result = calculatePlaneIllumination(
        planePosition,
        planeNormal,
        baseLightConfig,
        baseMaterialConfig
      );
      
      expect(result.brightness).toBeLessThan(0.1);
    });
  });

  describe('calculatePlaneIllumination - Same Angle, Different Orientations', () => {
    it('produces same illumination for faces with same angle but different orientations', () => {
      const lightConfig: LightConfig = {
        ...baseLightConfig,
        position: { x: 0, y: 0, z: 100 },
      };
      
      // Face 1: At origin, normal at 45° in XZ plane
      const position1: Vector3 = { x: 0, y: 0, z: 0 };
      const normal1: Vector3 = vectorNormalize({ x: 0.707, y: 0, z: 0.707 });
      
      // Face 2: At different position, normal at 45° in YZ plane (same angle to light)
      const position2: Vector3 = { x: 50, y: 0, z: 0 };
      const normal2: Vector3 = vectorNormalize({ x: 0, y: 0.707, z: 0.707 });
      
      // Face 3: At another position, normal at 45° in rotated plane (same angle to light)
      const position3: Vector3 = { x: 0, y: 50, z: 0 };
      const normal3: Vector3 = vectorNormalize({ x: 0.5, y: 0.5, z: 0.707 });
      
      const result1 = calculatePlaneIllumination(position1, normal1, lightConfig, baseMaterialConfig);
      const result2 = calculatePlaneIllumination(position2, normal2, lightConfig, baseMaterialConfig);
      const result3 = calculatePlaneIllumination(position3, normal3, lightConfig, baseMaterialConfig);
      
      // Brightness should be similar (same angle to light, but distances may differ)
      // Allow for small differences due to distance attenuation
      expect(result1.brightness).toBeCloseTo(result2.brightness, 2);
      expect(result2.brightness).toBeCloseTo(result3.brightness, 2);
      
      // Colors should be very similar (may differ slightly due to distance, but angle component should be same)
      // The angle brightness component is the same, so the main difference is distance attenuation
      const distance1 = Math.sqrt(position1.x ** 2 + position1.y ** 2 + (position1.z - lightConfig.position.z) ** 2);
      const distance2 = Math.sqrt(position2.x ** 2 + position2.y ** 2 + (position2.z - lightConfig.position.z) ** 2);
      const distance3 = Math.sqrt(position3.x ** 2 + position3.y ** 2 + (position3.z - lightConfig.position.z) ** 2);
      
      // If distances are similar, brightness should be similar
      if (Math.abs(distance1 - distance2) < 10 && Math.abs(distance2 - distance3) < 10) {
        expect(result1.brightness).toBeCloseTo(result2.brightness, 2);
        expect(result2.brightness).toBeCloseTo(result3.brightness, 2);
      }
    });

    it('produces same illumination after rotation (same relative angle)', () => {
      const lightConfig: LightConfig = {
        ...baseLightConfig,
        position: { x: 0, y: 0, z: 100 },
      };
      
      const basePosition: Vector3 = { x: 0, y: 0, z: 0 };
      const baseNormal: Vector3 = vectorNormalize({ x: 0.707, y: 0, z: 0.707 });
      
      const baseResult = calculatePlaneIllumination(
        basePosition,
        baseNormal,
        lightConfig,
        baseMaterialConfig
      );
      
      // Rotate both position and normal by 90° around Z axis
      const rotationMatrix = quat_toRotationMatrix3x3(quat_fromAxisAngle([0, 0, 1], Math.PI / 2));
      const rotatedPosition = vectorTransform(basePosition, rotationMatrix);
      const rotatedNormal = vectorNormalize(vectorTransform(baseNormal, rotationMatrix));
      
      // Rotate light position by the same amount
      const rotatedLightConfig: LightConfig = {
        ...lightConfig,
        position: vectorTransform(lightConfig.position, rotationMatrix),
      };
      
      const rotatedResult = calculatePlaneIllumination(
        rotatedPosition,
        rotatedNormal,
        rotatedLightConfig,
        baseMaterialConfig
      );
      
      // Brightness should be the same (relative angle is preserved)
      expect(rotatedResult.brightness).toBeCloseTo(baseResult.brightness, 5);
    });

    it('produces same illumination for faces with same angle to light in different planes', () => {
      const lightConfig: LightConfig = {
        ...baseLightConfig,
        position: { x: 0, y: 0, z: 100 },
      };
      
      // All faces at same position, normals at 45° to light but in different planes
      const position: Vector3 = { x: 0, y: 0, z: 0 };
      
      // Face 1: normal at 45° in XZ plane
      const normal1: Vector3 = vectorNormalize({ x: 0.707, y: 0, z: 0.707 });
      
      // Face 2: normal at 45° in YZ plane (different orientation, same angle to light)
      const normal2: Vector3 = vectorNormalize({ x: 0, y: 0.707, z: 0.707 });
      
      // Face 3: normal at 45° in rotated plane (different orientation, same angle to light)
      const normal3: Vector3 = vectorNormalize({ x: 0.5, y: 0.5, z: 0.707 });
      
      const result1 = calculatePlaneIllumination(position, normal1, lightConfig, baseMaterialConfig);
      const result2 = calculatePlaneIllumination(position, normal2, lightConfig, baseMaterialConfig);
      const result3 = calculatePlaneIllumination(position, normal3, lightConfig, baseMaterialConfig);
      
      // All should have the same brightness (same angle to light direction, same distance)
      expect(result1.brightness).toBeCloseTo(result2.brightness, 5);
      expect(result2.brightness).toBeCloseTo(result3.brightness, 5);
    });
  });

  describe('calculatePlaneIllumination - Material Configuration', () => {
    it('handles illuminateBackFaces option correctly', () => {
      const lightConfig: LightConfig = {
        ...baseLightConfig,
        position: { x: 0, y: 0, z: 100 },
      };
      
      const planePosition: Vector3 = { x: 0, y: 0, z: 0 };
      const planeNormal: Vector3 = { x: 0, y: 0, z: -1 }; // Facing away from light
      
      const materialWithoutBackFaces: MaterialConfig = {
        ...baseMaterialConfig,
        illuminateBackFaces: false,
      };
      
      const materialWithBackFaces: MaterialConfig = {
        ...baseMaterialConfig,
        illuminateBackFaces: true,
      };
      
      const resultWithout = calculatePlaneIllumination(
        planePosition,
        planeNormal,
        lightConfig,
        materialWithoutBackFaces
      );
      
      const resultWith = calculatePlaneIllumination(
        planePosition,
        planeNormal,
        lightConfig,
        materialWithBackFaces
      );
      
      // With illuminateBackFaces, should have higher brightness
      expect(resultWith.brightness).toBeGreaterThan(resultWithout.brightness);
    });

    it('respects material reflectivity', () => {
      const lowReflectivity: MaterialConfig = {
        ...baseMaterialConfig,
        reflectivity: 0.1,
      };
      
      const highReflectivity: MaterialConfig = {
        ...baseMaterialConfig,
        reflectivity: 0.9,
      };
      
      const planePosition: Vector3 = { x: 0, y: 0, z: 0 };
      const planeNormal: Vector3 = { x: 0, y: 0, z: 1 };
      
      const resultLow = calculatePlaneIllumination(
        planePosition,
        planeNormal,
        baseLightConfig,
        lowReflectivity
      );
      
      const resultHigh = calculatePlaneIllumination(
        planePosition,
        planeNormal,
        baseLightConfig,
        highReflectivity
      );
      
      expect(resultHigh.color.r).toBeGreaterThan(resultLow.color.r);
    });

    it('handles different blend modes', () => {
      const multiplyMaterial: MaterialConfig = {
        ...baseMaterialConfig,
        blendMode: 'multiply',
      };
      
      const additiveMaterial: MaterialConfig = {
        ...baseMaterialConfig,
        blendMode: 'additive',
      };
      
      const planePosition: Vector3 = { x: 0, y: 0, z: 0 };
      const planeNormal: Vector3 = { x: 0, y: 0, z: 1 };
      
      const resultMultiply = calculatePlaneIllumination(
        planePosition,
        planeNormal,
        baseLightConfig,
        multiplyMaterial
      );
      
      const resultAdditive = calculatePlaneIllumination(
        planePosition,
        planeNormal,
        baseLightConfig,
        additiveMaterial
      );
      
      // Both should produce illumination, but with different blending
      expect(resultMultiply.brightness).toBeGreaterThan(0);
      expect(resultAdditive.brightness).toBeGreaterThan(0);
      // Additive should generally produce brighter results
      expect(resultAdditive.color.r).toBeGreaterThanOrEqual(resultMultiply.color.r);
    });
  });
});

