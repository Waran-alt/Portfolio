/**
 * Tuning for pointer-driven tilt + holo foil (shared by `useCardTiltAndFoil`).
 * Override at call sites only if you fork the hook; CSS defaults must stay in sync.
 */

export const MAX_TILT_DEG = 15;
/** Interpolation factor per frame for tilt and foil (0–1); lower = smoother, slower. */
export const LERP = 0.12;
/**
 * Default foil conic `from` angle (deg), kept in sync with `--foil-rotate-front/back` initial values
 * on the host that runs `useCardTiltAndFoil`.
 */
export const FOIL_ROTATE_IDLE = 32;

export const TILT_SETTLE_EPS = 0.012;
export const TILT_DOM_EPS = 0.022;
export const FOIL_SETTLE_EPS = 0.06;
export const FOIL_DOM_EPS = 0.09;
export const POINTER_MOVE_EPS_SQ = 0.36;
/** Matches foil layer `inset: -20%` → maps card coords into the expanded foil box. */
export const FOIL_LAYER_INSET_FRAC = 0.3;

export const HALO_R_MIN_PX = 64;
export const HALO_R_OF_SHORT_SIDE = 0.72;
export const HALO_TRACK_PAD_PX = 72;
