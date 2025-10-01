import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockT } from '../test-utils/mockTranslation';
import PathCommandBreakdown from './PathCommandBreakdown';

// Mock the dependencies used by the component.
// This isolates the component from external modules, ensuring the test is focused
// on the component's own logic and rendering.
jest.mock('../constants/svgPath', () => ({
  SVG_COMMAND_INFO: {
    M: { name: 'Move To', params: ['x', 'y'], desc: 'Move pen' },
    L: { name: 'Line To', params: ['x', 'y'], desc: 'Draw line' },
    H: { name: 'Horizontal To', params: ['x'], desc: 'Horizontal line' },
    V: { name: 'Vertical To', params: ['y'], desc: 'Vertical line' },
    C: { name: 'Cubic Bezier', params: ['x1', 'y1', 'x2', 'y2', 'x', 'y'], desc: 'Cubic curve' },
    S: { name: 'Shorthand Cubic', params: ['x2', 'y2', 'x', 'y'], desc: 'Shorthand curve' },
    Q: { name: 'Quadratic Bezier', params: ['x1', 'y1', 'x', 'y'], desc: 'Quadratic curve' },
    A: { name: 'Elliptical Arc', params: ['rx', 'ry', 'xAxisRotation', 'largeArcFlag', 'sweepFlag', 'x', 'y'], desc: 'Arc' },
    Z: { name: 'Close Path', params: [], desc: 'Close path' },
  },
}));

describe('PathCommandBreakdown', () => {
  describe('Rendering valid SVG paths', () => {
    /**
     * Tests that the component can correctly parse a valid SVG path string
     * and render a detailed breakdown for each command.
     */
    it('should render a breakdown of a simple SVG path', () => {
      const path = 'M 10 20 L 30 40';
      render(<PathCommandBreakdown path={path} t={mockT} />);

      // Check for command codes (e.g., 'M', 'L')
      expect(screen.getByText('M')).toBeInTheDocument();
      expect(screen.getByText('L')).toBeInTheDocument();

      // Check for command names (e.g., 'Move To')
      expect(screen.getByText('Move To')).toBeInTheDocument();
      expect(screen.getByText('Line To')).toBeInTheDocument();

      // Check for parameters and their values
      expect(screen.getByText(/x: 10/)).toBeInTheDocument();
      expect(screen.getByText(/y: 20/)).toBeInTheDocument();
      expect(screen.getByText(/x: 30/)).toBeInTheDocument();
      expect(screen.getByText(/y: 40/)).toBeInTheDocument();
    });

    it('should render a breakdown for a complex path with various command types', () => {
      const complexPat = 'M 0 0 C 10 20, 30 40, 50 50 Q 60 60, 70 70 H 80 V 90 Z';
      render(<PathCommandBreakdown path={complexPat} t={mockT} />);

      expect(screen.getByText('M')).toBeInTheDocument();
      expect(screen.getByText('Cubic Bezier')).toBeInTheDocument();
      expect(screen.getByText('Quadratic Bezier')).toBeInTheDocument();
      expect(screen.getByText('Horizontal To')).toBeInTheDocument();
      expect(screen.getByText('Vertical To')).toBeInTheDocument();
      expect(screen.getByText('Close Path')).toBeInTheDocument();
      expect(screen.getByText(/y: 90/)).toBeInTheDocument();
    });

    it('should display "Invalid SVG path" for unrecognized command codes', () => {
      // The parser throws an error for an invalid command like 'X',
      // which our component catches and displays an error message for.
      const pathWithUnknownCommand = 'M 10 20 X 50 50';
      render(<PathCommandBreakdown path={pathWithUnknownCommand} t={mockT} />);
      expect(screen.getByText('Invalid SVG path')).toBeInTheDocument();
    });
  });


  describe('Handling invalid or empty paths', () => {
    /**
     * Tests that the component displays a user-friendly error message
     * when provided with a malformed or incomplete SVG path string.
     */
    it('should display an error message for an invalid path', () => {
      const invalidPath = 'M 10 20 L 30'; // Incomplete L command
      render(<PathCommandBreakdown path={invalidPath} t={mockT} />);

      expect(screen.getByText('Invalid SVG path')).toBeInTheDocument();
    });

    it('should have an aria-live="polite" attribute on the error message for accessibility', () => {
      const invalidPath = 'M 10 20 L 30';
      render(<PathCommandBreakdown path={invalidPath} t={mockT} />);
      const errorDiv = screen.getByText('Invalid SVG path');
      expect(errorDiv).toHaveAttribute('aria-live', 'polite');
    });

    /**
     * Tests that the component renders nothing when the path prop is an empty string,
     * preventing unnecessary empty divs from being added to the DOM.
     */
    it('should render nothing for an empty path string', () => {
      const { container } = render(<PathCommandBreakdown path="" t={mockT} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render nothing for a path with only whitespace', () => {
      const { container } = render(<PathCommandBreakdown path="   " t={mockT} />);
      expect(container.firstChild).toBeNull();
    });
  });


  describe('Decimal precision control', () => {
    /**
     * Tests the interactivity of the decimal precision selector.
     * It verifies that the component correctly updates the displayed numeric values
     * when the user changes the number of decimal places.
     */
    it('should allow changing the number of decimal places', async () => {
      const path = 'M 10.123 20.456';
      render(<PathCommandBreakdown path={path} t={mockT} />);

      // The component defaults to 2 decimal places, so check initial state.
      expect(screen.getByText(/x: 10.12/)).toBeInTheDocument();

      // Simulate a user selecting '0' from the decimals dropdown.
      const select = screen.getByRole('combobox');
      await userEvent.selectOptions(select, '0');

      // Verify that the displayed values are now rounded to 0 decimal places.
      expect(screen.getByText(/x: 10/)).toBeInTheDocument();
    });

    it('should correctly round numbers up based on the selected precision', async () => {
      const path = 'M 10.456 20.987'; // These should round up
      render(<PathCommandBreakdown path={path} t={mockT} />);

      // Defaults to 2 decimal places
      expect(screen.getByText(/x: 10.46/)).toBeInTheDocument();
      expect(screen.getByText(/y: 20.99/)).toBeInTheDocument();

      // Change to 1 decimal place
      const select = screen.getByRole('combobox');
      await userEvent.selectOptions(select, '1');
      expect(screen.getByText(/x: 10.5/)).toBeInTheDocument();
      // This regex allows for either '21' or '21.0' to pass
      expect(screen.getByText(/y: 21(\.0)?/)).toBeInTheDocument();
    });
  });
}); 