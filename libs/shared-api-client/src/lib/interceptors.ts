/**
 * Axios Interceptors
 *
 * Handles:
 * - Request interceptor: Adds JWT token to Authorization header
 * - Request interceptor: Adds CSRF token to X-CSRF-Token header for mutations
 * - Request interceptor: Adds session fingerprint for security (POC-3 Phase 7.3)
 * - Response interceptor: Handles errors, token refresh, and retry logic
 * - Response interceptor: Handles CSRF token refresh on 403 errors
 */

import {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from 'axios';
import {
  getCsrfToken,
  refreshCsrfToken,
  requiresCsrfToken,
  CSRF_HEADER_NAME,
} from './csrf';

/**
 * POC-3 Phase 7.3: Session fingerprint header name
 */
const FINGERPRINT_HEADER_NAME = 'X-Client-Fingerprint';

/**
 * POC-3 Phase 7.3: Cached fingerprint to avoid async operations on every request
 */
let cachedFingerprintHeader: string | null = null;
let fingerprintPromise: Promise<string> | null = null;

/**
 * POC-3 Phase 7.3: Initialize fingerprint asynchronously
 * This is called once on module load to pre-compute the fingerprint
 */
async function initializeFingerprint(): Promise<string> {
  if (typeof window === 'undefined') {
    return ''; // SSR - no fingerprint
  }

  try {
    // Dynamic import to avoid circular dependencies and enable tree-shaking
    const { getSessionFingerprintHeader } = await import('@mfe/shared-utils');
    return await getSessionFingerprintHeader();
  } catch (error) {
    console.warn('[Interceptors] Failed to generate session fingerprint:', error);
    return '';
  }
}

/**
 * POC-3 Phase 7.3: Get or initialize the fingerprint header
 */
function getFingerprintHeader(): string {
  if (cachedFingerprintHeader !== null) {
    return cachedFingerprintHeader;
  }

  // Start initialization if not already started
  if (!fingerprintPromise) {
    fingerprintPromise = initializeFingerprint().then(header => {
      cachedFingerprintHeader = header;
      return header;
    });
  }

  // Return empty string while initializing (fingerprint will be available on subsequent requests)
  return '';
}

/**
 * POC-3 Phase 7.3: Clear cached fingerprint (call on logout)
 */
export function clearCachedFingerprint(): void {
  cachedFingerprintHeader = null;
  fingerprintPromise = null;
}

/**
 * Token management interface for interceptors
 */
interface TokenManager {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearTokens: () => void;
}

/**
 * Retry configuration
 */
interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryCondition?: (error: AxiosError) => boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  retries: 3,
  retryDelay: 1000,
  retryCondition: (error: AxiosError) => {
    // Retry on network errors or 5xx errors
    return (
      !error.response ||
      (error.response.status >= 500 && error.response.status < 600)
    );
  },
};

/**
 * Token refresh state to prevent multiple simultaneous refresh attempts
 */
let isRefreshing = false;
let refreshSubscribers: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

/**
 * Add token to request headers
 */
function addTokenToRequest(
  config: InternalAxiosRequestConfig,
  token: string | null
): void {
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
}

/**
 * Wait for token refresh to complete
 */
function subscribeTokenRefresh(
  resolve: (token: string) => void,
  reject: (error: unknown) => void
): void {
  refreshSubscribers.push({ resolve, reject });
}

/**
 * Notify all subscribers when token refresh completes
 */
function onTokenRefreshed(token: string): void {
  refreshSubscribers.forEach(({ resolve }) => resolve(token));
  refreshSubscribers = [];
}

/**
 * Notify all subscribers when token refresh fails
 */
function onTokenRefreshFailed(error: unknown): void {
  refreshSubscribers.forEach(({ reject }) => reject(error));
  refreshSubscribers = [];
}

/**
 * Attempt to refresh the access token
 *
 * POC-3 Phase 7.1: Updated to work with HttpOnly cookie-based refresh tokens
 * The refresh token is now sent automatically via HttpOnly cookie
 * We also send it in the body for backwards compatibility with non-cookie auth
 */
