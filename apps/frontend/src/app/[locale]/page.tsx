'use client';

/**
 * @file Landing Page
 *
 * Interactive 3D cube landing page with quaternion-based animation.
 * All animation logic is handled by cubeAnimation.ts module.
 */

import { MouseEvent, useEffect, useRef, useState } from 'react';
import { LIGHT_INITIAL_X, LIGHT_INITIAL_Y, PERSPECTIVE_PX } from './animations/constants';
import { createCubeAnimation, quat_create, type CubeAnimationState } from './animations/cube';
import { createLightEffect, createLightGradient, type LightPosition } from './animations/light';
import { LANDING_PAGE_AUTO_PULSE_CONFIG, LANDING_PAGE_CLICK_PULSE_CONFIG, PulseEffect, type Pulse } from './animations/pulse';
import styles from './page.module.css';

export default function LandingPage() {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const lightPositionRef = useRef<LightPosition>({ x: LIGHT_INITIAL_X, y: LIGHT_INITIAL_Y });
  const [lightGradient, setLightGradient] = useState(createLightGradient({ x: LIGHT_INITIAL_X, y: LIGHT_INITIAL_Y }));

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

    // Start light effect
    const lightCleanup = createLightEffect(lightPositionRef);

    // Update gradient as light position changes
    const updateGradient = () => {
      setLightGradient(createLightGradient(lightPositionRef.current));
      requestAnimationFrame(updateGradient);
    };
    updateGradient();

    return () => {
      cleanup();
      lightCleanup();
    };
  }, []);

  return (
    <main 
      className="LandingPage min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-700" 
      data-testid="landing-root"
      style={{ background: lightGradient }}
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
            <div className={`${styles['cubeFace']} ${styles['cubeFront']}`} />
            <div className={`${styles['cubeFace']} ${styles['cubeBack']}`} />
            <div className={`${styles['cubeFace']} ${styles['cubeRight']}`} />
            <div className={`${styles['cubeFace']} ${styles['cubeLeft']}`} />
            <div className={`${styles['cubeFace']} ${styles['cubeTop']}`} />
            <div className={`${styles['cubeFace']} ${styles['cubeBottom']}`} />
              </div>
        </div>
      </div>
      
      {/* Interactive overlay for pulse effects - must be last to capture all clicks */}
      <div
        className="absolute inset-0 z-20"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Interactive landing page - click or press space to add pulse effects"
        data-testid="pulse-trigger-overlay"
      />
    </main>
  );
}
