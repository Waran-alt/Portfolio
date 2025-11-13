'use client';

/**
 * @file Landing Page
 *
 * Interactive 3D cube landing page with quaternion-based animation.
 * All animation logic is handled by cubeAnimation.ts module.
 */

import { useEffect, useRef, useState } from 'react';
import { LIGHT_INITIAL_X, LIGHT_INITIAL_Y, PERSPECTIVE_PX } from './animations/constants';
import { createCubeAnimation, quat_create, type CubeAnimationState } from './animations/cube';
import { createLightGradient } from './animations/light';
import { PulseEffect } from './animations/pulse';
import Cube3D from './components/Cube3D';
import GuideOverlay from './components/GuideOverlay';
import PulseOverlay from './components/PulseOverlay';
import { useGuideLines } from './hooks/useGuideLines';
import { useInnerCubeExpansion } from './hooks/useInnerCubeExpansion';
import { usePulseEffects } from './hooks/usePulseEffects';
import styles from './page.module.css';
import { TOTAL_ENTRANCE_DURATION_MS } from './utils/entranceDelays';

export default function LandingPage() {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const cubeRef = useRef<HTMLDivElement | null>(null);
  const [lightGradient] = useState(createLightGradient({ x: LIGHT_INITIAL_X, y: LIGHT_INITIAL_Y }));
  const [isEntranceComplete, setIsEntranceComplete] = useState(false);

  // Animation state
  const animationStateRef = useRef<CubeAnimationState>({
    currentQuat: quat_create(),
    targetQuat: quat_create(),
    following: false,
    initialized: false,
    animationStartTime: 0,
    // Initial speeds will be randomized when animation starts
    currentSpeedX: 0,
    targetSpeedX: 0,
    currentSpeedY: 0,
    targetSpeedY: 0,
    currentSpeedZ: 0,
    targetSpeedZ: 0,
  });

  // Inner cube expansion and vibration
  const {
    isInnerCubeExpanded,
    isPulsePaused,
    cubeVibrationTransform,
    cubePulseWrapperRef,
  } = useInnerCubeExpansion();

  // Pulse effects
  const { pulses, cursorPositionRef, checkAndTriggerPulse, handlePulseComplete } =
    usePulseEffects(isInnerCubeExpanded);

  // Guide lines
  const { cornerRefs, innerCornerRefs, lineRefs, tesseractLineRefs, gradientRefs } =
    useGuideLines(cursorPositionRef);

  // Mark entrance as complete after animation duration
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsEntranceComplete(true);
    }, TOTAL_ENTRANCE_DURATION_MS);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Start cube animation after entrance completes
  useEffect(() => {
    if (!isEntranceComplete) {
      return;
    }

    // Create and start the animation loop
    const cleanup = createCubeAnimation(innerRef, animationStateRef);

    return () => {
      cleanup();
    };
  }, [isEntranceComplete]);

  // Handle mouse move for pulse generation
  const handleMouseMove = (event: React.MouseEvent) => {
    checkAndTriggerPulse(event.clientX, event.clientY);
  };

  return (
    <main
      className={`LandingPage ${styles['landingPage']} min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-700`}
      data-testid="landing-root"
      style={{ background: lightGradient, position: 'relative' }}
    >
      {/* Render pulse effects behind cube */}
      {pulses.map(pulse => (
        <PulseEffect
          key={pulse.id}
          x={pulse.x}
          y={pulse.y}
          {...pulse.config}
          onComplete={() => handlePulseComplete(pulse.id)}
          data-testid={`pulse-${pulse.id}`}
        />
      ))}

      <div className="relative z-10" style={{ perspective: `${PERSPECTIVE_PX}px` }} data-testid="cube-wrapper">
        <div className={styles['followWrapper']} ref={innerRef}>
          <Cube3D
            isEntranceComplete={isEntranceComplete}
            isPulsePaused={isPulsePaused}
            isInnerCubeExpanded={isInnerCubeExpanded}
            cubeVibrationTransform={cubeVibrationTransform}
            cubePulseWrapperRef={cubePulseWrapperRef}
            cornerRefs={cornerRefs}
            innerCornerRefs={innerCornerRefs}
            cubeRef={cubeRef}
          />
        </div>
      </div>

      <GuideOverlay
        cornerRefs={cornerRefs}
        innerCornerRefs={innerCornerRefs}
        lineRefs={lineRefs}
        tesseractLineRefs={tesseractLineRefs}
        gradientRefs={gradientRefs}
      />

      {/* Interactive overlay for pulse effects - must be last to capture cursor movement */}
      <PulseOverlay onMouseMove={handleMouseMove} />
    </main>
  );
}
