/**
 * Standardized application error class
 *
 * This provides a consistent error structure throughout the application
 * with support for error codes, user-friendly messages, and metadata.
 */

/**
 * Error categories for better classification of application errors
 * @enum {string}
 */
export enum ErrorCategory {
  /** Authentication and authorization related errors */
  AUTH = 'auth',

  /** Input validation related errors */
  VALIDATION = 'validation',

  /** Resource not found related errors */
  NOT_FOUND = 'not_found',

  /** Permission and access control related errors */
  FORBIDDEN = 'forbidden',

  /** Server-side and internal errors */
  SERVER = 'server',

  /** Network and connectivity related errors */
  NETWORK = 'network',

  /** Data format and parsing related errors */
  DATA = 'data',

  /** Business logic and domain related errors */
  BUSINESS = 'business',

  /** Uncategorized and unknown errors */
  UNKNOWN = 'unknown',
}

/**
 * Error severity levels for categorizing error impact
 * @enum {string}
 */
export enum ErrorSeverity {
  /** Non-critical errors that don't affect core functionality */
  LOW = 'low',
  /** Errors that affect some functionality but allow continued operation */
  MEDIUM = 'medium',
  /** Serious errors that significantly impact functionality */
  HIGH = 'high',
  /** Fatal errors that prevent core functionality */
  CRITICAL = 'critical',
}

export interface AppErrorOptions {
  cause?: Error | unknown;
  statusCode?: number;
  category?: ErrorCategory;
  severity?: ErrorSeverity | undefined;
  userMessage?: string | undefined;
  code?: string;
  metadata?: Record<string, unknown> | undefined;
  isRetryable?: boolean;
}

/**
 * Application error class with enhanced error information
 */
export class AppError extends Error {
  override readonly cause?: Error | unknown;
  readonly statusCode: number;
  readonly category: ErrorCategory;
  readonly severity: ErrorSeverity;
  readonly userMessage: string;
  readonly code: string;
  readonly metadata: Record<string, unknown> | undefined;
  readonly isRetryable: boolean;
  readonly timestamp: string;

