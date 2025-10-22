import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { DEFAULT_VIEWBOX, SVG_HEIGHT, SVG_WIDTH } from './components/SvgVisualizer';
import { DEFAULT_EXAMPLE_ID, PATH_EXAMPLES } from './constants/path-examples';
import { SVG_COMMAND_INFO } from './constants/svgPath';

/**
 * Helper function to extract the main drawing command from a path string
 * @param pathData - The SVG path string
 * @returns The main drawing command (e.g., 'Q', 'C', 'L') or null if not found
 */
function getMainDrawingCommand(pathData: string): string | null {
  const commands = pathData?.match(/[A-Z]/g) || [];
  return commands.find(cmd => cmd !== 'M') || commands[0] || null;
}

/**
 * Helper function to get the display name for a command
 * @param command - The SVG command code (e.g., 'Q', 'C')
 * @returns The display name (e.g., 'Quadratic Bézier', 'Cubic Bézier')
 */
function getCommandDisplayName(command: string): string {
  return SVG_COMMAND_INFO[command]?.name || 'Unknown';
}

test.describe('SVG Path Visualizer E2E Tests', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    // Navigate to the SVG test page
    await page.goto('/en/svg-test', { waitUntil: 'domcontentloaded' });

    // Wait for critical elements to exist and be visible
    await page.waitForSelector('[data-testid="svg-canvas"]', { state: 'visible', timeout: 30000 });
    await page.waitForSelector('[data-testid="path-data-textarea"]', { state: 'visible', timeout: 30000 });
    await page.waitForSelector('[data-testid="example-selector"]', { state: 'visible', timeout: 30000 });

    // Small buffer to ensure layout has settled
    await page.waitForTimeout(200);
  });

  test.describe('Page Load and Initial Rendering', () => {
    test('should load the page and display initial SVG path', async ({ page }: { page: Page }) => {
      // Test: Page title is displayed
      await expect(page.getByRole('heading', { name: /svg path visualizer/i })).toBeVisible();
      
      // Test: Initial path is loaded in textarea (using app data)
      const textarea = page.getByTestId('path-data-textarea');
      const defaultExample = PATH_EXAMPLES.find(ex => ex.id === DEFAULT_EXAMPLE_ID);
      expect(defaultExample).toBeDefined();
      
      // Test: Textarea contains the default example path
      const pathValue = await textarea.inputValue();
      expect(pathValue).toBe(defaultExample!.pathData);
      
      // Test: SVG canvas is rendered
      const svg = page.getByTestId('svg-canvas');
      await expect(svg).toBeVisible();
      
      // Test: SVG has correct dimensions
      await expect(svg).toHaveAttribute('width', SVG_WIDTH.toString());
      await expect(svg).toHaveAttribute('height', SVG_HEIGHT.toString());
      await expect(svg).toHaveAttribute('viewBox', DEFAULT_VIEWBOX);
      
      // Test: SVG path element is rendered with correct data
      const pathElement = svg.locator('path');
      await expect(pathElement).toBeVisible();
      
      // Test: Path data matches the expected default path (dynamic from app data)
      if (defaultExample) {
        await expect(pathElement).toHaveAttribute('d', defaultExample.pathData);
      }
    });

    test('should display path breakdown information', async ({ page }: { page: Page }) => {
      // Get the default example data
      const defaultExample = PATH_EXAMPLES.find(ex => ex.id === DEFAULT_EXAMPLE_ID);
      expect(defaultExample).toBeDefined();
      
      // Test: Command types are displayed (dynamic based on default example)
      const mainCommand = getMainDrawingCommand(defaultExample?.pathData || '');
      const expectedMethodText = mainCommand ? getCommandDisplayName(mainCommand) : 'Unknown';
      
      // Look specifically for the path breakdown text, not dropdown options
      await expect(page.getByText(expectedMethodText, { exact: true })).toBeVisible();
      await expect(page.getByText('Move To', { exact: true })).toBeVisible();
      
      // Test: Coordinates are displayed (dynamic based on default example)
      // Look for parameter values like "x: 100", "y: 200" in the path breakdown
      const parameterElements = page.getByTestId('path-parameter');
      const expectedCount = defaultExample?.points ? defaultExample.points.length * 2 : 0;
      await expect(parameterElements).toHaveCount(expectedCount); // Each point has x and y
      
      // Test: Path breakdown section exists
      await expect(page.getByText(/svg path breakdown/i)).toBeVisible();
    });
  });

  test.describe('Example Selection and Path Changes', () => {
    test('should allow selecting different example paths', async ({ page }: { page: Page }) => {
      const select = page.getByTestId('example-selector');
      const textarea = page.getByTestId('path-data-textarea');
      
      // Get initial path for comparison
      const initialPath = await textarea.inputValue();
      
      // Test: Select the next example in the list (after the default)
      const defaultIndex = PATH_EXAMPLES.findIndex(ex => ex.id === DEFAULT_EXAMPLE_ID);
      const nextExample = PATH_EXAMPLES[defaultIndex + 1];
      expect(nextExample).toBeDefined();
      await select.selectOption(nextExample!.id);
      
      // Test: Path changed (without checking exact new value)
      const newPath = await textarea.inputValue();
      expect(newPath).not.toBe(initialPath);
      
      // Test: New path is valid SVG
      expect(newPath).toMatch(/^M\s+\d+,\d+/);
      
      if (nextExample) {
        const mainCommand = getMainDrawingCommand(nextExample.pathData);

        // Test: New path contains the expected command from the selected example
        if (mainCommand) {
          expect(newPath).toContain(mainCommand);
        }
      
        // Test: SVG updates with new path
        const svg = page.getByTestId('svg-canvas');
        await expect(svg).toBeVisible();
        
        // Test: Path breakdown updates (dynamic based on app data)
        const expectedText = mainCommand ? getCommandDisplayName(mainCommand) : 'Unknown';
        
        // Look specifically for the path breakdown text, not dropdown options
        await expect(page.getByText(expectedText, { exact: true })).toBeVisible();
      }
    });

    test('should maintain SVG rendering when switching examples', async ({ page }: { page: Page }) => {
      const select = page.getByTestId('example-selector');
      const svg = page.getByTestId('svg-canvas');
      
      // Test: Switch through multiple examples using app data
      // Get the first 3 examples from the list (including default)
      const testExamples = PATH_EXAMPLES.slice(0, 3).map(ex => ex.id);
      
      for (const exampleId of testExamples) {
        await select.selectOption(exampleId);
        
        // Wait for the select value to change
        await expect(async () => {
          const selectedValue = await select.inputValue();
          expect(selectedValue).toBe(exampleId);
        }).toPass({ timeout: 10000 });
        
        // Verify SVG remains visible and functional
        await expect(svg).toBeVisible();
        await expect(svg).toHaveAttribute('width', SVG_WIDTH.toString());
        await expect(svg).toHaveAttribute('height', SVG_HEIGHT.toString());
        
        // Verify the correct example is selected
        const selectedValue = await select.inputValue();
        expect(selectedValue).toBe(exampleId);
        
        // Verify path breakdown shows correct method
        const exampleData = PATH_EXAMPLES.find(ex => ex.id === exampleId);
        if (exampleData) {
          // Wait for path breakdown to update with specific text
          const mainCommand = getMainDrawingCommand(exampleData.pathData);
          const expectedText = mainCommand ? getCommandDisplayName(mainCommand) : 'Unknown';
          
          // Wait for the specific text to appear in the breakdown section
          await expect(async () => {
            // Look for the text in the SVG Path Breakdown section specifically
            const breakdownHeading = page.getByText('SVG Path Breakdown');
            await expect(breakdownHeading).toBeVisible();
            
            // Check if the expected text appears anywhere in the breakdown area
            const textElement = page.getByText(expectedText, { exact: true });
            await expect(textElement).toBeVisible();
          }).toPass({ timeout: 10000 });
          
          await expect(page.getByText(expectedText, { exact: true })).toBeVisible();
        }
      }
    });
  });

  test.describe('User Input and Validation', () => {
    test('should accept and validate custom SVG paths', async ({ page }: { page: Page }) => {
      const textarea = page.getByTestId('path-data-textarea');
      const validateButton = page.getByTestId('validate-button');
      
      // Get initial path for comparison
      const initialPath = await textarea.inputValue();
      
      // Test: Input custom path
      const customPath = 'M 0,0 L 100,100 Z';
      await textarea.fill(customPath);
      await validateButton.click();
      
      // Test: Path is accepted and updated
      const newPath = await textarea.inputValue();
      expect(newPath).toBe(customPath);
      expect(newPath).not.toBe(initialPath);
      
      // Test: Path is valid SVG format
      expect(newPath).toMatch(/^M\s+\d+,\d+/);
      expect(newPath).toContain('L');
      expect(newPath).toContain('Z');
      
      // Test: SVG updates with new path
      const svg = page.getByTestId('svg-canvas');
      await expect(svg).toBeVisible();
    });

    test('should handle invalid SVG paths gracefully', async ({ page }: { page: Page }) => {
      const textarea = page.getByTestId('path-data-textarea');
      const validateButton = page.getByTestId('validate-button');
      const initialPath = await textarea.inputValue();
      
      // Test: Input invalid path
      await textarea.fill('invalid path');
      await validateButton.click();
      
      // Test: Error message is displayed
      await expect(page.getByText(/invalid path data/i)).toBeVisible();
      
      // Test: Component handles invalid input appropriately
      const currentValue = await textarea.inputValue();
      
      // The component should either clear the input, keep the invalid text, or revert to the last valid value
      const isValidBehavior = currentValue === '' || 
                              currentValue === 'invalid path' || 
                              currentValue === initialPath;
      
      expect(isValidBehavior).toBe(true);
      
      // Test: The component should still be functional after invalid input
      await expect(textarea).toBeVisible();
      await expect(validateButton).toBeVisible();
      await expect(validateButton).toBeEnabled();
    });

    test('should prevent empty paths from being validated', async ({ page }: { page: Page }) => {
      const textarea = page.getByTestId('path-data-textarea');
      const validateButton = page.getByTestId('validate-button');
      
      // Test: Clear textarea
      await textarea.clear();
      
      // Test: Click validate button
      await validateButton.click();
      
      // Test: Specific error message for empty path
      await expect(page.getByText(/path cannot be empty/i)).toBeVisible();
    });
  });

  test.describe('Visual Controls and Toggles', () => {
    test('should toggle grid visibility', async ({ page }: { page: Page }) => {
      const gridToggle = page.getByTitle(/hide grid/i);
      
      // Test: Grid toggle button is visible and functional
      await expect(gridToggle).toBeVisible();
      await expect(gridToggle).toBeEnabled();
      
      // Test: Grid is initially visible
      await expect(page.getByTitle(/hide grid/i)).toBeVisible();
      
      // Test: Click to hide grid
      await gridToggle.click();
      
      // Wait for the toggle state to change
      await expect(async () => {
        const toggleButton = page.getByTitle(/show grid/i);
        await expect(toggleButton).toBeVisible();
        // Test that the button title changed
        await expect(toggleButton).toHaveAttribute('title', /show grid/i);
      }).toPass({ timeout: 5000 });
      
      // Test: Grid group should be hidden (check for DOM presence)
      const svg = page.getByTestId('svg-canvas');
      const gridGroup = svg.locator('g.grid');
      await expect(gridGroup).toHaveCount(0);
      
      // Test: Click to show grid again
      await page.getByTitle(/show grid/i).click();
      
      // Wait for the toggle state to change back
      await expect(async () => {
        const toggleButton = page.getByTitle(/hide grid/i);
        await expect(toggleButton).toBeVisible();
        // Test that the button title changed back
        await expect(toggleButton).toHaveAttribute('title', /hide grid/i);
      }).toPass({ timeout: 5000 });
      
      // Test: Grid group should be visible again
      await expect(gridGroup).toHaveCount(1);
    });

    test('should toggle labels visibility', async ({ page }: { page: Page }) => {
      const labelsToggle = page.getByTitle(/hide labels/i);
      const svg = page.getByTestId('svg-canvas');
      
      // Ensure we have a path with labels (use default quadratic path)
      const select = page.getByTestId('example-selector');
      await select.selectOption(DEFAULT_EXAMPLE_ID);
      
      // Wait for command labels to be rendered
      await expect(async () => {
        const commandLabels = svg.locator('text.SVGTestPage__CmdLetter');
        const labelCount = await commandLabels.count();
        expect(labelCount).toBeGreaterThan(0);
      }).toPass({ timeout: 5000 });
      
      // Test: Labels toggle button is visible and functional
      await expect(labelsToggle).toBeVisible();
      await expect(labelsToggle).toBeEnabled();
      
      // Test: Labels are initially visible
      await expect(page.getByTitle(/hide labels/i)).toBeVisible();
      
      // Test: Click to hide labels
      await labelsToggle.click();
      
      // Wait for the toggle state to change
      await expect(async () => {
        const toggleButton = page.getByTitle(/show labels/i);
        await expect(toggleButton).toBeVisible();
        await expect(toggleButton).toHaveAttribute('title', /show labels/i);
      }).toPass({ timeout: 5000 });
      
      // Test: Command overlay labels should be hidden
      const commandLabels = svg.locator('text.SVGTestPage__CmdLetter'); // Command overlay labels
      await expect(commandLabels).toHaveCount(0);
      
      // Test: Click to show labels again
      await page.getByTitle(/show labels/i).click();
      
      // Wait for the toggle state to change back
      await expect(async () => {
        const toggleButton = page.getByTitle(/hide labels/i);
        await expect(toggleButton).toBeVisible();
        await expect(toggleButton).toHaveAttribute('title', /hide labels/i);
      }).toPass({ timeout: 5000 });
      
      // Test: Command overlay labels should be visible again
      await expect(async () => {
        const commandLabelCount = await commandLabels.count();
        expect(commandLabelCount).toBeGreaterThan(0);
      }).toPass({ timeout: 5000 });
    });

    test('should toggle points visibility', async ({ page }: { page: Page }) => {
      const pointsToggle = page.getByTitle(/hide points/i);
      const svg = page.getByTestId('svg-canvas');
      
      // Ensure we have a path with points (use default quadratic path)
      const select = page.getByTestId('example-selector');
      await select.selectOption(DEFAULT_EXAMPLE_ID);
      
      // Wait for draggable points to be rendered
      await expect(async () => {
        const points = svg.locator('circle[data-point-id]');
        const pointCount = await points.count();
        expect(pointCount).toBeGreaterThan(0);
      }).toPass({ timeout: 5000 });
      
      // Test: Points toggle button is visible and functional
      await expect(pointsToggle).toBeVisible();
      await expect(pointsToggle).toBeEnabled();
      
      // Test: Points are initially visible
      await expect(page.getByTitle(/hide points/i)).toBeVisible();
      
      // Test: Click to hide points
      await pointsToggle.click();
      
      // Wait for the toggle state to change
      await expect(async () => {
        const toggleButton = page.getByTitle(/show points/i);
        await expect(toggleButton).toBeVisible();
        await expect(toggleButton).toHaveAttribute('title', /show points/i);
      }).toPass({ timeout: 5000 });
      
      // Test: Points should be hidden
      const points = svg.locator('circle[data-point-id]');
      await expect(points).toHaveCount(0);
      
      // Test: Click to show points again
      await page.getByTitle(/show points/i).click();
      
      // Wait for the toggle state to change back
      await expect(async () => {
        const toggleButton = page.getByTitle(/hide points/i);
        await expect(toggleButton).toBeVisible();
        await expect(toggleButton).toHaveAttribute('title', /hide points/i);
      }).toPass({ timeout: 5000 });
      
      // Test: Points should be visible again
      await expect(async () => {
        const pointCount = await points.count();
        expect(pointCount).toBeGreaterThan(0);
      }).toPass({ timeout: 5000 });
    });

    test('should toggle path fill', async ({ page }: { page: Page }) => {
      const fillToggle = page.getByTitle(/show fill/i);
      
      // Test: Fill toggle button is visible and functional
      await expect(fillToggle).toBeVisible();
      await expect(fillToggle).toBeEnabled();
      
      // Test: Fill is initially hidden
      await expect(page.getByTitle(/show fill/i)).toBeVisible();
      
      // Test: Click to show fill
      await fillToggle.click();
      
      // Wait for the toggle state to change
      await expect(async () => {
        const toggleButton = page.getByTitle(/hide fill/i);
        await expect(toggleButton).toBeVisible();
        await expect(toggleButton).toHaveAttribute('title', /hide fill/i);
      }).toPass({ timeout: 5000 });
      
      // Test: Path should have fill
      const svg = page.getByTestId('svg-canvas');
      const pathElement = svg.locator('path');
      await expect(pathElement).toHaveAttribute('fill', /^(?!none$).*/); // Fill should not be 'none'
      
      // Test: Click to hide fill again
      await page.getByTitle(/hide fill/i).click();
      
      // Wait for the toggle state to change back
      await expect(async () => {
        const toggleButton = page.getByTitle(/show fill/i);
        await expect(toggleButton).toBeVisible();
        await expect(toggleButton).toHaveAttribute('title', /show fill/i);
      }).toPass({ timeout: 5000 });
      
      // Test: Path should not have fill
      await expect(pathElement).toHaveAttribute('fill', 'none');
    });
  });

  test.describe('Path Manipulation', () => {
    test('should append new path segments', async ({ page }: { page: Page }) => {
      const textarea = page.getByTestId('path-data-textarea');
      const appendButton = page.getByTestId('append-button');
      const segmentTypeSelect = page.getByTestId('segment-type-select');
      
      // Test: Initial path
      const initialPath = await textarea.inputValue();
      expect(initialPath).toBeTruthy();
      
      // Test: Select segment type
      await segmentTypeSelect.selectOption('L');
      
      // Wait for the select value to change
      await expect(async () => {
        const selectedValue = await segmentTypeSelect.inputValue();
        expect(selectedValue).toBe('L');
      }).toPass({ timeout: 5000 });
      
      // Test: Append new segment
      await appendButton.scrollIntoViewIfNeeded();
      await appendButton.click();
      
      // Wait for the path to be updated
      await expect(async () => {
        const newPath = await textarea.inputValue();
        expect(newPath).toContain(' L ');
        expect(newPath.length).toBeGreaterThan(initialPath.length);
      }).toPass({ timeout: 5000 });
      
      // Test: Path is valid SVG format
      const newPath = await textarea.inputValue();
      expect(newPath).toMatch(/^M\s+\d+,\d+/);
      expect(newPath).toContain(' L ');
    });

    test('should round path values', async ({ page }: { page: Page }) => {
      const textarea = page.getByTestId('path-data-textarea');
      const roundButton = page.getByTestId('round-values-button');
      
      // Test: Set a custom path with decimal values to test rounding
      const pathWithDecimals = 'M 100.123,200.456 Q 250.789,100.234 300.567,200.891';
      await textarea.fill(pathWithDecimals);
      
      // Test: Click round button
      await roundButton.scrollIntoViewIfNeeded();
      await roundButton.click();
      
      // Wait for the path to be processed
      await expect(async () => {
        const roundedPath = await textarea.inputValue();
        
        // The path should still be valid after rounding
        expect(roundedPath).toBeTruthy();
        expect(roundedPath).toMatch(/^M\s+\d+[,\s]\d+/);
        
        // Check that decimal values were actually rounded
        // Original: 100.123,200.456,250.789,100.234,300.567,200.891
        // Expected: 100,200,251,100,301,201 (rounded to nearest integer)
        expect(roundedPath).toContain('100,200'); // Move command rounded
        expect(roundedPath).toContain('251,100'); // Control point 1 rounded
        expect(roundedPath).toContain('301,201'); // End point rounded
        
        // Verify no original decimal values remain
        expect(roundedPath).not.toContain('100.123');
        expect(roundedPath).not.toContain('200.456');
        expect(roundedPath).not.toContain('250.789');
        expect(roundedPath).not.toContain('100.234');
        expect(roundedPath).not.toContain('300.567');
        expect(roundedPath).not.toContain('200.891');
      }).toPass({ timeout: 5000 });
      
      // Test: Path is still valid SVG format
      const roundedPath = await textarea.inputValue();
      expect(roundedPath).toMatch(/^M\s+\d+[,\s]\d+/);
    });

    test('should change segment type for appending', async ({ page }: { page: Page }) => {
      const segmentTypeSelect = page.getByTestId('segment-type-select');
      
      // Test: Initial segment type
      const initialType = await segmentTypeSelect.inputValue();
      expect(initialType).toBeTruthy();
      
      // Test: Change to different segment type (choose one that's different from initial)
      const targetType = initialType === 'Q' ? 'L' : 'Q';
      await segmentTypeSelect.selectOption(targetType);
      
      // Wait for the select value to change with retry logic
      await expect(async () => {
        const newType = await segmentTypeSelect.inputValue();
        expect(newType).toBe(targetType);
        expect(newType).not.toBe(initialType);
      }).toPass({ timeout: 5000 });
      
      // Test: Change to another segment type
      const finalType = 'C';
      await segmentTypeSelect.selectOption(finalType);
      
      // Wait for the select value to change again with retry logic
      await expect(async () => {
        const finalValue = await segmentTypeSelect.inputValue();
        expect(finalValue).toBe(finalType);
        expect(finalValue).not.toBe(initialType);
        expect(finalValue).not.toBe(targetType);
      }).toPass({ timeout: 5000 });
    });
  });

  test.describe('SVG Grid and Rulers', () => {
    test('should display grid lines and rulers', async ({ page }: { page: Page }) => {
      const svg = page.getByTestId('svg-canvas');
      
      // Verify grid is visible and contains lines
      const gridToggle = page.getByTitle(/hide grid/i);
      await expect(gridToggle).toBeVisible();
      await expect(gridToggle).toHaveAttribute('title', /hide grid/i);
      
      const gridGroup = svg.locator('g.grid');
      await expect(gridGroup).toHaveCount(1);
      
      const gridLines = gridGroup.locator('line');
      const gridLineCount = await gridLines.count();
      expect(gridLineCount).toBeGreaterThan(0);
      
      // Verify rulers are visible and contain coordinate text
      const rulerGroup = svg.locator('g.rulers');
      await expect(rulerGroup).toHaveCount(1);
      
      const rulerTexts = rulerGroup.locator('text');
      const rulerTextCount = await rulerTexts.count();
      expect(rulerTextCount).toBeGreaterThan(0);
      
      // Verify ruler texts contain numeric coordinates
      const firstRulerText = rulerTexts.first();
      await expect(firstRulerText).toBeVisible();
      const textContent = await firstRulerText.textContent();
      expect(textContent).toMatch(/^-?\d+$/);
    });

    test('should handle grid panning', async ({ page }: { page: Page }) => {
      const svg = page.getByTestId('svg-canvas');
      
      // Verify initial state
      await expect(svg).toHaveAttribute('viewBox', DEFAULT_VIEWBOX);
      
      // Get initial ruler text to compare after panning
      const rulerGroup = svg.locator('g.rulers');
      const initialRulerTexts = await rulerGroup.locator('text').allTextContents();
      
      // Perform panning action
      const box = await svg.boundingBox();
      expect(box).toBeTruthy();
      
      const centerX = box!.x + box!.width / 2;
      const centerY = box!.y + box!.height / 2;
      
      await page.mouse.move(centerX, centerY);
      await page.mouse.down();
      await page.mouse.move(centerX - 100, centerY - 50);
      await page.mouse.up();
      
      // Verify panning worked (viewBox changed)
      await expect(async () => {
        const currentViewBox = await svg.getAttribute('viewBox');
        expect(currentViewBox).not.toBe(DEFAULT_VIEWBOX);
        expect(currentViewBox).toBeTruthy();
      }).toPass({ timeout: 5000 });
      
      // Verify grid and rulers are still visible after panning
      const gridGroup = svg.locator('g.grid');
      await expect(gridGroup).toHaveCount(1);
      
      await expect(rulerGroup).toHaveCount(1);
      const rulerTexts = rulerGroup.locator('text');
      const rulerTextCount = await rulerTexts.count();
      expect(rulerTextCount).toBeGreaterThan(0);
      
      // Verify ruler coordinates have changed (indicating panning worked)
      const finalRulerTexts = await rulerTexts.allTextContents();
      expect(finalRulerTexts).not.toEqual(initialRulerTexts);
    });

    test('should reset pan position', async ({ page }: { page: Page }) => {
      const svg = page.getByTestId('svg-canvas');
      const resetButton = page.getByTitle(/reset pan/i);
      
      // Get initial ruler coordinates to compare after reset
      const rulerGroup = svg.locator('g.rulers');
      const initialRulerTexts = await rulerGroup.locator('text').allTextContents();
      
      // Pan the view to change position
      const box = await svg.boundingBox();
      expect(box).toBeTruthy();
      
      await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
      await page.mouse.down();
      await page.mouse.move(box!.x + box!.width / 2 - 100, box!.y + box!.height / 2 - 50);
      await page.mouse.up();
      
      // Wait for panning to complete
      await expect(async () => {
        const currentViewBox = await svg.getAttribute('viewBox');
        expect(currentViewBox).not.toBe(DEFAULT_VIEWBOX);
      }).toPass({ timeout: 5000 });
      
      // Click reset button
      await resetButton.click();
      
      // Verify reset worked (viewBox and rulers return to original state)
      await expect(svg).toHaveAttribute('viewBox', DEFAULT_VIEWBOX);
      
      const finalRulerTexts = await rulerGroup.locator('text').allTextContents();
      expect(finalRulerTexts).toEqual(initialRulerTexts);
    });
  });

  test.describe('Accessibility and Keyboard Navigation', () => {
    test('should support keyboard navigation', async ({ page }: { page: Page }) => {
      // Test: Tab through interactive elements
      await page.keyboard.press('Tab');
      
      // Test: Focus moves to first interactive element
      const firstFocused = page.locator(':focus');
      await expect(firstFocused).toBeVisible();
      
      // Test: Tab order works
      await page.keyboard.press('Tab');
      const secondFocused = page.locator(':focus');
      await expect(secondFocused).toBeVisible();
      await expect(secondFocused).not.toBe(firstFocused);
    });

    test('should have proper ARIA labels', async ({ page }: { page: Page }) => {
      // Test: Form elements have labels
      await expect(page.getByLabel(/svg path data/i)).toBeVisible();
      await expect(page.getByLabel(/select method/i)).toBeVisible();
      
      // Test: Buttons have accessible names
      await expect(page.getByTestId('validate-button')).toBeVisible();
      await expect(page.getByTestId('append-button')).toBeVisible();
      
      // Test: SVG has accessible name
      await expect(page.getByTestId('svg-canvas')).toHaveAttribute('aria-label', 'SVG Canvas');
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt to mobile viewport', async ({ page }: { page: Page }) => {
      // Test: Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Test: Page remains functional
      await expect(page.getByRole('heading', { name: /svg path visualizer/i })).toBeVisible();
      await expect(page.getByTestId('svg-canvas')).toBeVisible();
      await expect(page.getByTestId('path-data-textarea')).toBeVisible();
      
      // Test: Controls remain accessible
      await expect(page.getByTestId('validate-button')).toBeVisible();
      await expect(page.getByTestId('append-button')).toBeVisible();
    });

    test('should maintain functionality on tablet viewport', async ({ page }: { page: Page }) => {
      // Test: Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Test: Page remains functional
      await expect(page.getByTestId('svg-canvas')).toBeVisible();
      await expect(page.getByTestId('path-data-textarea')).toBeVisible();
      
      // Test: Grid controls work
      await page.getByTitle(/hide grid/i).click();
      await expect(page.getByTitle(/show grid/i)).toBeVisible();
    });
  });

  test.describe('Performance and Stability', () => {
    test.slow();
    test('should handle rapid user interactions within performance limits', async ({ page }: { page: Page }) => {
      const select = page.getByTestId('example-selector');
      const svg = page.getByTestId('svg-canvas');
      
      // Test: Rapid example switching with performance measurement
      const defaultIndex = PATH_EXAMPLES.findIndex(ex => ex.id === DEFAULT_EXAMPLE_ID);
      const nextExample = PATH_EXAMPLES[defaultIndex + 1];
      expect(nextExample).toBeDefined();
      
      const startTime = Date.now();
      
      // Perform rapid interactions
      for (let i = 0; i < 10; i++) {
        await select.selectOption(nextExample!.id);
        await select.selectOption(DEFAULT_EXAMPLE_ID);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Performance assertion: Allow up to 10 seconds in CI/dev environments
      expect(duration).toBeLessThan(10000);
      
      // Verify final state is correct
      await expect(svg).toBeVisible();
      await expect(svg).toHaveAttribute('width', SVG_WIDTH.toString());
      await expect(svg).toHaveAttribute('height', SVG_HEIGHT.toString());
    });

    test('should handle large SVG paths without performance degradation', async ({ page }: { page: Page }) => {
      const textarea = page.getByTestId('path-data-textarea');
      const validateButton = page.getByTestId('validate-button');
      const svg = page.getByTestId('svg-canvas');
      
      // Create a large path with many line segments (each L command creates draggable end points)
      const largePath = 'M 0,0 ' + Array.from({ length: 200 }, (_, i) => 
        `L ${i * 2},${i * 1}`
      ).join(' ');
      
      // Measure path processing performance
      const startTime = Date.now();
      await textarea.fill(largePath);
      await validateButton.click();
      const endTime = Date.now();
      
      // Performance assertion: Allow up to 10 seconds for large inputs in CI/dev
      expect(endTime - startTime).toBeLessThan(10000);
      
      // Verify it still works
      await expect(textarea).toHaveValue(largePath);
      await expect(svg).toBeVisible();
      
      // Verify no error messages
      await expect(page.getByText(/invalid path data/i)).not.toBeVisible();
      
      // Test panning performance with large path
      const panStartTime = Date.now();
      const box = await svg.boundingBox();
      expect(box).toBeTruthy();
      
      await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
      await page.mouse.down();
      await page.mouse.move(box!.x + box!.width / 2 - 200, box!.y + box!.height / 2 - 100);
      await page.mouse.up();
      
      // Wait for panning to complete
      await expect(async () => {
        const currentViewBox = await svg.getAttribute('viewBox');
        expect(currentViewBox).not.toBe(DEFAULT_VIEWBOX);
      }).toPass({ timeout: 5000 });
      
      const panEndTime = Date.now();
      const panDuration = panEndTime - panStartTime;
      
      // Panning should be responsive even with large paths (allow up to 5s)
      expect(panDuration).toBeLessThan(5000);
      
      // Test point dragging performance - wait for points to be rendered (they might take time with large paths)
      const points = svg.locator('circle[data-point-id]');
      
      await expect(async () => {
        const pointCount = await points.count();
        expect(pointCount).toBeGreaterThan(0);
      }).toPass({ timeout: 10000 }); // Give more time for large path processing
      
      const dragStartTime = Date.now();
      const firstPoint = points.first();
      
      // Get point position and drag it
      const pointBox = await firstPoint.boundingBox();
      expect(pointBox).toBeTruthy();
      
      await page.mouse.move(pointBox!.x + pointBox!.width / 2, pointBox!.y + pointBox!.height / 2);
      await page.mouse.down();
      await page.mouse.move(pointBox!.x + pointBox!.width / 2 + 50, pointBox!.y + pointBox!.height / 2 + 50);
      await page.mouse.up();
      
      const dragEndTime = Date.now();
      const dragDuration = dragEndTime - dragStartTime;
      
      // Point dragging should be responsive even with large paths (allow up to 5s)
      expect(dragDuration).toBeLessThan(5000);
      
      // Verify the path was updated after dragging (with more flexible timing for large paths)
      await expect(async () => {
        const updatedPath = await textarea.inputValue();
        expect(updatedPath).toBeTruthy();
        expect(updatedPath).not.toBe(largePath); // Should have changed after drag
      }).toPass({ timeout: 10000 });
      
      // Verify SVG remains stable after all operations
      await expect(svg).toBeVisible();
      await expect(svg).toHaveAttribute('width', SVG_WIDTH.toString());
      await expect(svg).toHaveAttribute('height', SVG_HEIGHT.toString());
    });

    test('should maintain stable state during extended use', async ({ page }: { page: Page }) => {
      const select = page.getByTestId('example-selector');
      const svg = page.getByTestId('svg-canvas');
      
      // Extended interaction session
      for (let i = 0; i < 20; i++) {
        const randomExample = PATH_EXAMPLES[i % PATH_EXAMPLES.length];
        expect(randomExample).toBeDefined();
        await select.selectOption(randomExample!.id);
        
        // Verify SVG remains stable
        await expect(svg).toBeVisible();
        await expect(svg).toHaveAttribute('width', SVG_WIDTH.toString());
        await expect(svg).toHaveAttribute('height', SVG_HEIGHT.toString());
      }
      
      // Verify final state is consistent
      await expect(select).toBeVisible();
      await expect(svg).toBeVisible();
    });

    test('should recover gracefully from invalid inputs', async ({ page }: { page: Page }) => {
      const textarea = page.getByTestId('path-data-textarea');
      const validateButton = page.getByTestId('validate-button');
      const svg = page.getByTestId('svg-canvas');
      
      // Test various invalid inputs
      const invalidInputs = [
        'invalid path',
        'M 100,200 Q',
        'M 100,200 Q 200,100',
        'M 100,200 Q 200,100 300,200 Z Z', // Duplicate close
        'M 100,200 Q 200,100 300,200 L', // Incomplete command
      ];
      
      for (const invalidInput of invalidInputs) {
        await textarea.fill(invalidInput);
        await validateButton.click();
        
        // Should not crash or break the UI
        await expect(svg).toBeVisible();
        await expect(page.getByTestId('example-selector')).toBeVisible();
        await expect(page.getByTestId('validate-button')).toBeVisible();
        
        // Should be able to recover by entering valid path
        const validPath = 'M 100,200 L 300,400';
        await textarea.fill(validPath);
        await validateButton.click();
        await expect(textarea).toHaveValue(validPath);
      }
    });
  });
});
