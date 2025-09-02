/**
 * @file This file contains constants related to SVG path commands.
 * It provides a centralized source of information about each command,
 * such as its name, parameters, and a description.
 */

/**
 * A comprehensive record of SVG path commands and their associated metadata.
 * Used by other components to dynamically display information about a path string.
 */
export const SVG_COMMAND_INFO: Record<string, { name: string; params: string[]; desc: string }> = {
  M: { name: 'Move To', params: ['x', 'y'], desc: 'Move the pen to (x, y) without drawing.' },
  L: { name: 'Line To', params: ['x', 'y'], desc: 'Draw a straight line to (x, y).' },
  H: { name: 'Horizontal Line To', params: ['x'], desc: 'Draw a horizontal line to x.' },
  V: { name: 'Vertical Line To', params: ['y'], desc: 'Draw a vertical line to y.' },
  Q: { name: 'Quadratic Bézier', params: ['x1', 'y1', 'x', 'y'], desc: 'Draw a quadratic Bézier curve using (x1, y1) as control point, ending at (x, y).' },
  C: { name: 'Cubic Bézier', params: ['x1', 'y1', 'x2', 'y2', 'x', 'y'], desc: 'Draw a cubic Bézier curve using (x1, y1) and (x2, y2) as control points, ending at (x, y).' },
  S: { name: 'Smooth Cubic Bézier', params: ['x2', 'y2', 'x', 'y'], desc: 'Draw a smooth cubic Bézier curve using (x2, y2) as control, ending at (x, y).' },
  T: { name: 'Smooth Quadratic Bézier', params: ['x', 'y'], desc: 'Draw a smooth quadratic Bézier curve ending at (x, y).' },
  A: { name: 'Arc', params: ['rx', 'ry', 'xAxisRotation', 'largeArcFlag', 'sweepFlag', 'x', 'y'], desc: 'Draw an elliptical arc.' },
  Z: { name: 'Close Path', params: [], desc: 'Close the path.' },
};

/**
 * An array of SVG command codes that are suitable for being appended to a path via the UI.
 * This excludes 'Z' as it is handled separately by a dedicated control.
 */
export const APPENDABLE_COMMANDS = ['M', 'L', 'H', 'V', 'C', 'S', 'Q', 'T', 'A']; 