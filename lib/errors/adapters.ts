import { ApiError } from '@/lib/api/utils/apiUtils';
import { ErrorHandler, type ErrorHandlerConfig } from '@/lib/errors/errorHandler';
import type { AppError } from '@/lib/utils/AppError';

/**
 * API layer error adapter
 */
export function handleApiError(
  error: unknown,
  context: string,
  options?: Partial<ErrorHandlerConfig>
): AppError {
  const config: ErrorHandlerConfig = {
    context: `API-${context}`,
    showToast: true,
    ...options,
  };

  if (error instanceof ApiError) {
    return ErrorHandler.handle(error, {
      ...config,
      metadata: {
        ...config.metadata,
        status: error.status,
        statusText: error.statusText,
        errorCode: error.code,
      },
    });
  }

  return ErrorHandler.handle(error, config);
}

/**
 * React component error adapter
 */
export function handleComponentError(
  error: unknown,
  componentName: string,
  options?: Partial<ErrorHandlerConfig>
): AppError {
  return ErrorHandler.handle(error, {
    context: `Component-${componentName}`,
    showToast: true,
    ...options,
  });
}

/**
 * Business logic error adapter
 */
export function handleBusinessError(
  error: unknown,
  operation: string,
  options?: Partial<ErrorHandlerConfig>
): AppError {
  return ErrorHandler.handle(error, {
    context: `Business-${operation}`,
    showToast: false,
    ...options,
  });
}
