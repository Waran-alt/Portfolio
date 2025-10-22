import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { LocaleProvider, useLocale } from './LocaleContext';
import * as storage from './storage';

// Mock storage functions
jest.mock('./storage', () => ({
  getLocaleFromStorage: jest.fn(),
  saveLocaleToStorage: jest.fn(),
  saveLocaleToCookie: jest.fn(),
  getLocaleFromCookie: jest.fn(),
  getLocaleFromCookieHeader: jest.fn(),
  clearLocaleFromStorage: jest.fn(),
  clearLocaleFromCookie: jest.fn(),
}));

/**
 * Test component that uses useLocale hook.
 */
function TestComponent(): React.JSX.Element {
  const { locale, setLocale } = useLocale();
  
  return (
    <div>
      <div data-testid="locale">{locale}</div>
      <button onClick={() => setLocale('fr')} data-testid="set-fr">
        Set French
      </button>
      <button onClick={() => setLocale('en')} data-testid="set-en">
        Set English
      </button>
    </div>
  );
}

describe('LocaleContext', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    (storage.getLocaleFromStorage as jest.Mock).mockReturnValue(undefined);
    (storage.saveLocaleToStorage as jest.Mock).mockReturnValue(true);
    (storage.saveLocaleToCookie as jest.Mock).mockReturnValue(true);
  });

  describe('LocaleProvider', () => {
    it('should initialize with provided initialLocale', () => {
      render(
        <LocaleProvider initialLocale="en">
          <TestComponent />
        </LocaleProvider>
      );

      expect(screen.getByTestId('locale')).toHaveTextContent('en');
    });

    it('should initialize with different locale', () => {
      render(
        <LocaleProvider initialLocale="fr">
          <TestComponent />
        </LocaleProvider>
      );

      expect(screen.getByTestId('locale')).toHaveTextContent('fr');
    });

    it('should normalize invalid locale to default', () => {
      render(
        <LocaleProvider initialLocale="invalid">
          <TestComponent />
        </LocaleProvider>
      );

      expect(screen.getByTestId('locale')).toHaveTextContent('en');
    });

    it('should sync locale when initialLocale prop changes (client-side nav)', () => {
      const { rerender } = render(
        <LocaleProvider initialLocale="en">
          <TestComponent />
        </LocaleProvider>
      );

      expect(screen.getByTestId('locale')).toHaveTextContent('en');

      // Simulate client-side navigation changing the URL param
      rerender(
        <LocaleProvider initialLocale="fr">
          <TestComponent />
        </LocaleProvider>
      );

      // State should sync to the new initialLocale
      expect(screen.getByTestId('locale')).toHaveTextContent('fr');
      // Persistence should be invoked for the new locale
      expect(storage.saveLocaleToStorage).toHaveBeenCalledWith('fr');
      expect(storage.saveLocaleToCookie).toHaveBeenCalledWith('fr');
    });

    it('should not persist locale if same as stored', () => {
      (storage.getLocaleFromStorage as jest.Mock).mockReturnValue('fr');
      
      render(
        <LocaleProvider initialLocale="fr">
          <TestComponent />
        </LocaleProvider>
      );

      // Should not persist since it's the same
      expect(storage.saveLocaleToStorage).not.toHaveBeenCalled();
      expect(storage.saveLocaleToCookie).not.toHaveBeenCalled();
    });

    it('should persist locale changes', async () => {
      render(
        <LocaleProvider initialLocale="en">
          <TestComponent />
        </LocaleProvider>
      );

      const setFrButton = screen.getByTestId('set-fr');
      
      await act(async () => {
        setFrButton.click();
      });

      expect(screen.getByTestId('locale')).toHaveTextContent('fr');
      expect(storage.saveLocaleToStorage).toHaveBeenCalledWith('fr');
      expect(storage.saveLocaleToCookie).toHaveBeenCalledWith('fr');
    });

    it('should switch locale multiple times', async () => {
      render(
        <LocaleProvider initialLocale="en">
          <TestComponent />
        </LocaleProvider>
      );

      const setFrButton = screen.getByTestId('set-fr');
      const setEnButton = screen.getByTestId('set-en');
      
      // Switch to French
      await act(async () => {
        setFrButton.click();
      });
      expect(screen.getByTestId('locale')).toHaveTextContent('fr');

      // Switch back to English
      await act(async () => {
        setEnButton.click();
      });
      expect(screen.getByTestId('locale')).toHaveTextContent('en');

      // Verify both calls were made
      expect(storage.saveLocaleToStorage).toHaveBeenCalledWith('fr');
      expect(storage.saveLocaleToStorage).toHaveBeenCalledWith('en');
    });
  });

  describe('useLocale', () => {
    it('should throw error when used outside LocaleProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useLocale must be used within a LocaleProvider');

      consoleSpy.mockRestore();
    });

    it('should provide locale state and control functions', () => {
      render(
        <LocaleProvider initialLocale="en">
          <TestComponent />
        </LocaleProvider>
      );

      expect(screen.getByTestId('locale')).toHaveTextContent('en');
      expect(screen.getByTestId('set-fr')).toBeInTheDocument();
      expect(screen.getByTestId('set-en')).toBeInTheDocument();
    });
  });
});
