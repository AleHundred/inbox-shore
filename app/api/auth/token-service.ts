import { sign, verify, TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import { cookies } from 'next/headers';

import { COOKIE_CONFIG } from './cookie-config';

/** Token payload interface containing user identification */
interface TokenPayload {
  userId: string;
  email?: string;
  iat?: number;
  exp?: number;
}

/**
 * Retrieves and validates the JWT secret from environment variables
 */
function getJwtSecret(): string {
  const secret = process.env['JWT_SECRET'];
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable must be set in production!');
    }
    return 'some_dev_secret';
  }
  return secret;
}

/**
 * Creates a new authentication token
 * @param payload - The token payload containing user ID
 * @returns Signed JWT token
 */
export function createAuthToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  const secret = getJwtSecret();

  return sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn: '24h',
  });
}

/**
 * Verifies and decodes an authentication token
 * @param token - The JWT token to verify
 * @returns Decoded token payload or null if invalid
 */
export function verifyAuthToken(token: string): TokenPayload | null {
  try {
    const secret = getJwtSecret();

    const decoded = verify(token, secret, {
      algorithms: ['HS256'],
    }) as TokenPayload;

    return decoded;
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      console.error('Token expired');
    } else if (error instanceof JsonWebTokenError) {
      console.error('Invalid token:', error.message);
    } else {
      console.error('Token verification error:', error);
    }

    return null;
  }
}

/**
 * Retrieves the current user ID from authentication cookies
 * @returns User ID if authenticated, null otherwise
 */
export function getCurrentUserId(): string | null {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_CONFIG.AUTH_TOKEN.name)?.value;

    if (!token) return null;

    const payload = verifyAuthToken(token);
    return payload?.userId || null;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
}
