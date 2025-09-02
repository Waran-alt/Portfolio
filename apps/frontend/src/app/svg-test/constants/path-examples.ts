/**
 * @file Contains a collection of predefined SVG path examples.
 * These examples are used to demonstrate different path commands and curve types
 * in the SVG Test Page visualizer.
 */
import type { PathExample } from '../types';

/**
 * A collection of predefined SVG path examples used in the visualizer.
 * Each example includes a title, description, and the raw path data.
 */
export const PATH_EXAMPLES: PathExample[] = [
  {
    id: 'quadratic-1',
    title: 'Simple Quadratic Curve',
    description:
      'Q: Draws a quadratic Bézier curve from the current point to the end point, using one control point. Format: Q x1 y1 x y',
    method: 'quadratic',
    points: [
      { x: 100, y: 200, id: 'start', label: 'Start' },
      { x: 200, y: 100, id: 'control', label: 'Control' },
      { x: 300, y: 200, id: 'end', label: 'End' },
    ],
    pathData: 'M 100,200 Q 200,100 300,200',
    showControls: true,
    showHandles: true,
  },
  {
    id: 'cubic-1',
    title: 'Cubic Bézier Curve',
    description:
      'C: Draws a cubic Bézier curve from the current point to the end point, using two control points. Format: C x1 y1 x2 y2 x y',
    method: 'cubic',
    points: [
      { x: 100, y: 200, id: 'start', label: 'Start' },
      { x: 150, y: 100, id: 'control1', label: 'Control 1' },
      { x: 250, y: 100, id: 'control2', label: 'Control 2' },
      { x: 300, y: 200, id: 'end', label: 'End' },
    ],
    pathData: 'M 100,200 C 150,100 250,100 300,200',
    showControls: true,
    showHandles: true,
  },
  {
    id: 'arc-1',
    title: 'SVG Arc',
    description:
      'A: Draws an elliptical arc curve. Format: A rx ry x-axis-rotation large-arc-flag sweep-flag x y',
    method: 'arc',
    points: [
      { x: 100, y: 200, id: 'start', label: 'Start' },
      { x: 300, y: 200, id: 'end', label: 'End' },
      { x: 200, y: 150, id: 'center', label: 'Center' },
    ],
    pathData: 'M 100,200 A 100,50 0 0 1 300,200',
    showControls: true,
    showHandles: false,
  },
  {
    id: 'catmull-rom-1',
    title: 'Catmull-Rom Spline',
    description:
      'Catmull-Rom: Smooth curve through multiple points, approximated using cubic Bézier segments.',
    method: 'catmull-rom',
    points: [
      { x: 50, y: 200, id: 'p0', label: 'P0' },
      { x: 100, y: 150, id: 'p1', label: 'P1' },
      { x: 200, y: 100, id: 'p2', label: 'P2' },
      { x: 300, y: 150, id: 'p3', label: 'P3' },
      { x: 350, y: 200, id: 'p4', label: 'P4' },
    ],
    pathData:
      'M 50,200 C 50,200 66.6667,166.667 100,150 C 133.333,133.333 166.667,116.667 200,100 C 233.333,83.3333 266.667,116.667 300,150 C 333.333,183.333 350,200 350,200',
    showControls: true,
    showHandles: false,
  },
  {
    id: 'bezier-spline-1',
    title: 'Bézier Spline',
    description: 'Multiple cubic Bézier (C) segments connected smoothly.',
    method: 'bezier',
    points: [
      { x: 50, y: 200, id: 'start', label: 'Start' },
      { x: 100, y: 100, id: 'c1', label: 'C1' },
      { x: 150, y: 100, id: 'c2', label: 'C2' },
      { x: 200, y: 200, id: 'mid', label: 'Mid' },
      { x: 250, y: 100, id: 'c3', label: 'C3' },
      { x: 300, y: 100, id: 'c4', label: 'C4' },
      { x: 350, y: 200, id: 'end', label: 'End' },
    ],
    pathData: 'M 50,200 C 100,100 150,100 200,200 S 250,100 350,200',
    showControls: true,
    showHandles: true,
  },
  {
    id: 'smooth-spline-1',
    title: 'Smooth Spline',
    description:
      'Smooth spline: Custom smooth curve with tension control, not a standard SVG path command.',
    method: 'spline',
    points: [
      { x: 50, y: 200, id: 'p1', label: 'P1' },
      { x: 150, y: 100, id: 'p2', label: 'P2' },
      { x: 250, y: 150, id: 'p3', label: 'P3' },
      { x: 350, y: 200, id: 'p4', label: 'P4' },
    ],
    pathData:
      'M 50,200 C 60,180 130,120 150,100 C 170,80 230,130 250,150 C 270,170 340,180 350,200',
    showControls: true,
    showHandles: false,
  },
]; 