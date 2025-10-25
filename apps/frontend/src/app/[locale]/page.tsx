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
  ROTATION_MAX_DEG
} from './landing.constants';
import styles from './page.module.css';

export default function LandingPage() {
  const [paused, setPaused] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null); // perspective wrapper
  const innerRef = useRef<HTMLDivElement | null>(null);   // element receiving transform

  // Inertial follow state held in refs (avoid 60fps React renders)
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const intervalIdRef = useRef<number | null>(null);
  const followingRef = useRef(false);

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
      followingRef.current = true;
      setPaused(true);

      if (!intervalIdRef.current) {
        intervalIdRef.current = window.setInterval(step, TICK_MS);
      }

      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        // Resume CSS animation from the CURRENT visual orientation by
        // keeping the wrapper transform and letting the cube animation run on top
        followingRef.current = false;
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

  const wrapperStyle = undefined; // transform applied directly via rAF for smoothness

  return (
    <main className="LandingPage min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-700" data-testid="landing-root">
      <div className="relative" style={{ perspective: `${PERSPECTIVE_PX}px` }} data-testid="cube-wrapper" ref={wrapperRef}>
        <div className={styles['followWrapper']} ref={innerRef} style={wrapperStyle}>
          <div className={`${styles['cube']} ${paused ? styles['paused'] : ''}`} data-testid="cube">
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