import { getBestLocale, HtmlAttributes, LocaleProvider } from 'i18n';
import type { Metadata } from 'next';
import React from 'react';

/**
 * @file Locale-based layout for internationalized routes.
 * 
 * This layout wraps all routes under /[locale]/ and provides:
 * - Locale context from URL parameters
 * - Dynamic HTML attributes
 * - Server-side locale validation
 */

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

/**
 * Generate metadata for the locale-based layout.
 * @returns Metadata object
 */
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Portfolio',
    description: 'Developer portfolio built with Next.js 15',
    alternates: {
      languages: {
        'en': '/en',
        'fr': '/fr',
        'x-default': '/',
      },
    },
  };
}

/**
 * Locale-based layout component.
 * 
 * @param children - Child components to render
 * @param params - Route parameters containing locale (async in Next.js 15)
 * @returns JSX element
 */
export default async function LocaleLayout({ children, params }: LocaleLayoutProps): Promise<React.ReactElement> {
  // Await params (Next.js 15 requirement)
  const { locale: localeParam } = await params;
  
  // Validate and normalize the locale from URL
  const locale = getBestLocale(localeParam);
  
  return (
    <LocaleProvider initialLocale={locale}>
      <HtmlAttributes />
      {children}
    </LocaleProvider>
  );
}
