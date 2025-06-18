'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React from 'react';

import { queryClient } from '@/lib/reactQuery';

interface ApiProviderProps {
  children: React.ReactNode;
  /**
   * Whether to show React Query Devtools
   * Should be disabled in production
   */
  showDevtools?: boolean | undefined;
}

/**
 * Provider component that wraps the application with React Query
 * This enables the standardized data fetching approach throughout the app
 */
export function ApiProvider({
  children,
  showDevtools = process.env.NODE_ENV === 'development',
}: ApiProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {showDevtools && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
