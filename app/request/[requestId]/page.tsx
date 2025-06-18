'use client';

import type { UseQueryResult } from '@tanstack/react-query';
import { ArrowDown, Loader2, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import ErrorPlaceholder from '@/components/features/requests/ErrorPlaceholder';
import { Reply } from '@/components/features/requests/Reply';
import { RequestMessage } from '@/components/features/requests/RequestMessage';
import Navigation from '@/components/layout/Navigation';
import { Button } from '@/components/ui/button';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';
import { safeDate } from '@/lib/api/utils/apiUtils';
import { POLLING_INTERVAL } from '@/lib/constants';
import { useAuth, useRequestDetail } from '@/lib/hooks';
import { useScrollHandler } from '@/lib/hooks/useScrollHandler';
import type { PaginationParams, RequestDetailResponse, TimelineApiResponse } from '@/lib/types/api';
import { isOptimisticEntry } from '@/lib/utils/optimistic';

type ExtendedRequestDetailResult = UseQueryResult<RequestDetailResponse, Error> & {
  fetchPreviousPage: () => Promise<TimelineApiResponse>;
  isFetchingPreviousPage: boolean;
  hasPreviousPage: boolean;
  reachedBeginning: boolean;
  forceLoadAll: () => void;
  fetchMoreTimelineEntries: (params: PaginationParams) => Promise<void>;
  isPinnedToBottom: boolean;
  setPinnedToBottom: (isPinned: boolean) => void;
  hasNewMessages: boolean;
  resetNewMessagesIndicator: () => void;
};

type RequestDetailOptions = {
  pollInterval?: number;
  queryKey: string[];
};

/**
 * Request detail page component
 * Here we get a single request with its timeline entries and reply functionality
 * We also handle pagination and auto-scrolling behavior for the timeline
 * Optimistic updates are handled by the RequestMessage component
 *
 * @param {Object} props - Component props
 * @param {Object} props.params - URL parameters
 * @param {string} props.params.requestId - The unique identifier of the request to display
 * @returns {JSX.Element} The rendered request page
 */
export default function RequestPage({ params }: { params: { requestId: string } }) {
  const { requestId } = params;
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState<boolean>(false);
  const initialRenderDoneRef = useRef(false);
  const loadAttemptsRef = useRef(0);

  useEffect(() => {
    setIsClient(true);
    return undefined;
  }, []);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isAuthLoading, router]);

  const pollInterval = isClient ? POLLING_INTERVAL : undefined;

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchPreviousPage,
    isFetchingPreviousPage,
    hasPreviousPage,
    hasNewMessages,
    resetNewMessagesIndicator,
    setPinnedToBottom,
    reachedBeginning,
    forceLoadAll,
  } = useRequestDetail(requestId, {
    pollInterval,
    queryKey: ['request', requestId],
  } as RequestDetailOptions) as ExtendedRequestDetailResult;

  const timelineLength = data?.timeline?.timelineEntries?.items?.length || 0;

  const { messagesContainerRef, loadMoreRef, handleScroll, scrollToBottom, isPinnedToBottom } =
    useScrollHandler({
      setPinnedToBottom,
      timelineLength,
      hasNewMessages,
      onLoadMore: fetchPreviousPage,
      hasPreviousPage,
    });

  useEffect(() => {
    if (
      !isLoading &&
      timelineLength > 0 &&
      !initialRenderDoneRef.current &&
      !isFetchingPreviousPage &&
      isClient
    ) {
      const timer = setTimeout(() => {
        scrollToBottom();
        initialRenderDoneRef.current = true;
      }, 100);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isLoading, timelineLength, scrollToBottom, isFetchingPreviousPage, isClient]);

  useEffect(() => {
    initialRenderDoneRef.current = false;
    loadAttemptsRef.current = 0;
    return undefined;
  }, [requestId]);

  /**
   * Handles loading more messages when user clicks the load more button
   * Tracks attempts and enables force load all after multiple attempts
   *
   * @returns {void}
   */
  const handleLoadMore = () => {
    loadAttemptsRef.current += 1;
    fetchPreviousPage();

    if (loadAttemptsRef.current >= 3) {
      forceLoadAll();
    }
  };

  if (!isClient || isLoading || isAuthLoading) {
    return (
      <>
        <Navigation hasBackButton title='' isAuthenticated={isAuthenticated} />
        <div className='container mx-auto p-4'>
          <div className='space-y-4'>
            <Skeleton className='h-6 w-1/2' />
            <Skeleton className='h-4 w-1/4' />
            <div className='space-y-3 mt-6'>
              <Skeleton className='h-24 w-full' />
              <Skeleton className='h-24 w-full' />
              <Skeleton className='h-24 w-full' />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('Authentication') || errorMessage.includes('401')) {
      router.push('/login');
      return null;
    }

    return (
      <>
        <Navigation hasBackButton title='' isAuthenticated={isAuthenticated} />
        <div className='container mx-auto p-4'>
          <ErrorPlaceholder
            onRetry={refetch}
            customMessage={`Error loading request: ${errorMessage}`}
          />
        </div>
      </>
    );
  }

  const title = data?.request?.title || 'Untitled Request';

  let createdAtDisplay = 'Unknown';
  try {
    const requestCreatedAt = data?.request?.createdAt;
    if (requestCreatedAt) {
      const dateObj = safeDate(requestCreatedAt);
      createdAtDisplay = dateObj.toLocaleString();
    }
  } catch (e) {
    console.error('Error formatting date:', e);
  }

  const customerName = (data?.request?.customer as { fullName?: string })?.fullName || 'Unknown';

  const messages = [...(data?.timeline?.timelineEntries?.items || [])];
  messages.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeA - timeB;
  });

  const messageMap = new Map();
  messages.forEach((message) => {
    if (message.id) {
      messageMap.set(message.id, message);
    }
  });
  const uniqueMessages = Array.from(messageMap.values());

  return (
    <ErrorBoundary logName='RequestDetail'>
      <Navigation hasBackButton title={title} isAuthenticated={isAuthenticated} />

      <main className='bg-gray-950 h-[calc(100vh-4rem)] flex flex-col'>
        <div className='bg-gray-900 p-4 shadow-sm border-b border-gray-800'>
          <h1 className='text-lg font-semibold text-gray-100'>{title}</h1>
          <div className='text-sm text-gray-400 flex gap-2 mt-1'>
            <span>{customerName}</span>
            <span>•</span>
            <span>{createdAtDisplay}</span>
          </div>
        </div>

        <ErrorBoundary logName='MessageList' onReset={refetch}>
          <div
            ref={messagesContainerRef}
            className='flex-1 overflow-y-auto p-4 pb-6 space-y-4'
            onScroll={handleScroll}
          >
            {isFetchingPreviousPage && (
              <div className='sticky top-0 z-10 flex justify-center py-2 mb-4 bg-gray-900 bg-opacity-70 backdrop-blur-sm rounded'>
                <Loader2 className='h-5 w-5 animate-spin text-blue-400' />
              </div>
            )}

            <div ref={loadMoreRef} className='h-px' />

            {hasPreviousPage && !reachedBeginning && !isFetchingPreviousPage && (
              <div className='flex justify-center py-2'>
                <Button
                  onClick={handleLoadMore}
                  variant='ghost'
                  size='sm'
                  className='text-gray-400 hover:text-gray-300'
                >
                  <RefreshCw className='h-4 w-4 mr-2' />
                  Load older messages {loadAttemptsRef.current >= 2 && '(Load all)'}
                </Button>
              </div>
            )}

            {uniqueMessages.map((message) => (
              <RequestMessage
                key={message.id}
                entry={message}
                actorName={message.actorName}
                isUserMessage={message.actorType === 'agent' || message.actorType === 'user'}
                isOptimistic={message.id ? isOptimisticEntry(message.id) : false}
              />
            ))}

            {uniqueMessages.length === 0 && !isLoading && !isFetchingPreviousPage && (
              <div className='text-center py-8 text-gray-500'>
                No messages yet. Start the conversation!
              </div>
            )}
          </div>
        </ErrorBoundary>

        {hasNewMessages && !isPinnedToBottom && (
          <div className='absolute bottom-24 right-4'>
            <Button
              onClick={() => {
                scrollToBottom();
                resetNewMessagesIndicator();
              }}
              size='sm'
              className='bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
            >
              <ArrowDown className='h-4 w-4 mr-1' />
              New messages
            </Button>
          </div>
        )}

        <ErrorBoundary logName='ReplyForm'>
          <div className='bg-gray-950 p-4 border-t border-gray-800'>
            <Reply requestId={requestId} />
          </div>
        </ErrorBoundary>
      </main>
    </ErrorBoundary>
  );
}
