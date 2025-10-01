import { DEFAULT_LOCALE, FALLBACK_LOCALE, LANGUAGES, NAMESPACES } from './constants';
import { I18N_CONFIG } from './index';
import { SUPPORTED_LOCALES } from './utils';

describe('i18n Index (Main Export)', () => {
  describe('I18N_CONFIG', () => {
    it('should have correct configuration values', () => {
      expect(I18N_CONFIG.supportedLocales).toEqual(SUPPORTED_LOCALES);
      expect(I18N_CONFIG.fallbackLocale).toBe(FALLBACK_LOCALE);
      expect(I18N_CONFIG.defaultLocale).toBe(DEFAULT_LOCALE);
      expect(I18N_CONFIG.namespaces).toEqual(NAMESPACES);
      expect(I18N_CONFIG.languages).toEqual(LANGUAGES);
    });

    it('should have immutable configuration', () => {
      expect(() => {
        (I18N_CONFIG as any).supportedLocales = ['invalid'];
      }).toThrow();
    });
  });
});

