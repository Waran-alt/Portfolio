import { DEFAULT_LOCALE, FALLBACK_LOCALE, LANGUAGES } from './constants';
import {
  getBestLocale,
  getFallbackLocale,
  getLanguageConfig,
  getLanguageName,
  getNativeLanguageName,
  isSupportedLocale,
  SUPPORTED_LOCALES,
  type SupportedLocale
} from './utils';

describe('i18n Utils', () => {
  describe('SUPPORTED_LOCALES', () => {
    it('should match LANGUAGES array codes', () => {
      expect(SUPPORTED_LOCALES).toEqual(LANGUAGES.map(lang => lang.code));
    });

    it('should not be empty', () => {
      expect(SUPPORTED_LOCALES.length).toBeGreaterThan(0);
    });
  });

  describe('getLanguageConfig', () => {
    it('should return language config for configured languages', () => {
      LANGUAGES.forEach(lang => {
        const config = getLanguageConfig(lang.code as SupportedLocale);
        expect(config).toBeDefined();
        expect(config?.code).toBe(lang.code);
        expect(config?.name).toBe(lang.name);
      });
    });

    it('should return undefined for code not in SUPPORTED_LOCALES', () => {
      const invalidCode = 'xx' as SupportedLocale;
      const config = getLanguageConfig(invalidCode);
      expect(config).toBeUndefined();
    });
  });

  describe('getLanguageName', () => {
    it('should return language name for configured languages', () => {
      LANGUAGES.forEach(lang => {
        expect(getLanguageName(lang.code as SupportedLocale)).toBe(lang.name);
      });
    });

    it('should return code for non-existent language', () => {
      const invalidCode = 'xx' as SupportedLocale;
      expect(getLanguageName(invalidCode)).toBe(invalidCode);
    });
  });

  describe('getNativeLanguageName', () => {
    it('should return native name for configured languages', () => {
      LANGUAGES.forEach(lang => {
        expect(getNativeLanguageName(lang.code as SupportedLocale)).toBe(lang.nativeName);
      });
    });

    it('should return code for non-existent language', () => {
      const invalidCode = 'xx' as SupportedLocale;
      expect(getNativeLanguageName(invalidCode)).toBe(invalidCode);
    });
  });

  describe('isSupportedLocale', () => {
    it('should return true for all configured locales', () => {
      SUPPORTED_LOCALES.forEach(locale => {
        expect(isSupportedLocale(locale)).toBe(true);
      });
    });

    it('should return false for unsupported locales', () => {
      expect(isSupportedLocale('xx')).toBe(false);
      expect(isSupportedLocale('zz')).toBe(false);
      expect(isSupportedLocale('')).toBe(false);
    });
  });

  describe('getBestLocale', () => {
    it('should return exact match for supported locales', () => {
      SUPPORTED_LOCALES.forEach(locale => {
        expect(getBestLocale(locale)).toBe(locale);
      });
    });

    it('should extract language part from locale with region', () => {
      SUPPORTED_LOCALES.forEach(locale => {
        const withRegion = `${locale}-XX`;
        expect(getBestLocale(withRegion)).toBe(locale);
      });
    });

    it('should return DEFAULT_LOCALE for unsupported locales', () => {
      expect(getBestLocale('xx')).toBe(DEFAULT_LOCALE);
      expect(getBestLocale('zz-ZZ')).toBe(DEFAULT_LOCALE);
      expect(getBestLocale('invalid')).toBe(DEFAULT_LOCALE);
    });
  });

  describe('getFallbackLocale', () => {
    it('should return DEFAULT_LOCALE when given FALLBACK_LOCALE', () => {
      expect(getFallbackLocale(FALLBACK_LOCALE as SupportedLocale)).toBe(DEFAULT_LOCALE);
    });

    it('should return FALLBACK_LOCALE for locales that are not the fallback', () => {
      const nonFallbackLocales = SUPPORTED_LOCALES.filter(locale => locale !== FALLBACK_LOCALE);
      nonFallbackLocales.forEach(locale => {
        expect(getFallbackLocale(locale as SupportedLocale)).toBe(FALLBACK_LOCALE);
      });
    });
  });
});

