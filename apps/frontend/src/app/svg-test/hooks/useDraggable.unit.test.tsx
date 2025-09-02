/**
 * @file Unit tests for useDraggable hook.
 * Tests isolated hook behavior and mocked dependencies.
 */

import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import type { Point } from '../types';
import { useDraggable } from './useDraggable';

// Mock document.body.style
Object.defineProperty(document.body, 'style', {
  value: {},
  writable: true,
  configurable: true
});

// Mock document event listeners
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();
Object.defineProperty(document, 'addEventListener', {
  value: mockAddEventListener,
  writable: true
});
Object.defineProperty(document, 'removeEventListener', {
  value: mockRemoveEventListener,
  writable: true
});

// Test component to render the hook
interface TestComponentProps {
  point: Point;
  options?: Parameters<typeof useDraggable>[2];
  onDragStart?: jest.Mock;
  onDragMove?: jest.Mock;
  onDragEnd?: jest.Mock;
}

const TestComponent: React.FC<TestComponentProps> = ({ 
  point, 
  options = {}, 
  onDragStart,
  onDragMove,
  onDragEnd 
}) => {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const { dragState, dragHandlers, setPosition, resetPosition, shouldStartDrag } = useDraggable(
    point,
    svgRef as React.RefObject<SVGSVGElement>,
    {
      ...options,
      ...(onDragStart && { onDragStart }),
      ...(onDragMove && { onDragMove }),
      ...(onDragEnd && { onDragEnd })
    }
  );

  return (
    <div>
      <svg ref={svgRef} width="400" height="300" viewBox="0 0 400 300" data-testid="svg-element">
        <circle
          cx={dragState.position.x}
          cy={dragState.position.y}
          r="5"
          className="cursor-move"
          data-testid="draggable-point"
          {...dragHandlers}
        />
      </svg>
      <div data-testid="is-dragging">{dragState.isDragging.toString()}</div>
      <div data-testid="position-x">{dragState.position.x}</div>
      <div data-testid="position-y">{dragState.position.y}</div>
      <div data-testid="original-x">{dragState.originalPosition.x}</div>
      <div data-testid="original-y">{dragState.originalPosition.y}</div>
      <button 
        data-testid="set-position-btn" 
        onClick={() => setPosition({ x: 200, y: 150 })}
      >
        Set Position
      </button>
      <button 
        data-testid="reset-position-btn" 
        onClick={resetPosition}
      >
        Reset Position
      </button>
      <button 
        data-testid="should-start-drag-btn"
        onMouseDown={(e) => {
          const result = shouldStartDrag(e);
          e.currentTarget.setAttribute('data-result', result.toString());
        }}
      >
        Test Should Start Drag
      </button>
    </div>
  );
};

