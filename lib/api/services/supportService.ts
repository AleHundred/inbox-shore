import { ErrorHandler } from '@/lib/errors/errorHandler';

import type {
  ApiResponse,
  SendChatResult,
  RequestDetailResult,
  RequestTimelineResult,
  PaginationParams,
} from './base/types';
import { supportClient } from './supportClient';

/**
 * Extended version of SendChatResult with additional fields
 * for enhanced type safety and better response handling
 */
interface ExtendedChatResult extends SendChatResult {
  timestamp?: string;
  status?: string;
}

/**
 * Extended pagination parameters that include GraphQL-style cursor pagination
 */
interface ExtendedPaginationParams extends PaginationParams {
  first?: number;
  last?: number;
  before?: string;
  after?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Parameters for sending a chat message
 */
interface SendChatParams {
  requestId: string;
  customerId: string;
  text: string;
  attachmentIds?: string[];
  metadata?: Record<string, string | number | boolean>;
}

/**
 * Parameters for fetching request timeline entries
 */
interface FetchTimelineParams {
  requestId: string;
  first?: number;
  after?: string;
  last?: number;
  before?: string;
  filter?: {
    entryType?: string | string[];
    actorType?: string | string[];
  };
}

/**
 * Chat response interface for better type safety
 */
interface ChatResponse {
  success: boolean;
  message: string;
  code?: string;
  data?: {
    message: {
      id: string;
      timestamp?: string;
      status?: string;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Server-side service for direct interactions with our support API
 * This service centralizes all server-side operations with the support API
 * and implements proper error handling and parameter sanitization.
 *
 * Should only be used in API routes or server components.
 */
export const supportService = {
  /**
   * Returns the underlying support client for direct access
   * @returns The support client instance
   */
  getClient() {
    return supportClient;
  },

  /**
   * Helper method for making paginated API requests
   * Implements parameter sanitization and converts cursor-based to page-based pagination
   *
   * @param endpoint - The API endpoint to call
   * @param params - Parameters to be passed to the API operation
   * @returns Typed response data or error
   */
  async paginatedRequest<T>(
    endpoint: string,
    params: ExtendedPaginationParams
  ): Promise<ApiResponse<T>> {
    try {
      const cleanParams: ExtendedPaginationParams = {};

      if (params['before'] !== undefined || params['after'] !== undefined) {
        cleanParams.page = 1;
        cleanParams.limit = params['first'] || params['last'] || 20;

        if (params['before']) cleanParams['before'] = params['before'];
        if (params['after']) cleanParams['after'] = params['after'];
      } else {
        if (params['page'] !== undefined) {
          const pageNum = Number(params['page']);
          if (!isNaN(pageNum) && pageNum > 0) {
            cleanParams['page'] = pageNum;
          } else {
            cleanParams['page'] = 1;
          }
        }

        if (params['limit'] !== undefined) {
          const limitNum = Number(params['limit']);
          if (!isNaN(limitNum) && limitNum > 0) {
            cleanParams['limit'] = limitNum;
          } else {
            cleanParams['limit'] = 20;
          }
        }
      }

      Object.entries(params).forEach(([key, value]) => {
        if (
          !['before', 'after', 'first', 'last', 'page', 'limit'].includes(key) &&
          value !== null &&
          value !== undefined
        ) {
          if (
            typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean'
          ) {
            cleanParams[key] = value;
          }
        }
      });

      const result = await supportClient.get<T>(endpoint, cleanParams);

      if (result.error) {
        return {
          data: null,
          error: ErrorHandler.handle(result.error, {
            context: 'supportService.paginatedRequest',
            showToast: false,
          }),
        };
      }

      if (!result.data) {
        return {
          data: null,
          error: ErrorHandler.handle(new Error('Invalid API response: missing data'), {
            context: 'supportService.paginatedRequest',
            showToast: false,
          }),
        };
      }

      return { data: result.data, error: null };
    } catch (error) {
      return {
        data: null,
        error: ErrorHandler.handle(error, {
          context: 'supportService.paginatedRequest',
          showToast: false,
        }),
      };
    }
  },

  /**
   * Fetches a request's timeline entries with pagination support
   *
   * IMPORTANT: Our API supports pagination parameters:
   * - Forward pagination: first (+optional after)
   * - Backward pagination: last + before
   *
   * @param params - Object containing requestId and pagination parameters
   * @returns Request timeline data or error
   */
  async fetchRequestTimelineEntries(
    params: FetchTimelineParams
  ): Promise<ApiResponse<RequestTimelineResult>> {
    try {
      if (!params.requestId) {
        throw new Error('Request ID is required for fetching timeline entries');
      }

      const requestParams: Record<string, string | number | boolean | undefined> = {
        requestId: params.requestId,
      };

      if (params['first'] !== undefined) {
        const firstNum = Number(params['first']);
        if (!isNaN(firstNum) && firstNum > 0) {
          requestParams['first'] = firstNum;
        }
      }

      if (params['after']) requestParams['after'] = params['after'];

      if (params['last'] !== undefined) {
        const lastNum = Number(params['last']);
        if (!isNaN(lastNum) && lastNum > 0) {
          requestParams['last'] = lastNum;
        }
      }

      if (params['before']) requestParams['before'] = params['before'];

      if (params['filter']) {
        if (params['filter']['entryType']) {
          if (Array.isArray(params['filter']['entryType'])) {
            requestParams['entryType'] = params['filter']['entryType'].join(',');
          } else {
            requestParams['entryType'] = params['filter']['entryType'];
          }
        }

        if (params['filter']['actorType']) {
          if (Array.isArray(params['filter']['actorType'])) {
            requestParams['actorType'] = params['filter']['actorType'].join(',');
          } else {
            requestParams['actorType'] = params['filter']['actorType'];
          }
        }
      }

      const result = await supportClient.get<RequestTimelineResult>('/timeline', requestParams);

      if (result.error) {
        throw result.error;
      }

      if (!result.data) {
        throw new Error('Invalid API response: missing timeline data');
      }

      return result;
    } catch (error) {
      return {
        data: null,
        error: ErrorHandler.handle(error, {
          context: 'supportService.fetchRequestTimelineEntries',
          showToast: false,
        }),
      };
    }
  },

  /**
   * Fetches basic request details without the timeline entries
   * Used for displaying request metadata like title, status, etc.
   *
   * @param requestId - The ID of the request to fetch
   * @param options - Optional parameters for the request
   * @returns Request details or error
   */
  async fetchRequestDetails(
    requestId: string,
    options?: { includeMetadata?: boolean; includeCustomerInfo?: boolean }
  ): Promise<ApiResponse<RequestDetailResult>> {
    try {
      if (!requestId) {
        throw new Error('Request ID is required');
      }

      const requestParams: Record<string, string | number | boolean | undefined> = {
        requestId,
      };

      if (options) {
        if (options['includeMetadata'] !== undefined) {
          requestParams['includeMetadata'] = options['includeMetadata'];
        }

        if (options['includeCustomerInfo'] !== undefined) {
          requestParams['includeCustomerInfo'] = options['includeCustomerInfo'];
        }
      }

      const result = await supportClient.get<RequestDetailResult>('/requests', requestParams);

      if (result.error) {
        throw result.error;
      }

      if (!result.data) {
        throw new Error('Invalid API response: missing request details');
      }

      return result;
    } catch (error) {
      return {
        data: null,
        error: ErrorHandler.handle(error, {
          context: 'supportService.fetchRequestDetails',
          showToast: false,
        }),
      };
    }
  },

  /**
   * Sends a chat message to a request from a customer
   * Used when support agents need to respond to customer inquiries
   *
   * @param params - Object containing request parameters
   * @returns Chat message ID and optional metadata or error
   */
  async sendChat(params: SendChatParams): Promise<ApiResponse<ExtendedChatResult>> {
    try {
      const { requestId, customerId, text, attachmentIds, metadata } = params;

      if (!requestId) {
        throw new Error('Request ID is required for sending a chat message');
      }

      if (!customerId) {
        throw new Error('Customer ID is required for sending a chat message');
      }

      if (!text || text.trim() === '') {
        throw new Error('Message text cannot be empty');
      }

      const requestParams: Record<
        string,
        string | number | boolean | string[] | Record<string, unknown> | undefined
      > = {
        requestId,
        customerId,
        message: text,
      };

      if (attachmentIds && Array.isArray(attachmentIds) && attachmentIds.length > 0) {
        requestParams['attachmentIds'] = attachmentIds;
      } else {
        requestParams['attachmentIds'] = [];
      }

      if (metadata && Object.keys(metadata).length > 0) {
        requestParams['metadata'] = metadata;
      }

      const result = await supportClient.post<ChatResponse>('/reply', requestParams);

      if (result.error) {
        throw result.error;
      }

      if (!result.data) {
        throw new Error('Invalid API response: missing data');
      }

      if (!result.data.success) {
        const errorMessage = result.data.message || 'Failed to send chat message';
        const errorCode = result.data.code || 'UNKNOWN_ERROR';
        throw new Error(`${errorMessage} (Code: ${errorCode})`);
      }

      if (!result.data.data?.message?.id) {
        throw new Error('Failed to send chat message - no message ID returned');
      }

      const chatResult: ExtendedChatResult = {
        chatId: result.data.data.message.id,
        message: {
          id: 'temp_id',
          content: 'Initial message',
          createdAt: {
            iso8601: new Date().toISOString(),
          },
        },
      };

      if (result.data.data.message.timestamp) {
        chatResult.timestamp = result.data.data.message.timestamp;
      }

      if (result.data.data.message.status) {
        chatResult.status = result.data.data.message.status;
      }

      return {
        data: chatResult,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: ErrorHandler.handle(error, {
          context: 'supportService.sendChat',
          showToast: false,
        }),
      };
    }
  },
};
