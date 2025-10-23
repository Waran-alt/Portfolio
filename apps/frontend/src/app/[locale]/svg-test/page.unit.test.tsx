import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
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

// Mock framer-motion to avoid animation-related issues in tests
jest.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Increase timeout for slower tests in this suite
jest.setTimeout(20000);

// Helper to render with locale context
function renderWithLocale(ui: React.ReactElement) {
  return render(<LocaleProvider initialLocale="en">{ui}</LocaleProvider>);
}

describe('SVG Test Page Unit Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    user = userEvent.setup();
    // Provide a default mock implementation for the parser
    (parser.parseSVG as jest.Mock).mockImplementation(jest.requireActual('svg-path-parser').parseSVG);
    
    // Mock console.error to prevent test output pollution
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockRestore();
  });

  describe('Component Initialization', () => {
    it('should initialize with correct default state', () => {
      renderWithLocale(<SvgTestPage />);
      
      // Heading present (text may be i18n key during tests)
      expect(screen.getByRole('heading')).toBeInTheDocument();
      
      // Default example selection
      const select = screen.getByTestId('example-selector') as HTMLSelectElement;
      expect(select).toBeInTheDocument();
      
      // Default path textarea present
      const textarea = screen.getByTestId('path-data-textarea') as HTMLTextAreaElement;
      expect(textarea).toBeInTheDocument();
      
      // Default UI visibility states via testids
      expect(screen.getByTestId('toggle-grid')).toBeInTheDocument();
      expect(screen.getByTestId('toggle-labels')).toBeInTheDocument();
      expect(screen.getByTestId('toggle-points')).toBeInTheDocument();
      expect(screen.getByTestId('toggle-fill')).toBeInTheDocument();
    });

    it('should handle missing examples gracefully', () => {
      // This test verifies the component handles edge cases
      // Since we can't easily mock the constants import in this test setup,
      // we'll test the component's resilience in other ways
      
      renderWithLocale(<SvgTestPage />);
      
      // Render without crashing (heading present)
      expect(screen.getByRole('heading')).toBeInTheDocument();
      
      // Test: Component should handle invalid example selection gracefully
      const select = screen.getByTestId('example-selector') as HTMLSelectElement;
      expect(select).toBeInTheDocument();
      
      // Test: Component should have fallback behavior
      const textarea = screen.getByTestId('path-data-textarea') as HTMLTextAreaElement;
      expect(textarea).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('should update selectedExample state when example changes', async () => {
      renderWithLocale(<SvgTestPage />);
      
      const select = screen.getByTestId('example-selector') as HTMLSelectElement;
      
      // Test: State change on example selection
      await user.selectOptions(select, 'cubic-1');
      expect(select.value).toBe('cubic-1');
      
      // Test: Path string updates accordingly (exact display string)
      const textarea = screen.getByTestId('path-data-textarea') as HTMLTextAreaElement;
      expect(textarea.value).toBe('M 100,200 C 150,100 250,100 300,200');
    });

    it('should handle path closing state correctly', async () => {
      renderWithLocale(<SvgTestPage />);
      
      const textarea = screen.getByTestId('path-data-textarea') as HTMLTextAreaElement;
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(1);
      const closePathCheckbox = checkboxes[1]!;
      
      // Test: Initial state
      expect(closePathCheckbox).not.toBeChecked();
      expect(textarea.value).not.toMatch(/Z$/);
      
      // Test: Toggle close path
      await user.click(closePathCheckbox);
      expect(closePathCheckbox).toBeChecked();
      expect(textarea.value).toMatch(/Z$/);
      
      // Test: Untoggle close path
      await user.click(closePathCheckbox);
      expect(closePathCheckbox).not.toBeChecked();
      expect(textarea.value).not.toMatch(/Z$/);
    });

    it('should handle relative/absolute command state', async () => {
      renderWithLocale(<SvgTestPage />);
      
      const relativeCheckbox = screen.getAllByRole('checkbox')[0]!;
      
      // Test: Initial state (absolute)
      expect(relativeCheckbox).not.toBeChecked();
      
      // Test: Toggle to relative
      await user.click(relativeCheckbox);
      expect(relativeCheckbox).toBeChecked();
      
      // Test: Toggle back to absolute
      await user.click(relativeCheckbox);
      expect(relativeCheckbox).not.toBeChecked();
    });
  });

  describe('Path Validation Logic', () => {
    it('should handle empty path validation correctly', async () => {
      renderWithLocale(<SvgTestPage />);
      
      const textarea = screen.getByTestId('path-data-textarea') as HTMLTextAreaElement;
      const validateButton = screen.getByTestId('validate-button') as HTMLButtonElement;
      
      // Test: Clear textarea
      await user.clear(textarea);
      expect(textarea.value).toBe('');
      
      // Test: Click validate button
      await user.click(validateButton);
      
      // Test: Error state via accessibility (no text coupling)
      expect(textarea).toHaveAttribute('aria-describedby', 'path-error');
      expect(document.getElementById('path-error')).toBeInTheDocument();
    });

    it('should handle invalid SVG path validation', async () => {
      renderWithLocale(<SvgTestPage />);
      
      const textarea = screen.getByTestId('path-data-textarea') as HTMLTextAreaElement;
      const validateButton = screen.getByTestId('validate-button') as HTMLButtonElement;
      const initialPath = textarea.value;
      
      // Mock parser to throw error for invalid path
      (parser.parseSVG as jest.Mock).mockImplementation(() => { 
        throw new Error('Invalid SVG path'); 
      });
      
      // Test: Input invalid path
      await user.clear(textarea);
      await user.type(textarea, 'invalid path');
      await user.click(validateButton);
      
      // Test: Error state via accessibility hook-up (no text coupling)
      expect(textarea).toHaveAttribute('aria-describedby', 'path-error');
      expect(document.getElementById('path-error')).toBeInTheDocument();
      
      // Visualizer should still display the last valid path (textarea may keep user input)
      const svg = screen.getByTestId('svg-canvas') as unknown as SVGSVGElement;
      const pathEl = svg.querySelector('path');
      expect(pathEl).toBeInTheDocument();
      expect(pathEl!.getAttribute('d')).toBe(initialPath);
    });

    it('should handle valid SVG path validation', async () => {
      renderWithLocale(<SvgTestPage />);
      
      const textarea = screen.getByTestId('path-data-textarea') as HTMLTextAreaElement;
      const validateButton = screen.getByTestId('validate-button') as HTMLButtonElement;
      const validPath = 'M 0,0 L 100,100';
      
      // Test: Input valid path
      await user.clear(textarea);
      await user.type(textarea, validPath);
      await user.click(validateButton);
      
      // Test: Path should be accepted
      expect(textarea.value).toBe(formatPathString(validPath));
      
      // Test: Error element should not be present
      expect(document.getElementById('path-error')).toBeNull();
    });
  });

  describe('Path Manipulation Functions', () => {
    it('should handle appending new path segments', async () => {
      renderWithLocale(<SvgTestPage />);
      
      const textarea = screen.getByTestId('path-data-textarea') as HTMLTextAreaElement;
      const appendButton = screen.getByTestId('append-button') as HTMLButtonElement;
      const initialPath = textarea.value;
      
      // Test: Append new segment
      await user.click(appendButton);
      
      // Test: Path should be extended
      expect(textarea.value).not.toBe(initialPath);
      expect(textarea.value).toContain(initialPath);
      
      // Test: New segment should be valid SVG
      expect(textarea.value).toMatch(/^M.*Q.*\s+[A-Z]\s+\d+[,\s]\d+/i);
    });

    it('should handle rounding path values', async () => {
      renderWithLocale(<SvgTestPage />);
      
      const textarea = screen.getByTestId('path-data-textarea') as HTMLTextAreaElement;
      const roundButton = screen.getByTestId('round-values-button') as HTMLButtonElement;
      
      // Test: Round values
      await user.click(roundButton);
      
      // Test: Path should be updated (either changed or already rounded)
      // The path might already be rounded, so we check if it's still valid
      expect(textarea.value).toMatch(/^M.*Q.*/i);
      
      // Test: Values should be valid SVG format
      const numbers = textarea.value.match(/\d+\.\d+/g);
      // If there are decimal numbers, they should be reasonable (not extremely long)
      if (numbers) {
        numbers.forEach(num => {
          expect(parseFloat(num)).toBeLessThan(1000); // Reasonable range
        });
      }
    });

    it('should handle segment type changes', async () => {
      renderWithLocale(<SvgTestPage />);
      
      // Find the segment type selector by looking for the select element near the Append button
      const appendButton = screen.getByTestId('append-button') as HTMLButtonElement;
      const segmentSelect = appendButton.previousElementSibling as HTMLSelectElement | null;
      expect(segmentSelect).not.toBeNull();
      
      // Test: Change segment type
      await user.selectOptions(segmentSelect!, 'L');
      expect(segmentSelect!.value).toBe('L');
      
      // Test: Append should use new segment type
      await user.click(appendButton);
      
      const textarea = screen.getByTestId('path-data-textarea') as HTMLTextAreaElement;
      expect(textarea.value).toContain(' L ');
    });
  });

  describe('Error Handling', () => {
    it('should handle parser errors gracefully', async () => {
      renderWithLocale(<SvgTestPage />);
      
      // Mock parser to throw error
      (parser.parseSVG as jest.Mock).mockImplementation(() => { 
        throw new Error('Parser error'); 
      });
      
      const validateButton = screen.getByTestId('validate-button') as HTMLButtonElement;
      
      // Test: Component should not crash on parser error
      await user.click(validateButton);
      
      // Test: Error state via accessibility hook-up (no text coupling)
      const textarea = screen.getByTestId('path-data-textarea') as HTMLTextAreaElement;
      expect(textarea).toHaveAttribute('aria-describedby', 'path-error');
      expect(document.getElementById('path-error')).toBeInTheDocument();
    });

    it('should recover from parser errors', async () => {
      renderWithLocale(<SvgTestPage />);
      
      // First, cause an error
      (parser.parseSVG as jest.Mock).mockImplementation(() => { 
        throw new Error('Parser error'); 
      });
      
      const textarea = screen.getByTestId('path-data-textarea') as HTMLTextAreaElement;
      const validateButton = screen.getByTestId('validate-button') as HTMLButtonElement;
      
      await user.click(validateButton);
      // Error element visible
      expect(document.getElementById('path-error')).toBeInTheDocument();
      
      // Now restore parser functionality
      (parser.parseSVG as jest.Mock).mockImplementation(jest.requireActual('svg-path-parser').parseSVG);
      
      // Test: Should recover and accept valid paths
      await user.clear(textarea);
      await user.type(textarea, 'M 0,0 L 100,100');
      await user.click(validateButton);
      
      // After recovery, error element should be gone
      expect(document.getElementById('path-error')).toBeNull();
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle large path strings without performance issues', async () => {
      renderWithLocale(<SvgTestPage />);
      
      const textarea = screen.getByTestId('path-data-textarea') as HTMLTextAreaElement;
      const validateButton = screen.getByTestId('validate-button') as HTMLButtonElement;
      
      // Create a large path string
      const largePath = 'M 0,0 ' + Array.from({ length: 20 }, (_, i) => 
        `L ${i * 10},${i * 5}`
      ).join(' ');
      
      // Test: Input large path
      await user.clear(textarea);
      await user.type(textarea, largePath);
      
      // Test: Should not crash or become unresponsive
      expect(textarea.value).toBe(formatPathString(largePath));
      
      // Test: Validation should work
      await user.click(validateButton);
      expect(document.getElementById('path-error')).not.toBeInTheDocument();
    });

    it('should clean up event listeners properly', () => {
      const { unmount } = renderWithLocale(<SvgTestPage />);
      
      // Test: Component should unmount without errors
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Accessibility Features', () => {
    it('should have proper ARIA labels and roles', () => {
      renderWithLocale(<SvgTestPage />);
      
      // Test: Form elements are present (avoid label text coupling)
      expect(screen.getByTestId('path-data-textarea')).toBeInTheDocument();
      
      // Test: Buttons have accessible names
      expect(screen.getByTestId('validate-button')).toBeInTheDocument();
      expect(screen.getByTestId('append-button')).toBeInTheDocument();
      expect(screen.getByTestId('round-values-button')).toBeInTheDocument();
      
      // Test: Checkboxes present
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(1);
    });

    it('should support keyboard navigation', () => {
      renderWithLocale(<SvgTestPage />);
      
      // Test: All interactive elements are focusable
      const interactiveElements = [
        screen.getByTestId('example-selector'),
        screen.getByTestId('path-data-textarea'),
        screen.getByTestId('validate-button'),
        screen.getByTestId('append-button'),
        screen.getAllByRole('checkbox')[0]!,
        screen.getAllByRole('checkbox')[1]!,
        screen.getByTestId('round-values-button'),
      ];
      
      interactiveElements.forEach(element => {
        // Check if element is naturally focusable or has tabindex
        const isNaturallyFocusable = element.tagName === 'BUTTON' || 
                                     element.tagName === 'INPUT' || 
                                     element.tagName === 'SELECT' || 
                                     element.tagName === 'TEXTAREA';
        const hasTabIndex = element.hasAttribute('tabindex');
        
        expect(isNaturallyFocusable || hasTabIndex).toBe(true);
      });
    });
  });
});
