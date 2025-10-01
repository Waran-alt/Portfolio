import { DEFAULT_LOCALE, FALLBACK_LOCALE, LANGUAGES, NAMESPACES } from './constants';

describe('i18n Constants', () => {
  describe('LANGUAGES', () => {
    it('should not be empty', () => {
      expect(LANGUAGES.length).toBeGreaterThan(0);
    });

    it('should have unique language codes', () => {
      const codes = LANGUAGES.map(lang => lang.code);
      const uniqueCodes = [...new Set(codes)];
      expect(codes.length).toBe(uniqueCodes.length);
    });

    it('should have all required properties for each language', () => {
      LANGUAGES.forEach(language => {
        expect(language).toHaveProperty('code');
        expect(language).toHaveProperty('name');
        expect(language).toHaveProperty('nativeName');
        expect(language).toHaveProperty('flag');
        expect(typeof language.code).toBe('string');
        expect(typeof language.name).toBe('string');
        expect(typeof language.nativeName).toBe('string');
        expect(typeof language.flag).toBe('string');
        expect(language.code.length).toBeGreaterThan(0);
        expect(language.name.length).toBeGreaterThan(0);
        expect(language.nativeName.length).toBeGreaterThan(0);
        expect(language.flag.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Locale constants', () => {
    it('should have DEFAULT_LOCALE defined as a non-empty string', () => {
      expect(typeof DEFAULT_LOCALE).toBe('string');
      expect(DEFAULT_LOCALE.length).toBeGreaterThan(0);
    });

    it('should have FALLBACK_LOCALE defined as a non-empty string', () => {
      expect(typeof FALLBACK_LOCALE).toBe('string');
      expect(FALLBACK_LOCALE.length).toBeGreaterThan(0);
    });

    it('should have DEFAULT_LOCALE in LANGUAGES array', () => {
      expect(LANGUAGES.some(lang => lang.code === DEFAULT_LOCALE)).toBe(true);
    });

    it('should have FALLBACK_LOCALE in LANGUAGES array', () => {
      expect(LANGUAGES.some(lang => lang.code === FALLBACK_LOCALE)).toBe(true);
    });
  });

  describe('NAMESPACES', () => {
    it('should not be empty', () => {
      expect(NAMESPACES.length).toBeGreaterThan(0);
    });

    it('should have unique namespace names', () => {
      const uniqueNamespaces = [...new Set(NAMESPACES)];
      expect(NAMESPACES.length).toBe(uniqueNamespaces.length);
    });

    it('should contain only non-empty strings', () => {
      NAMESPACES.forEach(namespace => {
        expect(typeof namespace).toBe('string');
        expect(namespace.length).toBeGreaterThan(0);
      });
    });
  });
});

