/**
 * @file Internationalization system main export.
 * 
 * This is the dedicated entry point for the i18n system. It provides:
 * - Language configuration (LANGUAGES, DEFAULT_LOCALE, etc.)
 * - Type definitions (SupportedLocale, LanguageConfig, etc.)
 * - Utility functions (getBestLocale, isSupportedLocale, etc.)
 * - Main configuration object (I18N_CONFIG)
 */

// Re-export everything from constants
export * from './constants';

// Re-export everything from types
export * from './types';

// Re-export everything from utils
export * from './utils';

// Re-export React components and hooks
export { HtmlAttributes } from './HtmlAttributes';
export { LocaleProvider, useLocale } from './LocaleContext';

// Re-export storage utilities
export {
  clearLocaleFromCookie,
  clearLocaleFromStorage,
  getLocaleFromCookie,
  getLocaleFromCookieHeader,
  getLocaleFromStorage,
  saveLocaleToCookie,
  saveLocaleToStorage
} from './storage';

// Re-export middleware utilities
export {
  addLocalePrefix, determineTargetLocale, getLocaleFromHeaders, getLocaleFromPathname, hasLocalePrefix,
  removeLocalePrefix
} from './middleware';

/**
 * Main i18n configuration object.
 * Combines all configuration in one place for easy access.
 */
import { DEFAULT_LOCALE, FALLBACK_LOCALE, LANGUAGES, NAMESPACES } from './constants';
import { SUPPORTED_LOCALES } from './utils';

export const I18N_CONFIG = Object.freeze({
  /** All supported language codes */
  supportedLocales: SUPPORTED_LOCALES,
  /** Language to use when translations are missing */
  fallbackLocale: FALLBACK_LOCALE,
  /** Language to use when no preference is set */
  defaultLocale: DEFAULT_LOCALE,
  /** Translation file namespaces */
  namespaces: NAMESPACES,
  /** All language configurations */
  languages: LANGUAGES,
} as const);

/** Union type of all namespace names (e.g., 'common' | 'specificPage') */
export type SupportedNamespace = typeof NAMESPACES[number];

