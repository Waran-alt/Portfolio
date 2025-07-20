/**
 * Animation Manager Component
 * 
 * This component manages multiple animations running in parallel. It provides
 * the animation logic and state management without UI controls.
 * 
 * Features:
 * - Multiple animations running simultaneously
 * - Centralized animation state management
 * - Configurable animation parameters
 * - Performance monitoring for multiple animations
 * - No UI controls (handled by OverlayMenu)
 */

'use client';

import { ANIMATION_MANAGER, DEFAULT_ANIMATION_CONFIG, type AnimationConfig } from '@/constants';
import { componentLogger } from '@/utils/logger';
import BubblingAnimation from './BubblingAnimation';
import SVGLineAnimation from './SVGLineAnimation';

/**
 * Props for the AnimationManager component
 */
interface AnimationManagerProps {
  /** Whether animations are globally active */
  isActive: boolean;
  /** Development mode for showing debug information */
  devMode?: boolean;
  /** Individual animation states from parent */
  animationStates: {
    line: boolean;
    bubbling: boolean;
  };
  /** Animation configuration */
  animationConfig?: AnimationConfig;
}

/**
 * Animation configuration interface
 */
interface AnimationItem {
  id: string;
  name: string;
  isActive: boolean;
  component: React.ReactNode;
}

/**
 * Animation manager component
 * 
 * Manages multiple animations running in parallel. All UI controls are handled
 * by the centralized OverlayMenu component.
 * 
 * @param isActive - Whether animations are globally active
 * @param devMode - Development mode for debug information
 * @param animationStates - Individual animation states from parent
 * @param onAnimationStateChange - Callback when animation states change
 * @param animationConfig - Animation configuration parameters
 * 
 * @example
 * ```typescript
 * <AnimationManager 
 *   isActive={true}
 *   devMode={false}
 *   animationStates={{ line: true, bubbling: true }}
 *   onAnimationStateChange={(id, state) => updateAnimation(id, state)}
 *   animationConfig={customConfig}
 * />
 * ```
 */
export default function AnimationManager({ 
  isActive, 
  devMode = false,
  animationStates,
  animationConfig = DEFAULT_ANIMATION_CONFIG
}: AnimationManagerProps) {
  // Component lifecycle logging
  componentLogger.component('AnimationManager', 'update', { 
    isActive, 
    devMode,
    animationStates,
    hasConfig: !!animationConfig
  });

  // Animation configurations
  const animations: AnimationItem[] = [
    {
      id: ANIMATION_MANAGER.animations.line.id,
      name: ANIMATION_MANAGER.animations.line.name,
      isActive: animationStates.line,
      component: (
        <SVGLineAnimation 
          isActive={isActive && animationStates.line} 
          devMode={devMode}
          config={animationConfig.svgLine}
        />
      )
    },
    {
      id: ANIMATION_MANAGER.animations.bubbling.id,
      name: ANIMATION_MANAGER.animations.bubbling.name,
      isActive: animationStates.bubbling,
      component: (
        <BubblingAnimation 
          isActive={isActive && animationStates.bubbling}
          config={animationConfig.bubbling}
        />
      )
    }
  ];

  return (
    <div 
      className="AnimationManager relative z-1" 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%',
        pointerEvents: 'none',
        zIndex: animationConfig.zIndexLayers.bubbling // Use bubbling layer as base
      }}
    >
      {/* Debug info - only show in dev mode */}
      {devMode && (
        <div 
          className={`fixed top-20 left-4 z-[${animationConfig.zIndexLayers.controls}] ${ANIMATION_MANAGER.debugPanel.background} backdrop-blur-md border ${ANIMATION_MANAGER.debugPanel.border} rounded-lg p-2 ${ANIMATION_MANAGER.debugPanel.textColor} ${ANIMATION_MANAGER.debugPanel.textSize}`}
        >
          <div className="font-semibold mb-1">Animation Debug:</div>
          <div>Global Active: {isActive ? 'YES' : 'NO'}</div>
          <div>Line Active: {animationStates.line ? 'YES' : 'NO'}</div>
          <div>Bubbling Active: {animationStates.bubbling ? 'YES' : 'NO'}</div>
          <div>Effective Line: {isActive && animationStates.line ? 'YES' : 'NO'}</div>
          <div>Effective Bubbling: {isActive && animationStates.bubbling ? 'YES' : 'NO'}</div>
          <div>Config Loaded: {animationConfig ? 'YES' : 'NO'}</div>
        </div>
      )}
      
      {/* Render all active animations */}
      {animations.map((animation) => (
        <div key={animation.id} className="animation-layer">
          {animation.component}
        </div>
      ))}
    </div>
  );
} 