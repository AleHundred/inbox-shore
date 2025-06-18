/**
 * Domain entity types for business objects
 */

/**
 * Request creation parameters
 */
export interface RequestCreateParams {
  title: string;
  message: string;
}

/**
 * Reply parameters
 */
export interface ReplyParams {
  requestId: string;
  text: string;
}

/**
 * Request query parameters
 */
export interface RequestQueryParams {
  status?: 'open' | 'closed' | 'all';
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
}
