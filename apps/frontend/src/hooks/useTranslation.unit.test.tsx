import { renderHook, waitFor } from '@testing-library/react';
import { useTranslation } from './useTranslation';

jest.mock('i18n', () => ({
  getBestLocale: jest.fn((locale: string) => locale === 'en' || locale === 'fr' ? locale : 'en'),
  I18N_CONFIG: {
    defaultLocale: 'en',
    fallbackLocale: 'en',
  },
}), { virtual: true });

jest.mock('../../public/locales/en/common.json', () => ({
  welcome: 'Welcome, {{name}}!',
  greeting: 'Hello, {{wizard}}. You shall pass!',
  itemCount: 'You have {{count}} {{item}}',
  multiVar: '{{hero}} found {{count}} {{treasure}} in {{location}}',
  noVars: 'Simple text without variables',
  nested: {
    message: 'May the {{force}} be with {{name}}',
  },
}), { virtual: true });

jest.mock('../../public/locales/fr/common.json', () => ({
  welcome: 'Bienvenue, {{name}}!',
  greeting: 'Bonjour, {{wizard}}!',
}), { virtual: true });

describe('useTranslation Hook', () => {
  describe('Basic translation', () => {
    it('should return translated string', async () => {
      const { result } = renderHook(() => useTranslation('common', 'en'));
      await waitFor(() => {
        expect(result.current.t('noVars')).toBe('Simple text without variables');
      });
    });

    it('should handle nested keys', async () => {
      const { result } = renderHook(() => useTranslation('common', 'en'));
      await waitFor(() => {
        const translation = result.current.t('nested.message', { vars: { force: 'Force', name: 'Luke' } });
        expect(translation).toBe('May the Force be with Luke');
      });
    });

    it('should return key when translation missing', () => {
      const { result } = renderHook(() => useTranslation('common', 'en'));
      expect(result.current.t('missing.key')).toBe('missing.key');
    });
  });

  describe('Fallback support', () => {
    it('should use fallback string when key missing', () => {
      const { result } = renderHook(() => useTranslation('common', 'en'));
      expect(result.current.t('missing.key', { fallback: 'Default text' })).toBe('Default text');
    });

    it('should load fallback locale file when primary locale file is missing', async () => {
      // Force normalization to keep the requested locale as-is so primary tries 'de'
      const { getBestLocale } = jest.requireMock('i18n');
      (getBestLocale as jest.Mock).mockImplementationOnce((locale: string) => locale);

      const { result } = renderHook(() => useTranslation('common', 'de'));

      await waitFor(() => {
        // Should come from en/common.json fallback
        expect(result.current.t('noVars')).toBe('Simple text without variables');
      });
    });

  });

  describe('Variable interpolation', () => {
    it('should replace single variable', async () => {
      const { result } = renderHook(() => useTranslation('common', 'en'));
      await waitFor(() => {
        expect(result.current.t('welcome', { vars: { name: 'Frodo' } })).toBe('Welcome, Frodo!');
      });
    });

    it('should replace multiple variables', async () => {
      const { result } = renderHook(() => useTranslation('common', 'en'));
      await waitFor(() => {
        const translation = result.current.t('itemCount', { 
          vars: { count: 3, item: 'rings' } 
        });
        expect(translation).toBe('You have 3 rings');
      });
    });

    it('should handle many variables', async () => {
      const { result } = renderHook(() => useTranslation('common', 'en'));
      await waitFor(() => {
        const translation = result.current.t('multiVar', {
          vars: { 
            hero: 'Harry',
            count: 7,
            treasure: 'horcruxes',
            location: 'Hogwarts'
          }
        });
        expect(translation).toBe('Harry found 7 horcruxes in Hogwarts');
      });
    });

    it('should convert numbers to strings', async () => {
      const { result } = renderHook(() => useTranslation('common', 'en'));
      await waitFor(() => {
        expect(result.current.t('itemCount', { vars: { count: 42, item: 'droids' } }))
          .toBe('You have 42 droids');
      });
    });

    it('should convert booleans to strings', async () => {
      const { result } = renderHook(() => useTranslation('common', 'en'));
      await waitFor(() => {
        const translation = result.current.t('greeting', { vars: { wizard: true } });
        expect(translation).toBe('Hello, true. You shall pass!');
      });
    });

    it('should handle missing variables gracefully', async () => {
      const { result } = renderHook(() => useTranslation('common', 'en'));
      await waitFor(() => {
        const translation = result.current.t('welcome', { vars: {} });
        expect(translation).toBe('Welcome, {{name}}!');
      });
    });

    it('should work without vars when not needed', async () => {
      const { result } = renderHook(() => useTranslation('common', 'en'));
      await waitFor(() => {
        expect(result.current.t('noVars')).toBe('Simple text without variables');
      });
    });
  });

  describe('Combined features', () => {
    it('should return key when missing and no fallback provided (explicit empty options)', () => {
      const { result } = renderHook(() => useTranslation('common', 'en'));
      expect(result.current.t('missing.key', {})).toBe('missing.key');
    });
    it('should support fallback with variables', () => {
      const { result } = renderHook(() => useTranslation('common', 'en'));
      const translation = result.current.t('missing.key', {
        fallback: 'Welcome to {{place}}!',
        vars: { place: 'Middle-earth' }
      });
      expect(translation).toBe('Welcome to Middle-earth!');
    });

    it('should interpolate variables in nested keys', () => {
      const { result } = renderHook(() => useTranslation('common', 'en'));
      const translation = result.current.t('nested.message', {
        vars: { force: 'Force', name: 'Yoda' }
      });
      expect(translation).toBe('May the Force be with Yoda');
    });
  });

  describe('Locale handling', () => {
    it('should return normalized locale', () => {
      const { result } = renderHook(() => useTranslation('common', 'en'));
      expect(result.current.locale).toBe('en');
    });

    it('should use different locale translations', async () => {
      const { result } = renderHook(() => useTranslation('common', 'fr'));
      await waitFor(() => {
        expect(result.current.t('welcome', { vars: { name: 'Jean' } }))
          .toBe('Bienvenue, Jean!');
      });
    });
  });
});

