/**
 * @file Contains a collection of predefined SVG path examples.
 * These examples are used to demonstrate different path commands and curve types
 * in the SVG Test Page visualizer.
 * 
 * All titles, descriptions, and point labels use translation keys that are
 * resolved at runtime based on the user's selected language.
 */
import type { PathExample } from '../types';

/**
 * The default example ID used when the application starts.
 */
export const DEFAULT_EXAMPLE_ID = 'quadratic-1';

/**
 * A collection of predefined SVG path examples used in the visualizer.
 * Titles and descriptions are translation keys (e.g., 'examples.quadratic1.title').
 */
export const PATH_EXAMPLES: PathExample[] = [
  {
    id: 'quadratic-1',
    title: 'examples.quadratic1.title',
    description: 'examples.quadratic1.description',
    method: 'quadratic',
    points: [
      { x: 100, y: 200, id: 'start', label: 'points.start' },
      { x: 200, y: 100, id: 'control', label: 'points.control' },
      { x: 300, y: 200, id: 'end', label: 'points.end' },
    ],
    pathData: 'M 100,200 Q 200,100 300,200',
    showControls: true,
    showHandles: true,
  },
  {
    id: 'cubic-1',
    title: 'examples.cubic1.title',
    description: 'examples.cubic1.description',
    method: 'cubic',
    points: [
      { x: 100, y: 200, id: 'start', label: 'points.start' },
      { x: 150, y: 100, id: 'control1', label: 'points.control1' },
      { x: 250, y: 100, id: 'control2', label: 'points.control2' },
      { x: 300, y: 200, id: 'end', label: 'points.end' },
    ],
    pathData: 'M 100,200 C 150,100 250,100 300,200',
    showControls: true,
    showHandles: true,
  },
  {
    id: 'arc-1',
    title: 'examples.arc1.title',
    description: 'examples.arc1.description',
    method: 'arc',
    points: [
      { x: 100, y: 200, id: 'start', label: 'points.start' },
      { x: 300, y: 200, id: 'end', label: 'points.end' },
      { x: 200, y: 150, id: 'center', label: 'points.center' },
    ],
    pathData: 'M 100,200 A 100,50 0 0 1 300,200',
    showControls: true,
    showHandles: false,
  },
  {
    id: 'catmull-rom-1',
    title: 'examples.catmullRom1.title',
    description: 'examples.catmullRom1.description',
    method: 'catmull-rom',
    points: [
      { x: 50, y: 200, id: 'p0', label: 'points.p0' },
      { x: 100, y: 150, id: 'p1', label: 'points.p1' },
      { x: 200, y: 100, id: 'p2', label: 'points.p2' },
      { x: 300, y: 150, id: 'p3', label: 'points.p3' },
      { x: 350, y: 200, id: 'p4', label: 'points.p4' },
    ],
    pathData:
      'M 50,200 C 50,200 66.6667,166.667 100,150 C 133.333,133.333 166.667,116.667 200,100 C 233.333,83.3333 266.667,116.667 300,150 C 333.333,183.333 350,200 350,200',
    showControls: true,
    showHandles: false,
  },
  {
    id: 'bezier-spline-1',
    title: 'examples.bezierSpline1.title',
    description: 'examples.bezierSpline1.description',
    method: 'bezier',
    points: [
      { x: 50, y: 200, id: 'start', label: 'points.start' },
      { x: 100, y: 100, id: 'c1', label: 'points.c1' },
      { x: 150, y: 100, id: 'c2', label: 'points.c2' },
      { x: 200, y: 200, id: 'mid', label: 'points.mid' },
      { x: 250, y: 100, id: 'c3', label: 'points.c3' },
      { x: 300, y: 100, id: 'c4', label: 'points.c4' },
      { x: 350, y: 200, id: 'end', label: 'points.end' },
    ],
    pathData: 'M 50,200 C 100,100 150,100 200,200 S 250,100 350,200',
    showControls: true,
    showHandles: true,
  },
  {
    id: 'smooth-spline-1',
    title: 'examples.smoothSpline1.title',
    description: 'examples.smoothSpline1.description',
    method: 'spline',
    points: [
      { x: 50, y: 200, id: 'p1', label: 'points.p1' },
      { x: 150, y: 100, id: 'p2', label: 'points.p2' },
      { x: 250, y: 150, id: 'p3', label: 'points.p3' },
      { x: 350, y: 200, id: 'p4', label: 'points.p4' },
    ],
    pathData:
      'M 50,200 C 60,180 130,120 150,100 C 170,80 230,130 250,150 C 270,170 340,180 350,200',
    showControls: true,
    showHandles: false,
  },
]; 