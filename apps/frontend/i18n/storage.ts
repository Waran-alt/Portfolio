/**
 * @file Storage utilities for locale persistence.
 * 
 * Provides utilities for persisting locale preferences:
 * - localStorage for client-side persistence
 * - Cookies for SSR support
 * - Safe error handling for blocked storage
 */

import { LOCALE_COOKIE_MAX_AGE, LOCALE_COOKIE_NAME, LOCALE_STORAGE_KEY } from './constants';
import type { SupportedLocale } from './utils';

// ============================================================================
// LOCALSTORAGE UTILITIES
// ============================================================================

/**
 * Save locale to localStorage.
 * Handles errors gracefully if localStorage is blocked.
 * 
 * @param locale - Locale to save
 * @returns True if successful, false otherwise
 */
export function saveLocaleToStorage(locale: SupportedLocale): boolean {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    return true;
  } catch (error) {
    console.error('Failed to save locale to localStorage:', error);
    return false;
  }
}

/**
 * Get locale from localStorage.
 * Handles errors gracefully if localStorage is blocked.
 * 
 * @returns Locale from storage or undefined
 */
export function getLocaleFromStorage(): string | undefined {
  try {
    return localStorage.getItem(LOCALE_STORAGE_KEY) || undefined;
  } catch (error) {
    console.error('Failed to read locale from localStorage:', error);
    return undefined;
  }
}

/**
 * Clear locale from localStorage.
 * Handles errors gracefully if localStorage is blocked.
 * 
 * @returns True if successful, false otherwise
 */
export function clearLocaleFromStorage(): boolean {
  try {
    localStorage.removeItem(LOCALE_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear locale from localStorage:', error);
    return false;
  }
}

// ============================================================================
// COOKIE UTILITIES (CLIENT-SIDE)
// ============================================================================

/**
 * Save locale to cookie (client-side).
 * Handles errors gracefully if cookies are blocked.
 * 
 * @param locale - Locale to save
 * @returns True if successful, false otherwise
 */
export function saveLocaleToCookie(locale: SupportedLocale): boolean {
  try {
    document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Strict; Secure`;
    return true;
  } catch (error) {
    console.error('Failed to save locale to cookie:', error);
    return false;
  }
}

/**
 * Get locale from cookie (client-side).
 * Parses document.cookie to extract locale value.
 * 
 * @returns Locale from cookie or undefined
 */
export function getLocaleFromCookie(): string | undefined {
  try {
    const match = document.cookie.match(new RegExp(`${LOCALE_COOKIE_NAME}=([^;]+)`));
    return match?.[1];
  } catch (error) {
    console.error('Failed to read locale from cookie:', error);
    return undefined;
  }
}

/**
 * Clear locale cookie (client-side).
 * Sets max-age to 0 to expire the cookie immediately.
 * 
 * @returns True if successful, false otherwise
 */
export function clearLocaleFromCookie(): boolean {
  try {
    document.cookie = `${LOCALE_COOKIE_NAME}=; path=/; max-age=0`;
    return true;
  } catch (error) {
    console.error('Failed to clear locale from cookie:', error);
    return false;
  }
}

// ============================================================================
// COOKIE UTILITIES (SERVER-SIDE)
// ============================================================================

/**
 * Get locale from cookie header (server-side).
 * Useful for SSR and middleware.
 * 
 * @param cookieHeader - Cookie header string from request
 * @returns Locale from cookie or undefined
 * 
 * @example
 * // In middleware or server component
 * const locale = getLocaleFromCookieHeader(request.headers.cookie);
 */
export function getLocaleFromCookieHeader(cookieHeader?: string): string | undefined {
  if (!cookieHeader) return undefined;
  
  const match = cookieHeader.match(new RegExp(`${LOCALE_COOKIE_NAME}=([^;]+)`));
  return match?.[1];
}

