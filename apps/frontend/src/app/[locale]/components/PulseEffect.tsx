'use client';

/**
 * @file Pulse Effect Component
 * 
 * A highly reusable React component that renders a "luminous pulse" or "wave" effect.
 * Supports both expanding and shrinking animations with configurable properties.
 * Each instance is self-contained and cleans itself up after completion.
 */

import { useEffect, useRef, useState } from 'react';

// Type definitions for configuration
export type Direction = 'expand' | 'shrink';
export type EasingFunction = 'linear' | 'ease-in-out' | 'ease-out' | 'ease-in';

export interface PulseEffectProps {
  // Position (required)
  x: number; // X position in pixels
  y: number; // Y position in pixels
  
  // Animation configuration
  direction: Direction; // 'expand' or 'shrink'
  duration: number; // Animation duration in milliseconds
  
  // Ring appearance
  ringColor: string; // CSS color value (e.g., 'rgba(255, 255, 255, 1)')
  maxRadius: number; // Maximum radius in pixels (outer edge)
  outerBlur: number; // Blur radius for outer edge shadow in pixels
  outerSpread: number; // Spread radius for outer edge shadow in pixels
  innerBlur: number; // Blur radius for inner edge shadow in pixels
  innerSpread: number; // Spread radius for inner edge shadow in pixels
  
  // Opacity control with three phases
  initialOpacity?: number; // Starting opacity (0 to 1, default: 1)
  animationOpacity?: number; // Active animation opacity (0 to 1, default: 1)
  finalOpacity?: number; // Ending opacity (0 to 1, default: 0)
  
  // Component fade control
  fadeInDuration?: number; // Fade-in duration in milliseconds (default: 0)
  fadeInToAnimationDuration?: number; // Transition from fade-in to animation opacity in milliseconds (default: 0)
  fadeOutDuration?: number; // Fade-out duration in milliseconds (default: 0)
  
  // Easing (optional, default: 'linear')
  easing?: EasingFunction;
  
  // Lifecycle callback
  onComplete?: () => void; // Called when animation completes
  
  // Test ID for testing
  'data-testid'?: string;
}

// Easing functions
const easings = {
  linear: (t: number): number => t,
  'ease-in-out': (t: number): number => t * t * (3 - 2 * t),
  'ease-out': (t: number): number => 1 - (1 - t) * (1 - t),
  'ease-in': (t: number): number => t * t,
};

/**
 * Interpolates value based on current time and easing function
 */
const ease = (t: number, easingFn: EasingFunction): number => {
  const easeFunction = easings[easingFn];
  return easeFunction(t);
};

/**
 * Converts a CSS color string with alpha to a new alpha value
 * Handles both rgb/rgba and hex colors
 */
const setColorAlpha = (color: string, alpha: number): string => {
  // Handle rgba() colors
  if (color.startsWith('rgba(') || color.startsWith('rgb(')) {
    return color.replace(/rgba?\(([^)]+)\)/, (_, content) => {
      const components = content.split(',').map((c: string) => c.trim());
      if (components.length === 3) {
        // rgb() format, convert to rgba
        return `rgba(${components[0]}, ${components[1]}, ${components[2]}, ${alpha})`;
      } else if (components.length === 4) {
        // rgba() format, replace last component with new alpha
        return `rgba(${components[0]}, ${components[1]}, ${components[2]}, ${alpha})`;
      }
      return color;
    });
  }
  
  // For other formats, return as-is (fallback)
  return color;
};

