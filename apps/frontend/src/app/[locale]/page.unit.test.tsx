import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { LocaleProvider } from 'i18n';

import LandingPage from './page';

function renderHome() {
  return render(
    <LocaleProvider initialLocale="en">
      <LandingPage />
    </LocaleProvider>
  );
}

describe('[locale]/page (home) - unit', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the portfolio hero shell', () => {
    renderHome();

    expect(screen.getByTestId('portfolio-hero')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('data-portfolio-home');
  });

  it('does not register window mousemove listeners (legacy cube behaviour)', () => {
    const addSpy = jest.spyOn(window, 'addEventListener');

    renderHome();

    const mouseMoveListenerRegistered = addSpy.mock.calls.some(([type]) => type === 'mousemove');
    expect(mouseMoveListenerRegistered).toBe(false);
  });
});
