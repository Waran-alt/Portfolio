'use client';

/**
 * @file Landing Page
 *
 * Interactive 3D cube landing page with quaternion-based animation.
 * All animation logic is handled by cubeAnimation.ts module.
 */

import { createRef, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  CURSOR_MOVE_PULSE_DISTANCE_PX,
  CURSOR_MOVE_PULSE_MAX_RATE_MS,
  CURSOR_MOVE_PULSE_MIN_INTERVAL_MS,
  CURSOR_STOP_THRESHOLD_MS,
  LIGHT_INITIAL_X,
  LIGHT_INITIAL_Y,
  PERSPECTIVE_PX,
} from './animations/constants';
import { createCubeAnimation, quat_create, type CubeAnimationState } from './animations/cube';
import { createLightGradient } from './animations/light';
import { LANDING_PAGE_AUTO_PULSE_CONFIG, LANDING_PAGE_CLICK_PULSE_CONFIG, PulseEffect, type Pulse } from './animations/pulse';
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
  CURSOR_GUIDE_GRADIENT_COLOR,
  CURSOR_GUIDE_GRADIENT_STOPS,
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
  TESSERACT_LINE_COLOR,
  TESSERACT_LINE_STROKE_WIDTH,
  type CubeFaceKey,
} from './page.constants';
import styles from './page.module.css';

type CSSVariableProperties = CSSProperties & Record<string, string | number>;

