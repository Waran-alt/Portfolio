/**
 * @file Pulse Effects Hook
 *
 * Custom hook for managing pulse effects triggered by cursor movement.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  CURSOR_MOVE_PULSE_DISTANCE_PX,
  CURSOR_MOVE_PULSE_MAX_RATE_MS,
  CURSOR_MOVE_PULSE_MIN_INTERVAL_MS,
  CURSOR_STOP_THRESHOLD_MS,
} from '../animations/constants';
import { LANDING_PAGE_CLICK_PULSE_CONFIG, type Pulse } from '../animations/pulse';

type PulseWithConfig = Pulse & { config: typeof LANDING_PAGE_CLICK_PULSE_CONFIG };

export interface UsePulseEffectsReturn {
  pulses: PulseWithConfig[];
  cursorPositionRef: React.MutableRefObject<{ x: number; y: number }>;
  checkAndTriggerPulse: (cursorX: number, cursorY: number) => void;
  handlePulseComplete: (id: number) => void;
}

/**
 * Custom hook for managing pulse effects on the landing page.
 *
 * Handles cursor movement tracking and pulse generation based on distance and time thresholds.
 *
 * @param isInnerCubeExpanded - Whether the inner cube is expanded (disables pulses)
 * @returns Pulse effects state and handlers
 */
export function usePulseEffects(
  isInnerCubeExpanded: boolean
): UsePulseEffectsReturn {
  const [pulses, setPulses] = useState<PulseWithConfig[]>([]);
  const idCounterRef = useRef(0);
  const cursorPositionRef = useRef({ x: 0, y: 0 });
  const lastCursorMoveTimeRef = useRef<number>(0);
  const lastPulsePositionRef = useRef<{ x: number; y: number } | null>(null);
  const lastPulseTimeRef = useRef<number>(0);

  const generatePulseId = () => {
    idCounterRef.current += 1;
    return idCounterRef.current;
  };

  // Cursor movement pulse generator - triggers based on distance (25px) or time (300ms min, 150ms max rate)
  const checkAndTriggerPulse = (cursorX: number, cursorY: number) => {
    // Update cursor position
    cursorPositionRef.current = { x: cursorX, y: cursorY };
    const now = Date.now();
    lastCursorMoveTimeRef.current = now;

    // Don't pulse if inner cube is expanded
    if (isInnerCubeExpanded) {
      return;
    }

    const timeSinceLastPulse = now - lastPulseTimeRef.current;
    const timeSinceLastMove = now - lastCursorMoveTimeRef.current;

    // Don't pulse if cursor has stopped moving
    if (timeSinceLastMove >= CURSOR_STOP_THRESHOLD_MS) {
      return;
    }

    // Rate limit: never pulse faster than max rate
    if (timeSinceLastPulse < CURSOR_MOVE_PULSE_MAX_RATE_MS) {
      return;
    }

    let shouldTrigger = false;

    if (lastPulsePositionRef.current === null) {
      // First pulse - trigger immediately
      shouldTrigger = true;
    } else {
      // Calculate distance moved since last pulse
      const dx = cursorX - lastPulsePositionRef.current.x;
      const dy = cursorY - lastPulsePositionRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Trigger if moved 25px or more
      if (distance >= CURSOR_MOVE_PULSE_DISTANCE_PX) {
        shouldTrigger = true;
      }
      // Or trigger if minimum interval has passed (slow movement)
      else if (timeSinceLastPulse >= CURSOR_MOVE_PULSE_MIN_INTERVAL_MS) {
        shouldTrigger = true;
      }
    }

    if (shouldTrigger) {
      const newPulse: PulseWithConfig = {
        id: generatePulseId(),
        x: cursorX,
        y: cursorY,
        timestamp: now,
        config: LANDING_PAGE_CLICK_PULSE_CONFIG,
      };
      setPulses(prev => [...prev, newPulse]);
      lastPulsePositionRef.current = { x: cursorX, y: cursorY };
      lastPulseTimeRef.current = now;
    }
  };

  // Reset pulse tracking when cursor stops moving
  useEffect(() => {
    const checkCursorStopped = () => {
      const now = Date.now();
      const timeSinceLastMove = now - lastCursorMoveTimeRef.current;

      if (timeSinceLastMove >= CURSOR_STOP_THRESHOLD_MS) {
        // Cursor has stopped - reset pulse position so next movement triggers immediately
        lastPulsePositionRef.current = null;
      }
    };

    const interval = setInterval(checkCursorStopped, 50); // Check every 50ms

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Initialize cursor position
  useEffect(() => {
    if (typeof window !== 'undefined') {
      cursorPositionRef.current = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      };
    }
  }, []);

  const handlePulseComplete = (id: number) => {
    setPulses(prev => prev.filter(pulse => pulse.id !== id));
  };

  return {
    pulses,
    cursorPositionRef,
    checkAndTriggerPulse,
    handlePulseComplete,
  };
}

