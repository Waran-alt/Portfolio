import { DEFAULT_LOCALE, FALLBACK_LOCALE, LANGUAGES } from './constants';
import type { LanguageConfig } from './types';

/** Union type of all supported language codes (e.g., 'en' | 'fr') */
export type SupportedLocale = typeof LANGUAGES[number]['code'];

/** Array of all supported language codes */
export const SUPPORTED_LOCALES = LANGUAGES.map(lang => lang.code) as SupportedLocale[];

/**
 * Get the full configuration for a language code.
 * @param code - Language code to look up
 * @returns Language configuration or undefined if not found
 */
export const getLanguageConfig = (code: SupportedLocale): LanguageConfig | undefined => {
  return LANGUAGES.find(lang => lang.code === code);
};

/**
 * Get the English name of a language.
 * @param code - Language code to look up
 * @returns English name or the code itself if not found
 */
export const getLanguageName = (code: SupportedLocale): string => {
  const config = getLanguageConfig(code);
  return config?.name || code;
};

/**
 * Get the native name of a language.
 * Used in UI to display language names in their own script.
 * @param code - Language code to look up
 * @returns Native name or the code itself if not found
 */
export const getNativeLanguageName = (code: SupportedLocale): string => {
  const config = getLanguageConfig(code);
  return config?.nativeName || code;
};

/**
 * Type guard to check if a string is a supported locale.
 * @param code - String to check
 * @returns True if the code is a supported locale
 */
export const isSupportedLocale = (code: string): boolean => {
  return SUPPORTED_LOCALES.includes(code as SupportedLocale);
};

/**
 * Get the best available locale for a requested locale.
 * Implements graceful degradation:
 * 1. If exact match exists (e.g., 'en'), return it
 * 2. If language part matches (e.g., 'en-US' → 'en'), return language part
 * 3. Otherwise, return default locale
 * 
 * @param requestedLocale - The locale to find (e.g., 'en', 'en-US', 'de')
 * @returns The best matching supported locale
 * @example
 * getBestLocale('en') // returns 'en' (exact match)
 * getBestLocale('en-US') // returns 'en' (language part match)
 * getBestLocale('de') // returns 'en' (fallback to default)
 */
export const getBestLocale = (requestedLocale: string): SupportedLocale => {
  if (isSupportedLocale(requestedLocale)) {
    return requestedLocale;
  }
  
  // Try to match language part (e.g., 'en-US' → 'en')
  const languagePart = requestedLocale.split('-')[0];
  if (languagePart && isSupportedLocale(languagePart)) {
    return languagePart;
  }
  
  return DEFAULT_LOCALE;
};

/**
 * Get the fallback locale for a given locale.
 * Implements the fallback chain to prevent infinite loops.
 * 
 * @param locale - The current locale
 * @returns The locale to fall back to
 * @example
 * getFallbackLocale('fr') // returns 'en' (fallback)
 * getFallbackLocale('en') // returns 'en' (already at fallback)
 */
export const getFallbackLocale = (locale: SupportedLocale): SupportedLocale => {
  return locale === FALLBACK_LOCALE ? DEFAULT_LOCALE : FALLBACK_LOCALE;
};

