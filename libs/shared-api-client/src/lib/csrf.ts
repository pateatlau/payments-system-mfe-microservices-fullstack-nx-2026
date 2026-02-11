/**
 * CSRF Token Manager
 *
 * Manages CSRF tokens for the Double Submit Cookie pattern:
 * 1. Fetches CSRF token from backend on initialization
 * 2. Stores token in memory (not localStorage for security)
 * 3. Provides token for inclusion in X-CSRF-Token header
 * 4. Handles token refresh on 403 CSRF errors
 *
 * Usage:
 * - Call initCsrfToken() on app startup
 * - getCsrfToken() returns current token for request headers
 * - refreshCsrfToken() fetches a new token (called on 403 CSRF errors)
 */

// CSRF token stored in memory (not localStorage for security)
let csrfToken: string | null = null;

// Track initialization state
let isInitializing = false;
let initPromise: Promise<string | null> | null = null;

// Cookie name must match backend
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';

/**
 * Read CSRF token from cookie
 * The backend sets this cookie on GET /api/csrf-token
 */
function getTokenFromCookie(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === CSRF_COOKIE_NAME && value) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Fetch CSRF token from backend
 *
 * @param baseURL - API base URL (defaults to resolving from environment)
 * @returns The CSRF token or null on error
 */
export async function fetchCsrfToken(baseURL?: string): Promise<string | null> {
  try {
    // Resolve base URL
    const apiUrl = baseURL || resolveApiUrl();

    const response = await fetch(`${apiUrl}/csrf-token`, {
      method: 'GET',
      credentials: 'include', // Include cookies for CORS
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('[CSRF] Failed to fetch CSRF token:', response.status);
      return null;
    }

    const data = (await response.json()) as {
      success: boolean;
      data?: {
        token: string;
        headerName: string;
      };
    };

    if (data.success && data.data?.token) {
      return data.data.token;
    }

    // Fallback: try to read from cookie (backend sets it)
    return getTokenFromCookie();
  } catch (error) {
    console.warn('[CSRF] Error fetching CSRF token:', error);
    // Fallback: try to read from cookie
    return getTokenFromCookie();
  }
}

/**
 * Resolve API URL from environment
 * Same logic as apiClient.ts
 */
function resolveApiUrl(): string {
  // Runtime override (for CI)
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const runtimeUrl = (window as any).__ENV__?.API_BASE_URL;
    if (runtimeUrl) {
      return runtimeUrl;
    }
  }

  // Build-time environment variable
  if (process.env.NX_API_BASE_URL) {
    return process.env.NX_API_BASE_URL;
  }

  // Default fallback
  return 'https://localhost/api';
}

/**
 * Initialize CSRF token
 * Call this on app startup to ensure token is ready before mutations
 *
 * @param baseURL - Optional API base URL
 * @returns The CSRF token or null on error
 */
export async function initCsrfToken(baseURL?: string): Promise<string | null> {
  // If already initializing, return the existing promise
  if (isInitializing && initPromise) {
    return initPromise;
  }

  // If already initialized and have a token, return it
  if (csrfToken) {
    return csrfToken;
  }

  // First try to get from cookie (may already exist from previous session)
  const cookieToken = getTokenFromCookie();
  if (cookieToken) {
    csrfToken = cookieToken;
    return csrfToken;
  }

  // Fetch from backend
  isInitializing = true;
  initPromise = fetchCsrfToken(baseURL)
    .then(token => {
      csrfToken = token;
      isInitializing = false;
      initPromise = null;
      return token;
    })
    .catch(error => {
      console.error('[CSRF] Failed to initialize CSRF token:', error);
      isInitializing = false;
      initPromise = null;
      return null;
    });

  return initPromise;
}

/**
 * Get current CSRF token
 * Returns cached token or reads from cookie
 */
export function getCsrfToken(): string | null {
  // Return cached token if available
  if (csrfToken) {
    return csrfToken;
  }

  // Try to read from cookie
  const cookieToken = getTokenFromCookie();
  if (cookieToken) {
    csrfToken = cookieToken;
    return csrfToken;
  }

  return null;
}

/**
 * Refresh CSRF token
 * Call this after a 403 CSRF error to get a new token
 *
 * @param baseURL - Optional API base URL
 * @returns The new CSRF token or null on error
 */
export async function refreshCsrfToken(baseURL?: string): Promise<string | null> {
  // Clear cached token
  csrfToken = null;

  // Fetch new token
  const token = await fetchCsrfToken(baseURL);
  csrfToken = token;
  return token;
}

/**
 * Clear CSRF token
 * Call this on logout to clear cached token
 */
export function clearCsrfToken(): void {
  csrfToken = null;
}

/**
 * Check if request method requires CSRF token
 */
export function requiresCsrfToken(method: string): boolean {
  const upperMethod = method.toUpperCase();
  // CSRF only required for state-changing methods
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(upperMethod);
}

/**
 * CSRF header name
 */
export const CSRF_HEADER_NAME = 'X-CSRF-Token';
