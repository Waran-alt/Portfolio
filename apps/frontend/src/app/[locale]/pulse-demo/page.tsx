'use client';

/**
 * @file Pulse Effect Demo
 * 
 * Demonstrates the PulseEffect component with click-to-spawn interactions.
 */

import { MouseEvent, useState } from 'react';
import PulseEffect from '../animations/pulse/PulseEffect';
import {
  DEMO_DEFAULT_ANIMATION_OPACITY,
  DEMO_DEFAULT_DIRECTION,
  DEMO_DEFAULT_DURATION,
  DEMO_DEFAULT_EASING,
  DEMO_DEFAULT_FADE_IN_DURATION,
  DEMO_DEFAULT_FADE_IN_TO_ANIMATION_DURATION,
  DEMO_DEFAULT_FADE_OUT_DURATION,
  DEMO_DEFAULT_FINAL_OPACITY,
  DEMO_DEFAULT_INITIAL_OPACITY,
  DEMO_DEFAULT_INNER_BLUR,
  DEMO_DEFAULT_INNER_SPREAD,
  DEMO_DEFAULT_MAX_RADIUS,
  DEMO_DEFAULT_OUTER_BLUR,
  DEMO_DEFAULT_OUTER_SPREAD,
} from './constants';

// Helper to copy text to clipboard
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    // Optional: Show a success message
    console.log('Configuration copied to clipboard');
  }).catch(err => {
    console.error('Failed to copy: ', err);
  });
};

interface Pulse {
  id: number;
  x: number;
  y: number;
  timestamp: number;
  // Snapshot of animation settings at creation time
  direction: 'expand' | 'shrink';
  duration: number;
  maxRadius: number;
  outerBlur: number;
  outerSpread: number;
  innerBlur: number;
  innerSpread: number;
  fadeInDuration: number;
  fadeInToAnimationDuration: number;
  fadeOutDuration: number;
  initialOpacity: number;
  animationOpacity: number;
  finalOpacity: number;
  easing: 'linear' | 'ease-in-out' | 'ease-out' | 'ease-in';
}

