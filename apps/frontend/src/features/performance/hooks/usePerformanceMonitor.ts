/**
 * Performance Monitoring Hook
 * 
 * This hook provides real-time performance monitoring capabilities for the
 * application. It measures frame rate (FPS) and provides alerts when
 * performance drops below acceptable thresholds.
 * 
 * Features:
 * - Real-time FPS monitoring
 * - Performance threshold detection
 * - Automatic cleanup on unmount
 * - Client-side only execution
 * - Low performance alerts
 */

'use client';

import { useEffect, useState } from 'react';

/**
 * Performance monitoring hook
 * 
 * This hook continuously monitors the application's frame rate and provides
 * real-time feedback about performance. It uses requestAnimationFrame to
 * measure actual frame rates and provides alerts when performance drops
 * below acceptable thresholds.
 * 
 * The hook is designed to be lightweight and only runs on the client side
 * to prevent hydration mismatches. It automatically cleans up its resources
 * when the component unmounts.
 * 
 * @returns Object containing current FPS and low performance flag
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { fps, isLowPerformance } = usePerformanceMonitor();
 *   
 *   return (
 *     <div>
 *       <p>Current FPS: {fps}</p>
 *       {isLowPerformance && <p>⚠️ Low performance detected</p>}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example
 * ```typescript
 * function PerformanceIndicator() {
 *   const { fps, isLowPerformance } = usePerformanceMonitor();
 *   
 *   if (!isLowPerformance) return null;
 *   
 *   return (
 *     <div className="performance-warning">
 *       Low performance: {fps} FPS
 *     </div>
 *   );
 * }
 * ```
 */
export function usePerformanceMonitor() {
  // Current frame rate measurement
  const [fps, setFps] = useState(0);
  
  // Flag indicating if performance is below threshold
  const [isLowPerformance, setIsLowPerformance] = useState(false);

  useEffect(() => {
    // Performance measurement variables
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    /**
     * Measures frame rate using requestAnimationFrame
     * 
     * This function is called on every frame and counts frames
     * over a 1-second period to calculate the actual FPS.
     * 
     * @param currentTime - Current timestamp from requestAnimationFrame
     */
    const measureFPS = (currentTime: number) => {
      frameCount++;
      
      // Calculate FPS every second
      if (currentTime - lastTime >= 1000) {
        const currentFPS = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setFps(currentFPS);
        
        // Flag low performance if FPS drops below 25
        // This threshold can be adjusted based on application needs
        setIsLowPerformance(currentFPS < 25);
        
        // Reset counters for next measurement
        frameCount = 0;
        lastTime = currentTime;
      }
      
      // Continue monitoring
      animationId = requestAnimationFrame(measureFPS);
    };

    // Start performance monitoring
    animationId = requestAnimationFrame(measureFPS);

    // Cleanup function to stop monitoring when component unmounts
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return { fps, isLowPerformance };
} 