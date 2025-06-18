import React, { useMemo } from 'react';

import type { EntryNode, RequestMessageProps } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils/dateUtils';

/**
 * Extracts message content from different entry types
 *
 * @param entry - The timeline entry node
 * @returns {string} The message content as a string
 */
function getMessageContent(entry: EntryNode): string {
  if (!entry) return '';

  if (entry.text) {
    return entry.text;
  }

  if (entry.message?.text) {
    return entry.message.text;
  }

  if (entry.content) {
    return entry.content;
  }

  if (entry.entry && typeof entry.entry === 'object') {
    if ('text' in entry.entry && entry.entry['text']) {
      return entry.entry['text'] as string;
    }
  }
  const target = entry.entry && typeof entry.entry === 'object' ? entry.entry : entry;

  if ('components' in target && Array.isArray(target['components'])) {
    return target['components']
      .map((comp) => (comp && typeof comp === 'object' && 'text' in comp ? comp['text'] : ''))
      .filter(Boolean)
      .join('\n');
  }

  if ('text' in target && target['text']) {
    return target['text'] as string;
  }
  if ('title' in target && target['title']) {
    return target['title'] as string;
  }
  return '';
}

/**
 * Renders a single message in the request timeline
 *
 * @param props - Component props
 * @param props.entry - The timeline entry data
 * @param props.actorName - Name of the message sender
 * @param props.isUserMessage - Whether this message was sent by the current user
 * @param props.isOptimistic - Whether this is an optimistic update (not yet confirmed by server)
 * @returns {JSX.Element | null} The rendered message or null if no content
 */
export function RequestMessage({
  entry,
  actorName,
  isUserMessage,
  isOptimistic,
}: RequestMessageProps) {
  const timestamp =
    typeof entry?.timestamp === 'string' ? entry.timestamp : entry?.timestamp?.iso8601 || '';

  const formattedDate = useMemo(() => {
    return timestamp ? formatDate(timestamp) : 'Unknown time';
  }, [timestamp]);

  const messageContent = getMessageContent(entry);

  if (!messageContent || messageContent.trim() === '') {
    return null;
  }

  return (
    <div
      className={cn(
        'message-container mb-5 p-4 transition-all',
        isUserMessage ? 'user-message ml-auto' : 'other-message',
        isOptimistic && 'opacity-80 border border-accent/50'
      )}
      role='article'
      aria-label={`Message from ${actorName}`}
    >
      <div className='flex items-center justify-between mb-2'>
        <span className='font-medium text-sm'>{isUserMessage ? 'You' : actorName}</span>
        <div className='flex items-center gap-2'>
          <time dateTime={timestamp} className='text-sm opacity-75'>
            {formattedDate}
          </time>
          {isOptimistic && <span className='text-sm italic text-accent/80'>(sending...)</span>}
        </div>
      </div>
      <div className='mt-2 text-base leading-relaxed whitespace-pre-wrap'>{messageContent}</div>
    </div>
  );
}
