import { apiClient } from '@/lib/api/services/base/apiClient';
import type {
  PaginationParams,
  RequestDetailResult,
  RequestsResponse,
  UpsertCustomerParams,
} from '@/lib/api/services/base/types';
import { ErrorHandler } from '@/lib/errors/errorHandler';
import { ErrorCategory } from '@/lib/utils/AppError';

export const apiService = {
  auth: {
    login: (email: string, password: string) => {
      return apiClient.post('/login', { email, password });
    },
    validateSession: (token: string) => {
      if (!token)
        throw ErrorHandler.handle(new Error('Token is required'), {
          context: 'apiService.validateSession',
          metadata: {
            category: ErrorCategory.AUTH,
            context: 'validateSession',
            details: 'Missing token',
          },
        });
      return apiClient.get('/validate-session', {
        authHeader: token,
      });
    },
  },

  requests: {
    getList: (
      authHeader: string,
      params?: Record<string, string | number | boolean | undefined>
    ) => {
      if (!authHeader) {
        throw ErrorHandler.handle(new Error('Authentication header is required'), {
          context: 'apiService.getList',
          metadata: {
            category: ErrorCategory.AUTH,
            context: 'getList',
            details: 'Missing authHeader',
          },
        });
      }
      const options: {
        authHeader: string;
        params?: Record<string, string | number | boolean | undefined>;
      } = { authHeader };

      if (params) {
        options.params = params;
      }

      return apiClient.get<RequestsResponse>('/requests', options);
    },

    getDetail: (authHeader: string, requestId: string) => {
      if (!authHeader) {
        throw ErrorHandler.handle(new Error('Authentication header is required'), {
          context: 'apiService.getDetail',
          metadata: {
            category: ErrorCategory.AUTH,
            context: 'getDetail',
            details: 'Missing authHeader',
          },
        });
      }
      if (!requestId) {
        throw ErrorHandler.handle(new Error('RequestId is required'), {
          context: 'apiService.getDetail',
          metadata: {
            category: ErrorCategory.VALIDATION,
            context: 'getDetail',
            details: 'Missing requestId',
          },
        });
      }
      return apiClient.get<RequestDetailResult>(`/requests/${requestId}`, {
        authHeader,
      });
    },

    sendReply: (authHeader: string, requestId: string, message: string) => {
      if (!authHeader)
        throw ErrorHandler.handle(new Error('Authentication header is required'), {
          context: 'apiService.sendReply',
          metadata: {
            category: ErrorCategory.AUTH,
            context: 'sendReply',
            details: 'Missing authHeader',
          },
        });
      if (!requestId)
        throw ErrorHandler.handle(new Error('RequestId is required'), {
          context: 'apiService.sendReply',
          metadata: {
            category: ErrorCategory.VALIDATION,
            context: 'sendReply',
            details: 'Missing requestId',
          },
        });
      if (!message || !message.trim())
        throw ErrorHandler.handle(new Error('Message cannot be empty'), {
          context: 'apiService.sendReply',
          metadata: {
            category: ErrorCategory.VALIDATION,
            context: 'sendReply',
            details: 'Empty message',
          },
        });

      return apiClient.post(
        '/reply',
        {
          requestId,
          message,
        },
        { authHeader }
      );
    },

    createRequest: (authHeader: string, title: string, message: string) => {
      if (!authHeader)
        throw ErrorHandler.handle(new Error('Authentication header is required'), {
          context: 'apiService.createRequest',
          metadata: {
            category: ErrorCategory.AUTH,
            context: 'createRequest',
            details: 'Missing authHeader',
          },
        });
      if (!title || !title.trim())
        throw ErrorHandler.handle(new Error('Title is required'), {
          context: 'apiService.createRequest',
          metadata: {
            category: ErrorCategory.VALIDATION,
            context: 'createRequest',
            details: 'Missing title',
          },
        });
      if (!message || !message.trim())
        throw ErrorHandler.handle(new Error('Message is required'), {
          context: 'apiService.createRequest',
          metadata: {
            category: ErrorCategory.VALIDATION,
            context: 'createRequest',
            details: 'Missing message',
          },
        });
      return apiClient.post(
        '/contact-form',
        {
          title,
          message,
        },
        { authHeader }
      );
    },
  },

  customers: {
    getCustomer: (authHeader: string, customerId: string) => {
      if (!authHeader)
        throw ErrorHandler.handle(new Error('Authentication header is required'), {
          context: 'apiService.getCustomer',
          metadata: {
            category: ErrorCategory.AUTH,
            context: 'getCustomer',
            details: 'Missing authHeader',
          },
        });
      if (!customerId)
        throw ErrorHandler.handle(new Error('Customer ID is required'), {
          context: 'apiService.getCustomer',
          metadata: {
            category: ErrorCategory.VALIDATION,
            context: 'getCustomer',
            details: 'Missing customerId',
          },
        });
      return apiClient.get(`/customers/${customerId}`, {
        authHeader,
      });
    },
    updateCustomer: (
      authHeader: string,
      customerId: string,
      data: Partial<UpsertCustomerParams>
    ) => {
      if (!authHeader)
        throw ErrorHandler.handle(new Error('Authentication header is required'), {
          context: 'apiService.updateCustomer',
          metadata: {
            category: ErrorCategory.AUTH,
            context: 'updateCustomer',
            details: 'Missing authHeader',
          },
        });
      if (!customerId)
        throw ErrorHandler.handle(new Error('Customer ID is required'), {
          context: 'apiService.updateCustomer',
          metadata: {
            category: ErrorCategory.VALIDATION,
            context: 'updateCustomer',
            details: 'Missing customerId',
          },
        });
      return apiClient.put(`/customers/${customerId}`, data, {
        authHeader,
      });
    },
    searchCustomers: (authHeader: string, query: string, params?: PaginationParams) => {
      if (!authHeader)
        throw ErrorHandler.handle(new Error('Authentication header is required'), {
          context: 'apiService.searchCustomers',
          metadata: {
            category: ErrorCategory.AUTH,
            context: 'searchCustomers',
            details: 'Missing authHeader',
          },
        });
      if (!query || !query.trim())
        throw ErrorHandler.handle(new Error('Search query is required'), {
          context: 'apiService.searchCustomers',
          metadata: {
            category: ErrorCategory.VALIDATION,
            context: 'searchCustomers',
            details: 'Missing query',
          },
        });
      const options = {
        authHeader,
        params: { query, ...params },
      };
      return apiClient.get('/customers/search', options);
    },
  },
};
