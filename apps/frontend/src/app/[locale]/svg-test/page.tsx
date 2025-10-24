'use client';
/**
 * @file Container/controller for the SVG Path Visualizer page.
 *
 * UI composition lives here; path editing state and logic are encapsulated in
 * the useSvgPathEditor hook. This separation improves testability and keeps
 * this component focused on layout/wiring and non-path UI state (e.g., grid/labels).
 */
import { useTranslation } from '@/hooks/useTranslation';
import '@/shared/styles/noselect.css';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocale } from 'i18n';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import ExampleSelector from './components/ExampleSelector';
import LanguageSwitcher from './components/LanguageSwitcher';
import PathCommandBreakdown from './components/PathCommandBreakdown';
import PathEditorControls from './components/PathEditorControls';
import SvgVisualizer from './components/SvgVisualizer';
import { DEFAULT_EXAMPLE_ID, PATH_EXAMPLES as examplesList } from './constants/path-examples';
import { CONTAINER_CLASSES } from './constants/styles';
import { useSvgPathEditor } from './hooks/useSvgPathEditor';
import type { PathExample, Point } from './types';

// Convert the examples array into a Record for efficient O(1) lookups by ID.
const examples: Record<string, PathExample> = examplesList.reduce((acc, ex) => {
  acc[ex.id] = ex;
  return acc;
}, {} as Record<string, PathExample>);

/**
 * The main component for the interactive SVG Path Visualizer page.
 * It manages the SVG path state, handles user interactions for manipulating the path,
 * and renders the visual representation and detailed breakdown of the path data.
 */
