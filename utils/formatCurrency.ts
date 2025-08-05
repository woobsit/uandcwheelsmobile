/**
 * Formats a number as a currency string.
 *
 * @param amount - The number to format.
 * @param currency - The currency code (e.g., 'USD', 'EUR'). Defaults to 'NGN' (Nigerian Naira).
 * @param locale - The locale string (e.g., 'en-US', 'en-GB'). Defaults to 'en-US'.
 * @returns The formatted currency string, or 'N/A' if the input is not a valid number.
 */
export const formatCurrency = (amount: number | null | undefined, currency: string = 'NGN', locale: string = 'en-US'): string => {
  // Return 'N/A' for null, undefined, or non-numeric values
  if (amount == null || isNaN(amount)) {
    return 'N/A';
  }

  // Use the built-in Intl.NumberFormat for robust, locale-aware formatting
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
};