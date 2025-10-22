/**
 * i18n configuration constants.
 * 
 * 🎯 SINGLE SOURCE OF TRUTH: This is the ONLY file you need to edit to add languages.
 * 
 * To add a new language:
 * 1. Add it to the LANGUAGES array below
 * 2. Create translation files in public/locales/{code}/
 * 3. That's it! Everything else updates automatically.
 */

import type { LanguageConfig } from './types';

/**
 * Default language when no user preference is set.
 */
export const DEFAULT_LOCALE = 'en' as const;

/**
 * Fallback language when translations are missing.
 */
export const FALLBACK_LOCALE = 'en' as const;

/**
 * Translation file namespaces.
 * Each namespace corresponds to a JSON file in public/locales/{locale}/
 */
export const NAMESPACES: string[] = ['common', 'svgTest'] as const;

/**
 * All supported languages configuration.
 */
export const LANGUAGES: LanguageConfig[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    rtl: false,
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    rtl: false,
  },
  // Add new languages here:
  // {
  //   code: 'de',
  //   name: 'German',
  //   nativeName: 'Deutsch',
  //   flag: '🇩🇪',
  //   rtl: false,
  // },
  // {
  //   code: 'es',
  //   name: 'Spanish',
  //   nativeName: 'Español',
  //   flag: '🇪🇸',
  //   rtl: false,
  // },
  // {
  //   code: 'ar',
  //   name: 'Arabic',
  //   nativeName: 'العربية',
  //   flag: '🇸🇦',
  //   rtl: true,
  // },
  // {
  //   code: 'he',
  //   name: 'Hebrew',
  //   nativeName: 'עברית',
  //   flag: '🇮🇱',
  //   rtl: true,
  // },
];

/**
 * Storage key for persisting locale preference in localStorage.
 */
export const LOCALE_STORAGE_KEY = 'portfolio-locale' as const;

/**
 * Cookie name for locale persistence across SSR.
 */
export const LOCALE_COOKIE_NAME = 'portfolio-locale' as const;

/**
 * Cookie max-age in seconds (1 year).
 */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Default localized home path appended after the locale prefix when redirecting from "/".
 * Example: "/" → "/en/"
 */
export const DEFAULT_LOCALIZED_HOME = '/' as const;