export default function LandingPage() {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const cubePulseWrapperRef = useRef<HTMLDivElement | null>(null);
  const [lightGradient] = useState(createLightGradient({ x: LIGHT_INITIAL_X, y: LIGHT_INITIAL_Y }));
  const [isInnerCubeExpanded, setIsInnerCubeExpanded] = useState(false);
  const [isPulsePaused, setIsPulsePaused] = useState(false);
  const shouldPauseAfterLoopRef = useRef(false);

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

  // Track cursor movement for pulse generation
  const lastCursorMoveTimeRef = useRef<number>(0);
  const lastPulsePositionRef = useRef<{ x: number; y: number } | null>(null);
  const lastPulseTimeRef = useRef<number>(0);

  // Cursor movement pulse generator - triggers based on distance (25px) or time (300ms min, 150ms max rate)
  const checkAndTriggerPulse = (cursorX: number, cursorY: number) => {
    // Don't pulse if inner cube is expanded
    if (isInnerCubeExpanded) {
      return;
    }

    const now = Date.now();
    const timeSinceLastPulse = now - lastPulseTimeRef.current;
    const timeSinceLastMove = now - lastCursorMoveTimeRef.current;

    // Don't pulse if cursor has stopped moving
    if (timeSinceLastMove >= CURSOR_STOP_THRESHOLD_MS) {
      return;
    }

    // Rate limit: never pulse faster than max rate
    if (timeSinceLastPulse < CURSOR_MOVE_PULSE_MAX_RATE_MS) {
      return;
    }

    let shouldTrigger = false;

    if (lastPulsePositionRef.current === null) {
      // First pulse - trigger immediately
      shouldTrigger = true;
    } else {
      // Calculate distance moved since last pulse
      const dx = cursorX - lastPulsePositionRef.current.x;
      const dy = cursorY - lastPulsePositionRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Trigger if moved 25px or more
      if (distance >= CURSOR_MOVE_PULSE_DISTANCE_PX) {
        shouldTrigger = true;
      }
      // Or trigger if minimum interval has passed (slow movement)
      else if (timeSinceLastPulse >= CURSOR_MOVE_PULSE_MIN_INTERVAL_MS) {
        shouldTrigger = true;
      }
    }

    if (shouldTrigger) {
      const newPulse = {
        id: generatePulseId(),
        x: cursorX,
        y: cursorY,
        timestamp: now,
        config: LANDING_PAGE_CLICK_PULSE_CONFIG,
      };
      setPulses(prev => [...prev, newPulse]);
      lastPulsePositionRef.current = { x: cursorX, y: cursorY };
      lastPulseTimeRef.current = now;
    }
  };

  // Reset pulse tracking when cursor stops moving
  useEffect(() => {
    const checkCursorStopped = () => {
      const now = Date.now();
      const timeSinceLastMove = now - lastCursorMoveTimeRef.current;

      if (timeSinceLastMove >= CURSOR_STOP_THRESHOLD_MS) {
        // Cursor has stopped - reset pulse position so next movement triggers immediately
        lastPulsePositionRef.current = null;
      }
    };

    const interval = setInterval(checkCursorStopped, 50); // Check every 50ms

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Auto-pulse generator - DISABLED: will be re-enabled after a certain action later in development
  // useEffect(() => {
  //   let autoPulseId: NodeJS.Timeout;
  //   
  //   const createAutoPulse = () => {
  //     const x = Math.random() * window.innerWidth;
  //     const y = Math.random() * window.innerHeight;
  //     const newPulse = {
  //       id: generatePulseId(),
  //       x,
  //       y,
  //       timestamp: Date.now(),
  //       config: LANDING_PAGE_AUTO_PULSE_CONFIG,
  //     };
  //     setPulses(prev => [...prev, newPulse]);

  //     // Schedule next auto-pulse with random interval (3-8 seconds)
  //     const nextInterval = 3000 + Math.random() * 5000;
  //     autoPulseId = setTimeout(createAutoPulse, nextInterval);
  //   };

  //   const timeoutId = setTimeout(createAutoPulse, 2000); // Start after 2 seconds
  //   
  //   return () => {
  //     clearTimeout(timeoutId);
  //     clearTimeout(autoPulseId);
  // };
  // }, []); // Empty dependency array - only run once

  const handlePulseComplete = (id: number) => {
    setPulses(prev => prev.filter(pulse => pulse.id !== id));
  };

  // Handle pulse pause/resume based on inner cube expansion
  useEffect(() => {
    if (!isInnerCubeExpanded) {
      // Immediately resume when not expanded
      // Note: This synchronous state update is intentional for immediate UX feedback when expansion stops
      shouldPauseAfterLoopRef.current = false;
      setIsPulsePaused(false);
      return;
    }

    // When expanded, set flag to pause after current loop completes
    shouldPauseAfterLoopRef.current = true;

    // Wait for current loop to complete before pausing
    const pulseWrapper = cubePulseWrapperRef.current;
    if (!pulseWrapper) {
      return;
    }

    const pulseFaces = pulseWrapper.querySelectorAll('[data-testid="cube-pulse-face"]');
    if (pulseFaces.length === 0) {
      return;
    }

    const handleAnimationIteration = () => {
      // Only pause if we still want to pause (expansion might have been released)
      if (shouldPauseAfterLoopRef.current) {
        setIsPulsePaused(true);
      }
    };

    // Listen to the first pulse face for iteration completion
    const firstPulseFace = pulseFaces[0] as HTMLElement;
    firstPulseFace.addEventListener('animationiteration', handleAnimationIteration);

    return () => {
      firstPulseFace.removeEventListener('animationiteration', handleAnimationIteration);
    };
  }, [isInnerCubeExpanded]);

  // Inner cube expansion handlers
  useEffect(() => {
    const handleMouseDown = () => {
      setIsInnerCubeExpanded(true);
    };

    const handleMouseUp = () => {
      setIsInnerCubeExpanded(false);
    };

    const handleKeyDown = () => {
      // Trigger on any key press
      setIsInnerCubeExpanded(true);
    };

    const handleKeyUp = () => {
      setIsInnerCubeExpanded(false);
    };

    // Add global event listeners
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

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
        <div 
          className={styles['followWrapper']} 
          ref={innerRef}
        >
          <div 
            className={`${styles['cube']} ${isPulsePaused ? styles['cubePulsePaused'] : ''}`}
            data-testid="cube"
            style={{
              '--cube-face-background': CUBE_FACE_BACKGROUND,
              '--cube-face-border': CUBE_FACE_BORDER,
              '--cube-face-shadow': CUBE_FACE_SHADOW,
              '--inner-cube-face-background': INNER_CUBE_FACE_BACKGROUND,
              '--inner-cube-face-border': INNER_CUBE_FACE_BORDER,
              '--inner-cube-face-shadow': INNER_CUBE_FACE_SHADOW,
            } as CSSVariableProperties}
          >
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
      
      {/* Interactive overlay for pulse effects - must be last to capture cursor movement */}
      <div
        className="absolute inset-0 z-20"
        onMouseMove={(event) => {
          const now = Date.now();
          cursorPositionRef.current = { x: event.clientX, y: event.clientY };
          lastCursorMoveTimeRef.current = now;
          checkAndTriggerPulse(event.clientX, event.clientY);
        }}
        aria-label="Interactive landing page - move cursor to create pulse effects"
        data-testid="pulse-trigger-overlay"
      />
    </main>
  );
}
