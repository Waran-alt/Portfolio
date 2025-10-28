import { AUTO_PULSE_CONFIG, CLICK_PULSE_CONFIG } from '../constants';
import type { PulseEffectProps } from './PulseEffect';

export { createPulseAnimation, DEFAULT_PULSE_CONFIG, type Pulse, type PulseAnimationState, type PulseConfig } from './pulseAnimation';
export { default as PulseEffect } from './PulseEffect';
export type { Direction, EasingFunction, PulseEffectProps } from './PulseEffect';

// Landing page pulse configurations
export const LANDING_PAGE_CLICK_PULSE_CONFIG = CLICK_PULSE_CONFIG as Omit<PulseEffectProps, 'x' | 'y' | 'onComplete' | 'data-testid'>;
export const LANDING_PAGE_AUTO_PULSE_CONFIG = AUTO_PULSE_CONFIG as Omit<PulseEffectProps, 'x' | 'y' | 'onComplete' | 'data-testid'>;

