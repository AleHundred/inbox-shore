import React from 'react';

import { type ErrorFallbackProps } from '@/lib/types';

/**
 * This error component is used to display a user-friendly (and somewhat styled)
 * message when an error occurs (hopefully not too often!)
 *
 * @param props - Configuration parameters for error styling
 * @param props.title - Main error headline text
 * @param props.message - Explanatory details about the error
 * @param props.onRetry - Recovery function triggered by retry action
 * @returns A user-friendly error notification with recovery option (or attempt to!)
 */
export function ErrorFallback({ title, message, onRetry }: ErrorFallbackProps): JSX.Element {
  return (
    <div className='flex flex-col items-center justify-center p-8 bg-gray-900 rounded-lg border border-gray-800 text-center'>
      <div className='w-12 h-12 text-red-500 mb-4'>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
          />
        </svg>
      </div>
      <h3 className='text-xl font-semibold text-gray-100 mb-2'>{title}</h3>
      <p className='text-gray-400 mb-6 max-w-md'>{message}</p>
      <button
        onClick={onRetry}
        className='px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium transition-colors flex items-center gap-2'
        aria-label='Try again'
      >
        <svg
          xmlns='http://www.w3.org/2000/svg'
          className='h-4 w-4'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
          />
        </svg>
        <span>Try Again</span>
      </button>
    </div>
  );
}
