'use client';

/**
 * @file Landing Page
 *
 * Interactive 3D cube landing page with quaternion-based animation.
 * All animation logic is handled by cubeAnimation.ts module.
 */

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { INITIAL_CUBE_ROTATION_X, INITIAL_CUBE_ROTATION_Y, LIGHT_INITIAL_X, LIGHT_INITIAL_Y, PERSPECTIVE_PX } from './animations/constants';
import { createCubeAnimation, quat_create, quat_fromAxisAngle, quat_multiply, quat_toMatrix3d, type CubeAnimationState } from './animations/cube';
import { createLightGradient } from './animations/light';
import { PulseEffect } from './animations/pulse';
import Cube3D from './components/Cube3D';
import LoadingCircle from './components/LoadingCircle';
import PulseOverlay from './components/PulseOverlay';
import { useGuideLines } from './hooks/useGuideLines';
import { useInnerCubeExpansion } from './hooks/useInnerCubeExpansion';
import { usePulseEffects } from './hooks/usePulseEffects';
import {
  CUBE_ENTRANCE_INITIAL_DELAY_MS,
  CUBE_IMPLOSION_DURATION_MS,
  STAGE1_INNER_CUBE_DELAY_MS,
  STAGE1_INNER_CUBE_FADE_DURATION_MS,
  STAGE1_ROTATION_DELAY_MS,
  STAGE1_ROTATION_DURATION_MS,
  STAGE2_START_AFTER_STAGE1_MS,
  STAGE2_TOTAL_DURATION_MS,
  STAGE3_START_AFTER_STAGE2_MS,
  STAGE3_TOTAL_DURATION_MS,
} from './page.constants';
import styles from './page.module.css';

const GuideOverlay = dynamic(() => import('./components/GuideOverlay'), {
  ssr: false,
  loading: () => null,
});

