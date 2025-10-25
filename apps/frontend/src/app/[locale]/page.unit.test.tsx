import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import LandingPage from './page';

describe('[locale]/page (LandingPage) - unit', () => {
  it('renders the landing root and cube', () => {
    render(<LandingPage />);

    expect(screen.getByTestId('landing-root')).toBeInTheDocument();
    expect(screen.getByTestId('cube-wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('cube')).toBeInTheDocument();
  });
});


