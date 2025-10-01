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
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
  },
  // Add new languages here:
  // {
  //   code: 'de',
  //   name: 'German',
  //   nativeName: 'Deutsch',
  //   flag: '🇩🇪',
  // },
  // {
  //   code: 'es',
  //   name: 'Spanish',
  //   nativeName: 'Español',
  //   flag: '🇪🇸',
  // },
];
