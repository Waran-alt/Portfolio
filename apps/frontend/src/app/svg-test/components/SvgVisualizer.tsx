/**
 * @file A React component responsible for rendering the main SVG canvas.
 * This includes the grid, rulers, the path itself, draggable control points,
 * and overlays for commands and coordinates.
 */
import type { TranslationFunction } from '@/hooks/useTranslation';
import { CircleDot, Grid, Move, Paintbrush, Tags } from 'lucide-react';
import React from 'react';
import * as parser from 'svg-path-parser';
import type { Point } from '../types';
import { getCommandCoords } from '../utils/svgCommandHelpers';
import PathCommandsOverlay from './PathCommandsOverlay';

// --- CONSTANTS ---
export const SVG_WIDTH = 800;
export const SVG_HEIGHT = 400;

const GRID_SPACING = 50;
const POINT_RADIUS = 7;
const PATH_STROKE_WIDTH = 2;
const POINT_STROKE_WIDTH = 2;
const CONTROL_LINE_COLOR = '#a78bfa'; // A lighter violet
const ORIGIN_LINE_COLOR = '#9ca3af'; // gray-400
const RULER_TEXT_COLOR = '#9ca3af'; // gray-400

// Ruler positioning constants
const RULER_TOP_OFFSET = 20; // Distance from top edge for horizontal rulers
const RULER_LEFT_OFFSET = 22; // Distance from left edge for vertical rulers
const RULER_TEXT_SIZE = 10; // Font size for ruler text
const RULER_TEXT_SPACING_PER_CHAR = 5; // Additional spacing per character beyond 2 digits
const RULER_TEXT_BASE_LENGTH = 2; // Base length for text spacing calculation

// Grid and calculation constants
const GRID_BUFFER = 200; // Extra buffer beyond viewBox for grid calculations
const RULER_BUFFER = 200; // Extra buffer beyond viewBox for ruler calculations

const THROTTLE_INTERVAL = 1000 / 60; // ms intervals

// Default pan offset constants
export const DEFAULT_PAN_OFFSET_X = -60;
export const DEFAULT_PAN_OFFSET_Y = -60;

// Default viewBox constructed from the constants above
export const DEFAULT_VIEWBOX = `${DEFAULT_PAN_OFFSET_X} ${DEFAULT_PAN_OFFSET_Y} ${SVG_WIDTH} ${SVG_HEIGHT}`;

/**
 * Props for the SvgVisualizer component.
 */
interface SvgVisualizerProps {
  /** A ref to the main SVG element. */
  svgRef: React.RefObject<SVGSVGElement | null>;
  /** The SVG path data string to be rendered. */
  pathString: string;
  /** An array of points (start, end, control) to be rendered as draggable circles. */
  points: Point[];
  /** Boolean to control the visibility of the background grid. */
  showGrid: boolean;
  /** Callback to toggle the grid visibility. */
  setShowGrid: (show: boolean) => void;
  /** Boolean to control the visibility of command/coordinate labels on the canvas. */
  showLabels: boolean;
  /** Callback to toggle the label visibility. */
  setShowLabels: (show: boolean) => void;
  /** Boolean to control the visibility of the draggable points. */
  showPoints: boolean;
  /** Callback to toggle the points' visibility. */
  setShowPoints: (show: boolean) => void;
  /** Boolean to control the visibility of the path's fill area. */
  showFill: boolean;
  /** Callback to toggle the fill visibility. */
  setShowFill: (show: boolean) => void;
  /** Mouse down event handler to initiate dragging a point. */
  handleMouseDown: (point: Point) => (e: React.MouseEvent) => void;
  /** Translation function for internationalization. */
  t: TranslationFunction;
}

// Future-proofing Note: For very complex paths with thousands of points or commands,
// the current rendering approach (mapping over all points/commands) could become a
// performance bottleneck. If this tool were to support such scenarios, virtualization
// (e.g., using react-window) for the SVG elements would be a necessary optimization.

/**
 * Renders the interactive SVG canvas, which is the centerpiece of the visualizer.
 * It handles the display of the path, its control points, and visual aids like
 * the grid and coordinate overlays.
 * @param {SvgVisualizerProps} props - The component's props.
 * @returns {React.JSX.Element} The rendered SVG canvas and its controls.
 */
