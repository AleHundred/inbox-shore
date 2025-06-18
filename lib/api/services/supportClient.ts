import { config } from '@/lib/config';
import type { ApiResponse } from '@/lib/types/api';
import type {
  ApiQueryParams,
  ApiRequestBody,
  CustomerResponse,
  UpsertCustomerParams,
} from '@/lib/types/support';

import { apiClient } from './base/apiClient';

/**
 * Client for communicating with our support API backend
 */
export class SupportClient {
  baseUrl: string;

  constructor(baseUrl: string = config.apiBaseUrl) {
    this.baseUrl = baseUrl;
  }

  /**
   * Performs GET requests to the support API
   * @param endpoint - API endpoint to call
   * @param params - Query parameters with appropriate types
   * @returns API response with appropriate type
   */
  async get<T>(endpoint: string, params?: ApiQueryParams): Promise<ApiResponse<T>> {
    try {
      const data = await apiClient.get<T>(
        `${this.baseUrl}${endpoint}`,
        params ? { params: params as Record<string, string> } : undefined
      );
      return { data, error: null };
    } catch (error) {
      console.error(`Error in GET ${endpoint}:`, error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error(`GET ${endpoint} failed`),
      };
    }
  }

  /**
   * Performs POST requests to the support API
   * @param endpoint - API endpoint to call
   * @param body - Request body with appropriate type based on the endpoint
   * @returns API response with appropriate type
   */
  async post<T>(endpoint: string, body: ApiRequestBody): Promise<ApiResponse<T>> {
    try {
      const data = await apiClient.post<T>(`${this.baseUrl}${endpoint}`, body);
      return { data, error: null };
    } catch (error) {
      console.error(`Error in POST ${endpoint}:`, error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error(`POST ${endpoint} failed`),
      };
    }
  }

  /**
   * Creates or updates a customer
   * @param params - Customer upsert parameters
   * @returns API response with customer data
   */
  async upsertCustomer(params: UpsertCustomerParams): Promise<ApiResponse<CustomerResponse>> {
    try {
      const response = await this.post<{ id: string; fullName?: string }>('/customer', {
        email: params.identifier.emailAddress,
        fullName: params.onCreate.fullName,
        isVerified: params.onCreate.email.isVerified,
      });

      if (!response.data) {
        throw new Error('Failed to upsert customer');
      }

      return {
        data: {
          customer: {
            id: response.data.id,
            fullName: response.data.fullName || params.onCreate.fullName,
          },
        },
        error: null,
      };
    } catch (error) {
      return {
        data: { customer: { id: 'default_customer', fullName: params.onCreate.fullName } },
        error: error instanceof Error ? error : new Error('Failed to upsert customer'),
      };
    }
  }

  /**
   * Retrieves customer details by ID
   * @param params - Parameters containing the customer ID
   * @returns API response with customer data
   */
  async getCustomerById(params: { customerId: string }): Promise<ApiResponse<CustomerResponse>> {
    try {
      const response = await this.get<{ id: string; fullName?: string }>('/customer', {
        customerId: params.customerId,
      });

      if (!response.data || typeof response.data.id !== 'string') {
        throw new Error('Invalid customer data');
      }

      return {
        data: {
          customer: {
            id: response.data.id,
            fullName: response.data.fullName ?? 'Unknown Customer',
          },
        },
        error: null,
      };
    } catch (error) {
      return {
        data: { customer: { id: params.customerId, fullName: 'Unknown Customer' } },
        error: error instanceof Error ? error : new Error('Failed to get customer by ID'),
      };
    }
  }
}

export const supportClient = new SupportClient();
