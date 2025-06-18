/**
 * Query keys for React Query
 * This file centralizes all query keys used in the application
 */

export const queryKeys = {
  requests: {
    all: ['requests'] as const,
    list: () => [...queryKeys.requests.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.requests.all, 'detail', id] as const,
    timeline: (id: string) => [...queryKeys.requests.detail(id), 'timeline'] as const,
  },
  customers: {
    all: ['customers'] as const,
    detail: (id: string) => [...queryKeys.customers.all, 'detail', id] as const,
  },
};
