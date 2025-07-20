/**
 * Overlay Layout Configuration System
 * 
 * This module defines the positioning and styling configuration for all overlay
 * components in the application. It provides a centralized way to manage
 * component positioning, z-index values, and offset distances.
 * 
 * Benefits:
 * - Centralized layout management
 * - Easy repositioning of components
 * - Consistent z-index hierarchy
 * - Type-safe positioning configuration
 */

/**
 * Configuration for a single overlay component's positioning
 */
export interface PositionConfig {
  /** Position on the screen relative to viewport edges */
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  /** Z-index value for layering (higher values appear on top) */
  zIndex: number;
  /** Offset distance from the positioned edge in pixels */
  offset: { x: number; y: number };
}

/**
 * Complete layout configuration for all overlay components
 */
export interface OverlayLayoutConfig {
  /** Development information panel configuration */
  devInfo: PositionConfig;
  /** Animation controller panel configuration */
  animationController: PositionConfig;
  /** Performance indicator panel configuration */
  performanceIndicator: PositionConfig;
  /** Overlay menu configuration */
  overlayMenu: PositionConfig;
}

/**
 * Default layout configuration for all overlay components
 * 
 * This configuration can be easily modified to reposition components
 * without touching component code. Each component's position, z-index,
 * and offset can be adjusted here.
 * 
 * @example
 * ```typescript
 * // Move dev info to bottom-right
 * devInfo: {
 *   position: 'bottom-right',
 *   zIndex: 9999,
 *   offset: { x: 16, y: 16 }
 * }
 * ```
 */
export const OVERLAY_LAYOUT_CONFIG: OverlayLayoutConfig = {
  devInfo: {
    position: 'top-right',
    zIndex: 99999,
    offset: { x: 16, y: 16 }
  },
  animationController: {
    position: 'top-left',
    zIndex: 1000,
    offset: { x: 16, y: 16 }
  },
  performanceIndicator: {
    position: 'top-left',
    zIndex: 1000,
    offset: { x: 16, y: 80 }
  },
  overlayMenu: {
    position: 'top-right',
    zIndex: 99999,
    offset: { x: 16, y: 16 }
  }
} as const;

/**
 * Type representing all available layout positions
 * Used for type-safe access to layout configuration
 */
export type OverlayLayoutPosition = keyof OverlayLayoutConfig; 