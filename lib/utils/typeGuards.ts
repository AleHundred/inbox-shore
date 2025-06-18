/**
 * Type guard utilities for safe property access
 */
import type { DateTimeParts, PageInfo, RequestSummary, Request } from '@/lib/types/api';

type CustomerObject = {
  id: string;
  fullName: string;
};

type RequestSummaryObject = {
  customer: CustomerObject;
};

function isCustomerObject(obj: unknown): obj is CustomerObject {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'fullName' in obj &&
    typeof (obj as CustomerObject).id === 'string' &&
    typeof (obj as CustomerObject).fullName === 'string'
  );
}

/**
 * Type guard to check if an unknown value is a valid RequestSummary
 *
 * This function safely narrows the type from unknown to RequestSummary
 * by checking all required properties exist and have the correct types.
 *
 * @param value - The unknown value to check
 * @returns True if the value matches RequestSummary structure
 */
export function isRequestSummary(obj: unknown): obj is RequestSummary {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const requestObj = obj as RequestSummaryObject;

  return 'customer' in requestObj && isCustomerObject(requestObj.customer);
}

/**
 * Type guard to check if an unknown value could be a Request or RequestSummary
 *
 * This is more lenient than isRequestSummary and handles the union type
 * that often comes from API responses.
 *
 * @param value - The unknown value to check
 * @returns True if the value has the minimum required structure
 */
export function isRequestLike(value: unknown): value is Request | RequestSummary {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj['id'] === 'string' &&
    typeof obj['status'] === 'string' &&
    typeof obj['priority'] === 'number'
  );
}

/**
 * Safely converts a Request-like object to RequestSummary format
 *
 * This function handles the common case where API responses might return
 * Request objects but we need RequestSummary format for UI components.
 *
 * @param request - A Request or RequestSummary object
 * @returns A properly formatted RequestSummary object
 */
export function ensureRequestSummary(request: Request | RequestSummary): RequestSummary {
  if (isRequestSummary(request)) {
    return request;
  }

  return {
    id: request.id,
    title: request.title ?? '',
    status: request.status,
    priority: request.priority,
    customer: {
      id: request.customer?.id ?? '',
      fullName: request.customer?.fullName ?? 'Unknown Customer',
    },
    updatedAt: ensureDateTimeParts(request.updatedAt),
    previewText: request.previewText ?? '',
  };
}

/**
 * Checks if pagination data has legacy format properties
 */
export function hasLegacyPagination(
  pagination: PageInfo | undefined
): pagination is PageInfo & { page: number; limit: number; total: number } {
  return !!pagination && 'page' in pagination && 'limit' in pagination && 'total' in pagination;
}

/**
 * Safely extracts pagination info from potentially mixed format
 */
export function extractPaginationInfo(pagination: PageInfo | undefined): PageInfo {
  if (!pagination) {
    return {
      hasNextPage: false,
      hasPreviousPage: false,
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      page: 1,
      limit: 10,
      total: 0,
    };
  }

  let currentPage: number;
  let totalPages: number;
  let totalItems: number;
  let limit: number;

  if (hasLegacyPagination(pagination)) {
    currentPage = pagination.page;
    limit = pagination.limit;
    totalItems = pagination.total;
    totalPages = Math.ceil(pagination.total / pagination.limit);
  } else {
    currentPage = pagination.currentPage;
    totalPages = pagination.totalPages;
    totalItems = pagination.totalItems;
    limit = pagination.limit || 10;
  }

  return {
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    currentPage,
    totalPages,
    totalItems,
    page: currentPage,
    limit,
    total: totalItems,
  };
}

/**
 * Ensures a value is in DateTimeParts format
 */
export function ensureDateTimeParts(value: DateTimeParts | string | undefined): DateTimeParts {
  if (!value) {
    return { iso8601: '' };
  }

  if (typeof value === 'string') {
    return { iso8601: value };
  }

  return value;
}

/**
 * Safely accesses request properties that might be undefined
 */
export function safeRequestAccess<T>(request: { request?: T } | undefined, fallback: T): T {
  return request?.request ?? fallback;
}

/**
 * Type guard to check if data is array-like
 */
export function isArrayLike<T>(data: T[] | null | undefined): data is T[] {
  return Array.isArray(data);
}
