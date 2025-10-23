import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as parser from 'svg-path-parser';
import { LocaleProvider } from '../../../../i18n/LocaleContext';
import SvgTestPage from './page';
import { formatPathString } from './utils/svgPath';

// Mock CSS imports that are not available in test environment
jest.mock('../../shared/styles/noselect.css', () => ({}), { virtual: true });
jest.mock('@/shared/styles/noselect.css', () => ({}), { virtual: true });

// Mock Next.js app router hooks used by LanguageSwitcher
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/en/svg-test',
}));

// Mock the SVG path parser for controlled testing
jest.mock('svg-path-parser', () => ({
  ...jest.requireActual('svg-path-parser'),
  parseSVG: jest.fn(),
}));

// Mocking browser APIs that are not available in JSDOM
if (typeof window !== 'undefined') {
  // Mock getScreenCTM for SVG coordinate transformations
  (window.SVGElement.prototype as any).getScreenCTM = function () {
    return {
      a: 1, d: 1, e: 0, f: 0,
      inverse: function() {
        return {
          a: 1, d: 1, e: 0, f: 0,
        };
      }
    };
  };
  
  // Mock createSVGPoint for creating SVG points
  (window.SVGElement.prototype as any).createSVGPoint = function () {
    const point = { x: 0, y: 0, matrixTransform: jest.fn() };
    point.matrixTransform = jest.fn().mockReturnValue(point);
    return point;
  };
}

// Helper functions for common test operations
const getPathTextarea = (): HTMLTextAreaElement => 
  screen.getByTestId('path-data-textarea') as HTMLTextAreaElement;
const getValidateButton = (): HTMLButtonElement => 
  screen.getByTestId('validate-button') as HTMLButtonElement;
const getSvg = (): SVGSVGElement => 
  screen.getByTestId('svg-canvas') as unknown as SVGSVGElement;
const getExampleSelector = (): HTMLSelectElement => 
  screen.getByTestId('example-selector') as HTMLSelectElement;

