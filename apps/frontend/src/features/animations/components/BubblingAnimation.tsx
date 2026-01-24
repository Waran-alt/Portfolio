// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/**
 * Bubbling Animation Component
 * 
 * This component creates a bubbling effect using liquid stain-like shapes that grow, shrink,
 * and move across the background. Each bubble uses multiple elliptic curves to create
 * organic, fluid-like shapes that resemble liquid stains or ink drops.
 * 
 * Features:
 * - Liquid stain-like bubbles with organic shapes
 * - Multiple elliptic curves for realistic fluid appearance
 * - CSS transforms for smooth performance
 * - Randomized sizes, speeds, and movement patterns
 * - Configurable bubble count and animation parameters
 * - Responsive design that adapts to screen size
 */

'use client';

import { type BubblingConfig } from '@/constants';
import { animationLogger, componentLogger } from '@/utils/logger';
import { useEffect, useRef, useState } from 'react';

/**
 * Props for the BubblingAnimation component
 */
interface BubblingAnimationProps {
  /** Whether the animation is active */
  isActive: boolean;
  /** Animation configuration */
  config: BubblingConfig;
}

/**
 * Bubble data structure
 */
interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  direction: 'up' | 'down' | 'left' | 'right' | 'diagonal';
  // Liquid stain properties
  curves: number;
  irregularity: number;
  rotation: number;
}

/**
 * Bubbling animation component
 * 
 * Creates a background animation with floating liquid stain-like bubbles that grow, shrink,
 * and move across the screen. Each bubble uses multiple elliptic curves to create organic,
 * fluid-like shapes that resemble liquid stains or ink drops.
 * 
 * @param isActive - Whether the animation is running
 * @param config - Animation configuration parameters
 * 
 * @example
 * ```typescript
 * <BubblingAnimation 
 *   isActive={true} 
 *   config={bubblingConfig}
 * />
 * ```
 */
