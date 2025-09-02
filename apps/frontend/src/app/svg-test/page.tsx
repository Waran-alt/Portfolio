'use client';
/**
 * @file This file acts as the "controller" for the SVG Path Visualizer page.
 * Its primary responsibility is to manage the application's state, including the
 * current path data, UI visibility, and user selections. It fetches the necessary
 * data and passes down state and event handlers to the specialized child components
 * that are responsible for rendering the UI.
 */
import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as parser from 'svg-path-parser';
import '../../shared/styles/noselect.css';
import ExampleSelector from './components/ExampleSelector';
import PathCommandBreakdown from './components/PathCommandBreakdown';
import PathEditorControls from './components/PathEditorControls';
import SvgVisualizer from './components/SvgVisualizer';
import { PATH_EXAMPLES as examplesList } from './constants/path-examples';
import { CONTAINER_CLASSES } from './constants/styles';
import type { PathExample, Point } from './types';
import { getCommandValue } from './utils/svgCommandHelpers';
import { extractPointsFromCommands } from './utils/svgPath';

// Convert the examples array into a Record for efficient O(1) lookups by ID.
const examples: Record<string, PathExample> = examplesList.reduce((acc, ex) => {
  acc[ex.id] = ex;
  return acc;
}, {} as Record<string, PathExample>);

/**
 * The main component for the interactive SVG Path Visualizer page.
 * It manages the SVG path state, handles user interactions for manipulating the path,
 * and renders the visual representation and detailed breakdown of the path data.
 */
