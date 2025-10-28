'use client';

/**
 * @file Pulse Effect Component
 * 
 * Render a luminous pulse or wave effect with configurable animations.
 * Support expanding and shrinking animations with full lifecycle management.
 * Optimize for performance using GPU-accelerated transforms and minimal DOM updates.
 */

import { useEffect, useRef } from 'react';

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
 * Apply easing function to interpolation value.
 * 
 * @param t Normalized time (0 to 1)
 * @param easingFn Easing function name
 * @returns Eased value between 0 and 1
 */
const ease = (t: number, easingFn: EasingFunction): number => {
  const easeFunction = easings[easingFn];
  return easeFunction(t);
};

/**
 * Set alpha channel for CSS color string.
 * 
 * Support rgba/rgb color formats. Return original color for unsupported formats.
 * 
 * @param color CSS color string (rgba, rgb, or hex)
 * @param alpha Alpha value (0 to 1)
 * @returns New color string with updated alpha
 */
const setColorAlpha = (color: string, alpha: number): string => {
  if (color.startsWith('rgba(') || color.startsWith('rgb(')) {
    return color.replace(/rgba?\(([^)]+)\)/, (_, content) => {
      const components = content.split(',').map((c: string) => c.trim());
      if (components.length === 3) {
        return `rgba(${components[0]}, ${components[1]}, ${components[2]}, ${alpha})`;
      } else if (components.length === 4) {
        return `rgba(${components[0]}, ${components[1]}, ${components[2]}, ${alpha})`;
      }
      return color;
    });
  }
  
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
  const containerRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);
  
  // Pre-calculate constants to avoid repeated calculations
  const innerSize = (maxRadius - innerSpread) * 2;
  
  useEffect(() => {
    const startTime = performance.now();
    if (!ringRef.current || !containerRef.current) return;
    
    // Cache previous values to prevent unnecessary DOM updates
    let prevScale = -1;
    let prevOpacity = -1;
    let prevRingOpacity = -1;
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const totalDuration = fadeInDuration + fadeInToAnimationDuration + duration + fadeOutDuration;
      
      // Stop animation when complete
      if (elapsed >= totalDuration) {
        if (onComplete) onComplete();
        return;
      }
      
      // Update ring animation state
      const ringAnimationStart = fadeInDuration + fadeInToAnimationDuration;
      const animationElapsed = elapsed - ringAnimationStart;
      if (animationElapsed > 0 && ringRef.current) {
        const t = Math.min(animationElapsed / duration, 1);
        const easedT = ease(t, easing);
        
        // Calculate current radius and scale
        const currentRadius = direction === 'expand' 
          ? easedT * maxRadius 
          : (1 - easedT) * maxRadius;
        const ringOpacity = animationOpacity + (finalOpacity - animationOpacity) * easedT;
        const scale = Math.max(currentRadius / maxRadius, 0.01);
        
        // Update transform only if scale changed to reduce DOM writes
        if (Math.abs(scale - prevScale) > 0.001) {
          ringRef.current.style.transform = `translate3d(-50%, -50%, 0) scale3d(${scale}, ${scale}, 1)`;
          prevScale = scale;
        }
        
        // Update shadow only if opacity changed to reduce DOM writes
        if (Math.abs(ringOpacity - prevRingOpacity) > 0.01) {
          const colorWithOpacity = setColorAlpha(ringColor, ringOpacity);
          const outerShadow = `0 0 ${outerBlur}px ${outerSpread}px ${colorWithOpacity}`;
          const innerShadow = `inset 0 0 ${innerBlur}px ${innerSpread}px ${colorWithOpacity}`;
          const boxShadow = `${outerShadow}, ${innerShadow}`;
          ringRef.current.style.boxShadow = boxShadow;
          prevRingOpacity = ringOpacity;
        }
      }
      
      // Calculate component opacity across three phases
      let currentComponentOpacity = 0;
      
      if (elapsed < fadeInDuration) {
        // Fade from 0 to initial opacity
        if (fadeInDuration > 0) {
          currentComponentOpacity = initialOpacity * (elapsed / fadeInDuration);
        } else {
          currentComponentOpacity = initialOpacity;
        }
      } else if (elapsed < fadeInDuration + fadeInToAnimationDuration) {
        // Transition from initial to animation opacity
        if (fadeInToAnimationDuration > 0) {
          const transitionProgress = (elapsed - fadeInDuration) / fadeInToAnimationDuration;
          currentComponentOpacity = initialOpacity + (animationOpacity - initialOpacity) * transitionProgress;
        } else {
          currentComponentOpacity = animationOpacity;
        }
      } else if (elapsed < fadeInDuration + fadeInToAnimationDuration + duration) {
        // Maintain animation opacity
        currentComponentOpacity = animationOpacity;
      } else {
        // Fade from animation opacity to final
        const fadeOutElapsed = elapsed - (fadeInDuration + fadeInToAnimationDuration + duration);
        if (fadeOutDuration > 0) {
          const fadeOutProgress = fadeOutElapsed / fadeOutDuration;
          currentComponentOpacity = animationOpacity + (finalOpacity - animationOpacity) * fadeOutProgress;
        } else {
          currentComponentOpacity = finalOpacity;
        }
      }
      
      // Update container opacity only if changed to reduce DOM writes
      const clampedOpacity = Math.max(0, Math.min(1, currentComponentOpacity));
      if (Math.abs(clampedOpacity - prevOpacity) > 0.01 && containerRef.current) {
        containerRef.current.style.opacity = `${clampedOpacity}`;
        prevOpacity = clampedOpacity;
      }
      
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
      ref={containerRef}
      className="PulseEffect fixed pointer-events-none"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate3d(-50%, -50%, 0)',
        opacity: 0,
        overflow: 'visible',
        willChange: 'opacity',
      }}
      data-testid={testId}
    >
      <div
        ref={ringRef}
        className="PulseEffectRing absolute rounded-full"
        style={{
          width: `${innerSize}px`,
          height: `${innerSize}px`,
          backgroundColor: 'transparent',
          transformOrigin: 'center',
          willChange: 'transform, box-shadow',
          transform: direction === 'expand' ? 'translate3d(-50%, -50%, 0) scale3d(0, 0, 1)' : 'translate3d(-50%, -50%, 0) scale3d(1, 1, 1)',
        }}
      />
    </div>
  );
}
