/**
 * Prefix for optimistic entry IDs
 * Used to identify optimistic updates in the UI
 */
const OPTIMISTIC_ID_PREFIX = 'optimistic-';

/**
 * Generates a unique optimistic ID
 * @returns A unique ID for optimistic entries
 */
export function generateOptimisticId(): string {
  return `${OPTIMISTIC_ID_PREFIX}${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Checks if an ID belongs to an optimistic entry
 * @param id - The ID to check
 * @returns True if this is an optimistic entry, false for invalid/undefined IDs
 */
export function isOptimisticEntry(id: string | null | undefined): boolean {
  if (!id) return false;

  return id.startsWith(OPTIMISTIC_ID_PREFIX);
}

/**
 * Creates a temporary timeline entry for optimistic UI updates
 *
 * @param message - The message content to be displayed
 * @param userInfo - Information about the user sending the message
 * @param userInfo.name - Optional display name of the user
 * @returns A temporary entry that can be displayed immediately in the UI
 */
export function createOptimisticTimelineEntry(
  message: string,
  userInfo: { id?: string; name?: string }
) {
  const userName = userInfo?.name || 'You';
  const entryId = generateOptimisticId();

  return {
    id: entryId,
    timestamp: new Date().toISOString(),
    actorType: 'customer' as const,
    actorName: userName,
    entryType: 'chat',
    chatId: `${OPTIMISTIC_ID_PREFIX}chat-${Date.now()}`,
    text: message,
    isOptimistic: true,
  };
}

/**
 * Replaces an optimistic entry with its confirmed server response
 *
 * @param entries - The current array of timeline entries
 * @param optimisticId - The ID of the optimistic entry to replace
 * @param realEntry - The confirmed entry data from the server
 * @returns Updated array with the optimistic entry replaced by the real one
 */
export function replaceOptimisticEntry<T extends { id: string }>(
  entries: T[],
  optimisticId: string,
  realEntry: T
): T[] {
  return entries.map((entry) => {
    if (entry.id === optimisticId) {
      return realEntry;
    }
    return entry;
  });
}

/**
 * Removes a failed optimistic entry from the timeline
 *
 * @param entries - The current array of timeline entries
 * @param optimisticId - The ID of the optimistic entry to remove
 * @returns Updated array with the failed entry removed
 */
export function removeOptimisticEntry<T extends { id: string }>(
  entries: T[],
  optimisticId: string
): T[] {
  return entries.filter((entry) => entry.id !== optimisticId);
}
