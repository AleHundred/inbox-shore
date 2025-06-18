import type { DateTimeParts } from '@/lib/types';

/**
 * Normalizes various date formats from the API into a JavaScript Date object
 * Handles ISO strings, DateTimeParts objects, and timestamp strings/numbers
 * @param date - The date to normalize
 * @returns A JavaScript Date object (defaults to epoch if no date provided)
 */
export function normalizeDate(date: string | DateTimeParts | number | undefined | null): Date {
  if (!date) return new Date(0);

  if (typeof date === 'object' && 'iso8601' in date) {
    return new Date(date.iso8601);
  }

  if (typeof date === 'number' || (typeof date === 'string' && !isNaN(Number(date)))) {
    const timestamp = typeof date === 'string' ? parseInt(date, 10) : date;
    return new Date(timestamp * (timestamp < 10000000000 ? 1000 : 1));
  }

  return new Date(String(date));
}

/**
 * Formats a date with consistent formatting across the application
 * Accepts any of our supported date formats and returns a formatted string
 */
export function formatDate(
  date: string | DateTimeParts | number | undefined | null,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }
): string {
  try {
    const normalizedDate = normalizeDate(date);

    if (isNaN(normalizedDate.getTime())) {
      console.warn('Invalid date encountered:', date);
      return 'Invalid date';
    }

    return normalizedDate.toLocaleDateString(undefined, options);
  } catch (error) {
    console.error('Error formatting date:', error, date);
    return 'Date error';
  }
}
