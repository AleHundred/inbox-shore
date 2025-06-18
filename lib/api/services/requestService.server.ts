import type {
  ApiResponse,
  PaginationParams,
  RequestsResponse,
  CustomerData,
  RequestsDataResponse,
  RequestDetailResponse,
} from '@/lib/types/api';
import { RequestStatus } from '@/lib/types/api';
import type { User } from '@/lib/types/auth';

import { apiClient } from './base/apiClient';

/**
 * Request query parameters interface for API requests
 */
interface RequestQueryParams extends PaginationParams {
  status?: RequestStatus;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
  search?: string;

  [key: string]: string | number | boolean | undefined;
}

/**
 * Interface for request detail parameters
 * Includes an index signature to allow for additional dynamic parameters
 */
interface RequestDetailParams extends PaginationParams {
  includeTimeline?: boolean;
  timelineLimit?: number;

  [key: string]: string | number | boolean | undefined;
}

/**
 * Helper function to create a properly typed CustomerData object
 * @param id - Customer ID
 * @param data - Raw customer data from API
 * @returns CustomerData object with required fields
 */
function createCustomerData(id: string, data: Record<string, unknown>): CustomerData {
  let emailValue = 'no-email@example.com';
  if (typeof data['email'] === 'string') {
    emailValue = data['email'];
  } else if (data['email'] && typeof data['email'] === 'object' && 'email' in data['email']) {
    emailValue = String(data['email']['email']);
  }

  return {
    id,
    fullName: data['fullName'] ? String(data['fullName']) : 'Unknown',
    email: emailValue,
  };
}

/**
 * Server-side request service for retrieving request data
 */
