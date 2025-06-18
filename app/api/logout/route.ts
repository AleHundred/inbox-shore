import { NextResponse } from 'next/server';

import { COOKIE_CONFIG } from '@/app/api/auth/cookie-config';

/**
 * POST /api/logout
 * Clears authentication cookies
 */
export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.delete(COOKIE_CONFIG.AUTH_TOKEN.name);
  response.cookies.delete('has-session');

  return response;
}
