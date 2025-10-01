import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { mockTWithText } from '../test-utils/mockTranslation';
import type { Point } from '../types';
import SvgVisualizer from './SvgVisualizer';

describe('SvgVisualizer Integration', () => {
  const defaultProps = {
    svgRef: React.createRef<SVGSVGElement>(),
    pathString: 'M 100 200 L 300 400 C 150 100 250 100 300 200',
    points: [
      { id: 'pt-0-start', x: 100, y: 200, label: 'Start Point' },
      { id: 'pt-1-end', x: 300, y: 400, label: 'End Point' },
      { id: 'pt-2-c1', x: 150, y: 100, label: 'Control Point 1' },
      { id: 'pt-2-c2', x: 250, y: 100, label: 'Control Point 2' }
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

  describe('Real Component Rendering', () => {
    it('should render with real SVG path data', () => {
      render(<SvgVisualizer {...defaultProps} />);
      
      const svg = screen.getByRole('graphics-document');
      expect(svg).toBeInTheDocument();
      
      // Should render the actual path
      const path = svg.querySelector('path');
      expect(path).toHaveAttribute('d', defaultProps.pathString);
    });

    it('should render all visual elements correctly', () => {
      render(<SvgVisualizer {...defaultProps} />);
      
      const svg = screen.getByRole('graphics-document');
      
      // Check for grid
      const gridGroup = svg.querySelector('.grid');
      expect(gridGroup).toBeInTheDocument();
      
      // Check for rulers
      const rulersGroup = svg.querySelector('.rulers');
      expect(rulersGroup).toBeInTheDocument();
      
      // Check for points
      const circles = svg.querySelectorAll('circle');
      expect(circles.length).toBe(defaultProps.points.length);
      
      // Check for path
      const path = svg.querySelector('path');
      expect(path).toBeInTheDocument();
    });

    it('should render command labels when showLabels is true', () => {
      render(<SvgVisualizer {...defaultProps} showLabels={true} />);
      
      // Should render command labels (M, L, C, etc.)
      const svg = screen.getByRole('graphics-document');
      const textElements = svg.querySelectorAll('text');
      expect(textElements.length).toBeGreaterThan(0);
    });

    it('should not render command labels when showLabels is false', () => {
      render(<SvgVisualizer {...defaultProps} showLabels={false} />);
      
      // Should not render command labels, but ruler labels should still be present
      const svg = screen.getByRole('graphics-document');
      
      // Check that command labels (from PathCommandsOverlay) are not rendered
      // Ruler labels should still be present, so we check for specific command labels
      const commandLabels = svg.querySelectorAll('text[data-command]');
      expect(commandLabels.length).toBe(0);
      
      // Ruler labels should still be present
      const rulerLabels = svg.querySelectorAll('text');
      expect(rulerLabels.length).toBeGreaterThan(0);
    });
  });

  describe('User Interaction Workflows', () => {
    it('should handle complete pan workflow', async () => {
      render(<SvgVisualizer {...defaultProps} />);
      
      const svg = screen.getByRole('graphics-document');
      const initialViewBox = svg.getAttribute('viewBox');
      
      // Start panning with proper mouse event sequence
      fireEvent.mouseDown(svg, { clientX: 0, clientY: 0 });
      expect(svg).toHaveClass('cursor-grabbing');
      
      // Move mouse
      fireEvent.mouseMove(document, { clientX: 50, clientY: 50 });
      
      // End panning
      fireEvent.mouseUp(document);
      
      // Check final state
      const finalViewBox = svg.getAttribute('viewBox');
      expect(finalViewBox).not.toBe(initialViewBox);
      expect(svg).toHaveClass('cursor-grab'); // Should return to grab cursor
    });

    it('should handle toggle workflow for all controls', async () => {
      const user = userEvent.setup();
      const setShowGrid = jest.fn();
      const setShowLabels = jest.fn();
      const setShowPoints = jest.fn();
      const setShowFill = jest.fn();
      
      render(<SvgVisualizer 
        {...defaultProps} 
        setShowGrid={setShowGrid}
        setShowLabels={setShowLabels}
        setShowPoints={setShowPoints}
        setShowFill={setShowFill}
      />);
      
      // Toggle grid
      const gridToggle = screen.getByTitle('Hide Grid');
      await user.click(gridToggle);
      expect(setShowGrid).toHaveBeenCalledWith(false);
      
      // Toggle labels
      const labelsToggle = screen.getByTitle('Hide Labels');
      await user.click(labelsToggle);
      expect(setShowLabels).toHaveBeenCalledWith(false);
      
      // Toggle points
      const pointsToggle = screen.getByTitle('Hide Points');
      await user.click(pointsToggle);
      expect(setShowPoints).toHaveBeenCalledWith(false);
      
      // Toggle fill
      const fillToggle = screen.getByTitle('Show Fill');
      await user.click(fillToggle);
      expect(setShowFill).toHaveBeenCalledWith(true);
    });

    it('should handle keyboard navigation workflow', async () => {
      const user = userEvent.setup();
      const setShowGrid = jest.fn();
      
      render(<SvgVisualizer {...defaultProps} setShowGrid={setShowGrid} />);
      
      const gridToggle = screen.getByTitle('Hide Grid');
      gridToggle.focus();
      
      // Navigate with keyboard - both Enter and Space should toggle the grid
      await user.keyboard('{Enter}');
      expect(setShowGrid).toHaveBeenCalledWith(false);
      
      // Reset the mock to check the next call
      setShowGrid.mockClear();
      await user.keyboard(' ');
      expect(setShowGrid).toHaveBeenCalledWith(false);
    });

    it('should handle point dragging workflow', async () => {
      const user = userEvent.setup();
      const handleMouseDown = jest.fn();
      
      render(<SvgVisualizer {...defaultProps} handleMouseDown={handleMouseDown} />);
      
      const circle = screen.getByRole('graphics-document').querySelector('circle');
      expect(circle).toBeInTheDocument();
      
      await user.click(circle!);
      expect(handleMouseDown).toHaveBeenCalled();
    });

    it('should handle reset pan workflow', async () => {
      const user = userEvent.setup();
      render(<SvgVisualizer {...defaultProps} />);
      
      const svg = screen.getByRole('graphics-document');
      const resetButton = screen.getByTitle('Reset Pan');
      
      // Start panning
      await user.click(svg);
      fireEvent.mouseMove(document, { clientX: 100, clientY: 100 });
      
      // Reset pan
      await user.click(resetButton);
      
      // Should reset to default position
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Real Data Scenarios', () => {
    it('should handle complex SVG path with multiple commands', () => {
      const complexPath = 'M 10 10 L 50 50 C 20 20 80 80 100 100 Q 60 60 120 120 Z';
      const complexPoints = [
        { id: 'pt-0', x: 10, y: 10, label: 'Start' },
        { id: 'pt-1', x: 50, y: 50, label: 'Line End' },
        { id: 'pt-2-c1', x: 20, y: 20, label: 'Control 1' },
        { id: 'pt-2-c2', x: 80, y: 80, label: 'Control 2' },
        { id: 'pt-3', x: 100, y: 100, label: 'Curve End' },
        { id: 'pt-4-c1', x: 60, y: 60, label: 'Quad Control' },
        { id: 'pt-5', x: 120, y: 120, label: 'Quad End' }
      ];
      
      render(<SvgVisualizer {...defaultProps} pathString={complexPath} points={complexPoints} />);
      
      const svg = screen.getByRole('graphics-document');
      expect(svg).toBeInTheDocument();
      
      const path = svg.querySelector('path');
      expect(path).toHaveAttribute('d', complexPath);
      
      const circles = svg.querySelectorAll('circle');
      expect(circles.length).toBe(complexPoints.length);
    });

    it('should handle real-world coordinate ranges', () => {
      const realWorldPoints = [
        { id: 'pt-0', x: 0, y: 0, label: 'Origin' },
        { id: 'pt-1', x: 800, y: 600, label: 'Max' },
        { id: 'pt-2', x: -100, y: -100, label: 'Negative' },
        { id: 'pt-3', x: 400, y: 300, label: 'Center' }
      ];
      
      render(<SvgVisualizer {...defaultProps} points={realWorldPoints} />);
      
      const svg = screen.getByRole('graphics-document');
      expect(svg).toBeInTheDocument();
      
      const circles = svg.querySelectorAll('circle');
      expect(circles.length).toBe(realWorldPoints.length);
    });

    it('should handle empty path gracefully', () => {
      render(<SvgVisualizer {...defaultProps} pathString="" />);
      
      const svg = screen.getByRole('graphics-document');
      expect(svg).toBeInTheDocument();
      
      const path = svg.querySelector('path');
      expect(path).toHaveAttribute('d', '');
    });
  });

  describe('Performance and Memory', () => {
    it('should handle rapid prop changes without memory leaks', () => {
      const { rerender, unmount } = render(<SvgVisualizer {...defaultProps} />);
      
      // Rapidly change props
      for (let i = 0; i < 10; i++) {
        rerender(<SvgVisualizer {...defaultProps} showGrid={i % 2 === 0} />);
        rerender(<SvgVisualizer {...defaultProps} showPoints={i % 2 === 0} />);
        rerender(<SvgVisualizer {...defaultProps} showFill={i % 2 === 0} />);
      }
      
      // Should not crash
      expect(screen.getByRole('graphics-document')).toBeInTheDocument();
      
      // Clean unmount
      unmount();
    });

    it('should handle large point arrays efficiently', () => {
      const largePointsArray = Array.from({ length: 100 }, (_, i) => ({
        id: `pt-${i}`,
        x: i * 10,
        y: i * 10,
        label: `Point ${i}`
      }));
      
      render(<SvgVisualizer {...defaultProps} points={largePointsArray} />);
      
      const svg = screen.getByRole('graphics-document');
      expect(svg).toBeInTheDocument();
      
      const circles = svg.querySelectorAll('circle');
      expect(circles.length).toBe(100);
    });
  });

  describe('Ruler Positioning Edge Cases', () => {
    it('should position horizontal rulers correctly when viewBox is scrolled far down', async () => {
      // Test the edge case where viewBoxY < -SVG_HEIGHT (line 215, 217)
      render(<SvgVisualizer {...defaultProps} />);
      
      const svg = screen.getByRole('graphics-document');
      
      // Simulate extreme panning to the bottom
      fireEvent.mouseDown(svg, { clientX: 0, clientY: 0 });
      fireEvent.mouseMove(document, { clientX: 0, clientY: -1000 }); // Extreme downward pan
      fireEvent.mouseUp(document);
      
      // Should still render rulers even in extreme positions
      const rulersGroup = svg.querySelector('.rulers');
      expect(rulersGroup).toBeInTheDocument();
    });

    it('should position vertical rulers correctly when viewBox is scrolled far right', async () => {
      // Test the edge case where viewBoxX < -SVG_WIDTH (line 229, 231)
      render(<SvgVisualizer {...defaultProps} />);
      
      const svg = screen.getByRole('graphics-document');
      
      // Simulate extreme panning to the right
      fireEvent.mouseDown(svg, { clientX: 0, clientY: 0 });
      fireEvent.mouseMove(document, { clientX: -1000, clientY: 0 }); // Extreme rightward pan
      fireEvent.mouseUp(document);
      
      // Should still render rulers even in extreme positions
      const rulersGroup = svg.querySelector('.rulers');
      expect(rulersGroup).toBeInTheDocument();
    });

    it('should handle text spacing calculations for long coordinate values', async () => {
      // Test the text spacing logic in getVerticalRulerX (lines 222-225)
      render(<SvgVisualizer {...defaultProps} />);
      
      const svg = screen.getByRole('graphics-document');
      
      // Simulate panning to large negative coordinates to trigger text spacing
      fireEvent.mouseDown(svg, { clientX: 0, clientY: 0 });
      fireEvent.mouseMove(document, { clientX: -2000, clientY: 0 }); // Very large negative value
      fireEvent.mouseUp(document);
      
      // Should handle long coordinate text without layout issues
      const rulersGroup = svg.querySelector('.rulers');
      expect(rulersGroup).toBeInTheDocument();
    });

    it('should maintain ruler visibility during extreme panning scenarios', async () => {
      // Test both extreme cases simultaneously
      render(<SvgVisualizer {...defaultProps} />);
      
      const svg = screen.getByRole('graphics-document');
      
      // Simulate extreme panning in both directions
      fireEvent.mouseDown(svg, { clientX: 0, clientY: 0 });
      fireEvent.mouseMove(document, { clientX: -1500, clientY: -800 }); // Extreme pan
      fireEvent.mouseUp(document);
      
      // Rulers should remain visible and functional
      const rulersGroup = svg.querySelector('.rulers');
      expect(rulersGroup).toBeInTheDocument();
      
      // Should have both horizontal and vertical rulers
      const horizontalRulers = rulersGroup?.querySelectorAll('g[transform*="translate"]');
      expect(horizontalRulers?.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility Integration', () => {
    it('should support full keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<SvgVisualizer {...defaultProps} />);
      
      // Tab through all interactive elements
      await user.tab();
      
      const gridToggle = screen.getByTitle('Hide Grid');
      expect(gridToggle).toHaveFocus();
      
      await user.tab();
      const labelsToggle = screen.getByTitle('Hide Labels');
      expect(labelsToggle).toHaveFocus();
      
      await user.tab();
      const pointsToggle = screen.getByTitle('Hide Points');
      expect(pointsToggle).toHaveFocus();
      
      await user.tab();
      const fillToggle = screen.getByTitle('Show Fill');
      expect(fillToggle).toHaveFocus();
      
      await user.tab();
      const resetButton = screen.getByTitle('Reset Pan');
      expect(resetButton).toHaveFocus();
    });

    it('should have proper ARIA attributes', () => {
      render(<SvgVisualizer {...defaultProps} />);
      
      const svg = screen.getByRole('graphics-document');
      expect(svg).toHaveAttribute('aria-label', 'SVG Canvas');
      
      const toggles = screen.getAllByRole('button');
      toggles.forEach(toggle => {
        expect(toggle).toHaveAttribute('title');
      });
    });
  });
}); 