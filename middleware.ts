import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { hasValidSessionCookies, isAuthPath, isProtectedPath } from './lib/auth/simple-auth-check';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isProtected = isProtectedPath(path);
  const isAuth = isAuthPath(path);

  const hasValidSession = hasValidSessionCookies(request);

  if (isProtected && !hasValidSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', path);
    return NextResponse.redirect(url);
  }

  if (isAuth && hasValidSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/requests';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
