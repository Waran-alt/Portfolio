import { getConfig } from './config.js';
import type { SupportedLocale } from './utils.js';

export function saveLocaleToStorage(locale: SupportedLocale): boolean {
  try {
    localStorage.setItem(getConfig().storageKey, locale);
    return true;
  } catch (error) {
    console.error('Failed to save locale to localStorage:', error);
    return false;
  }
}

export function getLocaleFromStorage(): string | undefined {
  try {
    return localStorage.getItem(getConfig().storageKey) || undefined;
  } catch (error) {
    console.error('Failed to read locale from localStorage:', error);
    return undefined;
  }
}

export function clearLocaleFromStorage(): boolean {
  try {
    localStorage.removeItem(getConfig().storageKey);
    return true;
  } catch (error) {
    console.error('Failed to clear locale from localStorage:', error);
    return false;
  }
}

export function saveLocaleToCookie(locale: SupportedLocale): boolean {
  try {
    const { cookieName, cookieMaxAge } = getConfig();
    document.cookie = `${cookieName}=${locale}; path=/; max-age=${cookieMaxAge}; SameSite=Strict; Secure`;
    return true;
  } catch (error) {
    console.error('Failed to save locale to cookie:', error);
    return false;
  }
}

export function getLocaleFromCookie(): string | undefined {
  try {
    const { cookieName } = getConfig();
    const match = document.cookie.match(new RegExp(`${cookieName}=([^;]+)`));
    return match?.[1];
  } catch (error) {
    console.error('Failed to read locale from cookie:', error);
    return undefined;
  }
}

export function clearLocaleFromCookie(): boolean {
  try {
    const { cookieName } = getConfig();
    document.cookie = `${cookieName}=; path=/; max-age=0`;
    return true;
  } catch (error) {
    console.error('Failed to clear locale from cookie:', error);
    return false;
  }
}

export function getLocaleFromCookieHeader(cookieHeader?: string): string | undefined {
  if (!cookieHeader) return undefined;
  const { cookieName } = getConfig();
  const match = cookieHeader.match(new RegExp(`${cookieName}=([^;]+)`));
  return match?.[1];
}
