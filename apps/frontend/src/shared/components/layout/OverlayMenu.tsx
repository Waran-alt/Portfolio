/**
 * Overlay Menu Component
 * 
 * A centralized menu system for all overlay controls with a clean, maintainable structure.
 * Uses component composition and proper TypeScript patterns for better maintainability.
 */

'use client';

import { ANIMATION_MANAGER, DEFAULT_ANIMATION_CONFIG, type AnimationConfig } from '@/constants';
import ApiTest from '@/features/api-test/components/ApiTest';
import { animationLogger } from '@/utils/logger';
import { Activity, Bug, ChevronDown, ChevronUp, Code, Info, Palette, Pause, Play, Settings, Wifi, Wrench } from 'lucide-react';
import { useState } from 'react';
import AnimationConfigEditor from './AnimationConfigEditor';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface OverlayMenuProps {
  globalAnimationActive: boolean;
  onToggleGlobalAnimation: () => void;
  devMode: boolean;
  onToggleDevMode: () => void;
  animationStates: {
    line: boolean;
    bubbling: boolean;
  };
  onToggleAnimation: (animationId: string) => void;
  devInfo?: React.ReactNode;
  performanceIndicator?: React.ReactNode;
  animationConfig?: AnimationConfig;
  onAnimationConfigChange?: (config: AnimationConfig) => void;
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

interface ControlButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  variant?: 'default' | 'dev' | 'animation';
}

// =============================================================================
// STYLES
// =============================================================================

const styles = {
  // Layout
  container: 'fixed top-4 right-4 z-[99999]',
  panel: 'absolute top-12 right-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg min-w-[300px] max-w-[400px] shadow-lg max-h-[80vh] overflow-y-auto',
  header: 'flex items-center justify-between my-2 px-3',
  content: 'space-y-1',
  sectionContent: 'm-1 px-2 py-1 bg-white/5 rounded space-y-1',
  
  // Buttons
  toggle: 'bg-white/10 backdrop-blur-md border border-white/20 rounded-full p-2 text-white hover:bg-white/20 transition-all duration-300 shadow-lg',
  section: 'w-full flex items-center justify-between p-1 rounded hover:bg-white/10 transition-colors text-white text-sm',
  close: 'text-white/60 hover:text-white transition-colors',
  
  // Control buttons
  control: {
    base: 'backdrop-blur-md border rounded-full p-1 transition-all duration-300',
    default: 'bg-white/10 border-white/20 text-white hover:bg-white/20',
    active: 'bg-blue-500/20 border-blue-400/40 text-blue-400',
    dev: 'bg-green-500/20 border-green-400/40 text-green-400'
  },
  
  // Text
  title: 'text-white font-semibold text-sm',
  label: 'text-white text-xs',
  controlRow: 'flex items-center justify-between'
} as const;

// =============================================================================
// REUSABLE COMPONENTS
// =============================================================================

/**
 * Collapsible section component
 */
