/**
 * Support service specific types
 */
import type { DateTimeParts, Customer } from './api';

/**
 * Extended chat result for support operations
 */
export interface ExtendedChatResult {
  chatId: string;
  message: {
    id: string;
    content: string;
    createdAt: DateTimeParts;
  };
}

/**
 * Support customer type (alias for consistency)
 */
export type SupportCustomer = Customer;

export type ApiQueryParams = Record<string, unknown>;

export type ApiRequestBody = Record<string, unknown>;

export type CustomerResponse = Record<string, unknown>;

export interface UpsertCustomerParams {
  identifier: {
    emailAddress: string;
  };
  onCreate: {
    fullName: string;
    email: {
      isVerified: boolean;
    };
  };
}
