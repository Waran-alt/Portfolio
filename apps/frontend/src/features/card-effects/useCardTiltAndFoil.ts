'use client';

import { useCallback, useEffect, useRef } from 'react';

import {
  FOIL_DOM_EPS,
  FOIL_LAYER_INSET_FRAC,
  FOIL_ROTATE_IDLE,
  FOIL_SETTLE_EPS,
  HALO_R_MIN_PX,
  HALO_R_OF_SHORT_SIDE,
  HALO_TRACK_PAD_PX,
  LERP,
  MAX_TILT_DEG,
  POINTER_MOVE_EPS_SQ,
  TILT_DOM_EPS,
  TILT_SETTLE_EPS,
} from './cardEffects.constants';
import { clamp, distancePointToRect, shortestDeltaDeg } from './cardEffectsMath';

export type CardTiltFoilRefs = {
  /** Host for `--foil-rotate-*`, `--foil-halo-*`, `--tilt-x/y`. */
  areaRef: React.RefObject<HTMLElement | null>;
  /** Receives `rotateX` / `rotateY` from the smoothed tilt. */
  tiltLayerRef: React.RefObject<HTMLElement | null>;
  /** Box used to map pointer → halo (e.g. card inner). */
  haloBoundsRef: React.RefObject<HTMLElement | null>;
};

export type UseCardTiltAndFoilOptions = CardTiltFoilRefs & {
  reducedMotion: boolean;
  /**
   * When false, pointer listeners are not attached and the card stays at rest tilt / idle foil
   * (e.g. while a CSS entrance runs on the shell). Defaults to true.
   */
  pointerTiltEnabled?: boolean;
  /**
   * When true, tilt and foil angle follow `pointermove` on `document` (cursor anywhere on the page).
   * When false (default), only pointer position over `areaRef` drives tilt; `document` still receives
   * moves for the foil halo near the card.
   */
  pointerTiltTracksDocument?: boolean;
  /**
   * On touch devices, map screen swipes (`touchmove` on `document`) to card tilt. More reliable
   * than `pointermove` alone on mobile; resets tilt when the finger lifts. Defaults to true.
   */
  touchSwipeTiltEnabled?: boolean;
  /** When true, lerp and write `--foil-rotate-back`; otherwise front. */
  showingBack: boolean;
  /** e.g. `fx.tiltLayerHot` from `cardEffects.module.css`. */
  tiltLayerHotClassName: string;
  /** Fired whenever smoothed tilt is written to `--tilt-x` / `--tilt-y` (same RAF tick as the transform). */
  onTiltApplied?: (tiltX: number, tiltY: number) => void;
};

/**
 * Pointer-driven tilt + foil angle + halo mask, with a single RAF lerp loop.
 * Reusable on any “card-like” surface: pass refs to your DOM; use matching CSS from `cardEffects.module.css`.
 */
