import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import LandingPage from './page';

describe('[locale]/page (LandingPage) - integration', () => {
  it('shows the rotating cube structure on the gradient background', () => {
    render(<LandingPage />);

    const root = screen.getByTestId('landing-root');
    expect(root).toBeInTheDocument();
    expect(root.className).toMatch(/bg-gradient-to-b/);

    expect(screen.getByTestId('cube-wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('cube')).toBeInTheDocument();
  });
});


