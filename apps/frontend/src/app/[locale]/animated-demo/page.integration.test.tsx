import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

// Render ClientOnly children directly in tests
jest.mock('@/shared/components/ClientOnly', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Lightweight OverlayMenu that exposes handlers and current state
jest.mock('@/shared/components/layout/OverlayMenu', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="overlay-menu">
      <button data-testid="toggle-global" onClick={props.onToggleGlobalAnimation}>
        Toggle Global
      </button>
      <button data-testid="toggle-dev" onClick={props.onToggleDevMode}>
        Toggle Dev
      </button>
      <div data-testid="overlay-status">
        {`global:${props.globalAnimationActive ? 'on' : 'off'}|dev:${props.devMode ? 'on' : 'off'}`}
      </div>
    </div>
  ),
}));

// Avoid heavy work in tests
jest.mock('@/features/animations/components/AnimationManager', () => ({
  __esModule: true,
  default: () => <div data-testid="animation-manager" />,
}));

import HomePage from './page';

describe('[locale]/animated-demo/page integration', () => {
  it('renders heading and base structure', () => {
    render(<HomePage />);
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
    expect(screen.getByTestId('overlay-menu')).toBeInTheDocument();
    expect(screen.getByTestId('animation-manager')).toBeInTheDocument();
    expect(screen.getByTestId('overlay-status')).toHaveTextContent('global:on|dev:off');
  });

  it('toggles dev mode and reflects banner visibility', () => {
    render(<HomePage />);

    // Dev banner absent by default
    expect(
      screen.queryByText(/dev mode: showing animation status and debug info/i)
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('toggle-dev'));

    // Dev banner appears
    expect(
      screen.getByText(/dev mode: showing animation status and debug info/i)
    ).toBeInTheDocument();
    expect(screen.getByTestId('overlay-status')).toHaveTextContent('dev:on');

    // Toggle back
    fireEvent.click(screen.getByTestId('toggle-dev'));
    expect(
      screen.queryByText(/dev mode: showing animation status and debug info/i)
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('overlay-status')).toHaveTextContent('dev:off');
  });

  it('toggles global animation state via overlay control', () => {
    render(<HomePage />);
    expect(screen.getByTestId('overlay-status')).toHaveTextContent('global:on');

    fireEvent.click(screen.getByTestId('toggle-global'));
    expect(screen.getByTestId('overlay-status')).toHaveTextContent('global:off');

    // Toggle back on
    fireEvent.click(screen.getByTestId('toggle-global'));
    expect(screen.getByTestId('overlay-status')).toHaveTextContent('global:on');
  });
});


