/**
 * Old animations testing page.
 * 
 * What this page demonstrates:
 * - Organize code by features (animations, dev tools, etc.)
 * - Manage settings and configuration centrally
 * - Create flexible layouts that work on different screen sizes
 * - Monitor performance and show warnings when things slow down
 * - Handle browser-only features safely without breaking server rendering
 * - Use TypeScript for better code safety
 * - Provide customizable animation effects
 * - Centralize overlay controls in a unified menu system
 */

'use client';

// Import shared components - these are used across different features
import ClientOnly from '@/shared/components/ClientOnly';
import OverlayMenu from '@/shared/components/layout/OverlayMenu';

// Import custom hooks - these provide reusable functionality
import { usePerformanceMonitor } from '@/features/performance/hooks/usePerformanceMonitor';
import { useState } from 'react';

// Import animation manager for multiple animations
import AnimationManager from '@/features/animations/components/AnimationManager';
import { animationLogger } from '@/utils/logger';

// Import animation configuration
import { DEFAULT_ANIMATION_CONFIG, type AnimationConfig } from '@/constants';

/**
 * Performance indicator component for the overlay menu
 * Shows a warning when the app runs slowly
 */
function PerformanceIndicator() {
  const { fps, isLowPerformance } = usePerformanceMonitor();
  
  if (!isLowPerformance) return null;
  
  return (
    <div className="PerformanceIndicator text-xs text-yellow-400">
      ⚠️ Low performance detected ({fps} FPS)
    </div>
  );
}

/**
 * Main page component - this is what gets displayed on your website
 * 
 * This component demonstrates:
 * - Wrap your app with configuration providers so all parts can access settings
 * - Organize features into separate folders for better code management
 * - Use a flexible layout system that positions elements automatically
 * - Monitor performance and show warnings when the app gets slow
 * - Handle browser-only features safely without breaking server rendering
 * - Provide customizable animation effects with real-time configuration
 * - Centralize all overlay controls in a unified menu system
 * 
 * The structure makes it easy to add new features, change settings,
 * and manage how different parts of your app work together.
 * 
 * @returns The main page that users see when they visit your website
 * 
 * @example
 * ```typescript
 * // Next.js automatically renders this component when users visit "/"
 * // You don't need to call it manually
 * ```
 */
export default function HomePage() {
  // Track whether background animation is turned on or off
  const [backgroundActive, setBackgroundActive] = useState(true);
  // Track whether dev mode is enabled
  const [devMode, setDevMode] = useState(false);
  // Track individual animation states
  const [animationStates, setAnimationStates] = useState({
    line: true,
    bubbling: true
  });
  // Track animation configuration
  const [animationConfig, setAnimationConfig] = useState<AnimationConfig>(DEFAULT_ANIMATION_CONFIG);

  /**
   * Toggle global animation state
   */
  const handleToggleGlobalAnimation = () => {
    animationLogger.animation('HomePage', 'global toggle', {
      currentState: backgroundActive,
      newState: !backgroundActive
    });
    setBackgroundActive(!backgroundActive);
  };

  /**
   * Toggle dev mode
   */
  const handleToggleDevMode = () => {
    animationLogger.animation('HomePage', 'dev mode toggle', {
      currentState: devMode,
      newState: !devMode
    });
    setDevMode(!devMode);
  };

  /**
   * Toggle individual animation
   */
  const handleToggleAnimation = (animationId: string) => {
    animationLogger.animation('HomePage', 'individual toggle', {
      animationId,
      currentState: animationStates[animationId as keyof typeof animationStates]
    });
    
    setAnimationStates(prev => ({
      ...prev,
      [animationId]: !prev[animationId as keyof typeof prev]
    }));
  };

  /**
   * Handle animation configuration changes
   */
  const handleAnimationConfigChange = (newConfig: AnimationConfig) => {
    animationLogger.animation('HomePage', 'config change', {
      oldConfig: animationConfig,
      newConfig
    });
    setAnimationConfig(newConfig);
  };

  return (
        <div className="HomePage min-h-screen relative overflow-hidden">
          {/* Background gradient - lowest layer */}
          <div className="HomePage-background fixed inset-0 w-full h-full min-h-screen bg-gradient-to-b from-blue-900 via-blue-700 to-blue-500 z-0" />
          
          {/* Wrap browser-only features to prevent server/client mismatches */}
          <ClientOnly>
              {/* Unified Overlay Menu - contains all overlay controls */}
              <OverlayMenu
          globalAnimationActive={backgroundActive}
          onToggleGlobalAnimation={handleToggleGlobalAnimation}
          devMode={devMode}
          onToggleDevMode={handleToggleDevMode}
          animationStates={animationStates}
          onToggleAnimation={handleToggleAnimation}
          devInfo={<div className="text-white text-xs">Multiple Animations: SVG Line + Bubbling</div>}
                performanceIndicator={<PerformanceIndicator />}
          animationConfig={animationConfig}
          onAnimationConfigChange={handleAnimationConfigChange}
                />

        {/* Animation manager for multiple animations */}
        <AnimationManager 
          isActive={backgroundActive} 
          devMode={devMode}
          animationStates={animationStates}
          animationConfig={animationConfig}
        />
              
              {/* Content layer - sits above background but below UI */}
              <div className="HomePage-content relative z-10 min-h-screen flex items-center justify-center">
                <div className="HomePage-content-text text-center text-white">
                  <h1 className="text-6xl font-bold mb-6 animate-pulse">
                    Portfolio
                  </h1>
                  <p className="text-xl opacity-80 mb-4">
              Multiple animations running in parallel
                  </p>
                  <p className="text-sm opacity-60">
              Use the settings menu in the top-right to control animations
            </p>
            {devMode && (
              <p className="text-xs text-green-400 mt-2">
                🐛 Dev mode: Showing animation status and debug info
              </p>
            )}
                </div>
              </div>
          </ClientOnly>
        </div>
  );
} 