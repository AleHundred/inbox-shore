/**
 * Centralized error logging system
 *
 * This module provides a consistent way to log errors across the application
 * with support for different environments and log levels.
 */

/**
 * Log levels in order of severity
 * @enum {number}
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

interface LoggerConfig {
  minLevel: LogLevel;
  enableStackTrace: boolean;
  captureMetadata: boolean;
  logToConsole: boolean;
}

const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: process.env.NODE_ENV === 'production' ? LogLevel.ERROR : LogLevel.DEBUG,
  enableStackTrace: process.env.NODE_ENV !== 'production',
  captureMetadata: true,
  logToConsole: process.env.NODE_ENV !== 'production',
};

let currentConfig: LoggerConfig = { ...DEFAULT_CONFIG };

/**
 * Configure the logger settings
 *
 * @param config - Partial configuration to merge with current settings
 */
export function configureLogger(config: Partial<LoggerConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

/**
 * Reset logger to default configuration
 */
export function resetLoggerConfig(): void {
  currentConfig = { ...DEFAULT_CONFIG };
}

/**
 * Get the current logger configuration
 */
export function getLoggerConfig(): LoggerConfig {
  return { ...currentConfig };
}

/**
 * Format an error for logging
 *
 * @param context - The context where the error occurred
 * @param error - The error object
 * @param metadata - Additional information about the error
 * @returns Formatted error object ready for logging
 */
function formatError(
  context: string,
  error: Error | unknown,
  metadata?: Record<string, unknown>
): Record<string, unknown> {
  const timestamp = new Date().toISOString();
  const errorObj = error instanceof Error ? error : new Error(String(error));

  const formattedError: Record<string, unknown> = {
    timestamp,
    context,
    message: errorObj.message,
    name: errorObj.name,
  };

  if (currentConfig.enableStackTrace && errorObj.stack) {
    formattedError['stack'] = errorObj.stack;
  }

  if (currentConfig.captureMetadata && metadata) {
    formattedError['metadata'] = metadata;
  }

  if (!(error instanceof Error) && error !== null && error !== undefined) {
    formattedError['originalError'] = error;
  }

  return formattedError;
}

/**
 * Log an error with context
 *
 * @param context - The context where the error occurred
 * @param error - The error object
 * @param metadata - Additional information about the error
 */
export function logError(
  context: string,
  error: Error | unknown,
  metadata?: Record<string, unknown>
): void {
  if (currentConfig.minLevel > LogLevel.ERROR) return;

  const formattedError = formatError(context, error, metadata);

  if (currentConfig.logToConsole) {
    if (typeof process !== 'undefined' && process.stderr) {
      process.stderr.write(`[ERROR][${context}] ${JSON.stringify(formattedError)}\n`);
    } else {
      console.error(`[ERROR][${context}]`, formattedError);
    }
  }
}

/**
 * Log a warning with context
 *
 * @param context - The context where the warning occurred
 * @param message - The warning message
 * @param metadata - Additional information about the warning
 */
export function logWarning(
  context: string,
  message: string,
  metadata?: Record<string, unknown>
): void {
  if (currentConfig.minLevel > LogLevel.WARN) return;

  const timestamp = new Date().toISOString();
  const formattedWarning = {
    timestamp,
    context,
    message,
    ...(currentConfig.captureMetadata && metadata ? { metadata } : {}),
  };

  if (currentConfig.logToConsole) {
    if (typeof process !== 'undefined' && process.stderr) {
      process.stderr.write(`[WARN][${context}] ${JSON.stringify(formattedWarning)}\n`);
    } else {
      console.warn(`[WARN][${context}]`, formattedWarning);
    }
  }
}

/**
 * Log info with context
 *
 * @param context - The context for the info message
 * @param message - The info message
 * @param metadata - Additional information
 */
export function logInfo(
  context: string,
  message: string,
  metadata?: Record<string, unknown>
): void {
  if (currentConfig.minLevel > LogLevel.INFO) return;

  const timestamp = new Date().toISOString();
  const formattedInfo = {
    timestamp,
    context,
    message,
    ...(currentConfig.captureMetadata && metadata ? { metadata } : {}),
  };

  if (currentConfig.logToConsole) {
    if (typeof process !== 'undefined' && process.stdout) {
      process.stdout.write(`[INFO][${context}] ${JSON.stringify(formattedInfo)}\n`);
    }
  }
}

/**
 * Log debug information with context
 *
 * @param context - The context for the debug message
 * @param message - The debug message
 * @param metadata - Additional information
 */
export function logDebug(
  context: string,
  message: string,
  metadata?: Record<string, unknown>
): void {
  if (currentConfig.minLevel > LogLevel.DEBUG) return;

  const timestamp = new Date().toISOString();
  const formattedDebug = {
    timestamp,
    context,
    message,
    ...(currentConfig.captureMetadata && metadata ? { metadata } : {}),
  };

  if (currentConfig.logToConsole) {
    if (typeof process !== 'undefined' && process.stdout) {
      process.stdout.write(`[DEBUG][${context}] ${JSON.stringify(formattedDebug)}\n`);
    }
  }
}
