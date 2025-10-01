/**
 * @file A React component that renders a dropdown menu for selecting an SVG path example.
 * It is a controlled component that receives the list of examples, the currently
 * selected value, and a handler to manage state changes from its parent.
 */
import React from 'react';
import type { PathExample } from '../types';

/**
 * Props for the ExampleSelector component.
 */
interface ExampleSelectorProps {
  /** A record of available path examples, where the key is the example ID. */
  examples: Record<string, PathExample>;
  /** The ID of the currently selected example. */
  selectedExample: string;
  /** Callback function to be invoked when a new example is selected. */
  handleExampleChange: (id: string) => void;
  /** Translation function for internationalization. */
  t: (key: string, fallback?: string) => string;
}

/**
 * Renders a dropdown (`<select>`) menu to allow users to choose from a list of
 * predefined SVG path examples.
 * @param {ExampleSelectorProps} props - The component's props.
 * @returns {React.JSX.Element} The rendered select dropdown.
 */
const ExampleSelector: React.FC<ExampleSelectorProps> = ({
  examples,
  selectedExample,
  handleExampleChange,
  t,
}) => {
  return (
    <div>
      <label htmlFor="example-select" className="block text-sm font-medium text-gray-700 mb-2">
        {t('controls.selectExample')}
      </label>
      <select
        id="example-select"
        data-testid="example-selector"
        value={selectedExample}
        onChange={(e) => handleExampleChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {Object.entries(examples).map(([id, example]) => (
          <option key={id} value={id}>
            {example.title}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ExampleSelector; 