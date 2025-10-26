'use client';

/**
 * @file Landing Page
 *
 * Interactive 3D cube that auto-rotates with mouse-follow behavior:
 * - Auto-rotation speed ramps up via cubic-bezier over time (WAAPI)
 * - Mouse movement pauses auto-rotation and cube follows cursor with inertia
 * - After 2s idle, resumes auto-rotation from current orientation at base speed
 * - All parameters configurable in landing.constants.ts
 */

import { useEffect, useRef, useState } from 'react';
import {
  IDLE_TIMEOUT_MS,
  INERTIA_DAMPING,
  INERTIA_STIFFNESS,
  INERTIA_TICK_MS,
  PERSPECTIVE_PX,
  ROTATION_MAX_DEG,
  WAAPI_BASE_RATE,
  WAAPI_EASE,
  WAAPI_MAX_RATE,
  WAAPI_RAMP_MS
} from './landing.constants';
import styles from './page.module.css';

export default function LandingPage() {
  // Follow state: true when following mouse, false during auto-rotation
  const [following, setFollowing] = useState(false);
  
  // Refs for DOM elements and timers
  const timeoutRef = useRef<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null); // perspective wrapper
  const innerRef = useRef<HTMLDivElement | null>(null);   // element receiving transform
  const cubeRef = useRef<HTMLDivElement | null>(null);    // element with CSS animation
  
  // WAAPI controller: manages auto-rotation speed ramp via playbackRate
  const waapi = useRef<{ anim: Animation | null; start: number; raf: number | null; restart: (() => void) | null } | null>({ anim: null, start: 0, raf: null, restart: null });

  // Inertial follow system: smooth cursor tracking with spring physics
  // Uses refs to avoid 60fps React re-renders during animation
  const targetRef = useRef({ x: 0, y: 0 });     // Target angles from cursor position
  const currentRef = useRef({ x: 0, y: 0 });    // Current angles (smoothed)
  const velocityRef = useRef({ x: 0, y: 0 });   // Velocity for spring damping
  const intervalIdRef = useRef<number | null>(null); // Stepped animation timer

  // Mouse follow effect: inertial tracking with spring physics
  useEffect(() => {
    // Spring physics constants from config
    const stiffness = INERTIA_STIFFNESS;
    const damping = INERTIA_DAMPING;
    const TICK_MS = INERTIA_TICK_MS;

    // Animation step: apply spring physics to smooth cursor following
    const step = () => {
      const current = currentRef.current;
      const target = targetRef.current;
      const velocity = velocityRef.current;

      // Spring toward target with damping
      const dx = target.x - current.x;
      const dy = target.y - current.y;
      velocity.x = velocity.x * damping + dx * stiffness;
      velocity.y = velocity.y * damping + dy * stiffness;
      current.x += velocity.x;
      current.y += velocity.y;

      // Apply transform to wrapper (preserves cube's CSS animation)
      if (innerRef.current) {
        innerRef.current.style.transform = `rotateX(${current.x}deg) rotateY(${current.y}deg)`;
      }
    };

    // Mouse move handler: convert cursor position to target rotation angles
    const handleMove = (e: MouseEvent) => {
      // Get viewport center as reference point
      const vw = window.innerWidth || 1;
      const vh = window.innerHeight || 1;
      const cx = vw / 2;
      const cy = vh / 2;
      
      // Calculate cursor offset from center
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;

      // Map cursor offset to rotation angles (clamped to max degrees)
      const maxDeg = ROTATION_MAX_DEG;
      const mappedY = Math.max(-maxDeg, Math.min(maxDeg, (dx / (vw / 2)) * maxDeg));
      const mappedX = Math.max(-maxDeg, Math.min(maxDeg, (-dy / (vh / 2)) * maxDeg));

      // Update target angles and enter follow mode
      targetRef.current.x = mappedX;
      targetRef.current.y = mappedY;
      setFollowing(true);

      // Start inertial follow loop if not already running
      if (!intervalIdRef.current) {
        intervalIdRef.current = window.setInterval(step, TICK_MS);
      }

      // Reset idle timer: resume auto-rotation after IDLE_TIMEOUT_MS
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        // Resume CSS animation from the CURRENT visual orientation by
        // keeping the wrapper transform and letting the cube animation run on top
        // clear follow-only state; CSS animation resumes, WAAPI restarts ramp
        // Reset speed to base and restart WAAPI ramp
        if (waapi.current?.anim) {
          waapi.current.anim.playbackRate = WAAPI_BASE_RATE;
        }
        waapi.current?.restart?.();
        setFollowing(false);
        if (intervalIdRef.current) {
          window.clearInterval(intervalIdRef.current);
          intervalIdRef.current = null;
        }
      }, IDLE_TIMEOUT_MS);
    };

    document.addEventListener('mousemove', handleMove);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      if (intervalIdRef.current) window.clearInterval(intervalIdRef.current);
    };
  }, []);

  // WAAPI Speed Ramp: gradually increase auto-rotation speed via cubic-bezier
  useEffect(() => {
    if (!cubeRef.current) return;

    // Find the CSS animation (cube-rotate) on the cube element
    const list = cubeRef.current.getAnimations();
    const anim = list.length > 0 ? list[0] : null;
    waapi.current = { anim: anim ?? null, start: performance.now(), raf: null, restart: null };

    // Cubic-bezier evaluator: maps time t to easing curve y(t)
    const cubicBezier = (_x1: number, y1: number, _x2: number, y2: number) => {
      // Simplified cubic-bezier evaluation (x1,x2 unused for speed ramp)
      return (t: number) => {
        const u = 1 - t;
        return u*u*u*0 + 3*u*u*t*y1 + 3*u*t*t*y2 + t*t*t*1;
      };
    };

    // Create easing function from config
    const ease = cubicBezier(WAAPI_EASE.x1, WAAPI_EASE.y1, WAAPI_EASE.x2, WAAPI_EASE.y2);

    // Animation tick: update playbackRate along the bezier curve
    const tick = () => {
      if (!waapi.current?.anim) return;
      
      // Calculate progress (0 to 1) over ramp duration
      const now = performance.now();
      const elapsed = Math.min(1, (now - (waapi.current.start)) / WAAPI_RAMP_MS);
      
      // Apply easing and interpolate between base and max rate
      const s = ease(elapsed);
      const rate = WAAPI_BASE_RATE + (WAAPI_MAX_RATE - WAAPI_BASE_RATE) * s;
      
      // Update CSS animation playback rate
      if (waapi.current.anim) {
        waapi.current.anim.playbackRate = rate;
      }
      
      // Continue until ramp completes
      if (elapsed < 1) {
        waapi.current.raf = requestAnimationFrame(tick);
      } else {
        waapi.current.raf = null;
      }
    };

    // Define restart to reset ramp from base speed
    waapi.current.restart = () => {
      if (!waapi.current) return;
      waapi.current.start = performance.now();
      if (waapi.current.anim) {
        waapi.current.anim.playbackRate = WAAPI_BASE_RATE;
      }
      if (waapi.current.raf) cancelAnimationFrame(waapi.current.raf);
      waapi.current.raf = requestAnimationFrame(tick);
    };

    // Kick initial ramp
    waapi.current.restart();

    return () => {
      if (waapi.current?.raf) cancelAnimationFrame(waapi.current.raf);
      waapi.current = null;
    };
  }, []);

  // No inline wrapper style - transforms applied directly via inertial loop
  const wrapperStyle = undefined;

  return (
    <main className="LandingPage min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-700" data-testid="landing-root">
      <div className="relative" style={{ perspective: `${PERSPECTIVE_PX}px` }} data-testid="cube-wrapper" ref={wrapperRef}>
        <div className={styles['followWrapper']} ref={innerRef} style={wrapperStyle}>
          <div className={`${styles['cube']} ${following ? styles['paused'] : ''}`} data-testid="cube" ref={cubeRef}>
          <div className={`${styles['cubeFace']} ${styles['cubeFront']}`} />
          <div className={`${styles['cubeFace']} ${styles['cubeBack']}`} />
          <div className={`${styles['cubeFace']} ${styles['cubeRight']}`} />
          <div className={`${styles['cubeFace']} ${styles['cubeLeft']}`} />
          <div className={`${styles['cubeFace']} ${styles['cubeTop']}`} />
          <div className={`${styles['cubeFace']} ${styles['cubeBottom']}`} />
              </div>
        </div>
      </div>
    </main>
  );
} 