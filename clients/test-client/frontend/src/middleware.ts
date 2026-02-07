import {
  getConfig,
  getLocaleFromPathname,
  determineTargetLocale,
} from '@portfolio/i18n';
import { NextRequest, NextResponse } from 'next/server';

function handleI18n(request: NextRequest): NextResponse | null {
  const { pathname, search } = request.nextUrl;

  const pathnameLocale = getLocaleFromPathname(pathname);
  if (pathnameLocale) return null;

  const config = getConfig();
  const targetLocale = determineTargetLocale({
    queryLocale: request.nextUrl.searchParams.get('lang'),
    cookieHeader: request.headers.get('cookie') ?? undefined,
    acceptLanguage: request.headers.get('accept-language'),
  });

  const defaultHome = config.defaultLocalizedHome ?? '/';
  const localizedPathname =
    pathname === '/' ? `/${targetLocale}${defaultHome}` : `/${targetLocale}${pathname}`;

  return NextResponse.redirect(new URL(localizedPathname + search, request.url), 308);
}

export function middleware(request: NextRequest): NextResponse {
  const i18nResponse = handleI18n(request);
  if (i18nResponse) return i18nResponse;
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|locales).*)',
  ],
};
