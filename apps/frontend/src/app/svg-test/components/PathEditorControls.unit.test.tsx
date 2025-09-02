import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { APPENDABLE_COMMANDS } from '../constants/svgPath';
import PathEditorControls from './PathEditorControls';

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
};

describe('PathEditorControls', () => {
  beforeEach(() => {
    // Clear all mock function calls before each test
    jest.clearAllMocks();
  });

  it('should render the SVG Path Data textarea with correct label and value', () => {
    render(<PathEditorControls {...mockProps} />);
    expect(screen.getByLabelText('SVG Path Data (d)')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue(mockProps.pendingPathString);
  });

  it('should apply valid styling to the textarea when isValid is true', () => {
    render(<PathEditorControls {...mockProps} isValid={true} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('border-violet-200');
    expect(textarea).not.toHaveClass('border-red-500');
    expect(screen.queryByText('Invalid path data. Please check syntax.')).not.toBeInTheDocument();
  });

  it('should apply invalid styling and show error message when isValid is false', () => {
    render(<PathEditorControls {...mockProps} isValid={false} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('border-red-500');
    expect(screen.getByText('Invalid path data. Please check syntax.')).toBeInTheDocument();
  });

  it('should render all action buttons', () => {
    render(<PathEditorControls {...mockProps} />);
    expect(screen.getByRole('button', { name: 'Validate Path' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Append' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Round All Values' })).toBeInTheDocument();
  });

  it('should render the segment type select dropdown with correct initial value', () => {
    render(<PathEditorControls {...mockProps} segmentTypeToAppend="C" />);
    const select = screen.getByRole('combobox');
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
    expect(screen.getByLabelText('Relative')).toBeChecked();
    expect(screen.getByLabelText('Close Path (Z)')).toBeChecked();
  });

  it('should call setPendingPathString on textarea change', async () => {
    render(<PathEditorControls {...mockProps} />);
    const textarea = screen.getByRole('textbox');
    await userEvent.type(textarea, 'L 20 20');
    expect(mockProps.setPendingPathString).toHaveBeenCalled();
  });

  it('should call handleValidate on "Validate Path" button click', async () => {
    render(<PathEditorControls {...mockProps} />);
    const button = screen.getByRole('button', { name: 'Validate Path' });
    await userEvent.click(button);
    expect(mockProps.handleValidate).toHaveBeenCalledTimes(1);
  });
  
  it('should call setSegmentTypeToAppend on segment type select change', async () => {
    render(<PathEditorControls {...mockProps} />);
    const select = screen.getByRole('combobox');
    await userEvent.selectOptions(select, 'L');
    expect(mockProps.setSegmentTypeToAppend).toHaveBeenCalledWith('L');
  });

  it('should call handleAppendSegment on "Append" button click', async () => {
    render(<PathEditorControls {...mockProps} />);
    const button = screen.getByRole('button', { name: 'Append' });
    await userEvent.click(button);
    expect(mockProps.handleAppendSegment).toHaveBeenCalledTimes(1);
  });
  
  it('should call setIsRelative on "Relative" checkbox change', async () => {
    render(<PathEditorControls {...mockProps} />);
    const checkbox = screen.getByLabelText('Relative');
    await userEvent.click(checkbox);
    expect(mockProps.setIsRelative).toHaveBeenCalledWith(true);
  });

  it('should call setIsPathClosed on "Close Path (Z)" checkbox change', async () => {
    render(<PathEditorControls {...mockProps} />);
    const checkbox = screen.getByLabelText('Close Path (Z)');
    await userEvent.click(checkbox);
    expect(mockProps.setIsPathClosed).toHaveBeenCalledWith(true);
  });

  it('should call handleRoundValues on "Round All Values" button click', async () => {
    render(<PathEditorControls {...mockProps} />);
    const button = screen.getByRole('button', { name: 'Round All Values' });
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
    
    expect(screen.getByRole('button', { name: 'Append' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Round All Values' })).toBeDisabled();
    expect(screen.getByRole('combobox')).toBeDisabled();
    expect(screen.getByLabelText('Relative')).toBeDisabled();
    expect(screen.getByLabelText('Close Path (Z)')).toBeDisabled();
    
    // The validate button should remain enabled
    expect(screen.getByRole('button', { name: 'Validate Path' })).toBeEnabled();
  });
}); 