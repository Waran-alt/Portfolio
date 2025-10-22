/**
 * @file Renders a human-readable breakdown of an SVG path string.
 * It parses the path and displays each command, its name, parameters, and values
 * in a clear, card-based layout for easy analysis.
 */
import type { TranslationFunction } from '@/hooks/useTranslation';
import React, { useState } from 'react';
import type { Command as SVGCommand } from 'svg-path-parser';
import * as parser from 'svg-path-parser';
import { CONTAINER_CLASSES } from '../constants/styles';
import { SVG_COMMAND_INFO } from '../constants/svgPath';
import { getCommandValue } from '../utils/svgCommandHelpers';
import { DECIMAL_DIGITS, formatNumber } from '../utils/svgPath';

/**
 * A React component that takes an SVG path string and renders a human-readable
 * breakdown of each command. It displays the command name, its parameters, and
 * provides a control to adjust the numerical precision of the displayed values.
 *
 * @param {PathCommandBreakdownProps} props - The component props.
 * @returns {React.JSX.Element | null} The rendered component or null if the path is empty.
 */
// Future-proofing Note: For extremely long SVG paths with thousands of commands,
// rendering each command in a separate div might become a performance bottleneck.
// If this tool were to be used for such scenarios, consider implementing a
// virtualized list (e.g., using react-window or react-virtualized)
// to render only the visible items.
const PathCommandBreakdownComponent = ({ path, t }: { path: string; t: TranslationFunction }): React.JSX.Element | null => {
  // State to control the number of decimal places for displaying numeric values.
  const [digits, setDigits] = useState<number>(DECIMAL_DIGITS);
  
  let commands: SVGCommand[] = [];
  try {
    commands = parser.parseSVG(path);
  } catch {
    // If parsing fails, render a user-friendly error message.
    return <div className="text-red-600 text-xs mt-2" aria-live="polite">{t('errors.invalidPath')}</div>;
  }
  // Do not render anything if the path is empty or contains no commands.
  if (!commands.length) return null;
  return (
    <div className={CONTAINER_CLASSES}>
      <div className="mb-2 flex items-center gap-4">
        <div className="text-violet-700 font-semibold flex items-center gap-2">
          <span>{t('breakdown.title')}</span>
        </div>
        {/* UI to control the precision of displayed numbers */}
        <label className="ml-auto flex items-center gap-1 text-xs text-violet-700">
          {t('controls.decimalsLabel')}:
          <select
            value={digits}
            onChange={e => setDigits(Number(e.target.value))}
            className="rounded border border-violet-200 px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
          >
            {[0,1,2,3,4,5,6].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        {/* Iterate over each parsed command and render its details */}
        {commands.map((cmd, i) => {
          // Look up command information (name, params) from our constants.
          const info = SVG_COMMAND_INFO[cmd.code.toUpperCase()] || { name: 'Unknown', params: [], desc: '' };
          const commandKey = cmd.code.toLowerCase();
          return (
            <div
              key={`${i}-${JSON.stringify(cmd)}`}
              className="flex flex-col items-center px-3 py-2 bg-white rounded-md border border-violet-100 shadow-sm min-w-[120px]"
            >
              <div className="flex items-center gap-1 mb-1">
                <span className="text-violet-600 font-bold text-lg">{cmd.code}</span>
                <span className="text-xs text-gray-500">{t(`commands.${commandKey}.name`, { fallback: info.name })}</span>
              </div>
              <div className="text-xs text-gray-700 mb-1">{t(`commands.${commandKey}.desc`, { fallback: info.desc })}</div>
              <div className="flex flex-wrap gap-1">
                {/* Display each parameter and its value, formatted to the selected number of digits. */}
                {info.params.map(param => {
                  const value = getCommandValue(cmd, param);
                  if (value !== undefined) {
                    return (
                      <span key={param} data-testid="path-parameter" className="inline-block bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded text-xs font-mono border border-violet-200">
                        {param}: {typeof value === 'number' ? formatNumber(value, digits) : String(value)}
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PathCommandBreakdown = React.memo(PathCommandBreakdownComponent);
PathCommandBreakdown.displayName = 'PathCommandBreakdown';

export default PathCommandBreakdown; 