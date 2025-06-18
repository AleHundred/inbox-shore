import { ApiError } from '@/lib/api/utils/apiUtils';
import { AppError, ErrorCategory } from '@/lib/utils/AppError';
import { logDebug, logWarning } from '@/lib/utils/errorLogger';

/**
 * Configuration for retry behavior
 * This interface defines all the knobs you can turn to customize retry behavior
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitter: boolean;
  retryableErrorTypes: ErrorType[];
  retryableStatusCodes: number[];
  customErrorChecker?: (error: unknown) => boolean;
  onRetry?: (attempt: number, error: unknown, delay: number) => void;
}

/**
 * Error types that can be configured for retry behavior
 */
export enum ErrorType {
  NETWORK = 'network',
  SERVER = 'server',
  TIMEOUT = 'timeout',
  RATE_LIMIT = 'rate_limit',
  AUTHENTICATION = 'authentication',
  VALIDATION = 'validation',
  NOT_FOUND = 'not_found',
  UNKNOWN = 'unknown',
}

/**
 * Default retry configuration that works well for most applications
 * These defaults are based on industry best practices and user experience research
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  jitter: true,
  retryableErrorTypes: [
    ErrorType.NETWORK,
    ErrorType.SERVER,
    ErrorType.TIMEOUT,
    ErrorType.RATE_LIMIT,
  ],
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

/**
 * Result of error analysis with precise optional property handling
 */
export interface ErrorAnalysis {
  errorType: ErrorType;
  isRetryable: boolean;
  statusCode: number | undefined;
}

/**
 * Analyzes an error to determine its type and whether it should be retried
 * This is the brain of our retry system - it understands different error patterns
 */
export function analyzeError(error: unknown): ErrorAnalysis {
  let errorType = ErrorType.UNKNOWN;
  let statusCode: number | undefined = undefined;

  if (error instanceof ApiError) {
    statusCode = error.status;

    if (statusCode === 401 || statusCode === 403) {
      errorType = ErrorType.AUTHENTICATION;
    } else if (statusCode === 404) {
      errorType = ErrorType.NOT_FOUND;
    } else if (statusCode === 408) {
      errorType = ErrorType.TIMEOUT;
    } else if (statusCode === 429) {
      errorType = ErrorType.RATE_LIMIT;
    } else if (statusCode >= 400 && statusCode < 500) {
      errorType = ErrorType.VALIDATION;
    } else if (statusCode >= 500) {
      errorType = ErrorType.SERVER;
    }
  } else if (error instanceof AppError) {
    switch (error.category) {
      case ErrorCategory.NETWORK:
        errorType = ErrorType.NETWORK;
        break;
      case ErrorCategory.SERVER:
        errorType = ErrorType.SERVER;
        break;
      case ErrorCategory.AUTH:
        errorType = ErrorType.AUTHENTICATION;
        break;
      case ErrorCategory.VALIDATION:
        errorType = ErrorType.VALIDATION;
        break;
      case ErrorCategory.NOT_FOUND:
        errorType = ErrorType.NOT_FOUND;
        break;
      default:
        errorType = ErrorType.UNKNOWN;
    }
  } else if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('connection')
    ) {
      errorType = ErrorType.NETWORK;
    } else if (message.includes('timeout') || message.includes('timed out')) {
      errorType = ErrorType.TIMEOUT;
    } else if (message.includes('server')) {
      errorType = ErrorType.SERVER;
    }
  }

  const isRetryable =
    DEFAULT_RETRY_CONFIG.retryableErrorTypes.includes(errorType) ||
    (statusCode !== undefined && DEFAULT_RETRY_CONFIG.retryableStatusCodes.includes(statusCode));

  return { errorType, isRetryable, statusCode };
}

/**
 * Helper function to safely merge partial config with defaults
 * This function handles the exact optional property types correctly by filtering undefined values
 */
function mergeRetryConfig(partialConfig: Partial<RetryConfig> = {}): RetryConfig {
  const result: RetryConfig = { ...DEFAULT_RETRY_CONFIG };

  Object.entries(partialConfig).forEach(([key, value]) => {
    if (value !== undefined) {
      (result as unknown as Record<string, unknown>)[key] = value;
    }
  });

  return result;
}

/**
 * Creates a type-safe partial config by filtering out undefined values
 * This ensures compatibility with exactOptionalPropertyTypes
 */
