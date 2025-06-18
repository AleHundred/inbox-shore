'use client';

import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

import { ErrorFallback } from '@/components/ui/ErrorFallback';
import { handleComponentError } from '@/lib/errors/adapters';
import { type ErrorBoundaryProps } from '@/lib/types';

/**
 * Your typical React error(horror!) boundary component with a custom error UI
 */
const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({
  children,
  onError,
  onReset,
  logName = 'ErrorBoundary',
}) => {
  return (
    <ReactErrorBoundary
      FallbackComponent={({ error, resetErrorBoundary }) => (
        <ErrorFallback
          title='Something went wrong'
          message={error?.message || 'An unexpected error occurred'}
          onRetry={resetErrorBoundary}
        />
      )}
      onError={(error, info) => {
        handleComponentError(error, logName, {
          metadata: { componentStack: info?.componentStack },
        });

        if (onError) onError(error, info);
      }}
      onReset={() => {
        if (onReset) onReset();
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
};

export default ErrorBoundary;
