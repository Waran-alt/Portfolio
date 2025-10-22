/**
 * @file Unit tests for i18n middleware utilities.
 * 
 * Tests locale detection, validation, and URL manipulation functions.
 */

import { NextRequest } from 'next/server';
import { DEFAULT_LOCALE } from './constants';
import {
  addLocalePrefix,
  determineTargetLocale,
  getLocaleFromHeaders,
  getLocaleFromPathname,
  hasLocalePrefix,
  removeLocalePrefix,
} from './middleware';
import { SUPPORTED_LOCALES } from './utils';

// Mock the middleware utils
jest.mock('@/middleware/utils', () => ({
  getAcceptLanguageValues: jest.fn(),
  getFirstPathSegment: jest.fn(),
}));

// Mock storage cookie parser
jest.mock('./storage', () => ({
  getLocaleFromCookieHeader: jest.fn(),
}));

import { getAcceptLanguageValues, getFirstPathSegment } from '@/middleware/utils';
import { getLocaleFromCookieHeader } from './storage';

const mockGetAcceptLanguageValues = getAcceptLanguageValues as jest.MockedFunction<typeof getAcceptLanguageValues>;
const mockGetFirstPathSegment = getFirstPathSegment as jest.MockedFunction<typeof getFirstPathSegment>;
const mockGetLocaleFromCookieHeader = getLocaleFromCookieHeader as jest.MockedFunction<typeof getLocaleFromCookieHeader>;

