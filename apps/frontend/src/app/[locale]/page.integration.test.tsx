import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import LandingPage from './page';
import { CUBE_CORNER_OFFSETS, INNER_CUBE_CORNER_OFFSETS } from './page.constants';

describe('[locale]/page (LandingPage) - integration', () => {
  it('shows the rotating cube structure on the gradient background', () => {
    render(<LandingPage />);

    const root = screen.getByTestId('landing-root');
    expect(root).toBeInTheDocument();
    expect(root.className).toMatch(/bg-gradient-to-b/);

    expect(screen.getByTestId('cube-wrapper')).toBeInTheDocument();
    const cube = screen.getByTestId('cube');
    expect(cube).toBeInTheDocument();

    const faces = screen.getAllByTestId('cube-face');
    expect(faces).toHaveLength(6);

    const innerFaces = screen.getAllByTestId('inner-cube-face');
    expect(innerFaces).toHaveLength(6);

    const pulseWrapper = screen.getByTestId('cube-pulse');
    expect(pulseWrapper).toBeInTheDocument();
    const pulseFaces = screen.getAllByTestId('cube-pulse-face');
    expect(pulseFaces).toHaveLength(6);

    const tesseractLines = screen.getAllByTestId('tesseract-connecting-line');
    expect(tesseractLines).toHaveLength(8);
    const pulseFacesSecondary = screen.getAllByTestId('cube-pulse-face-secondary');
    expect(pulseFacesSecondary).toHaveLength(6);

    const cornerMarkers = cube.querySelectorAll('[data-corner-key]');
    expect(cornerMarkers).toHaveLength(CUBE_CORNER_OFFSETS.length + INNER_CUBE_CORNER_OFFSETS.length);

    expect(screen.getByTestId('pulse-trigger-overlay')).toBeInTheDocument();
  });

  it('renders guide lines for each cube corner', () => {
    render(<LandingPage />);

    const guideLines = screen.getAllByTestId('cursor-guide-line');
    expect(guideLines).toHaveLength(8);
  });
});
