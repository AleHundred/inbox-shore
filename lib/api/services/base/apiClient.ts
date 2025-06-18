import { config } from '@/lib/config';
import { ErrorHandler } from '@/lib/errors/errorHandler';
import type { QueryParams } from '@/lib/types/api';
import { ErrorCategory } from '@/lib/utils/AppError';
import { logDebug, logError } from '@/lib/utils/errorLogger';

const API_BASE_URL = config.apiBaseUrl;
const MOCK_API_BASE_URL = config.mockApiBaseUrl;
const USE_MOCK_API = config.useMockApi;
const MAX_BODY_SIZE = 1024 * 1024; // 1MB

/**
 * HTTP methods supported by the API client
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}

/**
 * Request options for API calls
 */
interface RequestOptions {
  authHeader?: string;
  params?: QueryParams;
  headers?: Record<string, string>;
  csrfToken?: string;
}

/**
 * Client for making API requests with consistent error handling
 */
export const apiClient = {
  /**
   * Makes a GET request to the API
   *
   * @param url - API endpoint URL
   * @param options - Request options
   * @returns Response data
   */
  async get<T>(url: string, options?: RequestOptions): Promise<T> {
    if (!url) {
      throw ErrorHandler.handle(new Error('URL is required'), {
        context: 'apiClient.get',
        metadata: {
          category: ErrorCategory.VALIDATION,
          context: 'get',
          details: 'Missing URL parameter',
        },
      });
    }
    const fullUrl = this.buildUrl(url);
    return this.request<T>(HttpMethod.GET, fullUrl, undefined, options);
  },

  /**
   * Builds a complete URL by prepending the appropriate API base URL if needed
   *
   * @param url - The URL or endpoint path
   * @returns The complete URL
   */
  buildUrl(url: string): string {
    if (!url) {
      throw ErrorHandler.handle(new Error('URL is required'), {
        context: 'apiClient.buildUrl',
        metadata: {
          category: ErrorCategory.VALIDATION,
          context: 'buildUrl',
          details: 'Missing URL parameter',
        },
      });
    }

    try {
      new URL(url);
      return url;
    } catch {
      // Not a complete URL, continue with path handling
    }

    const authEndpoints = ['/login', '/logout', '/validate-session'];
    if (authEndpoints.some((endpoint) => url === endpoint)) {
      logDebug('ApiClient', `Using internal API for auth endpoint: ${url}`);
      return `/api${url}`;
    }

    if (USE_MOCK_API) {
      if (url.startsWith('/requests/ticket_')) {
        const ticketPart = url.split('/requests/')[1];
        const ticketId = ticketPart?.split('/')[0];
        if (!ticketId) {
          throw ErrorHandler.handle(new Error('Invalid ticket URL format'), {
            context: 'apiClient.buildUrl',
            metadata: {
              category: ErrorCategory.VALIDATION,
              context: 'buildUrl',
              details: 'Invalid ticket URL format',
            },
          });
        }
        logDebug('ApiClient', `Normalized request detail endpoint: ${ticketId}`);
        return `/api/requests/${ticketId}`;
      }

      logDebug('ApiClient', `Using mock API for endpoint: ${url}`);
      return `${MOCK_API_BASE_URL}${url}`;
    }

    return `${API_BASE_URL}${url}`;
  },

  /**
   * Makes a POST request to the API
   *
   * @param url - API endpoint URL
   * @param body - Request body
   * @param options - Request options
   * @returns Response data
   */
  async post<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    if (!url) {
      throw ErrorHandler.handle(new Error('URL is required'), {
        context: 'apiClient.post',
        metadata: {
          category: ErrorCategory.VALIDATION,
          context: 'post',
          details: 'Missing URL parameter',
        },
      });
    }
    const fullUrl = this.buildUrl(url);
    return this.request<T>(HttpMethod.POST, fullUrl, body, options);
  },

  /**
   * Makes a PUT request to the API
   *
   * @param url - API endpoint URL
   * @param body - Request body
   * @param options - Request options
   * @returns Response data
   */
  async put<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    if (!url) {
      throw ErrorHandler.handle(new Error('URL is required'), {
        context: 'apiClient.put',
        metadata: {
          category: ErrorCategory.VALIDATION,
          context: 'put',
          details: 'Missing URL parameter',
        },
      });
    }
    const fullUrl = this.buildUrl(url);
    return this.request<T>(HttpMethod.PUT, fullUrl, body, options);
  },

  /**
   * Makes a DELETE request to the API
   *
   * @param url - API endpoint URL
   * @param options - Request options
   * @returns Response data
   */
  async delete<T>(url: string, options?: RequestOptions): Promise<T> {
    if (!url) {
      throw ErrorHandler.handle(new Error('URL is required'), {
        context: 'apiClient.delete',
        metadata: {
          category: ErrorCategory.VALIDATION,
          context: 'delete',
          details: 'Missing URL parameter',
        },
      });
    }
    const fullUrl = this.buildUrl(url);
    return this.request<T>(HttpMethod.DELETE, fullUrl, undefined, options);
  },

  /**
   * Makes a PATCH request to the API
   *
   * @param url - API endpoint URL
   * @param body - Request body
   * @param options - Request options
   * @returns Response data
   */
  async patch<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    if (!url) {
      throw ErrorHandler.handle(new Error('URL is required'), {
        context: 'apiClient.patch',
        metadata: {
          category: ErrorCategory.VALIDATION,
          context: 'patch',
          details: 'Missing URL parameter',
        },
      });
    }
    const fullUrl = this.buildUrl(url);
    return this.request<T>(HttpMethod.PATCH, fullUrl, body, options);
  },

  /**
   * Core request method that handles all HTTP operations
   *
   * @param method - HTTP method
   * @param url - Complete URL for the request
   * @param body - Request body for POST/PUT/PATCH requests
   * @param options - Additional request options
   * @returns Response data
   */
  async request<T>(
    method: HttpMethod,
    url: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    try {
      if (!url) {
        throw ErrorHandler.handle(new Error('URL is required'), {
          context: 'apiClient.request',
          metadata: {
            category: ErrorCategory.VALIDATION,
            context: 'request',
            details: 'Missing URL parameter',
          },
        });
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options?.headers,
      };

      if (options?.authHeader) {
        if (options.authHeader === 'Cookie') {
          headers['Cookie'] = options.authHeader;
        } else if (options.authHeader.startsWith('Bearer ')) {
          headers['Authorization'] = options.authHeader;
        } else {
          throw ErrorHandler.handle(new Error('Invalid authorization header format'), {
            context: 'apiClient.request',
            metadata: {
              category: ErrorCategory.AUTH,
              context: 'request',
              details: 'Invalid authorization header format',
            },
          });
        }
      }

      if (options?.csrfToken) {
        headers['X-CSRF-Token'] = options.csrfToken;
      }

      let finalUrl = url;
      if (options?.params) {
        const searchParams = new URLSearchParams();
        Object.entries(options.params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
          }
        });
        const queryString = searchParams.toString();
        if (queryString) {
          finalUrl += `${url.includes('?') ? '&' : '?'}${queryString}`;
        }
      }

      logDebug('ApiClient', `Making ${method} request`, {
        url: finalUrl,
        hasAuth: !!options?.authHeader,
        authType: options?.authHeader === 'Cookie' ? 'cookie' : 'bearer',
      });

      const requestConfig: RequestInit = {
        method,
        headers,
        credentials: 'include',
      };

      if (body && method !== HttpMethod.GET) {
        try {
          const bodyString = JSON.stringify(body);
          if (bodyString.length > MAX_BODY_SIZE) {
            throw ErrorHandler.handle(new Error('Request body exceeds maximum size limit'), {
              context: 'apiClient.request',
              metadata: {
                category: ErrorCategory.VALIDATION,
                context: 'request',
                details: `Body size ${bodyString.length} exceeds limit of ${MAX_BODY_SIZE}`,
              },
            });
          }
          requestConfig.body = bodyString;
        } catch (error) {
          if (error instanceof Error && error.message.includes('maximum size limit')) {
            throw error;
          }
          throw ErrorHandler.handle(new Error('Failed to stringify request body'), {
            context: 'apiClient.request',
            metadata: {
              category: ErrorCategory.VALIDATION,
              context: 'request',
              details: 'Failed to stringify request body',
            },
          });
        }
      }

      const response = await fetch(finalUrl, requestConfig);

      logDebug('ApiClient', `Response received`, {
        url: finalUrl,
        status: response.status,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorText = await response.text();
        logError('ApiClient', 'Request failed', {
          url: finalUrl,
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });

        let errorCategory = ErrorCategory.SERVER;
        if (response.status === 401) {
          errorCategory = ErrorCategory.AUTH;
        } else if (response.status === 403) {
          errorCategory = ErrorCategory.AUTH;
        } else if (response.status === 404) {
          errorCategory = ErrorCategory.VALIDATION;
        } else if (response.status === 429) {
          errorCategory = ErrorCategory.SERVER; // Rate limit errors are treated as server errors
        }

        throw ErrorHandler.handle(
          new Error(`API request failed: ${response.status} ${response.statusText}`),
          {
            context: 'apiClient.request',
            showToast: false,
            metadata: {
              category: errorCategory,
              status: response.status,
              response: errorText,
              context: 'request',
              details: `HTTP ${response.status} error`,
            },
          }
        );
      }

      try {
        const data = await response.json();
        return data as T;
      } catch {
        throw ErrorHandler.handle(new Error('Failed to parse response as JSON'), {
          context: 'apiClient.request',
          showToast: false,
          metadata: {
            category: ErrorCategory.DATA,
            context: 'request',
            details: 'Failed to parse response as JSON',
          },
        });
      }
    } catch (error) {
      logError('ApiClient', 'Request error', {
        url,
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        throw ErrorHandler.handle(error, {
          context: 'apiClient.request',
          showToast: false,
          metadata: {
            category: ErrorCategory.NETWORK,
            context: 'request',
            details: 'Network request failed',
          },
        });
      }

      throw ErrorHandler.handle(error, {
        context: 'apiClient.request',
        showToast: false,
        metadata: {
          category: ErrorCategory.SERVER,
          context: 'request',
          details: 'Unexpected error during request',
        },
      });
    }
  },
};
