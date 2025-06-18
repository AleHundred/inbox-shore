import { AppError, ErrorCategory, ErrorSeverity } from '@/lib/utils/AppError';

export * from '@/lib/utils/AppError';
export * from './errorHandler';
export * from './adapters';
export * from './patterns';

export const Errors = {
  Unauthorized: (message = 'Unauthorized access', meta?: Record<string, unknown>) =>
    new AppError(message, {
      category: ErrorCategory.AUTH,
      statusCode: 401,
      userMessage: 'Please log in to continue',
      metadata: meta,
    }),

  /**
   * Bad request errors for invalid input
   */
  BadRequest: (message = 'Bad request', meta?: Record<string, unknown>) =>
    new AppError(message, {
      category: ErrorCategory.VALIDATION,
      statusCode: 400,
      userMessage: 'Invalid request. Please check your input.',
      metadata: meta,
    }),

  Validation: (message: string, meta?: Record<string, unknown>) =>
    new AppError(message, {
      category: ErrorCategory.VALIDATION,
      statusCode: 400,
      userMessage: 'Validation failed. Please check your input.',
      metadata: meta,
    }),

  NotFound: (resource: string, meta?: Record<string, unknown>) =>
    new AppError(`${resource} not found`, {
      category: ErrorCategory.NOT_FOUND,
      statusCode: 404,
      userMessage: `The requested ${resource.toLowerCase()} could not be found`,
      metadata: meta,
    }),

  Server: (message = 'Internal server error', meta?: Record<string, unknown>) =>
    new AppError(message, {
      category: ErrorCategory.SERVER,
      statusCode: 500,
      userMessage: 'An unexpected error occurred. Please try again later.',
      severity: ErrorSeverity.HIGH,
      metadata: meta,
    }),

  Network: (message = 'Network error', meta?: Record<string, unknown>) =>
    new AppError(message, {
      category: ErrorCategory.NETWORK,
      statusCode: 503,
      userMessage: 'Unable to connect to the server. Please check your connection.',
      isRetryable: true,
      metadata: meta,
    }),

  Business: (message: string, meta?: Record<string, unknown>) =>
    new AppError(message, {
      category: ErrorCategory.BUSINESS,
      statusCode: 409,
      userMessage: message,
      metadata: meta,
    }),
};

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isApiError(error: unknown): error is { status: number; data: unknown } {
  interface ErrorWithStatus {
    status: unknown;
    [key: string]: unknown;
  }

  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as ErrorWithStatus).status === 'number'
  );
}
