/**
 * @portfolio/i18n - Shared internationalization module
 *
 * Usage:
 * 1. Call initI18n(config) at app startup with app-specific config
 * 2. Use LocaleProvider, HtmlAttributes, useLocale, etc.
 * 3. Use middleware helpers for Next.js middleware
 */

export { initI18n, getConfig, resetConfig } from './config';
export type { I18nConfig, LanguageConfig } from './types';
export { getBestLocale, getSupportedLocales, isSupportedLocale, getLanguageConfig } from './utils';
export type { SupportedLocale } from './utils';
export {
  saveLocaleToStorage,
  getLocaleFromStorage,
  clearLocaleFromStorage,
  saveLocaleToCookie,
  getLocaleFromCookie,
  clearLocaleFromCookie,
  getLocaleFromCookieHeader,
} from './storage';
export {
  getLocaleFromPathname,
  getLocaleFromHeaders,
  determineTargetLocale,
  hasLocalePrefix,
  removeLocalePrefix,
  addLocalePrefix,
} from './middleware';
export { LocaleProvider, useLocale } from './LocaleContext';
export { HtmlAttributes } from './HtmlAttributes';
export { useTranslation } from './useTranslation';
export type { TranslationFunction, InterpolationVariables } from './useTranslation';
