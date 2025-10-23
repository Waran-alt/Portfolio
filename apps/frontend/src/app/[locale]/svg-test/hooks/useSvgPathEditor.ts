import { useCallback, useEffect, useState } from 'react';
import * as parser from 'svg-path-parser';
import type { Point } from '../types';
import { getCommandValue } from '../utils/svgCommandHelpers';
import { extractPointsFromCommands, formatPathString } from '../utils/svgPath';

export interface UseSvgPathEditorApi {
  pathString: string;
  pendingPathString: string;
  setPendingPathString: (v: string) => void;

  points: Point[];
  setPoints: React.Dispatch<React.SetStateAction<Point[]>>;

  segmentTypeToAppend: string;
  setSegmentTypeToAppend: (t: string) => void;

  isRelative: boolean;
  setIsRelative: (b: boolean) => void;

  isPathClosed: boolean;

  isValid: boolean;

  handleValidate: () => void;
  handleAppendSegment: () => void;
  handleClosePath: (isClosed: boolean) => void;
  handleRoundValues: () => void;

  regeneratePointsFromPath: (currentPath: string) => void;
  updatePathFromPoints: () => void;
  setPathFromExample: (newPath: string) => void;
}

/**
 * Encapsulates all path editing state and logic for the SVG Path Visualizer.
 *
 * Responsibilities:
 * - Maintain canonical path string and the pending textarea string
 * - Derive/maintain draggable points from the path
 * - Provide operations: validate, append segment, toggle close path (Z), round values
 * - Keep isPathClosed derived from the actual rendered path
 */
