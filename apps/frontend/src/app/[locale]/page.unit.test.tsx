import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import LandingPage from './page';

describe('[locale]/page (LandingPage) - unit', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the landing root and cube', () => {
    render(<LandingPage />);

    expect(screen.getByTestId('landing-root')).toBeInTheDocument();
    expect(screen.getByTestId('cube-wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('cube')).toBeInTheDocument();
  });

  it('keeps the illumination light fixed without registering mousemove listeners', () => {
    const addSpy = jest.spyOn(window, 'addEventListener');

    render(<LandingPage />);

    const mouseMoveListenerRegistered = addSpy.mock.calls.some(([type]) => type === 'mousemove');
    expect(mouseMoveListenerRegistered).toBe(false);
  });
});
