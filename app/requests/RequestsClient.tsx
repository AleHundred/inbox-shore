'use client';

import { Loader2, MessageSquarePlus } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import EmptyRequest from '@/components/features/requests/EmptyRequest';
import ErrorPlaceholder from '@/components/features/requests/ErrorPlaceholder';
import PaginationControls from '@/components/features/requests/PaginationControls';
import RequestRow from '@/components/features/requests/RequestRow';
import { Button } from '@/components/ui/button';
import { ErrorHandler } from '@/lib/errors/errorHandler';
import { useKeyboardNavigation, useRequests } from '@/lib/hooks';
import { useAuth } from '@/lib/hooks/useAuth';
import type { ErrorBoundaryProps } from '@/lib/types';
import type { PageInfo } from '@/lib/types/api';
import { ErrorCategory } from '@/lib/utils/AppError';
import { ensureRequestSummary, extractPaginationInfo, isRequestLike } from '@/lib/utils/typeGuards';

const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children, fallback }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      ErrorHandler.handle(event.error, {
        context: 'RequestsClient.ErrorBoundary',
        showToast: false,
        metadata: {
          category: ErrorCategory.UNKNOWN,
          type: 'unhandled',
        },
      });
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  if (hasError) {
    return <div>{fallback}</div>;
  }

  return <div>{children}</div>;
};

const defaultPagination = {
  page: 1,
  limit: 10,
  total: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

function RequestsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listContainerRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const paginationParams = useMemo(() => {
    const page = searchParams?.get('page');
    const limit = searchParams?.get('limit');

    return {
      page: page ? parseInt(page, 10) || 1 : 1,
      limit: limit ? parseInt(limit, 10) || 10 : 10,
    };
  }, [searchParams]);

  const {
    data: requestsData,
    isLoading: isRequestsLoading,
    error,
    refetch,
  } = useRequests(paginationParams);

  const isLoading = isAuthLoading || isRequestsLoading;

  const requests = (requestsData?.tickets || requestsData?.data || [])
    .filter(isRequestLike)
    .map(ensureRequestSummary);

  const pagination = requestsData?.pagination || defaultPagination;
  const customerDataMap = requestsData?.customerDataMap || {};

  const handleSelectRequest = useCallback(
    (requestId: string) => {
      setSelectedRequestId(requestId);
      router.push(`/request/${requestId}`);
    },
    [router]
  );

  const handleHoverRequest = useCallback((requestId: string) => {
    setSelectedRequestId(requestId);
  }, []);

  const handleNewRequestClick = useCallback(() => {
    router.push('/request/new');
  }, [router]);

  const { focusedIndex, setFocus } = useKeyboardNavigation({
    itemsCount: requests.length,
    onSelect: (index: number) => {
      if (requests[index]) {
        handleSelectRequest(requests[index].id);
      }
    },
    onEscape: () => setSelectedRequestId(null),
    containerRef: listContainerRef,
    initialFocusedIndex: 0,
    wrapping: true,
    vertical: true,
    disabled: isLoading || requests.length === 0,
  });

  useEffect(() => {
    const container = listContainerRef.current;
    if (container && isClient) {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          const currentIndex = focusedIndex;
          const newIndex =
            event.key === 'ArrowDown'
              ? (currentIndex + 1) % requests.length
              : (currentIndex - 1 + requests.length) % requests.length;
          setFocus(newIndex);
        }
      };
      container.addEventListener('keydown', handleKeyDown);
      return () => {
        container.removeEventListener('keydown', handleKeyDown);
      };
    }
    return undefined;
  }, [focusedIndex, setFocus, requests.length, isClient]);

  if (!isClient) {
    return (
      <div className='flex h-40 items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className='flex h-40 items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <div className='flex h-40 items-center justify-center text-red-500'>
          Something went wrong. Please try again later.
        </div>
      }
    >
      <div className='mx-auto max-w-4xl space-y-6 p-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-white'>Support Requests</h1>
            <p className='text-sm text-gray-400'>Manage and respond to customer support tickets</p>
          </div>
          <Button onClick={handleNewRequestClick} className='gap-2 bg-blue-600 hover:bg-blue-700'>
            <MessageSquarePlus className='h-4 w-4' />
            New Request
          </Button>
        </div>

        {isLoading ? (
          <div className='flex h-40 items-center justify-center'>
            <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
          </div>
        ) : error ? (
          <ErrorPlaceholder
            customMessage={
              error instanceof Error ? error.message : 'Failed to load requests. Please try again.'
            }
            onRetry={() => refetch()}
          />
        ) : requests.length === 0 ? (
          <EmptyRequest />
        ) : (
          <div className='space-y-4'>
            <div
              ref={listContainerRef}
              className='space-y-2 rounded-lg border border-gray-800 p-4 shadow-sm'
              role='listbox'
              aria-label='List of requests'
            >
              {requests.map((request, index) => (
                <RequestRow
                  key={request.id}
                  request={request}
                  customerDataMap={customerDataMap}
                  isActive={selectedRequestId === request.id}
                  onSelect={() => handleSelectRequest(request.id)}
                  onHover={handleHoverRequest}
                  index={index}
                />
              ))}
            </div>

            <PaginationControls
              pageInfo={extractPaginationInfo(pagination as PageInfo | undefined)}
            />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default RequestsContent;
