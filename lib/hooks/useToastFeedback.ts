import { useCallback } from 'react';
import { toast, type ExternalToast } from 'sonner';

import type { ToastOptions } from '@/lib/types';

/**
 * Hook providing methods to display and manage toast notifications
 * Provides a consistent and type-safe way to show toast messages across the application
 *
 * @returns Collection of toast utility functions for various notification types
 */
export function useToastFeedback() {
  /**
   * Creates a toast with consistent default options
   * @param type - The type of toast to display
   * @param message - The message to display
   * @param options - Optional configuration for the toast
   * @returns Unique toast ID
   */
  const createToast = useCallback(
    (
      type: 'success' | 'error' | 'info' | 'loading',
      message: string,
      options?: ToastOptions & ExternalToast
    ) => {
      const defaultOptions: ExternalToast = {
        duration: type === 'error' ? 5000 : 4000,
        position: 'top-right',
        className: `${type}-toast`,
      };

      return (toast[type] as (message: string, options?: ExternalToast) => string)(message, {
        ...defaultOptions,
        ...options,
      });
    },
    []
  );

  /**
   * Displays a success toast notification
   * @param message - The message to display
   * @param options - Optional configuration
   * @returns Toast ID
   */
  const showSuccess = useCallback(
    (message: string, options?: ToastOptions & ExternalToast) => {
      return createToast('success', message, options);
    },
    [createToast]
  );

  /**
   * Displays an error toast notification
   * @param message - The error message to display
   * @param options - Optional configuration
   * @returns Toast ID
   */
  const showError = useCallback(
    (message: string, options?: ToastOptions & ExternalToast) => {
      return createToast('error', message, options);
    },
    [createToast]
  );

  /**
   * Displays an info toast notification
   * @param message - The info message to display
   * @param options - Optional configuration
   * @returns Toast ID
   */
  const showInfo = useCallback(
    (message: string, options?: ToastOptions & ExternalToast) => {
      return createToast('info', message, options);
    },
    [createToast]
  );

  /**
   * Displays a loading toast notification
   * @param message - The loading message to display
   * @param options - Optional configuration
   * @returns Toast ID
   */
  const showLoading = useCallback(
    (message: string, options?: ToastOptions & ExternalToast) => {
      const id = options?.id || String(Date.now());
      return createToast('loading', message, {
        duration: Infinity,
        id,
        ...options,
      });
    },
    [createToast]
  );

  /**
   * Updates an existing toast with new content and type
   * @param id - ID of the toast to update
   * @param type - New toast type
   * @param message - New message to display
   * @param options - Optional configuration
   */
  const updateToast = useCallback(
    (
      id: string,
      type: 'success' | 'error' | 'info' | 'loading',
      message: string,
      options?: ToastOptions & ExternalToast
    ) => {
      toast.dismiss(id);

      return createToast(type as 'success' | 'error' | 'info' | 'loading', message, {
        ...options,
        id,
      });
    },
    [createToast]
  );

  /**
   * Dismisses a specific toast notification
   * @param id - ID of the toast to dismiss
   */
  const dismissToast = useCallback((id: string | number): void => {
    toast.dismiss(id);
  }, []);

  /**
   * Displays toast notifications for async operations
   * @template T - Type of the promised value
   * @param promise - The promise to track
   * @param options - Toast configuration options
   * @returns The original promise
   */
  const promiseToast = useCallback(
    <T>(
      promise: Promise<T>,
      {
        loading = 'Loading...',
        success = 'Success!',
        error = 'Something went wrong',
        id,
        duration,
        position = 'top-right',
      }: {
        loading?: string;
        success?: string | ((data: T) => string);
        error?: string | ((error: unknown) => string);
        id?: string | number;
        duration?: number;
        position?: ExternalToast['position'];
      } = {}
    ): Promise<T> => {
      toast.promise(promise, {
        loading,
        success,
        error,
        position,
        ...(id !== undefined && { id }),
        ...(duration !== undefined && { duration }),
      });
      return promise;
    },
    []
  );

  /**
   * Shows authentication-specific error toast
   * @param message - Error message
   * @param options - Optional configuration
   * @returns Toast ID
   */
  const showAuthError = useCallback(
    (message: string, options?: ToastOptions & ExternalToast) => {
      return createToast('error', message, {
        icon: '🔐',
        className: 'auth-error-toast',
        position: 'top-center',
        ...options,
      });
    },
    [createToast]
  );

  return {
    showSuccess,
    showError,
    showInfo,
    showLoading,
    updateToast,
    dismissToast,
    promiseToast,
    showAuthError,
  };
}
