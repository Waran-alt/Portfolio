'use client';

/**
 * @file Landing Page
 *
 * Interactive 3D cube landing page with quaternion-based animation.
 * All animation logic is handled by cubeAnimation.ts module.
 */

import { createRef, MouseEvent, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { LIGHT_INITIAL_X, LIGHT_INITIAL_Y, PERSPECTIVE_PX } from './animations/constants';
import { createCubeAnimation, quat_create, type CubeAnimationState } from './animations/cube';
import { createLightGradient } from './animations/light';
import { LANDING_PAGE_AUTO_PULSE_CONFIG, LANDING_PAGE_CLICK_PULSE_CONFIG, PulseEffect, type Pulse } from './animations/pulse';
import {
  CUBE_CORNER_OFFSETS,
  CUBE_FACE_KEYS,
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
  CURSOR_GUIDE_GRADIENT_COLOR,
  CURSOR_GUIDE_GRADIENT_STOPS,
  INNER_CUBE_CORNER_OFFSETS,
  INNER_CUBE_FACE_TRANSFORMS,
  INNER_CUBE_HALF_SIZE,
  INNER_CUBE_SIZE_PX,
  TESSERACT_LINE_COLOR,
  TESSERACT_LINE_STROKE_WIDTH,
  type CubeFaceKey,
} from './page.constants';
import styles from './page.module.css';

type CSSVariableProperties = CSSProperties & Record<string, string | number>;

export default function LandingPage() {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [lightGradient] = useState(createLightGradient({ x: LIGHT_INITIAL_X, y: LIGHT_INITIAL_Y }));

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

  // Pulse state
  const [pulses, setPulses] = useState<Array<Pulse & { config: typeof LANDING_PAGE_CLICK_PULSE_CONFIG | typeof LANDING_PAGE_AUTO_PULSE_CONFIG }>>([]);
  const idCounterRef = useRef(0);
  const cursorPositionRef = useRef({ x: 0, y: 0 });
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
  const cornerRefs = useMemo(
    () => CUBE_CORNER_OFFSETS.map(() => createRef<HTMLDivElement>()),
    []
  );
  const innerCornerRefs = useMemo(
    () => INNER_CUBE_CORNER_OFFSETS.map(() => createRef<HTMLDivElement>()),
    []
  );
  const lineRefs = useMemo(
    () => CUBE_CORNER_OFFSETS.map(() => createRef<SVGLineElement>()),
    []
  );
  const tesseractLineRefs = useMemo(
    () => CUBE_CORNER_OFFSETS.map(() => createRef<SVGLineElement>()),
    []
  );
  const gradientRefs = useMemo(
    () => CUBE_CORNER_OFFSETS.map(() => createRef<SVGLinearGradientElement>()),
    []
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
  
  const generatePulseId = () => {
    idCounterRef.current += 1;
    return idCounterRef.current;
  };

  // Pulse handlers
  const handleClick = (e: MouseEvent<HTMLElement>) => {
    const newPulse = {
      id: generatePulseId(),
      x: e.clientX,
      y: e.clientY,
      timestamp: Date.now(),
      config: LANDING_PAGE_CLICK_PULSE_CONFIG,
    };
    setPulses(prev => [...prev, newPulse]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      // Trigger pulse at center of screen
      const rect = e.currentTarget.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const newPulse = {
        id: generatePulseId(),
        x,
        y,
        timestamp: Date.now(),
        config: LANDING_PAGE_CLICK_PULSE_CONFIG,
      };
      setPulses(prev => [...prev, newPulse]);
    }
  };

  // Auto-pulse generator
  useEffect(() => {
    let autoPulseId: NodeJS.Timeout;
    
    const createAutoPulse = () => {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      const newPulse = {
        id: generatePulseId(),
        x,
        y,
        timestamp: Date.now(),
        config: LANDING_PAGE_AUTO_PULSE_CONFIG,
      };
      setPulses(prev => [...prev, newPulse]);

      // Schedule next auto-pulse with random interval (3-8 seconds)
      const nextInterval = 3000 + Math.random() * 5000;
      autoPulseId = setTimeout(createAutoPulse, nextInterval);
    };

    const timeoutId = setTimeout(createAutoPulse, 2000); // Start after 2 seconds
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(autoPulseId);
  };
  }, []); // Empty dependency array - only run once

  const handlePulseComplete = (id: number) => {
    setPulses(prev => prev.filter(pulse => pulse.id !== id));
  };

  useEffect(() => {
    // Create and start the animation loop
    const cleanup = createCubeAnimation(innerRef, animationStateRef);

    return () => {
      cleanup();
  };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      cursorPositionRef.current = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      };
    }
  }, []);

  useEffect(() => {
    let animationFrameId: number;

    const updateGuideLines = () => {
      const cursor = cursorPositionRef.current;

      cornerRefs.forEach((cornerRef, index) => {
        const lineRef = lineRefs[index];
        const gradientRef = gradientRefs[index];
        if (!cornerRef || !lineRef || !gradientRef) {
          return;
        }

        const cornerElement = cornerRef.current;
        const lineElement = lineRef.current;
        const gradientElement = gradientRef.current;

        if (!cornerElement || !lineElement || !gradientElement) {
          return;
        }

        const rect = cornerElement.getBoundingClientRect();
        const cornerX = rect.left + rect.width / 2;
        const cornerY = rect.top + rect.height / 2;

        lineElement.setAttribute('x1', `${cursor.x}`);
        lineElement.setAttribute('y1', `${cursor.y}`);
        lineElement.setAttribute('x2', `${cornerX}`);
        lineElement.setAttribute('y2', `${cornerY}`);

        gradientElement.setAttribute('x1', `${cursor.x}`);
        gradientElement.setAttribute('y1', `${cursor.y}`);
        gradientElement.setAttribute('x2', `${cornerX}`);
        gradientElement.setAttribute('y2', `${cornerY}`);
      });

      // Update tesseract connecting lines
      cornerRefs.forEach((outerCornerRef, index) => {
        const innerCornerRef = innerCornerRefs[index];
        const tesseractLineRef = tesseractLineRefs[index];
        if (!outerCornerRef || !innerCornerRef || !tesseractLineRef) {
          return;
        }

        const outerElement = outerCornerRef.current;
        const innerElement = innerCornerRef.current;
        const lineElement = tesseractLineRef.current;

        if (!outerElement || !innerElement || !lineElement) {
          return;
        }

        const outerRect = outerElement.getBoundingClientRect();
        const innerRect = innerElement.getBoundingClientRect();

        const outerX = outerRect.left + outerRect.width / 2;
        const outerY = outerRect.top + outerRect.height / 2;
        const innerX = innerRect.left + innerRect.width / 2;
        const innerY = innerRect.top + innerRect.height / 2;

        lineElement.setAttribute('x1', `${outerX}`);
        lineElement.setAttribute('y1', `${outerY}`);
        lineElement.setAttribute('x2', `${innerX}`);
        lineElement.setAttribute('y2', `${innerY}`);
      });

      animationFrameId = requestAnimationFrame(updateGuideLines);
  };

    animationFrameId = requestAnimationFrame(updateGuideLines);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [cornerRefs, gradientRefs, lineRefs, innerCornerRefs, tesseractLineRefs]);

  return (
    <main 
      className="LandingPage min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-700" 
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
        <div 
          className={styles['followWrapper']} 
          ref={innerRef}
        >
          <div className={`${styles['cube']}`} data-testid="cube">
            <div
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

            {cubeFaces.map(face => (
              <div
                key={`core-${face.key}`}
                data-testid="cube-face"
                data-face={face.key}
                className={`${styles['cubeFace']} ${face.className}`}
              />
            ))}

            {CUBE_CORNER_OFFSETS.map((corner, index) => {
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
                  }}
                />
              );
            })}

            {/* Inner cube */}
            <div
              className={styles['innerCube']}
              style={{
                width: `${INNER_CUBE_SIZE_PX}px`,
                height: `${INNER_CUBE_SIZE_PX}px`,
                left: `calc(50% - ${INNER_CUBE_HALF_SIZE}px)`,
                top: `calc(50% - ${INNER_CUBE_HALF_SIZE}px)`,
              }}
            >
              {cubeFaces.map(face => (
                <div
                  key={`inner-${face.key}`}
                  data-testid="inner-cube-face"
                  className={`${styles['cubeFace']} ${styles['innerCubeFace']} ${face.className}`}
                  style={{
                    transform: INNER_CUBE_FACE_TRANSFORMS[face.key],
                  }}
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
                    }}
                  />
                );
              })}
            </div>
              </div>
        </div>
      </div>
      
      <svg className={styles['guideOverlay']} width="100%" height="100%" role="presentation">
        <defs>
          {CUBE_CORNER_OFFSETS.map((corner, index) => {
            const gradientRef = gradientRefs[index];
            if (!gradientRef) {
              return null;
            }

            return (
              <linearGradient
                key={corner.key}
                id={`cursor-guide-gradient-${corner.key}`}
                ref={gradientRef}
                gradientUnits="userSpaceOnUse"
              >
                {CURSOR_GUIDE_GRADIENT_STOPS.map((stop) => (
                  <stop
                    key={`${corner.key}-${stop.offset}`}
                    offset={stop.offset}
                    stopColor={CURSOR_GUIDE_GRADIENT_COLOR}
                    stopOpacity={stop.opacity}
                  />
                ))}
              </linearGradient>
            );
          })}
        </defs>
        {CUBE_CORNER_OFFSETS.map((corner, index) => {
          const lineRef = lineRefs[index];
          if (!lineRef) {
            return null;
          }

          return (
            <line
              key={corner.key}
              ref={lineRef}
              stroke={`url(#cursor-guide-gradient-${corner.key})`}
              data-testid="cursor-guide-line"
              strokeLinecap="round"
            />
          );
        })}
        {CUBE_CORNER_OFFSETS.map((corner, index) => {
          const tesseractLineRef = tesseractLineRefs[index];
          if (!tesseractLineRef) {
            return null;
          }

          return (
            <line
              key={`tesseract-${corner.key}`}
              ref={tesseractLineRef}
              stroke={TESSERACT_LINE_COLOR}
              strokeWidth={TESSERACT_LINE_STROKE_WIDTH}
              data-testid="tesseract-connecting-line"
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      
      {/* Interactive overlay for pulse effects - must be last to capture all clicks */}
      <div
        className="absolute inset-0 z-20"
        onClick={handleClick}
        onMouseMove={(event) => {
          cursorPositionRef.current = { x: event.clientX, y: event.clientY };
        }}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Interactive landing page - click or press space to add pulse effects"
        data-testid="pulse-trigger-overlay"
      />
    </main>
  );
}
