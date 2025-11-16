import { formatInTimeZone } from 'date-fns-tz';
import { parseISO } from 'date-fns';

// WIB timezone (Western Indonesia Time - UTC+7)
export const WIB_TIMEZONE = 'Asia/Jakarta';

/**
 * Format a date string to WIB timezone
 * @param dateString ISO date string
 * @param formatStr Format pattern (e.g., 'MMM dd, yyyy HH:mm')
 * @returns Formatted date string in WIB timezone
 */
export function formatToWIB(dateString: string, formatStr: string): string {
  const date = parseISO(dateString);
  return formatInTimeZone(date, WIB_TIMEZONE, formatStr);
}

/**
 * Format a Date object to WIB timezone
 * @param date Date object
 * @param formatStr Format pattern
 * @returns Formatted date string in WIB timezone
 */
export function formatDateToWIB(date: Date, formatStr: string): string {
  return formatInTimeZone(date, WIB_TIMEZONE, formatStr);
}

/**
 * Get current time in WIB
 * @returns Current date in WIB timezone
 */
export function nowInWIB(): Date {
  return new Date();
}

/**
 * Display timezone label
 */
export const TIMEZONE_LABEL = 'WIB';