function Section({ title, icon, isOpen, onToggle, children }: SectionProps) {
  return (
    <div>
      <button
        onClick={onToggle}
        className={`OverlayMenu-section-button ${styles.section}`}
      >
        <span className="flex items-center gap-2">
          {icon}
          {title}
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {isOpen && (
        <div className={styles.sectionContent}>
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Control button component
 */
function ControlButton({ label, isActive, onClick, icon, variant = 'default' }: ControlButtonProps) {
  const getButtonClass = () => {
    const base = styles.control.base;
    switch (variant) {
      case 'dev':
        return `${base} ${isActive ? styles.control.dev : styles.control.default}`;
      case 'animation':
        return `${base} ${isActive ? styles.control.active : styles.control.default}`;
      default:
        return `${base} ${styles.control.default}`;
    }
  };

  return (
    <div className={styles.controlRow}>
      <span className={styles.label}>{label}</span>
      <button
        onClick={onClick}
        className={getButtonClass()}
        aria-label={`Toggle ${label}`}
      >
        {icon}
      </button>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function OverlayMenu({
  globalAnimationActive,
  onToggleGlobalAnimation,
  devMode,
  onToggleDevMode,
  animationStates,
  onToggleAnimation,
  devInfo,
  performanceIndicator,
  animationConfig = DEFAULT_ANIMATION_CONFIG,
  onAnimationConfigChange
}: OverlayMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (!isOpen) setActiveSection(null);
  };

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const handleGlobalAnimationToggle = () => {
    animationLogger.animation('OverlayMenu', 'global toggle', { 
      currentState: globalAnimationActive,
      newState: !globalAnimationActive 
    });
    onToggleGlobalAnimation();
  };

  const handleDevModeToggle = () => {
    animationLogger.animation('OverlayMenu', 'dev mode toggle', { 
      currentState: devMode,
      newState: !devMode 
    });
    onToggleDevMode();
  };

  const handleAnimationToggle = (animationId: string) => {
    animationLogger.animation('OverlayMenu', 'individual toggle', { 
      animationId,
      currentState: animationStates[animationId as keyof typeof animationStates]
    });
    onToggleAnimation(animationId);
  };

  const handleAnimationConfigChange = (newConfig: AnimationConfig) => {
    if (onAnimationConfigChange) {
      onAnimationConfigChange(newConfig);
    }
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className={styles.container}>
      {/* Toggle Button */}
      <button
        onClick={toggleMenu}
        className={`OverlayMenu-toggle ${styles.toggle}`}
        aria-label="Toggle overlay menu"
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Menu Panel */}
      {isOpen && (
        <div className={styles.panel}>
          {/* Header */}
          <div className={styles.header}>
            <h3 className={styles.title}>Overlay Controls</h3>

            <ControlButton
              label=""
              isActive={devMode}
              onClick={handleDevModeToggle}
              icon={devMode ? <Bug className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
              variant="dev"
            />
            <button
              onClick={toggleMenu}
              className={`OverlayMenu-close ${styles.close}`}
              aria-label="Close menu"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className={styles.content}>
            {/* Global Controls */}
            <Section
              title="Global Controls"
              icon={<Activity className="w-4 h-4" />}
              isOpen={activeSection === 'global'}
              onToggle={() => toggleSection('global')}
            >
              <ControlButton
                label="Global Animation"
                isActive={globalAnimationActive}
                onClick={handleGlobalAnimationToggle}
                icon={globalAnimationActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              />
            </Section>

            {/* Individual Animations */}
            <Section
              title="Individual Animations"
              icon={<Activity className="w-4 h-4" />}
              isOpen={activeSection === 'animations'}
              onToggle={() => toggleSection('animations')}
            >
              <ControlButton
                label={ANIMATION_MANAGER.animations.line.name}
                isActive={animationStates.line}
                onClick={() => handleAnimationToggle(ANIMATION_MANAGER.animations.line.id)}
                icon={ANIMATION_MANAGER.animations.line.icon}
                variant="animation"
              />
              
              <ControlButton
                label={ANIMATION_MANAGER.animations.bubbling.name}
                isActive={animationStates.bubbling}
                onClick={() => handleAnimationToggle(ANIMATION_MANAGER.animations.bubbling.id)}
                icon={ANIMATION_MANAGER.animations.bubbling.icon}
                variant="animation"
              />
            </Section>

            {/* Animation Configuration (Dev Mode Only) */}
            {devMode && onAnimationConfigChange && (
              <Section
                title="Animation Config"
                icon={<Palette className="w-4 h-4" />}
                isOpen={activeSection === 'config'}
                onToggle={() => toggleSection('config')}
              >
                <div className="max-h-96 overflow-y-auto">
                  <AnimationConfigEditor
                    config={animationConfig}
                    onConfigChange={handleAnimationConfigChange}
                  />
                </div>
              </Section>
            )}

            {/* Development Info */}
            {devInfo && (
              <Section
                title="Development Info"
                icon={<Info className="w-4 h-4" />}
                isOpen={activeSection === 'dev'}
                onToggle={() => toggleSection('dev')}
              >
                {devInfo}
              </Section>
            )}

            {/* Performance */}
            {performanceIndicator && (
              <Section
                title="Performance"
                icon={<Activity className="w-4 h-4" />}
                isOpen={activeSection === 'performance'}
                onToggle={() => toggleSection('performance')}
              >
                {performanceIndicator}
              </Section>
            )}

            {/* API Test */}
            <Section
              title="API Test"
              icon={<Wifi className="w-4 h-4" />}
              isOpen={activeSection === 'api-test'}
              onToggle={() => toggleSection('api-test')}
            >
              <ApiTest />
            </Section>

            {/* SVG Test */}
            <Section
              title="SVG Test"
              icon={<Code className="w-4 h-4" />}
              isOpen={activeSection === 'svg-test'}
              onToggle={() => toggleSection('svg-test')}
            >
              <div className="text-white text-xs space-y-2">
                <p>Interactive SVG path testing with different curved shape methods.</p>
                <a
                  href="/svg-test"
                  className="inline-block bg-blue-500/20 border border-blue-400/40 text-blue-400 px-3 py-1 rounded text-xs hover:bg-blue-500/30 transition-colors"
                >
                  Open SVG Test Lab
                </a>
              </div>
            </Section>
          </div>
        </div>
      )}
    </div>
  );
} 