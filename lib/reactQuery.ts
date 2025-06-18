import { QueryClient } from '@tanstack/react-query';
import type { QueryClientConfig } from '@tanstack/react-query';

/**
 * Query keys for React Query to ensure proper cache management
 */
export const queryKeys = {
  auth: {
    root: () => ['auth'] as const,
    /** Key for session validation queries */
    session: () => [...queryKeys.auth.root(), 'session'] as const,
    /** Key for user profile queries */
    profile: () => [...queryKeys.auth.root(), 'profile'] as const,
  },
  requests: {
    /** Key for all request-related queries */
    root: () => ['requests'] as const,
    /** Key for request list queries */
    list: (filters = {}) => [...queryKeys.requests.root(), 'list', filters] as const,
    /** Key for request detail queries by ID and pagination */
    detail: (id: string, pagination = {}) =>
      [...queryKeys.requests.root(), 'detail', id, pagination] as const,
    /** Key for pending request creation or updates */
    pending: () => [...queryKeys.requests.root(), 'pending'] as const,
  },
  customers: {
    /** Key for all customer-related queries */
    root: () => ['customers'] as const,
    /** Key for customer list queries */
    list: (filters = {}) => [...queryKeys.customers.root(), 'list', filters] as const,
    /** Key for customer detail queries by ID */
    detail: (id: string) => [...queryKeys.customers.root(), 'detail', id] as const,
  },
};

/**
 * Default query client configuration
 */
const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        if (
          error instanceof Error &&
          'message' in error &&
          (error.message.includes('401') || error.message.includes('403'))
        ) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: false,
      networkMode: 'always',
    },
  },
};

export const queryClient = new QueryClient(queryClientConfig);
