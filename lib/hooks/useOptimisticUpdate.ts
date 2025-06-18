import { useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/reactQuery';
import type { RequestDetailResponse, TimelineEntry } from '@/lib/types/api';
import {
  createOptimisticTimelineEntry,
  removeOptimisticEntry,
  replaceOptimisticEntry,
} from '@/lib/utils/optimistic';

import { useAuth } from './useAuth';

/**
 * Hook for managing optimistic updates in requests
 * Provides utilities for creating, replacing, and removing optimistic entries
 *
 * @returns Object containing functions for optimistic update management
 */
export function useOptimisticUpdate() {
  const queryClient = useQueryClient();
  const { getUserInfo } = useAuth();

  /**
   * Adds an optimistic entry to a request's timeline
   *
   * @param requestId - The unique identifier of the request
   * @param message - The message content to be displayed
   * @returns The generated optimistic entry ID, or null if user info is missing
   */
  const addOptimisticEntry = (requestId: string, message: string) => {
    if (!requestId) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[useOptimisticUpdate] Cannot create optimistic entry: missing requestId');
      }
      return null;
    }

    const userInfo = getUserInfo();

    if (!userInfo || !userInfo.id) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[useOptimisticUpdate] Cannot create optimistic entry: missing user info');
      }
      return null;
    }

    try {
      const optimisticEntry = createOptimisticTimelineEntry(message, userInfo);
      const optimisticEntryId = optimisticEntry.id;

      if (process.env.NODE_ENV !== 'production') {
        console.debug('[useOptimisticUpdate] Adding optimistic entry', {
          requestId,
          entryId: optimisticEntryId,
          messageLength: message.length,
        });
      }

      queryClient.setQueryData<RequestDetailResponse>(
        queryKeys.requests.detail(requestId),
        (old) => {
          if (!old) {
            console.warn('[useOptimisticUpdate] No existing data for request', requestId);
            return old;
          }

          if (!old.timeline?.timelineEntries?.items) {
            console.warn('[useOptimisticUpdate] Invalid timeline structure for request', requestId);
            return old;
          }

          const fullOptimisticEntry: TimelineEntry = {
            type: 'message',
            ...optimisticEntry,
            components: [],
            entryType: 'chat',
          };

          return {
            ...old,
            timeline: {
              ...old.timeline,
              timelineEntries: {
                ...old.timeline.timelineEntries,
                items: [fullOptimisticEntry, ...old.timeline.timelineEntries.items],
              },
            },
          };
        },
        { updatedAt: Date.now() }
      );

      return optimisticEntryId;
    } catch (error) {
      console.error('[useOptimisticUpdate] Error adding optimistic entry:', error);
      return null;
    }
  };

  /**
   * Replaces a temporary optimistic entry with the confirmed server response
   *
   * @param requestId - The unique identifier of the request
   * @param optimisticEntryId - The ID of the optimistic entry to replace
   * @param realEntry - The confirmed entry data from the server
   */
  const replaceOptimistic = (
    requestId: string,
    optimisticEntryId: string,
    realEntry: TimelineEntry
  ) => {
    if (!requestId || !optimisticEntryId || !realEntry) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[useOptimisticUpdate] Invalid parameters for replaceOptimistic', {
          requestId,
          optimisticEntryId,
          hasRealEntry: !!realEntry,
        });
      }
      return;
    }

    try {
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[useOptimisticUpdate] Replacing optimistic entry', {
          requestId,
          optimisticEntryId,
          realEntryId: realEntry.id,
        });
      }

      queryClient.setQueryData<RequestDetailResponse>(
        queryKeys.requests.detail(requestId),
        (old) => {
          if (!old) {
            console.warn(
              '[useOptimisticUpdate] No existing data for request during replacement',
              requestId
            );
            return old;
          }

          if (!old.timeline?.timelineEntries?.items) {
            console.warn(
              '[useOptimisticUpdate] Invalid timeline structure during replacement',
              requestId
            );
            return old;
          }

          const updatedItems = replaceOptimisticEntry(
            old.timeline.timelineEntries.items,
            optimisticEntryId,
            realEntry
          );

          if (process.env.NODE_ENV !== 'production') {
            const wasUpdated = updatedItems !== old.timeline.timelineEntries.items;
            if (!wasUpdated) {
              console.warn('[useOptimisticUpdate] No matching optimistic entry found', {
                requestId,
                optimisticEntryId,
                availableIds: old.timeline.timelineEntries.items.map((i) => i.id),
              });
            }
          }

          return {
            ...old,
            timeline: {
              ...old.timeline,
              timelineEntries: {
                ...old.timeline.timelineEntries,
                items: updatedItems,
              },
            },
          };
        },
        { updatedAt: Date.now() }
      );
    } catch (error) {
      console.error('[useOptimisticUpdate] Error replacing optimistic entry:', error);
      queryClient.invalidateQueries({
        queryKey: queryKeys.requests.detail(requestId),
        refetchType: 'active',
      });
    }
  };

  /**
   * Removes an optimistic entry from the timeline
   * Typically used when an error occurs and the optimistic update needs to be rolled back
   *
   * @param requestId - The unique identifier of the request
   * @param optimisticEntryId - The ID of the optimistic entry to remove
   */
  const removeOptimistic = (requestId: string, optimisticEntryId: string) => {
    if (!requestId || !optimisticEntryId) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[useOptimisticUpdate] Invalid parameters for removeOptimistic', {
          requestId,
          optimisticEntryId,
        });
      }
      return;
    }

    try {
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[useOptimisticUpdate] Removing optimistic entry', {
          requestId,
          optimisticEntryId,
        });
      }

      queryClient.setQueryData<RequestDetailResponse>(
        queryKeys.requests.detail(requestId),
        (old) => {
          if (!old) {
            console.warn(
              '[useOptimisticUpdate] No existing data for request during removal',
              requestId
            );
            return old;
          }

          if (!old.timeline?.timelineEntries?.items) {
            console.warn(
              '[useOptimisticUpdate] Invalid timeline structure during removal',
              requestId
            );
            return old;
          }

          const updatedItems = removeOptimisticEntry(
            old.timeline.timelineEntries.items,
            optimisticEntryId
          );

          if (process.env.NODE_ENV !== 'production') {
            const wasUpdated = updatedItems !== old.timeline.timelineEntries.items;
            if (!wasUpdated) {
              console.warn('[useOptimisticUpdate] No matching optimistic entry found for removal', {
                requestId,
                optimisticEntryId,
                availableIds: old.timeline.timelineEntries.items.map((i) => i.id),
              });
            }
          }

          return {
            ...old,
            timeline: {
              ...old.timeline,
              timelineEntries: {
                ...old.timeline.timelineEntries,
                items: updatedItems,
              },
            },
          };
        },
        { updatedAt: Date.now() }
      );
    } catch (error) {
      console.error('[useOptimisticUpdate] Error removing optimistic entry:', error);
      queryClient.invalidateQueries({
        queryKey: queryKeys.requests.detail(requestId),
        refetchType: 'active',
      });
    }
  };

  return {
    addOptimisticEntry,
    replaceOptimistic,
    removeOptimistic,
  };
}
