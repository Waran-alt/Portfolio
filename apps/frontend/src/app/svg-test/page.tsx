'use client';

import { motion } from 'framer-motion';
import React, { useRef, useState } from 'react';

interface Point {
  x: number;
  y: number;
  id: string;
  label: string;
}

interface PathExample {
  id: string;
  title: string;
  description: string;
  method: 'quadratic' | 'cubic' | 'arc' | 'catmull-rom' | 'bezier' | 'spline';
  points: Point[];
  pathData: string;
  showControls: boolean;
  showHandles: boolean;
}

const SVGTestPage: React.FC = () => {
  const [activeExample, setActiveExample] = useState<string>('quadratic-1');
  const [showAllControls, setShowAllControls] = useState(true);
  const [showAllHandles, setShowAllHandles] = useState(true);
  const [draggedPoint, setDraggedPoint] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Initialize examples with different curved shape methods
  const [examples, setExamples] = useState<PathExample[]>([
    {
      id: 'quadratic-1',
      title: 'Quadratic Bézier Curve',
      description: 'Simple curve with one control point',
      method: 'quadratic',
      points: [
        { x: 100, y: 200, id: 'start', label: 'Start' },
        { x: 200, y: 100, id: 'control', label: 'Control' },
        { x: 300, y: 200, id: 'end', label: 'End' }
      ],
      pathData: 'M 100 200 Q 200 100 300 200',
      showControls: true,
      showHandles: true
    },
    {
      id: 'cubic-1',
      title: 'Cubic Bézier Curve',
      description: 'Complex curve with two control points',
      method: 'cubic',
      points: [
        { x: 100, y: 200, id: 'start', label: 'Start' },
        { x: 150, y: 100, id: 'control1', label: 'Control 1' },
        { x: 250, y: 100, id: 'control2', label: 'Control 2' },
        { x: 300, y: 200, id: 'end', label: 'End' }
      ],
      pathData: 'M 100 200 C 150 100 250 100 300 200',
      showControls: true,
      showHandles: true
    },
    {
      id: 'arc-1',
      title: 'SVG Arc',
      description: 'Elliptical arc with radius and flags',
      method: 'arc',
      points: [
        { x: 100, y: 200, id: 'start', label: 'Start' },
        { x: 300, y: 200, id: 'end', label: 'End' },
        { x: 200, y: 150, id: 'center', label: 'Center' }
      ],
      pathData: 'M 100 200 A 100 50 0 0 1 300 200',
      showControls: true,
      showHandles: false
    },
    {
      id: 'catmull-rom-1',
      title: 'Catmull-Rom Spline',
      description: 'Smooth curve through multiple points',
      method: 'catmull-rom',
      points: [
        { x: 50, y: 200, id: 'p0', label: 'P0' },
        { x: 100, y: 150, id: 'p1', label: 'P1' },
        { x: 200, y: 100, id: 'p2', label: 'P2' },
        { x: 300, y: 150, id: 'p3', label: 'P3' },
        { x: 350, y: 200, id: 'p4', label: 'P4' }
      ],
      pathData: generateCatmullRomPath([
        { x: 50, y: 200 },
        { x: 100, y: 150 },
        { x: 200, y: 100 },
        { x: 300, y: 150 },
        { x: 350, y: 200 }
      ]),
      showControls: true,
      showHandles: false
    },
    {
      id: 'bezier-spline-1',
      title: 'Bézier Spline',
      description: 'Multiple cubic Bézier curves connected smoothly',
      method: 'bezier',
      points: [
        { x: 50, y: 200, id: 'start', label: 'Start' },
        { x: 100, y: 100, id: 'c1', label: 'C1' },
        { x: 150, y: 100, id: 'c2', label: 'C2' },
        { x: 200, y: 200, id: 'mid', label: 'Mid' },
        { x: 250, y: 100, id: 'c3', label: 'C3' },
        { x: 300, y: 100, id: 'c4', label: 'C4' },
        { x: 350, y: 200, id: 'end', label: 'End' }
      ],
      pathData: 'M 50 200 C 100 100 150 100 200 200 S 250 100 350 200',
      showControls: true,
      showHandles: true
    },
    {
      id: 'smooth-spline-1',
      title: 'Smooth Spline',
      description: 'Smooth curve with tension control',
      method: 'spline',
      points: [
        { x: 50, y: 200, id: 'p1', label: 'P1' },
        { x: 150, y: 100, id: 'p2', label: 'P2' },
        { x: 250, y: 150, id: 'p3', label: 'P3' },
        { x: 350, y: 200, id: 'p4', label: 'P4' }
      ],
      pathData: generateSmoothSplinePath([
        { x: 50, y: 200 },
        { x: 150, y: 100 },
        { x: 250, y: 150 },
        { x: 350, y: 200 }
      ]),
      showControls: true,
      showHandles: false
    }
  ]);

  // Generate Catmull-Rom spline path
  function generateCatmullRomPath(points: { x: number; y: number }[]): string {
    if (points.length < 3) return '';
    
    if (!points[0]) return '';
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      
      // Ensure all points exist before using them
      if (p0 && p1 && p2 && p3) {
        // Catmull-Rom control points
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        
        path += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
      }
    }
    
    return path;
  }

  // Generate smooth spline path
  function generateSmoothSplinePath(points: { x: number; y: number }[]): string {
    if (points.length < 2) return '';
    
    if (!points[0]) return '';
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[Math.min(points.length - 1, i + 1)];
      
      // Ensure all points exist before using them
      if (prev && curr && next) {
        // Calculate smooth control points
        const tension = 0.3;
        const cp1x = prev.x + (curr.x - prev.x) * tension;
        const cp1y = prev.y + (curr.y - prev.y) * tension;
        const cp2x = curr.x - (next.x - prev.x) * tension;
        const cp2y = curr.y - (next.y - prev.y) * tension;
        
        path += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${curr.x} ${curr.y}`;
      }
    }
    
    return path;
  }

  // Calculate path data for an example
  function calculatePathData(example: PathExample): string {
    switch (example.method) {
      case 'quadratic':
        if (example.points.length >= 3) {
          const [start, control, end] = example.points;
          if (start && control && end) {
            return `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`;
          }
        }
        break;
      case 'cubic':
        if (example.points.length >= 4) {
          const [start, control1, control2, end] = example.points;
          if (start && control1 && control2 && end) {
            return `M ${start.x} ${start.y} C ${control1.x} ${control1.y} ${control2.x} ${control2.y} ${end.x} ${end.y}`;
          }
        }
        break;
      case 'arc':
        if (example.points.length >= 2) {
          const [start, end] = example.points;
          if (start && end) {
            const radiusX = Math.abs(end.x - start.x) / 2;
            const radiusY = 50;
            return `M ${start.x} ${start.y} A ${radiusX} ${radiusY} 0 0 1 ${end.x} ${end.y}`;
          }
        }
        break;
      case 'catmull-rom':
        return generateCatmullRomPath(example.points);
      case 'bezier':
        if (example.points.length >= 7) {
          const [start, c1, c2, mid, c3, c4, end] = example.points;
          if (start && c1 && c2 && mid && c3 && c4 && end) {
            return `M ${start.x} ${start.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${mid.x} ${mid.y} S ${c3.x} ${c3.y} ${end.x} ${end.y}`;
          }
        }
        break;
      case 'spline':
        return generateSmoothSplinePath(example.points);
    }
    return example.pathData;
  }

  // Handle mouse events for dragging points
  const handleMouseDown = (pointId: string) => {
    setDraggedPoint(pointId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedPoint || !svgRef.current) return;
    
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setExamples(prev => prev.map(example => ({
      ...example,
      points: example.points.map(point => 
        point.id === draggedPoint ? { ...point, x, y } : point
      )
    })));
  };

  const handleMouseUp = () => {
    setDraggedPoint(null);
  };

  // Render control lines for Bézier curves
  const renderControlLines = (example: PathExample) => {
    if (!example.showControls) return null;
    
    const lines = [];
    
    switch (example.method) {
      case 'quadratic':
        if (example.points.length >= 3) {
          const [start, control, end] = example.points;
          if (start && control && end) {
            lines.push(
              <line
                key="control-line-1"
                x1={start.x}
                y1={start.y}
                x2={control.x}
                y2={control.y}
                stroke="#ff6b6b"
                strokeWidth="1"
                strokeDasharray="5,5"
                opacity="0.6"
              />,
              <line
                key="control-line-2"
                x1={control.x}
                y1={control.y}
                x2={end.x}
                y2={end.y}
                stroke="#ff6b6b"
                strokeWidth="1"
                strokeDasharray="5,5"
                opacity="0.6"
              />
            );
          }
        }
        break;
      case 'cubic':
        if (example.points.length >= 4) {
          const [start, control1, control2, end] = example.points;
          if (start && control1 && control2 && end) {
            lines.push(
              <line
                key="control-line-1"
                x1={start.x}
                y1={start.y}
                x2={control1.x}
                y2={control1.y}
                stroke="#ff6b6b"
                strokeWidth="1"
                strokeDasharray="5,5"
                opacity="0.6"
              />,
              <line
                key="control-line-2"
                x1={control1.x}
                y1={control1.y}
                x2={control2.x}
                y2={control2.y}
                stroke="#4ecdc4"
                strokeWidth="1"
                strokeDasharray="5,5"
                opacity="0.6"
              />,
              <line
                key="control-line-3"
                x1={control2.x}
                y1={control2.y}
                x2={end.x}
                y2={end.y}
                stroke="#45b7d1"
                strokeWidth="1"
                strokeDasharray="5,5"
                opacity="0.6"
              />
            );
          }
        }
        break;
    }
    
    return lines;
  };

  // Render control handles
  const renderControlHandles = (example: PathExample) => {
    if (!example.showHandles) return null;
    
    return example.points.map((point, index) => {
      const isControl = point.id.includes('control') || point.id.includes('c');
      const isEndpoint = point.id === 'start' || point.id === 'end';
      
      return (
        <g key={point.id}>
          <circle
            cx={point.x}
            cy={point.y}
            r={isControl ? 6 : 8}
            fill={isControl ? "#ff6b6b" : isEndpoint ? "#4ecdc4" : "#45b7d1"}
            stroke="#fff"
            strokeWidth="2"
            cursor="pointer"
            onMouseDown={() => handleMouseDown(point.id)}
            style={{ pointerEvents: 'all' }}
          />
          <text
            x={point.x}
            y={point.y - 15}
            textAnchor="middle"
            fontSize="12"
            fill="#333"
            fontWeight="bold"
          >
            {point.label}
          </text>
        </g>
      );
    });
  };

  const currentExample = examples.find(ex => ex.id === activeExample);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            SVG Path Testing Lab
          </h1>
          <p className="text-lg text-gray-600">
            Interactive examples of different curved shape creation methods with visual reference points and control lines.
            Drag the points to see how the curves change in real-time.
          </p>
        </motion.div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Method
              </label>
              <select
                value={activeExample}
                onChange={(e) => setActiveExample(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {examples.map(example => (
                  <option key={example.id} value={example.id}>
                    {example.title}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showAllControls}
                  onChange={(e) => setShowAllControls(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Show Control Lines</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showAllHandles}
                  onChange={(e) => setShowAllHandles(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Show Handles</span>
              </label>
            </div>
          </div>
        </div>

        {/* SVG Canvas */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {currentExample?.title}
            </h2>
            <p className="text-gray-600 mb-4">
              {currentExample?.description}
            </p>
            <div className="bg-gray-100 p-3 rounded-md font-mono text-sm">
              <code className="text-blue-600">{currentExample ? calculatePathData(currentExample) : ''}</code>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <svg
              ref={svgRef}
              width="100%"
              height="400"
              viewBox="0 0 400 400"
              className="bg-gray-50"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Grid */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Control Lines */}
              {showAllControls && currentExample && renderControlLines(currentExample)}

              {/* Path */}
              <path
                d={currentExample ? calculatePathData(currentExample) : ''}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Control Handles */}
              {showAllHandles && currentExample && renderControlHandles(currentExample)}
            </svg>
          </div>
        </div>

        {/* Method Comparison */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Method Comparison
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {examples.map(example => (
              <div
                key={example.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  activeExample === example.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setActiveExample(example.id)}
              >
                <h4 className="font-semibold text-gray-900 mb-2">
                  {example.title}
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  {example.description}
                </p>
                <div className="text-xs text-gray-500">
                  <div>Points: {example.points.length}</div>
                  <div>Method: {example.method}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SVGTestPage; 