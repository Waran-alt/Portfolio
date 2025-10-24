import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import React from 'react';
import PathCommandsOverlay from './PathCommandsOverlay';

// Helper to render components inside an SVG context, which is required by JSDOM to recognize SVG-specific elements like <text>.
const renderInSvg = (component: React.ReactElement) => {
  return render(<svg>{component}</svg>);
};

describe('PathCommandsOverlay', () => {
  describe('Rendering valid paths', () => {
    it('should render overlays for a complex path with all supported commands', () => {
      const complexPat = 'M 10 20 L 30 40 H 50 V 60 C 70 80, 90 100, 110 120 Q 130 140, 150 160 S 170 180, 190 200 T 210 220 A 50 50 0 0 1 250 260 Z';
      renderInSvg(<PathCommandsOverlay path={complexPat} digits={0} />);

      // Check that all command letters are rendered
      expect(screen.getByText('M')).toBeInTheDocument();
      expect(screen.getByText('L')).toBeInTheDocument();
      expect(screen.getByText('H')).toBeInTheDocument();
      expect(screen.getByText('V')).toBeInTheDocument();
      expect(screen.getByText('C')).toBeInTheDocument();
      expect(screen.getByText('Q')).toBeInTheDocument();
      expect(screen.getByText('S')).toBeInTheDocument();
      expect(screen.getByText('T')).toBeInTheDocument();
      expect(screen.getByText('A')).toBeInTheDocument();
      
      // Check that Z is NOT rendered
      expect(screen.queryByText('Z')).not.toBeInTheDocument();

      // Check for a sample of endpoint coordinates
      expect(screen.getByText('10,20')).toBeInTheDocument(); // M
      expect(screen.getByText('30,40')).toBeInTheDocument(); // L
      expect(screen.getByText('50,40')).toBeInTheDocument(); // H (y is from previous)
      expect(screen.getByText('50,60')).toBeInTheDocument(); // V (x is from previous)
      expect(screen.getByText('110,120')).toBeInTheDocument(); // C
      expect(screen.getByText('210,220')).toBeInTheDocument(); // T
      
      // Check for a sample of control point coordinates
      expect(screen.getByText('70,80')).toBeInTheDocument(); // C1
      expect(screen.getByText('90,100')).toBeInTheDocument(); // C2
      expect(screen.getByText('130,140')).toBeInTheDocument(); // Q1
    });

    it('should not render an overlay for a path with only a Z command', () => {
      renderInSvg(<PathCommandsOverlay path="M 10 10 Z" />);
      // Only the M command should render something. The Z should not.
      expect(screen.getByText('M')).toBeInTheDocument();
      expect(screen.queryByText('Z')).not.toBeInTheDocument();
    });

    it('should render overlays for commands at the origin (0,0)', () => {
        const path = 'M 0 0 L 10 10';
        renderInSvg(<PathCommandsOverlay path={path} />);
        expect(screen.getByText('M')).toBeInTheDocument();
        expect(screen.getByText(/0\.00,0\.00/)).toBeInTheDocument();
    });

    it('should preserve original casing for relative commands (e.g., q)', () => {
      // Lowercase q in source should display as lowercase
      const path = 'M 0 0 q 10 10 20 20';
      renderInSvg(<PathCommandsOverlay path={path} />);
      expect(screen.getByText('q')).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should render nothing for a malformed path string', () => {
        const { container } = renderInSvg(<PathCommandsOverlay path="M 10 20 L 30" />); // Invalid L
        // The component should return null, so the <svg> wrapper will be empty.
        expect(container.firstChild).toBeEmptyDOMElement();
    });

    it('should render nothing for a path with an unknown command code', () => {
        // The svg-path-parser throws an error on an invalid command like 'X',
        // which our component's try/catch block handles by returning null.
        const { container } = renderInSvg(<PathCommandsOverlay path="M 10 20 X 50 50 L 30 40" />);
        expect(container.firstChild).toBeEmptyDOMElement();
    });
  });

  describe('Decimal precision', () => {
    it('should format coordinates to the specified digits and round correctly', () => {
      renderInSvg(<PathCommandsOverlay path="M 10.123 20.456" digits={1} />);
      expect(screen.getByText('10.1,20.5')).toBeInTheDocument(); // Note the rounding
    });
    
    it('should use default precision (2) if digits prop is not provided', () => {
      renderInSvg(<PathCommandsOverlay path="M 10.123 20.456" />);
      expect(screen.getByText('10.12,20.46')).toBeInTheDocument();
    });
  });

  describe('Styling and Accessibility', () => {
    it('should disable pointer events on all rendered text overlays', () => {
        renderInSvg(<PathCommandsOverlay path="M 10 20 L 30 40" />);
        // A regex to find any rendered text (command or coordinate)
        const allTextOverlays = screen.getAllByText(/.+/); 
        allTextOverlays.forEach(textElement => {
            expect(textElement).toHaveStyle('pointer-events: none');
        });
    });
  });
}); 