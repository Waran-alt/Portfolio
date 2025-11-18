/**
 * @file Cube 3D Component
 *
 * Main 3D cube component with outer and inner cubes, pulse effects, and entrance animations.
 */

import React, { memo, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  CUBE_CORNER_OFFSETS,
  CUBE_FACE_BACKGROUND,
  CUBE_FACE_BORDER,
  CUBE_FACE_KEYS,
  CUBE_FACE_SHADOW,
  CUBE_FACE_TRANSFORMS,
  CUBE_PULSE_BORDER_COLOR,
  CUBE_PULSE_DELAY_MS,
  CUBE_PULSE_DURATION_MS,
  CUBE_PULSE_EASING,
  CUBE_PULSE_EDGE_BLUR_PX,
  CUBE_PULSE_EDGE_OPACITY,
  CUBE_PULSE_FACE_BACKGROUND,
  CUBE_PULSE_GLOW_COLOR,
  CUBE_PULSE_GLOW_RADIUS_PX,
  CUBE_PULSE_LOOP_DELAY_MS,
  CUBE_PULSE_OPACITY_END,
  CUBE_PULSE_OPACITY_MID,
  CUBE_PULSE_OPACITY_START,
  CUBE_PULSE_SECONDARY_DELAY_MS,
  CUBE_PULSE_SECONDARY_LOOP_DELAY_MS,
  CUBE_PULSE_SECONDARY_OPACITY_MID,
  CUBE_PULSE_SECONDARY_OPACITY_START,
  CUBE_PULSE_SECONDARY_TRANSFORMS,
  CUBE_PULSE_THICKNESS_PX,
  CUBE_PULSE_TRANSFORMS,
  INNER_CUBE_CONTRACT_DURATION_MS,
  INNER_CUBE_CORNER_OFFSETS,
  INNER_CUBE_EXPAND_DURATION_MS,
  INNER_CUBE_EXPAND_SCALE,
  INNER_CUBE_FACE_BACKGROUND,
  INNER_CUBE_FACE_BORDER,
  INNER_CUBE_FACE_SHADOW,
  INNER_CUBE_FACE_TRANSFORMS,
  INNER_CUBE_HALF_SIZE,
  INNER_CUBE_PULSE_SCALE,
  INNER_CUBE_SIZE_PX,
  STAGE2_FACE_BACKSTEP_DELTA_PX,
  STAGE2_FACE_CRASH_DELAY_MS,
  STAGE2_FACE_CRASH_DURATION_MS,
  STAGE2_FACE_EASING,
  STAGE2_FACE_FADE_DURATION_MS,
  STAGE2_FACE_FADE_STAGGER_MS,
  STAGE2_FACE_OFFSET_Z_PX,
  STAGE2_FACE_STAGGER_MS,
  STAGE2_IMPACT_JIGGLE_DURATION_MS,
  STAGE2_IMPACT_JIGGLE_FREQUENCY_HZ,
  STAGE2_IMPACT_JIGGLE_INTENSITY_PX,
  type CubeFaceKey,
} from '../page.constants';
import styles from '../page.module.css';

type CSSVariableProperties = CSSProperties & Record<string, string | number>;

export interface Cube3DProps {
  isEntranceComplete: boolean;
  isPulsePaused: boolean;
  isInnerCubeExpanded: boolean;
  cubeVibrationTransform: string;
  cubePulseWrapperRef: React.RefObject<HTMLDivElement | null>;
  cornerRefs: React.RefObject<HTMLDivElement | null>[];
  innerCornerRefs: React.RefObject<HTMLDivElement | null>[];
  cubeRef: React.RefObject<HTMLDivElement | null>;
  isStage2Active: boolean;
  isStage3Active: boolean;
  enablePulse: boolean;
}


/**
 * Main 3D cube component with outer and inner cubes.
 *
 * Renders:
 * - Outer cube faces and corners
 * - Inner cube faces and corners
 * - Pulse effect overlays
 * - Entrance animations
 */
