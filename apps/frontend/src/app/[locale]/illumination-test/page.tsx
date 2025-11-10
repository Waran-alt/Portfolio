'use client';

/**
 * @file Illumination Test Page
 * 
 * Demonstrates the dynamic directional illumination system with multiple planes
 * at different orientations and positions, with a draggable light source.
 */

import { MouseEvent, startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LightConfig, MaterialConfig, Vector3 } from '../animations/illumination';
import { DEFAULT_LIGHT_CONFIG, IlluminationEffect, vectorNormalize } from '../animations/illumination';

/**
 * Calculate rotation angles from a normal vector to align plane to face that direction
 * Returns rotation angles in degrees for CSS transform
 * Default plane faces forward (0, 0, 1) in screen space
 */
function calculateRotationFromNormal(normal: Vector3): { rotateX: number; rotateY: number } {
  // Default plane normal is (0, 0, 1) - facing forward (towards viewer)
  // We need to rotate this to match the target normal
  
  // Calculate Y rotation (around vertical axis) - horizontal rotation
  // This aligns the plane's direction in the XZ plane
  const yAngle = Math.atan2(normal.x, normal.z) * (180 / Math.PI);
  
  // Calculate X rotation (around horizontal axis) - vertical tilt
  // After Y rotation, the normal would be in the YZ plane, so we calculate X rotation directly
  const xAngle = Math.asin(-normal.y) * (180 / Math.PI);
  
  return { rotateX: xAngle, rotateY: yAngle };
}

interface PlaneDefinition {
  id: string;
  position: Vector3;
  normal: Vector3;
  material: MaterialConfig;
  size: { width: number; height: number };
  label: string;
}

/**
 * Pre-defined planes with different orientations and positions
 */
const PLANE_DEFINITIONS: PlaneDefinition[] = [
  {
    id: 'plane-1',
    position: { x: -200, y: -100, z: 50 },
    normal: vectorNormalize({ x: 0, y: 0, z: 1 }), // Facing forward
    material: { baseColor: { r: 100, g: 150, b: 200 }, reflectivity: 0.5, blendMode: 'multiply' },
    size: { width: 150, height: 150 },
    label: 'Front',
  },
  {
    id: 'plane-2',
    position: { x: 200, y: -100, z: 50 },
    normal: vectorNormalize({ x: 1, y: 0, z: 0 }), // Facing right
    material: { baseColor: { r: 200, g: 100, b: 150 }, reflectivity: 0.7, blendMode: 'multiply' },
    size: { width: 150, height: 150 },
    label: 'Right',
  },
  {
    id: 'plane-3',
    position: { x: 0, y: 100, z: 50 },
    normal: vectorNormalize({ x: 0, y: 1, z: 0 }), // Facing down
    material: { baseColor: { r: 150, g: 200, b: 100 }, reflectivity: 0.6, blendMode: 'multiply' },
    size: { width: 150, height: 150 },
    label: 'Top',
  },
  {
    id: 'plane-4',
    position: { x: -200, y: 100, z: -50 },
    normal: vectorNormalize({ x: -0.5, y: 0.5, z: 0.707 }), // Angled
    material: { baseColor: { r: 200, g: 200, b: 100 }, reflectivity: 0.4, blendMode: 'multiply' },
    size: { width: 150, height: 150 },
    label: 'Angled 1',
  },
  {
    id: 'plane-5',
    position: { x: 200, y: 100, z: -50 },
    normal: vectorNormalize({ x: 0.707, y: -0.5, z: 0.5 }), // Angled
    material: { baseColor: { r: 150, g: 100, b: 200 }, reflectivity: 0.8, blendMode: 'additive' },
    size: { width: 150, height: 150 },
    label: 'Angled 2',
  },
  {
    id: 'plane-6',
    position: { x: 0, y: -150, z: 100 },
    normal: vectorNormalize({ x: 0, y: -1, z: 0 }), // Facing up
    material: { baseColor: { r: 100, g: 100, b: 100 }, reflectivity: 0.3, blendMode: 'multiply' },
    size: { width: 200, height: 100 },
    label: 'Bottom',
  },
];