const SVGTestPage: React.FC = () => {
  // State for client-side rendering guard
  const [isClient, setIsClient] = useState(false);
  // State for the currently selected path example from the dropdown
  const [selectedExample, setSelectedExample] = useState<string>('quadratic-1');
  // State for the validated, active SVG path string that is rendered
  const [pathString, setPathString] = useState<string>(examples['quadratic-1']?.pathData ?? '');
  // State for the path string in the textarea, which may be invalid until validated
  const [pendingPathString, setPendingPathString] = useState<string>(pathString);

  // UI visibility toggles
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showPoints, setShowPoints] = useState(true);
  // State for the array of draggable points extracted from the pathString
  const [points, setPoints] = useState<Point[]>([]);
  // State to track which point is currently being dragged
  const [draggingPoint, setDraggingPoint] = useState<Point | null>(null);
  // State for the type of segment to add
  const [segmentTypeToAppend, setSegmentTypeToAppend] = useState<string>('Q');
  // State for toggling relative/absolute commands
  const [isRelative, setIsRelative] = useState(false);
  // State for the 'Z' (close path) command
  const [isPathClosed, setIsPathClosed] = useState(false);
  // State to track if the path in the textarea is valid
  const [isValid, setIsValid] = useState(true);
  // State for toggling the path fill
  const [showFill, setShowFill] = useState(false);
  
  // Refs for DOM elements
  const svgRef = useRef<SVGSVGElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Parses an SVG path string and updates the `points` state with the
   * extracted draggable points. Memoized with useCallback.
   */
  const regeneratePointsFromPath = useCallback((currentPath: string) => {
    try {
      const parsedCommands = parser.parseSVG(currentPath);
      const extractedPoints = extractPointsFromCommands(parsedCommands);
      setPoints(extractedPoints);
      setIsValid(true);
    } catch (error) {
      console.error('Failed to parse SVG path on load:', error);
      setPoints([]);
      setIsValid(false);
    }
  }, []);

  /**
   * Handles changing the selected example from the dropdown, updating the path states.
   */
  const handleExampleChange = (exampleId: string) => {
    setSelectedExample(exampleId);
    const example = examples[exampleId];
    if (example) {
      const newPath = example.pathData;
      setPathString(newPath);
      setPendingPathString(newPath);
      setIsPathClosed(newPath.trim().endsWith('Z'));
    }
  };

  /**
   * Reconstructs the SVG path string from the current state of draggable points.
   * This is called after a drag operation to update the path.
   */
  const updatePathFromPoints = useCallback(() => {
    let newPath = '';
    const commands = parser.parseSVG(pathString);

    newPath = commands.map((cmd, i) => {
        let cmdStr = cmd.code;
        const relevantPoints = points.filter(p => p.id.startsWith(`pt-${i}-`));

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
                    cmdStr += ` ${cmd.rx},${cmd.ry} ${cmd.xAxisRotation} ${+cmd.largeArc} ${+cmd.sweep} ${relevantPoints[0].x},${relevantPoints[0].y}`;
                }
                break;
            case 'Z':
                break; // No points
        }
        return cmdStr;
    }).join(' ').replace(/(\d+)\s+(\d+)/g, '$1,$2');

    if(isPathClosed) newPath += ' Z';

    setPathString(newPath);
    setPendingPathString(newPath);
  }, [points, pathString, isPathClosed]);

  /**
   * Handles the mouse down event on a draggable point to initiate a drag operation.
   */
  const handleMouseDown = (point: Point) => (e: React.MouseEvent) => {
    e.preventDefault();
    setDraggingPoint(point);

    const handleMouseMove = (event: MouseEvent) => {
      if (!svgRef.current) return;

      const svgPoint = svgRef.current.createSVGPoint();
      svgPoint.x = event.clientX;
      svgPoint.y = event.clientY;

      const ctm = svgRef.current.getScreenCTM();
      if (!ctm) return;

      const transformedPoint = svgPoint.matrixTransform(ctm.inverse());
      
      const newX = parseFloat(transformedPoint.x.toFixed(2));
      const newY = parseFloat(transformedPoint.y.toFixed(2));

      setPoints(prevPoints =>
        prevPoints.map(p =>
          p.id === point.id
            ? { ...p, x: newX, y: newY }
            : p
        )
      );
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setDraggingPoint(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  /**
   * Validates the path string from the textarea and applies it if valid.
   */
  const handleValidate = () => {
    // Check for empty path first
    if (!pendingPathString.trim()) {
      setIsValid(false);
      return;
    }
    
    try {
      // Test parsing to see if it's valid
      parser.parseSVG(pendingPathString);
      // If valid, update the main path string
      setPathString(pendingPathString);
      regeneratePointsFromPath(pendingPathString);
      setIsValid(true);
    } catch (error) {
      console.error("Invalid path string:", error);
      // Optionally, revert pending string to the last valid one
      setPendingPathString(pathString);
      setIsValid(false);
    }
  };

  /**
   * Appends a new path segment to the current path string.
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
        lastPoint = { x: firstAbsolute.x, y: firstAbsolute.y };
        relativeZero = isRelative ? { x: -lastPoint.x, y: -lastPoint.y } : { x: 0, y: 0 };
      }
    }

    const command = isRelative ? segmentTypeToAppend.toLowerCase() : segmentTypeToAppend.toUpperCase();

    let newSegment = '';
    switch (segmentTypeToAppend) {
      case 'M':
        newSegment = ` ${command} ${lastPoint.x + 50 + relativeZero.x},${lastPoint.y + relativeZero.y}`;
        break;
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
    const newPath = pendingPathString + newSegment;
    setPendingPathString(newPath);
    // Automatically validate and update points
    try {
      parser.parseSVG(newPath);
      setPathString(newPath);
      regeneratePointsFromPath(newPath);
    } catch (e) {
      setIsValid(false);
    }
  };

  /**
   * Appends a 'Z' command to close the current path.
   */
  const handleClosePath = (isClosed: boolean) => {
    setIsPathClosed(isClosed);
    let newPath = pendingPathString.trim();
    // Remove existing Z if present
    if (newPath.endsWith('Z')) {
        newPath = newPath.slice(0, -1).trim();
    }
    if (isClosed) {
        newPath += ' Z';
    }
    setPendingPathString(newPath);
    setPathString(newPath);
  };

  /**
   * Rounds all numerical values in the path string to the nearest integer.
   */
  const handleRoundValues = () => {
    try {
      const commands = parser.parseSVG(pendingPathString);
      const roundedPath = commands.map(cmd => {
        let newCmd = cmd.code;
        // The type system knows the keys for each command type
        Object.keys(cmd).forEach(key => {
          if (key !== 'code' && key !== 'command' && key !== 'relative') {
            const val = getCommandValue(cmd, key);
            if (typeof val === 'number') {
              newCmd += ` ${Math.round(val)}`;
            }
          }
        });
        return newCmd;
      }).join(' ').replace(/(\d+)\s+(\d+)/g, '$1,$2');
  
      setPendingPathString(roundedPath);
      setPathString(roundedPath);
      regeneratePointsFromPath(roundedPath);
    } catch (error) {
      console.error("Could not round values:", error);
    }
  };

  // Effect to set initial points when the component mounts or example changes
  useEffect(() => {
    // Do not regenerate points from the path string while a drag is in progress.
    // During a drag, the `points` array is the source of truth.
    if (!draggingPoint) {
      regeneratePointsFromPath(pathString);
    }
  }, [pathString, regeneratePointsFromPath, draggingPoint]);
  
  // Update path string when points are dragged
  useEffect(() => {
    if (draggingPoint) {
      updatePathFromPoints();
    }
  }, [points, draggingPoint, updatePathFromPoints]);

  // Effect to handle path closing toggle
  useEffect(() => {
    let newPath = pendingPathString.trim();
    const hasZ = newPath.endsWith('Z') || newPath.endsWith('z');
    if (isPathClosed && !hasZ) {
      newPath += ' Z';
    } else if (!isPathClosed && hasZ) {
      newPath = newPath.slice(0, -1).trim();
    }
    setPendingPathString(newPath);
    setPathString(newPath);
  }, [isPathClosed]);

  // Effect to guard against SSR issues by only rendering full component on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Effect to preserve cursor position in the textarea during state updates
  useLayoutEffect(() => {
    if (textareaRef.current) {
      const { selectionStart, selectionEnd } = textareaRef.current;
      textareaRef.current.value = pendingPathString;
      textareaRef.current.selectionStart = selectionStart;
      textareaRef.current.selectionEnd = selectionEnd;
    }
  }, [pendingPathString]);

  // Prevent rendering on the server to avoid hydration mismatches
  if (!isClient) return null;

  return (
    <div className="SVGTestPage min-h-screen bg-gradient-to-br from-violet-50 to-indigo-100 py-12 px-2">
      <AnimatePresence>
        <motion.div
          className="max-w-5xl mx-auto rounded-2xl shadow-xl bg-white/80 p-6 md:p-10 border border-violet-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl md:text-5xl font-extrabold text-violet-700 mb-3 tracking-tight drop-shadow-sm">
              SVG Path Visualizer
            </h1>
            <p className="text-lg text-violet-900/80 mb-1">
              Explore and understand SVG path commands visually.
              <br />
              <span className="text-indigo-500">Drag points, edit the path, and see live breakdowns below.</span>
            </p>
          </div>

          {/* Controls */}
          <div className={CONTAINER_CLASSES}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ExampleSelector
                examples={examples}
                selectedExample={selectedExample}
                handleExampleChange={handleExampleChange}
              />
            </div>
          </div>

          {/* SVG Canvas and Path Data */}
          <div className={CONTAINER_CLASSES}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <SvgVisualizer
                svgRef={svgRef}
                pathString={pathString}
                points={points}
                showGrid={showGrid}
                setShowGrid={setShowGrid}
                showLabels={showLabels}
                setShowLabels={setShowLabels}
                showPoints={showPoints}
                setShowPoints={setShowPoints}
                showFill={showFill}
                setShowFill={setShowFill}
                handleMouseDown={handleMouseDown}
              />
              <PathEditorControls
                pendingPathString={pendingPathString}
                textareaRef={textareaRef}
                segmentTypeToAppend={segmentTypeToAppend}
                setSegmentTypeToAppend={setSegmentTypeToAppend}
                isRelative={isRelative}
                setIsRelative={setIsRelative}
                isPathClosed={isPathClosed}
                setIsPathClosed={handleClosePath}
                isValid={isValid}
                setPendingPathString={setPendingPathString}
                handleValidate={handleValidate}
                handleAppendSegment={handleAppendSegment}
                handleRoundValues={handleRoundValues}
              />
            </div>
          </div>

          {/* Breakdown Component */}
          <div className={CONTAINER_CLASSES}>
            <PathCommandBreakdown path={pathString} />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SVGTestPage; 