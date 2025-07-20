/**
 * Overlay Layout Component
 * 
 * This component provides a reusable wrapper for positioning overlay elements
 * on the screen. It uses the centralized layout configuration to determine
 * positioning, z-index, and offset values.
 * 
 * Benefits:
 * - Reusable positioning logic
 * - Configuration-driven positioning
 * - Consistent overlay behavior
 * - Easy to extend with new positions
 */

'use client';

import { LAYOUT_CONFIG, LayoutPosition } from '@/shared/config/layout';
import { getPositionStyles } from '@/shared/utils/positioning';
import { ReactNode } from 'react';

/**
 * Props for the OverlayLayout component
 */
interface OverlayLayoutProps {
  /** React children to be positioned */
  children: ReactNode;
  /** Layout position key from the configuration */
  position: LayoutPosition;
  /** Additional CSS classes to apply */
  className?: string;
}

/**
 * Reusable overlay layout component for positioning overlay elements
 * 
 * This component wraps any content and positions it according to the
 * centralized layout configuration. It generates the appropriate CSS
 * classes for positioning, z-index, and offset values.
 * 
 * The component is designed to be flexible and can be used for any
 * overlay element that needs consistent positioning behavior.
 * 
 * @param children - Content to be positioned
 * @param position - Layout position key (e.g., 'devInfo', 'animationController')
 * @param className - Additional CSS classes to apply
 * 
 * @example
 * ```typescript
 * <OverlayLayout position="devInfo" className="pointer-events-none">
 *   <DevInfo />
 * </OverlayLayout>
 * ```
 * 
 * @example
 * ```typescript
 * <OverlayLayout position="animationController">
 *   <AnimationController />
 * </OverlayLayout>
 * ```
 */
export function OverlayLayout({ children, position, className = '' }: OverlayLayoutProps) {
  // Get the layout configuration for the specified position
  const config = LAYOUT_CONFIG[position];
  
  // Generate CSS positioning classes based on the configuration
  const positionStyles = getPositionStyles(config);
  
  return (
    <div className={`${positionStyles} ${className}`}>
      {children}
    </div>
  );
} 