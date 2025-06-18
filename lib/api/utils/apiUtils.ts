import { toast } from 'sonner';

import { ApiErrorCode } from '@/lib/types/error';
import type { ErrorDetails, ApiErrorDetails } from '@/lib/types/error';
import { createReactQueryRetryFn } from '@/lib/utils/retrySystem';

export type ApiResponseData = unknown;

/**
 * Custom error class for API-related errors with additional context.
 * Includes HTTP status codes, status text, and original response data.
 */
export class ApiError extends Error {
  status: number;
  statusText: string;
  data: ApiResponseData;
  private _code: ApiErrorCode | string = ApiErrorCode.UnknownError;
  private _userMessage: string = '';
  details?: ErrorDetails;

  /**
   * Creates a new ApiError instance.
   */
  constructor(
    status: number,
    statusText: string,
    message: string,
    data?: ApiResponseData,
    errorDetails?: ApiErrorDetails
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this._code = errorDetails?.code ?? ApiErrorCode.UnknownError;
    this._userMessage = errorDetails?.userMessage || '';
    this.data = data ?? null;
  }

  /**
   * Gets the error code
   */
  get code(): ApiErrorCode | string {
    return this._code;
  }

  /**
   * Sets the error code
   */
  set code(value: ApiErrorCode | string) {
    this._code = value ?? ApiErrorCode.UnknownError;
  }

  get userMessage(): string {
    if (this._userMessage) {
      return this._userMessage;
    }

    if (this.status === 401 || this.status === 403) {
      return 'Your session has expired. Please log in again.';
    } else if (this.status === 404) {
      return 'The requested resource was not found.';
    } else if (this.status >= 500) {
      return 'Our server is experiencing issues. Please try again later.';
    } else {
      return this.message || 'An error occurred while processing your request.';
    }
  }
}

/**
 * @deprecated Use ErrorHandler.handle() from lib/errors/errorHandler instead
 * This function will be removed in the next major version
 */
export function handleApiError(
  error: unknown,
  showToast = true,
  toastService?: { showError: (message: string) => void }
): { message: string; status?: number | undefined } {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      'Deprecated: handleApiError is deprecated. Use ErrorHandler.handle() instead. ' +
        'See error-handling.md for migration instructions.'
    );
  }

  let message = 'An unexpected error occurred.';
  let status: number | undefined = undefined;

  if (error instanceof ApiError) {
    message = error.userMessage;
    status = error.status;
  } else if (error instanceof Error) {
    const statusMatch = error.message.match(/API error: (\d+)/);
    if (statusMatch) {
      if (statusMatch[1] === undefined) {
        return { message, status };
      }
      status = parseInt(statusMatch[1], 10);

      if (status === 401 || status === 403) {
        message = 'Your session has expired. Please log in again.';
      } else if (status === 404) {
        message = 'The requested resource was not found.';
      } else if (status >= 500) {
        message = 'Our server is experiencing issues. Please try again later.';
      } else {
        message = error.message;
      }
    } else {
      message = error.message;
    }
  }

  if (showToast) {
    if (toastService) {
      toastService.showError(message);
    } else {
      toast.error(message);
    }
  }

  return { message, status };
}

/**
 * @deprecated Use createReactQueryRetryFn from retrySystem instead
 * This function is maintained for backward compatibility
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  const retryFn = createReactQueryRetryFn();
  return retryFn(failureCount, error);
}

/**
 * Creates a safe Date object from various date formats
 *
 * @param date - A date in various formats
 * @returns A properly formatted Date object or the current date if invalid
 */
export function safeDate(date: unknown): Date {
  if (!date) return new Date();

  try {
    if (typeof date === 'string') {
      return new Date(date);
    }

    if (typeof date === 'object' && date !== null && 'iso8601' in date) {
      return new Date((date as { iso8601: string }).iso8601);
    }

    return new Date();
  } catch (error) {
    console.error('Error parsing date:', error, date);
    return new Date();
  }
}
