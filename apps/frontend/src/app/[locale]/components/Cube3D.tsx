/**
 * @file Cube 3D Component
 *
 * Main 3D cube component with outer and inner cubes, pulse effects, and entrance animations.
 */

import React, { useMemo, type CSSProperties } from 'react';
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
  type CubeFaceKey,
} from '../page.constants';
import { calculateEntranceDelays } from '../utils/entranceDelays';
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
}

const entranceDelays = calculateEntranceDelays();

/**
 * Main 3D cube component with outer and inner cubes.
 *
 * Renders:
 * - Outer cube faces and corners
 * - Inner cube faces and corners
 * - Pulse effect overlays
 * - Entrance animations
 */
export default function Cube3D({
  isEntranceComplete,
  isPulsePaused,
  isInnerCubeExpanded,
  cubeVibrationTransform,
  cubePulseWrapperRef,
  cornerRefs,
  innerCornerRefs,
  cubeRef,
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

  return (
    <div
      ref={cubeRef}
      className={`${styles['cube']} ${isPulsePaused ? styles['cubePulsePaused'] : ''} ${!isEntranceComplete ? styles['cubeEntrancePending'] : ''}`}
      data-testid="cube"
      style={{
        '--cube-face-background': CUBE_FACE_BACKGROUND,
        '--cube-face-border': CUBE_FACE_BORDER,
        '--cube-face-shadow': CUBE_FACE_SHADOW,
        '--inner-cube-face-background': INNER_CUBE_FACE_BACKGROUND,
        '--inner-cube-face-border': INNER_CUBE_FACE_BORDER,
        '--inner-cube-face-shadow': INNER_CUBE_FACE_SHADOW,
        transform: cubeVibrationTransform || undefined,
      } as CSSVariableProperties}
    >
      {isEntranceComplete && (
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

      {cubeFaces.map((face, index) => {
        const delay = entranceDelays[index];
        return (
          <div
            key={`core-${face.key}`}
            data-testid="cube-face"
            data-face={face.key}
            className={`${styles['cubeFace']} ${styles['cubeEntrance']} ${face.className}`}
            style={{
              animationDelay: `${delay}ms`,
            } as CSSVariableProperties}
          />
        );
      })}

      {CUBE_CORNER_OFFSETS.map((corner, index) => {
        const cornerRef = cornerRefs[index];
        if (!cornerRef) {
          return null;
        }

        const delay = entranceDelays[CUBE_FACE_KEYS.length + index];
        return (
          <div
            key={corner.key}
            data-corner-key={corner.key}
            ref={cornerRef}
            className={`${styles['cornerMarker']} ${styles['cubeEntrance']}`}
            style={{
              transform: `translate3d(${corner.x}px, ${corner.y}px, ${corner.z}px)`,
              animationDelay: `${delay}ms`,
            } as CSSVariableProperties}
          />
        );
      })}

      {/* Inner cube */}
      <div
        style={{
          position: 'absolute',
          width: `${INNER_CUBE_SIZE_PX}px`,
          height: `${INNER_CUBE_SIZE_PX}px`,
          left: `calc(50% - ${INNER_CUBE_HALF_SIZE}px)`,
          top: `calc(50% - ${INNER_CUBE_HALF_SIZE}px)`,
          transform: `scale3d(${isInnerCubeExpanded ? INNER_CUBE_EXPAND_SCALE : 1}, ${isInnerCubeExpanded ? INNER_CUBE_EXPAND_SCALE : 1}, ${isInnerCubeExpanded ? INNER_CUBE_EXPAND_SCALE : 1})`,
          transition: `transform ${isInnerCubeExpanded ? INNER_CUBE_EXPAND_DURATION_MS : INNER_CUBE_CONTRACT_DURATION_MS}ms ${isInnerCubeExpanded ? 'cubic-bezier(0.16, 1, 0.7, 1)' : 'ease-in'}`,
          transformStyle: 'preserve-3d',
        } as CSSVariableProperties}
      >
        <div
          className={styles['innerCube']}
          style={{
            '--inner-cube-pulse-scale': INNER_CUBE_PULSE_SCALE,
          } as CSSVariableProperties}
        >
          {cubeFaces.map((face, index) => {
            const delay = entranceDelays[CUBE_FACE_KEYS.length + CUBE_CORNER_OFFSETS.length + index];
            return (
              <div
                key={`inner-${face.key}`}
                data-testid="inner-cube-face"
                className={`${styles['cubeFace']} ${styles['innerCubeFace']} ${styles['cubeEntrance']} ${face.className}`}
                style={{
                  transform: INNER_CUBE_FACE_TRANSFORMS[face.key],
                  animationDelay: `${delay}ms`,
                } as CSSVariableProperties}
              />
            );
          })}

          {INNER_CUBE_CORNER_OFFSETS.map((corner, index) => {
            const innerCornerRef = innerCornerRefs[index];
            if (!innerCornerRef) {
              return null;
            }

            const delay =
              entranceDelays[
                CUBE_FACE_KEYS.length + CUBE_CORNER_OFFSETS.length + CUBE_FACE_KEYS.length + index
              ];
            return (
              <div
                key={corner.key}
                data-corner-key={corner.key}
                ref={innerCornerRef}
                className={`${styles['cornerMarker']} ${styles['cubeEntrance']}`}
                style={{
                  transform: `translate3d(${corner.x}px, ${corner.y}px, ${corner.z}px)`,
                  animationDelay: `${delay}ms`,
                } as CSSVariableProperties}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

