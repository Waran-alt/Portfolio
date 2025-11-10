import {
  quat_create,
  quat_fromAxisAngle,
  quat_normalize,
  quat_slerp,
  quat_toMatrix3d,
  quat_toRotationMatrix3x3,
  type quat,
} from './cubeAnimation';

describe('Cube Animation - Quaternion Math', () => {
  describe('quat_create', () => {
    it('creates an identity quaternion', () => {
      const q = quat_create();
      expect(q).toEqual([1, 0, 0, 0]);
    });
  });

  describe('quat_fromAxisAngle', () => {
    it('creates quaternion for 90-degree rotation around Z axis', () => {
      const q = quat_fromAxisAngle([0, 0, 1], Math.PI / 2);
      expect(q[0]).toBeCloseTo(0.707, 2); // cos(45°)
      expect(q[1]).toBeCloseTo(0, 2);
      expect(q[2]).toBeCloseTo(0, 2);
      expect(q[3]).toBeCloseTo(0.707, 2); // sin(45°)
    });

    it('creates quaternion for 90-degree rotation around X axis', () => {
      const q = quat_fromAxisAngle([1, 0, 0], Math.PI / 2);
      expect(q[0]).toBeCloseTo(0.707, 2);
      expect(q[1]).toBeCloseTo(0.707, 2);
      expect(q[2]).toBeCloseTo(0, 2);
      expect(q[3]).toBeCloseTo(0, 2);
    });

    it('creates quaternion for 90-degree rotation around Y axis', () => {
      const q = quat_fromAxisAngle([0, 1, 0], Math.PI / 2);
      expect(q[0]).toBeCloseTo(0.707, 2);
      expect(q[1]).toBeCloseTo(0, 2);
      expect(q[2]).toBeCloseTo(0.707, 2);
      expect(q[3]).toBeCloseTo(0, 2);
    });

    it('creates identity quaternion for zero angle', () => {
      const q = quat_fromAxisAngle([1, 0, 0], 0);
      expect(q).toEqual([1, 0, 0, 0]);
    });
  });

  describe('quat_normalize', () => {
    it('normalizes a quaternion', () => {
      const q: quat = [2, 0, 0, 0]; // magnitude 2
      const normalized = quat_normalize(q);
      expect(normalized).toEqual([1, 0, 0, 0]);
    });

    it('normalizes a complex quaternion', () => {
      const q: quat = [1, 1, 0, 0]; // magnitude √2
      const normalized = quat_normalize(q);
      expect(normalized[0]).toBeCloseTo(0.707, 2);
      expect(normalized[1]).toBeCloseTo(0.707, 2);
    });

    it('handles zero quaternion gracefully', () => {
      const q: quat = [0, 0, 0, 0];
      const normalized = quat_normalize(q);
      expect(normalized).toEqual([1, 0, 0, 0]);
    });

    it('leaves identity quaternion unchanged', () => {
      const q: quat = [1, 0, 0, 0];
      const normalized = quat_normalize(q);
      expect(normalized).toEqual([1, 0, 0, 0]);
    });
  });

  describe('quat_slerp', () => {
    it('returns start quaternion at t=0', () => {
      const q1: quat = quat_fromAxisAngle([0, 0, 1], Math.PI / 4);
      const q2: quat = quat_fromAxisAngle([0, 0, 1], Math.PI / 2);
      const result = quat_slerp(q1, q2, 0);
      expect(result[0]).toBeCloseTo(q1[0], 2);
      expect(result[1]).toBeCloseTo(q1[1], 2);
      expect(result[2]).toBeCloseTo(q1[2], 2);
      expect(result[3]).toBeCloseTo(q1[3], 2);
    });

    it('returns end quaternion at t=1', () => {
      const q1: quat = quat_fromAxisAngle([0, 0, 1], Math.PI / 4);
      const q2: quat = quat_fromAxisAngle([0, 0, 1], Math.PI / 2);
      const result = quat_slerp(q1, q2, 1);
      expect(result[0]).toBeCloseTo(q2[0], 2);
      expect(result[1]).toBeCloseTo(q2[1], 2);
      expect(result[2]).toBeCloseTo(q2[2], 2);
      expect(result[3]).toBeCloseTo(q2[3], 2);
    });

    it('interpolates at t=0.5', () => {
      const q1: quat = quat_fromAxisAngle([0, 0, 1], 0);
      const q2: quat = quat_fromAxisAngle([0, 0, 1], Math.PI / 2);
      const result = quat_slerp(q1, q2, 0.5);
      const expected: quat = quat_fromAxisAngle([0, 0, 1], Math.PI / 4);
      expect(result[0]).toBeCloseTo(expected[0], 2);
      expect(result[3]).toBeCloseTo(expected[3], 2);
    });

    it('handles identical quaternions', () => {
      const q: quat = quat_fromAxisAngle([0, 0, 1], Math.PI / 4);
      const result = quat_slerp(q, q, 0.5);
      expect(result[0]).toBeCloseTo(q[0], 2);
      expect(result[1]).toBeCloseTo(q[1], 2);
      expect(result[2]).toBeCloseTo(q[2], 2);
      expect(result[3]).toBeCloseTo(q[3], 2);
    });

    it('produces normalized output', () => {
      const q1: quat = quat_fromAxisAngle([0, 0, 1], 0);
      const q2: quat = quat_fromAxisAngle([0, 0, 1], Math.PI / 2);
      const result = quat_slerp(q1, q2, 0.5);
      
      const magnitude = Math.sqrt(
        result[0] * result[0] + 
        result[1] * result[1] + 
        result[2] * result[2] + 
        result[3] * result[3]
      );
      expect(magnitude).toBeCloseTo(1, 2);
    });

    it('takes shortest path when quaternions are opposite', () => {
      const q1: quat = [1, 0, 0, 0];
      const q2: quat = [-1, 0, 0, 0];
      const result = quat_slerp(q1, q2, 0.5);
      expect(result).not.toEqual([0, 0, 0, 0]); // Should interpolate, not stop
    });
  });

  describe('quat_toMatrix3d', () => {
    it('converts identity quaternion to identity matrix', () => {
      const q: quat = [1, 0, 0, 0];
      const matrix = quat_toMatrix3d(q);
      expect(matrix).toContain('matrix3d(');
      expect(matrix).toContain('1,0,0,0');
      expect(matrix).toContain('0,0,1,0');
    });

    it('produces valid CSS matrix3d format', () => {
      const q: quat = quat_fromAxisAngle([0, 0, 1], Math.PI / 4);
      const matrix = quat_toMatrix3d(q);
      
      // Should start with 'matrix3d(' and end with ')'
      expect(matrix).toMatch(/^matrix3d\([\d\s\-,.]+\)$/);
      
      // Should contain 16 comma-separated values
      const values = matrix.match(/matrix3d\(([\d\s\-,.]+)\)/)?.[1];
      if (values) {
        const numValues = values.split(',').length;
        expect(numValues).toBe(16);
      }
    });

    it('handles rotation around different axes', () => {
      const qx: quat = quat_fromAxisAngle([1, 0, 0], Math.PI / 4);
      const qy: quat = quat_fromAxisAngle([0, 1, 0], Math.PI / 4);
      const qz: quat = quat_fromAxisAngle([0, 0, 1], Math.PI / 4);
      
      expect(() => quat_toMatrix3d(qx)).not.toThrow();
      expect(() => quat_toMatrix3d(qy)).not.toThrow();
      expect(() => quat_toMatrix3d(qz)).not.toThrow();
      
      const matrix1 = quat_toMatrix3d(qx);
      const matrix2 = quat_toMatrix3d(qy);
      const matrix3 = quat_toMatrix3d(qz);
      
      // Different rotations should produce different matrices
      expect(matrix1).not.toEqual(matrix2);
      expect(matrix2).not.toEqual(matrix3);
      expect(matrix1).not.toEqual(matrix3);
    });

    it('produces orthonormal transformation matrix', () => {
      const q: quat = quat_fromAxisAngle([1, 1, 1], Math.PI / 3);
      const matrix = quat_toMatrix3d(q);
      
      // Extract all 16 values from matrix3d string
      const values = matrix.match(/matrix3d\(([\d\s\-,.]+)\)/)?.[1];
      if (values) {
        const nums = values.split(',').map(v => parseFloat(v.trim()));
        
        // Last row should be [0, 0, 0, 1] (indices 12-15)
        expect(nums[12]).toBeCloseTo(0, 2);
        expect(nums[13]).toBeCloseTo(0, 2);
        expect(nums[14]).toBeCloseTo(0, 2);
        expect(nums[15]).toBeCloseTo(1, 2);
        
        // Last column (translation) should be [0, 0, 0, 1] (indices 3, 7, 11, 15)
        expect(nums[3]).toBeCloseTo(0, 2);
        expect(nums[7]).toBeCloseTo(0, 2);
        expect(nums[11]).toBeCloseTo(0, 2);
      }
    });
  });

  describe('quat_toRotationMatrix3x3', () => {
    it('returns identity matrix for identity quaternion', () => {
      const matrix = quat_toRotationMatrix3x3([1, 0, 0, 0]);
      expect(matrix).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1]);
    });

    it('produces column-major rotation matrix for 45° around Y axis', () => {
      const angle = Math.PI / 4;
      const q = quat_fromAxisAngle([0, 1, 0], angle);
      const matrix = quat_toRotationMatrix3x3(q);

      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const expected = [cos, 0, -sin, 0, 1, 0, sin, 0, cos];

      expected.forEach((value, index) => {
        expect(matrix[index]).toBeCloseTo(value, 6);
      });
    });

    it('matches the top-left 3x3 block of matrix3d output', () => {
      const q = quat_fromAxisAngle([1, 0, 0], Math.PI / 6);
      const rotation3x3 = quat_toRotationMatrix3x3(q);
      const matrix3d = quat_toMatrix3d(q);

      const valuesMatch = matrix3d.match(/matrix3d\(([^)]+)\)/);
      if (!valuesMatch) {
        throw new Error('matrix3d output did not match expected format');
      }

      const rawValues = valuesMatch[1];
      if (rawValues === undefined) {
        throw new Error('matrix3d output missing captured values');
      }

      const values = rawValues.split(',').map((value) => Number.parseFloat(value.trim()));

      expect(values).toHaveLength(16);

      const topLeft = [values[0], values[1], values[2], values[4], values[5], values[6], values[8], values[9], values[10]] as [
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number
      ];
      const topLeftArray: number[] = [...topLeft];

      rotation3x3.forEach((value, index) => {
        expect(value).toBeCloseTo(topLeftArray[index]!, 6);
      });
    });

    it('returns orthonormal columns', () => {
      const q = quat_fromAxisAngle([1, 1, 0], Math.PI / 3);
      const matrix = quat_toRotationMatrix3x3(q);

      expect(matrix).toHaveLength(9);

      const typedMatrix = matrix as [
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number
      ];

      const [m00, m10, m20, m01, m11, m21, m02, m12, m22] = typedMatrix;
      const columns = [
        [m00, m10, m20],
        [m01, m11, m21],
        [m02, m12, m22]
      ] as [
        [number, number, number],
        [number, number, number],
        [number, number, number]
      ];
      const dot = (a: [number, number, number], b: [number, number, number]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
      const magnitude = (v: [number, number, number]) => Math.sqrt(dot(v, v));

      const [col0, col1, col2] = columns;

      expect(magnitude(col0)).toBeCloseTo(1, 6);
      expect(magnitude(col1)).toBeCloseTo(1, 6);
      expect(magnitude(col2)).toBeCloseTo(1, 6);

      expect(dot(col0, col1)).toBeCloseTo(0, 6);
      expect(dot(col1, col2)).toBeCloseTo(0, 6);
      expect(dot(col0, col2)).toBeCloseTo(0, 6);
    });
  });
});

