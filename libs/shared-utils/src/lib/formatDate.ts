/**
 * Formats a date to a readable string format
 * Uses en-IN locale for India-focused user base
 * @param date - The date to format (Date object or timestamp)
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'number' ? new Date(date) : date;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  return new Intl.DateTimeFormat('en-IN', {
    ...defaultOptions,
    ...options,
  }).format(dateObj);
}
