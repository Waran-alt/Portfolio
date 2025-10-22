
/**
 * @file Language Switcher Component
 * 
 * A dropdown component that allows users to switch between supported languages.
 * Navigation-only: updates the URL locale prefix with Next.js router; the context
 * synchronizes from the route param to avoid state/route loops.
 */

'use client';

import type { TranslationFunction } from '@/hooks/useTranslation';
import { LANGUAGES, useLocale, type SupportedLocale } from 'i18n';
import { usePathname, useRouter } from 'next/navigation';
import React from 'react';

/**
 * Props for the LanguageSwitcher component.
 */
interface LanguageSwitcherProps {
  /** Translation function for component labels */
  t: TranslationFunction;
}

/**
 * Language switcher component.
 * 
 * Provides a dropdown select for changing the application language.
 * When a language is selected:
 * 1. Derives basePath by stripping current locale segment from pathname
 * 2. Navigates to the same page with the new locale prefix via router.replace
 * 3. Lets `LocaleProvider` pick up the new locale from the route
 * 
 * @param props - Component props
 * @returns Language switcher dropdown
 * 
 * @example
 * <LanguageSwitcher t={t} />
 */
const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ t }) => {
  // Get current locale and setter from context
  const { locale: currentLocale } = useLocale();
  
  // Next.js router for client-side navigation
  const router = useRouter();
  
  // Current pathname (e.g., "/en/svg-test")
  const pathname = usePathname();

  /**
   * Handle locale change when user selects a different language.
   * 
   * Navigation logic only; avoids directly mutating context here to prevent
   * thrashing with router transitions.
   * 
   * @param newLocale - The locale code to switch to (e.g., 'fr', 'en')
   * 
   * @example
   * // User on /en/svg-test selects French
   * handleLocaleChange('fr')
   * // → Updates context to 'fr'
   * // → Navigates to /fr/svg-test
   */
  const handleLocaleChange = (newLocale: SupportedLocale): void => {
    if (newLocale === currentLocale) return; // No-op if selecting current locale

    // Derive basePath from current URL first segment to avoid state/route mismatch
    const segments = pathname.split('/').filter(Boolean);
    const currentPathLocale = segments[0] || '';
    const prefix = `/${currentPathLocale}`;
    const basePath = pathname.startsWith(prefix)
      ? pathname.slice(prefix.length) || '/'
      : pathname;

    // Preserve query and hash during navigation
    const search = typeof window !== 'undefined' ? window.location.search : '';
    const hash = typeof window !== 'undefined' ? window.location.hash : '';

    const normalizedBase = basePath === '/' ? '' : basePath; // Avoid trailing-slash oscillation
    const newPath = `/${newLocale}${normalizedBase}${search}${hash}`;

    // Only navigate if the path actually changes to prevent accidental loops
    const currentFullPath = `${pathname}${search}${hash}`;
    if (newPath === currentFullPath) return;
    if (pathname === `/${newLocale}` || pathname.startsWith(`/${newLocale}/`)) return;

    // Navigate; LocaleProvider will sync from route param
    router.replace(newPath);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Language label */}
      <span className="text-sm text-violet-700 font-medium">
        {t('common.language', { fallback: 'Language' })}:
      </span>
      
      {/* Language dropdown */}
      <select
        value={currentLocale}
        onChange={(e) => handleLocaleChange(e.target.value as SupportedLocale)}
        className="px-2 py-1 text-sm border border-violet-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
      >
        {/* Render all supported languages */}
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher;
