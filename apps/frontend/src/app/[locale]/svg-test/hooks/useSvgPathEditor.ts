import { useCallback, useEffect, useState } from 'react';
import type { Command as SVGCommand } from 'svg-path-parser';
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
  updatePathFromPointsForPoint: (changedPointId: string) => void;
  setPathFromExample: (newPath: string) => void;
}

// Extract original command letters (with casing) from the raw path string.
function extractCommandLetters(path: string): string[] {
  const letters: string[] = [];
  const re = /[MmLlHhVvCcSsQqTtAaZz]/g;
  let match: RegExpExecArray | null;
   
  while ((match = re.exec(path)) !== null) {
    letters.push(match[0]);
  }
  return letters;
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
    const absolute = parser.makeAbsolute(commands);
    const sourceCodes = extractCommandLetters(pathString);

    const rebuilt = commands
      .map((cmd, i) => {
        // Preserve original letter casing from the source path
        const letter = sourceCodes[i] ?? cmd.code;
        const isRel = letter === letter.toLowerCase();
        let cmdStr = letter;
        const relevantPoints = points.filter((p) => p.id.startsWith(`pt-${i}-`));
        // Determine previous absolute end point to compute deltas for relative commands
        const prevAbs = i > 0 ? (absolute[i - 1] as { x?: number; y?: number }) : { x: 0, y: 0 };
        const dx = (x: number) => (isRel ? x - (typeof prevAbs.x === 'number' ? prevAbs.x : 0) : x);
        const dy = (y: number) => (isRel ? y - (typeof prevAbs.y === 'number' ? prevAbs.y : 0) : y);
        // Decide behavior based on uppercased code so both relative/absolute are handled
        switch (cmd.code.toUpperCase()) {
          case 'M':
          case 'L':
          case 'H':
          case 'V':
          case 'T':
            if (relevantPoints[0]) {
              cmdStr += ` ${dx(relevantPoints[0].x)},${dy(relevantPoints[0].y)}`;
            }
            break;
          case 'Q':
            if (relevantPoints[0] && relevantPoints[1]) {
              cmdStr += ` ${dx(relevantPoints[0].x)},${dy(relevantPoints[0].y)} ${dx(relevantPoints[1].x)},${dy(relevantPoints[1].y)}`;
            }
            break;
          case 'C':
            if (relevantPoints[0] && relevantPoints[1] && relevantPoints[2]) {
              cmdStr += ` ${dx(relevantPoints[0].x)},${dy(relevantPoints[0].y)} ${dx(relevantPoints[1].x)},${dy(relevantPoints[1].y)} ${dx(relevantPoints[2].x)},${dy(relevantPoints[2].y)}`;
            }
            break;
          case 'S':
            if (relevantPoints[0] && relevantPoints[1]) {
              cmdStr += ` ${dx(relevantPoints[0].x)},${dy(relevantPoints[0].y)} ${dx(relevantPoints[1].x)},${dy(relevantPoints[1].y)}`;
            }
            break;
          case 'A':
            if (relevantPoints[0]) {
              // Convert boolean flags back to 0 or 1 for the path string
              const c = cmd as unknown as { rx?: number; ry?: number; xAxisRotation?: number; largeArc?: boolean; sweep?: boolean };
              cmdStr += ` ${c.rx ?? 0},${c.ry ?? 0} ${c.xAxisRotation ?? 0} ${+(c.largeArc ?? false)} ${+(c.sweep ?? false)} ${dx(relevantPoints[0].x)},${dy(relevantPoints[0].y)}`;
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
   * Updates only the command affected by a dragged point.
   * - Preserves original command casing; relative commands emit deltas, absolute emit absolutes.
   * - Computes previous absolute endpoint only when needed.
   * - Falls back to full rebuild if inputs are incomplete or on error.
   */
  const updatePathFromPointsForPoint = useCallback((changedPointId: string) => {
    try {
      const indexMatch = changedPointId.match(/^pt-(\d+)-/);
      if (!indexMatch) {
        updatePathFromPoints();
        return;
      }

      const targetIndex = Number(indexMatch[1]);
      const commands = parser.parseSVG(pathString);
      const absolute = parser.makeAbsolute(commands) as Array<{ x?: number; y?: number }>;
      const newCommands = [...commands];
      const sourceCodes = extractCommandLetters(pathString);

      type MutableFields = {
        x?: number; y?: number; x1?: number; y1?: number; x2?: number; y2?: number;
        rx?: number; ry?: number; xAxisRotation?: number; largeArc?: boolean; sweep?: boolean;
      };
      const target = newCommands[targetIndex] as SVGCommand & MutableFields;
      if (!target) {
        updatePathFromPoints();
        return;
      }
      // Determine the original command letter (with casing) from the source string
      const targetLetter = sourceCodes[targetIndex] ?? String(target.code);
      const isRelative = targetLetter === targetLetter.toLowerCase();

      // Compute previous absolute endpoint only if needed (relative commands)
      const prevAbs = (isRelative && targetIndex > 0 ? absolute[targetIndex - 1] : { x: 0, y: 0 }) as { x?: number; y?: number };
      const prev = { x: typeof prevAbs.x === 'number' ? prevAbs.x : 0, y: typeof prevAbs.y === 'number' ? prevAbs.y : 0 };

      const relevantPoints = points.filter((p) => p.id.startsWith(`pt-${targetIndex}-`));

      const setEnd = (x: number, y: number) => {
        target.x = isRelative ? x - prev.x : x;
        target.y = isRelative ? y - prev.y : y;
      };
      const setX = (x: number) => {
        target.x = isRelative ? x - prev.x : x;
      };
      const setY = (y: number) => {
        target.y = isRelative ? y - prev.y : y;
      };

      switch (String(target['code']).toUpperCase()) {
        case 'M':
        case 'L':
        case 'T': {
          if (!relevantPoints[0]) { updatePathFromPoints(); return; }
          setEnd(relevantPoints[0].x, relevantPoints[0].y);
          break;
        }
        case 'H': {
          if (!relevantPoints[0]) { updatePathFromPoints(); return; }
          setX(relevantPoints[0].x);
          break;
        }
        case 'V': {
          if (!relevantPoints[0]) { updatePathFromPoints(); return; }
          setY(relevantPoints[0].y);
          break;
        }
        case 'Q': {
          if (!(relevantPoints[0] && relevantPoints[1])) { updatePathFromPoints(); return; }
          target.x1 = isRelative ? relevantPoints[0].x - prev.x : relevantPoints[0].x;
          target.y1 = isRelative ? relevantPoints[0].y - prev.y : relevantPoints[0].y;
          setEnd(relevantPoints[1].x, relevantPoints[1].y);
          break;
        }
        case 'C': {
          if (!(relevantPoints[0] && relevantPoints[1] && relevantPoints[2])) { updatePathFromPoints(); return; }
          target.x1 = isRelative ? relevantPoints[0].x - prev.x : relevantPoints[0].x;
          target.y1 = isRelative ? relevantPoints[0].y - prev.y : relevantPoints[0].y;
          target.x2 = isRelative ? relevantPoints[1].x - prev.x : relevantPoints[1].x;
          target.y2 = isRelative ? relevantPoints[1].y - prev.y : relevantPoints[1].y;
          setEnd(relevantPoints[2].x, relevantPoints[2].y);
          break;
        }
        case 'S': {
          if (!(relevantPoints[0] && relevantPoints[1])) { updatePathFromPoints(); return; }
          target.x2 = isRelative ? relevantPoints[0].x - prev.x : relevantPoints[0].x;
          target.y2 = isRelative ? relevantPoints[0].y - prev.y : relevantPoints[0].y;
          setEnd(relevantPoints[1].x, relevantPoints[1].y);
          break;
        }
        case 'A': {
          if (!relevantPoints[0]) { updatePathFromPoints(); return; }
          setEnd(relevantPoints[0].x, relevantPoints[0].y);
          break;
        }
        case 'Z':
        default:
          break;
      }

      // Build only the updated segment string for the target command, keeping all
      // other segments literally as they already are in the canonical path string.
      const letter = targetLetter;
      const rel = isRelative;
      let updatedSegment = letter as string;
      const ptsForTarget = relevantPoints;
      const dxT = (x: number) => (rel ? x - prev.x : x);
      const dyT = (y: number) => (rel ? y - prev.y : y);

      switch (String(target['code']).toUpperCase()) {
        case 'M':
        case 'L':
        case 'T':
          {
            const p0 = ptsForTarget[0]!;
            updatedSegment += ` ${dxT(p0.x)},${dyT(p0.y)}`;
          }
          break;
        case 'H':
          {
            const p0 = ptsForTarget[0]!;
            updatedSegment += ` ${dxT(p0.x)}`;
          }
          break;
        case 'V':
          {
            const p0 = ptsForTarget[0]!;
            updatedSegment += ` ${dyT(p0.y)}`;
          }
          break;
        case 'Q':
          {
            const p0 = ptsForTarget[0]!;
            const p1 = ptsForTarget[1]!;
            updatedSegment += ` ${dxT(p0.x)},${dyT(p0.y)} ${dxT(p1.x)},${dyT(p1.y)}`;
          }
          break;
        case 'C':
          {
            const p0 = ptsForTarget[0]!;
            const p1 = ptsForTarget[1]!;
            const p2 = ptsForTarget[2]!;
            updatedSegment += ` ${dxT(p0.x)},${dyT(p0.y)} ${dxT(p1.x)},${dyT(p1.y)} ${dxT(p2.x)},${dyT(p2.y)}`;
          }
          break;
        case 'S':
          {
            const p0 = ptsForTarget[0]!;
            const p1 = ptsForTarget[1]!;
            updatedSegment += ` ${dxT(p0.x)},${dyT(p0.y)} ${dxT(p1.x)},${dyT(p1.y)}`;
          }
          break;
        case 'A': {
          const c = target as unknown as { rx?: number; ry?: number; xAxisRotation?: number; largeArc?: boolean; sweep?: boolean };
          const p0 = ptsForTarget[0]!;
          updatedSegment += ` ${c.rx ?? 0},${c.ry ?? 0} ${c.xAxisRotation ?? 0} ${+(c.largeArc ?? false)} ${+(c.sweep ?? false)} ${dxT(p0.x)},${dyT(p0.y)}`;
          break;
        }
        case 'Z':
        default:
          break;
      }

      // Split the current path into command segments and surgically replace the target
      // (we intentionally do not re-emit all commands to avoid parser normalization)
      const segments: string[] = [];
      const re = /[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g;
      const str = pathString.trim();
      let m: RegExpExecArray | null;
      while ((m = re.exec(str)) !== null) {
        segments.push(m[0].trim());
      }
      if (segments.length === 0 || targetIndex >= segments.length) {
        updatePathFromPoints();
        return;
      }
      segments[targetIndex] = updatedSegment.trim();

      let newPathStr = segments.join(' ').replace(/\s+/g, ' ').trim();
      if (isPathClosed && !/z\s*$/i.test(newPathStr)) newPathStr += ' Z';
      setPathString(newPathStr);
      setPendingPathString(newPathStr);
    } catch {
      // Any unexpected error: fall back to safe full rebuild
      updatePathFromPoints();
    }
  }, [pathString, points, isPathClosed, updatePathFromPoints]);

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
        const a = firstAbsolute as { x?: number; y?: number };
        lastPoint = { x: a.x ?? lastPoint.x, y: a.y ?? lastPoint.y };
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

    // Preserve the chosen relative/absolute letter in the new segment, then canonicalize params
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
              const val = getCommandValue(cmd, key);
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
    updatePathFromPointsForPoint,
    setPathFromExample,
  };
}


