import { DEFAULT_LOCALIZED_HOME } from 'i18n';
import {
  determineTargetLocale,
  getLocaleFromPathname
} from 'i18n/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { createRedirectResponse } from './middleware/utils';

/**
 * Handle internationalization routing.
 * Redirects non-localized routes to localized versions.
 */
function handleI18n(request: NextRequest): NextResponse | null {
  const { pathname, search } = request.nextUrl;
  
  // Check if pathname already has a locale
  const pathnameLocale = getLocaleFromPathname(pathname);
  if (pathnameLocale) {
    return null; // Already localized, continue
  }
  
  // Determine target locale
  const targetLocale = determineTargetLocale(request);
  
  // Build localized pathname
  // For root path ("/"), redirect to a localized default route to avoid 404s
  const localizedPathname = pathname === '/'
    ? `/${targetLocale}${DEFAULT_LOCALIZED_HOME}`
    : `/${targetLocale}${pathname}`;
  
  // Use 308 (Permanent Redirect) for SEO and caching benefits
  return createRedirectResponse(request, localizedPathname + search, 308);
}

/**
 * Future implementations:
 * - Handle authentication
 * - Handle rate limiting
 * - Add security headers to response
 * - Analytics tracking
 * - A/B testing
 */

/**
 * Main middleware function.
 * Processes requests through all middleware concerns in order.
 */
export function middleware(request: NextRequest): NextResponse {
  // Process i18n routing
  const i18nResponse = handleI18n(request);
  if (i18nResponse) return i18nResponse;

  // Future: Add other middleware concerns here

  return NextResponse.next();
}

/**
 * Configure middleware to run on specific paths.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /api/* (API routes)
     * - /_next/static/* (static files)
     * - /_next/image/* (image optimization)
     * - /favicon.ico (favicon)
     * - /robots.txt, /sitemap.xml, /manifest.webmanifest (public metadata)
     * - /apple-touch-icon.png and common static public assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|apple-touch-icon.png).*)',
  ],
};
