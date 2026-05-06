'use client';

import { useEffect, useState } from 'react';
import { getConfig } from './config';
import { getBestLocale } from './utils';

/**
 * Translation data structure.
 */
interface TranslationData {
  [key: string]: string | TranslationData;
}

/**
 * Variables for interpolation.
 */
export type InterpolationVariables = Record<string, string | number | boolean>;

/**
 * Translation function type.
 */
export type TranslationFunction = (
  key: string,
  options?: {
    fallback?: string;
    vars?: InterpolationVariables;
  }
) => string;

/**
 * Hook for loading translations via fetch from a configurable base path.
 * Uses translationsBasePath from initI18n config (default: '/locales').
 *
 * @param namespace - Translation namespace (e.g. 'common')
 * @param locale - Locale code (e.g. 'en', 'fr')
 * @returns t function, normalized locale, and raw translations
 */
export function useTranslation(namespace: string = 'common', locale?: string) {
  const config = getConfig();
  const normalizedLocale = getBestLocale(locale ?? config.defaultLocale);
  const basePath = config.translationsBasePath ?? '/locales';

  const [translations, setTranslations] = useState<TranslationData>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const url = `${basePath}/${normalizedLocale}/${namespace}.json`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const data = (await res.json()) as TranslationData;
        if (!cancelled) setTranslations(data);
      } catch (error) {
        console.warn(`Failed to load translations from ${url}:`, error);
        if (config.fallbackLocale !== normalizedLocale) {
          try {
            const fallbackUrl = `${basePath}/${config.fallbackLocale}/${namespace}.json`;
            const res = await fetch(fallbackUrl);
            if (res.ok) {
              const data = (await res.json()) as TranslationData;
              if (!cancelled) setTranslations(data);
              return;
            }
          } catch {
            /* ignore */
          }
        }
        if (!cancelled) setTranslations({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [normalizedLocale, namespace, basePath, config.fallbackLocale]);

  const t: TranslationFunction = (key, options?) => {
    const fallback = options?.fallback;
    const vars = options?.vars;

    const keys = key.split('.');
    let value: string | TranslationData | undefined = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as TranslationData)[k] as string | TranslationData | undefined;
      } else {
        value = (fallback ?? key) as string;
        break;
      }
    }

    let result = typeof value === 'string' ? value : (fallback ?? key);

    if (vars && typeof result === 'string') {
      Object.entries(vars).forEach(([varKey, varValue]) => {
        const placeholder = new RegExp(`{{${varKey}}}`, 'g');
        result = result.replace(placeholder, String(varValue));
      });
    }

    return result;
  };

  return {
    t,
    locale: normalizedLocale,
    translations,
  };
}
