import { useEffect, useRef } from 'react';
import { useAnnounce } from './useAnnounce';

export interface UseRouteAnnouncerOptions {
  /** Prefix to add before the page title. Default: 'Navigated to' */
  prefix?: string;
  /** Delay before announcing (ms). Default: 100 */
  delay?: number;
  /** Whether to use document.title or custom title */
  useDocumentTitle?: boolean;
}

/**
 * Hook that announces route changes to screen readers.
 *
 * When the current path changes, this hook announces the new page
 * to screen reader users, helping them understand navigation context.
 *
 * @example
 * // In your app's main layout or router
 * function App() {
 *   const location = useLocation();
 *   useRouteAnnouncer(location.pathname);
 *
 *   return <Routes>...</Routes>;
 * }
 *
 * @example
 * // With custom title
 * function App() {
 *   const location = useLocation();
 *   useRouteAnnouncer(location.pathname, {
 *     prefix: 'Now viewing',
 *   });
 *
 *   return <Routes>...</Routes>;
 * }
 *
 * @param currentPath - The current route path
 * @param options - Configuration options
 */
export function useRouteAnnouncer(
  currentPath: string,
  options: UseRouteAnnouncerOptions = {}
) {
  const { prefix = 'Navigated to', delay = 100, useDocumentTitle = true } = options;
  const announce = useAnnounce();
  const previousPath = useRef<string | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip announcement on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      previousPath.current = currentPath;
      return;
    }

    // Skip if path hasn't actually changed
    if (previousPath.current === currentPath) {
      return;
    }

    previousPath.current = currentPath;

    // Delay to allow page title to update
    const timeoutId = setTimeout(() => {
      let pageTitle: string;

      if (useDocumentTitle && typeof document !== 'undefined' && document.title) {
        // Use the document title if available
        pageTitle = document.title;
      } else {
        // Fall back to formatting the path
        pageTitle = formatPathAsTitle(currentPath);
      }

      announce(`${prefix} ${pageTitle}`, { politeness: 'polite', clearAfter: 2000 });
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [currentPath, prefix, delay, useDocumentTitle, announce]);
}

/**
 * Formats a URL path as a human-readable title.
 * Example: /payments/create -> "Payments Create"
 */
function formatPathAsTitle(path: string): string {
  if (path === '/') {
    return 'Home';
  }

  return path
    .split('/')
    .filter(Boolean)
    .map((segment) => {
      // Handle dynamic segments like :id or [id]
      if (segment.startsWith(':') || (segment.startsWith('[') && segment.endsWith(']'))) {
        return '';
      }
      // Capitalize first letter and replace dashes/underscores with spaces
      return segment
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
    })
    .filter(Boolean)
    .join(' ') || 'Page';
}