export const requestService = {
  /**
   * Helper method to prepare request query parameters
   * @param params - Base pagination and filter parameters
   * @param additionalParams - Additional query parameters to include
   * @returns Properly typed query parameters
   */
  prepareQueryParams(
    params?: PaginationParams & Partial<Omit<RequestQueryParams, keyof PaginationParams>>,
    additionalParams?: Record<string, string | number | boolean | undefined>
  ): RequestQueryParams {
    const queryParams: RequestQueryParams = {
      page: params?.['page'] || 1,
      limit: params?.['limit'] || 10,
    };

    if (
      params?.['status'] &&
      Object.values(RequestStatus).includes(params['status'] as RequestStatus)
    ) {
      queryParams['status'] = params['status'] as RequestStatus;
    }

    if (
      params?.['sortBy'] &&
      ['createdAt', 'updatedAt', 'priority'].includes(params['sortBy'] as string)
    ) {
      queryParams['sortBy'] = params['sortBy'] as 'createdAt' | 'updatedAt' | 'priority';
    }

    if (params?.['sortOrder'] && ['asc', 'desc'].includes(params['sortOrder'] as string)) {
      queryParams['sortOrder'] = params['sortOrder'] as 'asc' | 'desc';
    }

    if (params?.['search'] && typeof params['search'] === 'string') {
      queryParams['search'] = params['search'];
    }

    if (additionalParams) {
      Object.entries(additionalParams).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'page' || key === 'limit') {
            const numValue = Number(value);
            if (!isNaN(numValue) && numValue > 0) {
              queryParams[key] = numValue;
            }
          } else if (key === 'status' && typeof value === 'string') {
            if (Object.values(RequestStatus).includes(value as RequestStatus)) {
              queryParams['status'] = value as RequestStatus;
            }
          } else if (key === 'sortBy' && typeof value === 'string') {
            if (['createdAt', 'updatedAt', 'priority'].includes(value)) {
              queryParams['sortBy'] = value as 'createdAt' | 'updatedAt' | 'priority';
            }
          } else if (key === 'sortOrder' && typeof value === 'string') {
            if (['asc', 'desc'].includes(value)) {
              queryParams['sortOrder'] = value as 'asc' | 'desc';
            }
          } else {
            queryParams[key] = value;
          }
        }
      });
    }

    return queryParams;
  },

  /**
   * Fetches requests with pagination and optional filtering
   *
   * @param authHeader - Authorization header
   * @param params - Pagination and filter parameters
   * @returns Paginated requests response
   */
  async getRequests(
    authHeader: string,
    params?: PaginationParams & Partial<Omit<RequestQueryParams, keyof PaginationParams>>
  ): Promise<ApiResponse<RequestsResponse>> {
    try {
      const queryParams = this.prepareQueryParams(params);

      const response = await apiClient.get<RequestsDataResponse>('/requests', {
        authHeader,
        params: queryParams,
      });

      if (!response || !response.requests || !response.requests.items) {
        return {
          data: null,
          error: new Error('Invalid requests response structure'),
        };
      }

      const customerDataMap: Record<string, CustomerData> = {};

      response.requests.items.forEach((item) => {
        if (
          item.customer &&
          typeof item.customer === 'object' &&
          'id' in item.customer &&
          item.customer.id
        ) {
          const customerId = String(item.customer.id);

          customerDataMap[customerId] = createCustomerData(customerId, item.customer);
        }
      });

      return {
        data: {
          success: true,
          tickets: response.requests.items,
          customerDataMap,
          pagination: {
            currentPage: queryParams.page || 1,
            totalPages: Math.ceil(
              (response.requests.pageInfo.totalItems || 0) / (queryParams.limit || 10)
            ),
            totalItems: response.requests.pageInfo.totalItems || 0,
            hasNextPage: response.requests.pageInfo.hasNextPage || false,
            hasPreviousPage: response.requests.pageInfo.hasPreviousPage || false,
          },
        },
        error: null,
      };
    } catch (error) {
      console.error('Error fetching requests:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Failed to fetch requests'),
      };
    }
  },

  /**
   * Fetches a single request's details
   *
   * @param authHeader - Authorization header
   * @param requestId - ID of the request to fetch
   * @param options - Additional options for the request
   * @returns Request detail response
   */
  async getRequestDetail(
    authHeader: string,
    requestId: string,
    options?: RequestDetailParams
  ): Promise<ApiResponse<RequestDetailResponse>> {
    try {
      const queryParams = {
        ...options,
        includeTimeline: options?.includeTimeline ?? true,
        timelineLimit: options?.timelineLimit ?? 50,
      };

      const response = await apiClient.get<RequestDetailResponse>(`/requests/${requestId}`, {
        authHeader,
        params: queryParams,
      });

      if (!response || !response.request) {
        return {
          data: null,
          error: new Error('Invalid request detail response'),
        };
      }

      const customer = response.request.customer
        ? {
            id: response.request.customer.id,
            fullName: response.request.customer.fullName || 'Unknown',
          }
        : {
            id: 'unknown',
            fullName: 'Unknown',
          };

      const timelineEntries =
        response.request.timelineEntries?.items.map((entry) => ({
          ...entry,
          components: entry.components || [],
          actorName: entry.actorName || 'Unknown',
          text: entry.text || '',
          chatId: entry.chatId || '',
        })) || [];

      return {
        data: {
          request: {
            ...response.request,
            customer,
            timelineEntries: {
              items: timelineEntries,
              pageInfo: response.request.timelineEntries?.pageInfo || {
                hasNextPage: false,
                hasPreviousPage: false,
                currentPage: 1,
                totalPages: 1,
                totalItems: 0,
              },
            },
          },
          timeline: {
            timelineEntries: {
              items: timelineEntries,
              pageInfo: response.request.timelineEntries?.pageInfo || {
                hasNextPage: false,
                hasPreviousPage: false,
                currentPage: 1,
                totalPages: 1,
                totalItems: 0,
              },
            },
          },
        },
        error: null,
      };
    } catch (error) {
      console.error('Error fetching request detail:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Failed to fetch request detail'),
      };
    }
  },

  /**
   * Creates a new request with the given parameters
   *
   * @param authHeader - Authorization header
   * @param customerId - ID of the customer creating the request
   * @param title - Request title
   * @param message - Initial message content
   * @returns Request creation result with requestId
   */
  async createRequest(
    authHeader: string,
    customerId: string,
    title: string,
    message: string
  ): Promise<ApiResponse<{ requestId: string }>> {
    try {
      const requestBody = {
        customerId,
        title,
        message,
      };

      const response = await apiClient.post<{ requestId: string; success: boolean }>(
        '/requests',
        requestBody,
        { authHeader }
      );

      return {
        data: {
          requestId: response.requestId,
        },
        error: null,
      };
    } catch (error) {
      console.error('Create request error:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Failed to create request'),
      };
    }
  },

  /**
   * Sends a customer chat message to a request
   *
   * @param authHeader - Authorization header
   * @param requestId - Request ID to send message to
   * @param customerId - Customer ID sending the message
   * @param text - Message content
   * @returns Response with chatId or error
   */
  async sendCustomerChat(
    authHeader: string,
    requestId: string,
    customerId: string,
    text: string
  ): Promise<ApiResponse<{ chatId: string }>> {
    try {
      if (!requestId) throw new Error('Request ID is required');
      if (!customerId) throw new Error('Customer ID is required');
      if (!text || text.trim() === '') throw new Error('Message text is required');

      const requestBody = {
        requestId,
        customerId,
        text: text.trim(),
      };

      const response = await apiClient.post<{ chatId: string; success: boolean }>(
        '/chats',
        requestBody,
        { authHeader }
      );

      return {
        data: {
          chatId: response.chatId,
        },
        error: null,
      };
    } catch (error) {
      console.error('Send chat error:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Failed to send chat message'),
      };
    }
  },

  /**
   * Gets or creates a customer record for the authenticated user
   *
   * @param user - The authenticated user
   * @returns Customer data or error
   */
  async getCustomerForUser(
    user: User
  ): Promise<ApiResponse<{ id: string; fullName?: string | undefined }>> {
    try {
      if (!user || !user.email) {
        throw new Error('Valid user with email is required');
      }

      const result = await apiClient.post<{
        id: string;
        fullName?: string;
        success: boolean;
      }>('/customers', {
        email: user.email,
        fullName: user.name || undefined,
      });

      if (!result || typeof result !== 'object') {
        throw new Error('Invalid response from customer API');
      }

      return {
        data: {
          id: result.id,
          fullName: result.fullName,
        },
        error: null,
      };
    } catch (error) {
      console.error('Get customer error:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Failed to get or create customer'),
      };
    }
  },
};
