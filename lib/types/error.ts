import type { ApiResponseData } from '@/lib/api/utils/apiUtils';
/**
 * Types for error handling
 */

/**
 * API error codes for different types of errors that can occur
 * @enum {string}
 */
export enum ApiErrorCode {
  /** Authentication related error codes */
  Unauthorized = 'Unauthorized',
  InvalidToken = 'InvalidToken',
  TokenExpired = 'TokenExpired',

  /** Request related error codes */
  BadRequest = 'BadRequest',
  NotFound = 'NotFound',
  MethodNotAllowed = 'MethodNotAllowed',
  Conflict = 'Conflict',

  /** Server related error codes */
  InternalServerError = 'InternalServerError',
  ServiceUnavailable = 'ServiceUnavailable',

  /** Validation related error codes */
  ValidationError = 'ValidationError',
  MissingRequiredField = 'MissingRequiredField',
  InvalidFormat = 'InvalidFormat',

  /** Business logic related error codes */
  RequestAlreadyClosed = 'RequestAlreadyClosed',
  CustomerNotFound = 'CustomerNotFound',
  RequestNotFound = 'RequestNotFound',

  /** Unknown error code */
  UnknownError = 'UnknownError',
}

/**
 * Specific error details structure
 */
export interface ErrorDetails {
  code?: string;
  message?: string;
  originalError?: string;

  fieldErrors?: {
    fieldName: string;
    message: string;
    validationRule?: string;
  }[];

  requestId?: string;
  traceId?: string;
  timestamp?: string;
  path?: string;

  [key: string]: unknown;
}

/**
 * API error details
 */
export interface ApiErrorDetails {
  code: ApiErrorCode | string;
  message: string;
  userMessage?: string;
  field?: string;
  details?: ErrorDetails;
}

/**
 * API error response
 */
export interface ApiErrorResponse {
  error: ApiErrorDetails;
  data?: ApiResponseData;
}
