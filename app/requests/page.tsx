'use client';

import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { PageLayout } from '@/components/layout/PageLayout';
import { SUPPORT_APP_TITLE } from '@/lib/constants';
import { useAuth } from '@/lib/hooks/useAuth';

const RequestsClient = dynamic(() => import('./RequestsClient'), {
  ssr: false,
  loading: () => (
    <div className='flex h-40 items-center justify-center'>
      <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
    </div>
  ),
});

/**
 * Requests page component that displays all support requests
 * Relies on middleware for authentication checks - no manual redirects
 */
export default function RequestsPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <PageLayout navigation={{ title: SUPPORT_APP_TITLE, isAuthenticated: false }}>
        <div className='flex h-40 items-center justify-center'>
          <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
        </div>
      </PageLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <PageLayout navigation={{ title: SUPPORT_APP_TITLE, isAuthenticated: false }}>
        <div className='flex h-40 items-center justify-center'>
          <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout navigation={{ title: SUPPORT_APP_TITLE, isAuthenticated: true }}>
      <ErrorBoundary
        fallback={
          <div className='flex h-40 items-center justify-center text-red-500'>
            Something went wrong. Please try again later.
          </div>
        }
      >
        <Suspense
          fallback={
            <div className='flex h-40 items-center justify-center'>
              <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
            </div>
          }
        >
          <RequestsClient />
        </Suspense>
      </ErrorBoundary>
    </PageLayout>
  );
}
