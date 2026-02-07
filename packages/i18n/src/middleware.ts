/**
 * i18n middleware helpers.
 * Framework-agnostic: accepts Headers and URLSearchParams.
 */

import { getConfig } from './config.js';
import { getLocaleFromCookieHeader } from './storage.js';
import { isSupportedLocale } from './utils.js';

function getFirstPathSegment(pathname: string): string | undefined {
  const segments = pathname.split('/').filter(Boolean);
  return segments[0];
}

function getAcceptLanguageValues(acceptLanguage: string | null): string[] {
  if (!acceptLanguage) return [];
  return acceptLanguage
    .split(',')
    .map((lang) => lang.split(';')[0]?.trim() || '')
    .filter((lang) => lang.length > 0);
}

export function getLocaleFromPathname(pathname: string): string | undefined {
  const firstSegment = getFirstPathSegment(pathname);
  if (firstSegment && isSupportedLocale(firstSegment)) return firstSegment;
  return undefined;
}

export function getLocaleFromHeaders(acceptLanguage: string | null): string | undefined {
  const languages = getAcceptLanguageValues(acceptLanguage);
  for (const lang of languages) {
    if (isSupportedLocale(lang)) return lang;
    const base = lang.split('-')[0]?.toLowerCase();
    if (base && isSupportedLocale(base)) return base;
  }
  return undefined;
}

export function determineTargetLocale(params: {
  queryLocale: string | null;
  cookieHeader: string | undefined;
  acceptLanguage: string | null;
}): string {
  const { queryLocale, cookieHeader, acceptLanguage } = params;
  const { defaultLocale } = getConfig();

  if (queryLocale && isSupportedLocale(queryLocale)) return queryLocale;
  const cookieLocale = getLocaleFromCookieHeader(cookieHeader);
  if (cookieLocale && isSupportedLocale(cookieLocale)) return cookieLocale;
  const headerLocale = getLocaleFromHeaders(acceptLanguage);
  if (headerLocale) return headerLocale;
  return defaultLocale;
}

export function hasLocalePrefix(pathname: string): boolean {
  return getLocaleFromPathname(pathname) !== undefined;
}

export function removeLocalePrefix(pathname: string): string {
  const firstSegment = getFirstPathSegment(pathname);
  if (firstSegment && isSupportedLocale(firstSegment)) {
    const afterLocale = pathname.slice(1 + firstSegment.length);
    if (afterLocale.startsWith('/')) return afterLocale.length > 1 ? afterLocale : '/';
    return '/';
  }
  return pathname;
}

export function addLocalePrefix(pathname: string, locale: string): string {
  return `/${locale}${pathname}`;
}