export function createSafePartialConfig(options: {
  maxRetries?: number | undefined;
  initialDelay?: number | undefined;
  maxDelay?: number | undefined;
  backoffFactor?: number | undefined;
  onRetry?: ((attempt: number, error: unknown, delay: number) => void) | undefined;
  customErrorChecker?: ((error: unknown) => boolean) | undefined;
}): Partial<RetryConfig> {
  const config: Partial<RetryConfig> = {};

  if (options.maxRetries !== undefined) {
    config.maxRetries = options.maxRetries;
  }
  if (options.initialDelay !== undefined) {
    config.initialDelay = options.initialDelay;
  }
  if (options.maxDelay !== undefined) {
    config.maxDelay = options.maxDelay;
  }
  if (options.backoffFactor !== undefined) {
    config.backoffFactor = options.backoffFactor;
  }
  if (options.onRetry !== undefined) {
    config.onRetry = options.onRetry;
  }
  if (options.customErrorChecker !== undefined) {
    config.customErrorChecker = options.customErrorChecker;
  }

  return config;
}

/**
 * Calculates the delay before the next retry attempt
 * Uses exponential backoff with optional jitter to prevent thundering herd problems
 */
export function calculateRetryDelay(attempt: number, config: Partial<RetryConfig> = {}): number {
  const finalConfig = mergeRetryConfig(config);

  let delay = finalConfig.initialDelay * Math.pow(finalConfig.backoffFactor, attempt);
  delay = Math.min(delay, finalConfig.maxDelay);

  if (finalConfig.jitter) {
    const jitterRange = delay * 0.25;
    const jitterOffset = (Math.random() - 0.5) * 2 * jitterRange;
    delay += jitterOffset;
  }

  return Math.max(delay, 0);
}

/**
 * Determines whether an error should be retried based on configuration
 * This is the decision function that both React Query and general retry logic can use
 */
export function shouldRetryError(
  error: unknown,
  attempt: number,
  config: Partial<RetryConfig> = {}
): boolean {
  const finalConfig = mergeRetryConfig(config);

  if (attempt >= finalConfig.maxRetries) {
    logDebug('RetrySystem', 'Max retries exceeded', {
      attempt,
      maxRetries: finalConfig.maxRetries,
    });
    return false;
  }

  const analysis = analyzeError(error);

  logDebug('RetrySystem', 'Error analysis for retry decision', {
    attempt,
    errorType: analysis.errorType,
    isRetryable: analysis.isRetryable,
    statusCode: analysis.statusCode,
  });

  if (finalConfig.customErrorChecker) {
    const customResult = finalConfig.customErrorChecker(error);
    logDebug('RetrySystem', 'Custom error checker result', { customResult });
    return customResult;
  }

  return analysis.isRetryable;
}

/**
 * React Query compatible retry function
 * This adapts our unified retry logic to work with React Query's expectations
 */
export function createReactQueryRetryFn(config: Partial<RetryConfig> = {}) {
  return (failureCount: number, error: unknown): boolean => {
    return shouldRetryError(error, failureCount, config);
  };
}

/**
 * Creates a retry wrapper function with exponential backoff
 * This is for general-purpose function wrapping (not React Query specific)
 */
export function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): () => Promise<T> {
  const finalConfig = mergeRetryConfig(config);

  return async (): Promise<T> => {
    let lastError: unknown;

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        logDebug('RetrySystem', 'Attempting operation', { attempt });
        return await fn();
      } catch (error) {
        lastError = error;

        logWarning('RetrySystem', 'Operation failed', {
          attempt,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        if (!shouldRetryError(error, attempt, config)) {
          logDebug('RetrySystem', 'Error not retryable, throwing', { attempt });
          throw error;
        }

        if (attempt < finalConfig.maxRetries) {
          const delay = calculateRetryDelay(attempt, config);

          logDebug('RetrySystem', 'Scheduling retry', {
            attempt: attempt + 1,
            delay,
            maxRetries: finalConfig.maxRetries,
          });

          if (finalConfig.onRetry) {
            finalConfig.onRetry(attempt + 1, error, delay);
          }

          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  };
}

/**
 * Convenience function to retry an async operation with default configuration
 * This makes it easy to add retry behavior to any Promise-returning function
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  config?: Partial<RetryConfig>
): Promise<T> {
  const wrappedOperation = withRetry(operation, config);
  return wrappedOperation();
}

/**
 * Creates retry configuration optimized for different scenarios
 * These presets embody best practices for common use cases
 */
export const RetryPresets = {
  FAST_OPERATIONS: {
    maxRetries: 2,
    initialDelay: 500,
    maxDelay: 5000,
    backoffFactor: 2,
    jitter: true,
  } as Partial<RetryConfig>,

  BACKGROUND_OPERATIONS: {
    maxRetries: 5,
    initialDelay: 2000,
    maxDelay: 60000,
    backoffFactor: 2,
    jitter: true,
  } as Partial<RetryConfig>,

  CRITICAL_OPERATIONS: {
    maxRetries: 7,
    initialDelay: 1000,
    maxDelay: 120000,
    backoffFactor: 1.5,
    jitter: true,
  } as Partial<RetryConfig>,

  REALTIME_OPERATIONS: {
    maxRetries: 1,
    initialDelay: 100,
    maxDelay: 1000,
    backoffFactor: 1,
    jitter: false,
  } as Partial<RetryConfig>,
};