export default function PulseDemoPage() {
  const [pulses, setPulses] = useState<Pulse[]>([]);
  const [idCounter, setIdCounter] = useState(0);
  const [fadeInDuration, setFadeInDuration] = useState(DEMO_DEFAULT_FADE_IN_DURATION);
  const [fadeInToAnimationDuration, setFadeInToAnimationDuration] = useState(DEMO_DEFAULT_FADE_IN_TO_ANIMATION_DURATION);
  const [fadeOutDuration, setFadeOutDuration] = useState(DEMO_DEFAULT_FADE_OUT_DURATION);
  const [maxRadius, setMaxRadius] = useState(DEMO_DEFAULT_MAX_RADIUS);
  const [duration, setDuration] = useState(DEMO_DEFAULT_DURATION);
  const [outerBlur, setOuterBlur] = useState(DEMO_DEFAULT_OUTER_BLUR);
  const [outerSpread, setOuterSpread] = useState(DEMO_DEFAULT_OUTER_SPREAD);
  const [innerBlur, setInnerBlur] = useState(DEMO_DEFAULT_INNER_BLUR);
  const [innerSpread, setInnerSpread] = useState(DEMO_DEFAULT_INNER_SPREAD);
  const [initialOpacity, setInitialOpacity] = useState(DEMO_DEFAULT_INITIAL_OPACITY);
  const [animationOpacity, setAnimationOpacity] = useState(DEMO_DEFAULT_ANIMATION_OPACITY);
  const [finalOpacity, setFinalOpacity] = useState(DEMO_DEFAULT_FINAL_OPACITY);
  const [direction, setDirection] = useState<typeof DEMO_DEFAULT_DIRECTION>(DEMO_DEFAULT_DIRECTION);
  const [easing, setEasing] = useState<typeof DEMO_DEFAULT_EASING>(DEMO_DEFAULT_EASING);

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Create pulse with snapshot of current settings to ensure independence
    const newPulse: Pulse = {
      id: idCounter,
      x,
      y,
      timestamp: Date.now(),
      direction,
      duration,
      maxRadius,
      outerBlur,
      outerSpread,
      innerBlur,
      innerSpread,
      fadeInDuration,
      fadeInToAnimationDuration,
      fadeOutDuration,
      initialOpacity,
      animationOpacity,
      finalOpacity,
      easing,
    };

    setPulses(prev => [...prev, newPulse]);
    setIdCounter(prev => prev + 1);
  };

  const handlePulseComplete = (id: number) => {
    setPulses(prev => prev.filter(pulse => pulse.id !== id));
  };

  return (
    <main
      className="PulseDemoPage min-h-screen bg-gradient-to-b from-slate-900 to-slate-700"
      data-testid="pulse-demo-root"
    >
      {/* Clickable overlay */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (rect.left + rect.right) / 2;
            const y = (rect.top + rect.bottom) / 2;
            handleClick({ currentTarget: e.currentTarget, clientX: x, clientY: y } as MouseEvent<HTMLDivElement>);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Click anywhere to spawn a pulse effect"
        data-testid="pulse-demo-overlay"
      />
      
      {/* Instructions */}
      <div className="relative z-20 top-4 left-4 w-fit bg-black bg-opacity-60 backdrop-blur-sm text-white p-4 rounded-lg max-w-xs pointer-events-auto shadow-2xl h-[calc(100vh-2rem)] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-600">
        <h1 className="text-xl font-bold mb-1">Pulse Effect</h1>
        <p className="mb-3 text-xs text-gray-300">Click to spawn</p>
        
        {/* Animation Settings */}
        <div className="space-y-2 mb-4">
          <h2 className="text-sm font-semibold border-b border-gray-600 pb-1">Animation</h2>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between mb-0.5">
                <label htmlFor="fade-in" className="text-xs">Fade In</label>
                <span className="text-xs text-gray-400">{fadeInDuration}ms</span>
              </div>
              <input
                id="fade-in"
                type="range"
                min="0"
                max="500"
                value={fadeInDuration}
                onChange={(e) => setFadeInDuration(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <div className="flex justify-between mb-0.5">
                <label htmlFor="fade-in-to-animation" className="text-xs">Fade In → Anim</label>
                <span className="text-xs text-gray-400">{fadeInToAnimationDuration}ms</span>
              </div>
              <input
                id="fade-in-to-animation"
                type="range"
                min="0"
                max="500"
                value={fadeInToAnimationDuration}
                onChange={(e) => setFadeInToAnimationDuration(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <div className="flex justify-between mb-0.5">
                <label htmlFor="duration" className="text-xs">Duration</label>
                <span className="text-xs text-gray-400">{duration}ms</span>
              </div>
              <input
                id="duration"
                type="range"
                min="300"
                max="2000"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <div className="flex justify-between mb-0.5">
                <label htmlFor="fade-out" className="text-xs">Fade Out</label>
                <span className="text-xs text-gray-400">{fadeOutDuration}ms</span>
              </div>
              <input
                id="fade-out"
                type="range"
                min="0"
                max="500"
                value={fadeOutDuration}
                onChange={(e) => setFadeOutDuration(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <div className="flex justify-between mb-0.5">
                <label htmlFor="direction" className="text-xs">Direction</label>
              </div>
              <select
                id="direction"
                value={direction}
                onChange={(e) => setDirection(e.target.value as 'expand' | 'shrink')}
                className="w-full bg-gray-700 text-white px-2 py-1 rounded text-xs"
              >
                <option value="expand">Expand</option>
                <option value="shrink">Shrink</option>
              </select>
            </div>
            <div>
              <div className="flex justify-between mb-0.5">
                <label htmlFor="easing" className="text-xs">Easing</label>
              </div>
              <select
                id="easing"
                value={easing}
                onChange={(e) => setEasing(e.target.value as typeof easing)}
                className="w-full bg-gray-700 text-white px-2 py-1 rounded text-xs"
              >
                <option value="linear">Linear</option>
                <option value="ease-in">Ease In</option>
                <option value="ease-out">Ease Out</option>
                <option value="ease-in-out">Ease In Out</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ring Appearance */}
        <div className="space-y-2 mb-4">
          <h2 className="text-sm font-semibold border-b border-gray-600 pb-1">Ring</h2>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between mb-0.5">
                <label htmlFor="max-radius" className="text-xs">Max Radius</label>
                <span className="text-xs text-gray-400">{maxRadius}px</span>
              </div>
              <input
                id="max-radius"
                type="range"
                min="50"
                max="300"
                value={maxRadius}
                onChange={(e) => setMaxRadius(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Opacity Control */}
        <div className="space-y-2 mb-4">
          <h2 className="text-sm font-semibold border-b border-gray-600 pb-1">Opacity</h2>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between mb-0.5">
                <label htmlFor="initial-opacity" className="text-xs">Initial</label>
                <span className="text-xs text-gray-400">{initialOpacity.toFixed(2)}</span>
              </div>
              <input
                id="initial-opacity"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={initialOpacity}
                onChange={(e) => setInitialOpacity(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <div className="flex justify-between mb-0.5">
                <label htmlFor="animation-opacity" className="text-xs">Animation</label>
                <span className="text-xs text-gray-400">{animationOpacity.toFixed(2)}</span>
              </div>
              <input
                id="animation-opacity"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={animationOpacity}
                onChange={(e) => setAnimationOpacity(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <div className="flex justify-between mb-0.5">
                <label htmlFor="final-opacity" className="text-xs">Final</label>
                <span className="text-xs text-gray-400">{finalOpacity.toFixed(2)}</span>
              </div>
              <input
                id="final-opacity"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={finalOpacity}
                onChange={(e) => setFinalOpacity(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Edge Softness */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold border-b border-gray-600 pb-1">Edge</h2>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between mb-0.5">
                <label htmlFor="outer-blur" className="text-xs">Outer Blur</label>
                <span className="text-xs text-gray-400">{outerBlur}px</span>
              </div>
              <input
                id="outer-blur"
                type="range"
                min="0"
                max="50"
                value={outerBlur}
                onChange={(e) => setOuterBlur(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <div className="flex justify-between mb-0.5">
                <label htmlFor="outer-spread" className="text-xs">Outer Spread</label>
                <span className="text-xs text-gray-400">{outerSpread}px</span>
              </div>
              <input
                id="outer-spread"
                type="range"
                min="0"
                max="50"
                value={outerSpread}
                onChange={(e) => setOuterSpread(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <div className="flex justify-between mb-0.5">
                <label htmlFor="inner-blur" className="text-xs">Inner Blur</label>
                <span className="text-xs text-gray-400">{innerBlur}px</span>
              </div>
              <input
                id="inner-blur"
                type="range"
                min="0"
                max="50"
                value={innerBlur}
                onChange={(e) => setInnerBlur(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <div className="flex justify-between mb-0.5">
                <label htmlFor="inner-spread" className="text-xs">Inner Spread</label>
                <span className="text-xs text-gray-400">{innerSpread}px</span>
              </div>
              <input
                id="inner-spread"
                type="range"
                min="0"
                max="50"
                value={innerSpread}
                onChange={(e) => setInnerSpread(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* JSON Configuration Export */}
        <div className="space-y-2 mt-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold border-b border-gray-600 pb-1">Configuration</h2>
            <button
              onClick={() => {
                const config = {
                  direction,
                  duration,
                  maxRadius,
                  outerBlur,
                  outerSpread,
                  innerBlur,
                  innerSpread,
                  fadeInDuration,
                  fadeInToAnimationDuration,
                  fadeOutDuration,
                  initialOpacity,
                  animationOpacity,
                  finalOpacity,
                  easing,
                  ringColor: "rgba(255, 255, 255, 1)"
                };
                copyToClipboard(JSON.stringify(config, null, 2));
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
            >
              Copy JSON
            </button>
          </div>
          <pre className="bg-gray-900 text-gray-300 p-2 rounded text-xs overflow-x-auto max-h-64 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-600">
            {JSON.stringify({
              direction,
              duration,
              maxRadius,
              outerBlur,
              outerSpread,
              innerBlur,
              innerSpread,
              fadeInDuration,
              fadeInToAnimationDuration,
              fadeOutDuration,
              initialOpacity,
              animationOpacity,
              finalOpacity,
              easing,
              ringColor: "rgba(255, 255, 255, 1)"
            }, null, 2)}
          </pre>
        </div>
      </div>

      {/* Active pulses */}
      {pulses.map(pulse => (
        <PulseEffect
          key={pulse.id}
          x={pulse.x}
          y={pulse.y}
          direction={pulse.direction}
          duration={pulse.duration}
          ringColor="rgba(255, 255, 255, 1)"
          maxRadius={pulse.maxRadius}
          outerBlur={pulse.outerBlur}
          outerSpread={pulse.outerSpread}
          innerBlur={pulse.innerBlur}
          innerSpread={pulse.innerSpread}
          fadeInDuration={pulse.fadeInDuration}
          fadeInToAnimationDuration={pulse.fadeInToAnimationDuration}
          fadeOutDuration={pulse.fadeOutDuration}
          initialOpacity={pulse.initialOpacity}
          animationOpacity={pulse.animationOpacity}
          finalOpacity={pulse.finalOpacity}
          easing={pulse.easing}
          onComplete={() => handlePulseComplete(pulse.id)}
          data-testid={`pulse-${pulse.id}`}
        />
      ))}
    </main>
  );
}