export default function PulseEffect({
  x,
  y,
  direction,
  duration,
  ringColor,
  maxRadius,
  outerBlur,
  outerSpread,
  innerBlur,
  innerSpread,
  initialOpacity = 1,
  animationOpacity = 1,
  finalOpacity = 0,
  fadeInDuration = 0,
  fadeInToAnimationDuration = 0,
  fadeOutDuration = 0,
  easing = 'linear',
  onComplete,
  'data-testid': testId,
}: PulseEffectProps) {
  const ringRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);
  const [componentOpacity, setComponentOpacity] = useState(0);
  
  useEffect(() => {
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const totalDuration = fadeInDuration + fadeInToAnimationDuration + duration + fadeOutDuration;
      
      // Check if animation is complete
      if (elapsed >= totalDuration) {
        if (onComplete) onComplete();
        return;
      }
      
      // --- Handle Ring Animation ---
      const ringAnimationStart = fadeInDuration + fadeInToAnimationDuration;
      const animationElapsed = elapsed - ringAnimationStart;
      if (animationElapsed > 0 && ringRef.current) {
        const t = Math.min(animationElapsed / duration, 1);
        const easedT = ease(t, easing);
        
        // Calculate current radius based on direction
        const currentRadius = direction === 'expand' 
          ? easedT * maxRadius 
          : (1 - easedT) * maxRadius;
        
        // Calculate opacity transition from animation opacity to final
        const ringOpacity = animationOpacity + (finalOpacity - animationOpacity) * easedT;
        
        // Calculate scale based on current radius
        const scale = Math.max(currentRadius / maxRadius, 0.01);
        
        // Calculate dimensions for the ring
        // The div size is determined by maxRadius and inner spread
        // The inner spread controls how much the inner shadow extends, creating the ring effect
        const innerSize = (maxRadius - innerSpread) * 2;
        
        // Create color with calculated opacity
        const colorWithOpacity = setColorAlpha(ringColor, ringOpacity);
        
        // Create double box-shadow to form a ring:
        // - Outer shadow: creates the soft outer edge of the ring (blurs and spreads outward)
        // - Inner shadow: creates the soft inner edge (blurs and spreads inward)
        const outerShadow = `0 0 ${outerBlur}px ${outerSpread}px ${colorWithOpacity}`;
        const innerShadow = `inset 0 0 ${innerBlur}px ${innerSpread}px ${colorWithOpacity}`;
        const boxShadow = `${outerShadow}, ${innerShadow}`;
        
        // Update ring dimensions and transform
        ringRef.current.style.width = `${innerSize}px`;
        ringRef.current.style.height = `${innerSize}px`;
        ringRef.current.style.transform = `translate(-50%, -50%) scale(${scale})`;
        ringRef.current.style.boxShadow = boxShadow;
      }
      
      // --- Handle Component Opacity (Fading with three phases) ---
      let currentComponentOpacity = 0;
      
      if (elapsed < fadeInDuration) {
        // Phase 1: Fade in from 0 to initial opacity
        if (fadeInDuration > 0) {
          const fadeInProgress = elapsed / fadeInDuration;
          currentComponentOpacity = initialOpacity * fadeInProgress;
        } else {
          currentComponentOpacity = initialOpacity;
        }
      } else if (elapsed < fadeInDuration + fadeInToAnimationDuration) {
        // Phase 2: Transition from initial to animation opacity
        if (fadeInToAnimationDuration > 0) {
          const transitionElapsed = elapsed - fadeInDuration;
          const transitionProgress = transitionElapsed / fadeInToAnimationDuration;
          currentComponentOpacity = initialOpacity + (animationOpacity - initialOpacity) * transitionProgress;
        } else {
          currentComponentOpacity = animationOpacity;
        }
      } else if (elapsed < fadeInDuration + fadeInToAnimationDuration + duration) {
        // Phase 3: Active animation at animation opacity
        currentComponentOpacity = animationOpacity;
      } else {
        // Phase 4: Fading out from animation opacity to final
        const fadeOutElapsed = elapsed - (fadeInDuration + fadeInToAnimationDuration + duration);
        if (fadeOutDuration > 0) {
          const fadeOutProgress = fadeOutElapsed / fadeOutDuration;
          currentComponentOpacity = animationOpacity + (finalOpacity - animationOpacity) * fadeOutProgress;
        } else {
          currentComponentOpacity = finalOpacity;
        }
      }
      setComponentOpacity(Math.max(0, Math.min(1, currentComponentOpacity)));
      
      rafIdRef.current = requestAnimationFrame(animate);
    };
    
    rafIdRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
    // Note: Only re-run on mount, props should be stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array ensures effect runs once on mount only
  
  return (
    <div
      className="PulseEffect fixed pointer-events-none"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -50%)',
        opacity: componentOpacity,
        overflow: 'visible',
      }}
      data-testid={testId}
    >
      <div
        ref={ringRef}
        className="PulseEffectRing absolute rounded-full"
        style={{
          // Set inner div dimensions based on maxRadius and inner spread
          width: `${(maxRadius - innerSpread) * 2}px`,
          height: `${(maxRadius - innerSpread) * 2}px`,
          backgroundColor: 'transparent',
          transformOrigin: 'center',
          willChange: 'transform, box-shadow',
          transform: direction === 'expand' ? 'translate(-50%, -50%) scale(0)' : 'translate(-50%, -50%) scale(1)',
        }}
      />
    </div>
  );
}