function Cube3DComponent({
  isEntranceComplete,
  isPulsePaused,
  isInnerCubeExpanded,
  cubeVibrationTransform,
  cubePulseWrapperRef,
  cornerRefs,
  innerCornerRefs,
  cubeRef,
  isStage2Active,
  isStage3Active,
  enablePulse,
}: Cube3DProps) {
  const cubeFaceClassNames = useMemo<Record<CubeFaceKey, string>>(
    () => ({
      front: styles['cubeFront']!,
      back: styles['cubeBack']!,
      right: styles['cubeRight']!,
      left: styles['cubeLeft']!,
      top: styles['cubeTop']!,
      bottom: styles['cubeBottom']!,
    }),
    []
  );

  const cubeFaces = useMemo(
    () =>
      CUBE_FACE_KEYS.map(faceKey => ({
        key: faceKey,
        className: cubeFaceClassNames[faceKey],
        transformStart: CUBE_FACE_TRANSFORMS[faceKey],
        transformEnd: CUBE_PULSE_TRANSFORMS[faceKey],
        secondaryTransformEnd: CUBE_PULSE_SECONDARY_TRANSFORMS[faceKey],
      })),
    [cubeFaceClassNames]
  );

  // Build crash animation transforms for a face (start → backstep → crash → end)
  const makeCrashTransforms = useMemo(() => (faceKey: CubeFaceKey) => {
    const face = cubeFaces.find(f => f.key === faceKey);
    if (!face) return null;
    const base = face.transformStart;
    return {
      start: `${base} translateZ(${STAGE2_FACE_OFFSET_Z_PX}px)`, // Initial position (far away)
      backstep: `${base} translateZ(${STAGE2_FACE_OFFSET_Z_PX + STAGE2_FACE_BACKSTEP_DELTA_PX}px)`, // Backward movement for momentum
      impact: `${base} translateZ(-10px)`, // Impact position (slight overshoot)
      overshoot: `${base} translateZ(6px)`, // Rebound position
      end: base, // Final position
      className: face.className,
      key: face.key,
    };
  }, [cubeFaces]);
  // Build Stage 2 simulated faces with crash transforms and impact axes
  // Each face impacts along its normal axis (front/back: z, right/left: x, top/bottom: y)
  const stage2SimFaces = useMemo(
    () => 
      ([
        { key: 'front', axis: 'z' as const },
        { key: 'right', axis: 'x' as const },
        { key: 'top', axis: 'y' as const },
        { key: 'back', axis: 'z' as const },
        { key: 'left', axis: 'x' as const },
        { key: 'bottom', axis: 'y' as const },
      ] as const)
        .map(def => {
          const t = makeCrashTransforms(def.key as CubeFaceKey);
          return t
            ? {
                transforms: t,
                axis: def.axis,
              }
            : null;
        })
        .filter(Boolean) as { transforms: ReturnType<typeof makeCrashTransforms>; axis: 'x' | 'y' | 'z' }[],
    [makeCrashTransforms],
  );
  const showStage2Simulation = isStage2Active && !isStage3Active && stage2SimFaces.length > 0;
  // Jiggle disabled for current prototype (simple displacement only)

  const cubePulseStyle = useMemo<CSSVariableProperties>(
    () => ({
      '--cube-pulse-duration': `${CUBE_PULSE_DURATION_MS}ms`,
      '--cube-pulse-delay': `${CUBE_PULSE_DELAY_MS}ms`,
      '--cube-pulse-opacity-start': CUBE_PULSE_OPACITY_START,
      '--cube-pulse-opacity-mid': CUBE_PULSE_OPACITY_MID,
      '--cube-pulse-opacity-end': CUBE_PULSE_OPACITY_END,
      '--cube-pulse-easing': CUBE_PULSE_EASING,
      '--cube-pulse-secondary-delay': `${CUBE_PULSE_SECONDARY_DELAY_MS}ms`,
      '--cube-pulse-loop-delay': `${CUBE_PULSE_LOOP_DELAY_MS}ms`,
      '--cube-pulse-secondary-loop-delay': `${CUBE_PULSE_SECONDARY_LOOP_DELAY_MS}ms`,
      '--cube-pulse-thickness': `${CUBE_PULSE_THICKNESS_PX}px`,
      '--cube-pulse-half-thickness': `${CUBE_PULSE_THICKNESS_PX / 2}px`,
      '--cube-pulse-edge-opacity': CUBE_PULSE_EDGE_OPACITY,
      '--cube-pulse-edge-blur': `${CUBE_PULSE_EDGE_BLUR_PX}px`,
      '--cube-pulse-glow-radius': `${CUBE_PULSE_GLOW_RADIUS_PX}px`,
      '--cube-pulse-glow-color': CUBE_PULSE_GLOW_COLOR,
      '--cube-pulse-face-bg': CUBE_PULSE_FACE_BACKGROUND,
      '--cube-pulse-border-color': CUBE_PULSE_BORDER_COLOR,
    }),
    []
  );

  const cubeStyle = useMemo<CSSVariableProperties>(
    () => ({
      '--cube-face-background': CUBE_FACE_BACKGROUND,
      '--cube-face-border': CUBE_FACE_BORDER,
      '--cube-face-shadow': CUBE_FACE_SHADOW,
      '--inner-cube-face-background': INNER_CUBE_FACE_BACKGROUND,
      '--inner-cube-face-border': INNER_CUBE_FACE_BORDER,
      '--inner-cube-face-shadow': INNER_CUBE_FACE_SHADOW,
      transform: cubeVibrationTransform || 'none',
    }),
    [cubeVibrationTransform],
  );

  const innerCubeWrapperStyle = useMemo<CSSVariableProperties>(() => {
    const scale = isInnerCubeExpanded ? INNER_CUBE_EXPAND_SCALE : 1;
    const duration = isInnerCubeExpanded ? INNER_CUBE_EXPAND_DURATION_MS : INNER_CUBE_CONTRACT_DURATION_MS;
    const timing = isInnerCubeExpanded ? 'cubic-bezier(0.16, 1, 0.7, 1)' : 'ease-in';
    return {
      position: 'absolute',
      width: `${INNER_CUBE_SIZE_PX}px`,
      height: `${INNER_CUBE_SIZE_PX}px`,
      left: `calc(50% - ${INNER_CUBE_HALF_SIZE}px)`,
      top: `calc(50% - ${INNER_CUBE_HALF_SIZE}px)`,
      transform: `scale3d(${scale}, ${scale}, ${scale})`,
      transition: `transform ${duration}ms ${timing}`,
      transformStyle: 'preserve-3d',
    };
  }, [isInnerCubeExpanded]);

  const innerCubeStyle = useMemo<CSSVariableProperties>(() => {
    if (!enablePulse) {
      return {
        animationName: 'none',
      };
    }
    return {
      '--inner-cube-pulse-scale': INNER_CUBE_PULSE_SCALE,
    };
  }, [enablePulse]);

  const [cubeImpactTransform, setCubeImpactTransform] = useState<string>('');
  type Impact = { axis: 'x' | 'y' | 'z'; start: number };
  const activeImpactsRef = useRef<Impact[]>([]);
  const rafRef = useRef<number | null>(null);

  // Stop the impact animation loop
  const stopImpactLoop = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  // Run animation loop that mixes multiple impact bounces into a single transform
  // Sums decaying sine waves for each active impact along their respective axes
  const runImpactLoop = () => {
    const loop = () => {
      const impacts = activeImpactsRef.current;
      if (impacts.length === 0) {
        setCubeImpactTransform('');
        stopImpactLoop();
        return;
      }
      let dx = 0;
      let dy = 0;
      let dz = 0;
      const now = performance.now();
      const omega = 2 * Math.PI * STAGE2_IMPACT_JIGGLE_FREQUENCY_HZ;
      const duration = STAGE2_IMPACT_JIGGLE_DURATION_MS;
      const A = STAGE2_IMPACT_JIGGLE_INTENSITY_PX;

      // Sum all active impacts (remove expired ones)
      for (let i = impacts.length - 1; i >= 0; i--) {
        const current = impacts[i] as Impact;
        const elapsed = now - current.start;
        if (elapsed > duration) {
          impacts.splice(i, 1);
          continue;
        }
        // Calculate decaying oscillation for this impact
        const decay = Math.exp(-3 * (elapsed / duration));
        const disp = A * decay * Math.sin(omega * (elapsed / 1000));
        // Add displacement to appropriate axis
        if (current.axis === 'x') dx += disp;
        if (current.axis === 'y') dy += disp;
        if (current.axis === 'z') dz += disp;
      }

      // Apply combined transform
      setCubeImpactTransform(`translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, ${dz.toFixed(2)}px)`);
      rafRef.current = requestAnimationFrame(loop);
    };
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(loop);
    }
  };

  // Trigger a new impact bounce along the specified axis
  // Add impact to active list and start animation loop if not already running
  const triggerImpact = (axis: Impact['axis']) => {
    queueMicrotask(() => {
      const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
      activeImpactsRef.current.push({ axis, start });
      runImpactLoop();
    });
  };

  return (
    <div
      ref={cubeRef}
      className={`${styles['cube']} ${isPulsePaused ? styles['cubePulsePaused'] : ''} ${!isEntranceComplete ? styles['cubeEntrancePending'] : ''}`}
      data-testid="cube"
      style={{
        ...cubeStyle,
        transform: [cubeVibrationTransform || '', cubeImpactTransform || ''].filter(Boolean).join(' ') || 'none',
      } as CSSVariableProperties}
    >
      {enablePulse && (
        <div
          ref={cubePulseWrapperRef}
          className={styles['cubePulseWrapper']}
          style={cubePulseStyle}
          data-testid="cube-pulse"
          aria-hidden="true"
        >
          <div className={styles['cubePulse']}>
            {cubeFaces.map(face => (
              <div
                key={`pulse-${face.key}`}
                data-testid="cube-pulse-face"
                className={`${styles['cubeFace']} ${styles['cubePulseFace']} ${face.className}`}
                style={
                  {
                    '--cube-pulse-transform-start': face.transformStart,
                    '--cube-pulse-transform-end': face.transformEnd,
                  } as CSSVariableProperties
                }
              />
            ))}
            {cubeFaces.map(face => (
              <div
                key={`pulse-secondary-${face.key}`}
                data-testid="cube-pulse-face-secondary"
                className={`${styles['cubeFace']} ${styles['cubePulseFace']} ${styles['cubePulseFaceSecondary']} ${face.className}`}
                style={
                  {
                    '--cube-pulse-transform-start': face.transformStart,
                    '--cube-pulse-transform-end': face.secondaryTransformEnd,
                    '--cube-pulse-opacity-start': CUBE_PULSE_SECONDARY_OPACITY_START,
                    '--cube-pulse-opacity-mid': CUBE_PULSE_SECONDARY_OPACITY_MID,
                  } as CSSVariableProperties
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Stage 2 simulated faces */}
      {showStage2Simulation && stage2SimFaces.length > 0 && (
        <div
          className={`${styles['stage2SimulatedFaces']}`}
          aria-hidden="true"
          style={
            {
              '--stage2-jiggle-duration': `${STAGE2_IMPACT_JIGGLE_DURATION_MS}ms`,
            } as CSSVariableProperties
          }
        >
          {stage2SimFaces.map((item, idx) => {
            const t = item.transforms!;
            const axis = item.axis;
            // Fade-in starts immediately when Stage 2 begins, staggered per face
            const fadeDelay = idx * STAGE2_FACE_FADE_STAGGER_MS;
            // Crash starts after fade-in completes + base crash delay + crash stagger
            const crashDelay = fadeDelay + STAGE2_FACE_FADE_DURATION_MS + STAGE2_FACE_CRASH_DELAY_MS + idx * STAGE2_FACE_STAGGER_MS;
            return (
              <div
                key={`stage2-sim-${t.key}`}
                className={`${styles['cubeFace']} ${styles['stage2FaceCrash']} ${t.className ?? ''}`}
                onAnimationEnd={(e) => {
                  // Only trigger impact when crash animation completes
                  if (e.animationName === 'stage2FaceCrash' || e.animationName.includes('stage2FaceCrash')) {
                    triggerImpact(axis);
                  }
                }}
                style={
                  {
                    '--stage2-transform-start': t.start,
                    '--stage2-transform-backstep': t.backstep,
                    '--stage2-transform-impact': t.impact,
                    '--stage2-transform-overshoot': t.overshoot,
                    '--stage2-transform-end': t.end,
                    '--stage2-fade-duration': `${STAGE2_FACE_FADE_DURATION_MS}ms`,
                    '--stage2-crash-duration': `${STAGE2_FACE_CRASH_DURATION_MS}ms`,
                    '--stage2-fade-delay': `${fadeDelay}ms`,
                    '--stage2-crash-delay': `${crashDelay}ms`,
                    '--stage2-crash-easing': STAGE2_FACE_EASING,
                    // Set initial transform
                    transform: t.start,
                    // Start invisible; fade-in animation will make it visible
                    opacity: 0,
                  } as CSSVariableProperties
                }
              />
            );
          })}
        </div>
      )}

      {/* Outer cube faces - show real faces once Stage 3 begins */}
      {isStage3Active &&
        cubeFaces.map(face => (
          <div
            key={`core-${face.key}`}
            data-testid="cube-face"
            data-face={face.key}
            className={`${styles['cubeFace']} ${face.className}`}
          />
        ))}

      {/* Outer cube corners - show when Stage 3 begins */}
      {isStage3Active &&
        CUBE_CORNER_OFFSETS.map((corner, index) => {
          const cornerRef = cornerRefs[index];
          if (!cornerRef) {
            return null;
          }

          return (
            <div
              key={corner.key}
              data-corner-key={corner.key}
              ref={cornerRef}
              className={styles['cornerMarker']}
              style={{
                transform: `translate3d(${corner.x}px, ${corner.y}px, ${corner.z}px)`,
              } as CSSVariableProperties}
            />
          );
        })}

      {/* Inner cube */}
      <div style={innerCubeWrapperStyle}>
        <div className={styles['innerCube']} style={innerCubeStyle}>
          {cubeFaces.map((face) => (
            <div
              key={`inner-${face.key}`}
              data-testid="inner-cube-face"
              className={`${styles['cubeFace']} ${styles['innerCubeFace']} ${face.className}`}
              style={{
                transform: INNER_CUBE_FACE_TRANSFORMS[face.key],
                opacity: 1, // Visible from start
              } as CSSVariableProperties}
            />
          ))}

          {INNER_CUBE_CORNER_OFFSETS.map((corner, index) => {
            const innerCornerRef = innerCornerRefs[index];
            if (!innerCornerRef) {
              return null;
            }

            return (
              <div
                key={corner.key}
                data-corner-key={corner.key}
                ref={innerCornerRef}
                className={styles['cornerMarker']}
                style={{
                  transform: `translate3d(${corner.x}px, ${corner.y}px, ${corner.z}px)`,
                  opacity: 1, // Visible from start
                } as CSSVariableProperties}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default memo(Cube3DComponent);