export function useSvgPathEditor(initialPath: string): UseSvgPathEditorApi {
  const [pathString, setPathString] = useState<string>(initialPath);
  const [pendingPathString, setPendingPathString] = useState<string>(initialPath);

  const [points, setPoints] = useState<Point[]>([]);
  const [segmentTypeToAppend, setSegmentTypeToAppend] = useState<string>('Q');
  const [isRelative, setIsRelative] = useState<boolean>(false);
  const [isPathClosed, setIsPathClosed] = useState<boolean>(/z\s*$/i.test(initialPath.trim()));
  const [isValid, setIsValid] = useState<boolean>(true);

  /**
   * Parses the provided path string and extracts draggable points used by the UI.
   * Sets validity accordingly. This does NOT mutate path strings; it only
   * derives the points representation from a canonical path string.
   */
  const regeneratePointsFromPath = useCallback((currentPath: string) => {
    try {
      const parsedCommands = parser.parseSVG(currentPath);
      const extractedPoints = extractPointsFromCommands(parsedCommands);
      setPoints(extractedPoints);
      setIsValid(true);
    } catch (error) {
      // Invalid path: clear points and mark invalid
      setPoints([]);
      setIsValid(false);
    }
  }, []);

  /**
   * Replaces the current path state with a new example path:
   * - updates canonical path and pending textarea
   * - derives the close-path checkbox from trailing 'Z'
   */
  const setPathFromExample = (newPath: string) => {
    setPathString(newPath);
    setPendingPathString(newPath);
    setIsPathClosed(/z\s*$/i.test(newPath.trim()));
  };

  /**
   * Rebuilds the path string from the current draggable points for each command.
   * After reconstruction, it canonicalizes formatting and ensures trailing 'Z'
   * is present when the editor is in the closed-path state.
   */
  const updatePathFromPoints = useCallback(() => {
    const commands = parser.parseSVG(pathString);

    const rebuilt = commands
      .map((cmd, i) => {
        let cmdStr = cmd.code;
        const relevantPoints = points.filter((p) => p.id.startsWith(`pt-${i}-`));
        switch (cmd.code) {
          case 'M':
          case 'L':
          case 'H':
          case 'V':
          case 'T':
            if (relevantPoints[0]) {
              cmdStr += ` ${relevantPoints[0].x},${relevantPoints[0].y}`;
            }
            break;
          case 'Q':
            if (relevantPoints[0] && relevantPoints[1]) {
              cmdStr += ` ${relevantPoints[0].x},${relevantPoints[0].y} ${relevantPoints[1].x},${relevantPoints[1].y}`;
            }
            break;
          case 'C':
            if (relevantPoints[0] && relevantPoints[1] && relevantPoints[2]) {
              cmdStr += ` ${relevantPoints[0].x},${relevantPoints[0].y} ${relevantPoints[1].x},${relevantPoints[1].y} ${relevantPoints[2].x},${relevantPoints[2].y}`;
            }
            break;
          case 'S':
            if (relevantPoints[0] && relevantPoints[1]) {
              cmdStr += ` ${relevantPoints[0].x},${relevantPoints[0].y} ${relevantPoints[1].x},${relevantPoints[1].y}`;
            }
            break;
          case 'A':
            if (relevantPoints[0]) {
              // Convert boolean flags back to 0 or 1 for the path string
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const c: any = cmd;
              cmdStr += ` ${c.rx},${c.ry} ${c.xAxisRotation} ${+c.largeArc} ${+c.sweep} ${relevantPoints[0].x},${relevantPoints[0].y}`;
            }
            break;
          case 'Z':
            break;
        }
        return cmdStr;
      })
      .join(' ');

    let newPath = formatPathString(rebuilt);
    if (isPathClosed && !/z\s*$/i.test(newPath)) newPath += ' Z';
    setPathString(newPath);
    setPendingPathString(newPath);
  }, [pathString, points, isPathClosed]);

  /**
   * Validates the pending textarea string by attempting to parse it. If valid:
   * - canonicalize via formatPathString
   * - promote to canonical pathString and regenerate points
   * Otherwise:
   * - revert pending string to the last known-good canonical string
   */
  const handleValidate = () => {
    if (!pendingPathString.trim()) {
      setIsValid(false);
      return;
    }
    try {
      parser.parseSVG(pendingPathString);
      const formatted = formatPathString(pendingPathString);
      setPathString(formatted);
      regeneratePointsFromPath(formatted);
      setIsValid(true);
    } catch {
      // Keep the user's pending input so they can continue editing; do not revert
      setIsValid(false);
    }
  };

  /**
   * Appends a new segment of the selected type to the pending path string.
   * Uses the last command's absolute position for sensible defaults and
   * honors the relative/absolute toggle. On success, promotes to canonical.
   */
  const handleAppendSegment = () => {
    const commands = parser.parseSVG(pendingPathString);
    const lastCommand = commands.length > 0 ? commands[commands.length - 1] : undefined;

    let lastPoint = { x: 100, y: 100 };
    let relativeZero = { x: 0, y: 0 };
    if (lastCommand) {
      const absolute = parser.makeAbsolute([lastCommand]);
      const firstAbsolute = absolute[0];
      if (firstAbsolute && 'x' in firstAbsolute && 'y' in firstAbsolute) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const a: any = firstAbsolute;
        lastPoint = { x: a.x, y: a.y };
        relativeZero = isRelative ? { x: -lastPoint.x, y: -lastPoint.y } : { x: 0, y: 0 };
      }
    }

    const command = isRelative ? segmentTypeToAppend.toLowerCase() : segmentTypeToAppend.toUpperCase();

    let newSegment = '';
    switch (segmentTypeToAppend) {
      case 'M':
      case 'L':
        newSegment = ` ${command} ${lastPoint.x + 50 + relativeZero.x},${lastPoint.y + relativeZero.y}`;
        break;
      case 'H':
        newSegment = ` ${command} ${lastPoint.x + 50 + relativeZero.x}`;
        break;
      case 'V':
        newSegment = ` ${command} ${lastPoint.y + 50 + relativeZero.y}`;
        break;
      case 'C':
        newSegment = ` ${command} ${lastPoint.x + 20 + relativeZero.x} ${lastPoint.y - 50 + relativeZero.y}, ${lastPoint.x + 40 + relativeZero.x} ${lastPoint.y - 50 + relativeZero.y}, ${lastPoint.x + 50 + relativeZero.x} ${lastPoint.y + relativeZero.y}`;
        break;
      case 'S':
        newSegment = ` ${command} ${lastPoint.x + 20 + relativeZero.x} ${lastPoint.y - 50 + relativeZero.y}, ${lastPoint.x + 50 + relativeZero.x} ${lastPoint.y + relativeZero.y}`;
        break;
      case 'T':
        newSegment = ` ${command} ${lastPoint.x + 20 + relativeZero.x},${lastPoint.y - 50 + relativeZero.y}`;
        break;
      case 'A':
        newSegment = ` ${command} 50,50 0 0 1 ${lastPoint.x + 50 + relativeZero.x},${lastPoint.y + relativeZero.y}`;
        break;
      case 'Q':
      default:
        newSegment = ` ${command} ${lastPoint.x + 25 + relativeZero.x} ${lastPoint.y - 50 + relativeZero.y}, ${lastPoint.x + 50 + relativeZero.x} ${lastPoint.y + relativeZero.y}`;
        break;
    }

    const newPath = formatPathString(pendingPathString + newSegment);
    setPendingPathString(newPath);
    try {
      parser.parseSVG(newPath);
      setPathString(newPath);
      regeneratePointsFromPath(newPath);
    } catch {
      setIsValid(false);
    }
  };

  /**
   * Toggles the trailing close-path 'Z' based on the given state. The canonical
   * path is the source of truth: append/remove 'Z' and reformat consistently.
   */
  const handleClosePath = (isClosed: boolean) => {
    let newPath = pathString.trim();
    const hasZ = /z\s*$/i.test(newPath);
    if (isClosed && !hasZ) {
      newPath = `${newPath} Z`;
    } else if (!isClosed && hasZ) {
      newPath = newPath.replace(/z\s*$/i, '').trim();
    }
    const formatted = formatPathString(newPath);
    setPendingPathString(formatted);
    setPathString(formatted);
  };

  /**
   * Rounds all numeric parameters in the pending path to the nearest integer,
   * then canonicalizes and promotes to the canonical path, regenerating points.
   */
  const handleRoundValues = () => {
    try {
      const commands = parser.parseSVG(pendingPathString);
      const roundedPath = commands
        .map((cmd) => {
          let newCmd = cmd.code;
          Object.keys(cmd).forEach((key) => {
            if (key !== 'code' && key !== 'command' && key !== 'relative') {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const val = getCommandValue(cmd as any, key);
              if (typeof val === 'number') {
                newCmd += ` ${Math.round(val)}`;
              }
            }
          });
          return newCmd;
        })
        .join(' ');

      const formatted = formatPathString(roundedPath);
      setPendingPathString(formatted);
      setPathString(formatted);
      regeneratePointsFromPath(formatted);
    } catch {
      // ignore
    }
  };

  // Keep checkbox in sync with actual rendered path
  useEffect(() => {
    setIsPathClosed(/z\s*$/i.test(pathString.trim()));
  }, [pathString]);

  return {
    pathString,
    pendingPathString,
    setPendingPathString,
    points,
    setPoints,
    segmentTypeToAppend,
    setSegmentTypeToAppend,
    isRelative,
    setIsRelative,
    isPathClosed,
    isValid,
    handleValidate,
    handleAppendSegment,
    handleClosePath,
    handleRoundValues,
    regeneratePointsFromPath,
    updatePathFromPoints,
    setPathFromExample,
  };
}


