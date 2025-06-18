import { handleApiError as newHandleApiError } from '@/lib/errors/adapters';

/**
 * Compatibility wrapper that maintains the old API while using new internals
 */
export function migrateHandleApiError(
  error: unknown,
  showToast = true,
  toastFunction?: (message: string) => void
): { message: string; status?: number } {
  const config: Parameters<typeof newHandleApiError>[2] = {
    showToast,
  };

  if (toastFunction) {
    config.toastFn = toastFunction;
  }

  const appError = newHandleApiError(error, 'LegacyMigration', config);

  return {
    message: appError.userMessage,
    status: appError.statusCode,
  };
}
