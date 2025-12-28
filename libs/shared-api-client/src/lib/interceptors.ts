/**
 * Axios Interceptors
 *
 * Handles:
 * - Request interceptor: Adds JWT token to Authorization header
 * - Response interceptor: Handles errors, token refresh, and retry logic
 */

import {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from 'axios';

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
 */
async function refreshAccessToken(
  tokenManager: TokenManager,
  baseURL: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const refreshToken = tokenManager.getRefreshToken();

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(`${baseURL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
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