describe('i18n middleware utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getLocaleFromPathname', () => {
    it('should extract locale from pathname', () => {
      const valid = SUPPORTED_LOCALES[0] ?? DEFAULT_LOCALE;
      mockGetFirstPathSegment.mockReturnValue(valid);
      expect(getLocaleFromPathname(`/${valid}/page-name`)).toBe(valid);
    });

    it('should return undefined for unsupported locale', () => {
      mockGetFirstPathSegment.mockReturnValue('de');
      expect(getLocaleFromPathname('/de/page-name')).toBeUndefined();
    });

    it('should return undefined for non-locale path', () => {
      mockGetFirstPathSegment.mockReturnValue('page-name');
      expect(getLocaleFromPathname('/page-name')).toBeUndefined();
    });

    it('should return undefined for empty path', () => {
      mockGetFirstPathSegment.mockReturnValue(undefined);
      expect(getLocaleFromPathname('/')).toBeUndefined();
    });
  });

  describe('getLocaleFromHeaders', () => {
    it('should extract locale from Accept-Language header', () => {
      const valid = SUPPORTED_LOCALES[0] ?? DEFAULT_LOCALE;
      mockGetAcceptLanguageValues.mockReturnValue([`${valid}-XX`, valid, 'en']);
      const request = new NextRequest('https://example.com');
      
      expect(getLocaleFromHeaders(request)).toBe(valid);
    });

    it('should return undefined for unsupported languages', () => {
      mockGetAcceptLanguageValues.mockReturnValue(['__invalid__']);
      const request = new NextRequest('https://example.com');
      
      expect(getLocaleFromHeaders(request)).toBeUndefined();
    });

    it('should return undefined for empty header', () => {
      mockGetAcceptLanguageValues.mockReturnValue([]);
      const request = new NextRequest('https://example.com');
      
      expect(getLocaleFromHeaders(request)).toBeUndefined();
    });

    it('should fall back to base language when only region variants are present', () => {
      const valid = SUPPORTED_LOCALES[0] ?? DEFAULT_LOCALE;
      mockGetAcceptLanguageValues.mockReturnValue([`${valid}-XX`, `${valid}-ZZ`]);
      const request = new NextRequest('https://example.com');
      expect(getLocaleFromHeaders(request)).toBe(valid);
    });
  });

  describe('determineTargetLocale', () => {
    it('should prioritize query parameter', () => {
      const valid = SUPPORTED_LOCALES[0] ?? DEFAULT_LOCALE;
      const request = new NextRequest(`https://example.com?lang=${valid}`);
      mockGetAcceptLanguageValues.mockReturnValue(['en']);
      
      expect(determineTargetLocale(request)).toBe(valid);
    });

    it('should fall back to headers when no query param', () => {
      const valid = SUPPORTED_LOCALES[0] ?? DEFAULT_LOCALE;
      const request = new NextRequest('https://example.com');
      mockGetAcceptLanguageValues.mockReturnValue([valid]);
      
      expect(determineTargetLocale(request)).toBe(valid);
    });

    it('should fall back to default when no query param or header', () => {
      const request = new NextRequest('https://example.com');
      mockGetAcceptLanguageValues.mockReturnValue(['__invalid__']);
      
      expect(determineTargetLocale(request)).toBe(DEFAULT_LOCALE);
    });

    it('should ignore invalid query parameter', () => {
      const valid = SUPPORTED_LOCALES[0] ?? DEFAULT_LOCALE;
      const request = new NextRequest('https://example.com?lang=invalid');
      mockGetAcceptLanguageValues.mockReturnValue([valid]);
      
      expect(determineTargetLocale(request)).toBe(valid);
    });

    it('should prefer cookie over headers when no query param', () => {
      const valid = SUPPORTED_LOCALES[0] ?? DEFAULT_LOCALE;
      const request = new NextRequest('https://example.com');
      mockGetAcceptLanguageValues.mockReturnValue(['__invalid__']); // invalid header
      mockGetLocaleFromCookieHeader.mockReturnValue(valid); // valid cookie

      expect(determineTargetLocale(request)).toBe(valid);
    });
  });

  describe('hasLocalePrefix', () => {
    it('should return true for pathname with locale prefix', () => {
      const valid = SUPPORTED_LOCALES[0] ?? DEFAULT_LOCALE;
      mockGetFirstPathSegment.mockReturnValue(valid);
      expect(hasLocalePrefix(`/${valid}/page-name`)).toBe(true);
    });

    it('should return false for pathname without locale prefix', () => {
      mockGetFirstPathSegment.mockReturnValue('page-name');
      expect(hasLocalePrefix('/page-name')).toBe(false);
    });

    it('should return false for unsupported locale', () => {
      mockGetFirstPathSegment.mockReturnValue('de');
      expect(hasLocalePrefix('/de/page-name')).toBe(false);
    });
  });

  describe('removeLocalePrefix', () => {
    it('should remove locale prefix from pathname', () => {
      const valid = SUPPORTED_LOCALES[0] ?? DEFAULT_LOCALE;
      mockGetFirstPathSegment.mockReturnValue(valid);
      expect(removeLocalePrefix(`/${valid}/page-name`)).toBe('/page-name');
    });

    it('should remove locale prefix from nested path', () => {
      const valid = SUPPORTED_LOCALES[0] ?? DEFAULT_LOCALE;
      mockGetFirstPathSegment.mockReturnValue(valid);
      expect(removeLocalePrefix(`/${valid}/admin/dashboard`)).toBe('/admin/dashboard');
    });

    it('should return original pathname if no locale prefix', () => {
      mockGetFirstPathSegment.mockReturnValue('page-name');
      expect(removeLocalePrefix('/page-name')).toBe('/page-name');
    });

    it('should return original pathname for unsupported locale', () => {
      const invalid = '__invalid__';
      mockGetFirstPathSegment.mockReturnValue(invalid);
      expect(removeLocalePrefix(`/${invalid}/page-name`)).toBe(`/${invalid}/page-name`);
    });

    it('should return root path when only locale segment present', () => {
      const valid = SUPPORTED_LOCALES[0] ?? DEFAULT_LOCALE;
      mockGetFirstPathSegment.mockReturnValue(valid);
      expect(removeLocalePrefix(`/${valid}`)).toBe('/');
    });
  });

  describe('addLocalePrefix', () => {
    it('should add locale prefix to pathname', () => {
      const valid = SUPPORTED_LOCALES[0] ?? DEFAULT_LOCALE;
      expect(addLocalePrefix('/page-name', valid)).toBe(`/${valid}/page-name`);
    });

    it('should add locale prefix to nested path', () => {
      const valid = SUPPORTED_LOCALES[0] ?? DEFAULT_LOCALE;
      expect(addLocalePrefix('/admin/dashboard', valid)).toBe(`/${valid}/admin/dashboard`);
    });

    it('should add locale prefix to root path', () => {
      const valid = SUPPORTED_LOCALES[0] ?? DEFAULT_LOCALE;
      expect(addLocalePrefix('/', valid)).toBe(`/${valid}/`);
    });
  });
});
