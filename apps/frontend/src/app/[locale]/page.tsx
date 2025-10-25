'use client';

/**
 * Landing Page
 *
 * Minimal entry page linking to demos.
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
  const [paused, setPaused] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null); // perspective wrapper
  const innerRef = useRef<HTMLDivElement | null>(null);   // element receiving transform
  const cubeRef = useRef<HTMLDivElement | null>(null);    // element with CSS animation
  const waapi = useRef<{ anim: Animation | null; start: number; raf: number | null; restart: (() => void) | null } | null>({ anim: null, start: 0, raf: null, restart: null });

  // Inertial follow state held in refs (avoid 60fps React renders)
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const intervalIdRef = useRef<number | null>(null);
  // Note: we rely on `paused` state to manage follow/resume; no separate follow flag needed

  useEffect(() => {
    const stiffness = INERTIA_STIFFNESS;
    const damping = INERTIA_DAMPING;
    const TICK_MS = INERTIA_TICK_MS;

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

      if (innerRef.current) {
        innerRef.current.style.transform = `rotateX(${current.x}deg) rotateY(${current.y}deg)`;
      }

      // stepped loop continues while interval is active
    };

    const handleMove = (e: MouseEvent) => {
      const vw = window.innerWidth || 1;
      const vh = window.innerHeight || 1;
      const cx = vw / 2;
      const cy = vh / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;

      // Map cursor position on screen to degrees relative to viewport center
      const maxDeg = ROTATION_MAX_DEG;
      const mappedY = Math.max(-maxDeg, Math.min(maxDeg, (dx / (vw / 2)) * maxDeg));
      const mappedX = Math.max(-maxDeg, Math.min(maxDeg, (-dy / (vh / 2)) * maxDeg));

      targetRef.current.x = mappedX;
      targetRef.current.y = mappedY;
      setPaused(true);

      if (!intervalIdRef.current) {
        intervalIdRef.current = window.setInterval(step, TICK_MS);
      }

      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        // Resume CSS animation from the CURRENT visual orientation by
        // keeping the wrapper transform and letting the cube animation run on top
        // clear paused-only state; CSS animation resumes, WAAPI restarts ramp
        // Reset speed to base and restart WAAPI ramp
        if (waapi.current?.anim) {
          waapi.current.anim.playbackRate = WAAPI_BASE_RATE;
        }
        waapi.current?.restart?.();
        setPaused(false);
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

  // Web Animations API: ramp playbackRate from base to max using cubic-bezier
  useEffect(() => {
    if (!cubeRef.current) return;

    // Get the CSS animation on the cube element
    const list = cubeRef.current.getAnimations();
    const anim = list.length > 0 ? list[0] : null;
    waapi.current = { anim: anim ?? null, start: performance.now(), raf: null, restart: null };

    const cubicBezier = (_x1: number, y1: number, _x2: number, y2: number) => {
      // Evaluate cubic-bezier y(t) directly; sufficient for ramp mapping
      return (t: number) => {
        const u = 1 - t;
        return u*u*u*0 + 3*u*u*t*y1 + 3*u*t*t*y2 + t*t*t*1;
      };
    };

    const ease = cubicBezier(WAAPI_EASE.x1, WAAPI_EASE.y1, WAAPI_EASE.x2, WAAPI_EASE.y2);

    const tick = () => {
      if (!waapi.current?.anim) return;
      const now = performance.now();
      const elapsed = Math.min(1, (now - (waapi.current.start)) / WAAPI_RAMP_MS);
      const s = ease(elapsed);
      const rate = WAAPI_BASE_RATE + (WAAPI_MAX_RATE - WAAPI_BASE_RATE) * s;
      if (waapi.current.anim) {
        waapi.current.anim.playbackRate = rate;
      }
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

  const wrapperStyle = undefined; // transform applied directly via rAF for smoothness

  return (
    <main className="LandingPage min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-700" data-testid="landing-root">
      <div className="relative" style={{ perspective: `${PERSPECTIVE_PX}px` }} data-testid="cube-wrapper" ref={wrapperRef}>
        <div className={styles['followWrapper']} ref={innerRef} style={wrapperStyle}>
          <div className={`${styles['cube']} ${paused ? styles['paused'] : ''}`} data-testid="cube" ref={cubeRef}>
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