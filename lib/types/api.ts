/**
 * Core API types for requests, responses, and communication patterns
 */

/**
 * Standard date/time representation across the application
 */
export interface DateTimeParts {
  iso8601: string;
  unixTimestamp?: string;
}

/**
 * Base API response structure
 */
export interface ApiResponseBase {
  success: boolean;
}

/**
 * Error response from API
 */
export interface ApiErrorResponse extends ApiResponseBase {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

/**
 * Success response with data
 */
export interface ApiSuccessResponse<T> extends ApiResponseBase {
  success: true;
  data: T;
}

/**
 * Common response structure for client code
 */
export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Request status enumeration
 */
export enum RequestStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  SNOOZED = 'SNOOZED',
}

/**
 * Request priority levels
 */
export enum RequestPriority {
  URGENT = 0,
  HIGH = 1,
  NORMAL = 2,
  LOW = 3,
}

/**
 * Unified pagination information that includes all possible fields
 */
export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  page?: number;
  limit?: number;
  total?: number;
}

/**
 * Pagination parameters for API requests
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  after?: string;
  before?: string;
}

/**
 * Extended pagination params with dynamic properties
 */
export interface ExtendedPaginationParams extends PaginationParams {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Query parameters interface
 */
export interface QueryParams extends PaginationParams {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  items: T[];
  pageInfo: PageInfo;
}

/**
 * API request options
 */
export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined>;
  authHeader?: string;
  body?: unknown;
  headers?: Record<string, string>;
  retryCount?: number;
}

/**
 * Customer data from API
 */
export interface CustomerData {
  id: string;
  fullName: string;
  email: string;
}

/**
 * Unified customer representation
 */
export interface Customer {
  id: string;
  fullName?: string;
  email?:
    | {
        email: string;
        isVerified: boolean;
      }
    | string;
  externalId?: string | null;
}

/**
 * Actor in timeline entries
 */
export interface Actor {
  type: 'user' | 'customer' | 'machine' | 'agent' | 'unknown';
  fullName?: string;
  name?: string;
  email?: string;
}

/**
 * Timeline entry base structure
 */
export interface TimelineEntry {
  type: string;
  id: string;
  timestamp: string;
  actorType: 'user' | 'customer' | 'machine' | 'agent';
  actorName: string;
  entryType: string;
  text?: string;
  chatId?: string;
  isOptimistic?: boolean;
  components?: Array<{
    type: string;
    text: string;
  }>;
  [key: string]: unknown;
}

/**
 * Timeline entry from API (alias for consistency)
 */
export type TimelineEntryItem = TimelineEntry;

/**
 * Timeline entry node for rendering
 */
export interface EntryNode {
  id: string;
  timestamp: string | DateTimeParts;
  actor: Actor;
  entry?: TimelineEntry;
  createdAt?: string;
  text?: string;
  message?: { text?: string };
  content?: string;
  components?: Array<{
    type: string;
    text?: string;
  }>;
}

/**
 * Request summary for lists
 */
export interface RequestSummary {
  id: string;
  title?: string;
  status: string;
  priority: number;
  customer: {
    id: string;
    fullName: string;
  };
  updatedAt: DateTimeParts;
  previewText?: string;
}

/**
 * Full request entity
 */
export interface Request {
  id: string;
  title?: string;
  status: RequestStatus | string;
  priority: number;
  customer?: {
    id: string;
    fullName?: string;
  };
  createdAt?: DateTimeParts | string;
  updatedAt: DateTimeParts | string;
  previewText?: string;
}

/**
 * Request detail data structure
 */
export interface RequestDetail {
  id: string;
  title: string;
  createdAt: DateTimeParts;
  updatedAt: DateTimeParts;
  customer: {
    id: string;
    fullName?: string;
  };
  timelineEntries?: PaginatedResult<TimelineEntry>;
}

/**
 * Request detail response with timeline support
 */
export interface RequestDetailResponse {
  request?: RequestDetail;
  timeline?: {
    timelineEntries: PaginatedResult<TimelineEntry>;
  };
}

/**
 * Request creation response
 */
export interface RequestCreateResponse extends ApiResponseBase {
  success: true;
  requestId: string;
}

/**
 * Timeline-specific API response
 */
export interface TimelineApiResponse {
  request?: {
    id: string;
    timelineEntries?: PaginatedResult<TimelineEntry>;
  };
}

/**
 * Requests list response
 */
export interface RequestsResponse extends ApiResponseBase {
  tickets?: Array<Request>;
  customerDataMap?: Record<string, CustomerData>;
  data?: Array<RequestSummary>;
  pagination?: PageInfo;
}

/**
 * Specific response format for request data
 */
export interface RequestsDataResponse extends ApiResponseBase {
  requests: {
    items: Array<RequestSummary>;
    pageInfo: PageInfo;
  };
  data?: Array<RequestSummary>;
  pagination?: PageInfo;
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
    createdAt: DateTimeParts;
  };
}

/**
 * Request creation response
 */
export interface CreateRequestResponse {
  requestId: string;
}

/**
 * Send chat response
 */
export interface SendChatResponse {
  success: boolean;
  chatId: string;
  message?: {
    id: string;
    content: string;
    createdAt: DateTimeParts;
  };
}

/**
 * Generic request response
 */
export interface RequestResponse extends ApiResponseBase {
  request?: RequestDetail;
}

/**
 * Request detail result type
 */
export interface RequestDetailResult {
  request: RequestDetail;
}

/**
 * Request timeline result type
 */
export interface RequestTimelineResult {
  timeline: PaginatedResult<TimelineEntry>;
}

/**
 * Send chat result type
 */
export interface SendChatResult {
  chatId: string;
  message: {
    id: string;
    content: string;
    createdAt: DateTimeParts;
  };
}

/**
 * Timeline page info (alias for PageInfo)
 */
export type TimelinePageInfo = PageInfo;

/**
 * Customer detail type
 */
export interface CustomerDetail extends Customer {
  createdAt?: DateTimeParts;
  updatedAt?: DateTimeParts;
}

/**
 * Upsert customer parameters
 */
export interface UpsertCustomerParams {
  id?: string;
  fullName?: string;
  email?: string;
  externalId?: string;
  isVerified?: boolean;
}
