'use client';

import { useEffect } from 'react';
import { LANGUAGES } from './constants';
import { useLocale } from './LocaleContext';

/**
 * @file HTML Attributes component for dynamic lang, dir, and hreflang.
 * 
 * This component manages HTML attributes that need to be updated based on locale:
 * - lang: Language code for screen readers and search engines
 * - dir: Text direction (ltr/rtl) for proper text rendering
 * - hreflang: Alternative language links for SEO
 *
 * It tags all links it creates with data-i18n-hreflang and removes only those
 * on cleanup to avoid conflicting with Next.js/React head management during
 * client-side transitions.
 */

/**
 * Component that dynamically updates HTML attributes based on current locale.
 * 
 * Features:
 * - Updates document.documentElement.lang
 * - Updates document.documentElement.dir
 * - Adds hreflang meta tags for SEO with safe cleanup
 * - Handles RTL language support
 * 
 * @returns null (side-effect component)
 */
export function HtmlAttributes(): null {
  const { locale } = useLocale();

  useEffect(() => {
    // Get language configuration
    const languageConfig = LANGUAGES.find(lang => lang.code === locale);
    
    // Update lang attribute
    document.documentElement.lang = locale;
    
    // Update dir attribute (RTL support)
    document.documentElement.dir = languageConfig?.rtl ? 'rtl' : 'ltr';
    
    // Update hreflang meta tags for SEO; track what we add to clean up safely
    const added: HTMLLinkElement[] = [];
    const currentPath = window.location.pathname;
    const pathSegments = currentPath.split('/').filter(Boolean);
    const basePath = pathSegments.length > 1 
      ? '/' + pathSegments.slice(1).join('/')
      : '/';

    // Remove only our previously created tags
    document
      .querySelectorAll('link[rel="alternate"][data-i18n-hreflang="true"]')
      .forEach(el => el.parentNode?.removeChild(el));

    const addLink = (hreflang: string, href: string) => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = hreflang;
      link.href = href;
      link.setAttribute('data-i18n-hreflang', 'true');
      document.head.appendChild(link);
      added.push(link);
    };

    LANGUAGES.forEach(lang => {
      addLink(lang.code, `${window.location.origin}/${lang.code}${basePath}`);
    });
    addLink('x-default', `${window.location.origin}${basePath}`);
    
    return () => {
      added.forEach(link => link.parentNode?.removeChild(link));
    };
  }, [locale]);

  return null;
}

