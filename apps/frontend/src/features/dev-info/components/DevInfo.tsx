/**
 * Development Information Component
 * 
 * This component displays real-time development information including
 * environment details, service URLs, performance metrics, and build
 * information. It's designed to help developers understand the current
 * state of the application during development.
 * 
 * Features:
 * - Environment status display
 * - Service URL and port information
 * - Real-time performance monitoring
 * - Build timestamp display
 * - Collapsible interface
 * - Configuration-driven data
 */

'use client';

import { usePerformanceMonitor } from '@/features/performance/hooks/usePerformanceMonitor';
import { LAYOUT_CONFIG } from '@/shared/config/layout';
import { useConfig } from '@/shared/contexts/ConfigContext';
import { getPanelPositionStyles } from '@/shared/utils/positioning';
import { ChevronDown, ChevronUp, Database, Globe, Info, Monitor, Server } from 'lucide-react';
import { useState } from 'react';

/**
 * Props for the DevInfo component
 */
interface DevInfoProps {
  /** Whether the panel should start in collapsed state */
  isCollapsed?: boolean;
}

/**
 * Development information panel component
 * 
 * This component provides a comprehensive view of the application's
 * current state, including environment configuration, service endpoints,
 * performance metrics, and build information. It's designed to be
 * always visible during development to help with debugging and
 * understanding the application state.
 * 
 * The component uses the centralized configuration system to display
 * environment variables and the performance monitoring system to show
 * real-time performance metrics.
 * 
 * @param isCollapsed - Whether to start in collapsed state
 * 
 * @example
 * ```typescript
 * <DevInfo isCollapsed={false} />
 * ```
 */
export default function DevInfo({ isCollapsed = false }: DevInfoProps) {
  // Local state for panel collapse/expand
  const [collapsed, setCollapsed] = useState(isCollapsed);
  
  // Get performance metrics from the monitoring system
  const { fps, isLowPerformance } = usePerformanceMonitor();
  
  // Get environment configuration from context
  const config = useConfig();
  
  // Get layout configuration for positioning
  const layoutConfig = LAYOUT_CONFIG.devInfo;

  return (
    <>
      {/* Toggle Button - Always visible */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="bg-transparent backdrop-blur-sm border border-white/30 rounded-lg p-2 text-white hover:bg-white/10 transition-all duration-300 shadow-lg flex items-center gap-2"
        aria-label="Toggle development information panel"
      >
        <Info className="w-4 h-4" />
        <span className="text-xs font-medium">Dev Info</span>
        {collapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
      </button>

      {/* Information Panel - Conditionally rendered */}
      {!collapsed && (
        <div className={`${getPanelPositionStyles(layoutConfig)} bg-transparent backdrop-blur-md border border-white/30 rounded-lg p-4 min-w-[280px] shadow-lg`}>
          {/* Panel Header */}
          <h3 className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            Development Info
          </h3>
          
          {/* Environment Section */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/80 text-xs">Environment</span>
              <span className={`text-xs px-2 py-1 rounded ${
                config.environment === 'production' 
                  ? 'bg-green-500/20 text-green-300' 
                  : 'bg-blue-500/20 text-blue-300'
              }`}>
                {config.environment || 'Not set'}
              </span>
            </div>
          </div>

          {/* Service URLs and Ports Section */}
          <div className="mb-3 space-y-2">
            {/* Frontend Service */}
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-xs flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Frontend
              </span>
              <span className="text-white/60 text-xs">
                {config.frontend.url && config.frontend.port 
                  ? `${config.frontend.url}:${config.frontend.port}`
                  : 'Not configured'
                }
              </span>
            </div>
            
            {/* Backend Service */}
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-xs flex items-center gap-1">
                <Server className="w-3 h-3" />
                Backend
              </span>
              <span className="text-white/60 text-xs">
                {config.api.url || 'Not configured'}
              </span>
            </div>
            
            {/* API URL */}
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-xs flex items-center gap-1">
                <Database className="w-3 h-3" />
                API URL
              </span>
              <span className="text-white/60 text-xs truncate max-w-[120px]">
                {config.api.url || 'Not configured'}
              </span>
            </div>
          </div>

          {/* Performance Section */}
          <div className="mb-3 pt-2 border-t border-white/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/80 text-xs">Performance</span>
              <span className={`text-xs px-2 py-1 rounded ${
                isLowPerformance 
                  ? 'bg-red-500/20 text-red-300' 
                  : fps > 50 
                    ? 'bg-green-500/20 text-green-300'
                    : 'bg-yellow-500/20 text-yellow-300'
              }`}>
                {fps > 0 ? `${fps} FPS` : 'Measuring...'}
              </span>
            </div>
            {isLowPerformance && (
              <div className="text-red-300 text-xs mt-1">
                ⚠️ Low performance detected
              </div>
            )}
          </div>

          {/* Build Information Section */}
          <div className="pt-2 border-t border-white/20">
            <div className="text-white/60 text-xs">
              Build: {config.build.time ? new Date(config.build.time).toLocaleDateString() : 'Not available'}
            </div>
            <div className="text-white/40 text-xs mt-1">
              Next.js 15.3.5 • React 19
            </div>
          </div>
        </div>
      )}
    </>
  );
} 