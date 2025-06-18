/**
 * Pagination utilities for standardizing pagination logic across the application
 */
import type { PaginationParams, QueryParams } from '@/lib/types/api';

/**
 * Default pagination values
 */
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;

/**
 * Normalizes pagination parameters
 * Prioritizes page-based pagination but supports cursor-based pagination as a fallback
 *
 * @param params - Pagination parameters (can be page-based, cursor-based, or both)
 * @returns Normalized query parameters for the API request
 */
export function normalizePaginationParams(params?: PaginationParams): QueryParams {
  const queryParams: QueryParams = {};

  queryParams.limit = params?.limit || DEFAULT_LIMIT;

  if (typeof params?.page === 'number') {
    queryParams.page = params.page;
  } else if (params?.after || params?.before) {
    if (params.after) queryParams.after = params.after;
    if (params.before) queryParams.before = params.before;
  } else {
    queryParams.page = DEFAULT_PAGE;
  }

  Object.keys(queryParams).forEach((key) => {
    if (queryParams[key] === null || queryParams[key] === undefined) {
      delete queryParams[key];
    }
  });

  return queryParams;
}

/**
 * Creates default pagination parameters
 *
 * @param overrides - Optional overrides for the default pagination parameters
 * @returns Default pagination parameters with any provided overrides
 */
export function createDefaultPagination(overrides?: Partial<PaginationParams>): PaginationParams {
  return {
    page: DEFAULT_PAGE,
    limit: DEFAULT_LIMIT,
    ...overrides,
  };
}

/**
 * Calculates the total number of pages based on total items and limit
 *
 * @param total - Total number of items
 * @param limit - Number of items per page
 * @returns Total number of pages
 */
export function calculateTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit);
}

/**
 * Checks if a page is valid
 *
 * @param page - Page number to check
 * @param totalPages - Total number of pages
 * @returns Whether the page is valid
 */
export function isValidPage(page: number, totalPages: number): boolean {
  return page >= 1 && page <= totalPages;
}
