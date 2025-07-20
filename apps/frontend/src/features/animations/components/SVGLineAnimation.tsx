'use client';

import { type SVGLineConfig } from '@/constants';
import { animationLogger, componentLogger } from '@/utils/logger';
import { useEffect, useRef, useState } from 'react';

interface SVGLineAnimationProps {
  isActive: boolean;
  devMode?: boolean;
  config: SVGLineConfig;
}

export default function SVGLineAnimation({ isActive, devMode = false, config }: SVGLineAnimationProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Component lifecycle logging
  useEffect(() => {
    componentLogger.component('SVGLineAnimation', 'mount', { isActive, devMode, config });
    setHasMounted(true);
    
    return () => {
      componentLogger.component('SVGLineAnimation', 'unmount');
    };
  }, []);

  useEffect(() => {
    if (!hasMounted || !isActive || !svgRef.current) {
      animationLogger.animation('SVGLine', 'skipped', { hasMounted, isActive, hasRef: !!svgRef.current });
      return;
    }

    animationLogger.animation('SVGLine', 'initializing');

    const svg = svgRef.current;
    
    // Resize SVG to fill window
    const resizeSVG = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      svg.setAttribute('width', width.toString());
      svg.setAttribute('height', height.toString());
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      
      animationLogger.animation('SVGLine', 'resized', { width, height });
    };
    
    resizeSVG();
    window.addEventListener('resize', resizeSVG);
    
    return () => {
      window.removeEventListener('resize', resizeSVG);
    };
  }, [hasMounted, isActive]);

  if (!hasMounted || !isActive) {
    animationLogger.animation('SVGLine', 'not rendering', { hasMounted, isActive });
    return null;
  }

  // Calculate smooth organic path points
  const width = typeof window !== 'undefined' ? window.innerWidth : 800;
  const height = typeof window !== 'undefined' ? window.innerHeight : 600;
  
  // Create an S-curve using two connected elliptical arcs
  // This creates a smooth S-shape without any angles
  const startX = 0;
  const startY = height * 0.7;
  const midX = width * 0.5;
  const midY = height * 0.5;
  const endX = width;
  const endY = height * 0.3;
  
  // Calculate radius for the arcs
  const radiusX = width * 0.3;
  const radiusY = height * 0.2;
  
  // First arc: start to middle (curving up)
  // Second arc: middle to end (curving down)
  const pathData = `M ${startX},${startY} A ${radiusX},${radiusY} 0 0 1 ${midX},${midY} A ${radiusX},${radiusY} 0 0 0 ${endX},${endY}`;

  animationLogger.animation('SVGLine', 'rendering', { 
    width, 
    height, 
    pathLength: pathData.length,
    devMode,
    config
  });

  return (
    <svg
      ref={svgRef}
      className="SVGLineAnimation fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: config.zIndex }}
    >
      <defs>
        {/* Smooth filter to eliminate any remaining angles */}
        <filter id="smooth">
          <feGaussianBlur stdDeviation="0.5" />
        </filter>
        
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={config.gradientColors.start} stopOpacity={config.gradientOpacities.start}>
            <animate
              attributeName="stop-opacity"
              values="0.3;0.8;0.3"
              dur={`${config.gradientAnimationDuration}s`}
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="50%" stopColor={config.gradientColors.middle} stopOpacity={config.gradientOpacities.middle}>
            <animate
              attributeName="stop-opacity"
              values="0.6;1;0.6"
              dur={`${config.gradientAnimationDuration}s`}
              repeatCount="indefinite"
              begin="1s"
            />
          </stop>
          <stop offset="100%" stopColor={config.gradientColors.end} stopOpacity={config.gradientOpacities.end}>
            <animate
              attributeName="stop-opacity"
              values="0.8;0.3;0.8"
              dur={`${config.gradientAnimationDuration}s`}
              repeatCount="indefinite"
              begin="2s"
            />
          </stop>
        </linearGradient>
      </defs>
      
      {/* Dev mode: Show complete path in background */}
      {devMode && (
        <path
          d={pathData}
          stroke={config.devPath.strokeColor}
          strokeWidth={config.devPath.strokeWidth}
          strokeOpacity={config.devPath.strokeOpacity}
          strokeDasharray={config.devPath.dashArray}
          fill="none"
          strokeLinecap="round"
        />
      )}
      
      {/* Animated path */}
      <path
        d={pathData}
        stroke="url(#lineGradient)"
        strokeWidth={config.strokeWidth}
        fill="none"
        strokeLinecap="round"
        filter="url(#smooth)"
      >
        <animate
          attributeName="stroke-dasharray"
          values="0,1000;1000,0;0,1000"
          dur={`${config.animationDuration}s`}
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
} 