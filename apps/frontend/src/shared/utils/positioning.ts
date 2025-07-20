/**
 * Positioning Utilities
 * 
 * This module provides utility functions for generating CSS positioning classes
 * based on layout configuration. It converts configuration objects into
 * Tailwind CSS classes for consistent positioning across the application.
 * 
 * Benefits:
 * - Consistent positioning logic
 * - Type-safe positioning generation
 * - Centralized CSS class generation
 * - Easy to extend with new positions
 */

import { PositionConfig } from '@/shared/config/layout';

/**
 * Generates CSS positioning classes for overlay components
 * 
 * This function takes a position configuration and generates the appropriate
 * Tailwind CSS classes for absolute positioning, including z-index and
 * offset distances.
 * 
 * @param config - Position configuration object
 * @returns CSS classes string for positioning
 * 
 * @example
 * ```typescript
 * const config = { position: 'top-right', zIndex: 9999, offset: { x: 16, y: 16 } };
 * const classes = getPositionStyles(config);
 * // Returns: "absolute top-16 right-16 z-[9999]"
 * ```
 */
export function getPositionStyles(config: PositionConfig): string {
  const { position, zIndex, offset } = config;
  
  // Map position configurations to Tailwind CSS classes
  const positionClasses: Record<PositionConfig['position'], string> = {
    'top-left': `top-${offset.y} left-${offset.x}`,
    'top-right': `top-${offset.y} right-${offset.x}`,
    'bottom-left': `bottom-${offset.y} left-${offset.x}`,
    'bottom-right': `bottom-${offset.y} right-${offset.x}`,
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  };

  return `absolute ${positionClasses[position]} z-[${zIndex}]`;
}

/**
 * Generates CSS positioning classes for dropdown panels
 * 
 * This function generates positioning for dropdown panels that appear
 * relative to their parent toggle buttons. It uses fixed offsets that
 * work well for most UI patterns.
 * 
 * @param config - Position configuration object (only position is used)
 * @returns CSS classes string for panel positioning
 * 
 * @example
 * ```typescript
 * const config = { position: 'top-right', zIndex: 9999, offset: { x: 16, y: 16 } };
 * const classes = getPanelPositionStyles(config);
 * // Returns: "absolute top-12 right-0"
 * ```
 */
export function getPanelPositionStyles(config: PositionConfig): string {
  const { position } = config;
  
  // Map positions to panel-specific positioning classes
  // Panels typically appear below or to the side of their toggle buttons
  const panelPositions: Record<PositionConfig['position'], string> = {
    'top-left': `top-12 left-0`,
    'top-right': `top-12 right-0`,
    'bottom-left': `bottom-12 left-0`,
    'bottom-right': `bottom-12 right-0`,
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  };

  return `absolute ${panelPositions[position]}`;
} 