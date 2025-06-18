import { handleApiError } from '@/lib/errors/adapters';
import type {
  ApiResponse,
  CustomerData,
  PaginationParams,
  QueryParams,
  RequestCreateResponse,
  RequestDetailResponse,
  RequestsResponse,
  RequestSummary,
  Request,
} from '@/lib/types/api';
import type { ReplyResponse } from '@/lib/types/request';
import { ErrorCategory } from '@/lib/utils/AppError';
import { logDebug } from '@/lib/utils/errorLogger';
import { normalizePaginationParams } from '@/lib/utils/paginationUtils';
import { hasLegacyPagination, isArrayLike } from '@/lib/utils/typeGuards';

import { apiClient } from './base/apiClient';

const MAX_TITLE_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 10000;
const REQUEST_ID_PATTERN = /^[a-zA-Z0-9-_]+$/;

interface RequestCreateParams {
  authHeader: string;
  title: string;
  message: string;
  csrfToken?: string;
}

interface SendReplyParams {
  authHeader: string;
  requestId: string;
  text: string;
  csrfToken?: string;
}

/**
 * Client-side request service for retrieving request data
 * Communicates with the API endpoints
 */
export const requestService = {
  /**
   * Normalizes pagination parameters for API requests
   * @param params - Optional pagination parameters
   * @returns Normalized pagination parameters
   */
  _normalizePaginationParams(params?: PaginationParams): QueryParams {
    return normalizePaginationParams(params);
  },

  /**
   * Validates authentication header format
   * @param authHeader - The authentication header to validate
   * @throws Error if the header format is invalid
   */
  _validateAuthHeader(authHeader: string): void {
    if (!authHeader) {
      throw handleApiError(
        new Error('Authentication header is required'),
        'request service authorization',
        {
          metadata: {
            category: ErrorCategory.AUTH,
            context: 'auth validation',
            details: 'Missing authentication header',
          },
        }
      );
    }

    if (authHeader !== 'Cookie' && !authHeader.startsWith('Bearer ')) {
      throw handleApiError(
        new Error('Invalid authentication header format'),
        'request service authorization',
        {
          metadata: {
            category: ErrorCategory.AUTH,
            context: 'auth validation',
            details: 'Invalid authentication header format',
          },
        }
      );
    }
  },

  /**
   * Validates request ID format
   * @param requestId - The request ID to validate
   * @throws Error if the ID format is invalid
   */
  _validateRequestId(requestId: string): void {
    if (!requestId?.trim()) {
      throw handleApiError(
        new Error('Request ID is required and cannot be empty'),
        'request service validation',
        {
          metadata: {
            category: ErrorCategory.VALIDATION,
            context: 'request id validation',
            details: 'Empty or missing request ID',
          },
        }
      );
    }

    if (!REQUEST_ID_PATTERN.test(requestId.trim())) {
      throw handleApiError(new Error('Invalid request ID format'), 'request service validation', {
        metadata: {
          category: ErrorCategory.VALIDATION,
          context: 'request id validation',
          details: 'Request ID contains invalid characters',
        },
      });
    }
  },

  async getRequests(
    authHeader: string,
    params?: PaginationParams
  ): Promise<ApiResponse<RequestsResponse>> {
    this._validateAuthHeader(authHeader);

    const queryParams = this._normalizePaginationParams(params);

    logDebug('RequestService', 'Fetching requests', {
      params: queryParams,
      hasAuth: !!authHeader,
    });

    try {
      const response = await apiClient.get<RequestsResponse>('/requests', {
        params: queryParams,
        authHeader: authHeader,
      });

      if (!response.success) {
        throw handleApiError(new Error('Failed to fetch requests'), 'request service response', {
          metadata: {
            category: ErrorCategory.SERVER,
            context: 'getRequests',
            details: 'API response indicated failure',
          },
        });
      }

      const tickets = response.tickets || response.data;

      logDebug('RequestService', 'Received requests response', {
        ticketCount: tickets?.length || 0,
        success: response.success,
        pagination: response.pagination
          ? hasLegacyPagination(response.pagination)
            ? {
                page: response.pagination.page,
                limit: response.pagination.limit,
                total: response.pagination.total,
              }
            : {
                currentPage: response.pagination.currentPage,
                totalPages: response.pagination.totalPages,
                totalItems: response.pagination.totalItems,
              }
          : null,
        responseStructure: response.tickets ? 'external' : 'mock',
      });

      if (!isArrayLike(tickets)) {
        const customerDataMap: Record<string, CustomerData> = {};

        if (isArrayLike(response.data)) {
          response.data.forEach((item: RequestSummary | Request) => {
            const customer = item.customer;
            if (customer?.id) {
              customerDataMap[customer.id] = {
                id: customer.id,
                fullName:
                  'fullName' in customer && customer.fullName ? customer.fullName : 'Unknown',
                email:
                  'email' in customer && customer.email
                    ? String(customer.email)
                    : 'no-email@example.com',
              };
            }
          });
        }

        const paginationData = response.pagination;
        if (paginationData) {
          const currentPage = hasLegacyPagination(paginationData)
            ? paginationData.page
            : paginationData.currentPage || 1;
          const limit = hasLegacyPagination(paginationData) ? paginationData.limit : 10;
          const total = hasLegacyPagination(paginationData)
            ? paginationData.total
            : paginationData.totalItems || 0;

          return {
            data: {
              success: true,
              tickets: isArrayLike(response.data)
                ? response.data.map((item: RequestSummary | Request) => {
                    if (!item.customer?.id) {
                      return {
                        ...item,
                        customer: { id: 'unknown', fullName: 'Unknown' },
                      };
                    }
                    return {
                      ...item,
                      customer: {
                        id: item.customer.id,
                        fullName:
                          'fullName' in item.customer && item.customer.fullName
                            ? item.customer.fullName
                            : 'Unknown',
                      },
                    };
                  })
                : [],
              customerDataMap,
              pagination: {
                currentPage: currentPage,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                hasNextPage: Boolean(response.pagination?.hasNextPage),
                hasPreviousPage: Boolean(response.pagination?.hasPreviousPage),
                page: currentPage,
                limit: limit,
                total: total,
              },
            },
            error: null,
          };
        }
      }

      return {
        data: response,
        error: null,
      };
    } catch (error) {
      throw handleApiError(error, 'request service', {
        metadata: {
          category: ErrorCategory.SERVER,
          context: 'getRequests',
          details: 'Error occurred while fetching requests',
        },
      });
    }
  },

  async getRequestDetail(
    authHeader: string,
    requestId: string,
    params?: PaginationParams
  ): Promise<ApiResponse<RequestDetailResponse>> {
    this._validateAuthHeader(authHeader);
    this._validateRequestId(requestId);

    const queryParams = this._normalizePaginationParams(params);

    logDebug('RequestService', 'Fetching request detail', {
      requestId,
      params: queryParams,
      hasAuth: !!authHeader,
    });

    try {
      const response = await apiClient.get<RequestDetailResponse>(`/requests/${requestId}`, {
        params: queryParams,
        authHeader,
      });

      if (!response || typeof response !== 'object') {
        throw handleApiError(
          new Error('Invalid response format from request detail API'),
          'request service response',
          {
            metadata: {
              category: ErrorCategory.SERVER,
              context: 'getRequestDetail',
              details: 'Invalid response format',
            },
          }
        );
      }

      const result = response as RequestDetailResponse;

      if (result.request?.timelineEntries) {
        const transformedEntries = isArrayLike(result.request.timelineEntries?.items)
          ? result.request.timelineEntries.items.map((entry) => ({
              ...entry,
              components: entry.components || [],
              actorName: entry.actorName || 'Unknown',
              text: entry.text || '',
              chatId: entry.chatId || '',
            }))
          : [];

        return {
          data: {
            ...result,
            request: {
              ...result.request,
              timelineEntries: {
                ...result.request.timelineEntries,
                items: transformedEntries,
              },
            },
          },
          error: null,
        };
      }

      return {
        data: result,
        error: null,
      };
    } catch (error) {
      throw handleApiError(error, 'request service', {
        metadata: {
          category: ErrorCategory.SERVER,
          context: 'getRequestDetail',
          details: 'Error occurred while fetching request detail',
        },
      });
    }
  },

  async createRequest(params: RequestCreateParams): Promise<ApiResponse<RequestCreateResponse>> {
    this._validateAuthHeader(params.authHeader);

    const title = params.title?.trim();
    const message = params.message?.trim();

    if (!title) {
      throw handleApiError(
        new Error('Title is required and cannot be empty'),
        'request service validation',
        {
          metadata: {
            category: ErrorCategory.VALIDATION,
            context: 'createRequest',
            details: 'Empty or missing title',
          },
        }
      );
    }

    if (title.length > MAX_TITLE_LENGTH) {
      throw handleApiError(
        new Error(`Title exceeds maximum length of ${MAX_TITLE_LENGTH} characters`),
        'request service validation',
        {
          metadata: {
            category: ErrorCategory.VALIDATION,
            context: 'createRequest',
            details: 'Title too long',
          },
        }
      );
    }

    if (!message) {
      throw handleApiError(
        new Error('Message is required and cannot be empty'),
        'request service validation',
        {
          metadata: {
            category: ErrorCategory.VALIDATION,
            context: 'createRequest',
            details: 'Empty or missing message',
          },
        }
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      throw handleApiError(
        new Error(`Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`),
        'request service validation',
        {
          metadata: {
            category: ErrorCategory.VALIDATION,
            context: 'createRequest',
            details: 'Message too long',
          },
        }
      );
    }

    try {
      const response = await apiClient.post<RequestCreateResponse>(
        '/requests',
        {
          title,
          message,
        },
        {
          authHeader: params.authHeader,
          ...(params.csrfToken ? { csrfToken: params.csrfToken } : {}),
        }
      );

      if (!response || !response.requestId) {
        throw handleApiError(
          new Error('Invalid response format from request creation API'),
          'request service response',
          {
            metadata: {
              category: ErrorCategory.SERVER,
              context: 'createRequest',
              details: 'Invalid response format',
            },
          }
        );
      }

      return {
        data: response,
        error: null,
      };
    } catch (error) {
      throw handleApiError(error, 'request service', {
        metadata: {
          category: ErrorCategory.SERVER,
          context: 'createRequest',
          details: 'Error occurred while creating request',
        },
      });
    }
  },

  async sendReply(params: SendReplyParams): Promise<ApiResponse<ReplyResponse>> {
    this._validateAuthHeader(params.authHeader);
    this._validateRequestId(params.requestId);

    const text = params.text?.trim();

    if (!text) {
      throw handleApiError(
        new Error('Reply text is required and cannot be empty'),
        'request service validation',
        {
          metadata: {
            category: ErrorCategory.VALIDATION,
            context: 'sendReply',
            details: 'Empty or missing reply text',
          },
        }
      );
    }

    if (text.length > MAX_MESSAGE_LENGTH) {
      throw handleApiError(
        new Error(`Reply text exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`),
        'request service validation',
        {
          metadata: {
            category: ErrorCategory.VALIDATION,
            context: 'sendReply',
            details: 'Reply text too long',
          },
        }
      );
    }

    try {
      const response = await apiClient.post<ReplyResponse>(
        '/replies',
        {
          requestId: params.requestId.trim(),
          text,
        },
        {
          authHeader: params.authHeader,
          ...(params.csrfToken ? { csrfToken: params.csrfToken } : {}),
        }
      );

      if (!response || !response.chatId) {
        throw handleApiError(
          new Error('Invalid response format from reply API'),
          'request service response',
          {
            metadata: {
              category: ErrorCategory.SERVER,
              context: 'sendReply',
              details: 'Invalid response format',
            },
          }
        );
      }

      return {
        data: response,
        error: null,
      };
    } catch (error) {
      throw handleApiError(error, 'request service', {
        metadata: {
          category: ErrorCategory.SERVER,
          context: 'sendReply',
          details: 'Error occurred while sending reply',
        },
      });
    }
  },
};
