import type { QueryKey, UseMutationOptions, UseQueryOptions } from '@tanstack/react-query';
import { useMutation, useQuery } from '@tanstack/react-query';

import {
  createQueryErrorHandler,
  createMutationErrorHandler,
  safeApiCall,
} from '@/lib/errors/patterns';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToastFeedback } from '@/lib/hooks/useToastFeedback';
import type { ApiResponse } from '@/lib/types/api';
import { createReactQueryRetryFn, RetryPresets } from '@/lib/utils/retrySystem';

/**
 * Base hook for all API queries
 * Provides consistent error handling, authentication, and caching
 */
export function useApiQuery<TData, TError = Error>(
  queryKey: QueryKey,
  queryFn: (authHeader: string) => Promise<ApiResponse<TData>>,
  options?: Omit<UseQueryOptions<TData, TError, TData, QueryKey>, 'queryKey' | 'queryFn'> & {
    requireAuth?: boolean;
    errorMessage?: string;
    retryConfig?: 'fast' | 'background' | 'critical' | 'realtime';
  }
) {
  const { getAuthHeader, isAuthenticated } = useAuth();
  const requireAuth = options?.requireAuth ?? true;

  const getRetryConfig = () => {
    switch (options?.retryConfig) {
      case 'fast':
        return RetryPresets.FAST_OPERATIONS;
      case 'background':
        return RetryPresets.BACKGROUND_OPERATIONS;
      case 'critical':
        return RetryPresets.CRITICAL_OPERATIONS;
      case 'realtime':
        return RetryPresets.REALTIME_OPERATIONS;
      default:
        return RetryPresets.FAST_OPERATIONS;
    }
  };

  const errorHandler = createQueryErrorHandler(String(queryKey[0]));

  return useQuery<TData, TError, TData, QueryKey>({
    queryKey,
    queryFn: async () => {
      try {
        const authHeader = getAuthHeader();

        if (requireAuth && !authHeader) {
          throw new Error('No authentication header available');
        }

        const result = await queryFn(authHeader);

        if (result.error) {
          throw result.error;
        }

        if (!result.data) {
          throw new Error('No data returned from API');
        }

        return result.data;
      } catch (error) {
        errorHandler(error);
        throw error instanceof Error ? error : new Error('Failed to fetch data');
      }
    },
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
    enabled: !requireAuth || isAuthenticated,
    retry: createReactQueryRetryFn(getRetryConfig()),
    ...options,
  });
}

/**
 * Base hook for all API mutations
 * Provides consistent error handling, authentication, and success feedback
 */
export function useApiMutation<TData, TVariables, TError = Error>(
  mutationFn: (authHeader: string, variables: TVariables) => Promise<ApiResponse<TData>>,
  options?: Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'> & {
    requireAuth?: boolean;
    errorMessage?: string;
    successMessage?: string;
  }
) {
  const { getAuthHeader, isAuthenticated } = useAuth();
  const { showSuccess } = useToastFeedback();
  const requireAuth = options?.requireAuth ?? true;

  return useMutation<TData, TError, TVariables>({
    mutationFn: async (variables: TVariables) => {
      if (requireAuth && !isAuthenticated) {
        throw new Error('Authentication required');
      }

      const authHeader = getAuthHeader();

      if (requireAuth && !authHeader) {
        throw new Error('No authentication header available');
      }

      const result = await safeApiCall(() => mutationFn(authHeader, variables), 'APIMutation', {
        showToast: false,
      });

      if (result.error) {
        throw result.error;
      }

      if (!result.data) {
        throw new Error('No data returned from API');
      }

      if (options?.successMessage) {
        showSuccess(options.successMessage);
      }

      return result.data as TData;
    },
    onError: (error) => {
      const errorHandler = createMutationErrorHandler(
        'APIMutation',
        options?.onError as (() => void) | undefined
      );
      errorHandler(error);
    },
    ...options,
  });
}
