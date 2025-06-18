import { ErrorHandler } from '@/lib/errors/errorHandler';
import type { AppError } from '@/lib/utils/AppError';
import { withRetry } from '@/lib/utils/retrySystem';

/**
 * Pattern for API calls with automatic retry and error handling
 */
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  context: string,
  options?: {
    retries?: number;
    showToast?: boolean;
  }
): Promise<{ data: T | null; error: AppError | null }> {
  try {
    const retryableCall = withRetry(apiCall, {
      maxRetries: options?.retries ?? 3,
    });

    const data = await retryableCall();
    return { data, error: null };
  } catch (error) {
    const appError = ErrorHandler.handle(error, {
      context,
      showToast: options?.showToast ?? true,
      rethrow: false,
    });

    return { data: null, error: appError };
  }
}

/**
 * Pattern for React Query error handling
 */
export function createQueryErrorHandler(queryName: string) {
  return (error: unknown) => {
    ErrorHandler.handle(error, {
      context: `Query-${queryName}`,
      showToast: true,
      rethrow: false,
    });
  };
}

/**
 * Pattern for mutation error handling with optimistic updates
 */
export function createMutationErrorHandler(mutationName: string, rollback?: () => void) {
  return (error: unknown) => {
    if (rollback) {
      rollback();
    }

    ErrorHandler.handle(error, {
      context: `Mutation-${mutationName}`,
      showToast: true,
      rethrow: false,
    });
  };
}

/**
 * Pattern for form submission with error handling
 */
export async function safeFormSubmit<T>(
  submitFn: () => Promise<T>,
  options: {
    context: string;
    onSuccess?: (data: T) => void;
    onError?: (error: AppError) => void;
    showToast?: boolean;
  }
): Promise<{ success: boolean; data?: T; error?: AppError }> {
  try {
    const data = await submitFn();
    if (options.onSuccess) {
      options.onSuccess(data);
    }
    return { success: true, data };
  } catch (error) {
    const appError = ErrorHandler.handle(error, {
      context: `Form-${options.context}`,
      showToast: options.showToast ?? true,
      rethrow: false,
    });

    if (options.onError) {
      options.onError(appError);
    }

    return { success: false, error: appError };
  }
}

/**
 * Pattern for batch operations with partial failure handling
 */
export async function safeBatchOperation<T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  context: string
): Promise<{
  successful: Array<{ item: T; result: R }>;
  failed: Array<{ item: T; error: AppError }>;
}> {
  const successful: Array<{ item: T; result: R }> = [];
  const failed: Array<{ item: T; error: AppError }> = [];

  await Promise.all(
    items.map(async (item) => {
      try {
        const result = await operation(item);
        successful.push({ item, result });
      } catch (error) {
        const appError = ErrorHandler.handle(error, {
          context: `BatchOperation-${context}`,
          showToast: false,
          rethrow: false,
          metadata: { item },
        });
        failed.push({ item, error: appError });
      }
    })
  );

  if (failed.length > 0) {
    ErrorHandler.handle(new Error(`${failed.length} of ${items.length} operations failed`), {
      context: `BatchSummary-${context}`,
      showToast: true,
      rethrow: false,
      metadata: { totalItems: items.length, failedCount: failed.length },
    });
  }

  return { successful, failed };
}
