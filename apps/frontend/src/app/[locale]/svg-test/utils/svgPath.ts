/**
 * @file Provides utility functions for SVG path manipulation and calculations.
 * This includes formatting numbers for display, calculating midpoints for lines
 * and curves, and extracting coordinate points from parsed path data.
 */
import type { Command as SVGCommand } from 'svg-path-parser';
import * as parser from 'svg-path-parser';
import type { Point } from '../types';

export const DECIMAL_DIGITS = 2;

/**
 * Formats a number to a specific number of decimal places, preserving trailing zeros.
 * @param n The number to format.
 * @param digits The number of decimal places.
 * @returns The formatted number as a string.
 */
export function formatNumber(n: number, digits: number = DECIMAL_DIGITS): string {
  return n.toFixed(digits);
}

export function midpoint(x1: number, y1: number, x2: number, y2: number) {
  return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
}

/**
 * Calculates the coordinates of the point on a cubic Bezier curve at t=0.5.
 * @param x0 The x-coordinate of the starting point.
 * @param y0 The y-coordinate of the starting point.
 * @param x1 The x-coordinate of the first control point.
 * @param y1 The y-coordinate of the first control point.
 * @param x2 The x-coordinate of the second control point.
 * @param y2 The y-coordinate of the second control point.
 * @param x3 The x-coordinate of the end point.
 * @param y3 The y-coordinate of the end point.
 * @returns The coordinates of the point at t=0.5.
 */
export const cubicBezierMidpoint = (x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) => {
  const t = 0.5;
  const mt = 1 - t;
  const x = mt * mt * mt * x0 + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t * x3;
  const y = mt * mt * mt * y0 + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y3;
  return { x, y };
};

/**
 * Extracts all draggable point coordinates from a parsed command array.
 * This function processes all commands in a path, not just the first one,
 * and generates unique IDs for each point to be used in React keys.
 * It uses `makeAbsolute` to handle relative path commands correctly.
 * @param commands The array of parsed SVG commands from svg-path-parser.
 * @returns An array of all points with unique IDs and labels.
 */
// Future-proofing Note: This function currently only extracts the endpoint of an Arc ('A')
// command for dragging. A more advanced implementation could also extract the rx, ry,
// and rotation parameters to allow for full manipulation of the arc's shape,
// likely requiring different UI controls like sliders.
export const extractPointsFromCommands = (commands: SVGCommand[]): Point[] => {
  const newPoints: Point[] = [];
  const absoluteCommands = parser.makeAbsolute(commands);

  absoluteCommands.forEach((cmd, i) => {
    switch (cmd.code) {
      case 'M':
        newPoints.push({ x: cmd.x, y: cmd.y, id: `pt-${i}-m`, label: 'Start' });
        break;
      case 'L':
      case 'H':
      case 'V':
      case 'T':
        newPoints.push({ x: cmd.x, y: cmd.y, id: `pt-${i}-end`, label: 'End' });
        break;
      case 'Q':
        newPoints.push({ x: cmd.x1, y: cmd.y1, id: `pt-${i}-q1`, label: 'Control' });
        newPoints.push({ x: cmd.x, y: cmd.y, id: `pt-${i}-q-end`, label: 'End' });
        break;
      case 'C':
        newPoints.push({ x: cmd.x1, y: cmd.y1, id: `pt-${i}-c1`, label: 'Control 1' });
        newPoints.push({ x: cmd.x2, y: cmd.y2, id: `pt-${i}-c2`, label: 'Control 2' });
        newPoints.push({ x: cmd.x, y: cmd.y, id: `pt-${i}-c-end`, label: 'End' });
        break;
      case 'S':
        newPoints.push({ x: cmd.x2, y: cmd.y2, id: `pt-${i}-s2`, label: 'Control 2' });
        newPoints.push({ x: cmd.x, y: cmd.y, id: `pt-${i}-s-end`, label: 'End' });
        break;
      case 'A':
        newPoints.push({ x: cmd.x, y: cmd.y, id: `pt-${i}-a-end`, label: 'End' });
        break;
      // Z command has no points
    }
  });
  return newPoints;
}; 