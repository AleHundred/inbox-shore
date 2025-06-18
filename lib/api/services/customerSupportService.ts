import type { UpsertCustomerParams } from '@/lib/types/support';

import type { ApiResponse, CustomerDetail } from './base/types';
import { supportClient } from './supportClient';

/**
 * Server-side service for managing customer data
 * Centralizes all customer-related operations
 */
export const customerService = {
  /**
   * Fetches customer details by ID directly from the API
   */
  async getCustomerById(
    _authHeader: string,
    customerId: string
  ): Promise<ApiResponse<CustomerDetail>> {
    try {
      const result = await supportClient.getCustomerById({
        customerId,
      });

      if (result.error) {
        return { data: null, error: new Error(result.error.message) };
      }

      return {
        data: result.data as unknown as CustomerDetail,
        error: null,
      };
    } catch (error) {
      console.error('Error fetching customer:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Failed to fetch customer'),
      };
    }
  },

  /**
   * Upserts a customer with the given parameters
   * This will create a new customer if one does not exist with the given email
   */
  async upsertCustomer(
    _authHeader: string,
    params: {
      id?: string;
      fullName?: string;
      email?: string;
      externalId?: string;
      isVerified?: boolean;
    }
  ): Promise<ApiResponse<CustomerDetail>> {
    try {
      const fullName = params.fullName || (params.email ? params.email.split('@')[0] : 'Unknown');

      const input: UpsertCustomerParams = {
        identifier: {
          emailAddress: params.email || '',
        },
        onCreate: {
          email: {
            isVerified: params.isVerified || false,
          },
          fullName: fullName || '',
        },
      };

      const result = await supportClient.upsertCustomer(input);

      if (result.error) {
        return { data: null, error: new Error(result.error.message) };
      }

      return {
        data: result.data as unknown as CustomerDetail,
        error: null,
      };
    } catch (error) {
      console.error('Error upserting customer:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Failed to upsert customer'),
      };
    }
  },
};
