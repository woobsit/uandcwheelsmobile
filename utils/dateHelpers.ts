// utils/dateHelpers.ts

// --- RECOMMENDED: Using date-fns for robust formatting ---
import { format, isValid, parseISO } from 'date-fns';

export const formatDate = (dateInput: Date | string | number, dateFormat: string): string => {
  let date: Date;

  if (dateInput instanceof Date) {
    date = dateInput;
  } else if (typeof dateInput === 'string' && dateInput.includes('T') && dateInput.includes(':')) {
    // Assuming ISO 8601 string (e.g., from backend timestamps)
    date = parseISO(dateInput);
  } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
    // Try parsing as a regular date string or number (e.g., timestamp)
    date = new Date(dateInput);
  } else {
    return 'Invalid Date Input';
  }

  // Handle invalid dates
  if (!isValid(date)) {
    // console.warn('Invalid date input for formatDate:', dateInput, 'Result:', date);
    return 'Invalid Date';
  }

  try {
    return format(date, dateFormat);
  } catch (e) {
    console.error('Error formatting date:', e, 'Input:', dateInput, 'Format:', dateFormat);
    return 'Formatting Error';
  }
};

/**
 * Formats a date or date-like string/number into a time string.
 * @param {Date | string | number} dateInput The date to format.
 * @param {string} [timeFormat='p'] The format string (e.g., 'hh:mm a'). Defaults to a short time format.
 * @returns {string} The formatted time string.
 */
export const formatTime = (dateInput: Date | string | number, timeFormat: string = 'p'): string => {
  let date: Date;

  if (dateInput instanceof Date) {
    date = dateInput;
  } else if (typeof dateInput === 'string' && dateInput.includes('T') && dateInput.includes(':')) {
    date = parseISO(dateInput);
  } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
    date = new Date(dateInput);
  } else {
    return 'Invalid Time Input';
  }

  if (!isValid(date)) {
    return 'Invalid Time';
  }

  try {
    return format(date, timeFormat);
  } catch (e) {
    console.error('Error formatting time:', e, 'Input:', dateInput, 'Format:', timeFormat);
    return 'Formatting Error';
  }
};