const SVGTestPage: React.FC = () => {
  // Get locale from context
  const { locale: currentLocale } = useLocale();
  
  // Translation hooks
  const { t } = useTranslation('svgTest', currentLocale);
  const { t: tCommon } = useTranslation('common', currentLocale);
  
  // Client-only rendering guard to avoid hydration mismatches
  const [isClient, setIsClient] = useState(false);
  // State for the currently selected path example from the dropdown
  const [selectedExample, setSelectedExample] = useState<string>(DEFAULT_EXAMPLE_ID);
  const editor = useSvgPathEditor(examples[DEFAULT_EXAMPLE_ID]?.pathData ?? '');
  const {
    pathString: editorPathString,
    pendingPathString: editorPendingPathString,
    points: editorPoints,
    regeneratePointsFromPath,
    updatePathFromPoints,
  } = editor;

  // UI visibility toggles
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showPoints, setShowPoints] = useState(true);
  // State to track which point is currently being dragged (local to page)
  const [draggingPoint, setDraggingPoint] = useState<Point | null>(null);
  // State for toggling the path fill
  const [showFill, setShowFill] = useState(false);
  
  // Refs for DOM elements
  const svgRef = useRef<SVGSVGElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Handles changing the selected example from the dropdown, updating the path states.
   */
  const handleExampleChange = (exampleId: string) => {
    setSelectedExample(exampleId);
    const example = examples[exampleId];
    if (example) {
      editor.setPathFromExample(example.pathData);
    }
  };

  /**
   * Handles the mouse down event on a draggable point to initiate a drag operation.
   */
  const handleMouseDown = (point: Point) => (e: React.MouseEvent) => {
    e.preventDefault();
    setDraggingPoint(point);

    const handleMouseMove = (event: MouseEvent) => {
      if (!svgRef.current) return;

      const svgPoint = svgRef.current.createSVGPoint();
      svgPoint.x = event.clientX;
      svgPoint.y = event.clientY;

      const ctm = svgRef.current.getScreenCTM();
      if (!ctm) return;

      const transformedPoint = svgPoint.matrixTransform(ctm.inverse());
      
      const newX = parseFloat(transformedPoint.x.toFixed(2));
      const newY = parseFloat(transformedPoint.y.toFixed(2));

      editor.setPoints(prevPoints => {
        const idx = prevPoints.findIndex(p => p.id === point.id);
        if (idx === -1) return prevPoints;
        const target = prevPoints[idx]!;
        // Avoid redundant state updates if position didn't change
        if (target.x === newX && target.y === newY) return prevPoints;
        const next = prevPoints.slice();
        next[idx] = { ...target, x: newX, y: newY };
        return next;
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setDraggingPoint(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Effect to set initial points when the component mounts or example changes
  useEffect(() => {
    // Do not regenerate points from the path string while a drag is in progress.
    // During a drag, the editor.points array is the source of truth.
    if (!draggingPoint) {
      regeneratePointsFromPath(editorPathString);
    }
  }, [editorPathString, regeneratePointsFromPath, draggingPoint]);
  
  // Update path string when points are dragged
  useEffect(() => {
    if (draggingPoint) {
      // Optimized update: rebuild only the affected command using the dragged point id
      const changedId = draggingPoint.id;
      editor.updatePathFromPointsForPoint(changedId);
    }
  }, [editorPoints, draggingPoint, updatePathFromPoints, editor]);

  // Note: editor keeps isPathClosed in sync internally; no page-level effect needed

  // Effect to guard against SSR issues by only rendering full component on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Effect to preserve cursor position in the textarea during state updates
  useLayoutEffect(() => {
    if (textareaRef.current) {
      const { selectionStart, selectionEnd } = textareaRef.current;
      textareaRef.current.value = editorPendingPathString;
      textareaRef.current.selectionStart = selectionStart;
      textareaRef.current.selectionEnd = selectionEnd;
    }
  }, [editorPendingPathString]);

  // Prevent rendering on the server to avoid hydration mismatches
  if (!isClient) return null;

  return (
    <div className="SVGTestPage min-h-screen bg-gradient-to-br from-violet-50 to-indigo-100 py-12 px-2">
      <AnimatePresence>
        <motion.div
          className="max-w-5xl mx-auto rounded-2xl shadow-xl bg-white/80 p-6 md:p-10 border border-violet-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Header */}
          <div className="mb-10">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-violet-700 mb-3 tracking-tight drop-shadow-sm">
                  {t('title')}
                </h1>
                <p className="text-lg text-violet-900/80 mb-1">
                  {t('subtitle')}
                  <br />
                  <span className="text-indigo-500">{t('description')}</span>
                </p>
              </div>
              <LanguageSwitcher t={tCommon} />
            </div>
          </div>

          {/* Controls */}
          <div className={CONTAINER_CLASSES}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ExampleSelector
                examples={examples}
                selectedExample={selectedExample}
                handleExampleChange={handleExampleChange}
                t={t}
              />
            </div>
          </div>

          {/* SVG Canvas and Path Data */}
          <div className={CONTAINER_CLASSES}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <SvgVisualizer
                svgRef={svgRef}
                pathString={editor.pathString}
                points={editor.points}
                showGrid={showGrid}
                setShowGrid={setShowGrid}
                showLabels={showLabels}
                setShowLabels={setShowLabels}
                showPoints={showPoints}
                setShowPoints={setShowPoints}
                showFill={showFill}
                setShowFill={setShowFill}
                handleMouseDown={handleMouseDown}
                t={t}
              />
              <PathEditorControls
                pendingPathString={editor.pendingPathString}
                textareaRef={textareaRef}
                segmentTypeToAppend={editor.segmentTypeToAppend}
                setSegmentTypeToAppend={editor.setSegmentTypeToAppend}
                isRelative={editor.isRelative}
                setIsRelative={editor.setIsRelative}
                isPathClosed={editor.isPathClosed}
                setIsPathClosed={editor.handleClosePath}
                isValid={editor.isValid}
                setPendingPathString={editor.setPendingPathString}
                handleValidate={editor.handleValidate}
                handleAppendSegment={editor.handleAppendSegment}
                handleRoundValues={editor.handleRoundValues}
                t={t}
              />
            </div>
          </div>

          {/* Breakdown Component */}
          <div className={CONTAINER_CLASSES}>
            <PathCommandBreakdown path={editor.pathString} t={t} />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SVGTestPage; 