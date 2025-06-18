import type { UseQueryResult, UseQueryOptions } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';

import { requestService } from '@/lib/api/services/requestService';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToastFeedback } from '@/lib/hooks/useToastFeedback';
import { queryKeys } from '@/lib/reactQuery';
import type { RequestDetailResponse, PaginationParams } from '@/lib/types/api';
import { ensureDateTimeParts, safeRequestAccess } from '@/lib/utils/typeGuards';

import { useApiQuery } from '../api/hooks';

interface RequestDetailOptions extends UseQueryOptions<RequestDetailResponse, Error> {
  paginationParams?: PaginationParams;
  pollInterval?: number;
}

/**
 * Hook for fetching and managing a specific request's details
 *
 * @param requestId - ID of the request to fetch
 * @param options - Additional options for the query
 * @returns Query result with request detail data
 */
export function useRequestDetail(
  requestId: string,
  options?: RequestDetailOptions
): UseQueryResult<RequestDetailResponse, Error> & {
  fetchMoreTimelineEntries: (
    params: PaginationParams
  ) => Promise<RequestDetailResponse | undefined>;
  isPinnedToBottom: boolean;
  setPinnedToBottom: (isPinned: boolean) => void;
  hasNewMessages: boolean;
  resetNewMessagesIndicator: () => void;
} {
  const [isPinnedToBottom, setPinnedToBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const queryClient = useQueryClient();
  const { showError } = useToastFeedback();
  const { getAuthHeader } = useAuth();

  const queryResult = useApiQuery<RequestDetailResponse>(
    queryKeys.requests.detail(requestId, options?.paginationParams || {}),
    async (authHeader) => {
      const response = await requestService.getRequestDetail(authHeader, requestId);

      if (!response.data) {
        throw new Error('Failed to fetch request details');
      }

      const result = response.data;

      if (result.timeline) {
        const safeRequest = safeRequestAccess(result, {
          id: '',
          title: '',
          createdAt: { iso8601: '' },
          updatedAt: { iso8601: '' },
          customer: { id: '' },
        });

        return {
          data: {
            ...result,
            request: {
              ...safeRequest,
              createdAt: ensureDateTimeParts(result.request?.createdAt),
              updatedAt: ensureDateTimeParts(result.request?.updatedAt),
            },
            timeline: result.timeline,
          },
          error: null,
        };
      } else if (result.request?.timelineEntries) {
        const safeRequest = safeRequestAccess(result, {
          id: '',
          title: '',
          createdAt: { iso8601: '' },
          updatedAt: { iso8601: '' },
          customer: { id: '' },
        });

        return {
          data: {
            request: {
              ...safeRequest,
              createdAt: ensureDateTimeParts(result.request?.createdAt),
              updatedAt: ensureDateTimeParts(result.request?.updatedAt),
            },
            timeline: {
              timelineEntries: result.request.timelineEntries,
            },
          },
          error: null,
        };
      } else {
        const safeRequest = safeRequestAccess(result, {
          id: '',
          title: '',
          createdAt: { iso8601: '' },
          updatedAt: { iso8601: '' },
          customer: { id: '' },
        });

        return {
          data: {
            request: {
              ...safeRequest,
              createdAt: ensureDateTimeParts(result.request?.createdAt),
              updatedAt: ensureDateTimeParts(result.request?.updatedAt),
            },
          },
          error: null,
        };
      }
    },
    {
      enabled: !!requestId,
      staleTime: options?.pollInterval ? 0 : 1000 * 60,
      refetchInterval: options?.pollInterval || false,
      ...(options?.initialData && { initialData: options.initialData }),
    }
  );

  const fetchMoreTimelineEntries = useCallback(
    async (params: PaginationParams): Promise<RequestDetailResponse | undefined> => {
      if (isFetchingMore) return undefined;

      setIsFetchingMore(true);
      try {
        const authHeader = getAuthHeader();
        const response = await requestService.getRequestDetail(authHeader, requestId, params);

        if (!response.data) {
          throw new Error('Failed to fetch more timeline entries');
        }

        const result = response.data;
        const currentData = queryResult.data;

        if (!currentData?.timeline?.timelineEntries?.items) {
          return result;
        }

        const existingIds = new Set(
          currentData.timeline.timelineEntries.items.map((item) => item.id)
        );
        const newItems = result.timeline?.timelineEntries?.items || [];
        const uniqueNewItems = newItems.filter((item) => !existingIds.has(item.id));

        const mergedData: RequestDetailResponse = {
          ...currentData,
          timeline: {
            ...currentData.timeline,
            timelineEntries: {
              ...currentData.timeline.timelineEntries,
              items: [...currentData.timeline.timelineEntries.items, ...uniqueNewItems],
              pageInfo:
                result.timeline?.timelineEntries?.pageInfo ||
                currentData.timeline.timelineEntries.pageInfo,
            },
          },
        };

        queryClient.setQueryData(
          queryKeys.requests.detail(requestId, options?.paginationParams || {}),
          mergedData
        );

        return mergedData;
      } catch (error) {
        showError(error instanceof Error ? error.message : 'Failed to fetch more timeline entries');
        throw error;
      } finally {
        setIsFetchingMore(false);
      }
    },
    [
      isFetchingMore,
      getAuthHeader,
      requestId,
      queryResult.data,
      queryClient,
      options?.paginationParams,
      showError,
    ]
  );

  const resetNewMessagesIndicator = useCallback(() => {
    setHasNewMessages(false);
  }, []);

  return {
    ...queryResult,
    fetchMoreTimelineEntries,
    isPinnedToBottom,
    setPinnedToBottom,
    hasNewMessages,
    resetNewMessagesIndicator,
  };
}
