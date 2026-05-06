import { getConfig } from './config';
import type { LanguageConfig } from './types';

export type SupportedLocale = string;

/**
 * Get array of supported locale codes from config.
 */
export function getSupportedLocales(): SupportedLocale[] {
  return getConfig().languages.map((lang) => lang.code);
}

/**
 * Type guard to check if a string is a supported locale.
 */
export function isSupportedLocale(code: string): boolean {
  return getSupportedLocales().includes(code);
}

/**
 * Get the best available locale for a requested locale.
 */
export function getBestLocale(requestedLocale: string): SupportedLocale {
  const { defaultLocale } = getConfig();
  if (isSupportedLocale(requestedLocale)) return requestedLocale;
  const languagePart = requestedLocale.split('-')[0];
  if (languagePart && isSupportedLocale(languagePart)) return languagePart;
  return defaultLocale;
}

/**
 * Get language config for a locale.
 */
export function getLanguageConfig(code: string): LanguageConfig | undefined {
  return getConfig().languages.find((lang) => lang.code === code);
}
