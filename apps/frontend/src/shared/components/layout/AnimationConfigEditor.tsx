/**
 * Animation Configuration Editor
 * 
 * A real-time editor for animation parameters that appears in dev mode.
 * Provides sliders, inputs, and color pickers for all animation settings.
 */

'use client';

import { DEFAULT_ANIMATION_CONFIG, type AnimationConfig } from '@/constants';
import { animationLogger } from '@/utils/logger';
import { useEffect, useState } from 'react';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface AnimationConfigEditorProps {
  config: AnimationConfig;
  onConfigChange: (newConfig: AnimationConfig) => void;
}

interface ConfigInputProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  unit?: string;
}

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

// =============================================================================
// STYLES
// =============================================================================

const styles = {
  container: 'space-y-4',
  section: 'space-y-3 p-3 bg-white/5 rounded border border-white/10',
  sectionTitle: 'text-white text-sm font-semibold mb-2',
  inputGroup: 'space-y-2',
  inputRow: 'flex items-center justify-between gap-2',
  label: 'text-white text-xs min-w-0 flex-1',
  input: 'bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xs w-20',
  slider: 'flex-1 bg-white/10 rounded-lg h-2 appearance-none cursor-pointer',
  colorInput: 'w-8 h-6 rounded border border-white/20 cursor-pointer',
  value: 'text-white text-xs min-w-0 text-right',
  resetButton: 'bg-red-500/20 border border-red-400/40 text-red-400 rounded px-2 py-1 text-xs hover:bg-red-400/30 transition-colors'
} as const;

// =============================================================================
// REUSABLE INPUT COMPONENTS
// =============================================================================

function ConfigInput({ label, value, min = 0, max = 100, step = 1, onChange, unit = '' }: ConfigInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    console.log('🔍 ConfigInput: Slider changed', { label, oldValue: value, newValue, unit });
    
    animationLogger.animation('ConfigInput', 'slider change', {
      label,
      oldValue: value,
      newValue,
      unit
    });
    onChange(newValue);
  };

  return (
    <div className={styles.inputRow}>
      <label className={styles.label}>{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        className={styles.slider}
      />
      <span className={styles.value}>
        {unit === '%' ? `${value.toFixed(2)}%` : `${value}${unit}`}
      </span>
    </div>
  );
}

