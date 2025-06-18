import { useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/reactQuery';
import type { RequestCreateResponse, ReplyResponse } from '@/lib/types/request';

import { requestService } from '../services/requestService';

import { useApiMutation } from './useApi';

/**
 * Hook for creating a new request
 *
 * @returns Mutation for creating a request
 */
export function useCreateRequest() {
  const queryClient = useQueryClient();

  return useApiMutation<RequestCreateResponse, { title: string; message: string }>(
    (authHeader, params) =>
      requestService.createRequest({
        authHeader,
        title: params.title,
        message: params.message,
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.requests.list() });
      },
      errorMessage: 'Failed to create request',
      successMessage: 'Request created successfully',
    }
  );
}

/**
 * Hook for sending a reply to a request
 *
 * @deprecated Use the main useSendReply hook from '@/lib/hooks' instead
 * This legacy implementation is maintained for backward compatibility
 * @returns Mutation for sending a reply
 */
export function useSendReplyLegacy() {
  const queryClient = useQueryClient();

  return useApiMutation<ReplyResponse, { requestId: string; text: string }>(
    (authHeader, params) =>
      requestService.sendReply({
        authHeader,
        requestId: params.requestId,
        text: params.text,
      }),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.requests.detail(variables.requestId),
        });
      },
      errorMessage: 'Failed to send reply',
      successMessage: 'Reply sent successfully',
    }
  );
}