async function refreshAccessToken(
  tokenManager: TokenManager,
  baseURL: string
): Promise<{ accessToken: string; refreshToken: string }> {
  // Get refresh token from memory (if available, for backwards compatibility)
  const refreshToken = tokenManager.getRefreshToken();

  // POC-3 Phase 7.1: Include credentials to send HttpOnly cookies
  // The server will read the refresh token from the cookie
  // We also send it in body as fallback for backwards compatibility
  const response = await fetch(`${baseURL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Send HttpOnly cookies with request
    body: JSON.stringify(refreshToken ? { refreshToken } : {}),
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  const data = (await response.json()) as {
    success: boolean;
    data: {
      accessToken: string;
      refreshToken: string;
    };
  };

  if (!data.success || !data.data) {
    throw new Error('Invalid token refresh response');
  }

  return {
    accessToken: data.data.accessToken,
    refreshToken: data.data.refreshToken,
  };
}

/**
 * Setup request interceptor
 */
function setupRequestInterceptor(
  axiosInstance: AxiosInstance,
  tokenManager: TokenManager
): void {
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = tokenManager.getAccessToken();
      addTokenToRequest(config, token);

      // Add CSRF token for state-changing requests (POST, PUT, PATCH, DELETE)
      const method = config.method?.toUpperCase() || 'GET';
      if (requiresCsrfToken(method)) {
        const csrfToken = getCsrfToken();
        if (csrfToken && config.headers) {
          config.headers[CSRF_HEADER_NAME] = csrfToken;
        }
      }

      // Add request ID for tracing (optional)
      if (!config.headers['X-Request-ID']) {
        // Use a simple UUID v4 generator or fallback
        config.headers['X-Request-ID'] =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      }

      // Add device ID for device tracking (if available)
      if (typeof window !== 'undefined') {
        try {
          const deviceId = localStorage.getItem('mfe-device-id');
          if (deviceId && !config.headers['X-Device-ID']) {
            config.headers['X-Device-ID'] = deviceId;
          }
        } catch (_error) {
          // localStorage might not be available (e.g., in private browsing)
          // Silently fail - device ID is optional
        }
      }

      // POC-3 Phase 7.3: Add session fingerprint for security
      // The fingerprint helps detect session hijacking by verifying
      // the request comes from the same browser/device as the original session
      if (!config.headers[FINGERPRINT_HEADER_NAME]) {
        const fingerprintHeader = getFingerprintHeader();
        if (fingerprintHeader) {
          config.headers[FINGERPRINT_HEADER_NAME] = fingerprintHeader;
        }
      }

      return config;
    },
    error => {
      return Promise.reject(error);
    }
  );
}

/**
 * Setup response interceptor with error handling and token refresh
 */
function setupResponseInterceptor(
  axiosInstance: AxiosInstance,
  tokenManager: TokenManager,
  baseURL: string,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): void {
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as
        | InternalAxiosRequestConfig
        | undefined;

      // Handle 401 Unauthorized (token expired or invalid)
      if (error.response?.status === 401 && originalRequest) {
        // Skip token refresh for auth endpoints (login, register, refresh, mfa)
        // These endpoints return 401 for invalid credentials, not expired tokens
        const requestUrl = originalRequest.url || '';
        const isAuthEndpoint =
          requestUrl.includes('/auth/login') ||
          requestUrl.includes('/auth/register') ||
          requestUrl.includes('/auth/refresh') ||
          requestUrl.includes('/auth/mfa/');

        if (isAuthEndpoint) {
          // For auth endpoints, pass through the original error
          // so the UI can show appropriate error message
          if (error.response?.data) {
            const apiError = error.response.data as {
              error?: { message: string };
            };
            if (apiError.error?.message) {
              return Promise.reject(new Error(apiError.error.message));
            }
          }

          // Endpoint-specific fallback messages
          let fallbackMessage = 'Authentication failed. Please try again.';
          if (requestUrl.includes('/auth/login')) {
            fallbackMessage = 'Invalid email or password. Please try again.';
          } else if (requestUrl.includes('/auth/register')) {
            fallbackMessage =
              'Registration failed. Please check your details and try again.';
          } else if (requestUrl.includes('/auth/refresh')) {
            fallbackMessage = 'Session expired. Please sign in again.';
          } else if (requestUrl.includes('/auth/mfa/')) {
            fallbackMessage = 'Invalid MFA code. Please try again.';
          }

          return Promise.reject(new Error(fallbackMessage));
        }

        // If already refreshing, wait for it to complete
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            subscribeTokenRefresh(token => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(axiosInstance(originalRequest));
            }, reject);
          });
        }

        // Start token refresh
        isRefreshing = true;

        try {
          const { accessToken, refreshToken } = await refreshAccessToken(
            tokenManager,
            baseURL
          );

          tokenManager.setTokens(accessToken, refreshToken);
          onTokenRefreshed(accessToken);

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          isRefreshing = false;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          onTokenRefreshFailed(refreshError);
          tokenManager.clearTokens();

          // Don't retry if refresh failed
          return Promise.reject(refreshError);
        }
      }

      // Handle 403 Forbidden - could be CSRF error
      if (error.response?.status === 403 && originalRequest) {
        const apiError = error.response.data as {
          error?: {
            code: string;
            message: string;
          };
        };

        // Check if it's a CSRF error
        const errorCode = apiError?.error?.code;
        if (
          errorCode === 'CSRF_TOKEN_MISSING' ||
          errorCode === 'CSRF_TOKEN_INVALID'
        ) {
          // Check if we already retried CSRF refresh
          if ((originalRequest as { _csrfRetry?: boolean })._csrfRetry) {
            // Already retried, don't retry again
            const csrfError = new Error(
              apiError.error?.message || 'CSRF validation failed'
            );
            (csrfError as Error & { code?: string }).code = errorCode;
            return Promise.reject(csrfError);
          }

          // Mark as CSRF retry attempt
          (originalRequest as { _csrfRetry?: boolean })._csrfRetry = true;

          try {
            // Refresh CSRF token
            const newCsrfToken = await refreshCsrfToken(baseURL);

            if (newCsrfToken && originalRequest.headers) {
              // Update header with new token
              originalRequest.headers[CSRF_HEADER_NAME] = newCsrfToken;
              // Retry the request
              return axiosInstance(originalRequest);
            }
          } catch (csrfRefreshError) {
            console.warn('[CSRF] Failed to refresh CSRF token:', csrfRefreshError);
          }

          // CSRF refresh failed, reject with original error
          const csrfError = new Error(
            apiError.error?.message || 'CSRF validation failed'
          );
          (csrfError as Error & { code?: string }).code = errorCode;
          return Promise.reject(csrfError);
        }
      }

      // Handle retry logic for other errors
      if (
        retryConfig.retryCondition &&
        retryConfig.retryCondition(error) &&
        originalRequest &&
        (originalRequest as { _retry?: number })._retry !== undefined
      ) {
        const retryCount =
          ((originalRequest as { _retry?: number })._retry ?? 0) + 1;

        if (retryCount <= retryConfig.retries) {
          (originalRequest as { _retry?: number })._retry = retryCount;

          // Exponential backoff
          const delay = retryConfig.retryDelay * Math.pow(2, retryCount - 1);

          await new Promise(resolve => setTimeout(resolve, delay));

          return axiosInstance(originalRequest);
        }
      }

      // Transform error response to ApiError format
      if (error.response?.data) {
        const apiError = error.response.data as {
          success?: boolean;
          error?: {
            code: string;
            message: string;
            details?: unknown;
          };
        };

        if (apiError.error) {
          const transformedError = new Error(apiError.error.message);
          (
            transformedError as Error & { code?: string; details?: unknown }
          ).code = apiError.error.code;
          (
            transformedError as Error & { code?: string; details?: unknown }
          ).details = apiError.error.details;
          return Promise.reject(transformedError);
        }
      }

      return Promise.reject(error);
    }
  );
}

/**
 * Setup all interceptors
 */
export function setupInterceptors(
  axiosInstance: AxiosInstance,
  tokenManager: TokenManager,
  baseURL: string,
  retryConfig?: RetryConfig
): void {
  setupRequestInterceptor(axiosInstance, tokenManager);
  setupResponseInterceptor(axiosInstance, tokenManager, baseURL, retryConfig);
}
