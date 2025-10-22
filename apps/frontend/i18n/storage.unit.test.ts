import {
  clearLocaleFromCookie,
  clearLocaleFromStorage,
  getLocaleFromCookie,
  getLocaleFromCookieHeader,
  getLocaleFromStorage,
  saveLocaleToCookie,
  saveLocaleToStorage,
} from './storage';

const originalConsoleError = console.error;

describe('i18n storage utilities', () => {
  beforeEach(() => {
    // Reset document.cookie
    Object.defineProperty(document, 'cookie', {
      value: '',
      writable: true,
      configurable: true,
    });

    // Provide a simple localStorage mock
    const store = new Map<string, string>();
    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
      },
      writable: true,
      configurable: true,
    });

    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore?.();
    console.error = originalConsoleError;
    jest.restoreAllMocks();
  });

  describe('localStorage', () => {
    it('saves and reads locale from storage', () => {
      expect(saveLocaleToStorage('en')).toBe(true);
      expect(getLocaleFromStorage()).toBe('en');
    });

    it('clears locale from storage', () => {
      saveLocaleToStorage('fr');
      expect(clearLocaleFromStorage()).toBe(true);
      expect(getLocaleFromStorage()).toBeUndefined();
    });

    it('handles storage errors gracefully', () => {
      Object.defineProperty(global, 'localStorage', {
        value: {
          setItem: () => { throw new Error('blocked'); },
          getItem: () => { throw new Error('blocked'); },
          removeItem: () => { throw new Error('blocked'); },
        },
        configurable: true,
      });

      expect(saveLocaleToStorage('en')).toBe(false);
      expect(getLocaleFromStorage()).toBeUndefined();
      expect(clearLocaleFromStorage()).toBe(false);
    });
  });

  describe('cookies (client)', () => {
    it('saves and reads locale cookie', () => {
      expect(saveLocaleToCookie('fr')).toBe(true);
      expect(getLocaleFromCookie()).toBe('fr');
    });

    it('clears locale cookie', () => {
      saveLocaleToCookie('en');
      expect(clearLocaleFromCookie()).toBe(true);
      // After clear, reading via regex returns undefined
      expect(getLocaleFromCookie()).toBeUndefined();
    });

    it('handles cookie errors gracefully', () => {
      const define = Object.defineProperty;
      define(document, 'cookie', {
        get: () => { throw new Error('blocked'); },
        set: () => { throw new Error('blocked'); },
        configurable: true,
      });

      expect(saveLocaleToCookie('en')).toBe(false);
      expect(getLocaleFromCookie()).toBeUndefined();
      expect(clearLocaleFromCookie()).toBe(false);
    });
  });

  describe('cookies (server header parse)', () => {
    it('parses cookie header value', () => {
      const header = 'foo=bar; portfolio-locale=fr; other=1';
      expect(getLocaleFromCookieHeader(header)).toBe('fr');
    });

    it('returns undefined for missing header or value', () => {
      expect(getLocaleFromCookieHeader(undefined)).toBeUndefined();
      expect(getLocaleFromCookieHeader('foo=bar')).toBeUndefined();
    });
  });
});
