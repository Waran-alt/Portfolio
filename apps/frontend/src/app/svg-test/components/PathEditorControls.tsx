/**
 * @file A React component that provides the user with controls for editing an SVG path string.
 * It includes a textarea for direct manipulation of the path data, along with buttons
 * for validation, appending new segments, closing the path, and rounding numerical values.
 */
import React from 'react';
import { APPENDABLE_COMMANDS, SVG_COMMAND_INFO } from '../constants/svgPath';

/**
 * Props for the PathEditorControls component.
 */
interface PathEditorControlsProps {
  /** The current SVG path string being edited in the textarea. */
  pendingPathString: string;
  /** A ref to the textarea element to control its properties programmatically. */
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  /** The type of SVG segment to append (e.g., 'L', 'Q', 'C'). */
  segmentTypeToAppend: string;
  /** Callback to update the segment type to append. */
  setSegmentTypeToAppend: (type: string) => void;
  /** Whether the appended segment should be relative (lowercase). */
  isRelative: boolean;
  /** Callback to toggle the relative state. */
  setIsRelative: (isRelative: boolean) => void;
  /** Whether the path is closed with a 'Z' command. */
  isPathClosed: boolean;
  /** Callback to toggle the closed path state. */
  setIsPathClosed: (isClosed: boolean) => void;
  /** The validation status of the current path string. */
  isValid: boolean;
  /** Callback to update the pending path string as the user types. */
  setPendingPathString: (value: string) => void;
  /** Callback to validate the current path string and apply it. */
  handleValidate: () => void;
  /** Callback to append a new segment to the path. */
  handleAppendSegment: () => void;
  /** Callback to round all numerical values in the path string. */
  handleRoundValues: () => void;
  /** Translation function for internationalization. */
  t: (key: string, fallback?: string) => string;
}

const BASE_BUTTON_CLASSES = "px-4 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed";
const PRIMARY_BUTTON_CLASSES = "bg-violet-600 text-white hover:bg-violet-700";
const SECONDARY_BUTTON_CLASSES = "bg-violet-100 text-violet-800 hover:bg-violet-200";

/**
 * Renders the right-hand panel of the SVG visualizer UI, containing the
 * textarea for path data and various action buttons.
 * @param {PathEditorControlsProps} props - The component's props.
 * @returns {React.JSX.Element} The rendered editor controls.
 */
const PathEditorControls: React.FC<PathEditorControlsProps> = ({
  pendingPathString,
  textareaRef,
  segmentTypeToAppend,
  setSegmentTypeToAppend,
  isRelative,
  setIsRelative,
  isPathClosed,
  setIsPathClosed,
  isValid,
  setPendingPathString,
  handleValidate,
  handleAppendSegment,
  handleRoundValues,
  t,
}) => {
  return (
    <div className="flex flex-col h-full">
      <div>
        <label htmlFor="path-data-textarea" className="block text-sm font-medium text-violet-700 mb-2">
          {t('controls.pathInputLabel')}
        </label>
        <textarea
          id="path-data-textarea"
          data-testid="path-data-textarea"
          ref={textareaRef}
          value={pendingPathString}
          onChange={(e) => setPendingPathString(e.target.value)}
          className={`w-full h-40 p-3 font-mono text-sm border rounded-md shadow-inner focus:outline-none focus:ring-2 ${
            isValid ? 'border-violet-200 focus:ring-violet-500' : 'border-red-500 ring-2 ring-red-300'
          }`}
          aria-label="SVG Path Data"
          aria-describedby={!isValid ? "path-error" : undefined}
        />
        {!isValid && (
          <p className="mt-2 text-sm text-red-600" id="path-error">
            {pendingPathString.trim() ? t('errors.invalidPath') : t('errors.emptyPath')}
          </p>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 justify-items-start">
        <button
          data-testid="validate-button"
          onClick={handleValidate}
          className={`col-span-1 sm:col-span-2 w-full max-w-[400px] min-w-[150px] ${BASE_BUTTON_CLASSES} ${PRIMARY_BUTTON_CLASSES}`}
        >
          {t('controls.validate')}
        </button>

        {/* Append Segment Controls */}
        <div className="col-span-1 sm:col-span-2 w-full max-w-[400px] min-w-[150px] flex rounded-md shadow-sm">
          <select
            value={segmentTypeToAppend}
            onChange={(e) => setSegmentTypeToAppend(e.target.value)}
            className="relative flex-1 block w-full rounded-none rounded-l-md border-violet-200 bg-violet-50 px-3 py-2 text-violet-900 focus:outline-none focus:ring-2 focus:ring-violet-500 sm:text-sm disabled:opacity-50"
            disabled={!isValid}
            data-testid="segment-type-select"
          >
            {APPENDABLE_COMMANDS.map(cmd => (
              <option key={cmd} value={cmd}>
                {t(`commands.${cmd.toLowerCase()}`) || SVG_COMMAND_INFO[cmd]?.name || cmd} ({cmd})
              </option>
            ))}
          </select>
          <button
            onClick={handleAppendSegment}
            className={`-ml-px relative inline-flex items-center justify-center rounded-r-md border border-violet-200 bg-white px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50 focus:z-10 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed`}
            disabled={!isValid}
            data-testid="append-button"
          >
            {t('controls.appendSegment')}
          </button>
        </div>
        
        {/* Toggles */}
        <fieldset className="col-span-1 flex items-center justify-start gap-x-6 p-2 rounded-md bg-violet-50 border border-violet-200 w-full max-w-[400px] min-w-[150px]">
           <legend className="sr-only">Path Options</legend>
          <label className={`flex items-center gap-2 text-sm ${!isValid ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
            <input
              type="checkbox"
              checked={isRelative}
              onChange={(e) => setIsRelative(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 accent-violet-600"
              disabled={!isValid}
            />
            {t('controls.relativeToggle')}
          </label>
          <label className={`flex items-center gap-2 text-sm ${!isValid ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
            <input
              type="checkbox"
              checked={isPathClosed}
              onChange={(e) => setIsPathClosed(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 accent-violet-600"
              disabled={!isValid}
            />
            {t('controls.closePathToggle')}
          </label>
        </fieldset>


        <button
          onClick={handleRoundValues}
          className={`col-span-1 w-full max-w-[400px] min-w-[150px] ${BASE_BUTTON_CLASSES} ${SECONDARY_BUTTON_CLASSES}`}
          disabled={!isValid}
          data-testid="round-values-button"
        >
          {t('controls.roundValues')}
        </button>
      </div>
    </div>
  );
};

export default PathEditorControls; 