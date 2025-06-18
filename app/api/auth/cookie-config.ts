/**
 * Configuration for authentication and session cookies
 */
export const COOKIE_CONFIG = {
  AUTH_TOKEN: {
    name: 'auth-token',
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 24 * 60 * 60, // 24 hours in seconds
      path: '/',
    },
  },
} as const;
