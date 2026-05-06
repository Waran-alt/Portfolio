/**
 * Configurable i18n module.
 * Call initI18n(config) before using any i18n utilities.
 */

import type { I18nConfig } from './types';

let config: I18nConfig | null = null;

const DEFAULT_CONFIG: I18nConfig = {
  defaultLocale: 'en',
  fallbackLocale: 'en',
  languages: [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false },
  ],
  namespaces: ['common'],
  storageKey: 'portfolio-locale',
  cookieName: 'portfolio-locale',
  cookieMaxAge: 60 * 60 * 24 * 365,
  defaultLocalizedHome: '/',
  translationsBasePath: '/locales',
};

/**
 * Initialize i18n with app-specific config.
 * Must be called before using any i18n utilities.
 * @param appConfig - Partial config; merges with defaults
 */
export function initI18n(appConfig: Partial<I18nConfig> = {}): void {
  config = { ...DEFAULT_CONFIG, ...appConfig };
}

/**
 * Get current i18n config.
 * Throws if initI18n was not called.
 */
export function getConfig(): I18nConfig {
  if (!config) {
    return DEFAULT_CONFIG;
  }
  return config;
}

/**
 * Reset config (for testing).
 */
export function resetConfig(): void {
  config = null;
}
