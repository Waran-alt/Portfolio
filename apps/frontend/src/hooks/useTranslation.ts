'use client';

/* eslint-disable @typescript-eslint/no-var-requires */

import { getBestLocale, I18N_CONFIG, type SupportedNamespace } from '@/i18n';
import { useMemo } from 'react';

/**
 * Translation data structure.
 * Represents nested JSON translation objects.
 */
interface TranslationData {
  [key: string]: string | TranslationData;
}

/**
 * Custom hook for internationalization in Next.js App Router.
 * 
 * Provides translation functionality with automatic fallback when translations are missing.
 * Uses React's useMemo for performance.
 * 
 * @param namespace - Translation namespace to load (e.g., 'common', 'specificPage')
 * @param locale - Requested locale (e.g., 'en', 'fr', 'en-US')
 * @returns Translation function and locale information
 * 
 * @example
 * const { t, locale } = useTranslation('svgTest', 'fr');
 * const title = t('title');
 * const error = t('missing.key', 'Fallback text');
 */
export function useTranslation(
  namespace: SupportedNamespace = 'common', 
  locale: string = I18N_CONFIG.defaultLocale
) {
  // Normalize locale: 'en-US' → 'en', 'de' → 'en' (fallback), 'fr' → 'fr'
  const normalizedLocale = getBestLocale(locale);
  
  /**
   * Load translations with memoization.
   * Only re-loads when locale or namespace changes, preventing unnecessary re-renders.
   */
  const translations = useMemo(() => {
    try {
      // Attempt to load the requested locale's translations
      const translationData = require(`../../public/locales/${normalizedLocale}/${namespace}.json`);
      return translationData as TranslationData;
    } catch (error) {
      console.warn(`Failed to load translations for ${normalizedLocale}/${namespace}:`, error);
      
      // Fallback chain: requested locale → fallback locale → empty object
      try {
        const fallbackData = require(`../../public/locales/${I18N_CONFIG.fallbackLocale}/${namespace}.json`);
        console.info(`Using fallback translations from ${I18N_CONFIG.fallbackLocale}/${namespace}`);
        return fallbackData as TranslationData;
      } catch (fallbackError) {
        console.error(`Failed to load fallback translations for ${I18N_CONFIG.fallbackLocale}/${namespace}:`, fallbackError);
        return {};
      }
    }
  }, [normalizedLocale, namespace]);

  /**
   * Translation function.
   * 
   * @param key - Dot-notated translation key (e.g., 'errors.invalidPath')
   * @param fallback - Optional fallback string if translation is missing
   * @returns Translated string, fallback, or key
   * 
   * @example
   * t('title') // Title text
   * t('errors.invalid') // Erro text
   * t('missing.key', 'Fallback text') // "Fallback text" (if key doesn't exist)
   * t('missing.key') // "missing.key" (shows key for debugging)
   */
  const t = (key: string, fallback?: string): string => {
    // Split dot-notated key into path segments
    const keys = key.split('.');
    let value: string | TranslationData | undefined = translations;
    
    // Traverse nested translation object
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Key not found - return fallback or key itself
        return fallback || key;
      }
    }
    
    // Ensure we return a string (not an object or other type)
    return typeof value === 'string' ? value : fallback || key;
  };

  return {
    /** Translation function for getting localized strings */
    t,
    /** Normalized locale being used (useful for debugging) */
    locale: normalizedLocale,
    /** Raw translation data (rarely needed, but available) */
    translations,
  };
}
