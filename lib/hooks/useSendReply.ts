import { useMutation, useQueryClient } from '@tanstack/react-query';

import { safeApiCall } from '@/lib/errors/patterns';
import { queryKeys } from '@/lib/reactQuery';
import type { RequestDetailResponse, TimelineEntry } from '@/lib/types/api';

import { useAuth } from './useAuth';
import { useToastFeedback } from './useToastFeedback';

/**
 * Parameters for sending a reply
 */
interface SendReplyParams {
  requestId: string;
  text: string;
}

/**
 * Response from the send reply API
 */
interface SendReplyResponse {
  success: boolean;
  message: {
    id: string;
    content: string;
    createdAt: { iso8601: string };
  };
  chatId: string;
}

/**
 * Context for the mutation, used for optimistic updates
 */
interface MutationContext {
  previousData: RequestDetailResponse | undefined;
  targetRequestId: string;
}

/**
 * Hook for sending replies to requests
 *
 * @param requestId - Optional request ID that will be used if not provided in the mutation parameters
 * @returns A mutation object for sending replies
 *
 * @example
 * ```tsx
 * const { mutate: sendReply } = useSendReply(requestId);
 * sendReply({ requestId, text: "Hello" });
 * ```
 */
export function useSendReply(requestId?: string) {
  const queryClient = useQueryClient();
  const { getAuthHeader } = useAuth();
  const { showError, showSuccess } = useToastFeedback();

  return useMutation<SendReplyResponse, Error, SendReplyParams, MutationContext>({
    mutationFn: async ({ requestId: paramRequestId, text }: SendReplyParams) => {
      const targetRequestId = requestId || paramRequestId;

      if (!targetRequestId) {
        throw new Error('Request ID is required');
      }

      const result = await safeApiCall(async () => {
        const response = await fetch(`/api/requests/${targetRequestId}/replies`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: getAuthHeader() || '',
          },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
      }, 'sendReply');

      if (result.error) {
        throw new Error(result.error.message || 'Failed to send reply');
      }

      return result.data;
    },

    onMutate: async ({ requestId: paramRequestId, text }): Promise<MutationContext> => {
      const targetRequestId = requestId || paramRequestId;

      if (!targetRequestId) {
        throw new Error('Request ID is required');
      }

      await queryClient.cancelQueries({
        queryKey: queryKeys.requests.detail(targetRequestId),
      });

      const previousData = queryClient.getQueryData<RequestDetailResponse>(
        queryKeys.requests.detail(targetRequestId)
      );

      if (previousData?.timeline?.timelineEntries?.items) {
        const optimisticEntry: TimelineEntry = {
          type: 'message',
          id: `optimistic-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorType: 'agent',
          actorName: 'You',
          entryType: 'chat',
          text,
          chatId: 'pending',
          isOptimistic: true,
          components: [{ type: 'text', text }],
        };

        queryClient.setQueryData<RequestDetailResponse>(
          queryKeys.requests.detail(targetRequestId),
          {
            ...previousData,
            timeline: {
              ...previousData.timeline,
              timelineEntries: {
                ...previousData.timeline.timelineEntries,
                items: [optimisticEntry, ...previousData.timeline.timelineEntries.items],
              },
            },
          }
        );
      }

      return { previousData, targetRequestId };
    },

    onSuccess: (_data, { requestId: paramRequestId }, context) => {
      const targetRequestId = context?.targetRequestId || requestId || paramRequestId;

      if (!targetRequestId) return;

      queryClient.invalidateQueries({
        queryKey: queryKeys.requests.detail(targetRequestId),
      });

      showSuccess('Message sent successfully');
    },

    onError: (error, { requestId: paramRequestId }, context) => {
      const targetRequestId = context?.targetRequestId || requestId || paramRequestId;

      if (context?.previousData && targetRequestId) {
        queryClient.setQueryData(queryKeys.requests.detail(targetRequestId), context.previousData);
      }

      showError(`Error sending message: ${error.message}`);
    },
  });
}
