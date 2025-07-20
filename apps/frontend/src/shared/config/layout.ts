/**
 * Layout Configuration System
 * 
 * This module provides layout configuration for the application.
 * It exports types and constants used by various components.
 */

// Import from overlay-layout for backward compatibility
import { OVERLAY_LAYOUT_CONFIG, type OverlayLayoutPosition } from './overlay-layout';

// Re-export from overlay-layout for backward compatibility
export * from './overlay-layout';

// Legacy exports for components that still use old naming
export const LAYOUT_CONFIG = OVERLAY_LAYOUT_CONFIG;
export type LayoutPosition = OverlayLayoutPosition; 