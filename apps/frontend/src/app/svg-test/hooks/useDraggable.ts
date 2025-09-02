/**
 * @file Custom hook for handling draggable point interactions.
 * Supports mouse, touch, and pointer events with coordinate transformation.
 */

import React from 'react';
import type { Point } from '../types';

// --- TYPES AND INTERFACES ---

/**
 * Represents the current state of a draggable point.
 */
export interface DraggableState {
  /** Whether the point is currently being dragged */
  isDragging: boolean;
  /** Current position of the point */
  position: { x: number; y: number };
  /** Original position before dragging started */
  originalPosition: { x: number; y: number };
  /** Last recorded pointer position for delta calculations */
  lastPointerPos: { x: number; y: number };
}

/**
 * Configuration options for the draggable hook.
 */
export interface DraggableOptions {
  /** Callback fired when dragging starts */
  onDragStart?: (point: Point, position: { x: number; y: number }) => void;
  /** Callback fired during dragging with new position */
  onDragMove?: (point: Point, newPosition: { x: number; y: number }) => void;
  /** Callback fired when dragging ends */
  onDragEnd?: (point: Point, finalPosition: { x: number; y: number }) => void;
  /** Custom transform function for coordinate conversion */
  transform?: (clientPos: { x: number; y: number }, svgElement: SVGSVGElement) => { x: number; y: number };
  /** Whether to enable touch/pointer event support */
  enablePointerEvents?: boolean;
  /** Minimum distance required to start dragging */
  minDragDistance?: number;
  /** Whether to snap to grid */
  snapToGrid?: boolean;
  /** Grid size for snapping */
  gridSize?: number;
  /** Constraints for dragging bounds */
  constraints?: {
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
  };
}

/**
 * Event handlers returned by the useDraggable hook.
 */
export interface DraggableHandlers {
  /** Pointer down event handler */
  onPointerDown: (e: React.PointerEvent) => void;
  /** Pointer move event handler */
  onPointerMove: (e: React.PointerEvent) => void;
  /** Pointer up event handler */
  onPointerUp: (e: React.PointerEvent) => void;
  /** Mouse down event handler (fallback for older browsers) */
  onMouseDown?: (e: React.MouseEvent) => void;
  /** Mouse move event handler (fallback for older browsers) */
  onMouseMove?: (e: React.MouseEvent) => void;
  /** Mouse up event handler (fallback for older browsers) */
  onMouseUp?: (e: React.MouseEvent) => void;
}

/**
 * Return type for the useDraggable hook.
 */
export interface UseDraggableReturn {
  /** Current dragging state */
  dragState: DraggableState;
  /** Event handlers to attach to the draggable element */
  dragHandlers: DraggableHandlers;
  /** Function to manually update point position */
  setPosition: (position: { x: number; y: number }) => void;
  /** Function to reset position to original */
  resetPosition: () => void;
  /** Function to check if a pointer event should start dragging */
  shouldStartDrag: (e: React.PointerEvent | React.MouseEvent) => boolean;
}

// --- CONSTANTS ---

const DEFAULT_MIN_DRAG_DISTANCE = 5;
const DEFAULT_GRID_SIZE = 1;

// --- UTILITY FUNCTIONS ---

/**
 * Calculates the distance between two points.
 */
