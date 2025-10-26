'use client';

/**
 * @file Landing Page
 *
 * Interactive 3D cube landing page with quaternion-based animation.
 * All animation logic is handled by cubeAnimation.ts module.
 */

import { useEffect, useRef } from 'react';
import { createCubeAnimation, quat_create, type CubeAnimationState } from './cubeAnimation';
import { PERSPECTIVE_PX } from './landing.constants';
import styles from './page.module.css';

export default function LandingPage() {
  const innerRef = useRef<HTMLDivElement | null>(null);

  // Animation state
  const animationStateRef = useRef<CubeAnimationState>({
    currentQuat: quat_create(),
    targetQuat: quat_create(),
    following: false,
  });

  useEffect(() => {
    // Create and start the animation loop
    const cleanup = createCubeAnimation(innerRef, animationStateRef);

    return cleanup;
  }, []);

  return (
    <main className="LandingPage min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-700" data-testid="landing-root">
      <div className="relative" style={{ perspective: `${PERSPECTIVE_PX}px` }} data-testid="cube-wrapper">
        <div className={styles['followWrapper']} ref={innerRef}>
          <div className={`${styles['cube']}`} data-testid="cube">
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