export default function IlluminationTestPage() {
  // Client-side mounting state to prevent hydration mismatches
  const [isMounted, setIsMounted] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });
  
  // Light configuration state
  const [lightConfig, setLightConfig] = useState<LightConfig>({
    ...DEFAULT_LIGHT_CONFIG,
    position: { x: 0, y: 0, z: 200 },
  });
  
  // Dragging state
  const [isDragging, setIsDragging] = useState(false);

  // Light control state
  const [lightColorHex, setLightColorHex] = useState('#ffffff');
  const [lightIntensity, setLightIntensity] = useState(1.0);
  const [lightAttenuation, setLightAttenuation] = useState(0.01);

  // Grid view toggle
  const [useGridView, setUseGridView] = useState(false);

  // Create refs for all planes (must be called at top level)
  const planeRefs: Record<string, React.RefObject<HTMLDivElement | null>> = {
    'plane-1': useRef<HTMLDivElement | null>(null),
    'plane-2': useRef<HTMLDivElement | null>(null),
    'plane-3': useRef<HTMLDivElement | null>(null),
    'plane-4': useRef<HTMLDivElement | null>(null),
    'plane-5': useRef<HTMLDivElement | null>(null),
    'plane-6': useRef<HTMLDivElement | null>(null),
  };

  // Generate grid planes covering the viewport
  const generateGridPlanes = useCallback((): PlaneDefinition[] => {
    if (!isMounted || windowDimensions.width === 0 || windowDimensions.height === 0) {
      return [];
    }

    const gridSize = 30; // Size of each grid cell in pixels
    const cols = Math.ceil(windowDimensions.width / gridSize);
    const rows = Math.ceil(windowDimensions.height / gridSize);
    const viewportCenter = { x: windowDimensions.width / 2, y: windowDimensions.height / 2 };
    
    const planes: PlaneDefinition[] = [];
    let planeId = 0;

    // Black material for all grid planes
    const blackMaterial: MaterialConfig = {
      baseColor: { r: 0, g: 0, b: 0 },
      reflectivity: 0.8,
      blendMode: 'multiply',
    };

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Calculate position in screen space
        const screenX = col * gridSize + gridSize / 2;
        const screenY = row * gridSize + gridSize / 2;
        
        // Convert to 3D space relative to viewport center
        const x = screenX - viewportCenter.x;
        const y = screenY - viewportCenter.y;
        const z = 0; // All planes at z=0 (same depth)

        // Calculate normal pointing toward viewport center
        // At center, normal is (0, 0, 1) - facing viewer
        // Away from center, normal points toward center
        const distanceFromCenter = Math.sqrt(x * x + y * y);
        const maxDistance = Math.sqrt(
          (windowDimensions.width / 2) ** 2 + 
          (windowDimensions.height / 2) ** 2
        );
        
        // Normalize the direction from this point to the center
        // Add slight Z component to face viewer, more at center
        const centerFactor = 1 - (distanceFromCenter / maxDistance) * 0.5; // 0.5 to 1.0
        const normal = vectorNormalize({
          x: -x / Math.max(distanceFromCenter, 1), // Point toward center (invert)
          y: -y / Math.max(distanceFromCenter, 1),
          z: 0.5 + centerFactor * 0.5, // Stronger Z component at center
        });

        planes.push({
          id: `grid-plane-${planeId++}`,
          position: { x, y, z },
          normal,
          material: blackMaterial,
          size: { width: gridSize, height: gridSize },
          label: '',
        });
      }
    }

    return planes;
  }, [isMounted, windowDimensions.width, windowDimensions.height]);

  // Generate grid planes
  const gridPlanes = useMemo(() => {
    if (!useGridView || !isMounted || windowDimensions.width === 0 || windowDimensions.height === 0) {
      return [];
    }
    
    return generateGridPlanes();
  }, [useGridView, isMounted, windowDimensions.width, windowDimensions.height, generateGridPlanes]);

  // Create refs storage for grid planes using useMemo to avoid ref access during render
  // Refs are created during render but memoized, which is acceptable
  const gridPlaneRefsMap = useMemo(() => {
    if (!useGridView || gridPlanes.length === 0) {
      return {};
    }
    const refsMap: Record<string, React.RefObject<HTMLDivElement | null>> = {};
    gridPlanes.forEach((plane) => {
      refsMap[plane.id] = { current: null };
    });
    return refsMap;
  }, [useGridView, gridPlanes]);

  // Initialize window dimensions on client
  useEffect(() => {
    const updateDimensions = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    // Set mounted state after initial render to prevent hydration mismatch
    // This is intentional - we need to prevent server/client mismatches
    // Use startTransition to avoid cascading render warning
    startTransition(() => {
      setIsMounted(true);
    });
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  /**
   * Convert hex color to RGB
   */
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result || !result[1] || !result[2] || !result[3]) {
      return { r: 255, g: 255, b: 255 };
    }
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    };
  };

  /**
   * Handle mouse down on light source
   */
  const handleLightMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  // Global mouse event handlers for dragging (work even when mouse leaves overlay or interacts with other elements)
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: globalThis.MouseEvent) => {
      setLightConfig(prev => ({
        ...prev,
        position: {
          x: prev.position.x + e.movementX,
          y: prev.position.y + e.movementY,
          z: prev.position.z, // Z-axis is controlled by mouse wheel, not movement
        },
      }));
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    const handleGlobalWheel = (e: globalThis.WheelEvent) => {
      e.preventDefault(); // Prevent page scrolling while dragging
      // Negative deltaY means scrolling up (forward), positive means scrolling down (backward)
      const deltaZ = -e.deltaY * 0.5; // Scale factor for sensitivity
      setLightConfig(prev => ({
        ...prev,
        position: {
          ...prev.position,
          z: prev.position.z + deltaZ,
        },
      }));
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('wheel', handleGlobalWheel, { passive: false });

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('wheel', handleGlobalWheel);
    };
  }, [isDragging]);

  /**
   * Update light color from hex input
   */
  const handleLightColorChange = (hex: string) => {
    setLightColorHex(hex);
    const rgb = hexToRgb(hex);
    setLightConfig(prev => ({
      ...prev,
      color: rgb,
    }));
  };

  /**
   * Update light intensity
   */
  const handleIntensityChange = (intensity: number) => {
    setLightIntensity(intensity);
    setLightConfig(prev => ({
      ...prev,
      intensity,
    }));
  };

  /**
   * Update light attenuation
   */
  const handleAttenuationChange = (attenuation: number) => {
    setLightAttenuation(attenuation);
    setLightConfig(prev => ({
      ...prev,
      attenuation,
    }));
  };

  // Get light position in screen coordinates for rendering
  // Use windowDimensions to avoid hydration mismatches
  const getLightScreenPosition = (): { x: number; y: number } => {
    const centerX = windowDimensions.width / 2;
    const centerY = windowDimensions.height / 2;
    return {
      x: centerX + lightConfig.position.x,
      y: centerY + lightConfig.position.y,
    };
  };
  
  const lightScreenPos = getLightScreenPosition();
  const screenCenterX = windowDimensions.width / 2;
  const screenCenterY = windowDimensions.height / 2;

  return (
    <main 
      className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 relative overflow-hidden"
      suppressHydrationWarning={true}
    >
      {/* Interactive overlay for mouse event handling */}
      {/* Note: Global mouse events are handled in useEffect when dragging */}
      <div
        className="absolute inset-0 z-30 pointer-events-none"
        role="button"
        tabIndex={0}
        aria-label="Illumination test page - drag light source to reposition"
      />

      {/* Control Panel */}
      <div className="absolute top-4 right-4 bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-lg p-4 text-white text-sm z-50 max-w-xs">
        <h2 className="text-lg font-bold mb-4 border-b border-slate-600 pb-2">Light Controls</h2>
        
        {/* Light Color */}
        <div className="mb-4">
          <label htmlFor="light-color" className="block mb-2 text-xs font-medium">
            Light Color
          </label>
          <div className="flex items-center gap-2">
            <input
              id="light-color"
              type="color"
              value={lightColorHex}
              onChange={(e) => handleLightColorChange(e.target.value)}
              className="w-12 h-8 rounded border border-slate-600 cursor-pointer"
            />
            <input
              type="text"
              value={lightColorHex}
              onChange={(e) => handleLightColorChange(e.target.value)}
              className="flex-1 px-2 py-1 bg-slate-700 rounded text-xs"
            />
          </div>
        </div>

        {/* Light Intensity */}
        <div className="mb-4">
          <label htmlFor="light-intensity" className="block mb-2 text-xs font-medium">
            Intensity: {lightIntensity.toFixed(2)}
          </label>
          <input
            id="light-intensity"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={lightIntensity}
            onChange={(e) => handleIntensityChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Light Attenuation */}
        <div className="mb-4">
          <label htmlFor="light-attenuation" className="block mb-2 text-xs font-medium">
            Attenuation: {lightAttenuation.toFixed(4)}
          </label>
          <input
            id="light-attenuation"
            type="range"
            min="0"
            max="0.1"
            step="0.001"
            value={lightAttenuation}
            onChange={(e) => handleAttenuationChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Light Position */}
        <div className="text-xs space-y-1">
          <div>Position X: {lightConfig.position.x.toFixed(0)}</div>
          <div>Position Y: {lightConfig.position.y.toFixed(0)}</div>
          <div>Position Z: {lightConfig.position.z.toFixed(0)}</div>
        </div>

        {/* Grid View Toggle */}
        <div className="mt-4 pt-4 border-t border-slate-600">
          <label htmlFor="grid-view-toggle" className="flex items-center gap-2 cursor-pointer">
            <input
              id="grid-view-toggle"
              type="checkbox"
              checked={useGridView}
              onChange={(e) => setUseGridView(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-xs font-medium">Grid View</span>
          </label>
          <p className="text-xs text-slate-400 mt-1">
            Switch to grid of tiny surfaces covering viewport
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-600 text-xs text-slate-400">
          💡 Drag the light source to move it. Use mouse wheel while dragging to change Z-axis.
        </div>
      </div>

      {/* Only render position-dependent elements after mount to prevent hydration mismatches */}
      {isMounted && (
        <>
          {/* Draggable Light Source Indicator */}
        <div
            className="absolute w-8 h-8 rounded-full border-2 border-yellow-400 bg-yellow-400/30 shadow-lg shadow-yellow-400/50 cursor-move z-40"
          style={{
              left: `${lightScreenPos.x - 16}px`,
              top: `${lightScreenPos.y - 16}px`,
            }}
            role="button"
            tabIndex={0}
            aria-label="Light source - drag to move position"
            onMouseDown={handleLightMouseDown}
          >
            <div className="absolute inset-0 rounded-full bg-yellow-400/50 animate-ping" />
          </div>

          {/* 3D container for planes with perspective */}
          <div
            className="absolute inset-0 z-10"
            style={{
              perspective: '1000px',
              perspectiveOrigin: '50% 50%',
          }}
          >
            {/* Render either original planes or grid planes */}
            {(useGridView ? gridPlanes : PLANE_DEFINITIONS).map((plane) => {
              // Calculate rotation angles from normal vector to show plane orientation
              const { rotateX, rotateY } = calculateRotationFromNormal(plane.normal);

              // Get ref for this plane
              // For grid planes, refs are stored in state (initialized in useEffect)
              // For regular planes, use the pre-defined refs
              const planeRef = useGridView 
                ? (gridPlaneRefsMap[plane.id] || { current: null })
                : planeRefs[plane.id];

          return (
                <div
                  key={plane.id}
                  ref={planeRef}
                  data-plane-id={plane.id}
                  className={`absolute transition-all duration-100 ${useGridView ? 'border border-slate-700' : 'border-2 border-slate-600 rounded'}`}
                  style={{
                    left: `${screenCenterX + plane.position.x - plane.size.width / 2}px`,
                    top: `${screenCenterY + plane.position.y - plane.size.height / 2}px`,
                    width: `${plane.size.width}px`,
                    height: `${plane.size.height}px`,
                    transform: `translate3d(0, 0, ${plane.position.z}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
                    transformStyle: 'preserve-3d',
                    backgroundColor: `rgb(${plane.material.baseColor.r}, ${plane.material.baseColor.g}, ${plane.material.baseColor.b})`,
                  }}
                >
                  {/* Apply illumination effect - this component manages backgroundColor via direct DOM manipulation */}
                  <IlluminationEffect
                    planePosition={plane.position}
                    planeNormal={plane.normal}
                    lightConfig={lightConfig}
                    materialConfig={plane.material}
                    elementRef={planeRef as React.RefObject<HTMLElement | null>}
                  />

                  {/* Plane label (only show for original planes) */}
                  {!useGridView && plane.label && (
                    <div className="absolute bottom-2 left-2 right-2 text-xs text-white/80 font-medium text-center bg-black/30 px-2 py-1 rounded pointer-events-none">
                      {plane.label}
                  </div>
                  )}
            </div>
          );
        })}
      </div>
        </>
      )}
    </main>
  );
}

