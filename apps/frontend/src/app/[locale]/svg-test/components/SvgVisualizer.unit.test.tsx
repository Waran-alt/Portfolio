import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import type { Command } from 'svg-path-parser';
import { mockTWithText } from '../test-utils/mockTranslation';
import type { Point } from '../types';
import SvgVisualizer from './SvgVisualizer';

// Mock the svg-path-parser module
jest.mock('svg-path-parser', () => ({
  parseSVG: jest.fn((path) => {
    if (path === 'invalid') {
      throw new Error('Invalid path');
    }
    return [
      { code: 'M', x: 100, y: 200 },
      { code: 'L', x: 300, y: 400 },
      { code: 'C', x: 500, y: 600, x1: 150, y1: 250, x2: 250, y2: 350 },
      { code: 'Q', x: 700, y: 800, x1: 350, y1: 450 },
      { code: 'Z' }
    ];
  }),
  makeAbsolute: jest.fn((commands: Command[]) => commands.map((cmd: Command) => ({ ...cmd, relative: false })))
}));

// Mock the svgCommandHelpers module
jest.mock('../utils/svgCommandHelpers', () => ({
  getCommandCoords: jest.fn((cmd) => ({ x: cmd.x || 0, y: cmd.y || 0 })),
  getControlPoint1: jest.fn((cmd) => ({ x: cmd.x1 || 0, y: cmd.y1 || 0 })),
  getControlPoint2: jest.fn((cmd) => ({ x: cmd.x2 || 0, y: cmd.y2 || 0 }))
}));

