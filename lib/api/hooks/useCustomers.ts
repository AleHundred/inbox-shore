import type { UseQueryResult } from '@tanstack/react-query';

import { queryKeys } from '@/lib/reactQuery';
import type { CustomerData } from '@/lib/types/api';

import { useApiQuery } from './useApi';

/**
 * Hook for fetching customer data
 *
 * @param customerId - ID of the customer to fetch
 * @returns Query result with customer data
 */
export function useCustomer(customerId: string): UseQueryResult<CustomerData, Error> {
  return useApiQuery<CustomerData>(
    queryKeys.customers.detail(customerId),
    async (_authHeader) => {
      try {
        return {
          data: {
            id: customerId,
            fullName: 'Customer Name',
            email: 'customer@example.com',
          },
          error: null,
        };
      } catch (error) {
        return {
          data: null,
          error: error instanceof Error ? error : new Error('Failed to fetch customer data'),
        };
      }
    },
    {
      errorMessage: 'Failed to load customer data',
    }
  );
}
