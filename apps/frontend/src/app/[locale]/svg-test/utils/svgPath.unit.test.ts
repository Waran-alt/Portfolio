import type { Command as SVGCommand } from 'svg-path-parser';
import * as parser from 'svg-path-parser';
import { cubicBezierMidpoint, extractPointsFromCommands, formatCommandsToPath, formatNumber, formatPathString, midpoint } from './svgPath';

// Mock the makeAbsolute function to isolate our tests
jest.mock('svg-path-parser', () => ({
  ...jest.requireActual('svg-path-parser'),
  makeAbsolute: jest.fn(commands => jest.requireActual('svg-path-parser').makeAbsolute(commands)),
}));

describe('svgPath utilities', () => {

  describe('formatNumber', () => {
    it('should format a number to default decimal places', () => {
      expect(formatNumber(10.12345)).toBe('10.12');
    });

    it('should preserve trailing zeros', () => {
      expect(formatNumber(10, 2)).toBe('10.00');
    });

    it('should round numbers correctly', () => {
      // Note: .toFixed() has specific rounding behavior for .5 cases
      expect(formatNumber(10.555, 2)).toBe('10.55');
    });

    it('should handle zero decimal places', () => {
      expect(formatNumber(10.555, 0)).toBe('11');
    });

    it('should format negative numbers correctly', () => {
      expect(formatNumber(-10.123, 2)).toBe('-10.12');
    });
  });

  describe('midpoint', () => {
    it('should calculate the midpoint between two points', () => {
      expect(midpoint(10, 20, 30, 40)).toEqual({ x: 20, y: 30 });
    });

    it('should handle negative coordinates', () => {
      expect(midpoint(-10, -20, -30, -40)).toEqual({ x: -20, y: -30 });
    });
  });

  describe('cubicBezierMidpoint', () => {
    it('should calculate the correct midpoint for a cubic Bezier curve', () => {
      const mid = cubicBezierMidpoint(0, 0, 10, 20, 30, 20, 40, 0);
      expect(mid.x).toBeCloseTo(20);
      expect(mid.y).toBeCloseTo(15);
    });
  });

  describe('extractPointsFromCommands', () => {
    const mockMakeAbsolute = parser.makeAbsolute as jest.Mock;

    beforeEach(() => {
      mockMakeAbsolute.mockClear();
    });

    it('should call parser.makeAbsolute with the input commands', () => {
      const commands = [{ code: 'm', x: 10, y: 10 }] as SVGCommand[];
      extractPointsFromCommands(commands);
      expect(mockMakeAbsolute).toHaveBeenCalledWith(commands);
    });

    it('should extract points from a complex path with various commands', () => {
      const commands = parser.parseSVG('M 10,10 L 20,20 Q 30,30 40,40 Z');
      const points = extractPointsFromCommands(commands);

      expect(points).toHaveLength(4);
      
      // M point
      expect(points[0]).toEqual(expect.objectContaining({ id: 'pt-0-m', label: 'Start', x: 10, y: 10 }));
      // L point
      expect(points[1]).toEqual(expect.objectContaining({ id: 'pt-1-end', label: 'End', x: 20, y: 20 }));
      // Q points
      expect(points[2]).toEqual(expect.objectContaining({ id: 'pt-2-q1', label: 'Control', x: 30, y: 30 }));
      expect(points[3]).toEqual(expect.objectContaining({ id: 'pt-2-q-end', label: 'End', x: 40, y: 40 }));
    });

    it('should not extract any points for a Z command', () => {
        const commands = parser.parseSVG('M 10,10 Z');
        const points = extractPointsFromCommands(commands);
        expect(points.find(p => p.id.includes('-z'))).toBeUndefined();
    });

    it('should return an empty array for empty input', () => {
      expect(extractPointsFromCommands([])).toEqual([]);
    });
  });

  describe('formatPathString / formatCommandsToPath', () => {
    it('should canonicalize simple move/line with commas and single spaces', () => {
      expect(formatPathString('M 0 0 L 100 100')).toBe('M 0,0 L 100,100');
      expect(formatPathString('M0,0   L   100 100')).toBe('M 0,0 L 100,100');
    });

    it('should format horizontal and vertical commands as scalars', () => {
      expect(formatPathString('M 10 10 H 20 V 30')).toBe('M 10,10 H 20 V 30');
    });

    it('should format quadratic and cubic curves with comma-separated pairs', () => {
      expect(formatPathString('M 0 0 Q 10 20 30 40')).toBe('M 0,0 Q 10,20 30,40');
      expect(formatPathString('M 0 0 C 10 20 30 40 50 60')).toBe('M 0,0 C 10,20 30,40 50,60');
    });

    it('should format smooth curves and close path', () => {
      expect(formatPathString('M 0 0 S 10 20 30 40 Z')).toBe('M 0,0 S 10,20 30,40 Z');
    });

    it('should format arc command with flags and end point', () => {
      // A rx ry xAxisRotation largeArcFlag sweepFlag x y
      expect(formatPathString('M 0 0 A 50 25 45 1 0 100 100')).toBe('M 0,0 A 50,25 45 1 0 100,100');
    });

    it('should preserve command casing as produced by parser', () => {
      // svg-path-parser normalizes some commands; verify our formatter mirrors its casing
      expect(formatPathString('m 0 0 l 10 10 z')).toBe('M 0,0 l 10,10 Z');
    });

    it('should trim and return original on parse failure', () => {
      expect(formatPathString('  invalid ')).toBe('invalid');
    });

    it('formatCommandsToPath should produce canonical output from parsed commands', () => {
      const cmds = parser.parseSVG('M 1 2 L 3 4');
      expect(formatCommandsToPath(cmds)).toBe('M 1,2 L 3,4');
    });
  });
}); 