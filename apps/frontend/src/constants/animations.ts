/**
 * Animation Configuration System
 * 
 * This file contains all animation parameters that can be customized in real-time.
 * The configuration is structured for easy editing and provides type safety.
 */

// =============================================================================
// ANIMATION CONFIGURATION TYPES
// =============================================================================

export interface SVGLineConfig {
  strokeWidth: number;
  animationDuration: number;
  gradientAnimationDuration: number;
  gradientColors: {
    start: string;
    middle: string;
    end: string;
  };
  gradientOpacities: {
    start: number;
    middle: number;
    end: number;
  };
  zIndex: number;
  devPath: {
    strokeColor: string;
    strokeWidth: number;
    strokeOpacity: number;
    dashArray: string;
  };
}

export interface BubblingConfig {
  bubbleCount: number;
  maxSize: number;
  minSize: number;
  durationRange: [number, number];
  opacityRange: [number, number];
  zIndex: number;
  movementDistancePercentage: number;
  maxDelay: number;
  // Liquid stain shape parameters
  liquidStain: {
    curvesRange: [number, number]; // Range for number of curves per bubble
    irregularityRange: [number, number]; // Range for shape irregularity
    strokeWidth: number; // Stroke width for liquid stain outline
    strokeOpacity: number; // Stroke opacity for liquid stain outline
  };
  gradient: {
    cx: string;
    cy: string;
    r: string;
    stops: Array<{
      offset: string;
      color: string;
    }>;
  };
}

export interface AnimationManagerConfig {
  zIndex: number;
  animations: {
    line: {
      id: string;
      name: string;
      icon: string;
    };
    bubbling: {
      id: string;
      name: string;
      icon: string;
    };
  };
  controls: {
    activeStyles: {
      background: string;
      border: string;
      text: string;
      hover: string;
    };
    inactiveStyles: {
      background: string;
      border: string;
      text: string;
      hover: string;
    };
  };
  debugPanel: {
    background: string;
    border: string;
    textColor: string;
    textSize: string;
  };
}

export interface PerformanceConfig {
  minFpsThreshold: number;
  targetFps: number;
  monitoringInterval: number;
}

export interface ZIndexLayers {
  background: number;
  bubbling: number;
  svgLine: number;
  content: number;
  controls: number;
}

// =============================================================================
// DEFAULT ANIMATION CONFIGURATION
// =============================================================================

export const DEFAULT_ANIMATION_CONFIG = {
  svgLine: {
    strokeWidth: 4,
    animationDuration: 4,
    gradientAnimationDuration: 3,
    gradientColors: {
      start: '#60a5fa',
      middle: '#a78bfa',
      end: '#fbbf24'
    },
    gradientOpacities: {
      start: 0.8,
      middle: 0.6,
      end: 0.8
    },
    zIndex: 2,
    devPath: {
      strokeColor: '#ffffff',
      strokeWidth: 1,
      strokeOpacity: 0.2,
      dashArray: '5,5'
    }
  } as SVGLineConfig,

  bubbling: {
    bubbleCount: 12,
    maxSize: 80,
    minSize: 25,
    durationRange: [10, 18] as [number, number],
    opacityRange: [0.08, 0.35] as [number, number],
    zIndex: 1,
    movementDistancePercentage: 0.3,
    maxDelay: 5,
    liquidStain: {
      curvesRange: [6, 12] as [number, number], // 6-12 curves per bubble
      irregularityRange: [0.1, 0.3] as [number, number], // 10-30% irregularity
      strokeWidth: 0.5, // Thin stroke for liquid appearance
      strokeOpacity: 0.1 // Subtle stroke opacity
    },
    gradient: {
      cx: '30%',
      cy: '30%',
      r: '70%',
      stops: [
        { offset: '0%', color: 'rgba(255, 255, 255, 0.8)' },
        { offset: '70%', color: 'rgba(255, 255, 255, 0.3)' },
        { offset: '100%', color: 'rgba(255, 255, 255, 0.1)' }
      ]
    }
  } as BubblingConfig,

  animationManager: {
    zIndex: 1,
    animations: {
      line: {
        id: 'line',
        name: 'SVG Line',
        icon: '📈'
      },
      bubbling: {
        id: 'bubbling',
        name: 'Bubbling',
        icon: '🫧'
      }
    },
    controls: {
      activeStyles: {
        background: 'bg-blue-500/20',
        border: 'border-blue-400/40',
        text: 'text-blue-400',
        hover: 'hover:bg-blue-400/30'
      },
      inactiveStyles: {
        background: 'bg-white/10',
        border: 'border-white/20',
        text: 'text-white',
        hover: 'hover:bg-white/20'
      }
    },
    debugPanel: {
      background: 'bg-black/20',
      border: 'border-white/20',
      textColor: 'text-white',
      textSize: 'text-xs'
    }
  } as AnimationManagerConfig,

  performance: {
    minFpsThreshold: 30,
    targetFps: 60,
    monitoringInterval: 1000
  } as PerformanceConfig,

  zIndexLayers: {
    background: 0,
    bubbling: 1,
    svgLine: 2,
    content: 10,
    controls: 99999
  } as ZIndexLayers
} as const;

