'use client';

import { useEffect } from 'react';
import { getConfig } from './config';
import { useLocale } from './LocaleContext';

export function HtmlAttributes(): null {
  const { locale } = useLocale();
  const { languages } = getConfig();
  const languageConfig = languages.find((lang) => lang.code === locale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = languageConfig?.rtl ? 'rtl' : 'ltr';

    document.querySelectorAll('link[rel="alternate"][data-i18n-hreflang="true"]').forEach((el) => el.parentNode?.removeChild(el));

    const currentPath = window.location.pathname;
    const pathSegments = currentPath.split('/').filter(Boolean);
    const basePath = pathSegments.length > 1 ? '/' + pathSegments.slice(1).join('/') : '/';

    const addLink = (hreflang: string, href: string) => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = hreflang;
      link.href = href;
      link.setAttribute('data-i18n-hreflang', 'true');
      document.head.appendChild(link);
    };

    languages.forEach((lang) => {
      addLink(lang.code, `${window.location.origin}/${lang.code}${basePath}`);
    });
    addLink('x-default', `${window.location.origin}${basePath}`);
  }, [locale, languages, languageConfig]);

  return null;
}
