/**
 * @file Renders an overlay on an SVG canvas, displaying the command codes
 * (e.g., 'M', 'L', 'C') and coordinate points for a given SVG path string.
 * This helps visualize the structure and control points of the path.
 */
import React from 'react';
import type { Command as SVGCommand } from 'svg-path-parser';
import * as parser from 'svg-path-parser';
import { getCommandCoords, getControlPoint1, getControlPoint2 } from '../utils/svgCommandHelpers';
import { cubicBezierMidpoint, DECIMAL_DIGITS, formatNumber, midpoint } from '../utils/svgPath';

// Constants for positioning the overlays to avoid magic numbers.
const COMMAND_LETTER_Y_OFFSET = -10;
const COORDINATE_Y_OFFSET = 18;

// Constants for styling the overlays to ensure consistency.
const COMMAND_LETTER_COLOR = '#8b5cf6';
const ENDPOINT_COORDINATE_COLOR = '#6366f1';
const CONTROL_POINT_COORDINATE_COLOR = '#f59e42';

interface PathCommandsOverlayProps {
  path: string;
  digits?: number;
}

/**
 * A React component that parses an SVG path string and renders command letters
 * and coordinate numbers on top of the visual path. It intelligently places
 * labels for commands and points to aid in debugging and understanding the path structure.
 *
 * @param {PathCommandsOverlayProps} props - The component props.
 * @returns {React.JSX.Element | null} The rendered SVG text elements or null if parsing fails.
 */
