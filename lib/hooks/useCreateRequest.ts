import { useMutation, useQueryClient } from '@tanstack/react-query';

import { safeFormSubmit } from '@/lib/errors/patterns';
import { queryKeys } from '@/lib/reactQuery';

import { useAuth } from './useAuth';
import { useToastFeedback } from './useToastFeedback';

interface CreateRequestParams {
  title: string;
  message: string;
}

interface CreateRequestResponse {
  success: boolean;
  requestId: string;
}

/**
 * Hook for creating a new request
 * @returns Mutation for creating a request
 */
export function useCreateRequest() {
  const queryClient = useQueryClient();
  const { getAuthHeader } = useAuth();
  const { showError, showSuccess } = useToastFeedback();

  return useMutation<CreateRequestResponse, Error, CreateRequestParams>({
    mutationFn: async (params) => {
      const result = await safeFormSubmit(
        async () => {
          const response = await fetch('/api/requests', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: getAuthHeader() || '',
            },
            body: JSON.stringify(params),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          return response.json();
        },
        {
          context: 'createRequest',
        }
      );

      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Failed to create request');
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.list() });
      showSuccess('Request created successfully');
    },
    onError: (error) => {
      showError(`Failed to create request: ${error.message}`);
    },
  });
}
