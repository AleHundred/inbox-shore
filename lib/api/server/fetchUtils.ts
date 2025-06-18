import { dehydrate, QueryClient } from '@tanstack/react-query';
import { unstable_cache } from 'next/cache';

import type { RequestsResponse } from '@/lib/types/api';

import { requestService } from '../services/requestService.server';
import { queryKeys } from '../utils/queryKeys';

interface ExtendedPaginationParams {
  page?: number;
  limit?: number;
  after?: string;
  before?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Creates a cached server-side fetcher for requests list
 * This ensures that multiple calls to the same data within a single render pass
 * will reuse the same promise, avoiding duplicate requests
 */
export const fetchRequestsServer = unstable_cache(
  async (authHeader: string, params?: ExtendedPaginationParams): Promise<RequestsResponse> => {
    const result = await requestService.getRequests(authHeader, params);

    if (result.error) {
      throw result.error;
    }

    if (!result.data) {
      throw new Error('No data returned from requests API');
    }

    return result.data;
  },
  ['requests-list'],
  { revalidate: 60 } // Cache for 60 seconds
);

/**
 * Prefetches request data on the server and returns a dehydrated query client
 * that can be passed to the client to hydrate the React Query cache
 */
export async function prefetchRequestsData(
  authHeader: string,
  params?: ExtendedPaginationParams
): Promise<ReturnType<typeof dehydrate>> {
  const queryClient = new QueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.requests.list(),
      queryFn: async () => {
        return await fetchRequestsServer(authHeader, params);
      },
    });
  } catch (error) {
    console.error('Error prefetching requests data:', error);
  }

  return dehydrate(queryClient);
}
