/**
 * @file Loading Circle Component
 *
 * Loading circle indicator that appears around the cursor during inner cube expansion.
 * The circle closes after expansion completes, or falls back if expansion is stopped.
 */

import { useEffect, useRef, useState } from 'react';
import { COLORS, INNER_CUBE_CONTRACT_DURATION_MS, INNER_CUBE_EXPAND_DURATION_MS, rgb } from '../page.constants';
import styles from './LoadingCircle.module.css';

interface LoadingCircleProps {
  x: number;
  y: number;
  isExpanding: boolean;
}

/**
 * Loading circle component that follows the cursor during inner cube expansion.
 * 
 * The circle starts when expansion begins and closes over the expansion duration.
 * If expansion stops early, the circle falls back quickly.
 */
export default function LoadingCircle({ x, y, isExpanding }: LoadingCircleProps) {
  const [shouldShow, setShouldShow] = useState(false);
  const [animationState, setAnimationState] = useState<'expanding' | 'completed' | 'fallback'>('expanding');
  const [fallbackStartClipPath, setFallbackStartClipPath] = useState<string>('');
  const expandTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const expandStartTimeRef = useRef<number | null>(null);
  const circleRef = useRef<HTMLDivElement | null>(null);

  // Show circle when expansion starts
  useEffect(() => {
    if (isExpanding && !shouldShow) {
      // Defer state updates to avoid cascading renders
      queueMicrotask(() => {
        setShouldShow(true);
        setAnimationState('expanding');
        expandStartTimeRef.current = performance.now();
        
        // Clear any existing timers
        if (expandTimerRef.current) {
          clearTimeout(expandTimerRef.current);
        }
        if (fallbackTimerRef.current) {
          clearTimeout(fallbackTimerRef.current);
        }
        
        // Mark as completed after expansion duration (circle stays visible in completed state)
        expandTimerRef.current = setTimeout(() => {
          setAnimationState('completed');
          expandTimerRef.current = null;
          // Don't clear expandStartTimeRef here - we need it to check if expansion stopped early
        }, INNER_CUBE_EXPAND_DURATION_MS);
      });
    }
  }, [isExpanding, shouldShow]);

  // Handle expansion stop: fall back quickly only if not completed
  useEffect(() => {
    if (isExpanding || !shouldShow) {
      return;
    }

    // If expansion stopped before completion, trigger fallback
    if (animationState === 'expanding' && expandStartTimeRef.current) {
      // Clear expansion timer
      if (expandTimerRef.current) {
        clearTimeout(expandTimerRef.current);
        expandTimerRef.current = null;
      }
      
      // Calculate current progress (0 to 1)
      const elapsed = performance.now() - expandStartTimeRef.current;
      const progress = Math.min(elapsed / INNER_CUBE_EXPAND_DURATION_MS, 1);
      
      // Calculate clip-path based on current progress (matching loading animation keyframes)
      let currentClipPath: string;
      if (progress <= 0.25) {
        // Interpolate between 0% (fully open) and 25% (top edge complete)
        const t = progress / 0.25;
        currentClipPath = `polygon(50% 50%, 0 0, ${t * 100}% 0, ${t * 100}% 0, ${t * 100}% 0, ${t * 100}% 0)`;
      } else if (progress <= 0.5) {
        // Interpolate between 25% (top) and 50% (top + right)
        const t = (progress - 0.25) / 0.25;
        currentClipPath = `polygon(50% 50%, 0 0, 100% 0, 100% ${t * 100}%, 100% ${t * 100}%, 100% ${t * 100}%)`;
      } else if (progress <= 0.75) {
        // Interpolate between 50% (top + right) and 75% (top + right + bottom)
        const t = (progress - 0.5) / 0.25;
        currentClipPath = `polygon(50% 50%, 0 0, 100% 0, 100% 100%, ${(1 - t) * 100}% 100%, ${(1 - t) * 100}% 100%)`;
      } else {
        // Interpolate between 75% (top + right + bottom) and 100% (fully closed)
        const t = (progress - 0.75) / 0.25;
        currentClipPath = `polygon(50% 50%, 0 0, 100% 0, 100% 100%, ${(1 - t) * 100}% 100%, ${(1 - t) * 100}% 0)`;
      }
      
      // Stop the expanding animation and start JavaScript-driven fallback
      if (circleRef.current) {
        // Remove expanding animation class to stop it
        const expandingClass = styles['expanding'];
        if (expandingClass) {
          circleRef.current.classList.remove(expandingClass);
        }
        // Set the current clip-path based on progress
        circleRef.current.style.clipPath = currentClipPath;
        circleRef.current.style.animation = 'none';
        
        // Start JavaScript-driven fallback animation
        // Defer state updates to avoid cascading renders
        queueMicrotask(() => {
          setAnimationState('fallback');
          setFallbackStartClipPath(currentClipPath);
        });
        
        // Animate fallback using JavaScript (reversing the loading steps)
        const fallbackStartTime = performance.now();
        const fallbackAnimationRef = { active: true };
        const animateFallback = () => {
          if (!circleRef.current || !fallbackAnimationRef.active) {
            return;
          }
          
          const elapsed = performance.now() - fallbackStartTime;
          const fallbackProgress = Math.min(elapsed / INNER_CUBE_CONTRACT_DURATION_MS, 1);
          
          if (fallbackProgress >= 1) {
            fallbackAnimationRef.active = false;
            setShouldShow(false);
            setFallbackStartClipPath('');
            return;
          }
          
          // Reverse the loading animation: interpolate from current progress to 0
          const reverseProgress = progress * (1 - fallbackProgress);
          
          // Calculate clip-path based on reverse progress
          let fallbackClipPath: string;
          if (reverseProgress <= 0.25) {
            const t = reverseProgress / 0.25;
            fallbackClipPath = `polygon(50% 50%, 0 0, ${t * 100}% 0, ${t * 100}% 0, ${t * 100}% 0, ${t * 100}% 0)`;
          } else if (reverseProgress <= 0.5) {
            const t = (reverseProgress - 0.25) / 0.25;
            fallbackClipPath = `polygon(50% 50%, 0 0, 100% 0, 100% ${t * 100}%, 100% ${t * 100}%, 100% ${t * 100}%)`;
          } else if (reverseProgress <= 0.75) {
            const t = (reverseProgress - 0.5) / 0.25;
            fallbackClipPath = `polygon(50% 50%, 0 0, 100% 0, 100% 100%, ${(1 - t) * 100}% 100%, ${(1 - t) * 100}% 100%)`;
          } else {
            const t = (reverseProgress - 0.75) / 0.25;
            fallbackClipPath = `polygon(50% 50%, 0 0, 100% 0, 100% 100%, ${(1 - t) * 100}% 100%, ${(1 - t) * 100}% 0)`;
          }
          
          if (circleRef.current) {
            circleRef.current.style.clipPath = fallbackClipPath;
          }
          
          if (fallbackProgress < 1) {
            requestAnimationFrame(animateFallback);
          }
        };
        
        requestAnimationFrame(animateFallback);
      }
      
      expandStartTimeRef.current = null;
    }
    // If expansion stopped after completion, just hide the circle immediately
    else if (animationState === 'completed') {
      // Defer state update to avoid cascading renders
      queueMicrotask(() => {
        setShouldShow(false);
      });
      expandStartTimeRef.current = null;
    }
  }, [isExpanding, shouldShow, animationState]);

  // Cleanup timers on unmount
  useEffect(() => {
    // Capture ref values to avoid stale closures
    const expandTimer = expandTimerRef.current;
    const fallbackTimer = fallbackTimerRef.current;
    const circleElement = circleRef.current;
    
    return () => {
      if (expandTimer) {
        clearTimeout(expandTimer);
      }
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
      }
      // Stop any ongoing fallback animation
      if (circleElement) {
        circleElement.style.animation = 'none';
      }
    };
  }, []);

  if (!shouldShow) {
    return null;
  }

  const animationClass =
    animationState === 'fallback'
      ? styles['fallback']
      : animationState === 'completed'
        ? styles['completed']
        : styles['expanding'];

  return (
    <div
      ref={circleRef}
      className={`${styles['loadingCircle']} ${animationClass}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        '--expand-duration': `${INNER_CUBE_EXPAND_DURATION_MS}ms`,
        '--contract-duration': `${INNER_CUBE_CONTRACT_DURATION_MS}ms`,
        '--loading-circle-color': rgb(COLORS.darkGrayLighter),
        ...(animationState === 'fallback' && fallbackStartClipPath
          ? { clipPath: fallbackStartClipPath }
          : {}),
      } as React.CSSProperties}
      data-testid="loading-circle"
    />
  );
}