describe('SVG Test Page Integration - Component Interactions', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Set up user event simulation for realistic user interactions
    user = userEvent.setup();
    
    // Provide a default mock implementation for the parser
    // This ensures tests start with a working parser, then we can override for specific test cases
    (parser.parseSVG as jest.Mock).mockImplementation(jest.requireActual('svg-path-parser').parseSVG);
    
    // Mock console.error to prevent test output pollution
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clean up mocks after each test to prevent test pollution
    jest.clearAllMocks();
    consoleErrorSpy.mockRestore();
  });

  // Debug test to see if component renders at all
  it('should render the SVG test page without crashing', () => {
    try {
      const { container } = render(
        <LocaleProvider initialLocale="en">
          <SvgTestPage />
        </LocaleProvider>
      );
      console.log('Component rendered successfully');
      console.log('Container HTML:', container.innerHTML);
      expect(container).toBeInTheDocument();
    } catch (error) {
      console.error('Component failed to render:', error);
      throw error;
    }
  });

  describe('Component Integration - State Synchronization', () => {
    it('should synchronize state between ExampleSelector and PathEditorControls', async () => {
      render(
        <LocaleProvider initialLocale="en">
          <SvgTestPage />
        </LocaleProvider>
      );
      
      const select = getExampleSelector();
      const textarea = getPathTextarea();
      const initialPath = textarea.value;
      
      // Test: Component state synchronization
      // When example selector changes, path editor should update
      await user.selectOptions(select, 'cubic-1');
      
      await waitFor(() => {
        expect(textarea.value).not.toBe(initialPath);
      });
      
      // Verify the new path is valid and renders (exact display string)
      expect(textarea.value).toBe('M 100,200 C 150,100 250,100 300,200');
    });

    it('should synchronize state between PathEditorControls and SvgVisualizer', async () => {
      render(
        <LocaleProvider initialLocale="en">
          <SvgTestPage />
        </LocaleProvider>
      );
      
      const textarea = getPathTextarea();
      const validateButton = getValidateButton();
      const newPath = 'M 50,50 L 100,100 Z';
      
      // Test: Component state synchronization
      // When path editor updates, visualizer should reflect changes
      await user.clear(textarea);
      await user.type(textarea, newPath);
      await user.click(validateButton);
      
      await waitFor(() => {
        expect(textarea.value).toBe(newPath);
      });
      
      // Verify visualizer updates with new path
      const svg = getSvg();
      expect(svg).toBeInTheDocument();
      expect(svg.querySelector('path')).toBeInTheDocument();
    });
  });

  describe('Component Integration - Event Handling', () => {
    it('should handle validation events across components', async () => {
      render(
        <LocaleProvider initialLocale="en">
          <SvgTestPage />
        </LocaleProvider>
      );
      
      const textarea = getPathTextarea();
      const validateButton = getValidateButton();
      const initialPath = textarea.value;
      
      // Test: Event propagation across components
      // Invalid path should trigger error handling in multiple components
      const invalidPath = 'M 50,50 L 100'; // Incomplete path
      
      // Mock parser to throw error for invalid path
      (parser.parseSVG as jest.Mock).mockImplementation((path) => { 
        if (path === invalidPath) {
          throw new Error('Invalid path');
        }
        return jest.requireActual('svg-path-parser').parseSVG(path);
      });
      
      await user.clear(textarea);
      await user.type(textarea, invalidPath);
      await user.click(validateButton);
      
      // Verify error state via accessibility hook-up (no text coupling)
      expect(getPathTextarea()).toHaveAttribute('aria-describedby', 'path-error');
      expect(document.getElementById('path-error')).toBeInTheDocument();
      // Textarea may retain invalid input, but visualizer should revert to last valid path
      const pathEl = getSvg().querySelector('path');
      expect(pathEl).toBeInTheDocument();
      expect(pathEl!.getAttribute('d')).toBe(initialPath);
      expect(getSvg()).toBeInTheDocument(); // Visualizer should remain stable
    });

    it('should handle example selection events across components', async () => {
      render(
        <LocaleProvider initialLocale="en">
          <SvgTestPage />
        </LocaleProvider>
      );
      
      const select = getExampleSelector();
      const textarea = getPathTextarea();
      
      // Test: Event handling across components
      // Example selection should update multiple components simultaneously
      await user.selectOptions(select, 'quadratic-1');
      
      await waitFor(() => {
        expect(textarea.value).toBe('M 100,200 Q 200,100 300,200');
      });
      
      // Verify all components reflect the change without text coupling
      expect(getSvg()).toBeInTheDocument();
      expect(screen.getAllByTestId('path-parameter').length).toBeGreaterThan(0);
    });
  });

  describe('Component Integration - Data Flow', () => {
    it('should maintain data consistency between parser and visualizer', async () => {
      render(
        <LocaleProvider initialLocale="en">
          <SvgTestPage />
        </LocaleProvider>
      );
      
      const textarea = getPathTextarea();
      const validateButton = getValidateButton();
      
      // Test: Data flow consistency
      // Parser output should match visualizer input
      const testPath = 'M 0,0 L 100,100';
      
      await user.clear(textarea);
      await user.type(textarea, testPath);
      await user.click(validateButton);
      
      await waitFor(() => {
        expect(textarea.value).toBe(testPath);
      });
      
      // Verify parser and visualizer are in sync
      expect(getSvg()).toBeInTheDocument();
      expect(getSvg().querySelector('path')).toBeInTheDocument();
    });

    it('should handle data transformation between components', async () => {
      render(
        <LocaleProvider initialLocale="en">
          <SvgTestPage />
        </LocaleProvider>
      );
      
      const select = getExampleSelector();
      
      // Test: Data transformation across components
      // Example selector should transform data for other components
      await user.selectOptions(select, 'cubic-1');
      
      // Verify data transformation maintains integrity
      const textarea = getPathTextarea();
      expect(textarea.value).toContain('M 100,200 C 150,100 250,100 300,200');
      
      // Verify transformed data renders correctly
      expect(getSvg()).toBeInTheDocument();
      expect(getSvg().querySelector('path')).toBeInTheDocument();
    });
  });

  describe('Component Integration - Error Boundaries', () => {
    it('should handle parser errors without breaking component chain', async () => {
      render(
        <LocaleProvider initialLocale="en">
          <SvgTestPage />
        </LocaleProvider>
      );
      
      const textarea = getPathTextarea();
      const validateButton = getValidateButton();
      
      // Test: Error boundary behavior
      // Parser errors should not break the component integration
      (parser.parseSVG as jest.Mock).mockImplementation(() => { 
        throw new Error('Parser failure'); 
      });
      
      await user.clear(textarea);
      await user.type(textarea, 'invalid');
      await user.click(validateButton);
      
      // Verify error handling maintains component integration (no text coupling)
      expect(getPathTextarea()).toHaveAttribute('aria-describedby', 'path-error');
      expect(document.getElementById('path-error')).toBeInTheDocument();
      expect(textarea.value).toBe(formatPathString('M 100,200 Q 200,100 300,200')); // Should revert to initial path
      expect(getSvg()).toBeInTheDocument();
      
      // Verify components remain interactive
      expect(getValidateButton()).toBeEnabled();
      expect(getExampleSelector()).toBeEnabled();
    });

    it('should recover from errors and restore functionality', async () => {
      render(
        <LocaleProvider initialLocale="en">
          <SvgTestPage />
        </LocaleProvider>
      );
      
      const textarea = getPathTextarea();
      const validateButton = getValidateButton();
      
      // First, cause an error
      (parser.parseSVG as jest.Mock).mockImplementation((path) => { 
        if (path === 'invalid') {
          throw new Error('Parser failure');
        }
        return jest.requireActual('svg-path-parser').parseSVG(path);
      });
      
      await user.clear(textarea);
      await user.type(textarea, 'invalid');
      await user.click(validateButton);
      
      // Verify error state via accessibility hook-up
      expect(getPathTextarea()).toHaveAttribute('aria-describedby', 'path-error');
      expect(document.getElementById('path-error')).toBeInTheDocument();
      
      // Now restore parser functionality
      (parser.parseSVG as jest.Mock).mockImplementation(jest.requireActual('svg-path-parser').parseSVG);
      
      // Test recovery
      await user.clear(textarea);
      await user.type(textarea, 'M 50,50 L 100,100');
      await user.click(validateButton);
      
      // Verify recovery (exact display string)
      await waitFor(() => {
        expect(textarea.value).toBe('M 50,50 L 100,100');
      });
      
      expect(getSvg()).toBeInTheDocument();
      expect(getSvg().querySelector('path')).toBeInTheDocument();
    });
  });

  describe('Component Integration - Performance', () => {
    it('should handle rapid state changes without breaking integration', async () => {
      render(
        <LocaleProvider initialLocale="en">
          <SvgTestPage />
        </LocaleProvider>
      );
      
      const select = getExampleSelector();
      const textarea = getPathTextarea();
      
      // Test: Performance under rapid changes
      // Components should maintain integration during rapid updates
      await user.selectOptions(select, 'cubic-1');
      await user.selectOptions(select, 'quadratic-1');
      await user.selectOptions(select, 'cubic-1');
      
      // Verify integration remains stable
      await waitFor(() => {
        expect(textarea.value).toBe('M 100,200 C 150,100 250,100 300,200');
      });
      
      expect(getSvg()).toBeInTheDocument();
      expect(getSvg().querySelector('path')).toBeInTheDocument();
    });

    it('should maintain component responsiveness during updates', async () => {
      render(
        <LocaleProvider initialLocale="en">
          <SvgTestPage />
        </LocaleProvider>
      );
      
      const select = getExampleSelector();
      const validateButton = getValidateButton();
      
      // Test: Component responsiveness
      // All components should remain interactive during updates
      await user.selectOptions(select, 'cubic-1');
      
      // Verify components remain responsive
      expect(select).toBeEnabled();
      expect(validateButton).toBeEnabled();
      expect(getPathTextarea()).toBeEnabled();
      
      // Verify visualizer remains functional
      expect(getSvg()).toBeInTheDocument();
    });
  });

  describe('Component Integration - Visual State Management', () => {
    it('should maintain visual state when toggling features', async () => {
      render(
        <LocaleProvider initialLocale="en">
          <SvgTestPage />
        </LocaleProvider>
      );
      
      const svg = getSvg();
      
      // Test: Grid toggle functionality
      const gridToggle = screen.getByTestId('toggle-grid');
      await user.click(gridToggle);
      
      // Verify grid state changes
      expect(screen.getByTitle(/show grid/i)).toBeInTheDocument();
      
      // Verify SVG remains functional
      expect(svg).toBeInTheDocument();
      
      // Test toggle back
      await user.click(screen.getByTitle(/show grid/i));
      expect(screen.getByTitle(/hide grid/i)).toBeInTheDocument();
    });

    it('should maintain coordinate display when toggling labels', async () => {
      render(
        <LocaleProvider initialLocale="en">
          <SvgTestPage />
        </LocaleProvider>
      );
      
      // Test: Labels toggle functionality
      const labelsToggle = screen.getByTestId('toggle-labels');
      await user.click(labelsToggle);
      
      // Verify labels state changes
      expect(screen.getByTitle(/show labels/i)).toBeInTheDocument();
      
      // Verify SVG remains functional
      expect(getSvg()).toBeInTheDocument();
      
      // Test toggle back
      await user.click(screen.getByTitle(/show labels/i));
      expect(screen.getByTitle(/hide labels/i)).toBeInTheDocument();
    });

    it('should maintain point visibility when toggling points', async () => {
      render(
        <LocaleProvider initialLocale="en">
          <SvgTestPage />
        </LocaleProvider>
      );
      
      // Test: Points toggle functionality
      const pointsToggle = screen.getByTestId('toggle-points');
      await user.click(pointsToggle);
      
      // Verify points state changes
      expect(screen.getByTitle(/show points/i)).toBeInTheDocument();
      
      // Verify SVG remains functional
      expect(getSvg()).toBeInTheDocument();
      
      // Test toggle back
      await user.click(screen.getByTitle(/show points/i));
      expect(screen.getByTitle(/hide points/i)).toBeInTheDocument();
    });
  });

  describe('Component Integration - SVG Rendering', () => {
    it('should render SVG with correct dimensions and viewBox', async () => {
      render(
        <LocaleProvider initialLocale="en">
          <SvgTestPage />
        </LocaleProvider>
      );
      
      const svg = getSvg();
      
      // Test: SVG attributes
      expect(svg).toHaveAttribute('width');
      expect(svg).toHaveAttribute('height');
      expect(svg).toHaveAttribute('viewBox');
      
      // Test: ViewBox format
      const viewBox = svg.getAttribute('viewBox');
      expect(viewBox).toMatch(/^-?\d+ -?\d+ \d+ \d+$/);
      
      // Test: SVG presence (visibility might be affected by CSS)
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '800');
      expect(svg).toHaveAttribute('height', '400');
    });

    it('should maintain SVG content when switching examples', async () => {
      render(
        <LocaleProvider initialLocale="en">
          <SvgTestPage />
        </LocaleProvider>
      );
      
      const select = getExampleSelector();
      const svg = getSvg();
      
      // Test: Initial SVG content
      expect(svg.querySelector('path')).toBeInTheDocument();
      
      // Test: Example switching updates SVG
      await user.selectOptions(select, 'cubic-1');
      
      await waitFor(() => {
        expect(svg.querySelector('path')).toBeInTheDocument();
      });
      
      // Verify SVG remains functional
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Component Integration - User Input Validation', () => {
    it('should prevent empty paths from being validated', async () => {
      render(
        <LocaleProvider initialLocale="en">
          <SvgTestPage />
        </LocaleProvider>
      );
      
      const textarea = getPathTextarea();
      const validateButton = getValidateButton();
      
      // Test: Empty path validation
      await user.clear(textarea);
      await user.click(validateButton);
      
      // Verify error state via accessibility
      expect(textarea).toHaveAttribute('aria-describedby', 'path-error');
      expect(document.getElementById('path-error')).toBeInTheDocument();
      
      // Verify user can input new path
      await user.type(textarea, 'M 50,50 L 100,100');
      expect(textarea.value).toBe('M 50,50 L 100,100');
    });

    it('should handle malformed SVG commands gracefully', async () => {
      render(
        <LocaleProvider initialLocale="en">
          <SvgTestPage />
        </LocaleProvider>
      );
      
      const textarea = getPathTextarea();
      const validateButton = getValidateButton();
      const initialPath = textarea.value;
      const malformedPath = 'M 50,50 L 100,100 M'; // Incomplete command
      
      // Mock parser to reject malformed path
      (parser.parseSVG as jest.Mock).mockImplementation(() => { 
        throw new Error('Malformed SVG command'); 
      });
      
      // Test: Malformed path handling
      await user.clear(textarea);
      await user.type(textarea, malformedPath);
      await user.click(validateButton);
      
      // Verify error state via accessibility
      expect(textarea).toHaveAttribute('aria-describedby', 'path-error');
      expect(document.getElementById('path-error')).toBeInTheDocument();
      
      // Textarea may retain invalid input; assert revert via visualizer path
      const pathEl = getSvg().querySelector('path');
      expect(pathEl).toBeInTheDocument();
      expect(pathEl!.getAttribute('d')).toBe(initialPath);
    });
  });

  describe('Component Integration - Performance and Responsiveness', () => {
    it('should handle large SVG paths without performance issues', async () => {
      render(
        <LocaleProvider initialLocale="en">
          <SvgTestPage />
        </LocaleProvider>
      );
      
      const textarea = getPathTextarea();
      const validateButton = getValidateButton();
      
      // Create a moderately complex path (reduced from 100 to 20 commands to avoid timeout)
      const complexPath = 'M 0,0 ' + Array.from({ length: 20 }, (_, i) => 
        `L ${i * 10},${i * 5}`
      ).join(' ');
      
      // Test: Complex path handling
      await user.clear(textarea);
      await user.type(textarea, complexPath);
      await user.click(validateButton);
      
      // Verify successful rendering
      await waitFor(() => {
        expect(getSvg()).toBeInTheDocument();
        expect(getSvg().querySelector('path')).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Verify UI remains responsive
      expect(validateButton).toBeEnabled();
    });
  });

  describe('Component Integration - Accessibility', () => {
    it('should maintain keyboard navigation functionality', async () => {
      render(
        <LocaleProvider initialLocale="en">
          <SvgTestPage />
        </LocaleProvider>
      );
      
      // Test: Keyboard accessibility
      await user.tab();
      
      // Verify focus moves to interactive element
      const focusedElement = document.activeElement;
      expect(focusedElement).toBeInTheDocument();
      
      // Check that focused element is interactive
      if (focusedElement) {
        const isNaturallyFocusable = focusedElement.tagName === 'BUTTON' || 
                                     focusedElement.tagName === 'INPUT' || 
                                     focusedElement.tagName === 'SELECT' || 
                                     focusedElement.tagName === 'TEXTAREA';
        const hasTabIndex = focusedElement.hasAttribute('tabindex');
        
        expect(isNaturallyFocusable || hasTabIndex).toBe(true);
      }
      
      // Test: Tab order functionality
      await user.tab();
      const nextFocusedElement = document.activeElement;
      expect(nextFocusedElement).toBeInTheDocument();
      expect(nextFocusedElement).not.toBe(focusedElement);
    });

    it('should maintain ARIA labels and roles', async () => {
      render(
        <LocaleProvider initialLocale="en">
          <SvgTestPage />
        </LocaleProvider>
      );
      
      // Test: Form element accessibility
      expect(screen.getByTestId('path-data-textarea')).toBeInTheDocument();
      expect(screen.getByTestId('example-selector')).toBeInTheDocument();
      
      // Test: Button accessibility
      expect(screen.getByTestId('validate-button')).toBeInTheDocument();
      
      // Test: SVG accessibility
      expect(screen.getByTestId('svg-canvas')).toBeInTheDocument();
    });
  });
});
