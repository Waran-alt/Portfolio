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

  // Calculate pulse pause state: pause only when expanded AND current loop has completed
  const isPulsePaused = useMemo(() => {
    return isInnerCubeExpanded && hasCompletedLoopWhileExpanded;
  }, [isInnerCubeExpanded, hasCompletedLoopWhileExpanded]);

  // Reset loop completion flag when expansion stops
  useEffect(() => {
    if (!isInnerCubeExpanded) {
      shouldPauseAfterLoopRef.current = false;
      queueMicrotask(() => {
        setHasCompletedLoopWhileExpanded(false);
      });
    }
  }, [isInnerCubeExpanded]);

  // Pause pulse animation after current loop completes when cube is expanded
  useEffect(() => {
    if (!isInnerCubeExpanded) {
      return;
    }

    // Mark that we want to pause after the current animation loop
    shouldPauseAfterLoopRef.current = true;

    const pulseWrapper = cubePulseWrapperRef.current;
    if (!pulseWrapper) {
      return;
    }

    const pulseFaces = pulseWrapper.querySelectorAll('[data-testid="cube-pulse-face"]');
    if (pulseFaces.length === 0) {
      return;
    }

    // Listen for animation iteration to detect when loop completes
    const handleAnimationIteration = () => {
      if (shouldPauseAfterLoopRef.current && isInnerCubeExpanded) {
        setHasCompletedLoopWhileExpanded(true);
      }
    };

    const firstPulseFace = pulseFaces[0] as HTMLElement;
    firstPulseFace.addEventListener('animationiteration', handleAnimationIteration);

    return () => {
      firstPulseFace.removeEventListener('animationiteration', handleAnimationIteration);
    };
  }, [isInnerCubeExpanded]);

  // Set up global event listeners for mouse/keyboard expansion triggers
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
      expansionStartTimeRef.current = performance.now();
      setIsInnerCubeExpanded(true);
    };

    const handleKeyUp = () => {
      expansionStartTimeRef.current = null;
      setIsInnerCubeExpanded(false);
      setCubeVibrationTransform('');
    };

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

  // Generate vibration effect during expansion: intensity increases with expansion progress
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

      // Calculate expansion progress (0 to 1) with cubic ease-out approximation
      const rawProgress = Math.min(elapsed / INNER_CUBE_EXPAND_DURATION_MS, 1);
      const easedProgress = 1 - Math.pow(1 - rawProgress, 3);

      // Scale vibration intensity by expansion progress
      const intensity = easedProgress * CUBE_VIBRATION_MAX_INTENSITY_PX;

      // Generate 3D oscillation using sine waves with different phases for each axis
      const time = now * 0.001;
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