function ColorInput({ label, value, onChange }: ColorInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log('🔍 ColorInput: Color changed', { label, oldValue: value, newValue });
    
    animationLogger.animation('ColorInput', 'color change', {
      label,
      oldValue: value,
      newValue
    });
    onChange(newValue);
  };

  return (
    <div className={styles.inputRow}>
      <label className={styles.label}>{label}</label>
      <input
        type="color"
        value={value}
        onChange={handleChange}
        className={styles.colorInput}
      />
      <span className={styles.value}>{value}</span>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function AnimationConfigEditor({ config, onConfigChange }: AnimationConfigEditorProps) {
  const [localConfig, setLocalConfig] = useState<AnimationConfig>(config);

  // Immediate debug logging to test if logger is working
  console.log('🔍 AnimationConfigEditor: Component rendered', {
    config,
    localConfig,
    hasChanges: JSON.stringify(config) !== JSON.stringify(localConfig)
  });

  // Track when props change
  useEffect(() => {
    console.log('🔍 AnimationConfigEditor: Props changed', { config, localConfig });
    
    animationLogger.animation('ConfigEditor', 'props changed', {
      newConfig: config,
      localConfig,
      hasChanges: JSON.stringify(config) !== JSON.stringify(localConfig)
    });
    
    // Update local state if props changed
    if (JSON.stringify(config) !== JSON.stringify(localConfig)) {
      console.log('🔍 AnimationConfigEditor: Syncing local state with props');
      animationLogger.animation('ConfigEditor', 'syncing local state with props');
      setLocalConfig(config);
    }
  }, [config]);

  // Track when local state changes
  useEffect(() => {
    console.log('🔍 AnimationConfigEditor: Local state updated', { localConfig });
    
    animationLogger.animation('ConfigEditor', 'local state updated', {
      localConfig,
      configKeys: Object.keys(localConfig)
    });
  }, [localConfig]);

  // Component mount/unmount logging
  useEffect(() => {
    console.log('🔍 AnimationConfigEditor: Component mounted', { config });
    
    animationLogger.component('AnimationConfigEditor', 'mount', {
      initialConfig: config,
      configKeys: Object.keys(config)
    });
    
    return () => {
      console.log('🔍 AnimationConfigEditor: Component unmounting');
      animationLogger.component('AnimationConfigEditor', 'unmount');
    };
  }, []);

  // =============================================================================
  // CONFIG UPDATE HELPERS
  // =============================================================================

  const updateConfig = (updates: Partial<AnimationConfig>) => {
    try {
      console.log('🔍 AnimationConfigEditor: updateConfig called', { updates, currentConfig: localConfig });
      
      animationLogger.animation('ConfigEditor', 'updateConfig called', {
        updates,
        currentConfig: localConfig
      });

      const newConfig = {
        ...localConfig,
        ...updates,
        svgLine: {
          ...localConfig.svgLine,
          ...updates.svgLine
        },
        bubbling: {
          ...localConfig.bubbling,
          ...updates.bubbling
        }
      };
      
      console.log('🔍 AnimationConfigEditor: New config created', { newConfig });
      
      animationLogger.animation('ConfigEditor', 'new config created', {
        newConfig,
        hasChanges: JSON.stringify(newConfig) !== JSON.stringify(localConfig)
      });
      
      setLocalConfig(newConfig);
      onConfigChange(newConfig);
      
      console.log('🔍 AnimationConfigEditor: Config updated successfully');
      
      animationLogger.animation('ConfigEditor', 'config updated successfully', {
        updateType: Object.keys(updates).join(', '),
        configKeys: Object.keys(newConfig)
      });
    } catch (error) {
      console.error('🔍 AnimationConfigEditor: updateConfig failed', error);
      
      animationLogger.error('updateConfig failed', {
        error: error instanceof Error ? error.message : String(error),
        updates,
        currentConfig: localConfig
      });
    }
  };

  const resetToDefaults = () => {
    try {
      console.log('🔍 AnimationConfigEditor: Reset to defaults called');
      
      animationLogger.animation('ConfigEditor', 'reset to defaults called', {
        currentConfig: localConfig,
        defaultConfig: DEFAULT_ANIMATION_CONFIG
      });
      
      setLocalConfig(DEFAULT_ANIMATION_CONFIG);
      onConfigChange(DEFAULT_ANIMATION_CONFIG);
      
      console.log('🔍 AnimationConfigEditor: Reset to defaults successful');
      
      animationLogger.animation('ConfigEditor', 'reset to defaults successful');
    } catch (error) {
      console.error('🔍 AnimationConfigEditor: Reset to defaults failed', error);
      
      animationLogger.error('reset to defaults failed', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  // Test function to verify logging is working
  const testLogging = () => {
    console.log('🔍 AnimationConfigEditor: Test logging button clicked');
    animationLogger.animation('ConfigEditor', 'test logging', { test: true });
    animationLogger.info('Test info message');
    animationLogger.warn('Test warning message');
    animationLogger.error('Test error message');
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className={styles.container}>
      {/* Reset Button */}
      <div className="flex justify-end gap-2">
        <button
          onClick={testLogging}
          className="bg-blue-500/20 border border-blue-400/40 text-blue-400 rounded px-2 py-1 text-xs hover:bg-blue-400/30 transition-colors"
          title="Test logging functionality"
        >
          Test Logging
        </button>
        <button
          onClick={resetToDefaults}
          className={styles.resetButton}
          title="Reset all settings to defaults"
        >
          Reset to Defaults
        </button>
      </div>

      {/* SVG Line Animation Config */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>SVG Line Animation</h4>
        <div className={styles.inputGroup}>
          <ConfigInput
            label="Stroke Width"
            value={localConfig.svgLine.strokeWidth}
            min={1}
            max={20}
            step={1}
            onChange={(value) => updateConfig({
              svgLine: { ...localConfig.svgLine, strokeWidth: value }
            })}
            unit="px"
          />
          
          <ConfigInput
            label="Animation Duration"
            value={localConfig.svgLine.animationDuration}
            min={1}
            max={10}
            step={0.5}
            onChange={(value) => updateConfig({
              svgLine: { ...localConfig.svgLine, animationDuration: value }
            })}
            unit="s"
          />
          
          <ConfigInput
            label="Gradient Duration"
            value={localConfig.svgLine.gradientAnimationDuration}
            min={1}
            max={10}
            step={0.5}
            onChange={(value) => updateConfig({
              svgLine: { ...localConfig.svgLine, gradientAnimationDuration: value }
            })}
            unit="s"
          />
        </div>
        
        {/* Gradient Colors */}
        <div className={styles.inputGroup}>
          <h5 className="text-white text-xs font-medium mb-2">Gradient Colors</h5>
          <ColorInput
            label="Start Color"
            value={localConfig.svgLine.gradientColors.start}
            onChange={(value) => updateConfig({
              svgLine: {
                ...localConfig.svgLine,
                gradientColors: { ...localConfig.svgLine.gradientColors, start: value }
              }
            })}
          />
          <ColorInput
            label="Middle Color"
            value={localConfig.svgLine.gradientColors.middle}
            onChange={(value) => updateConfig({
              svgLine: {
                ...localConfig.svgLine,
                gradientColors: { ...localConfig.svgLine.gradientColors, middle: value }
              }
            })}
          />
          <ColorInput
            label="End Color"
            value={localConfig.svgLine.gradientColors.end}
            onChange={(value) => updateConfig({
              svgLine: {
                ...localConfig.svgLine,
                gradientColors: { ...localConfig.svgLine.gradientColors, end: value }
              }
            })}
          />
        </div>
      </div>

      {/* Bubbling Animation Config */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Bubbling Animation</h4>
        <div className={styles.inputGroup}>
          <ConfigInput
            label="Bubble Count"
            value={localConfig.bubbling.bubbleCount}
            min={1}
            max={50}
            step={1}
            onChange={(value) => updateConfig({
              bubbling: { ...localConfig.bubbling, bubbleCount: value }
            })}
          />
          
          <ConfigInput
            label="Max Size"
            value={localConfig.bubbling.maxSize}
            min={10}
            max={200}
            step={5}
            onChange={(value) => updateConfig({
              bubbling: { ...localConfig.bubbling, maxSize: value }
            })}
            unit="px"
          />
          
          <ConfigInput
            label="Min Size"
            value={localConfig.bubbling.minSize}
            min={5}
            max={100}
            step={5}
            onChange={(value) => updateConfig({
              bubbling: { ...localConfig.bubbling, minSize: value }
            })}
            unit="px"
          />
          
          <ConfigInput
            label="Movement Distance"
            value={localConfig.bubbling.movementDistancePercentage * 100}
            min={10}
            max={100}
            step={5}
            onChange={(value) => updateConfig({
              bubbling: { ...localConfig.bubbling, movementDistancePercentage: value / 100 }
            })}
            unit="%"
          />
          
          <ConfigInput
            label="Max Delay"
            value={localConfig.bubbling.maxDelay}
            min={0}
            max={10}
            step={0.5}
            onChange={(value) => updateConfig({
              bubbling: { ...localConfig.bubbling, maxDelay: value }
            })}
            unit="s"
          />
        </div>
        
        {/* Duration Range */}
        <div className={styles.inputGroup}>
          <h5 className="text-white text-xs font-medium mb-2">Duration Range</h5>
          <ConfigInput
            label="Min Duration"
            value={localConfig.bubbling.durationRange[0]}
            min={1}
            max={30}
            step={1}
            onChange={(value) => updateConfig({
              bubbling: {
                ...localConfig.bubbling,
                durationRange: [value, localConfig.bubbling.durationRange[1]]
              }
            })}
            unit="s"
          />
          <ConfigInput
            label="Max Duration"
            value={localConfig.bubbling.durationRange[1]}
            min={1}
            max={30}
            step={1}
            onChange={(value) => updateConfig({
              bubbling: {
                ...localConfig.bubbling,
                durationRange: [localConfig.bubbling.durationRange[0], value]
              }
            })}
            unit="s"
          />
        </div>
        
        {/* Opacity Range */}
        <div className={styles.inputGroup}>
          <h5 className="text-white text-xs font-medium mb-2">Opacity Range</h5>
          <ConfigInput
            label="Min Opacity"
            value={localConfig.bubbling.opacityRange[0] * 100}
            min={1}
            max={100}
            step={1}
            onChange={(value) => updateConfig({
              bubbling: {
                ...localConfig.bubbling,
                opacityRange: [value / 100, localConfig.bubbling.opacityRange[1]]
              }
            })}
            unit="%"
          />
          <ConfigInput
            label="Max Opacity"
            value={localConfig.bubbling.opacityRange[1] * 100}
            min={1}
            max={100}
            step={1}
            onChange={(value) => updateConfig({
              bubbling: {
                ...localConfig.bubbling,
                opacityRange: [localConfig.bubbling.opacityRange[0], value / 100]
              }
            })}
            unit="%"
          />
        </div>
        
        {/* Liquid Stain Shape */}
        <div className={styles.inputGroup}>
          <h5 className="text-white text-xs font-medium mb-2">Liquid Stain Shape</h5>
          <ConfigInput
            label="Min Curves"
            value={localConfig.bubbling.liquidStain.curvesRange[0]}
            min={3}
            max={20}
            step={1}
            onChange={(value) => updateConfig({
              bubbling: {
                ...localConfig.bubbling,
                liquidStain: {
                  ...localConfig.bubbling.liquidStain,
                  curvesRange: [value, localConfig.bubbling.liquidStain.curvesRange[1]]
                }
              }
            })}
          />
          <ConfigInput
            label="Max Curves"
            value={localConfig.bubbling.liquidStain.curvesRange[1]}
            min={3}
            max={20}
            step={1}
            onChange={(value) => updateConfig({
              bubbling: {
                ...localConfig.bubbling,
                liquidStain: {
                  ...localConfig.bubbling.liquidStain,
                  curvesRange: [localConfig.bubbling.liquidStain.curvesRange[0], value]
                }
              }
            })}
          />
          <ConfigInput
            label="Min Irregularity"
            value={localConfig.bubbling.liquidStain.irregularityRange[0] * 100}
            min={0}
            max={50}
            step={1}
            onChange={(value) => updateConfig({
              bubbling: {
                ...localConfig.bubbling,
                liquidStain: {
                  ...localConfig.bubbling.liquidStain,
                  irregularityRange: [value / 100, localConfig.bubbling.liquidStain.irregularityRange[1]]
                }
              }
            })}
            unit="%"
          />
          <ConfigInput
            label="Max Irregularity"
            value={localConfig.bubbling.liquidStain.irregularityRange[1] * 100}
            min={0}
            max={50}
            step={1}
            onChange={(value) => updateConfig({
              bubbling: {
                ...localConfig.bubbling,
                liquidStain: {
                  ...localConfig.bubbling.liquidStain,
                  irregularityRange: [localConfig.bubbling.liquidStain.irregularityRange[0], value / 100]
                }
              }
            })}
            unit="%"
          />
          <ConfigInput
            label="Stroke Width"
            value={localConfig.bubbling.liquidStain.strokeWidth}
            min={0}
            max={3}
            step={0.1}
            onChange={(value) => updateConfig({
              bubbling: {
                ...localConfig.bubbling,
                liquidStain: {
                  ...localConfig.bubbling.liquidStain,
                  strokeWidth: value
                }
              }
            })}
            unit="px"
          />
          <ConfigInput
            label="Stroke Opacity"
            value={localConfig.bubbling.liquidStain.strokeOpacity * 100}
            min={0}
            max={100}
            step={1}
            onChange={(value) => updateConfig({
              bubbling: {
                ...localConfig.bubbling,
                liquidStain: {
                  ...localConfig.bubbling.liquidStain,
                  strokeOpacity: value / 100
                }
              }
            })}
            unit="%"
          />
        </div>
      </div>

      {/* Performance Config */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Performance</h4>
        <div className={styles.inputGroup}>
          <ConfigInput
            label="Min FPS Threshold"
            value={localConfig.performance.minFpsThreshold}
            min={15}
            max={60}
            step={5}
            onChange={(value) => updateConfig({
              performance: { ...localConfig.performance, minFpsThreshold: value }
            })}
            unit=" FPS"
          />
          
          <ConfigInput
            label="Target FPS"
            value={localConfig.performance.targetFps}
            min={30}
            max={120}
            step={10}
            onChange={(value) => updateConfig({
              performance: { ...localConfig.performance, targetFps: value }
            })}
            unit=" FPS"
          />
        </div>
      </div>
    </div>
  );
} 