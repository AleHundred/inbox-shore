import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { requestService } from '@/lib/api/services/requestService';
import { shouldRetryQuery } from '@/lib/api/utils/apiUtils';
import { queryKeys } from '@/lib/reactQuery';
import type { PaginationParams, RequestsResponse } from '@/lib/types/api';
import { logDebug, logError } from '@/lib/utils/errorLogger';
import { createDefaultPagination } from '@/lib/utils/paginationUtils';
import { extractPaginationInfo } from '@/lib/utils/typeGuards';

import { useAuth } from './useAuth';
import { useToastFeedback } from './useToastFeedback';

/**
 * This hook fetches and manages the list of requests from the API
 *
 * @param paginationParams - Optional pagination parameters (supports both page-based and cursor-based)
 * @param pollInterval - Optional interval in ms to poll for updates
 * @returns Query result with request data and prefetch function
 */
export function useRequests(
  paginationParams?: PaginationParams,
  pollInterval?: number
): UseQueryResult<RequestsResponse, Error> & {
  currentPagination: PaginationParams;
  setCurrentPagination: (params: PaginationParams) => void;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  prefetchNextPage: () => Promise<void>;
} {
  const { getAuthHeader, isAuthenticated } = useAuth();
  const { showError } = useToastFeedback();
  const queryClient = useQueryClient();
  const [currentPagination, setCurrentPagination] = useState<PaginationParams>(
    paginationParams || createDefaultPagination()
  );

  const attemptCountRef = useRef(0);

  useEffect(() => {
    if (paginationParams) {
      setCurrentPagination(paginationParams);
    }
  }, [paginationParams]);

  const queryResult = useQuery<RequestsResponse, Error>({
    queryKey: queryKeys.requests.list(currentPagination),
    queryFn: async () => {
      const authHeader = getAuthHeader();

      logDebug('useRequests', 'Fetching requests', {
        pagination: currentPagination,
        hasAuth: !!authHeader,
        attempt: attemptCountRef.current + 1,
      });

      try {
        attemptCountRef.current += 1;
        const response = await requestService.getRequests(authHeader, currentPagination);

        if (response.error) {
          throw response.error;
        }

        if (!response.data) {
          throw new Error('No data returned from requests API');
        }

        logDebug('useRequests', 'Successfully fetched requests', {
          dataReceived: !!response.data,
          ticketsCount: response.data.tickets?.length || 0,
          hasCustomerDataMap: !!response.data.customerDataMap,
          pagination: response.data.pagination,
        });

        attemptCountRef.current = 0;
        return response.data;
      } catch (error) {
        logError('useRequests', 'Failed to fetch requests', {
          error: error instanceof Error ? error.message : 'Unknown error',
          pagination: currentPagination,
          attempt: attemptCountRef.current,
        });

        if (error instanceof Error && error.message.includes('auth')) {
          showError('Your session has expired. Please log in again.');
        } else {
          showError(
            `Failed to load requests: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }

        throw error instanceof Error ? error : new Error('Failed to fetch requests list');
      }
    },
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
    enabled: isAuthenticated,
    ...(pollInterval
      ? {
          refetchInterval: pollInterval,
          refetchIntervalInBackground: false,
          refetchOnWindowFocus: true,
        }
      : {
          refetchOnWindowFocus: true,
        }),
    retry: (failureCount, error) => {
      if (
        error instanceof Error &&
        (error.message.includes('auth') || error.message.includes('401'))
      ) {
        return false;
      }
      return shouldRetryQuery(failureCount, error);
    },
  });

  /**
   * Navigate to the next page of results
   */
  const nextPage = useCallback(() => {
    if (!queryResult.data?.pagination) return;

    const paginationInfo = extractPaginationInfo(queryResult.data.pagination);
    const currentPage = paginationInfo.currentPage;
    const totalPages = paginationInfo.totalPages;

    if (currentPage < totalPages) {
      setCurrentPagination((prev) => ({
        ...prev,
        page: currentPage + 1,
      }));
    }
  }, [queryResult.data?.pagination]);

  /**
   * Navigate to the previous page of results
   */
  const previousPage = useCallback(() => {
    if (!queryResult.data?.pagination) return;

    const paginationInfo = extractPaginationInfo(queryResult.data.pagination);
    const currentPage = paginationInfo.currentPage;

    if (currentPage > 1) {
      setCurrentPagination((prev) => ({
        ...prev,
        page: currentPage - 1,
      }));
    }
  }, [queryResult.data?.pagination]);

  /**
   * Navigate to a specific page of results
   *
   * @param page - Target page number
   */
  const goToPage = useCallback(
    (page: number) => {
      if (!queryResult.data?.pagination) return;

      const paginationInfo = extractPaginationInfo(queryResult.data.pagination);
      const totalPages = paginationInfo.totalPages;

      if (page >= 1 && page <= totalPages) {
        setCurrentPagination((prev) => ({
          ...prev,
          page,
        }));
      }
    },
    [queryResult.data?.pagination]
  );

  /**
   * Prefetches the next page of results for better UX
   */
  const prefetchNextPage = useCallback(async () => {
    if (!queryResult.data?.pagination) return;

    const paginationInfo = extractPaginationInfo(queryResult.data.pagination);
    const currentPage = paginationInfo.currentPage;
    const totalPages = paginationInfo.totalPages;

    if (currentPage < totalPages) {
      const nextPageParams = {
        ...currentPagination,
        page: currentPage + 1,
      };

      await queryClient.prefetchQuery({
        queryKey: queryKeys.requests.list(nextPageParams),
        queryFn: async () => {
          const authHeader = getAuthHeader();
          const response = await requestService.getRequests(authHeader, nextPageParams);

          if (response.error) {
            throw response.error;
          }

          return response.data;
        },
        staleTime: 1000 * 60,
      });
    }
  }, [queryResult.data?.pagination, currentPagination, queryClient, getAuthHeader]);

  return {
    ...queryResult,
    currentPagination,
    setCurrentPagination,
    nextPage,
    previousPage,
    goToPage,
    prefetchNextPage,
  };
}