const ENABLE_STAGE2 = true;
const ENABLE_STAGE3 = true;
const ENABLE_FINAL_ANIMATION = true;
export default function LandingPage() {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const cubeRef = useRef<HTMLDivElement | null>(null);
  const [lightGradient] = useState(createLightGradient({ x: LIGHT_INITIAL_X, y: LIGHT_INITIAL_Y }));
  const [isEntranceComplete, setIsEntranceComplete] = useState(false);
  // Stage tracking - will be set to true when respective stages start
  const [isStage2Active, setIsStage2Active] = useState(false);
  const [isStage3Active, setIsStage3Active] = useState(false);
  // Track when cube animation starts (pulse and rotation can begin)
  const [isCubeAnimationStarted, setIsCubeAnimationStarted] = useState(false);
  // Track when all entrance animations are complete (cursor can be shown and animations enabled)
  const [areAnimationsComplete, setAreAnimationsComplete] = useState(false);
  const [isCursorInitialized, setIsCursorInitialized] = useState(false);
  // Track cursor position for loading circle (initialize to center of viewport)
  const [cursorPosition, setCursorPosition] = useState(() => {
    if (typeof window !== 'undefined') {
      return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    }
    return { x: 0, y: 0 };
  });
  // Track when loading completes to trigger cube implosion
  const [shouldImplode, setShouldImplode] = useState(false);
  // Track when implosion completes to hide cube
  const [isCubeHidden, setIsCubeHidden] = useState(false);
  // Store cleanup function for cube animation
  const cubeAnimationCleanupRef = useRef<(() => void) | null>(null);
  
  // Callback for when loading circle completes
  const handleLoadingComplete = useCallback(() => {
    setShouldImplode(true);
    // Hide cube after implosion animation completes and clean up
    setTimeout(() => {
      setIsCubeHidden(true);
      // Clean up cube animation listeners and intervals
      if (cubeAnimationCleanupRef.current) {
        cubeAnimationCleanupRef.current();
        cubeAnimationCleanupRef.current = null;
      }
    }, CUBE_IMPLOSION_DURATION_MS);
  }, []);

  // Calculate initial perspective rotation quaternion (combines Y and X axis rotations)
  const perspectiveRotationQuat = useMemo(
    () =>
      quat_multiply(
        quat_fromAxisAngle([0, 1, 0], INITIAL_CUBE_ROTATION_Y),
        quat_fromAxisAngle([1, 0, 0], INITIAL_CUBE_ROTATION_X)
      ),
    []
  );

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

  // Guide lines (only update cursor guide lines after animations complete)
  const { cornerRefs, innerCornerRefs, lineRefs, tesseractLineRefs, gradientRefs } =
    useGuideLines(cursorPositionRef, isStage3Active, areAnimationsComplete);

  // Orchestrate entrance animation timeline: Stage 1 → Stage 2 → Stage 3 → Interactive animations
  useEffect(() => {
    // Calculate stage timing milestones
    const stage1EndTime =
      CUBE_ENTRANCE_INITIAL_DELAY_MS + STAGE1_INNER_CUBE_DELAY_MS + STAGE1_INNER_CUBE_FADE_DURATION_MS;
    const rotationStartTime = stage1EndTime + STAGE1_ROTATION_DELAY_MS;
    const rotationEndTime = rotationStartTime + STAGE1_ROTATION_DURATION_MS;
    const stage2StartTime = rotationEndTime + STAGE2_START_AFTER_STAGE1_MS;

    const timers: NodeJS.Timeout[] = [];
    
    // Mark entrance complete after inner cube fade-in
    timers.push(
      setTimeout(() => {
        setIsEntranceComplete(true);
      }, stage1EndTime),
    );
    
    // Start Stage 1 rotation: apply perspective transform with bouncy easing
    timers.push(
      setTimeout(() => {
        const node = innerRef.current;
        if (!node) {
          return;
        }
        // Apply rotation transition
        node.style.transition = `transform ${STAGE1_ROTATION_DURATION_MS}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
        node.style.transform = quat_toMatrix3d(perspectiveRotationQuat);
        // Update animation state after rotation completes
        const rotationCompleteTimer = setTimeout(() => {
          node.style.transition = '';
          animationStateRef.current.currentQuat = perspectiveRotationQuat;
          animationStateRef.current.targetQuat = perspectiveRotationQuat;
        }, STAGE1_ROTATION_DURATION_MS);
        timers.push(rotationCompleteTimer);
      }, rotationStartTime),
    );
    
    // Stage 2: Outer face assembly with crash animations
    if (ENABLE_STAGE2) {
      timers.push(
        setTimeout(() => {
          setIsStage2Active(true);
          if (ENABLE_STAGE3) {
            // Stage 3: Connecting line growth after Stage 2 completes
            const stage2EndTime = STAGE2_TOTAL_DURATION_MS;
            const stage3StartDelay = stage2EndTime + STAGE3_START_AFTER_STAGE2_MS;
            timers.push(
              setTimeout(() => {
                setIsStage3Active(true);
                // Mark all animations complete and enable interactive features after Stage 3 finishes
                const stage3EndTime = STAGE3_TOTAL_DURATION_MS;
                timers.push(
                  setTimeout(() => {
                    setAreAnimationsComplete(true);
                    // Start interactive cube rotation (cursor-following) after all entrance animations complete
                    if (ENABLE_FINAL_ANIMATION) {
                      const cleanup = createCubeAnimation(innerRef, animationStateRef);
                      cubeAnimationCleanupRef.current = cleanup;
                      setIsCubeAnimationStarted(true);
                    }
                  }, stage3EndTime),
                );
              }, stage3StartDelay),
            );
          } else {
            // Mark complete and enable interactive features when Stage 2 finishes (Stage 3 disabled)
            timers.push(
              setTimeout(() => {
                setAreAnimationsComplete(true);
                // Start interactive cube rotation (cursor-following) after all entrance animations complete
                if (ENABLE_FINAL_ANIMATION) {
                  const cleanup = createCubeAnimation(innerRef, animationStateRef);
                  cubeAnimationCleanupRef.current = cleanup;
                  setIsCubeAnimationStarted(true);
                }
              }, STAGE2_TOTAL_DURATION_MS),
            );
          }
        }, stage2StartTime),
      );
    } else {
      // Mark complete and enable interactive features when Stage 1 finishes (Stage 2 disabled)
      const stage1EndTime =
        CUBE_ENTRANCE_INITIAL_DELAY_MS + STAGE1_INNER_CUBE_DELAY_MS + STAGE1_INNER_CUBE_FADE_DURATION_MS;
      const rotationEndTime = stage1EndTime + STAGE1_ROTATION_DELAY_MS + STAGE1_ROTATION_DURATION_MS;
      timers.push(
        setTimeout(() => {
          setAreAnimationsComplete(true);
          // Start interactive cube rotation (cursor-following) after all entrance animations complete
          if (ENABLE_FINAL_ANIMATION) {
            const cleanup = createCubeAnimation(innerRef, animationStateRef);
            cubeAnimationCleanupRef.current = cleanup;
            setIsCubeAnimationStarted(true);
          }
        }, rotationEndTime),
      );
    }

    return () => {
      timers.forEach(clearTimeout);
  };
  }, [perspectiveRotationQuat]);


  // Track cursor position and trigger pulses after animations complete
  const handleMouseMove = (event: React.MouseEvent) => {
    // Don't process mouse movement if cube is hidden
    if (isCubeHidden) {
      return;
    }
    
    const x = event.clientX;
    const y = event.clientY;
    // Always update cursor position for guide lines
    cursorPositionRef.current = { x, y };
    // Update cursor position state for loading circle
    setCursorPosition({ x, y });
    // Mark cursor as initialized on first movement
    if (!isCursorInitialized) {
      setIsCursorInitialized(true);
    }
    // Only generate pulses after all entrance animations complete
    if (areAnimationsComplete) {
      checkAndTriggerPulse(x, y);
    }
  };

  return (
    <main
      className={`LandingPage ${styles['landingPage']} min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-700`}
      data-testid="landing-root"
      style={{
        background: lightGradient,
        position: 'relative',
        cursor: areAnimationsComplete ? undefined : 'none', // Hide cursor until animations complete
      }}
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

      {!isCubeHidden && (
        <div className="relative z-10" style={{ perspective: `${PERSPECTIVE_PX}px` }} data-testid="cube-wrapper">
          <div
            className={`${styles['followWrapper']} ${shouldImplode ? styles['cubeImplode'] : ''}`}
            ref={innerRef}
            style={
              shouldImplode
                ? ({
                    '--implosion-duration': `${CUBE_IMPLOSION_DURATION_MS}ms`,
                  } as React.CSSProperties)
                : undefined
            }
          >
            <Cube3D
            isEntranceComplete={isEntranceComplete}
            isPulsePaused={isPulsePaused}
            isInnerCubeExpanded={isInnerCubeExpanded}
            cubeVibrationTransform={cubeVibrationTransform}
            cubePulseWrapperRef={cubePulseWrapperRef}
            cornerRefs={cornerRefs}
            innerCornerRefs={innerCornerRefs}
            cubeRef={cubeRef}
          isStage2Active={isStage2Active}
          isStage3Active={isStage3Active}
          enablePulse={ENABLE_FINAL_ANIMATION && isCubeAnimationStarted}
          />
          </div>
        </div>
      )}

      {/* Render GuideOverlay only when Stage 3 starts and cube is visible */}
      {!isCubeHidden && isStage3Active && (
        <GuideOverlay
          lineRefs={lineRefs}
          tesseractLineRefs={tesseractLineRefs}
          gradientRefs={gradientRefs}
          innerCornerRefs={innerCornerRefs}
          cornerRefs={cornerRefs}
          isCursorInitialized={isCursorInitialized}
          isStage3Active={isStage3Active}
        />
      )}

      {/* Loading circle indicator around cursor during inner cube expansion */}
      {!isCubeHidden && (
        <LoadingCircle
          x={cursorPosition.x}
          y={cursorPosition.y}
          isExpanding={isInnerCubeExpanded}
          onLoadingComplete={handleLoadingComplete}
        />
      )}

      {/* Interactive overlay for pulse effects - must be last to capture cursor movement */}
      {!isCubeHidden && <PulseOverlay onMouseMove={handleMouseMove} />}
    </main>
  );
}
