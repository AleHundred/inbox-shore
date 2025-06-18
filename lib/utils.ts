import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class strings into a single string
 * @param inputs - Class strings to combine
 * @returns Combined class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Log an error with a specific context name
 * @param logName - Context name for the error
 * @param error - The error that occurred
 * @param info - Additional information about the error (optional)
 */
export function logError(logName: string, error: Error, info?: React.ErrorInfo): void {
  console.error(`Error in ${logName}:`, error);
  if (info) {
    console.error('Component stack:', info.componentStack);
  }
}
