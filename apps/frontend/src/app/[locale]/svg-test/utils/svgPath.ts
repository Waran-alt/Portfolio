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

/**
 * Formats an SVG path string into a canonical "space-and-comma" style used by the UI:
 * - Commands are separated by a single space
 * - Each coordinate pair is formatted as x,y (with a comma)
 * - Scalar parameters (e.g., H, V, rotation/flags in A) are space-separated
 * - Command letters are preserved as-is from input (case kept), parameters normalized
 *
 * This avoids ad-hoc regex replacements and ensures consistent display.
 */
export function formatPathString(path: string): string {
  try {
    const commands = parser.parseSVG(path);
    return formatCommandsToPath(commands);
  } catch {
    // If parsing fails, return a trimmed version so callers can decide next steps
    return path.trim();
  }
}

/**
 * Converts parsed SVG commands to a canonical path string.
 * Consumers that already have parsed commands can use this directly.
 */
export function formatCommandsToPath(commands: SVGCommand[]): string {
  const pieces: string[] = [];

  for (const cmd of commands) {
    const code = cmd.code; // Preserve original case as provided
    // The svg-path-parser Command type is a discriminated union where available properties vary per command.
    // To keep code clear without broad 'any', use a typed unknown cast and narrow per usage.
    type CommandFields = {
      x?: number; y?: number; x1?: number; y1?: number; x2?: number; y2?: number;
      rx?: number; ry?: number; xAxisRotation?: number; largeArc?: boolean; sweep?: boolean;
    };
    const c = cmd as unknown as SVGCommand & CommandFields;
    const out: string[] = [code];

    switch (code.toUpperCase()) {
      case 'M':
      case 'L':
      case 'T': {
        out.push(pair(c.x, c.y));
        break;
      }
      case 'H': {
        out.push(num(c.x));
        break;
      }
      case 'V': {
        out.push(num(c.y));
        break;
      }
      case 'Q': {
        out.push(pair(c.x1, c.y1));
        out.push(pair(c.x, c.y));
        break;
      }
      case 'C': {
        out.push(pair(c.x1, c.y1));
        out.push(pair(c.x2, c.y2));
        out.push(pair(c.x, c.y));
        break;
      }
      case 'S': {
        out.push(pair(c.x2, c.y2));
        out.push(pair(c.x, c.y));
        break;
      }
      case 'A': {
        // rx,ry xAxisRotation largeArc sweep x,y
        out.push(pair(c.rx, c.ry));
        out.push(num(c.xAxisRotation));
        out.push(String(+(c.largeArc ?? false)));
        out.push(String(+(c.sweep ?? false)));
        out.push(pair(c.x, c.y));
        break;
      }
      case 'Z':
        // No params
        break;
      default: {
        // Unknown commands: best-effort include any known numeric props in a stable order
        const extras: Array<string> = [];
        const keys = ['x1','y1','x2','y2','rx','ry','xAxisRotation','largeArc','sweep','x','y'] as const;
        const rec = c as unknown as Record<string, unknown>;
        for (const k of keys) {
          const v = rec[k as string];
          if (typeof v === 'number') {
            if (k === 'x' || k === 'y') continue; // handled by pair below if both exist
            extras.push(num(v));
          } else if (typeof v === 'boolean') {
            extras.push(String(+v));
          }
        }
        if (typeof c.x === 'number' && typeof c.y === 'number') {
          extras.push(pair(c.x, c.y));
        }
        out.push(...extras);
      }
    }

    pieces.push(out.join(' '));
  }

  return pieces.join(' ').replace(/\s+/g, ' ').trim();
}

function num(n: number | undefined): string {
  if (typeof n !== 'number' || Number.isNaN(n)) return '0';
  // Keep up to 6 decimals, trim trailing zeros/decimal point
  const s = n.toFixed(6);
  return s.includes('.') ? s.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1') : s;
}

function pair(a: number | undefined, b: number | undefined): string {
  return `${num(a)},${num(b)}`;
}