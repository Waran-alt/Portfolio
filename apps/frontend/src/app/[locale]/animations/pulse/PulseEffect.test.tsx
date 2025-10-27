import { render, screen, waitFor } from '@testing-library/react';
import PulseEffect, { type PulseEffectProps } from './PulseEffect';

describe('PulseEffect Component', () => {
  const defaultProps: PulseEffectProps = {
    x: 100,
    y: 100,
    direction: 'expand',
    duration: 1000,
    ringColor: 'rgba(255, 255, 255, 1)',
    maxRadius: 100,
    outerBlur: 20,
    outerSpread: 10,
    innerBlur: 20,
    innerSpread: 5,
    fadeInDuration: 100,
    fadeInToAnimationDuration: 100,
    fadeOutDuration: 200,
    initialOpacity: 1,
    animationOpacity: 1,
    finalOpacity: 0,
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
    const transform = ring?.getAttribute('style');
    expect(transform).toContain('scale(0)');
  });

  it('should apply shrink direction correctly', () => {
    const { container } = render(<PulseEffect {...defaultProps} direction="shrink" />);
    const ring = container.querySelector('.PulseEffectRing');
    const transform = ring?.getAttribute('style');
    expect(transform).toContain('scale(1)');
  });

  it('should call onComplete callback after animation completes', async () => {
    const onComplete = jest.fn();
    render(
      <PulseEffect 
        {...defaultProps} 
        onComplete={onComplete} 
        duration={50}
        fadeInDuration={0}
        fadeInToAnimationDuration={0}
        fadeOutDuration={0}
      />
    );
    
    // Wait for animation to complete
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    }, { timeout: 200 });
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
    render(
      <PulseEffect {...defaultProps} ringColor="rgba(255, 0, 0, 0.8)" />
    );
    expect(screen.getByTestId('pulse-test')).toBeInTheDocument();
  });

  it('should apply custom max radius', () => {
    const { container } = render(<PulseEffect {...defaultProps} maxRadius={200} />);
    const ring = container.querySelector('.PulseEffectRing');
    // Inner size is calculated as (maxRadius - innerSpread) * 2
    expect(ring).toHaveStyle({ width: '390px', height: '390px' });
  });

  it('should apply custom outer blur and spread', () => {
    const { container } = render(
      <PulseEffect {...defaultProps} outerBlur={30} outerSpread={15} />
    );
    expect(container.querySelector('.PulseEffectRing')).toBeInTheDocument();
  });

  it('should apply custom inner blur and spread', () => {
    const { container } = render(
      <PulseEffect {...defaultProps} innerBlur={25} innerSpread={10} />
    );
    const ring = container.querySelector('.PulseEffectRing');
    // Inner size is calculated as (maxRadius - innerSpread) * 2
    expect(ring).toHaveStyle({ width: '180px', height: '180px' });
  });

  it('should apply custom opacity values', () => {
    render(
      <PulseEffect 
        {...defaultProps} 
        initialOpacity={0.5}
        animationOpacity={0.8}
        finalOpacity={0.2}
      />
    );
    expect(screen.getByTestId('pulse-test')).toBeInTheDocument();
  });

  it('should handle different easing functions', () => {
    const easings = ['linear', 'ease-in', 'ease-out', 'ease-in-out'] as const;
    easings.forEach((easing) => {
      const { unmount } = render(<PulseEffect {...defaultProps} easing={easing} />);
      expect(screen.getByTestId('pulse-test')).toBeInTheDocument();
      unmount();
    });
  });

  it('should handle zero durations without NaN errors', async () => {
    const onComplete = jest.fn();
    render(
      <PulseEffect 
        {...defaultProps} 
        onComplete={onComplete}
        fadeInDuration={0}
        fadeInToAnimationDuration={0}
        fadeOutDuration={0}
        duration={50}
      />
    );
    
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    }, { timeout: 500 });
  });

  it('should handle shrink direction', () => {
    const { container } = render(<PulseEffect {...defaultProps} direction="shrink" />);
    const ring = container.querySelector('.PulseEffectRing');
    const transform = ring?.getAttribute('style');
    expect(transform).toContain('scale(1)');
  });
});

