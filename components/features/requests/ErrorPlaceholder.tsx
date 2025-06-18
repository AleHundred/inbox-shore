'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import type React from 'react';

import { Button } from '@/components/ui/button';
import { ErrorHandler } from '@/lib/errors/errorHandler';
import type { ErrorPlaceholderProps } from '@/lib/types';
import { ErrorCategory } from '@/lib/utils/AppError';

/**
 * Displays an error message with a retry button
 *
 * @param props - Component props
 * @param props.onRetry - Function to call when retry button is clicked
 * @param props.isMalformedData - Whether the error is due to malformed data
 * @param props.customMessage - Custom error message to display
 * @returns {JSX.Element} The rendered error placeholder
 */
export default function ErrorPlaceholder({
  onRetry,
  isMalformedData = false,
  customMessage,
}: ErrorPlaceholderProps) {
  const errorMessage =
    customMessage ||
    (isMalformedData
      ? "We couldn't interpret the data format in the response. The API may have changed."
      : 'Something went wrong while loading this request.');

  const detailMessage = isMalformedData
    ? "The server returned data in a format we didn't expect. This could be due to an API update or temporary server issue."
    : 'This might be a temporary issue with our servers or your connection.';

  const handleButtonClick = () => onRetry();

  const handleReloadClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const cacheKeys = Object.keys(localStorage).filter(
        (key) => key.startsWith('rq-') || key.includes('request')
      );

      cacheKeys.forEach((key) => localStorage.removeItem(key));
    } catch (err) {
      ErrorHandler.handle(err, {
        context: 'ErrorPlaceholder.handleReloadClick',
        showToast: false,
        metadata: {
          category: ErrorCategory.DATA,
          operation: 'clearCache',
        },
      });
    }

    window.location.reload();
  };

  return (
    <div className='flex flex-col items-center justify-center p-8 bg-gray-900 rounded-lg border border-gray-800 text-center'>
      <div className='w-12 h-12 text-red-500 mb-4'>
        <AlertCircle className='w-full h-full' />
      </div>
      <h3 className='text-xl font-semibold text-gray-100 mb-2'>{errorMessage}</h3>
      <p className='text-gray-400 mb-6 max-w-md'>{detailMessage}</p>
      <div className='flex gap-4'>
        <Button onClick={handleButtonClick} className='gap-2 bg-blue-600 hover:bg-blue-700'>
          <RefreshCw className='h-4 w-4' />
          Try Again
        </Button>
        <Button onClick={handleReloadClick} variant='outline' className='gap-2'>
          <RefreshCw className='h-4 w-4' />
          Reload Page
        </Button>
      </div>
    </div>
  );
}
