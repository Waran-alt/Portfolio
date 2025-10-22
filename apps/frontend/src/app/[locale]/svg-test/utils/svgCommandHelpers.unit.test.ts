import type { Command as SVGCommand } from 'svg-path-parser';
import {
  getCommandCoords,
  getCommandValue,
  getControlPoint1,
  getControlPoint2,
  hasControlPoint1,
  hasControlPoint2,
  hasCoordinates
} from './svgCommandHelpers';

describe('SVG Command Helpers Unit', () => {
  describe('hasCoordinates', () => {
    it('should return true for command with coordinates', () => {
      const cmd: SVGCommand = { code: 'M', x: 100, y: 200 };
      
      const result = hasCoordinates(cmd);
      
      expect(result).toBe(true);
    });

    it('should return false for command without coordinates', () => {
      const cmd: SVGCommand = { code: 'Z' };
      
      const result = hasCoordinates(cmd);
      
      expect(result).toBe(false);
    });

    it('should return false for command with partial coordinates', () => {
      const cmd: SVGCommand = { code: 'M', x: 100 };
      
      const result = hasCoordinates(cmd);
      
      expect(result).toBe(false);
    });
  });

  describe('getCommandCoords', () => {
    it('should extract coordinates from command', () => {
      const cmd: SVGCommand = { code: 'M', x: 100, y: 200 };
      
      const coords = getCommandCoords(cmd);
      
      expect(coords.x).toBe(100);
      expect(coords.y).toBe(200);
    });

    it('should return zero coordinates for command without coordinates', () => {
      const cmd: SVGCommand = { code: 'Z' };
      
      const coords = getCommandCoords(cmd);
      
      expect(coords.x).toBe(0);
      expect(coords.y).toBe(0);
    });

    it('should handle command with partial coordinates', () => {
      const cmd: SVGCommand = { code: 'M', x: 100 };
      
      const coords = getCommandCoords(cmd);
      
      expect(coords.x).toBe(0);
      expect(coords.y).toBe(0);
    });
  });

  describe('hasControlPoint1', () => {
    it('should return true for command with control point 1', () => {
      const cmd: SVGCommand = { code: 'Q', x: 100, y: 200, x1: 50, y1: 150 };
      
      const result = hasControlPoint1(cmd);
      
      expect(result).toBe(true);
    });

    it('should return false for command without control point 1', () => {
      const cmd: SVGCommand = { code: 'M', x: 100, y: 200 };
      
      const result = hasControlPoint1(cmd);
      
      expect(result).toBe(false);
    });

    it('should return false for command with partial control point 1', () => {
      const cmd: SVGCommand = { code: 'Q', x: 100, y: 200, x1: 50 };
      
      const result = hasControlPoint1(cmd);
      
      expect(result).toBe(false);
    });
  });

  describe('hasControlPoint2', () => {
    it('should return true for command with control point 2', () => {
      const cmd: SVGCommand = { code: 'C', x: 100, y: 200, x1: 50, y1: 150, x2: 75, y2: 175 };
      
      const result = hasControlPoint2(cmd);
      
      expect(result).toBe(true);
    });

    it('should return false for command without control point 2', () => {
      const cmd: SVGCommand = { code: 'Q', x: 100, y: 200, x1: 50, y1: 150 };
      
      const result = hasControlPoint2(cmd);
      
      expect(result).toBe(false);
    });

    it('should return false for command with partial control point 2', () => {
      const cmd: SVGCommand = { code: 'C', x: 100, y: 200, x1: 50, y1: 150, x2: 75 };
      
      const result = hasControlPoint2(cmd);
      
      expect(result).toBe(false);
    });
  });

  describe('getControlPoint1', () => {
    it('should extract control point 1 coordinates', () => {
      const cmd: SVGCommand = { code: 'Q', x: 100, y: 200, x1: 50, y1: 150 };
      
      const coords = getControlPoint1(cmd);
      
      expect(coords.x).toBe(50);
      expect(coords.y).toBe(150);
    });

    it('should return zero coordinates for command without control point 1', () => {
      const cmd: SVGCommand = { code: 'M', x: 100, y: 200 };
      
      const coords = getControlPoint1(cmd);
      
      expect(coords.x).toBe(0);
      expect(coords.y).toBe(0);
    });

    it('should handle command with partial control point 1', () => {
      const cmd: SVGCommand = { code: 'Q', x: 100, y: 200, x1: 50 };
      
      const coords = getControlPoint1(cmd);
      
      expect(coords.x).toBe(0);
      expect(coords.y).toBe(0);
    });
  });

  describe('getControlPoint2', () => {
    it('should extract control point 2 coordinates', () => {
      const cmd: SVGCommand = { code: 'C', x: 100, y: 200, x1: 50, y1: 150, x2: 75, y2: 175 };
      
      const coords = getControlPoint2(cmd);
      
      expect(coords.x).toBe(75);
      expect(coords.y).toBe(175);
    });

    it('should return zero coordinates for command without control point 2', () => {
      const cmd: SVGCommand = { code: 'Q', x: 100, y: 200, x1: 50, y1: 150 };
      
      const coords = getControlPoint2(cmd);
      
      expect(coords.x).toBe(0);
      expect(coords.y).toBe(0);
    });

    it('should handle command with partial control point 2', () => {
      const cmd: SVGCommand = { code: 'C', x: 100, y: 200, x1: 50, y1: 150, x2: 75 };
      
      const coords = getControlPoint2(cmd);
      
      expect(coords.x).toBe(0);
      expect(coords.y).toBe(0);
    });
  });

  describe('getCommandValue', () => {
    it('should extract existing property value', () => {
      const cmd: SVGCommand = { code: 'M', x: 100, y: 200 };
      
      const xValue = getCommandValue(cmd, 'x');
      const yValue = getCommandValue(cmd, 'y');
      const codeValue = getCommandValue(cmd, 'code');
      
      expect(xValue).toBe(100);
      expect(yValue).toBe(200);
      expect(codeValue).toBe('M');
    });

    it('should return undefined for non-existent property', () => {
      const cmd: SVGCommand = { code: 'M', x: 100, y: 200 };
      
      const value = getCommandValue(cmd, 'nonexistent');
      
      expect(value).toBeUndefined();
    });

    it('should handle commands with different properties', () => {
      const cmd: SVGCommand = { code: 'C', x: 100, y: 200, x1: 50, y1: 150, x2: 75, y2: 175 };
      
      const x1Value = getCommandValue(cmd, 'x1');
      const y2Value = getCommandValue(cmd, 'y2');
      
      expect(x1Value).toBe(50);
      expect(y2Value).toBe(175);
    });
  });

  describe('Integration Tests', () => {
    it('should work with move command', () => {
      const cmd: SVGCommand = { code: 'M', x: 100, y: 200 };
      
      expect(hasCoordinates(cmd)).toBe(true);
      expect(getCommandCoords(cmd)).toEqual({ x: 100, y: 200 });
      expect(hasControlPoint1(cmd)).toBe(false);
      expect(hasControlPoint2(cmd)).toBe(false);
    });

    it('should work with line command', () => {
      const cmd: SVGCommand = { code: 'L', x: 150, y: 250 };
      
      expect(hasCoordinates(cmd)).toBe(true);
      expect(getCommandCoords(cmd)).toEqual({ x: 150, y: 250 });
      expect(hasControlPoint1(cmd)).toBe(false);
      expect(hasControlPoint2(cmd)).toBe(false);
    });

    it('should work with quadratic bezier command', () => {
      const cmd: SVGCommand = { code: 'Q', x: 200, y: 300, x1: 150, y1: 250 };
      
      expect(hasCoordinates(cmd)).toBe(true);
      expect(getCommandCoords(cmd)).toEqual({ x: 200, y: 300 });
      expect(hasControlPoint1(cmd)).toBe(true);
      expect(getControlPoint1(cmd)).toEqual({ x: 150, y: 250 });
      expect(hasControlPoint2(cmd)).toBe(false);
    });

    it('should work with cubic bezier command', () => {
      const cmd: SVGCommand = { code: 'C', x: 300, y: 400, x1: 200, y1: 300, x2: 250, y2: 350 };
      
      expect(hasCoordinates(cmd)).toBe(true);
      expect(getCommandCoords(cmd)).toEqual({ x: 300, y: 400 });
      expect(hasControlPoint1(cmd)).toBe(true);
      expect(getControlPoint1(cmd)).toEqual({ x: 200, y: 300 });
      expect(hasControlPoint2(cmd)).toBe(true);
      expect(getControlPoint2(cmd)).toEqual({ x: 250, y: 350 });
    });

    it('should work with close path command', () => {
      const cmd: SVGCommand = { code: 'Z' };
      
      expect(hasCoordinates(cmd)).toBe(false);
      expect(getCommandCoords(cmd)).toEqual({ x: 0, y: 0 });
      expect(hasControlPoint1(cmd)).toBe(false);
      expect(hasControlPoint2(cmd)).toBe(false);
    });
  });
});
