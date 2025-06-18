import { headers } from 'next/headers';

/**
 * Gets the authorization header from the request
 * @returns The authorization header value or null if not found
 */
export function getAuthHeader(): string | null {
  const headersList = headers();
  const authHeader = headersList.get('authorization');
  return authHeader;
}
