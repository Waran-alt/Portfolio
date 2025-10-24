/**
 * Liquid Stain Animation Component
 * 
 * This component creates a liquid stain effect using organic shapes that grow, shrink,
 * and move across the background. Each stain uses multiple elliptic curves to create
 * organic, irregular shapes that look like liquid stains or ink drops.
 * 
 * Features:
 * - Liquid stain-like shapes with organic forms
 * - Configurable animation parameters
 * - Smooth scaling and movement animations
 * - Configurable stain count and animation parameters
 * - Gradient fills for realistic liquid appearance
 */

'use client';

import { type BubblingConfig as StainConfig } from '@/constants';
import { animationLogger, componentLogger } from '@/utils/logger';
import { useEffect, useRef, useState } from 'react';

/**
 * Props for the StainAnimation component
 */
interface StainAnimationProps {
  /** Whether the animation is active */
  isActive: boolean;
  /** Animation configuration */
  config: StainConfig;
}

/**
 * Stain data structure
 */
interface Stain {
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
 * Liquid Stain animation component
 * 
 * Creates a background animation with floating liquid stain-like shapes that grow, shrink,
 * and move across the screen. Each stain uses multiple elliptic curves to create organic,
 * fluid-like shapes that resemble liquid stains or ink drops.
 * 
 * @param isActive - Whether the animation is running
 * @param config - Animation configuration parameters
 * 
 * @example
 * ```typescript
 * <StainAnimation 
 *   isActive={true} 
 *   config={stainConfig}
 * />
 * ```
 */
export default function StainAnimation({
  isActive,
  config
}: StainAnimationProps) {
  const [stains, setStains] = useState<Stain[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Component lifecycle logging
  useEffect(() => {
    componentLogger.component('StainAnimation', 'mount', { 
      isActive, 
      config
    });
    
    return () => {
      componentLogger.component('StainAnimation', 'unmount');
    };
  }, []);

  /**
   * Generate a random number between min and max
   */
  const randomBetween = (min: number, max: number): number => {
    return Math.random() * (max - min) + min;
  };

  /**
   * Generate a liquid stain-like path using multiple elliptic curves
   */
  const generateLiquidStainPath = (stain: Stain): string => {
    const { size, curves, irregularity, rotation } = stain;
    const centerX = size / 2;
    const centerY = size / 2;
    const baseRadius = size / 2;
    
    // Generate control points for the liquid stain shape
    const points: Array<{ x: number; y: number }> = [];
    
    for (let i = 0; i < curves; i++) {
      const angle = (i / curves) * 2 * Math.PI + rotation;
      const radius = baseRadius * (1 + randomBetween(-irregularity, irregularity));
      
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      points.push({ x, y });
    }
    
    // Create smooth path using cubic bezier curves
    let path = `M ${points[0]?.x} ${points[0]?.y}`;
    
    for (let i = 0; i < points.length; i++) {
      const current = points[i]!;
      const next = points[(i + 1) % points.length]!;
      const afterNext = points[(i + 2) % points.length]!;
      
      // Calculate control points for smooth curves
      const cp1x = current.x + (next.x - afterNext.x) * 0.25;
      const cp1y = current.y + (next.y - afterNext.y) * 0.25;
      const cp2x = next.x - (current.x - afterNext.x) * 0.25;
      const cp2y = next.y - (current.y - afterNext.y) * 0.25;
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }
    
    path += ' Z'; // Close the path
    return path;
  };

  /**
   * Generate a random stain with all properties including liquid stain characteristics
   */
  const generateStain = (id: number): Stain => {
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
        animationLogger.animation('Stain', 'dimensions updated', newDimensions);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  /**
   * Generate stains when dimensions change or stain count changes
   */
  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      const newStains = Array.from({ length: config.stainCount }, (_, index) => 
        generateStain(index)
      );
      setStains(newStains);
      
      animationLogger.animation('Stain', 'stains generated', {
        count: config.stainCount,
        dimensions,
        stainSizes: newStains.map(b => b.size),
        stainDurations: newStains.map(b => b.duration)
      });
    }
  }, [dimensions, config.stainCount, config.maxSize, config.minSize, config.durationRange, config.opacityRange]);

  /**
   * Get CSS animation properties for a stain based on its direction
   */
  const getStainAnimation = (stain: Stain) => {
    const { x, y, size, duration, delay, opacity, direction } = stain;
    
    // Calculate movement distance based on direction
    const movementDistance = Math.min(dimensions.width, dimensions.height) * config.movementDistancePercentage;
    
    let transform = '';
    switch (direction) {
      case 'up':
        transform = `translateY(${movementDistance}px)`;
        break;
      case 'down':
        transform = `translateY(-${movementDistance}px)`;
        break;
      case 'left':
        transform = `translateX(${movementDistance}px)`;
        break;
      case 'right':
        transform = `translateX(-${movementDistance}px)`;
        break;
      case 'diagonal':
        transform = `translate(${movementDistance * 0.7}px, -${movementDistance * 0.7}px)`;
        break;
    }
    
    return {
      position: 'absolute' as const,
      left: `${x}px`,
      top: `${y}px`,
      width: `${size}px`,
      height: `${size}px`,
      opacity,
      animation: `stainFloat ${duration}s ease-in-out ${delay}s infinite`,
      transform,
      zIndex: config.zIndex
    } as React.CSSProperties;
  };

  // Don't render if not active
  if (!isActive) return null;

  return (
    <div
      ref={containerRef}
      className="StainAnimation fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: config.zIndex }}
    >
      <style jsx>{`
        @keyframes stainFloat {
          0%, 100% {
            transform: scale(0.8) ${getStainAnimation({} as Stain).transform};
          }
          50% {
            transform: scale(1.2) ${getStainAnimation({} as Stain).transform};
          }
        }
      `}</style>

      {/* Liquid Stain Shapes */}
      {stains.map((stain) => (
        <div
          key={stain.id}
          className="stain absolute"
          style={getStainAnimation(stain)}
        >
          <svg width={stain.size} height={stain.size} className="w-full h-full">
            <defs>
              <radialGradient
                id={`stainGradient${stain.id}`}
                cx={config.gradient.cx}
                cy={config.gradient.cy}
                r={config.gradient.r}
              >
                {config.gradient.stops.map((stop: { offset: string; color: string }, index: number) => (
                  <stop
                    key={index}
                    offset={stop.offset}
                    stopColor={stop.color}
                  />
                ))}
              </radialGradient>
            </defs>
            <path
              d={generateLiquidStainPath(stain)}
              fill={`url(#stainGradient${stain.id})`}
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