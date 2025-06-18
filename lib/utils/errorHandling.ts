import { toast } from 'sonner';

import { ApiError } from '@/lib/api/utils/apiUtils';
import { withRetry as newWithRetry, createSafePartialConfig } from '@/lib/utils/retrySystem';

import { AppError, ErrorCategory } from './AppError';
import type { ErrorSeverity } from './AppError';
import { logError, logWarning } from './errorLogger';

export interface ErrorHandlingOptions {
  context: string;
  showToast?: boolean;
  toastFn?: (message: string) => void;
  defaultUserMessage?: string;
  metadata?: Record<string, unknown>;
  rethrow?: boolean;
  severity?: ErrorSeverity;
}

/**
 * @deprecated Use ErrorHandler.handle() from lib/errors/errorHandler instead
 * This function will be removed in the next major version
 */
export function handleError(error: unknown, options: ErrorHandlingOptions): AppError {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      'Deprecated: handleError is deprecated. Use ErrorHandler.handle() instead. ' +
        'See error-handling.md for migration instructions.'
    );
  }

  const appError = AppError.from(error, {
    severity: options.severity || undefined,
    metadata: options.metadata || undefined,
    userMessage: options.defaultUserMessage || undefined,
  });

  logError(options.context, appError, {
    ...options.metadata,
    ...appError.metadata,
  });

  if (options.showToast !== false) {
    const toastFunction = options.toastFn || ((msg: string) => toast.error(msg));
    toastFunction(appError.userMessage);
  }

  if (options.rethrow) {
    throw appError;
  }

  return appError;
}

export function createErrorHandler(defaultContext: string) {
  return (error: unknown, options?: Partial<Omit<ErrorHandlingOptions, 'context'>>): AppError => {
    return handleError(error, {
      context: defaultContext,
      ...options,
    });
  };
}

/**
 * @deprecated Use withRetry from retrySystem instead
 * This function is maintained for backward compatibility
 */
export function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    retryableErrors?: (error: unknown) => boolean;
    onRetry?: (attempt: number, error: unknown, delay: number) => void;
  } = {}
): () => Promise<T> {
  const config = createSafePartialConfig({
    maxRetries: options.maxRetries,
    initialDelay: options.initialDelay,
    maxDelay: options.maxDelay,
    backoffFactor: options.backoffFactor,
    onRetry: options.onRetry,
    customErrorChecker: options.retryableErrors,
  });

  return newWithRetry(fn, config);
}

/**
 * @deprecated Use ErrorHandler.handle() from lib/errors/errorHandler instead
 * This function will be removed in the next major version
 */
export function getUserFriendlyErrorMessage(
  error: unknown,
  fallbackContext = 'the operation'
): string {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      'Deprecated: getUserFriendlyErrorMessage is deprecated. Use ErrorHandler.handle() instead. ' +
        'See error-handling.md for migration instructions.'
    );
  }

  if (error instanceof AppError) {
    return error.userMessage;
  }

  if (error instanceof ApiError) {
    return error.userMessage || `An error occurred during ${fallbackContext}`;
  }

  if (error instanceof Error) {
    const message = error.message;

    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('connection')
    ) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }

    if (message.includes('timeout') || message.includes('timed out')) {
      return 'The request took too long to complete. Please try again later.';
    }

    if (message.includes('not found') || message.includes('404')) {
      return 'The requested resource could not be found. It may have been moved or deleted.';
    }

    if (
      message.includes('permission') ||
      message.includes('forbidden') ||
      message.includes('403')
    ) {
      return 'You do not have permission to access this resource.';
    }

    if (
      message.includes('authentication') ||
      message.includes('login') ||
      message.includes('401')
    ) {
      return 'Your session has expired. Please log in again to continue.';
    }

    if (message.includes('validation') || message.includes('invalid') || message.includes('400')) {
      return 'The information provided is invalid. Please check your input and try again.';
    }

    if (message.includes('server') || message.includes('500')) {
      return 'We encountered an error on our servers. Our team has been notified and is working on a fix.';
    }

    return `An error occurred while ${fallbackContext}: ${message}`;
  }

  return `An unexpected error occurred while ${fallbackContext}. Please try again later.`;
}

/**
 * @deprecated Use ErrorHandler.handle() from lib/errors/errorHandler instead
 * This function will be removed in the next major version
 */
export function handleApiError(
  error: unknown,
  showToast = true,
  toastFunction?: (message: string) => void
): { message: string; status?: number } {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      'Deprecated: handleApiError is deprecated. Use ErrorHandler.handle() instead. ' +
        'See error-handling.md for migration instructions.'
    );
  }

  logError('ClientApiError', error instanceof Error ? error : new Error(String(error)));

  let errorMessage = 'An unexpected error occurred';
  let statusCode: number | undefined = undefined;

  if (error instanceof ApiError) {
    errorMessage = error.userMessage;
    statusCode = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  if (showToast && toastFunction) {
    toastFunction(errorMessage);
  }

  const result: { message: string; status?: number } = { message: errorMessage };
  if (statusCode !== undefined) {
    result.status = statusCode;
  }

  return result;
}

/**
 * @deprecated Use ErrorHandler.handle() from lib/errors/errorHandler instead
 * This function will be removed in the next major version
 */
export async function tryCatch<T>(
  fn: () => Promise<T> | T,
  options: ErrorHandlingOptions
): Promise<T | undefined> {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      'Deprecated: tryCatch is deprecated. Use ErrorHandler.handle() instead. ' +
        'See error-handling.md for migration instructions.'
    );
  }

  try {
    return await fn();
  } catch (error) {
    handleError(error, options);
    return undefined;
  }
}

export function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: Omit<ErrorHandlingOptions, 'metadata'>
): (...args: Parameters<T>) => Promise<ReturnType<T> | undefined> {
  return async (...args: Parameters<T>): Promise<ReturnType<T> | undefined> => {
    try {
      return (await fn(...args)) as ReturnType<T>;
    } catch (error) {
      handleError(error, {
        ...options,
        metadata: { args },
      });
      return undefined;
    }
  };
}

export function assert(
  condition: boolean,
  message: string,
  category: ErrorCategory = ErrorCategory.VALIDATION
): asserts condition {
  if (!condition) {
    throw new AppError(message, { category });
  }
}

export function warnIf(
  condition: boolean,
  context: string,
  message: string,
  metadata?: Record<string, unknown>
): void {
  if (!condition) {
    logWarning(context, message, metadata);
  }
}
