import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Capture latest OverlayMenu props across renders for assertions and triggering handlers
interface OverlayMenuMockProps {
  globalAnimationActive?: boolean;
  devMode?: boolean;
}
let lastOverlayMenuProps: OverlayMenuMockProps | null = null;

// Mock client-only wrapper to render children directly in tests
jest.mock('@/shared/components/ClientOnly', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock OverlayMenu to a lightweight component that records props
jest.mock('@/shared/components/layout/OverlayMenu', () => ({
  __esModule: true,
  default: (props: OverlayMenuMockProps) => {
    lastOverlayMenuProps = props;
    return <div data-testid="overlay-menu" />;
  },
}));

// Mock AnimationManager to avoid heavy rendering
jest.mock('@/features/animations/components/AnimationManager', () => ({
  __esModule: true,
  default: () => <div data-testid="animation-manager" />,
}));

import HomePage from './page';

describe('[locale]/animated-demo/page (HomePage)', () => {
  beforeEach(() => {
    lastOverlayMenuProps = null;
  });

  it('renders heading and core sections', () => {
    render(<HomePage />);

    expect(screen.getByText('Portfolio')).toBeInTheDocument();
    expect(screen.getByTestId('overlay-menu')).toBeInTheDocument();
    expect(screen.getByTestId('animation-manager')).toBeInTheDocument();
  });

  it('passes initial states to OverlayMenu', () => {
    render(<HomePage />);

    expect(lastOverlayMenuProps).toBeTruthy();
    // Defaults from component: backgroundActive=true, devMode=false
    const props = lastOverlayMenuProps as OverlayMenuMockProps;
    expect(props.globalAnimationActive).toBe(true);
    expect(props.devMode).toBe(false);
  });
});


