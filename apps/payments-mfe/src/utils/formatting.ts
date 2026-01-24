/**
 * Format currency value with symbol
 * Defaults to INR (Indian Rupees) as the primary user base is India
 */
export function formatCurrency(amount: number, currency: string): string {
  const currencyCode = currency || 'INR';
  // Use en-IN locale for INR, otherwise use appropriate locale based on currency
  const locale = currencyCode === 'INR' ? 'en-IN' : 'en-US';
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount);
}

/**
 * Format date to readable string
 * Uses en-IN locale for India-focused user base
 */
export function formatDate(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return formatter.format(date);
}

/**
 * Format date to short format (date only)
 * Uses en-IN locale for India-focused user base
 */
export function formatDateShort(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  return formatter.format(date);
}

/**
 * Format time only
 * Uses en-IN locale for India-focused user base
 */
export function formatTime(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return formatter.format(date);
}