const SvgVisualizer: React.FC<SvgVisualizerProps> = ({
  svgRef,
  pathString,
  points,
  showGrid,
  setShowGrid,
  showLabels,
  setShowLabels,
  showPoints,
  setShowPoints,
  showFill,
  setShowFill,
  handleMouseDown,
  t,
}) => {
  // Pan state for dragging the canvas - start at -60, -60 for better initial view
  const [isPanning, setIsPanning] = React.useState(false);
  const [panOffset, setPanOffset] = React.useState({ x: DEFAULT_PAN_OFFSET_X, y: DEFAULT_PAN_OFFSET_Y });
  const [lastMousePos, setLastMousePos] = React.useState({ x: 0, y: 0 });

  // Throttling for performance optimization (60 FPS)
  const [throttledPanOffset, setThrottledPanOffset] = React.useState({ x: DEFAULT_PAN_OFFSET_X, y: DEFAULT_PAN_OFFSET_Y });
  const lastUpdateTime = React.useRef(0);

  const commands = React.useMemo(() => {
    try {
      return parser.parseSVG(pathString);
    } catch {
      return [];
    }
  }, [pathString]);

  const absoluteCommands = React.useMemo(() => parser.makeAbsolute(commands), [commands]);

  // Memoize command coordinates for performance
  const commandCoordinates = React.useMemo(() => {
    return absoluteCommands.map(cmd => getCommandCoords(cmd));
  }, [absoluteCommands]);

  // Memoize points lookup map for O(1) access
  const pointsMap = React.useMemo(() => {
    return new Map(points.map(point => [point.id, point]));
  }, [points]);

  // Handle pan start
  const handlePanStart = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left mouse button
    
    // Don't start panning if clicking on a draggable point
    const target = e.target as HTMLElement;
    if (target.tagName === 'circle' && target.classList.contains('cursor-move')) {
      return;
    }
    
    setIsPanning(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
    e.preventDefault();
  };

  // Handle pan move
  const handlePanMove = React.useCallback((e: MouseEvent) => {
    if (!isPanning) return;
    
    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;
    
    const newPanOffset = {
      x: panOffset.x - deltaX,
      y: panOffset.y - deltaY
    };
    
    // Always update the immediate pan offset for smooth visual feedback
    setPanOffset(newPanOffset);
    
    // Throttle the expensive calculations (ruler/grid updates)
    const now = Date.now();
    if (now - lastUpdateTime.current >= THROTTLE_INTERVAL) {
      setThrottledPanOffset(newPanOffset);
      lastUpdateTime.current = now;
    }
    
    setLastMousePos({ x: e.clientX, y: e.clientY });
  }, [isPanning, lastMousePos, panOffset]);

  // Handle pan end
  const handlePanEnd = React.useCallback(() => {
    setIsPanning(false);
    // Ensure we get the final position for accurate ruler/grid positioning
    setThrottledPanOffset(panOffset);
  }, [panOffset]);

  // Add/remove global mouse event listeners
  React.useEffect(() => {
    if (isPanning) {
      document.addEventListener('mousemove', handlePanMove);
      document.addEventListener('mouseup', handlePanEnd);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handlePanMove);
      document.removeEventListener('mouseup', handlePanEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handlePanMove);
      document.removeEventListener('mouseup', handlePanEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isPanning, handlePanMove, handlePanEnd]);

  // Calculate viewBox with pan offset
  const viewBoxX = throttledPanOffset.x;
  const viewBoxY = throttledPanOffset.y;
  const viewBox = `${viewBoxX} ${viewBoxY} ${SVG_WIDTH} ${SVG_HEIGHT}`;

  // Memoize ruler calculations to prevent expensive recalculations during panning
  const rulerElements = React.useMemo(() => {
    const rulerSpacing = GRID_SPACING;
    const buffer = RULER_BUFFER;
    
    // Calculate the range of ruler marks needed
    const startX = Math.floor((viewBoxX - buffer) / rulerSpacing) * rulerSpacing;
    const endX = Math.ceil((viewBoxX + SVG_WIDTH + buffer) / rulerSpacing) * rulerSpacing;
    const startY = Math.floor((viewBoxY - buffer) / rulerSpacing) * rulerSpacing;
    const endY = Math.ceil((viewBoxY + SVG_HEIGHT + buffer) / rulerSpacing) * rulerSpacing;
    
    // Helper functions for ruler positioning
    const getHorizontalRulerY = () => {
      if (viewBoxY > -RULER_TOP_OFFSET) {
        return viewBoxY + RULER_TOP_OFFSET; // Top edge
      } else if (viewBoxY < -SVG_HEIGHT) {
        return SVG_HEIGHT + viewBoxY; // Bottom edge
      }
      return 0; // Default is on the 0 X axis
    };
    
    const getVerticalRulerX = (y: number) => {
      const textLength = y.toString().length;
      const textSpacing = textLength > RULER_TEXT_BASE_LENGTH 
        ? (textLength - RULER_TEXT_BASE_LENGTH) * RULER_TEXT_SPACING_PER_CHAR 
        : 0;
      
      if (viewBoxX > -RULER_LEFT_OFFSET) {
        return viewBoxX + RULER_LEFT_OFFSET + textSpacing; // Left edge
      } else if (viewBoxX < -SVG_WIDTH) {
        return SVG_WIDTH + viewBoxX; // Right edge
      }
      return 0; // Default is on the 0 Y axis
    };
    
    const horizontalRulers = [];
    const verticalRulers = [];
    
    // Generate horizontal ruler marks
    for (let x = startX; x <= endX; x += rulerSpacing) {
      const isAxis = x === 0;
      horizontalRulers.push(
        <g key={`hr-${x}`} transform={`translate(${x}, ${getHorizontalRulerY()})`}>
          <line y1="-5" y2="0" className={isAxis ? "stroke-gray-500" : "stroke-gray-400"} />
          {/* Don't render "0" text for cleaner appearance */}
          {x !== 0 && (
            <text y="-8" textAnchor="middle" fontSize={RULER_TEXT_SIZE} fill={isAxis ? "rgb(75 85 99)" : RULER_TEXT_COLOR} fontWeight={isAxis ? "bold" : "normal"}>
              {x}
            </text>
          )}
        </g>
      );
    }
    
    // Generate vertical ruler marks
    for (let y = startY; y <= endY; y += rulerSpacing) {
      const isAxis = y === 0;
      verticalRulers.push(
        <g key={`vr-${y}`} transform={`translate(${getVerticalRulerX(y)}, ${y})`}>
          <line x1="-5" x2="0" className={isAxis ? "stroke-gray-500" : "stroke-gray-400"} />
          {/* Don't render "0" text for cleaner appearance */}
          {y !== 0 && (
            <text x="-8" y="3" textAnchor="end" fontSize={RULER_TEXT_SIZE} fill={isAxis ? "rgb(75 85 99)" : RULER_TEXT_COLOR} fontWeight={isAxis ? "bold" : "normal"}>
              {y}
            </text>
          )}
        </g>
      );
    }

    const horizontalRulerY = getHorizontalRulerY() -8;
    const verticalRulerX = getVerticalRulerX(0) - 11;
    
    const specialZeroMarker = (
      <g key="special-zero" className="special-zero-marker">
        {/* Background rectangle for the "0" */}
        <rect
          x={Math.min(6, verticalRulerX - 6)}
          y={Math.min(6, horizontalRulerY - 9)}
          width={12}
          height={12}
          fill="white"
          fillOpacity={0.7}
          rx={2}
          ry={2}
          className="SVGTestPage__ZeroMarkerBg"
          style={{ pointerEvents: 'none' }}
        />
        {/* The "0" text */}
        <text
          x={Math.min(12, verticalRulerX)}
          y={Math.min(15, horizontalRulerY)}
          textAnchor="middle"
          fontSize={RULER_TEXT_SIZE}
          fill="rgb(75 85 99)"
          fontWeight="bold"
          className="SVGTestPage__ZeroMarker"
          style={{ pointerEvents: 'none' }}
        >
          0
        </text>
      </g>
    );

    return { horizontalRulers, verticalRulers, specialZeroMarker };
  }, [viewBoxX, viewBoxY]); // Only recalculate when viewBox position changes

  // Memoize grid calculations to prevent expensive recalculations during panning
  const gridElements = React.useMemo(() => {
    if (!showGrid) return { verticalLines: [], horizontalLines: [] };
    
    // Calculate grid lines based on current viewBox
    const gridSpacing = GRID_SPACING;
    const buffer = GRID_BUFFER; // Extra buffer beyond viewBox
    
    // Calculate the range of grid lines needed
    const startX = Math.floor((viewBoxX - buffer) / gridSpacing) * gridSpacing;
    const endX = Math.ceil((viewBoxX + SVG_WIDTH + buffer) / gridSpacing) * gridSpacing;
    const startY = Math.floor((viewBoxY - buffer) / gridSpacing) * gridSpacing;
    const endY = Math.ceil((viewBoxY + SVG_HEIGHT + buffer) / gridSpacing) * gridSpacing;
    
    const verticalLines = [];
    const horizontalLines = [];
    
    // Generate vertical lines
    for (let x = startX; x <= endX; x += gridSpacing) {
      const isAxis = x === 0;
      verticalLines.push(
        <line 
          key={`v-${x}`} 
          x1={x} 
          y1={viewBoxY - buffer} 
          x2={x} 
          y2={viewBoxY + SVG_HEIGHT + buffer} 
          className={isAxis ? "stroke-gray-400" : "stroke-gray-200/80"} 
        />
      );
    }
    
    // Generate horizontal lines
    for (let y = startY; y <= endY; y += gridSpacing) {
      const isAxis = y === 0;
      horizontalLines.push(
        <line 
          key={`h-${y}`} 
          x1={viewBoxX - buffer} 
          y1={y} 
          x2={viewBoxX + SVG_WIDTH + buffer} 
          y2={y} 
          className={isAxis ? "stroke-gray-400" : "stroke-gray-200/80"} 
        />
      );
    }
    
    return { verticalLines, horizontalLines };
  }, [viewBoxX, viewBoxY, showGrid]); // Only recalculate when viewBox position or grid visibility changes

  // Memoize control lines rendering for performance
  const controlLines = React.useMemo(() => {
    if (!showPoints) return [];
    
    let prevPoint = { x: 0, y: 0 };
    return absoluteCommands.map((cmd: parser.Command, i: number) => {
      const originalCmd = commands[i];
      const lines: React.ReactNode[] = [];

      if (originalCmd && originalCmd.code === originalCmd.code.toUpperCase() && originalCmd.code !== 'Z') {
        const coords = commandCoordinates[i];
        if (coords) {
          lines.push(<line key={`origin-${i}`} x1={0} y1={0} x2={coords.x} y2={coords.y} stroke={ORIGIN_LINE_COLOR} strokeDasharray="2 4" />);
        }
      }

      if (cmd.code === 'C') {
        const c1 = pointsMap.get(`pt-${i}-c1`);
        const c2 = pointsMap.get(`pt-${i}-c2`);
        if (prevPoint && c1) lines.push(<line key={`l-${i}-1`} x1={prevPoint.x} y1={prevPoint.y} x2={c1.x} y2={c1.y} stroke={CONTROL_LINE_COLOR} strokeDasharray="4 4" />);
        if (c1 && c2) lines.push(<line key={`l-${i}-2`} x1={c1.x} y1={c1.y} x2={c2.x} y2={c2.y} stroke={CONTROL_LINE_COLOR} />);
        if (c2) {
          const coords = commandCoordinates[i];
          if (coords) {
            lines.push(<line key={`l-${i}-3`} x1={c2.x} y1={c2.y} x2={coords.x} y2={coords.y} stroke={CONTROL_LINE_COLOR} strokeDasharray="4 4" />);
          }
        }
      } else if (cmd.code === 'Q') {
        const q1 = pointsMap.get(`pt-${i}-q1`);
        if (prevPoint && q1) lines.push(<line key={`l-${i}-1`} x1={prevPoint.x} y1={prevPoint.y} x2={q1.x} y2={q1.y} stroke={CONTROL_LINE_COLOR} strokeDasharray="4 4" />);
        if (q1) {
          const coords = commandCoordinates[i];
          if (coords) {
            lines.push(<line key={`l-${i}-2`} x1={q1.x} y1={q1.y} x2={coords.x} y2={coords.y} stroke={CONTROL_LINE_COLOR} strokeDasharray="4 4" />);
          }
        }
      }

      if (cmd.code !== 'Z') {
        const coords = commandCoordinates[i];
        if (coords) {
          prevPoint = coords;
        }
      }
      
      return lines;
    });
  }, [absoluteCommands, commands, commandCoordinates, pointsMap, showPoints]);

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        data-testid="svg-canvas"
        viewBox={viewBox}
        width={SVG_WIDTH}
        height={SVG_HEIGHT}
        className={`w-full h-auto rounded-lg border-2 border-violet-200 bg-gray-50 overflow-hidden ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        aria-label={t('accessibility.canvasLabel')}
        role="graphics-document"
        onMouseDown={handlePanStart}
        style={{ userSelect: 'none' }}
      >
        {/* Define clip path to contain content within SVG boundaries */}
        <defs>
          <clipPath id="svgClip">
            <rect x={viewBoxX} y={viewBoxY} width={SVG_WIDTH} height={SVG_HEIGHT} />
          </clipPath>
        </defs>

        {/* Dynamic Infinite Rulers */}
        <g className="rulers" aria-hidden="true" clipPath="url(#svgClip)">
          {rulerElements.horizontalRulers}
          {rulerElements.verticalRulers}
        </g>

        <g clipPath="url(#svgClip)">
          {/* Dynamic Infinite Grid */}
          {showGrid && (() => {
            return (
              <g className="grid" aria-hidden="true">
                {gridElements.verticalLines}
                {gridElements.horizontalLines}
                {rulerElements.specialZeroMarker}
              </g>
            );
          })()}

          {/* Control Lines */}
          {showPoints && (() => {
            return controlLines;
          })()}
          
          {/* The main path */}
          <path d={pathString} fill={showFill ? '#e9d5ff' : 'none'} stroke="#4c1d95" strokeWidth={PATH_STROKE_WIDTH} />

          {/* Render overlays */}
          {showLabels && <PathCommandsOverlay path={pathString} />}

          {/* Render draggable points */}
          {showPoints && points.map((p) => (
            <circle
              key={p.id}
              cx={p.x}
              cy={p.y}
              r={POINT_RADIUS}
              fill={p.id.includes('control') ? '#f59e42' : '#8b5cf6'}
              stroke="#ffffff"
              strokeWidth={POINT_STROKE_WIDTH}
              className="cursor-move"
              onMouseDown={handleMouseDown(p)}
              data-point-type={p.label.toLowerCase().replace(' ', '-')}
              data-point-id={p.id}
            />
          ))}
        </g>
      </svg>
      {/* Visual Toggles */}
      <div className="absolute top-2 right-2 flex items-center gap-2">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setShowGrid(!showGrid)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowGrid(!showGrid); }}
          className={`p-1.5 rounded-full cursor-pointer transition-colors ${showGrid ? 'bg-violet-600 text-white' : 'bg-gray-200 text-gray-600'}`}
          title={showGrid ? t('controls.hideGrid') : t('controls.showGrid')}
        >
          <Grid size={18} />
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setShowLabels(!showLabels)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowLabels(!showLabels); }}
          className={`p-1.5 rounded-full cursor-pointer transition-colors ${showLabels ? 'bg-violet-600 text-white' : 'bg-gray-200 text-gray-600'}`}
          title={showLabels ? t('controls.hideLabels') : t('controls.showLabels')}
        >
          <Tags size={18} />
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setShowPoints(!showPoints)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowPoints(!showPoints); }}
          className={`p-1.5 rounded-full cursor-pointer transition-colors ${showPoints ? 'bg-violet-600 text-white' : 'bg-gray-200 text-gray-600'}`}
          title={showPoints ? t('controls.hidePoints') : t('controls.showPoints')}
        >
          <CircleDot size={18} />
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setShowFill(!showFill)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowFill(!showFill); }}
          className={`p-1.5 rounded-full cursor-pointer transition-colors ${showFill ? 'bg-violet-600 text-white' : 'bg-gray-200 text-gray-600'}`}
          title={showFill ? t('controls.hideFill') : t('controls.showFill')}
        >
          <Paintbrush size={18} />
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            const newOffset = { x: DEFAULT_PAN_OFFSET_X, y: DEFAULT_PAN_OFFSET_Y };
            setPanOffset(newOffset);
            setThrottledPanOffset(newOffset);
          }}
          onKeyDown={(e) => { 
            if (e.key === 'Enter' || e.key === ' ') {
              const newOffset = { x: DEFAULT_PAN_OFFSET_X, y: DEFAULT_PAN_OFFSET_Y };
              setPanOffset(newOffset);
              setThrottledPanOffset(newOffset);
            }
          }}
          className="p-1.5 rounded-full cursor-pointer transition-colors bg-gray-200 text-gray-600 hover:bg-violet-600 hover:text-white"
          title={t('controls.resetView')}
        >
          <Move size={18} />
        </div>
      </div>
    </div>
  );
};

export default SvgVisualizer;