import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// REQUEST ANALYSIS
// ============================================================================

/**
 * Check if request is for static assets.
 */
export function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  );
}

/**
 * Check if request is for API routes.
 */
export function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api');
}

/**
 * Check if request should skip middleware processing.
 */
export function shouldSkipMiddleware(pathname: string): boolean {
  return isStaticAsset(pathname) || isApiRoute(pathname);
}

/**
 * Extract path segments from URL.
 */
export function getPathSegments(pathname: string): string[] {
  return pathname.split('/').filter(Boolean);
}

/**
 * Get first path segment.
 */
export function getFirstPathSegment(pathname: string): string | undefined {
  const segments = getPathSegments(pathname);
  return segments[0];
}

// ============================================================================
// RESPONSE CREATION
// ============================================================================

/**
 * Create redirect response.
 * 
 * @param request - The incoming request
 * @param targetPath - The path to redirect to
 * @param status - HTTP status code (default: 307 Temporary Redirect)
 *   - 302: Temporary redirect (may change POST to GET in old browsers)
 *   - 307: Temporary redirect (preserves HTTP method) - Default
 *   - 308: Permanent redirect (preserves HTTP method, cacheable)
 */
export function createRedirectResponse(
  request: NextRequest,
  targetPath: string,
  status: number = 307
): NextResponse {
  const redirectUrl = new URL(targetPath, request.url);
  return NextResponse.redirect(redirectUrl, status);
}

/**
 * Create error response.
 */
export function createErrorResponse(
  message: string,
  status: number = 500
): NextResponse {
  return new NextResponse(message, { status });
}

/**
 * Create JSON error response.
 */
export function createJsonErrorResponse(
  error: { message: string; code?: string },
  status: number = 500
): NextResponse {
  return new NextResponse(JSON.stringify(error), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ============================================================================
// HEADER UTILITIES
// ============================================================================

/**
 * Get Accept-Language header values.
 */
export function getAcceptLanguageValues(request: NextRequest): string[] {
  const acceptLanguage = request.headers.get('Accept-Language');
  if (!acceptLanguage) return [];
  
  return acceptLanguage
    .split(',')
    .map(lang => {
      const parts = lang.split(';');
      return parts[0]?.trim() || '';
    })
    .filter(lang => lang.length > 0);
}

/**
 * Get User-Agent header.
 */
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('User-Agent') || '';
}

/**
 * Get client IP address.
 */
export function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

// ============================================================================
// SECURITY UTILITIES
// ============================================================================

/**
 * Add common security headers to response.
 */
export function addSecurityHeaders(response: NextResponse): void {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
}

/**
 * Add CORS headers to response.
 */
export function addCorsHeaders(response: NextResponse, origin?: string): void {
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// ============================================================================
// RATE LIMITING UTILITIES
// ============================================================================

/**
 * Simple in-memory rate limiter (for development).
 * In production, use Redis or similar.
 */
class SimpleRateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  
  isAllowed(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const record = this.requests.get(key);
    
    if (!record || now > record.resetTime) {
      this.requests.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (record.count >= limit) {
      return false;
    }
    
    record.count++;
    return true;
  }
  
  getRemainingRequests(key: string, limit: number): number {
    const record = this.requests.get(key);
    if (!record) return limit;
    return Math.max(0, limit - record.count);
  }
}

export const rateLimiter = new SimpleRateLimiter();

// ============================================================================
// AUTHENTICATION UTILITIES
// ============================================================================

/**
 * Extract JWT token from Authorization header.
 */
export function extractJWTToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.substring(7);
}

/**
 * Check if route requires authentication.
 */
export function requiresAuth(pathname: string): boolean {
  const protectedRoutes = ['/dashboard', '/admin', '/profile'];
  return protectedRoutes.some(route => pathname.startsWith(route));
}

/**
 * Check if route is public (no auth required).
 */
export function isPublicRoute(pathname: string): boolean {
  const publicRoutes = ['/login', '/register', '/forgot-password'];
  return publicRoutes.includes(pathname);
}
