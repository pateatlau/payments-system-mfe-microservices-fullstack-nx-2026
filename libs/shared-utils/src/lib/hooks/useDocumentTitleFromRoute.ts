import { useEffect, useMemo } from 'react';

export interface RouteTitle {
  /** Route path pattern (supports wildcards like /payments/*) */
  path: string;
  /** Title to display for this route */
  title: string;
}

export interface UseDocumentTitleFromRouteOptions {
  /** Suffix to append to title. Default: "| MFE Payments" */
  suffix?: string;
  /** Default title if no route matches. Default: "MFE Payments" */
  defaultTitle?: string;
}

/**
 * Maps common route paths to human-readable page titles.
 * Used as default when no custom route titles are provided.
 */
const DEFAULT_ROUTE_TITLES: RouteTitle[] = [
  { path: '/', title: 'Home' },
  { path: '/signin', title: 'Sign In' },
  { path: '/signup', title: 'Sign Up' },
  { path: '/forgot-password', title: 'Forgot Password' },
  { path: '/reset-password', title: 'Reset Password' },
  { path: '/verify-email', title: 'Verify Email' },
  { path: '/oauth/callback', title: 'Signing In' },
  { path: '/mfa-recommendation', title: 'Security Recommendation' },
  { path: '/payments', title: 'Payments' },
  { path: '/payments/*', title: 'Payments' },
  { path: '/reports', title: 'Reports' },
  { path: '/reports/*', title: 'Reports' },
  { path: '/admin', title: 'Admin Dashboard' },
  { path: '/admin/*', title: 'Admin Dashboard' },
  { path: '/profile', title: 'Profile' },
  { path: '/profile/*', title: 'Profile' },
  { path: '/settings', title: 'Settings' },
  { path: '/settings/*', title: 'Settings' },
];

/**
 * Hook that automatically sets document title based on the current route.
 *
 * This hook matches the current pathname against a list of route patterns
 * and sets the appropriate document title. It's useful for maintaining
 * consistent page titles across the application without adding title
 * management to each individual page component.
 *
 * @example
 * // In your app's main component
 * function App() {
 *   const location = useLocation();
 *   useDocumentTitleFromRoute(location.pathname);
 *
 *   return <Routes>...</Routes>;
 * }
 *
 * @example
 * // With custom route titles
 * useDocumentTitleFromRoute(location.pathname, {
 *   routeTitles: [
 *     { path: '/dashboard', title: 'Dashboard' },
 *     { path: '/users/*', title: 'User Management' },
 *   ],
 *   suffix: '| My App',
 * });
 *
 * @param currentPath - The current route pathname
 * @param routeTitles - Optional custom route-to-title mappings
 * @param options - Configuration options
 */
export function useDocumentTitleFromRoute(
  currentPath: string,
  routeTitles: RouteTitle[] = DEFAULT_ROUTE_TITLES,
  options: UseDocumentTitleFromRouteOptions = {}
) {
  const { suffix = '| MFE Payments', defaultTitle = 'MFE Payments' } = options;

  const title = useMemo(() => {
    // Normalize the path
    const normalizedPath = currentPath.toLowerCase().replace(/\/$/, '') || '/';

    // Find matching route
    for (const route of routeTitles) {
      const pattern = route.path.toLowerCase().replace(/\/$/, '') || '/';

      // Exact match
      if (pattern === normalizedPath) {
        return route.title;
      }

      // Wildcard match (e.g., /payments/* matches /payments/123)
      if (pattern.endsWith('/*')) {
        const basePath = pattern.slice(0, -2);
        if (normalizedPath.startsWith(basePath + '/') || normalizedPath === basePath) {
          return route.title;
        }
      }
    }

    // No match found - format path as title
    return formatPathAsTitle(currentPath) || defaultTitle;
  }, [currentPath, routeTitles, defaultTitle]);

  useEffect(() => {
    const fullTitle = suffix ? `${title} ${suffix}` : title;
    document.title = fullTitle;
  }, [title, suffix]);

  return title;
}

/**
 * Formats a URL path as a human-readable title.
 * Example: /payment-history -> "Payment History"
 */
function formatPathAsTitle(path: string): string {
  if (path === '/') {
    return 'Home';
  }

  const segments = path
    .split('/')
    .filter(Boolean)
    .filter((segment) => {
      // Filter out dynamic segments like :id or [id] or UUIDs
      if (segment.startsWith(':') || (segment.startsWith('[') && segment.endsWith(']'))) {
        return false;
      }
      // Filter out UUID-like segments
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
        return false;
      }
      // Filter out numeric IDs
      if (/^\d+$/.test(segment)) {
        return false;
      }
      return true;
    })
    .map((segment) =>
      segment
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase())
    );

  return segments.join(' - ') || '';
}

export { DEFAULT_ROUTE_TITLES };
