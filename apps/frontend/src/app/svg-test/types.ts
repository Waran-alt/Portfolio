/**
 * @file Defines shared TypeScript types used across the SVG Test Page feature.
 */

/**
 * Represents a point on the SVG canvas that can be interacted with.
 * @property {number} x - The x-coordinate of the point.
 * @property {number} y - The y-coordinate of the point.
 * @property {string} id - A unique identifier for the point, used for React keys and state management.
 * @property {string} label - A human-readable label for the point (e.g., 'Start', 'Control 1').
 */
export interface Point {
  x: number;
  y: number;
  id: string;
  label: string;
}

/**
 * Represents a predefined example of an SVG path for demonstration.
 * @property {string} id - A unique identifier for the example.
 * @property {string} title - The display name of the example.
 * @property {string} description - A detailed explanation of the SVG commands used.
 * @property {string} method - The primary method or command being demonstrated.
 * @property {Point[]} points - The set of interactive points associated with the example.
 * @property {string} pathData - The raw SVG path data string.
 * @property {boolean} showControls - Whether to show control lines for this example.
 * @property {boolean} showHandles - Whether to show draggable handles for this example.
 */
export interface PathExample {
  id: string;
  title: string;
  description: string;
  method: string;
  points: Point[];
  pathData: string;
  showControls: boolean;
  showHandles: boolean;
} 