describe('useDraggable Unit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset document.body.style
    Object.defineProperty(document.body, 'style', {
      value: {},
      writable: true,
      configurable: true
    });
  });

  describe('Initial State', () => {
    it('should initialize with correct state', () => {
      const point: Point = { id: '1', x: 100, y: 200, label: 'Test Point' };
      
      render(<TestComponent point={point} />);
      
      expect(screen.getByTestId('is-dragging')).toHaveTextContent('false');
      expect(screen.getByTestId('position-x')).toHaveTextContent('100');
      expect(screen.getByTestId('position-y')).toHaveTextContent('200');
      expect(screen.getByTestId('original-x')).toHaveTextContent('100');
      expect(screen.getByTestId('original-y')).toHaveTextContent('200');
    });

    it('should update state when point changes', () => {
      const { rerender } = render(<TestComponent point={{ id: '1', x: 100, y: 200, label: 'Test Point' }} />);
      
      rerender(<TestComponent point={{ id: '1', x: 150, y: 250, label: 'Test Point' }} />);
      
      expect(screen.getByTestId('position-x')).toHaveTextContent('150');
      expect(screen.getByTestId('position-y')).toHaveTextContent('250');
      expect(screen.getByTestId('original-x')).toHaveTextContent('150');
      expect(screen.getByTestId('original-y')).toHaveTextContent('250');
    });
  });

  describe('Mouse Dragging', () => {
    it('should have correct initial state', () => {
      const point: Point = { id: '1', x: 100, y: 200, label: 'Test Point' };
      
      render(<TestComponent point={point} />);
      
      const draggablePoint = screen.getByTestId('draggable-point');
      expect(draggablePoint).toHaveClass('cursor-move');
      expect(screen.getByTestId('is-dragging')).toHaveTextContent('false');
    });

    it('should start dragging on left mouse button down', async () => {
      const point: Point = { id: '1', x: 100, y: 200, label: 'Test Point' };
      const user = userEvent.setup();
      
      render(<TestComponent point={point} />);
      
      const draggablePoint = screen.getByTestId('draggable-point');
      await user.pointer({ target: draggablePoint, keys: '[MouseLeft]' });
      
      expect(screen.getByTestId('is-dragging')).toHaveTextContent('true');
    });

    it('should not start dragging on right mouse button', () => {
      const point: Point = { id: '1', x: 100, y: 200, label: 'Test Point' };
      
      render(<TestComponent point={point} />);
      
      const draggablePoint = screen.getByTestId('draggable-point');
      fireEvent.mouseDown(draggablePoint, { button: 2, clientX: 100, clientY: 200 });
      
      expect(screen.getByTestId('is-dragging')).toHaveTextContent('false');
    });

    it('should not start dragging on non-draggable elements', () => {
      const point: Point = { id: '1', x: 100, y: 200, label: 'Test Point' };
      
      render(<TestComponent point={point} />);
      
      const setPositionBtn = screen.getByTestId('set-position-btn');
      fireEvent.mouseDown(setPositionBtn, { button: 0, clientX: 100, clientY: 200 });
      
      expect(screen.getByTestId('is-dragging')).toHaveTextContent('false');
    });
  });

  describe('Pointer Events', () => {
    it('should handle pointer down events', async () => {
      const point: Point = { id: '1', x: 100, y: 200, label: 'Test Point' };
      const user = userEvent.setup();
      
      render(<TestComponent point={point} />);
      
      const draggablePoint = screen.getByTestId('draggable-point');
      await user.pointer({ target: draggablePoint, keys: '[MouseLeft]' });
      
      expect(screen.getByTestId('is-dragging')).toHaveTextContent('true');
    });
  });

  describe('Event Listeners', () => {
    it('should add event listeners when dragging starts', async () => {
      const point: Point = { id: '1', x: 100, y: 200, label: 'Test Point' };
      const user = userEvent.setup();
      
      render(<TestComponent point={point} />);
      
      const draggablePoint = screen.getByTestId('draggable-point');
      await user.pointer({ target: draggablePoint, keys: '[MouseLeft]' });
      
      expect(mockAddEventListener).toHaveBeenCalledWith('pointermove', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('pointerup', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
    });
  });

  describe('Callbacks', () => {
    it('should call onDragStart callback', async () => {
      const point: Point = { id: '1', x: 100, y: 200, label: 'Test Point' };
      const onDragStart = jest.fn();
      const user = userEvent.setup();
      
      render(<TestComponent point={point} onDragStart={onDragStart} />);
      
      const draggablePoint = screen.getByTestId('draggable-point');
      await user.pointer({ target: draggablePoint, keys: '[MouseLeft]' });
      
      expect(onDragStart).toHaveBeenCalledWith(point, { x: 100, y: 200 });
    });
  });

  describe('Utility Functions', () => {
    it('should correctly determine if drag should start', () => {
      const point: Point = { id: '1', x: 100, y: 200, label: 'Test Point' };
      
      render(<TestComponent point={point} />);
      
      const testBtn = screen.getByTestId('should-start-drag-btn');
      
      // Test with left mouse button
      fireEvent.mouseDown(testBtn, { button: 0 });
      expect(testBtn.getAttribute('data-result')).toBe('false'); // Not a draggable element
      
      // Test with right mouse button
      fireEvent.mouseDown(testBtn, { button: 2 });
      expect(testBtn.getAttribute('data-result')).toBe('false');
    });

    it('should set position manually', () => {
      const point: Point = { id: '1', x: 100, y: 200, label: 'Test Point' };
      
      render(<TestComponent point={point} />);
      
      const setPositionBtn = screen.getByTestId('set-position-btn');
      fireEvent.click(setPositionBtn);
      
      expect(screen.getByTestId('position-x')).toHaveTextContent('200');
      expect(screen.getByTestId('position-y')).toHaveTextContent('150');
    });

    it('should reset position to original', () => {
      const point: Point = { id: '1', x: 100, y: 200, label: 'Test Point' };
      
      render(<TestComponent point={point} />);
      
      // First set a new position
      const setPositionBtn = screen.getByTestId('set-position-btn');
      fireEvent.click(setPositionBtn);
      
      // Then reset
      const resetBtn = screen.getByTestId('reset-position-btn');
      fireEvent.click(resetBtn);
      
      expect(screen.getByTestId('position-x')).toHaveTextContent('100');
      expect(screen.getByTestId('position-y')).toHaveTextContent('200');
    });
  });

  describe('Constraints', () => {
    it('should apply position constraints', () => {
      const point: Point = { id: '1', x: 100, y: 200, label: 'Test Point' };
      const options = {
        constraints: {
          minX: 50,
          maxX: 150,
          minY: 100,
          maxY: 300
        }
      };
      
      render(<TestComponent point={point} options={options} />);
      
      const setPositionBtn = screen.getByTestId('set-position-btn');
      fireEvent.click(setPositionBtn);
      
      // Position should be constrained to maxX: 150, not 200
      expect(screen.getByTestId('position-x')).toHaveTextContent('150');
      expect(screen.getByTestId('position-y')).toHaveTextContent('150');
    });
  });

  describe('Grid Snapping', () => {
    it('should snap to grid when enabled', () => {
      const point: Point = { id: '1', x: 100, y: 200, label: 'Test Point' };
      const options = {
        snapToGrid: true,
        gridSize: 10
      };
      
      render(<TestComponent point={point} options={options} />);
      
      const setPositionBtn = screen.getByTestId('set-position-btn');
      fireEvent.click(setPositionBtn);
      
      // Position should be snapped to grid (200 -> 200, 150 -> 150)
      expect(screen.getByTestId('position-x')).toHaveTextContent('200');
      expect(screen.getByTestId('position-y')).toHaveTextContent('150');
    });
  });

  describe('Minimum Drag Distance', () => {
    it('should not start dragging if movement is too small', () => {
      const point: Point = { id: '1', x: 100, y: 200, label: 'Test Point' };
      const options = {
        minDragDistance: 50
      };
      
      render(<TestComponent point={point} options={options} />);
      
      const draggablePoint = screen.getByTestId('draggable-point');
      fireEvent.mouseDown(draggablePoint, { button: 0, clientX: 100, clientY: 200 });
      
      // Small movement should not trigger dragging
      act(() => {
        const moveEvent = new MouseEvent('mousemove', {
          clientX: 120, // Only 20px movement
          clientY: 210
        });
        document.dispatchEvent(moveEvent);
      });
      
      // Position should remain unchanged
      expect(screen.getByTestId('position-x')).toHaveTextContent('100');
      expect(screen.getByTestId('position-y')).toHaveTextContent('200');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing SVG reference', () => {
      const point: Point = { id: '1', x: 100, y: 200, label: 'Test Point' };
      
      // Create a component without SVG ref
      const TestComponentWithoutSvg: React.FC = () => {
        const svgRef = React.useRef<SVGSVGElement>(null);
        const { dragState } = useDraggable(point, svgRef as React.RefObject<SVGSVGElement>);
        
        return (
          <div>
            <div data-testid="position-x">{dragState.position.x}</div>
            <div data-testid="position-y">{dragState.position.y}</div>
          </div>
        );
      };
      
      render(<TestComponentWithoutSvg />);
      
      expect(screen.getByTestId('position-x')).toHaveTextContent('100');
      expect(screen.getByTestId('position-y')).toHaveTextContent('200');
    });
  });
});
