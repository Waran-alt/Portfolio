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
 * Variables for interpolation.
 * Supports strings, numbers, and booleans for placeholder replacement.
 */
export type InterpolationVariables = Record<string, string | number | boolean>;

/**
 * Translation function type.
 * 
 * Provides type-safe translation with optional fallback and variable interpolation.
 * Use this in component props to ensure consistency across the application.
 * 
 * @param key - Dot-notated translation key (e.g., 'jedi.master', 'errors.invalidPath')
 * @param options - Optional configuration
 * @param options.fallback - Fallback string if translation is missing
 * @param options.vars - Variables for {{placeholder}} replacement
 * @returns Translated string with interpolated variables
 * 
 * @example
 * // Basic usage
 * t('title') // "Page title"
 * 
 * // With fallback
 * t('missing.key', { fallback: 'Default text' })
 * 
 * // With variable interpolation
 * t('welcome', { vars: { name: 'Frodo' } }) // "Welcome, Frodo!"
 * t('itemCount', { vars: { count: 42, item: 'ring' } }) // "You have 42 rings"
 * 
 * // Combined fallback and variables
 * t('greeting', { 
 *   fallback: 'Hello, stranger!',
 *   vars: { wizard: 'Gandalf' }
 * }) // "Hello, Gandalf!" or fallback if key missing
 */
export type TranslationFunction = (
  key: string,
  options?: {
    fallback?: string;
    vars?: InterpolationVariables;
  }
) => string;

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

  const t: TranslationFunction = (key, options?) => {
    const fallback = options?.fallback;
    const vars = options?.vars;
    
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
    
    // Ensure we have a string
    let result = typeof value === 'string' ? value : fallback || key;
    
    // Apply variable interpolation if variables provided
    if (vars && typeof result === 'string') {
      Object.entries(vars).forEach(([varKey, varValue]) => {
        // Replace {{variable}} with value
        const placeholder = new RegExp(`{{${varKey}}}`, 'g');
        result = result.replace(placeholder, String(varValue));
      });
    }
    
    return result;
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
