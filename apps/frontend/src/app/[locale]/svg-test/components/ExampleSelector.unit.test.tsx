import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import type { PathExample } from '../types';
import ExampleSelector from './ExampleSelector';

describe('ExampleSelector', () => {
  const mockExamples: Record<string, PathExample> = {
    'ex1': { id: 'ex1', title: 'Example 1', description: '', method: '', points: [], pathData: '', showControls: true, showHandles: true },
    'ex2': { id: 'ex2', title: 'Example 2', description: '', method: '', points: [], pathData: '', showControls: true, showHandles: true },
  };
  
  // Provide a deterministic mock translation function
  const t = (key: string) => key;

  test('should render a label linked to the select', () => {
    const { container } = render(
      <ExampleSelector
        examples={mockExamples}
        selectedExample="ex1"
        handleExampleChange={() => {}}
        t={t}
      />
    );
    // Assert the label exists and is linked to the select via htmlFor
    const label = container.querySelector('label[for="example-select"]');
    expect(label).toBeInTheDocument();
  });

  test('should render a select element', () => {
    render(
      <ExampleSelector
        examples={mockExamples}
        selectedExample="ex1"
        handleExampleChange={() => {}}
        t={t}
      />
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  test('should render an option for each example provided', () => {
    render(
      <ExampleSelector
        examples={mockExamples}
        selectedExample="ex1"
        handleExampleChange={() => {}}
        t={t}
      />
    );
    expect(screen.getAllByRole('option')).toHaveLength(2);
    expect(screen.getByText('Example 1')).toBeInTheDocument();
    expect(screen.getByText('Example 2')).toBeInTheDocument();
  });

  test('should set the initial selected option based on the selectedExample prop', () => {
    render(
      <ExampleSelector
        examples={mockExamples}
        selectedExample="ex2"
        handleExampleChange={() => {}}
        t={t}
      />
    );
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('ex2');
  });

  test('should call handleExampleChange with the correct ID when an option is selected', () => {
    const handleExampleChange = jest.fn();
    render(
      <ExampleSelector
        examples={mockExamples}
        selectedExample="ex1"
        handleExampleChange={handleExampleChange}
        t={t}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'ex2' } });

    expect(handleExampleChange).toHaveBeenCalledTimes(1);
    expect(handleExampleChange).toHaveBeenCalledWith('ex2');
  });

  test('should render correctly when the examples object is empty', () => {
    render(
      <ExampleSelector
        examples={{}}
        selectedExample=""
        handleExampleChange={() => {}}
        t={t}
      />
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  test('should render correctly when selectedExample does not match any example ID', () => {
    render(
      <ExampleSelector
        examples={mockExamples}
        selectedExample="nonexistent"
        handleExampleChange={() => {}}
        t={t}
      />
    );
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    // When an invalid value is provided, the browser defaults to the first option
    expect(select.value).toBe('ex1');
  });
}); 