export function useCardTiltAndFoil({
  reducedMotion,
  pointerTiltEnabled = true,
  pointerTiltTracksDocument = false,
  touchSwipeTiltEnabled = true,
  showingBack,
  areaRef,
  tiltLayerRef,
  haloBoundsRef,
  tiltLayerHotClassName,
  onTiltApplied,
}: UseCardTiltAndFoilOptions) {
  const onTiltAppliedRef = useRef(onTiltApplied);

  useEffect(() => {
    onTiltAppliedRef.current = onTiltApplied;
  }, [onTiltApplied]);

  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const foilAngleTargetRef = useRef(FOIL_ROTATE_IDLE);
  const foilCurrentFrontRef = useRef(FOIL_ROTATE_IDLE);
  const foilCurrentBackRef = useRef(FOIL_ROTATE_IDLE);
  const domAppliedRef = useRef({
    tiltX: 0,
    tiltY: 0,
    foilFront: FOIL_ROTATE_IDLE,
    foilBack: FOIL_ROTATE_IDLE,
  });
  const rafRef = useRef(0);
  const lastPointerRef = useRef({ x: NaN, y: NaN });
  /** While > 0, touch handlers own tilt (avoids duplicate pointer + touch updates). */
  const activeTouchCountRef = useRef(0);
  const showingBackRef = useRef(showingBack);
  const scheduleTickImplRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    showingBackRef.current = showingBack;
  }, [showingBack]);

  const scheduleMotionTick = useCallback(() => {
    scheduleTickImplRef.current?.();
  }, []);

  useEffect(() => {
    if (reducedMotion || !pointerTiltEnabled) return;
    const tiltEl = tiltLayerRef.current;
    const areaEl = areaRef.current;
    if (!tiltEl || !areaEl) return;

    const tick = () => {
      rafRef.current = 0;

      const t = targetRef.current;
      const c = currentRef.current;
      const dom = domAppliedRef.current;

      let tiltSettled = false;
      {
        const dx = t.x - c.x;
        const dy = t.y - c.y;
        if (Math.abs(dx) < TILT_SETTLE_EPS && Math.abs(dy) < TILT_SETTLE_EPS) {
          c.x = t.x;
          c.y = t.y;
          tiltSettled = true;
        } else {
          c.x += dx * LERP;
          c.y += dy * LERP;
        }
      }

      const isBack = showingBackRef.current;
      let foilSettled = false;
      if (!isBack) {
        const fa = foilCurrentFrontRef.current;
        const targetAng = foilAngleTargetRef.current;
        const d = shortestDeltaDeg(fa, targetAng);
        if (Math.abs(d) < FOIL_SETTLE_EPS) {
          foilCurrentFrontRef.current = targetAng;
          foilSettled = true;
        } else {
          foilCurrentFrontRef.current = fa + d * LERP;
        }
      } else {
        const fa = foilCurrentBackRef.current;
        const targetAng = foilAngleTargetRef.current;
        const d = shortestDeltaDeg(fa, targetAng);
        if (Math.abs(d) < FOIL_SETTLE_EPS) {
          foilCurrentBackRef.current = targetAng;
          foilSettled = true;
        } else {
          foilCurrentBackRef.current = fa + d * LERP;
        }
      }

      if (
        Math.abs(c.x - dom.tiltX) >= TILT_DOM_EPS ||
        Math.abs(c.y - dom.tiltY) >= TILT_DOM_EPS ||
        (tiltSettled && (c.x !== dom.tiltX || c.y !== dom.tiltY))
      ) {
        tiltEl.style.transform = `rotateX(${c.y}deg) rotateY(${c.x}deg)`;
        areaEl.style.setProperty('--tilt-x', String(c.x));
        areaEl.style.setProperty('--tilt-y', String(c.y));
        dom.tiltX = c.x;
        dom.tiltY = c.y;
        onTiltAppliedRef.current?.(c.x, c.y);
      }

      if (!isBack) {
        const nextFoil = foilCurrentFrontRef.current;
        if (
          Math.abs(shortestDeltaDeg(dom.foilFront, nextFoil)) >= FOIL_DOM_EPS ||
          (foilSettled && nextFoil !== dom.foilFront)
        ) {
          areaEl.style.setProperty('--foil-rotate-front', String(nextFoil));
          dom.foilFront = nextFoil;
        }
      } else {
        const nextFoil = foilCurrentBackRef.current;
        if (
          Math.abs(shortestDeltaDeg(dom.foilBack, nextFoil)) >= FOIL_DOM_EPS ||
          (foilSettled && nextFoil !== dom.foilBack)
        ) {
          areaEl.style.setProperty('--foil-rotate-back', String(nextFoil));
          dom.foilBack = nextFoil;
        }
      }

      if (!tiltSettled || !foilSettled) {
        tiltEl.classList.add(tiltLayerHotClassName);
        scheduleTickImplRef.current?.();
      } else {
        tiltEl.classList.remove(tiltLayerHotClassName);
      }
    };

    const scheduleTick = () => {
      if (rafRef.current !== 0) return;
      rafRef.current = requestAnimationFrame(tick);
    };
    scheduleTickImplRef.current = scheduleTick;

    const syncFoilHalo = (clientX: number, clientY: number) => {
      const fr = haloBoundsRef.current?.getBoundingClientRect();
      if (!fr || fr.width < 1 || fr.height < 1) return;
      const minSide = Math.min(fr.width, fr.height);
      const r = Math.max(HALO_R_MIN_PX, minSide * HALO_R_OF_SHORT_SIDE);
      const dist = distancePointToRect(clientX, clientY, fr);
      if (dist > r + HALO_TRACK_PAD_PX) {
        areaEl.style.setProperty('--foil-halo-r', '0px');
        return;
      }
      const u = (clientX - fr.left) / fr.width;
      const v = (clientY - fr.top) / fr.height;
      const d = 1 + 2 * FOIL_LAYER_INSET_FRAC;
      areaEl.style.setProperty('--foil-halo-x', `${((u + FOIL_LAYER_INSET_FRAC) / d) * 100}%`);
      areaEl.style.setProperty('--foil-halo-y', `${((v + FOIL_LAYER_INSET_FRAC) / d) * 100}%`);
      areaEl.style.setProperty('--foil-halo-r', `${r}px`);
    };

    const clearFoilHalo = () => {
      areaEl.style.setProperty('--foil-halo-r', '0px');
    };

    const onEnter = () => {
      const fr = haloBoundsRef.current?.getBoundingClientRect();
      if (fr) {
        syncFoilHalo(fr.left + fr.width / 2, fr.top + fr.height / 2);
      }
    };

    const onLeave = () => {
      lastPointerRef.current = { x: NaN, y: NaN };
      targetRef.current = { x: 0, y: 0 };
      foilAngleTargetRef.current = FOIL_ROTATE_IDLE;
      scheduleTick();
    };

    const applyTiltFromClientPoint = (clientX: number, clientY: number, force = false) => {
      const lp = lastPointerRef.current;
      if (!force && Number.isFinite(lp.x)) {
        const dx = clientX - lp.x;
        const dy = clientY - lp.y;
        if (dx * dx + dy * dy < POINTER_MOVE_EPS_SQ) {
          return;
        }
      }
      lp.x = clientX;
      lp.y = clientY;

      const rect = areaEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const nx = (clientX - cx) / (rect.width / 2);
      const ny = (clientY - cy) / (rect.height / 2);
      const nxClamped = clamp(nx, -1, 1);
      const nyClamped = clamp(ny, -1, 1);
      const nextTx = nxClamped * MAX_TILT_DEG;
      const nextTy = -nyClamped * MAX_TILT_DEG;
      const nextAng = (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI;

      const t = targetRef.current;
      if (
        Math.abs(nextTx - t.x) < TILT_DOM_EPS &&
        Math.abs(nextTy - t.y) < TILT_DOM_EPS &&
        Math.abs(shortestDeltaDeg(foilAngleTargetRef.current, nextAng)) < FOIL_DOM_EPS
      ) {
        return;
      }

      t.x = nextTx;
      t.y = nextTy;
      foilAngleTargetRef.current = nextAng;
      scheduleTick();
    };

    const applyTiltFromPointer = (p: PointerEvent) => {
      if (activeTouchCountRef.current > 0) return;
      applyTiltFromClientPoint(p.clientX, p.clientY);
    };

    const onGlobalPointerMove = (e: Event) => {
      const p = e as PointerEvent;
      syncFoilHalo(p.clientX, p.clientY);
      if (pointerTiltTracksDocument) {
        applyTiltFromPointer(p);
      }
    };

    const onAreaPointerMove = (e: Event) => {
      applyTiltFromPointer(e as PointerEvent);
    };

    const touchCaptureOpts: AddEventListenerOptions = { passive: true, capture: true };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      activeTouchCountRef.current = e.touches.length;
      lastPointerRef.current = { x: NaN, y: NaN };
      const t = e.touches[0]!;
      syncFoilHalo(t.clientX, t.clientY);
      if (pointerTiltTracksDocument) {
        applyTiltFromClientPoint(t.clientX, t.clientY, true);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      activeTouchCountRef.current = e.touches.length;
      const t = e.touches[0]!;
      syncFoilHalo(t.clientX, t.clientY);
      if (pointerTiltTracksDocument) {
        applyTiltFromClientPoint(t.clientX, t.clientY);
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      activeTouchCountRef.current = e.touches.length;
      if (e.touches.length === 0) {
        onLeave();
        clearFoilHalo();
        return;
      }
      const t = e.touches[0]!;
      syncFoilHalo(t.clientX, t.clientY);
      applyTiltFromClientPoint(t.clientX, t.clientY, true);
    };

    const passiveOpts: AddEventListenerOptions = { passive: true };
    document.addEventListener('pointermove', onGlobalPointerMove, passiveOpts);

    const useTouchSwipe =
      touchSwipeTiltEnabled &&
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    if (useTouchSwipe) {
      document.addEventListener('touchstart', onTouchStart, touchCaptureOpts);
      document.addEventListener('touchmove', onTouchMove, touchCaptureOpts);
      document.addEventListener('touchend', onTouchEnd, touchCaptureOpts);
      document.addEventListener('touchcancel', onTouchEnd, touchCaptureOpts);
    }

    const onLeftViewportOrWindowBlur = () => {
      onLeave();
      clearFoilHalo();
    };

    if (pointerTiltTracksDocument) {
      document.documentElement.addEventListener('mouseleave', onLeftViewportOrWindowBlur);
      window.addEventListener('blur', onLeftViewportOrWindowBlur);
    } else {
      areaEl.addEventListener('pointerenter', onEnter, passiveOpts);
      areaEl.addEventListener('pointermove', onAreaPointerMove, passiveOpts);
      areaEl.addEventListener('pointerleave', onLeave, passiveOpts);
    }

    return () => {
      scheduleTickImplRef.current = null;
      activeTouchCountRef.current = 0;
      tiltEl.classList.remove(tiltLayerHotClassName);
      document.removeEventListener('pointermove', onGlobalPointerMove);
      if (useTouchSwipe) {
        document.removeEventListener('touchstart', onTouchStart, touchCaptureOpts);
        document.removeEventListener('touchmove', onTouchMove, touchCaptureOpts);
        document.removeEventListener('touchend', onTouchEnd, touchCaptureOpts);
        document.removeEventListener('touchcancel', onTouchEnd, touchCaptureOpts);
      }
      clearFoilHalo();
      if (pointerTiltTracksDocument) {
        document.documentElement.removeEventListener('mouseleave', onLeftViewportOrWindowBlur);
        window.removeEventListener('blur', onLeftViewportOrWindowBlur);
      } else {
        areaEl.removeEventListener('pointerenter', onEnter);
        areaEl.removeEventListener('pointermove', onAreaPointerMove);
        areaEl.removeEventListener('pointerleave', onLeave);
      }
      if (rafRef.current !== 0) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
  }, [
    reducedMotion,
    pointerTiltEnabled,
    pointerTiltTracksDocument,
    touchSwipeTiltEnabled,
    tiltLayerHotClassName,
    areaRef,
    tiltLayerRef,
    haloBoundsRef,
  ]);

  return { scheduleMotionTick };
}
