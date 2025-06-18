import { ErrorHandler } from '@/lib/errors/errorHandler';
import { ErrorCategory } from '@/lib/utils/AppError';
import { ErrorType } from '@/lib/utils/retrySystem';

/**
 * Maps error type to HTTP status code
 */
function getStatusCodeForErrorType(errorType: ErrorType): number {
  switch (errorType) {
    case ErrorType.AUTHENTICATION:
      return 401;
    case ErrorType.VALIDATION:
      return 400;
    case ErrorType.NOT_FOUND:
      return 404;
    case ErrorType.SERVER:
      return 500;
    case ErrorType.NETWORK:
      return 503;
    case ErrorType.TIMEOUT:
      return 408;
    case ErrorType.RATE_LIMIT:
      return 429;
    default:
      return 500;
  }
}

/**
 * Creates a standardized error response
 */
function createErrorResponse(
  message: string,
  statusCode: number,
  errorType: ErrorType,
  metadata?: Record<string, unknown>
): Response {
  const errorResponse = {
    success: false,
    error: {
      message,
      type: errorType,
      code: statusCode,
      ...(metadata && { metadata }),
    },
  };

  return new Response(JSON.stringify(errorResponse), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Enhanced error handler that uses the unified system while maintaining Response format
 */
export function handleApiErrorV2(
  error: unknown,
  operation: string,
  explicitType?: ErrorType // Changed parameter name to avoid confusion
): Response {
  const appError = ErrorHandler.handle(error, {
    context: `API-${operation}`,
    showToast: false,
    rethrow: false,
    metadata: { errorType: explicitType },
  });

  // Map AppError category back to API ErrorType
  const finalType =
    explicitType ||
    (appError.category === ErrorCategory.AUTH
      ? ErrorType.AUTHENTICATION
      : appError.category === ErrorCategory.VALIDATION
        ? ErrorType.VALIDATION
        : appError.category === ErrorCategory.NOT_FOUND
          ? ErrorType.NOT_FOUND
          : appError.category === ErrorCategory.SERVER
            ? ErrorType.SERVER
            : ErrorType.UNKNOWN);

  return createErrorResponse(
    appError.userMessage,
    appError.statusCode || getStatusCodeForErrorType(finalType),
    finalType,
    process.env.NODE_ENV === 'development' ? appError.metadata : undefined
  );
}