// =============================================================================
// CONFIGURATION VALIDATION
// =============================================================================

export function validateAnimationConfig(config: typeof DEFAULT_ANIMATION_CONFIG) {
  // Validate SVG Line config
  if (config.svgLine.strokeWidth < 0) {
    throw new Error('SVG Line stroke width must be positive');
  }
  if (config.svgLine.animationDuration < 0) {
    throw new Error('SVG Line animation duration must be positive');
  }

  // Validate Bubbling config
  if (config.bubbling.bubbleCount < 1) {
    throw new Error('Bubble count must be at least 1');
  }
  if (config.bubbling.maxSize < config.bubbling.minSize) {
    throw new Error('Max bubble size must be greater than min size');
  }
  if (config.bubbling.durationRange[0] > config.bubbling.durationRange[1]) {
    throw new Error('Duration range start must be less than end');
  }

  // Validate Performance config
  if (config.performance.minFpsThreshold < 0) {
    throw new Error('Min FPS threshold must be positive');
  }
  if (config.performance.targetFps < config.performance.minFpsThreshold) {
    throw new Error('Target FPS must be greater than min FPS threshold');
  }

  return true;
}

// =============================================================================
// CONFIGURATION HELPERS
// =============================================================================

export function createAnimationConfig(overrides?: Partial<typeof DEFAULT_ANIMATION_CONFIG>) {
  const config = {
    ...DEFAULT_ANIMATION_CONFIG,
    ...overrides,
    svgLine: {
      ...DEFAULT_ANIMATION_CONFIG.svgLine,
      ...overrides?.svgLine
    },
    bubbling: {
      ...DEFAULT_ANIMATION_CONFIG.bubbling,
      ...overrides?.bubbling
    },
    animationManager: {
      ...DEFAULT_ANIMATION_CONFIG.animationManager,
      ...overrides?.animationManager
    },
    performance: {
      ...DEFAULT_ANIMATION_CONFIG.performance,
      ...overrides?.performance
    },
    zIndexLayers: {
      ...DEFAULT_ANIMATION_CONFIG.zIndexLayers,
      ...overrides?.zIndexLayers
    }
  };

  validateAnimationConfig(config);
  return config;
}

// =============================================================================
// LEGACY EXPORTS (for backward compatibility)
// =============================================================================

export const SVG_LINE_ANIMATION = DEFAULT_ANIMATION_CONFIG.svgLine;
export const BUBBLING_ANIMATION = DEFAULT_ANIMATION_CONFIG.bubbling;
export const ANIMATION_MANAGER = DEFAULT_ANIMATION_CONFIG.animationManager;
export const PERFORMANCE = DEFAULT_ANIMATION_CONFIG.performance;
export const Z_INDEX_LAYERS = DEFAULT_ANIMATION_CONFIG.zIndexLayers;

// =============================================================================
// CONFIGURATION TYPES FOR EXPORT
// =============================================================================

export type AnimationConfig = typeof DEFAULT_ANIMATION_CONFIG;
export type AnimationConfigKey = keyof AnimationConfig; 