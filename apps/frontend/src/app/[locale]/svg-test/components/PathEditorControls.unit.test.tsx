import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { APPENDABLE_COMMANDS } from '../constants/svgPath';
import PathEditorControls from './PathEditorControls';

// Mock translation function
const t = (key: string, options?: { fallback?: string }) => options?.fallback ?? key;

// Mock the props that will be passed to the component
const mockProps = {
  pendingPathString: 'M 10 10',
  textareaRef: React.createRef<HTMLTextAreaElement>(),
  segmentTypeToAppend: 'Q',
  setSegmentTypeToAppend: jest.fn(),
  isRelative: false,
  setIsRelative: jest.fn(),
  isPathClosed: false,
  setIsPathClosed: jest.fn(),
  isValid: true,
  setPendingPathString: jest.fn(),
  handleValidate: jest.fn(),
  handleAppendSegment: jest.fn(),
  handleRoundValues: jest.fn(),
  t,
};

describe('PathEditorControls', () => {
  beforeEach(() => {
    // Clear all mock function calls before each test
    jest.clearAllMocks();
  });

  it('should render the textarea with the current value', () => {
    render(<PathEditorControls {...mockProps} />);
    expect(screen.getByTestId('path-data-textarea')).toBeInTheDocument();
    expect(screen.getByTestId('path-data-textarea')).toHaveValue(mockProps.pendingPathString);
  });

  it('should apply valid styling to the textarea when isValid is true', () => {
    render(<PathEditorControls {...mockProps} isValid={true} />);
    const textarea = screen.getByTestId('path-data-textarea');
    expect(textarea).toHaveClass('border-violet-200');
    expect(textarea).not.toHaveClass('border-red-500');
    // No error element should be present
    expect(textarea).not.toHaveAttribute('aria-describedby', 'path-error');
    expect(document.getElementById('path-error')).toBeNull();
  });

  it('should apply invalid styling and show error message when isValid is false', () => {
    render(<PathEditorControls {...mockProps} isValid={false} />);
    const textarea = screen.getByTestId('path-data-textarea');
    expect(textarea).toHaveClass('border-red-500');
    // Error element should be present via accessibility hook-up
    expect(textarea).toHaveAttribute('aria-describedby', 'path-error');
    expect(document.getElementById('path-error')).toBeInTheDocument();
  });

  it('should render all action buttons', () => {
    render(<PathEditorControls {...mockProps} />);
    expect(screen.getByTestId('validate-button')).toBeInTheDocument();
    expect(screen.getByTestId('append-button')).toBeInTheDocument();
    expect(screen.getByTestId('round-values-button')).toBeInTheDocument();
  });

  it('should render the segment type select dropdown with correct initial value', () => {
    render(<PathEditorControls {...mockProps} segmentTypeToAppend="C" />);
    const select = screen.getByTestId('segment-type-select');
    expect(select).toHaveValue('C');
  });

  it('should populate the segment type select dropdown with options from APPENDABLE_COMMANDS', () => {
    render(<PathEditorControls {...mockProps} />);
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(APPENDABLE_COMMANDS.length);
    options.forEach((option, index) => {
      expect(option).toHaveValue(APPENDABLE_COMMANDS[index]);
    });
  });

  it('should render the "Relative" and "Close Path (Z)" checkboxes with correct initial state', () => {
    render(<PathEditorControls {...mockProps} isRelative={true} isPathClosed={true} />);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).toBeChecked();
  });

  it('should call setPendingPathString on textarea change', async () => {
    render(<PathEditorControls {...mockProps} />);
    const textarea = screen.getByTestId('path-data-textarea');
    await userEvent.type(textarea, 'L 20 20');
    expect(mockProps.setPendingPathString).toHaveBeenCalled();
  });

  it('should call handleValidate on "Validate Path" button click', async () => {
    render(<PathEditorControls {...mockProps} />);
    const button = screen.getByTestId('validate-button');
    await userEvent.click(button);
    expect(mockProps.handleValidate).toHaveBeenCalledTimes(1);
  });
  
  it('should call setSegmentTypeToAppend on segment type select change', async () => {
    render(<PathEditorControls {...mockProps} />);
    const select = screen.getByTestId('segment-type-select');
    await userEvent.selectOptions(select, 'L');
    expect(mockProps.setSegmentTypeToAppend).toHaveBeenCalledWith('L');
  });

  it('should call handleAppendSegment on "Append" button click', async () => {
    render(<PathEditorControls {...mockProps} />);
    const button = screen.getByTestId('append-button');
    await userEvent.click(button);
    expect(mockProps.handleAppendSegment).toHaveBeenCalledTimes(1);
  });
  
  it('should call setIsRelative on "Relative" checkbox change', async () => {
    render(<PathEditorControls {...mockProps} />);
    const checkbox = screen.getAllByRole('checkbox')[0]!;
    await userEvent.click(checkbox);
    expect(mockProps.setIsRelative).toHaveBeenCalledWith(true);
  });

  it('should call setIsPathClosed on "Close Path (Z)" checkbox change', async () => {
    render(<PathEditorControls {...mockProps} />);
    const checkbox = screen.getAllByRole('checkbox')[1]!;
    await userEvent.click(checkbox);
    expect(mockProps.setIsPathClosed).toHaveBeenCalledWith(true);
  });

  it('should call handleRoundValues on "Round All Values" button click', async () => {
    render(<PathEditorControls {...mockProps} />);
    const button = screen.getByTestId('round-values-button');
    await userEvent.click(button);
    expect(mockProps.handleRoundValues).toHaveBeenCalledTimes(1);
  });

  it('should assign the textareaRef to the textarea element', () => {
    const ref = React.createRef<HTMLTextAreaElement>();
    render(<PathEditorControls {...mockProps} textareaRef={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });
  
  it('should disable controls when isValid is false', () => {
    render(<PathEditorControls {...mockProps} isValid={false} />);
    
    expect(screen.getByTestId('append-button')).toBeDisabled();
    expect(screen.getByTestId('round-values-button')).toBeDisabled();
    expect(screen.getByTestId('segment-type-select')).toBeDisabled();
    expect(screen.getAllByRole('checkbox')[0]!).toBeDisabled();
    expect(screen.getAllByRole('checkbox')[1]!).toBeDisabled();
    
    // The validate button should remain enabled
    expect(screen.getByTestId('validate-button')).toBeEnabled();
  });
}); 