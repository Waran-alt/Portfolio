/**
 * @portfolio/i18n - Shared internationalization module
 *
 * Usage:
 * 1. Call initI18n(config) at app startup with app-specific config
 * 2. Use LocaleProvider, HtmlAttributes, useLocale, etc.
 * 3. Use middleware helpers for Next.js middleware
 */

export { initI18n, getConfig, resetConfig } from './config.js';
export type { I18nConfig, LanguageConfig } from './types.js';
export { getBestLocale, getSupportedLocales, isSupportedLocale, getLanguageConfig } from './utils.js';
export type { SupportedLocale } from './utils.js';
export {
  saveLocaleToStorage,
  getLocaleFromStorage,
  clearLocaleFromStorage,
  saveLocaleToCookie,
  getLocaleFromCookie,
  clearLocaleFromCookie,
  getLocaleFromCookieHeader,
} from './storage.js';
export {
  getLocaleFromPathname,
  getLocaleFromHeaders,
  determineTargetLocale,
  hasLocalePrefix,
  removeLocalePrefix,
  addLocalePrefix,
} from './middleware.js';
export { LocaleProvider, useLocale } from './LocaleContext.jsx';
export { HtmlAttributes } from './HtmlAttributes.jsx';
export { useTranslation } from './useTranslation.jsx';
export type { TranslationFunction, InterpolationVariables } from './useTranslation.jsx';