  /**
   * Create a new AppError
   *
   * @param message - Technical error message (not shown to users)
   * @param options - Additional error options
   */
  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);

    this.name = 'AppError';
    this.cause = options.cause;
    this.statusCode = options.statusCode ?? this.getDefaultStatusCode(options.category);
    this.category = options.category ?? ErrorCategory.UNKNOWN;
    this.severity = options.severity ?? ErrorSeverity.MEDIUM;
    this.userMessage = options.userMessage ?? this.getUserFriendlyMessage(this.category);
    this.code = options.code ?? `${this.category.toUpperCase()}_ERROR`;
    this.metadata = options.metadata;
    this.isRetryable = options.isRetryable ?? this.getDefaultRetryable(this.category);
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, AppError);
  }

  /**
   * Get default HTTP status code based on error category
   */
  private getDefaultStatusCode(category?: ErrorCategory): number {
    switch (category) {
      case ErrorCategory.AUTH:
        return 401;
      case ErrorCategory.VALIDATION:
        return 400;
      case ErrorCategory.NOT_FOUND:
        return 404;
      case ErrorCategory.FORBIDDEN:
        return 403;
      case ErrorCategory.SERVER:
        return 500;
      case ErrorCategory.NETWORK:
        return 503;
      case ErrorCategory.DATA:
        return 422;
      case ErrorCategory.BUSINESS:
        return 409;
      case ErrorCategory.UNKNOWN:
      default:
        return 500;
    }
  }

  /**
   * Get default retryable flag based on error category
   */
  private getDefaultRetryable(category: ErrorCategory): boolean {
    switch (category) {
      case ErrorCategory.NETWORK:
      case ErrorCategory.SERVER:
        return true;
      case ErrorCategory.AUTH:
      case ErrorCategory.VALIDATION:
      case ErrorCategory.NOT_FOUND:
      case ErrorCategory.FORBIDDEN:
      case ErrorCategory.DATA:
      case ErrorCategory.BUSINESS:
      case ErrorCategory.UNKNOWN:
      default:
        return false;
    }
  }

  /**
   * Create a user-friendly message based on the error category
   */
  private getUserFriendlyMessage(category: ErrorCategory): string {
    switch (category) {
      case ErrorCategory.AUTH:
        return 'You need to be logged in to access this resource. Please sign in and try again.';
      case ErrorCategory.VALIDATION:
        return 'The information provided is invalid. Please check your input and try again.';
      case ErrorCategory.NOT_FOUND:
        return 'The requested resource could not be found. It may have been moved or deleted.';
      case ErrorCategory.FORBIDDEN:
        return 'You do not have permission to access this resource.';
      case ErrorCategory.SERVER:
        return 'We encountered an error on our servers. Our team has been notified and is working on a fix.';
      case ErrorCategory.NETWORK:
        return 'There was a problem connecting to our servers. Please check your internet connection and try again.';
      case ErrorCategory.DATA:
        return 'We encountered an issue processing the data. Please try again later.';
      case ErrorCategory.BUSINESS:
        return 'The operation could not be completed due to a business rule violation.';
      case ErrorCategory.UNKNOWN:
      default:
        return 'An unexpected error occurred. Please try again later.';
    }
  }

  /**
   * Convert error to a plain object for logging or serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      userMessage: this.userMessage,
      category: this.category,
      code: this.code,
      statusCode: this.statusCode,
      severity: this.severity,
      isRetryable: this.isRetryable,
      timestamp: this.timestamp,
      metadata: this.metadata,
      stack: this.stack,
      cause:
        this.cause instanceof Error
          ? {
              name: this.cause.name,
              message: this.cause.message,
              stack: this.cause.stack,
            }
          : this.cause,
    };
  }

  /**
   * Create an authentication error
   */
  static auth(message: string, options?: Omit<AppErrorOptions, 'category'>): AppError {
    return new AppError(message, { ...options, category: ErrorCategory.AUTH });
  }

  /**
   * Create a validation error
   */
  static validation(message: string, options?: Omit<AppErrorOptions, 'category'>): AppError {
    return new AppError(message, { ...options, category: ErrorCategory.VALIDATION });
  }

  /**
   * Create a not found error
   */
  static notFound(message: string, options?: Omit<AppErrorOptions, 'category'>): AppError {
    return new AppError(message, { ...options, category: ErrorCategory.NOT_FOUND });
  }

  /**
   * Create a forbidden error
   */
  static forbidden(message: string, options?: Omit<AppErrorOptions, 'category'>): AppError {
    return new AppError(message, { ...options, category: ErrorCategory.FORBIDDEN });
  }

  /**
   * Create a server error
   */
  static server(message: string, options?: Omit<AppErrorOptions, 'category'>): AppError {
    return new AppError(message, { ...options, category: ErrorCategory.SERVER });
  }

  /**
   * Create a network error
   */
  static network(message: string, options?: Omit<AppErrorOptions, 'category'>): AppError {
    return new AppError(message, { ...options, category: ErrorCategory.NETWORK });
  }

  /**
   * Create a data error
   */
  static data(message: string, options?: Omit<AppErrorOptions, 'category'>): AppError {
    return new AppError(message, { ...options, category: ErrorCategory.DATA });
  }

  /**
   * Create a business error
   */
  static business(message: string, options?: Omit<AppErrorOptions, 'category'>): AppError {
    return new AppError(message, { ...options, category: ErrorCategory.BUSINESS });
  }

  /**
   * Wrap an unknown error in an AppError
   */
  static from(error: unknown, options?: AppErrorOptions): AppError {
    if (error instanceof AppError) {
      return error;
    }

    const message = error instanceof Error ? error.message : String(error);
    return new AppError(message, { ...options, cause: error });
  }
}
