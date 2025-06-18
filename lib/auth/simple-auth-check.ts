import type { NextRequest } from 'next/server';

/**
 * Simple authentication check that works in Edge Runtime
 * Only checks for presence of session cookies without JWT verification
 */
export function hasValidSessionCookies(request: NextRequest): boolean {
  const authToken = request.cookies.get('auth-token')?.value;
  const sessionCookie = request.cookies.get('has-session')?.value;

  return !!(authToken && sessionCookie === 'true');
}

/**
 * Check if a path requires authentication
 */
export function isProtectedPath(pathname: string): boolean {
  const protectedPaths = [
    '/requests',
    '/request/',
    '/api/requests',
    '/api/request',
    '/api/contact-form',
    '/api/reply',
    '/api/timeline',
    '/api/threads',
    '/api/auth/me',
  ];
  return protectedPaths.some((path) => pathname.startsWith(path));
}

/**
 * Check if a path is an authentication-related path
 */
export function isAuthPath(pathname: string): boolean {
  const authPaths = ['/login', '/api/login'];
  return authPaths.some((path) => pathname.startsWith(path));
}
