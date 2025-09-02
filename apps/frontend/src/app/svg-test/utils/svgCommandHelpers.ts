/**
 * @file Shared utility functions for working with SVG path commands.
 * These functions provide type-safe access to command properties and coordinates.
 */
import type { Command as SVGCommand } from 'svg-path-parser';

/**
 * Type guard to check if a command has x,y coordinates
 */
export const hasCoordinates = (cmd: SVGCommand): cmd is SVGCommand & { x: number; y: number } => {
  return 'x' in cmd && 'y' in cmd;
};

/**
 * Helper function to safely extract coordinates from SVG commands
 */
export const getCommandCoords = (cmd: SVGCommand): { x: number; y: number } => {
  if (hasCoordinates(cmd)) {
    return { x: cmd.x, y: cmd.y };
  }
  // Fallback for commands without coordinates (shouldn't happen with our usage)
  return { x: 0, y: 0 };
};

/**
 * Type guard to check if a command has control point coordinates (x1, y1)
 */
export const hasControlPoint1 = (cmd: SVGCommand): cmd is SVGCommand & { x1: number; y1: number } => {
  return 'x1' in cmd && 'y1' in cmd;
};

/**
 * Type guard to check if a command has control point coordinates (x2, y2)
 */
export const hasControlPoint2 = (cmd: SVGCommand): cmd is SVGCommand & { x2: number; y2: number } => {
  return 'x2' in cmd && 'y2' in cmd;
};

/**
 * Helper function to safely extract control point 1 coordinates
 */
export const getControlPoint1 = (cmd: SVGCommand): { x: number; y: number } => {
  if (hasControlPoint1(cmd)) {
    return { x: cmd.x1, y: cmd.y1 };
  }
  return { x: 0, y: 0 };
};

/**
 * Helper function to safely extract control point 2 coordinates
 */
export const getControlPoint2 = (cmd: SVGCommand): { x: number; y: number } => {
  if (hasControlPoint2(cmd)) {
    return { x: cmd.x2, y: cmd.y2 };
  }
  return { x: 0, y: 0 };
};

/**
 * Helper function to safely access command properties
 * Used for accessing any property on SVG commands in a type-safe way
 */
export const getCommandValue = (cmd: SVGCommand, param: string): unknown => {
  if (param in cmd) {
    return (cmd as unknown as Record<string, unknown>)[param];
  }
  return undefined;
}; 