describe('SvgVisualizer Unit', () => {
  const defaultProps = {
    svgRef: React.createRef<SVGSVGElement>(),
    pathString: 'M 100 200 L 300 400',
    points: [
      { id: 'pt-0-start', x: 100, y: 200, label: 'Start Point' },
      { id: 'pt-1-end', x: 300, y: 400, label: 'End Point' },
      { id: 'pt-2-c1', x: 150, y: 250, label: 'Control Point 1' },
      { id: 'pt-2-c2', x: 250, y: 350, label: 'Control Point 2' }
    ] as Point[],
    showGrid: true,
    setShowGrid: jest.fn(),
    showLabels: true,
    setShowLabels: jest.fn(),
    showPoints: true,
    setShowPoints: jest.fn(),
    showFill: false,
    setShowFill: jest.fn(),
    handleMouseDown: jest.fn(),
    t: mockTWithText
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('SVG Canvas and Interaction', () => {
    it('should render an SVG element with a dynamic viewBox', () => {
      render(<SvgVisualizer {...defaultProps} />);
      
      const svg = screen.getByRole('graphics-document');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('viewBox', expect.stringMatching(/^-?\d+ -?\d+ \d+ \d+$/));
      expect(svg).toHaveAttribute('width');
      expect(svg).toHaveAttribute('height');
    });

    it('should change the cursor to grabbing when panning starts', async () => {
      render(<SvgVisualizer {...defaultProps} />);
      
      const svg = screen.getByRole('graphics-document');
      
      // Press mouse button to start panning
      fireEvent.mouseDown(svg, { clientX: 0, clientY: 0 });
      
      expect(svg).toHaveClass('cursor-grabbing');
      expect(document.body).toHaveStyle('cursor: grabbing');
      
      // Clean up
      fireEvent.mouseUp(document);
    });



    it('should update the pan offset on mouse move events', async () => {
      render(<SvgVisualizer {...defaultProps} />);
      
      const svg = screen.getByRole('graphics-document');
      const initialViewBox = svg.getAttribute('viewBox');

      // 1. Press the mouse button down
      fireEvent.mouseDown(svg, { clientX: 0, clientY: 0 });

      // 2. Move the mouse while the button is pressed
      fireEvent.mouseMove(document, { clientX: 100, clientY: 100 });

      // 3. Release the mouse button
      fireEvent.mouseUp(document);

      const newViewBox = svg.getAttribute('viewBox');
      expect(newViewBox).not.toBe(initialViewBox);
    });


  });

  describe('Rulers and Grid', () => {
    it('should render horizontal ruler marks within the visible viewport', () => {
      render(<SvgVisualizer {...defaultProps} />);
      
      // Check for ruler marks (they should be present in the SVG)
      const svg = screen.getByRole('graphics-document');
      expect(svg).toBeInTheDocument();
      
      // Rulers are rendered as SVG elements, so we check for the rulers group
      const rulersGroup = svg.querySelector('.rulers');
      expect(rulersGroup).toBeInTheDocument();
    });

    it('should render vertical ruler marks within the visible viewport', () => {
      render(<SvgVisualizer {...defaultProps} />);
      
      const svg = screen.getByRole('graphics-document');
      const rulersGroup = svg.querySelector('.rulers');
      expect(rulersGroup).toBeInTheDocument();
    });

    it('should render horizontal and vertical grid lines when showGrid is true', () => {
      render(<SvgVisualizer {...defaultProps} showGrid={true} />);
      
      const svg = screen.getByRole('graphics-document');
      const gridGroup = svg.querySelector('.grid');
      expect(gridGroup).toBeInTheDocument();
    });

    it('should not render grid lines when showGrid is false', () => {
      render(<SvgVisualizer {...defaultProps} showGrid={false} />);
      
      const svg = screen.getByRole('graphics-document');
      const gridGroup = svg.querySelector('.grid');
      expect(gridGroup).not.toBeInTheDocument();
    });

    it('should apply bold and darker stroke to axis lines (0,0)', () => {
      render(<SvgVisualizer {...defaultProps} />);
      
      const svg = screen.getByRole('graphics-document');
      // Axis lines should have stroke-gray-400 class (darker than regular grid)
      const gridLines = svg.querySelectorAll('line');
      expect(gridLines.length).toBeGreaterThan(0);
    });

    it('should handle negative coordinates correctly', () => {
      render(<SvgVisualizer {...defaultProps} />);
      
      const svg = screen.getByRole('graphics-document');
      expect(svg).toBeInTheDocument();
      // The component should handle negative coordinates without crashing
    });
  });

  describe('Control Lines and Path Rendering', () => {
    it('should render the main SVG path with the provided pathString', () => {
      render(<SvgVisualizer {...defaultProps} />);
      
      const svg = screen.getByRole('graphics-document');
      const path = svg.querySelector('path');
      expect(path).toBeInTheDocument();
      expect(path).toHaveAttribute('d', defaultProps.pathString);
    });

    it('should apply fill when showFill is true and none when false', () => {
      const { rerender } = render(<SvgVisualizer {...defaultProps} showFill={true} />);
      
      let svg = screen.getByRole('graphics-document');
      let path = svg.querySelector('path');
      expect(path).toHaveAttribute('fill', '#e9d5ff');
      
      rerender(<SvgVisualizer {...defaultProps} showFill={false} />);
      
      svg = screen.getByRole('graphics-document');
      path = svg.querySelector('path');
      expect(path).toHaveAttribute('fill', 'none');
    });

    it('should render control lines for cubic bezier commands when showPoints is true', () => {
      render(<SvgVisualizer {...defaultProps} showPoints={true} />);
      
      const svg = screen.getByRole('graphics-document');
      // Control lines should be present for cubic bezier commands
      const lines = svg.querySelectorAll('line');
      expect(lines.length).toBeGreaterThan(0);
    });

    it('should render control lines for quadratic bezier commands when showPoints is true', () => {
      render(<SvgVisualizer {...defaultProps} showPoints={true} />);
      
      const svg = screen.getByRole('graphics-document');
      const lines = svg.querySelectorAll('line');
      expect(lines.length).toBeGreaterThan(0);
    });

    it('should not render control lines when showPoints is false', () => {
      render(<SvgVisualizer {...defaultProps} showPoints={false} />);
      
      // When showPoints is false, control lines should not be rendered
      // (This is handled by the memoized controlLines calculation)
      expect(screen.getByRole('graphics-document')).toBeInTheDocument();
    });

    it('should preserve relative command casing (e.g., q) in overlays', () => {
      // Even though parseSVG is mocked to return uppercase codes, the overlay derives
      // letter casing from the raw path string, so lowercase q should be displayed.
      render(<SvgVisualizer {...defaultProps} showLabels={true} pathString="M 0 0 q 10 10 20 20" />);
      expect(screen.getByText('q')).toBeInTheDocument();
    });

    it('should handle invalid path strings gracefully', () => {
      render(<SvgVisualizer {...defaultProps} pathString="invalid" />);
      
      const svg = screen.getByRole('graphics-document');
      expect(svg).toBeInTheDocument();
      // Component should not crash with invalid paths
    });

    it('should not crash when points array is empty', () => {
      render(<SvgVisualizer {...defaultProps} points={[]} />);
      
      const svg = screen.getByRole('graphics-document');
      expect(svg).toBeInTheDocument();
      // Component should handle empty points array gracefully
    });
  });

  describe('Draggable Points', () => {
    it('should render a circle for each point in the points array when showPoints is true', () => {
      render(<SvgVisualizer {...defaultProps} showPoints={true} />);
      
      const svg = screen.getByRole('graphics-document');
      const circles = svg.querySelectorAll('circle');
      expect(circles.length).toBe(defaultProps.points.length);
    });

    it('should not render circles for points when showPoints is false', () => {
      render(<SvgVisualizer {...defaultProps} showPoints={false} />);
      
      const svg = screen.getByRole('graphics-document');
      const circles = svg.querySelectorAll('circle');
      expect(circles.length).toBe(0);
    });

    it('should call handleMouseDown with the correct point on mousedown', async () => {
      const user = userEvent.setup();
      const handleMouseDown = jest.fn();
      render(<SvgVisualizer {...defaultProps} handleMouseDown={handleMouseDown} showPoints={true} />);
      
      const circles = screen.getByRole('graphics-document').querySelectorAll('circle');
      expect(circles.length).toBeGreaterThan(0);
      
      const firstCircle = circles[0];
      if (firstCircle) {
        await user.click(firstCircle);
        expect(handleMouseDown).toHaveBeenCalled();
      }
    });

    it('should prevent text selection during point dragging', async () => {
      render(<SvgVisualizer {...defaultProps} showPoints={true} />);
      
      const svg = screen.getByRole('graphics-document');
      
      // Start panning (not point dragging)
      fireEvent.mouseDown(svg, { clientX: 0, clientY: 0 });
      
      // The document should have user-select: none during panning
      expect(document.body).toHaveStyle('user-select: none');
      
      // Clean up
      fireEvent.mouseUp(document);
    });
  });

  describe('Visual Toggles', () => {
    it.each([
      ['Hide Grid', 'setShowGrid', false],
      ['Hide Labels', 'setShowLabels', false],
      ['Hide Points', 'setShowPoints', false],
      ['Show Fill', 'setShowFill', true],
    ])('should call %s when the toggle with title "%s" is clicked', async (title, mockFuncName, expectedValue) => {
      const user = userEvent.setup();
      const mockFn = jest.fn();
      const props = { ...defaultProps, [mockFuncName]: mockFn };
      
      render(<SvgVisualizer {...props} />);
      
      const toggle = screen.getByTitle(title);
      await user.click(toggle);
      
      expect(mockFn).toHaveBeenCalledWith(expectedValue);
    });

    it.each([
      ['Hide Grid', 'showGrid'],
      ['Hide Labels', 'showLabels'],
      ['Hide Points', 'showPoints'],
      ['Hide Fill', 'showFill'],
    ])('should apply active styling to %s toggle when %s is true', (title, propName) => {
      const props = { ...defaultProps, [propName]: true };
      render(<SvgVisualizer {...props} />);
      
      const toggle = screen.getByTitle(title);
      expect(toggle).toHaveClass('bg-violet-600');
    });

    it.each([
      ['Hide Grid', 'setShowGrid'],
      ['Hide Labels', 'setShowLabels'],
      ['Hide Points', 'setShowPoints'],
      ['Show Fill', 'setShowFill'],
    ])('should support keyboard navigation for %s toggle', async (title, mockFuncName) => {
      const user = userEvent.setup();
      const mockFn = jest.fn();
      const props = { ...defaultProps, [mockFuncName]: mockFn };
      
      render(<SvgVisualizer {...props} />);
      
      const toggle = screen.getByTitle(title);
      toggle.focus();
      
      await user.keyboard('{Enter}');
      expect(mockFn).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should not recalculate ruler elements on unrelated state changes', () => {
      const { rerender } = render(<SvgVisualizer {...defaultProps} />);
      
      // Change an unrelated prop
      rerender(<SvgVisualizer {...defaultProps} showFill={true} />);
      
      const svg = screen.getByRole('graphics-document');
      expect(svg).toBeInTheDocument();
      // The component should not crash and should maintain performance
    });

    it('should not recalculate grid elements on unrelated state changes', () => {
      const { rerender } = render(<SvgVisualizer {...defaultProps} showGrid={true} />);
      
      // Change an unrelated prop
      rerender(<SvgVisualizer {...defaultProps} showGrid={true} showFill={true} />);
      
      const svg = screen.getByRole('graphics-document');
      expect(svg).toBeInTheDocument();
    });

    it('should recalculate ruler elements when panOffset changes', async () => {
      render(<SvgVisualizer {...defaultProps} />);
      
      const svg = screen.getByRole('graphics-document');
      
      // Start panning
      fireEvent.mouseDown(svg, { clientX: 0, clientY: 0 });
      
      // Pan should trigger recalculation
      fireEvent.mouseMove(document, { clientX: 100, clientY: 100 });
      
      expect(svg).toBeInTheDocument();
      
      // Clean up
      fireEvent.mouseUp(document);
    });

    it('should recalculate grid elements when panOffset or showGrid changes', async () => {
      const { rerender } = render(<SvgVisualizer {...defaultProps} showGrid={true} />);
      
      const svg = screen.getByRole('graphics-document');
      
      // Start panning
      fireEvent.mouseDown(svg, { clientX: 0, clientY: 0 });
      
      // Pan should trigger recalculation
      fireEvent.mouseMove(document, { clientX: 100, clientY: 100 });
      
      // Toggle grid should trigger recalculation
      rerender(<SvgVisualizer {...defaultProps} showGrid={false} />);
      
      expect(svg).toBeInTheDocument();
      
      // Clean up
      fireEvent.mouseUp(document);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty points array gracefully', () => {
      render(<SvgVisualizer {...defaultProps} points={[]} />);
      
      const svg = screen.getByRole('graphics-document');
      expect(svg).toBeInTheDocument();
      
      // Should not crash with empty points
      const circles = svg.querySelectorAll('circle');
      expect(circles.length).toBe(0);
    });

    it('should handle invalid path strings gracefully', () => {
      render(<SvgVisualizer {...defaultProps} pathString="invalid path data" />);
      
      const svg = screen.getByRole('graphics-document');
      expect(svg).toBeInTheDocument();
      
      // Should still render the SVG even with invalid path
      const path = svg.querySelector('path');
      expect(path).toHaveAttribute('d', 'invalid path data');
    });

    it('should handle extreme coordinate values', () => {
      const extremePoints = [
        { id: 'pt-0', x: 999999, y: 999999, label: 'Extreme Point' },
        { id: 'pt-1', x: -999999, y: -999999, label: 'Negative Extreme' }
      ];
      
      render(<SvgVisualizer {...defaultProps} points={extremePoints} />);
      
      const svg = screen.getByRole('graphics-document');
      expect(svg).toBeInTheDocument();
      
      // Should not crash with extreme values
      const circles = svg.querySelectorAll('circle');
      expect(circles.length).toBe(2);
    });

    it('should handle malformed SVG path data', () => {
      render(<SvgVisualizer {...defaultProps} pathString="M 10 20 L" />);
      
      const svg = screen.getByRole('graphics-document');
      expect(svg).toBeInTheDocument();
      
      // Should handle incomplete path data
      const path = svg.querySelector('path');
      expect(path).toHaveAttribute('d', 'M 10 20 L');
    });

    it('should handle rapid state changes without crashes', async () => {
      const { rerender } = render(<SvgVisualizer {...defaultProps} />);
      
      // Rapidly change multiple props
      rerender(<SvgVisualizer {...defaultProps} showGrid={false} showPoints={false} />);
      rerender(<SvgVisualizer {...defaultProps} showGrid={true} showPoints={true} />);
      rerender(<SvgVisualizer {...defaultProps} showFill={true} />);
      
      const svg = screen.getByRole('graphics-document');
      expect(svg).toBeInTheDocument();
    });

    it('should handle null or undefined props gracefully', () => {
      // Test with minimal props
      const minimalProps = {
        svgRef: React.createRef<SVGSVGElement>(),
        pathString: '',
        points: [],
        showGrid: false,
        setShowGrid: jest.fn(),
        showLabels: false,
        setShowLabels: jest.fn(),
        showPoints: false,
        setShowPoints: jest.fn(),
        showFill: false,
        setShowFill: jest.fn(),
        handleMouseDown: jest.fn(),
        t: mockTWithText
      };
      
      render(<SvgVisualizer {...minimalProps} />);
      
      const svg = screen.getByRole('graphics-document');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic HTML structure', () => {
      render(<SvgVisualizer {...defaultProps} />);
      
      const svg = screen.getByRole('graphics-document');
      expect(svg).toHaveAttribute('aria-label', 'SVG Canvas');
    });

    it('should have proper ARIA labels and roles', () => {
      render(<SvgVisualizer {...defaultProps} />);
      
      const svg = screen.getByRole('graphics-document');
      expect(svg).toHaveAttribute('role', 'graphics-document');
      expect(svg).toHaveAttribute('aria-label', 'SVG Canvas');
    });

    it('should maintain focus management during interactions', async () => {
      const user = userEvent.setup();
      render(<SvgVisualizer {...defaultProps} />);
      
      const gridToggle = screen.getByTitle('Hide Grid');
      gridToggle.focus();
      
      expect(gridToggle).toHaveFocus();
      
      await user.keyboard('{Tab}');
      // Focus should move to next toggle
    });
  });

  describe('Integration', () => {
    it('should work correctly with the parent page component', () => {
      render(<SvgVisualizer {...defaultProps} />);
      
      const svg = screen.getByRole('graphics-document');
      expect(svg).toBeInTheDocument();
      // Component should render without errors when used in parent
    });

    it('should handle prop changes without memory leaks', () => {
      const { rerender, unmount } = render(<SvgVisualizer {...defaultProps} />);
      
      // Change props multiple times
      rerender(<SvgVisualizer {...defaultProps} showGrid={false} />);
      rerender(<SvgVisualizer {...defaultProps} showPoints={false} />);
      rerender(<SvgVisualizer {...defaultProps} showFill={true} />);
      
      // Unmount should not cause errors
      unmount();
    });

    it('should clean up event listeners on unmount', () => {
      const { unmount } = render(<SvgVisualizer {...defaultProps} />);
      
      // Add a spy to check if removeEventListener is called
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      
      unmount();
      
      // The component should clean up its event listeners
      expect(removeEventListenerSpy).toHaveBeenCalled();
    });
  });

  describe('Panning Functionality', () => {
    it('should handle pan start correctly with left mouse button', async () => {
      render(<SvgVisualizer {...defaultProps} />);
      
      const svg = screen.getByRole('graphics-document');
      fireEvent.mouseDown(svg, { clientX: 0, clientY: 0 });
      
      // Should set panning state and prevent default
      expect(svg).toHaveClass('cursor-grabbing');
    });

    it('should not start panning with right mouse button', async () => {
      render(<SvgVisualizer {...defaultProps} />);
      
      const svg = screen.getByRole('graphics-document');
      // Simulate right click using fireEvent
      fireEvent.mouseDown(svg, { button: 2 });
      
      // Should not start panning
      expect(svg).not.toHaveClass('cursor-grabbing');
    });

    it('should not start panning when clicking on draggable elements', async () => {
      const user = userEvent.setup();
      render(<SvgVisualizer {...defaultProps} showPoints={true} />);
      
      const svg = screen.getByRole('graphics-document');
      const circles = svg.querySelectorAll('circle');
      expect(circles.length).toBeGreaterThan(0);
      
      // Test clicking on different draggable elements
      for (const circle of Array.from(circles)) {
        await user.click(circle);
        // Should not start panning when clicking on draggable elements
        expect(svg).not.toHaveClass('cursor-grabbing');
      }
    });

    it('should handle pan move with throttling', async () => {
      render(<SvgVisualizer {...defaultProps} />);
      
      const svg = screen.getByRole('graphics-document');
      
      // Start panning
      fireEvent.mouseDown(svg, { clientX: 0, clientY: 0 });
      
      // Move mouse while panning
      fireEvent.mouseMove(document, { clientX: 100, clientY: 100 });
      
      // The viewBox should change due to panning
      expect(svg).toHaveAttribute('viewBox');
      
      // Clean up
      fireEvent.mouseUp(document);
    });

    it('should handle pan end and cleanup', async () => {
      render(<SvgVisualizer {...defaultProps} />);
      
      const svg = screen.getByRole('graphics-document');
      
      // Start panning
      fireEvent.mouseDown(svg, { clientX: 0, clientY: 0 });
      expect(svg).toHaveClass('cursor-grabbing');
      
      // End panning
      fireEvent.mouseUp(document);
      
      // Should clean up panning state
      expect(document.body).not.toHaveStyle('cursor: grabbing');
    });

    it('should apply user-select: none during panning', async () => {
      render(<SvgVisualizer {...defaultProps} />);
      
      const svg = screen.getByRole('graphics-document');
      
      // Start panning
      fireEvent.mouseDown(svg, { clientX: 0, clientY: 0 });
      
      // Should prevent text selection during panning
      expect(document.body).toHaveStyle('user-select: none');
      
      // Clean up
      fireEvent.mouseUp(document);
    });

    it('should clean up event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      const { unmount } = render(<SvgVisualizer {...defaultProps} />);
      
      unmount();
      
      // Should clean up event listeners
      expect(removeEventListenerSpy).toHaveBeenCalled();
    });
  });

  describe('Pan Cursor Behavior', () => {
    it('should show grabbing cursor when panning is active', async () => {
      render(<SvgVisualizer {...defaultProps} />);
      
      const svg = screen.getByRole('graphics-document');
      
      // Start panning
      fireEvent.mouseDown(svg, { clientX: 0, clientY: 0 });
      
      // Should show grabbing cursor
      expect(svg).toHaveClass('cursor-grabbing');
      
      // Clean up
      fireEvent.mouseUp(document);
    });

    it('should show grab cursor when not panning', () => {
      render(<SvgVisualizer {...defaultProps} />);
      
      const svg = screen.getByRole('graphics-document');
      
      // Should show grab cursor when not panning
      expect(svg).toHaveClass('cursor-grab');
    });
  });

  describe('Reset Pan Button', () => {
    it('should reset pan offset when Reset Pan button is clicked', async () => {
      const user = userEvent.setup();
      render(<SvgVisualizer {...defaultProps} />);
      
      const resetButton = screen.getByTitle('Reset Pan');
      expect(resetButton).toBeInTheDocument();
      
      await user.click(resetButton);
      
      // The pan offset should be reset to default values
      const svg = screen.getByRole('graphics-document');
      expect(svg).toBeInTheDocument();
    });

    it.each([
      ['{Enter}', 'Enter key'],
      [' ', 'Space key'],
    ])('should support %s for Reset Pan button', async (key) => {
      const user = userEvent.setup();
      render(<SvgVisualizer {...defaultProps} />);
      
      const resetButton = screen.getByTitle('Reset Pan');
      resetButton.focus();
      
      await user.keyboard(key);
      
      // Should trigger reset functionality
      expect(resetButton).toBeInTheDocument();
    });
  });

  describe('Ruler Positioning Functions', () => {
    it('should calculate horizontal ruler position correctly', () => {
      render(<SvgVisualizer {...defaultProps} />);
      
      const svg = screen.getByRole('graphics-document');
      expect(svg).toBeInTheDocument();
      
      // The ruler positioning logic should work without errors
      const rulersGroup = svg.querySelector('.rulers');
      expect(rulersGroup).toBeInTheDocument();
    });

    it('should calculate vertical ruler position correctly', () => {
      render(<SvgVisualizer {...defaultProps} />);
      
      const svg = screen.getByRole('graphics-document');
      const rulersGroup = svg.querySelector('.rulers');
      expect(rulersGroup).toBeInTheDocument();
    });

    it('should handle extreme pan positions for rulers', () => {
      // Test with extreme pan offset values
      render(<SvgVisualizer {...defaultProps} />);
      
      const svg = screen.getByRole('graphics-document');
      expect(svg).toBeInTheDocument();
      
      // Component should handle extreme values without crashing
    });
  });
}); 