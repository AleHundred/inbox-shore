import { toast } from 'sonner';

import { AppError, ErrorCategory } from '@/lib/utils/AppError';
import type { ErrorSeverity } from '@/lib/utils/AppError';
import { logError } from '@/lib/utils/errorLogger';
import { analyzeError, ErrorType } from '@/lib/utils/retrySystem';

/**
 * Configuration for error handling behavior
 */
export interface ErrorHandlerConfig {
  context: string;
  showToast?: boolean;
  toastFn?: (message: string) => void;
  metadata?: Record<string, unknown>;
  rethrow?: boolean;
  severity?: ErrorSeverity;
  fallbackMessage?: string;
  onError?: (error: AppError) => void;
}

/**
 * Error transformation pipeline that converts any error to AppError
 */
export function transformError(error: unknown, config?: Partial<ErrorHandlerConfig>): AppError {
  if (error instanceof AppError) {
    return error;
  }

  const analysis = analyzeError(error);
  const errorCategory = mapErrorTypeToCategory(analysis.errorType);

  const options: Parameters<typeof AppError.from>[1] = {
    category: errorCategory,
    isRetryable: analysis.isRetryable,
    metadata: {
      ...config?.metadata,
      errorType: analysis.errorType,
    },
  };

  if (analysis.statusCode !== undefined) {
    options.statusCode = analysis.statusCode;
  }

  if (config?.severity) {
    options.severity = config.severity;
  }

  if (config?.fallbackMessage) {
    options.userMessage = config.fallbackMessage;
  }

  return AppError.from(error, options);
}

/**
 * Maps retry system error types to AppError categories
 */
function mapErrorTypeToCategory(errorType: ErrorType): ErrorCategory {
  switch (errorType) {
    case ErrorType.NETWORK:
      return ErrorCategory.NETWORK;
    case ErrorType.AUTHENTICATION:
      return ErrorCategory.AUTH;
    case ErrorType.VALIDATION:
      return ErrorCategory.VALIDATION;
    case ErrorType.NOT_FOUND:
      return ErrorCategory.NOT_FOUND;
    case ErrorType.SERVER:
    case ErrorType.TIMEOUT:
    case ErrorType.RATE_LIMIT:
      return ErrorCategory.SERVER;
    default:
      return ErrorCategory.UNKNOWN;
  }
}

/**
 * Central error handler that processes all errors consistently
 */
export class ErrorHandler {
  private static defaultToastFn = (message: string) => toast.error(message);

  /**
   * Main error handling method
   */
  static handle(error: unknown, config: ErrorHandlerConfig): AppError {
    const appError = transformError(error, config);

    logError(config.context, appError, {
      ...config.metadata,
      ...appError.metadata,
    });

    if (config.showToast !== false) {
      const toastFn = config.toastFn || this.defaultToastFn;
      toastFn(appError.userMessage);
    }

    if (config.onError) {
      config.onError(appError);
    }

    if (config.rethrow) {
      throw appError;
    }

    return appError;
  }

  /**
   * Creates a context-bound error handler
   */
  static createContextHandler(defaultContext: string, defaultConfig?: Partial<ErrorHandlerConfig>) {
    return (error: unknown, config?: Partial<ErrorHandlerConfig>) => {
      return this.handle(error, {
        context: defaultContext,
        ...defaultConfig,
        ...config,
      });
    };
  }
}
