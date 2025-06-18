const JWT_SECRET = process.env['JWT_SECRET'];

if (!JWT_SECRET && process.env.NODE_ENV !== 'test') {
  console.warn('JWT_SECRET is not set. Using a default secret in development.');
}

export const config = {
  apiBaseUrl: process.env['NEXT_PUBLIC_API_BASE_URL'] || '/api',

  useMockApi: process.env['NEXT_PUBLIC_USE_MOCK_API'] === 'true',

  mockApiBaseUrl: '/api',

  pollInterval: 5000,
  pageSize: 20,
};

export function getJwtSecret(): string {
  if (typeof window !== 'undefined') {
    throw new Error('JWT_SECRET is not available on the client side');
  }

  if (!JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is required in production');
    }
    return 'dev-secret-change-me-in-production';
  }

  return JWT_SECRET;
}