export default function BubblingAnimation({
  isActive,
  config
}: BubblingAnimationProps) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Component lifecycle logging
  useEffect(() => {
    componentLogger.component('BubblingAnimation', 'mount', { 
      isActive, 
      config
    });
    
    return () => {
      componentLogger.component('BubblingAnimation', 'unmount');
    };
  }, []);

  /**
   * Generate a random number between min and max
   */
  const randomBetween = (min: number, max: number): number => {
    return Math.random() * (max - min) + min;
  };

  /**
   * Generate a smooth liquid stain-like path using multiple approaches
   */
  const generateLiquidStainPath = (bubble: Bubble): string => {
    const { size, curves, irregularity, rotation } = bubble;
    const centerX = size / 2;
    const centerY = size / 2;
    const baseRadius = size / 2;
    
    // Choose between different generation methods for variety
    const method = bubble.id % 3; // 3 different methods
    
    if (method === 0) {
      // Method 1: Smooth elliptic curves with organic noise
      return generateSmoothEllipticPath(bubble, centerX, centerY, baseRadius);
    } else if (method === 1) {
      // Method 2: Catmull-Rom splines with smooth interpolation
      return generateCatmullRomPath(bubble, centerX, centerY, baseRadius);
    } else {
      // Method 3: Multi-ellipse combination for complex shapes
      return generateMultiEllipsePath(bubble, centerX, centerY, baseRadius);
    }
  };

  /**
   * Method 1: Smooth elliptic curves with organic noise
   */
  const generateSmoothEllipticPath = (bubble: Bubble, centerX: number, centerY: number, baseRadius: number): string => {
    const { irregularity, rotation } = bubble;
    const numPoints = 12; // Fixed number for consistency
    const points: Array<{ x: number; y: number }> = [];
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI + rotation;
      
      // Create organic irregularity using multiple sine waves
      const noise1 = Math.sin(angle * 2) * 0.2;
      const noise2 = Math.cos(angle * 3) * 0.15;
      const noise3 = Math.sin(angle * 5) * 0.1;
      const combinedNoise = (noise1 + noise2 + noise3) * irregularity;
      
      const radius = baseRadius * (1 + combinedNoise);
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      points.push({ x, y });
    }
    
    // Close the path smoothly
    points.push(points[0]!);
    
    // Generate smooth bezier curves
    let path = `M ${points[0]?.x} ${points[0]?.y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i]!;
      const next = points[i + 1]!;
      
      // Calculate smooth control points
      const dx = next.x - current.x;
      const dy = next.y - current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const controlDistance = distance * 0.4; // Smooth curve factor
      
      const cp1x = current.x + dx * 0.5;
      const cp1y = current.y + dy * 0.5;
      const cp2x = next.x - dx * 0.5;
      const cp2y = next.y - dy * 0.5;
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }
    
    path += ' Z';
    return path;
  };

  /**
   * Method 2: Catmull-Rom splines with smooth interpolation
   */
  const generateCatmullRomPath = (bubble: Bubble, centerX: number, centerY: number, baseRadius: number): string => {
    const { irregularity, rotation } = bubble;
    const numPoints = 16; // More points for smoother curves
    const points: Array<{ x: number; y: number }> = [];
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI + rotation;
      
      // Smooth noise using trigonometric functions
      const noise = Math.sin(angle * 3) * Math.cos(angle * 2) * 0.3;
      const radius = baseRadius * (1 + noise * irregularity);
      
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      points.push({ x, y });
    }
    
    // Ensure we have enough points for Catmull-Rom
    if (points.length < 3) {
      // Fallback to simple circle if not enough points
      return generateSmoothEllipticPath(bubble, centerX, centerY, baseRadius);
    }
    
    // Create extended array with proper wrapping for Catmull-Rom
    const extendedPoints = [
      points[points.length - 1]!, // Last point at beginning
      ...points,
      points[0]!, // First point at end
      points[1]!  // Second point at end
    ];
    
    // Generate Catmull-Rom spline
    let path = `M ${points[0]?.x} ${points[0]?.y}`;
    
    for (let i = 1; i < extendedPoints.length - 2; i++) {
      const p0 = extendedPoints[i - 1]!;
      const p1 = extendedPoints[i]!;
      const p2 = extendedPoints[i + 1]!;
      const p3 = extendedPoints[i + 2]!;
      
      // Catmull-Rom control points (tension = 0.5)
      const tension = 0.5;
      const cp1x = p1.x + (p2.x - p0.x) * tension / 6;
      const cp1y = p1.y + (p2.y - p0.y) * tension / 6;
      const cp2x = p2.x - (p3.x - p1.x) * tension / 6;
      const cp2y = p2.y - (p3.y - p1.y) * tension / 6;
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    
    path += ' Z';
    return path;
  };

  /**
   * Method 3: Multi-ellipse combination for complex shapes
   */
  const generateMultiEllipsePath = (bubble: Bubble, centerX: number, centerY: number, baseRadius: number): string => {
    const { irregularity, rotation } = bubble;
    const numPoints = 20; // Many points for complex shapes
    const points: Array<{ x: number; y: number }> = [];
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI + rotation;
      
      // Combine multiple ellipses for organic shape
      const radius1 = baseRadius * (1 + Math.sin(angle * 2) * irregularity * 0.3);
      const radius2 = baseRadius * (1 + Math.cos(angle * 3) * irregularity * 0.2);
      const radius3 = baseRadius * (1 + Math.sin(angle * 5) * irregularity * 0.1);
      
      const combinedRadius = (radius1 + radius2 + radius3) / 3;
      
      const x = centerX + Math.cos(angle) * combinedRadius;
      const y = centerY + Math.sin(angle) * combinedRadius;
      
      points.push({ x, y });
    }
    
    // Close smoothly
    points.push(points[0]!);
    
    // Generate smooth path with tension
    let path = `M ${points[0]?.x} ${points[0]?.y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i]!;
      const next = points[i + 1]!;
      
      // Smooth control points with tension
      const tension = 0.3;
      const dx = next.x - current.x;
      const dy = next.y - current.y;
      
      const cp1x = current.x + dx * tension;
      const cp1y = current.y + dy * tension;
      const cp2x = next.x - dx * tension;
      const cp2y = next.y - dy * tension;
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }
    
    path += ' Z';
    return path;
  };

  /**
   * Generate a random bubble with all properties including liquid stain characteristics
   */
  const generateBubble = (id: number): Bubble => {
    const directions = ['up', 'down', 'left', 'right', 'diagonal'] as const;
    
    return {
      id,
      x: randomBetween(0, dimensions.width),
      y: randomBetween(0, dimensions.height),
      size: randomBetween(config.minSize, config.maxSize),
      duration: randomBetween(config.durationRange[0], config.durationRange[1]),
      delay: randomBetween(0, config.maxDelay),
      opacity: randomBetween(config.opacityRange[0], config.opacityRange[1]),
      direction: directions[Math.floor(Math.random() * directions.length)]!,
      // Liquid stain properties - now configurable
      curves: Math.floor(randomBetween(config.liquidStain.curvesRange[0], config.liquidStain.curvesRange[1])),
      irregularity: randomBetween(config.liquidStain.irregularityRange[0], config.liquidStain.irregularityRange[1]),
      rotation: randomBetween(0, 2 * Math.PI)
    };
  };

  /**
   * Update container dimensions on resize
   */
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const newDimensions = {
          width: rect.width,
          height: rect.height
        };
        
        setDimensions(newDimensions);
        animationLogger.animation('Bubbling', 'dimensions updated', newDimensions);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  /**
   * Generate bubbles when dimensions change or bubble count changes
   */
  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      const newBubbles = Array.from({ length: config.bubbleCount }, (_, index) => 
        generateBubble(index)
      );
      setBubbles(newBubbles);
      
      animationLogger.animation('Bubbling', 'bubbles generated', {
        count: config.bubbleCount,
        dimensions,
        bubbleSizes: newBubbles.map(b => b.size),
        bubbleDurations: newBubbles.map(b => b.duration)
      });
    }
  }, [dimensions, config.bubbleCount, config.maxSize, config.minSize, config.durationRange, config.opacityRange]);

  /**
   * Get CSS animation properties for a bubble based on its direction
   */
  const getBubbleAnimation = (bubble: Bubble) => {
    const { x, y, size, duration, delay, opacity, direction } = bubble;
    
    // Calculate movement distance based on direction
    let moveX = 0;
    let moveY = 0;
    const moveDistance = Math.max(dimensions.width, dimensions.height) * config.movementDistancePercentage;
    
    switch (direction) {
      case 'up':
        moveY = -moveDistance;
        break;
      case 'down':
        moveY = moveDistance;
        break;
      case 'left':
        moveX = -moveDistance;
        break;
      case 'right':
        moveX = moveDistance;
        break;
      case 'diagonal':
        moveX = moveDistance * (Math.random() > 0.5 ? 1 : -1);
        moveY = moveDistance * (Math.random() > 0.5 ? 1 : -1);
        break;
    }

    return {
      transform: `translate(${x}px, ${y}px)`,
      animation: `bubbleFloat ${duration}s ease-in-out ${delay}s infinite`,
      opacity,
      '--move-x': `${moveX}px`,
      '--move-y': `${moveY}px`,
      '--size': `${size}px`
    } as React.CSSProperties;
  };

  if (!isActive) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="BubblingAnimation fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: config.zIndex }}
    >
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes bubbleFloat {
          0% {
            transform: translate(var(--move-x, 0px), var(--move-y, 0px)) scale(0.8) rotate(0deg);
          }
          50% {
            transform: translate(calc(var(--move-x, 0px) * 0.5), calc(var(--move-y, 0px) * 0.5)) scale(1.2) rotate(180deg);
          }
          100% {
            transform: translate(var(--move-x, 0px), var(--move-y, 0px)) scale(0.8) rotate(360deg);
          }
        }
      `}</style>

      {/* Liquid Stain Bubbles */}
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="bubble absolute"
          style={getBubbleAnimation(bubble)}
        >
          <svg width={bubble.size} height={bubble.size} className="w-full h-full">
            <defs>
              <radialGradient
                id={`bubbleGradient${bubble.id}`}
                cx={config.gradient.cx}
                cy={config.gradient.cy}
                r={config.gradient.r}
              >
                {config.gradient.stops.map((stop, index) => (
                  <stop
                    key={index}
                    offset={stop.offset}
                    stopColor={stop.color}
                  />
                ))}
              </radialGradient>
            </defs>
            <path
              d={generateLiquidStainPath(bubble)}
              fill={`url(#bubbleGradient${bubble.id})`}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth={config.liquidStain.strokeWidth}
              strokeOpacity={config.liquidStain.strokeOpacity}
            />
          </svg>
        </div>
      ))}
    </div>
  );
} 