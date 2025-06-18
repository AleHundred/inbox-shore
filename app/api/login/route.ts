import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { COOKIE_CONFIG } from '@/app/api/auth/cookie-config';
import { createAuthToken } from '@/app/api/auth/token-service';

/**
 * POST /api/login
 * Authenticates a user and sets HTTP-only cookies
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const serverUrl = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3001';
    const response = await fetch(`${serverUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return NextResponse.json(
        { success: false, error: data.error || data.message || 'Login failed' },
        { status: response.status }
      );
    }

    const token = createAuthToken({
      userId: data.user.id,
      email: data.user.email,
    });

    const nextResponse = NextResponse.json({
      success: true,
      token,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
      },
    });

    nextResponse.cookies.set(
      COOKIE_CONFIG.AUTH_TOKEN.name,
      token,
      COOKIE_CONFIG.AUTH_TOKEN.options
    );

    nextResponse.cookies.set('has-session', 'true', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    });

    return nextResponse;
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, error: 'Network error. Please try again.' },
      { status: 500 }
    );
  }
}
