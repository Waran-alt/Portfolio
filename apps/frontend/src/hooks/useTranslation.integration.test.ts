import { renderHook, waitFor } from '@testing-library/react';
import { useTranslation } from './useTranslation';

jest.mock('i18n', () => ({
  getBestLocale: jest.fn((locale: string) => locale),
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

describe('useTranslation Hook (integration)', () => {
  it('loads primary locale file (en)', async () => {
    const { result } = renderHook(() => useTranslation('common', 'en'));
    await waitFor(() => {
      expect(result.current.t('noVars')).toBe('Simple text without variables');
    });
  });

  it('loads different locale file (fr)', async () => {
    const { result } = renderHook(() => useTranslation('common', 'fr'));
    await waitFor(() => {
      expect(result.current.t('welcome', { vars: { name: 'Jean' } })).toBe('Bienvenue, Jean!');
    });
  });

  it('falls back to fallbackLocale (en) when primary (de) is missing', async () => {
    const { result } = renderHook(() => useTranslation('common', 'de'));
    await waitFor(() => {
      expect(result.current.t('noVars')).toBe('Simple text without variables');
    });
  });

  it('supports fallback with variables', async () => {
    const { result } = renderHook(() => useTranslation('common', 'en'));
    await waitFor(() => {
      const translation = result.current.t('missing.key', {
        fallback: 'Welcome to {{place}}!',
        vars: { place: 'Middle-earth' }
      });
      expect(translation).toBe('Welcome to Middle-earth!');
    });
  });

  it('interpolates variables in nested keys', async () => {
    const { result } = renderHook(() => useTranslation('common', 'en'));
    await waitFor(() => {
      const translation = result.current.t('nested.message', {
        vars: { force: 'Force', name: 'Yoda' }
      });
      expect(translation).toBe('May the Force be with Yoda');
    });
  });
});


