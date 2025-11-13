/**
 * @file Inner Cube Expansion Hook
 *
 * Custom hook for managing inner cube expansion, vibration, and pulse pausing.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CUBE_VIBRATION_FREQUENCY_HZ,
  CUBE_VIBRATION_MAX_INTENSITY_PX,
  INNER_CUBE_EXPAND_DURATION_MS,
} from '../page.constants';

export interface UseInnerCubeExpansionReturn {
  isInnerCubeExpanded: boolean;
  isPulsePaused: boolean;
  cubeVibrationTransform: string;
  cubePulseWrapperRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Custom hook for managing inner cube expansion behavior.
 *
 * Handles:
 * - Mouse/key press expansion triggers
 * - Progressive vibration during expansion
 * - Pulse animation pausing after expansion completes
 *
 * @returns Expansion state and refs
 */
export function useInnerCubeExpansion(): UseInnerCubeExpansionReturn {
  const [isInnerCubeExpanded, setIsInnerCubeExpanded] = useState(false);
  const [hasCompletedLoopWhileExpanded, setHasCompletedLoopWhileExpanded] = useState(false);
  const [cubeVibrationTransform, setCubeVibrationTransform] = useState<string>('');
  const shouldPauseAfterLoopRef = useRef(false);
  const expansionStartTimeRef = useRef<number | null>(null);
  const cubePulseWrapperRef = useRef<HTMLDivElement | null>(null);

  // Derive pulse pause state: paused only if expanded AND loop has completed
  const isPulsePaused = useMemo(() => {
    return isInnerCubeExpanded && hasCompletedLoopWhileExpanded;
  }, [isInnerCubeExpanded, hasCompletedLoopWhileExpanded]);

  // Reset loop completion state when expansion stops
  useEffect(() => {
    if (!isInnerCubeExpanded) {
      shouldPauseAfterLoopRef.current = false;
      // Defer state update to avoid synchronous setState in effect
      queueMicrotask(() => {
        setHasCompletedLoopWhileExpanded(false);
      });
    }
  }, [isInnerCubeExpanded]);

  // Handle pulse pause after animation loop completes when expanded
  useEffect(() => {
    if (!isInnerCubeExpanded) {
      return;
    }

    // When expanded, set flag to pause after current loop completes
    shouldPauseAfterLoopRef.current = true;

    // Wait for current loop to complete before pausing
    const pulseWrapper = cubePulseWrapperRef.current;
    if (!pulseWrapper) {
      return;
    }

    const pulseFaces = pulseWrapper.querySelectorAll('[data-testid="cube-pulse-face"]');
    if (pulseFaces.length === 0) {
      return;
    }

    const handleAnimationIteration = () => {
      // Only pause if we still want to pause (expansion might have been released)
      if (shouldPauseAfterLoopRef.current && isInnerCubeExpanded) {
        setHasCompletedLoopWhileExpanded(true);
      }
    };

    // Listen to the first pulse face for iteration completion
    const firstPulseFace = pulseFaces[0] as HTMLElement;
    firstPulseFace.addEventListener('animationiteration', handleAnimationIteration);

    return () => {
      firstPulseFace.removeEventListener('animationiteration', handleAnimationIteration);
    };
  }, [isInnerCubeExpanded]);

  // Inner cube expansion handlers
  useEffect(() => {
    const handleMouseDown = () => {
      expansionStartTimeRef.current = performance.now();
      setIsInnerCubeExpanded(true);
    };

    const handleMouseUp = () => {
      expansionStartTimeRef.current = null;
      setIsInnerCubeExpanded(false);
      setCubeVibrationTransform('');
    };

    const handleKeyDown = () => {
      // Trigger on any key press
      expansionStartTimeRef.current = performance.now();
      setIsInnerCubeExpanded(true);
    };

    const handleKeyUp = () => {
      expansionStartTimeRef.current = null;
      setIsInnerCubeExpanded(false);
      setCubeVibrationTransform('');
    };

    // Add global event listeners
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Vibration effect during inner cube expansion
  useEffect(() => {
    if (!isInnerCubeExpanded || !expansionStartTimeRef.current) {
      return;
    }

    let animationFrameId: number;

    const updateVibration = () => {
      if (!expansionStartTimeRef.current) {
        setCubeVibrationTransform('');
        return;
      }

      const now = performance.now();
      const elapsed = now - expansionStartTimeRef.current;

      // Calculate expansion progress (0 to 1) using cubic-bezier easing
      // cubic-bezier(0.16, 1, 0.7, 1) - ease-out cubic
      const rawProgress = Math.min(elapsed / INNER_CUBE_EXPAND_DURATION_MS, 1);

      // Apply cubic-bezier(0.16, 1, 0.7, 1) easing approximation
      // This is a simplified approximation - for exact easing, we'd need a bezier solver
      const easedProgress = 1 - Math.pow(1 - rawProgress, 3);

      // Vibration intensity increases with expansion progress
      const intensity = easedProgress * CUBE_VIBRATION_MAX_INTENSITY_PX;

      // Generate vibration using sine waves with different phases for x, y, z
      const time = now * 0.001; // Convert to seconds
      const frequency = CUBE_VIBRATION_FREQUENCY_HZ;
      const x = Math.sin(time * frequency * 2 * Math.PI) * intensity;
      const y = Math.cos(time * frequency * 2 * Math.PI * 1.3) * intensity;
      const z = Math.sin(time * frequency * 2 * Math.PI * 0.7) * intensity * 0.5;

      setCubeVibrationTransform(`translate3d(${x}px, ${y}px, ${z}px)`);

      if (isInnerCubeExpanded && expansionStartTimeRef.current) {
        animationFrameId = requestAnimationFrame(updateVibration);
      }
    };

    animationFrameId = requestAnimationFrame(updateVibration);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isInnerCubeExpanded]);

  return {
    isInnerCubeExpanded,
    isPulsePaused,
    cubeVibrationTransform,
    cubePulseWrapperRef,
  };
}

