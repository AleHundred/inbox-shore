/**
 * Types for the request service
 */
import type { PaginationParams, RequestDetailResult, RequestsResponse } from './api';

export type { RequestDetailResult, RequestsResponse };

/**
 * Request creation parameters
 */
export interface RequestCreateParams {
  title: string;
  message: string;
}

/**
 * Request creation response
 */
export interface RequestCreateResponse {
  requestId: string;
}

/**
 * Reply parameters
 */
export interface ReplyParams {
  requestId: string;
  text: string;
}

/**
 * Reply response
 */
export interface ReplyResponse {
  success: boolean;
  chatId: string;
  message?: {
    id: string;
    content: string;
    createdAt: {
      iso8601: string;
    };
  };
}

/**
 * Request query parameters
 */
export interface RequestQueryParams extends PaginationParams {
  status?: 'open' | 'closed' | 'all';
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
}