function calculateDistance(
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Snaps a value to the nearest grid position.
 */
function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Applies constraints to a position.
 */
function applyConstraints(
  position: { x: number; y: number },
  constraints?: DraggableOptions['constraints']
): { x: number; y: number } {
  if (!constraints) return position;

  let { x, y } = position;

  if (constraints.minX !== undefined) x = Math.max(x, constraints.minX);
  if (constraints.maxX !== undefined) x = Math.min(x, constraints.maxX);
  if (constraints.minY !== undefined) y = Math.max(y, constraints.minY);
  if (constraints.maxY !== undefined) y = Math.min(y, constraints.maxY);

  return { x, y };
}

/**
 * Default coordinate transformation function.
 * Converts client coordinates to SVG coordinates.
 */
function defaultTransform(
  clientPos: { x: number; y: number },
  svgElement: SVGSVGElement
): { x: number; y: number } {
  const svgPoint = svgElement.createSVGPoint();
  svgPoint.x = clientPos.x;
  svgPoint.y = clientPos.y;

  const ctm = svgElement.getScreenCTM();
  if (!ctm) return clientPos;

  const transformedPoint = svgPoint.matrixTransform(ctm.inverse());
  
  return {
    x: parseFloat(transformedPoint.x.toFixed(2)),
    y: parseFloat(transformedPoint.y.toFixed(2))
  };
}

/**
 * Determines if a pointer event should start dragging.
 */
function shouldStartDragging(
  e: React.PointerEvent | React.MouseEvent,
  target: HTMLElement
): boolean {
  // Only left mouse button for mouse events
  if ('button' in e && e.button !== 0) return false;
  
  // Only start dragging on draggable elements
  if (!target.classList.contains('cursor-move')) {
    return false;
  }
  
  return true;
}

// --- MAIN HOOK IMPLEMENTATION ---

/**
 * Custom hook for handling draggable point interactions.
 * 
 * @param point - The point to make draggable
 * @param svgRef - Reference to the SVG element for coordinate transformation
 * @param options - Configuration options for dragging behavior
 * @returns Object containing drag state and event handlers
 * 
 * @example
 * ```tsx
 * const { dragState, dragHandlers } = useDraggable(point, svgRef, {
 *   onDragMove: (point, newPos) => updatePointPosition(point.id, newPos)
 * });
 * 
 * return (
 *   <circle
 *     cx={dragState.position.x}
 *     cy={dragState.position.y}
 *     {...dragHandlers}
 *   />
 * );
 * ```
 */
export function useDraggable(
  point: Point,
  svgRef: React.RefObject<SVGSVGElement>,
  options: DraggableOptions = {}
): UseDraggableReturn {
  const {
    onDragStart,
    onDragMove,
    onDragEnd,
    transform = defaultTransform,
    enablePointerEvents = true,
    minDragDistance = DEFAULT_MIN_DRAG_DISTANCE,
    snapToGrid: shouldSnapToGrid = false,
    gridSize = DEFAULT_GRID_SIZE,
    constraints
  } = options;

  // --- STATE MANAGEMENT ---
  
  const [dragState, setDragState] = React.useState<DraggableState>({
    isDragging: false,
    position: { x: point.x, y: point.y },
    originalPosition: { x: point.x, y: point.y },
    lastPointerPos: { x: 0, y: 0 }
  });

  // --- REFS FOR PERFORMANCE ---
  
  const isDraggingRef = React.useRef(false);
  const startPosRef = React.useRef({ x: 0, y: 0 });
  const hasMovedRef = React.useRef(false);

  // --- EVENT HANDLERS ---

  /**
   * Handles the start of a drag interaction.
   */
  const handleDragStart = React.useCallback((e: React.PointerEvent | React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    if (!shouldStartDragging(e, target)) {
      return;
    }

    if (!svgRef.current) return;

    const clientPos = { x: e.clientX, y: e.clientY };
    const transformedPos = transform(clientPos, svgRef.current);

    setDragState(prev => ({
      ...prev,
      isDragging: true,
      originalPosition: prev.position,
      lastPointerPos: transformedPos
    }));

    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startPosRef.current = transformedPos;

    // Prevent text selection during dragging
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';

    onDragStart?.(point, dragState.position);
  }, [point, dragState.position, transform, onDragStart]);

  /**
   * Handles drag movement.
   */
  const handleDragMove = React.useCallback((e: PointerEvent | MouseEvent) => {
    if (!isDraggingRef.current || !svgRef.current) return;

    const clientPos = { x: e.clientX, y: e.clientY };
    const transformedPos = transform(clientPos, svgRef.current);

    // Check if we've moved enough to start dragging
    const distance = calculateDistance(startPosRef.current, transformedPos);
    if (!hasMovedRef.current && distance < minDragDistance) {
      return;
    }

    hasMovedRef.current = true;

    const deltaX = transformedPos.x - dragState.lastPointerPos.x;
    const deltaY = transformedPos.y - dragState.lastPointerPos.y;

    let newPosition = {
      x: dragState.position.x + deltaX,
      y: dragState.position.y + deltaY
    };

    // Apply grid snapping if enabled
    if (shouldSnapToGrid) {
      newPosition = {
        x: snapToGrid(newPosition.x, gridSize),
        y: snapToGrid(newPosition.y, gridSize)
      };
    }

    // Apply constraints
    newPosition = applyConstraints(newPosition, constraints);

    setDragState(prev => ({
      ...prev,
      position: newPosition,
      lastPointerPos: transformedPos
    }));

    onDragMove?.(point, newPosition);
  }, [point, dragState.position, dragState.lastPointerPos, transform, minDragDistance, shouldSnapToGrid, gridSize, constraints, onDragMove]);

  /**
   * Handles the end of a drag interaction.
   */
  const handleDragEnd = React.useCallback(() => {
    if (!isDraggingRef.current) return;

    setDragState(prev => ({
      ...prev,
      isDragging: false
    }));

    isDraggingRef.current = false;

    // Restore document styles
    document.body.style.userSelect = '';
    document.body.style.cursor = '';

    onDragEnd?.(point, dragState.position);
  }, [point, dragState.position, onDragEnd]);

  // --- GLOBAL EVENT LISTENERS ---

  React.useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('pointermove', handleDragMove);
      document.addEventListener('pointerup', handleDragEnd);
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
    } else {
      document.removeEventListener('pointermove', handleDragMove);
      document.removeEventListener('pointerup', handleDragEnd);
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
    }

    return () => {
      document.removeEventListener('pointermove', handleDragMove);
      document.removeEventListener('pointerup', handleDragEnd);
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [dragState.isDragging, handleDragMove, handleDragEnd]);

  // --- UPDATE POSITION WHEN POINT CHANGES ---

  React.useEffect(() => {
    setDragState(prev => ({
      ...prev,
      position: { x: point.x, y: point.y },
      originalPosition: { x: point.x, y: point.y }
    }));
  }, [point.x, point.y]);

  // --- UTILITY FUNCTIONS ---

  /**
   * Manually updates the point position.
   */
  const setPosition = React.useCallback((position: { x: number; y: number }) => {
    const constrainedPosition = applyConstraints(position, constraints);
    setDragState(prev => ({
      ...prev,
      position: constrainedPosition
    }));
  }, [constraints]);

  /**
   * Resets position to original values.
   */
  const resetPosition = React.useCallback(() => {
    setDragState(prev => ({
      ...prev,
      position: prev.originalPosition
    }));
  }, []);

  /**
   * Checks if a pointer event should start dragging.
   */
  const shouldStartDrag = React.useCallback((e: React.PointerEvent | React.MouseEvent) => {
    const target = e.target as HTMLElement;
    return shouldStartDragging(e, target);
  }, []);

  // --- RETURN EVENT HANDLERS ---

  const dragHandlers: DraggableHandlers = React.useMemo(() => {
    const handlers: DraggableHandlers = {
      onPointerDown: handleDragStart,
      onPointerMove: () => {}, // Handled globally
      onPointerUp: () => {}, // Handled globally
    };

    // Fallback for older browsers
    if (!enablePointerEvents) {
      handlers.onMouseDown = handleDragStart;
      handlers.onMouseMove = () => {}; // Handled globally
      handlers.onMouseUp = () => {}; // Handled globally
    }

    return handlers;
  }, [handleDragStart, enablePointerEvents]);

  return {
    dragState,
    dragHandlers,
    setPosition,
    resetPosition,
    shouldStartDrag
  };
}
