import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import LandingPage from './page';
import { CUBE_CORNER_OFFSETS } from './page.constants';

describe('[locale]/page (LandingPage) - integration', () => {
  it('shows the rotating cube structure on the gradient background', () => {
    render(<LandingPage />);

    const root = screen.getByTestId('landing-root');
    expect(root).toBeInTheDocument();
    expect(root.className).toMatch(/bg-gradient-to-b/);

    expect(screen.getByTestId('cube-wrapper')).toBeInTheDocument();
    const cube = screen.getByTestId('cube');
    expect(cube).toBeInTheDocument();

    const faces = cube.querySelectorAll('[class*="cubeFace"]');
    expect(faces).toHaveLength(6);

    const cornerMarkers = cube.querySelectorAll('[data-corner-key]');
    expect(cornerMarkers).toHaveLength(CUBE_CORNER_OFFSETS.length);

    expect(screen.getByTestId('pulse-trigger-overlay')).toBeInTheDocument();
  });

  it('renders guide lines for each cube corner', () => {
    render(<LandingPage />);

    const guideLines = screen.getAllByTestId('cursor-guide-line');
    expect(guideLines).toHaveLength(8);
  });
});
