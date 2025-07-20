/**
 * Inline Development Info Component
 * 
 * This is a simplified version of the DevInfo component designed to work
 * within the OverlayMenu system. It provides the same information but
 * with inline styling and no positioning wrapper.
 * 
 * Features:
 * - Environment information display
 * - Performance metrics
 * - Build information
 * - Simplified inline styling
 */

'use client';

import { usePerformanceMonitor } from '@/features/performance/hooks/usePerformanceMonitor';
import { useConfig } from '@/shared/contexts/ConfigContext';

/**
 * Inline development info component
 * 
 * This component displays development information in a simplified format
 * designed to work within the OverlayMenu system. It shows environment
 * details, performance metrics, and build information.
 * 
 * @returns Development information display
 * 
 * @example
 * ```typescript
 * <InlineDevInfo />
 * ```
 */
export default function InlineDevInfo() {
  const { fps, isLowPerformance } = usePerformanceMonitor();
  const config = useConfig();

  return (
    <div className="InlineDevInfo space-y-3 text-xs">
      {/* Environment Info */}
      <div className="InlineDevInfo-environment">
        <h4 className="text-white font-medium mb-2">Environment</h4>
        <div className="space-y-1 text-white/70">
          <div>Mode: {config.environment}</div>
          <div>Port: {config.frontend.port}</div>
          <div>API URL: {config.api.url}</div>
        </div>
      </div>

      {/* Performance Info */}
      <div className="InlineDevInfo-performance">
        <h4 className="text-white font-medium mb-2">Performance</h4>
        <div className="space-y-1 text-white/70">
          <div>FPS: {fps}</div>
          <div className={isLowPerformance ? 'text-yellow-400' : 'text-green-400'}>
            Status: {isLowPerformance ? 'Low Performance' : 'Good Performance'}
          </div>
        </div>
      </div>

      {/* Build Info */}
      <div className="InlineDevInfo-build">
        <h4 className="text-white font-medium mb-2">Build</h4>
        <div className="space-y-1 text-white/70">
          <div>Version: Development</div>
          <div>Build Time: {config.build.time || 'Unknown'}</div>
        </div>
      </div>
    </div>
  );
} 