/**
 * @file PulseEffect Component Tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import PulseEffect, { type PulseEffectProps } from './PulseEffect';
import { DEFAULT_OPACITY_KEYFRAMES } from './pulse.constants';

describe('PulseEffect Component', () => {
  const defaultProps: PulseEffectProps = {
    x: 100,
    y: 100,
    direction: 'expand',
    duration: 1000,
    ringColor: 'rgba(255, 255, 255, 0.5)',
    ringThickness: 3,
    maxRadius: 100,
    opacityKeyframes: DEFAULT_OPACITY_KEYFRAMES,
    fadeInDuration: 100,
    fadeOutDuration: 200,
    easing: 'linear',
    onComplete: jest.fn(),
    'data-testid': 'pulse-test',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with default props', () => {
    render(<PulseEffect {...defaultProps} />);
    expect(screen.getByTestId('pulse-test')).toBeInTheDocument();
  });

  it('should position correctly at given x, y coordinates', () => {
    render(<PulseEffect {...defaultProps} x={50} y={50} />);
    const container = screen.getByTestId('pulse-test');
    expect(container).toHaveStyle({ left: '50px', top: '50px' });
  });

  it('should apply expand direction correctly', () => {
    const { container } = render(<PulseEffect {...defaultProps} direction="expand" />);
    const ring = container.querySelector('.PulseEffectRing');
    expect(ring).toHaveStyle({ transform: expect.stringContaining('scale(0)') });
  });

  it('should apply shrink direction correctly', () => {
    const { container } = render(<PulseEffect {...defaultProps} direction="shrink" />);
    const ring = container.querySelector('.PulseEffectRing');
    expect(ring).toHaveStyle({ transform: expect.stringContaining('scale(1)') });
  });

  it('should call onComplete callback after animation completes', async () => {
    const onComplete = jest.fn();
    render(<PulseEffect {...defaultProps} onComplete={onComplete} duration={100} />);
    
    // Wait for animation to complete (duration + fade-out)
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    }, { timeout: 500 });
  });

  it('should handle missing onComplete gracefully', async () => {
    const propsWithoutCallback = { ...defaultProps };
    delete propsWithoutCallback.onComplete;
    render(<PulseEffect {...propsWithoutCallback} duration={50} />);
    
    // Should not throw error
    await waitFor(() => {
      expect(screen.getByTestId('pulse-test')).toBeInTheDocument();
    }, { timeout: 200 });
  });

  it('should apply custom ring color', () => {
    const { container } = render(
      <PulseEffect {...defaultProps} ringColor="rgba(255, 0, 0, 0.8)" />
    );
    const ring = container.querySelector('.PulseEffectRing');
    expect(ring).toHaveStyle({ borderColor: 'rgba(255, 0, 0, 0.8)' });
  });

  it('should apply custom ring thickness', () => {
    const { container } = render(<PulseEffect {...defaultProps} ringThickness={10} />);
    const ring = container.querySelector('.PulseEffectRing');
    expect(ring).toHaveStyle({ borderWidth: '10px' });
  });

  it('should apply custom max radius', () => {
    const { container } = render(<PulseEffect {...defaultProps} maxRadius={200} />);
    const ring = container.querySelector('.PulseEffectRing');
    expect(ring).toHaveStyle({ width: '400px', height: '400px' });
  });
});

