/**
 * @file Pulse Animation Module
 * 
 * Manages pulse effects on the landing page:
 * - Creates click-based pulse effects
 * - Configures pulse parameters
 * - Handles pulse lifecycle
 */

import { RefObject } from 'react';

export interface Pulse {
  id: number;
  x: number;
  y: number;
  timestamp: number;
}

export interface PulseConfig {
  direction: 'expand' | 'shrink';
  duration: number;
  maxRadius: number;
  outerBlur: number;
  outerSpread: number;
  innerBlur: number;
  innerSpread: number;
  fadeInDuration: number;
  fadeInToAnimationDuration: number;
  fadeOutDuration: number;
  initialOpacity: number;
  animationOpacity: number;
  finalOpacity: number;
  easing: 'linear' | 'ease-in-out' | 'ease-out' | 'ease-in';
  ringColor: string;
}

export const DEFAULT_PULSE_CONFIG: PulseConfig = {
  direction: 'expand',
  duration: 800,
  maxRadius: 150,
  outerBlur: 20,
  outerSpread: 10,
  innerBlur: 20,
  innerSpread: 5,
  fadeInDuration: 100,
  fadeInToAnimationDuration: 100,
  fadeOutDuration: 200,
  initialOpacity: 0,
  animationOpacity: 1,
  finalOpacity: 0,
  easing: 'ease-out',
  ringColor: 'rgba(255, 255, 255, 1)',
};

export interface PulseAnimationState {
  pulses: Pulse[];
  idCounter: number;
  config: PulseConfig;
}

/**
 * Creates and manages a pulse animation system
 */
export const createPulseAnimation = (
  containerRef: RefObject<HTMLElement>,
  stateRef: RefObject<PulseAnimationState>
) => {
  // Initialize state if not already initialized
  if (!stateRef.current) {
    stateRef.current = {
      pulses: [],
      idCounter: 0,
      config: DEFAULT_PULSE_CONFIG,
    };
  }

  const handleClick = (e: MouseEvent) => {
    if (!containerRef.current || !stateRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Create new pulse
    const newPulse: Pulse = {
      id: stateRef.current.idCounter,
      x,
      y,
      timestamp: Date.now(),
    };

    stateRef.current.pulses.push(newPulse);
    stateRef.current.idCounter++;
  };

  const handlePulseComplete = (id: number) => {
    if (!stateRef.current) return;
    stateRef.current.pulses = stateRef.current.pulses.filter(pulse => pulse.id !== id);
  };

  const cleanup = () => {
    // Cleanup logic if needed
  };

  return { handleClick, handlePulseComplete, cleanup };
};