// Future-proofing Note: For very long SVG paths, this component could face
// performance issues. If required, this could be optimized by only rendering overlays
// within the visible viewport.
const PathCommandsOverlayComponent: React.FC<PathCommandsOverlayProps> = ({ path, digits = DECIMAL_DIGITS }) => {
  const overlays: React.ReactElement[] = [];
  let commands: SVGCommand[] = [];
  let absoluteCommands: SVGCommand[] = [];
  
  try {
    // Parse the original commands
    commands = parser.parseSVG(path);
    // Convert to absolute commands for proper positioning
    absoluteCommands = parser.makeAbsolute(commands);
  } catch {
    return null;
  }

  // 'prev' tracks the end point of the last command, which is crucial for
  // calculating midpoints or determining the start of the next command segment.
  let prev = { x: 0, y: 0 };
  
  commands.forEach((cmd, i) => {
    const absCmd = absoluteCommands[i];
    if (!absCmd) return; // Skip if no corresponding absolute command
    
    let letterPos: { x: number; y: number } | null = null;
    const endPoints: { x: number; y: number }[] = [];
    const controlPoints: { x: number; y: number }[] = [];

    // This block calculates the position for the command letter ('M', 'L', etc.)
    // and populates the endpoints and control points for rendering their coordinates.
    // We use absolute commands for positioning to handle relative coordinates correctly.
    switch (cmd.code) {
      case 'M':
      case 'm':
        {
          const coords = getCommandCoords(absCmd);
          letterPos = { x: coords.x, y: coords.y + COMMAND_LETTER_Y_OFFSET };
          endPoints.push(coords);
          prev = coords;
        }
        break;
      case 'L':
      case 'l':
        {
          const coords = getCommandCoords(absCmd);
          const mid = midpoint(prev.x, prev.y, coords.x, coords.y);
          letterPos = { x: mid.x, y: mid.y + COMMAND_LETTER_Y_OFFSET };
          endPoints.push(coords);
          prev = coords;
        }
        break;
      case 'H':
      case 'h':
        {
          const coords = getCommandCoords(absCmd);
          const mid = midpoint(prev.x, prev.y, coords.x, prev.y);
          letterPos = { x: mid.x, y: mid.y + COMMAND_LETTER_Y_OFFSET };
          endPoints.push({ x: coords.x, y: prev.y });
          prev = { x: coords.x, y: prev.y };
        }
        break;
      case 'V':
      case 'v':
        {
          const coords = getCommandCoords(absCmd);
          const mid = midpoint(prev.x, prev.y, prev.x, coords.y);
          letterPos = { x: mid.x, y: mid.y + COMMAND_LETTER_Y_OFFSET };
          endPoints.push({ x: prev.x, y: coords.y });
          prev = { x: prev.x, y: coords.y };
        }
        break;
      case 'Q':
      case 'q':
        {
          const coords = getCommandCoords(absCmd);
          // For quadratic curves, we need to get the control point from the absolute command
          const controlPoint = getControlPoint1(absCmd);
          letterPos = { x: controlPoint.x, y: controlPoint.y + COMMAND_LETTER_Y_OFFSET };
          controlPoints.push(controlPoint);
          endPoints.push(coords);
          prev = coords;
        }
        break;
      case 'C':
      case 'c':
        {
          const coords = getCommandCoords(absCmd);
          const controlPoint1 = getControlPoint1(absCmd);
          const controlPoint2 = getControlPoint2(absCmd);
          const mid = cubicBezierMidpoint(prev.x, prev.y, controlPoint1.x, controlPoint1.y, controlPoint2.x, controlPoint2.y, coords.x, coords.y);
          letterPos = { x: mid.x, y: mid.y + COMMAND_LETTER_Y_OFFSET };
          controlPoints.push(controlPoint1, controlPoint2);
          endPoints.push(coords);
          prev = coords;
        }
        break;
      case 'A':
      case 'a':
        {
          const coords = getCommandCoords(absCmd);
          letterPos = { x: coords.x, y: coords.y + COMMAND_LETTER_Y_OFFSET };
          endPoints.push(coords);
          prev = coords;
        }
        break;
      case 'S':
      case 's':
        {
          const coords = getCommandCoords(absCmd);
          const controlPoint = getControlPoint2(absCmd);
          letterPos = { x: controlPoint.x, y: controlPoint.y + COMMAND_LETTER_Y_OFFSET };
          controlPoints.push(controlPoint);
          endPoints.push(coords);
          prev = coords;
        }
        break;
      case 'T':
      case 't':
        {
          const coords = getCommandCoords(absCmd);
          // For a smooth quadratic curve, the control point is implied.
          // We'll just label the end point.
          letterPos = { x: coords.x, y: coords.y + COMMAND_LETTER_Y_OFFSET };
          endPoints.push(coords);
          prev = coords;
        }
        break;
    }
    // Render the command letter (e.g., 'M', 'C') if a valid position was calculated.
    // This prevents rendering letters for commands like 'Z' (close path) and correctly handles commands at the origin (0,0).
    if (cmd.code && letterPos) {
      // Add background rectangle for command letter
      overlays.push(
        <rect
          key={`cmd-bg-${i}-${JSON.stringify(cmd)}`}
          x={letterPos.x - 10}
          y={letterPos.y - 12}
          width={20}
          height={16}
          fill="white"
          fillOpacity={0.9}
          rx={3}
          ry={3}
          className="SVGTestPage__CmdLetterBg"
          style={{ pointerEvents: 'none' }}
        />
      );
      
      // Add command letter text
      overlays.push(
        <text
          key={`cmd-${i}-${JSON.stringify(cmd)}`}
          x={letterPos.x}
          y={letterPos.y}
          fontSize={16}
          fill={COMMAND_LETTER_COLOR}
          fontWeight="bold"
          textAnchor="middle"
          className="SVGTestPage__CmdLetter"
          style={{ pointerEvents: 'none' }}
        >
          {cmd.code}
        </text>
      );
    }

    // Render coordinates for the path's main anchor/end points.
    endPoints.forEach((point, j) => {
      const coordText = `${formatNumber(point.x, digits)},${formatNumber(point.y, digits)}`;
      const textWidth = coordText.length * 6; // Approximate character width
      const textHeight = 12;
      
      // Add background rectangle for coordinates
      overlays.push(
        <rect
          key={`num-bg-${i}-ep-${j}-${JSON.stringify(point)}`}
          x={point.x - textWidth / 2 - 4}
          y={point.y + COORDINATE_Y_OFFSET - textHeight + 2}
          width={textWidth + 8}
          height={textHeight + 2}
          fill="white"
          fillOpacity={0.9}
          rx={2}
          ry={2}
          className="SVGTestPage__CmdNumBg"
          style={{ pointerEvents: 'none' }}
        />
      );
      
      // Add coordinate text
      overlays.push(
        <text
          key={`num-${i}-ep-${j}-${JSON.stringify(point)}`}
          x={point.x}
          y={point.y + COORDINATE_Y_OFFSET}
          fontSize={12}
          fill={ENDPOINT_COORDINATE_COLOR}
          textAnchor="middle"
          className="SVGTestPage__CmdNum"
          style={{ pointerEvents: 'none' }}
        >
          {coordText}
        </text>
      );
    });

    // Render coordinates for the path's control points (e.g., for Bezier curves).
    controlPoints.forEach((point, j) => {
      const coordText = `${formatNumber(point.x, digits)},${formatNumber(point.y, digits)}`;
      const textWidth = coordText.length * 6; // Approximate character width
      const textHeight = 12;
      
      // Add background rectangle for control point coordinates
      overlays.push(
        <rect
          key={`num-bg-${i}-cp-${j}-${JSON.stringify(point)}`}
          x={point.x - textWidth / 2 - 4}
          y={point.y + COORDINATE_Y_OFFSET - textHeight + 2}
          width={textWidth + 8}
          height={textHeight + 2}
          fill="white"
          fillOpacity={0.9}
          rx={2}
          ry={2}
          className="SVGTestPage__CmdNumBg"
          style={{ pointerEvents: 'none' }}
        />
      );
      
      // Add control point coordinate text
      overlays.push(
        <text
          key={`num-${i}-cp-${j}-${JSON.stringify(point)}`}
          x={point.x}
          y={point.y + COORDINATE_Y_OFFSET}
          fontSize={12}
          fill={CONTROL_POINT_COORDINATE_COLOR}
          textAnchor="middle"
          className="SVGTestPage__CmdNum"
          style={{ pointerEvents: 'none' }}
        >
          {coordText}
        </text>
      );
    });
  });
  return <>{overlays}</>;
};

const PathCommandsOverlay = React.memo(PathCommandsOverlayComponent);
PathCommandsOverlay.displayName = 'PathCommandsOverlay';

export default PathCommandsOverlay; 