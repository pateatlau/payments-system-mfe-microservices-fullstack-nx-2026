import { useEffect, useRef } from 'react';

export interface UseDocumentTitleOptions {
  /** Suffix to append to title (e.g., "| MFE Payments"). Default: "| MFE Payments" */
  suffix?: string;
  /** Whether to restore previous title on unmount. Default: false */
  restoreOnUnmount?: boolean;
}

/**
 * Updates the document title with proper formatting.
 *
 * This hook helps maintain consistent page titles across the application,
 * which is essential for:
 * - Screen reader users to understand their current location
 * - Browser tab identification
 * - Browser history navigation
 * - SEO (if applicable)
 *
 * @example
 * // Basic usage - sets title to "Dashboard | MFE Payments"
 * useDocumentTitle('Dashboard');
 *
 * @example
 * // Custom suffix
 * useDocumentTitle('User Profile', { suffix: '| My App' });
 *
 * @example
 * // No suffix
 * useDocumentTitle('Custom Title', { suffix: '' });
 *
 * @example
 * // Restore previous title on unmount
 * useDocumentTitle('Modal Title', { restoreOnUnmount: true });
 *
 * @param title - The page title (without suffix)
 * @param options - Configuration options
 */
export function useDocumentTitle(
  title: string,
  options: UseDocumentTitleOptions = {}
) {
  const { suffix = '| MFE Payments', restoreOnUnmount = false } = options;

  const previousTitleRef = useRef<string | null>(null);

  useEffect(() => {
    // Store previous title if we need to restore it
    if (restoreOnUnmount && previousTitleRef.current === null) {
      previousTitleRef.current = document.title;
    }

    // Build the full title
    const fullTitle = title
      ? suffix
        ? `${title} ${suffix}`
        : title
      : suffix
        ? suffix.replace(/^\|\s*/, '') // Remove leading "| " if no title
        : 'MFE Payments';

    document.title = fullTitle;

    return () => {
      // Restore previous title if configured
      if (restoreOnUnmount && previousTitleRef.current !== null) {
        document.title = previousTitleRef.current;
      }
    };
  }, [title, suffix, restoreOnUnmount]);
}
