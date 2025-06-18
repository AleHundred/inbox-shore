import { ErrorHandler } from '@/lib/errors/errorHandler';

import { Errors } from '../errors';

import { AppError } from './AppError';

type ApiResponse<T> = {
  data: T | null;
  error: AppError | null;
};

export async function handleApiResponse<T>(
  promise: Promise<Response>,
  context: string
): Promise<ApiResponse<T>> {
  try {
    const response = await promise;
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let error: unknown;
      switch (response.status) {
        case 401:
          error = Errors.Unauthorized('Authentication required', { context, ...errorData });
          break;
        case 403:
          error = Errors.Unauthorized('Insufficient permissions', { context, ...errorData });
          break;
        case 404:
          error = Errors.NotFound('Resource', { context, ...errorData });
          break;
        case 422:
          error = Errors.Validation('Invalid data provided', { context, ...errorData });
          break;
        case 500:
          error = Errors.Server('Internal server error', { context, ...errorData });
          break;
        default:
          error = new AppError(errorData.message || `HTTP error! status: ${response.status}`, {
            statusCode: response.status,
            metadata: { context, ...errorData },
          });
      }
      return {
        data: null,
        error: ErrorHandler.handle(error, {
          context: `handleApiResponse:${context}`,
          showToast: false,
        }),
      };
    }
    const data = (await response.json().catch(() => ({}))) as T;
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: ErrorHandler.handle(error, {
        context: `handleApiResponse:${context}`,
        showToast: false,
      }),
    };
  }
}
