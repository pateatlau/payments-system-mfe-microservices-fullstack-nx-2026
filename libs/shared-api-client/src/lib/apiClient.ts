/**
 * API Client
 *
 * Provides a type-safe HTTP client with:
 * - JWT token injection via request interceptor
 * - Automatic token refresh on 401 errors
 * - Error handling and retry logic
 * - Type-safe request/response handling
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { setupInterceptors } from './interceptors';

/**
 * Token provider interface
 * Allows injecting token management from auth store
 */
export interface TokenProvider {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearTokens: () => void;
}

/**
 * API Client configuration
 */
export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  tokenProvider?: TokenProvider;
  onTokenRefresh?: (accessToken: string, refreshToken: string) => void;
  onUnauthorized?: () => void;
  refreshURL?: string; // Optional: Override URL for token refresh (defaults to baseURL)
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * API Error response
 */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Resolve the API base URL at runtime
 * This function is called lazily when the axios instance is first needed,
 * ensuring that runtime overrides (like window.__ENV__) have been loaded.
 *
 * URL Resolution Order:
 * 1. Explicit config.baseURL (passed to ApiClient constructor)
 * 2. Runtime window.__ENV__?.API_BASE_URL (for CI/runtime override)
 * 3. Build-time process.env.NX_API_BASE_URL (replaced by DefinePlugin)
 * 4. Default: https://localhost/api (nginx proxy for local dev)
 */
function resolveBaseURL(configBaseURL?: string): string {
  // Debug logging to diagnose URL resolution in CI
  const debug = typeof window !== 'undefined' && (window as unknown as { __DEBUG_API_URL__?: boolean }).__DEBUG_API_URL__;

  // 1. Explicit config takes highest priority
  if (configBaseURL) {
    if (debug) console.log('[ApiClient] Using explicit config baseURL:', configBaseURL);
    return configBaseURL;
  }

  // 2. Check for runtime override (useful for CI where we inject env.js after build)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const runtimeBaseURL = typeof window !== 'undefined' ? (window as any).__ENV__?.API_BASE_URL : undefined;
  if (debug) console.log('[ApiClient] window.__ENV__?.API_BASE_URL:', runtimeBaseURL);
  if (runtimeBaseURL) {
    if (debug) console.log('[ApiClient] Using runtime baseURL:', runtimeBaseURL);
    return runtimeBaseURL;
  }

  // 3. Build-time environment variable (replaced by DefinePlugin)
  const envBaseURL = process.env.NX_API_BASE_URL;
  if (debug) console.log('[ApiClient] process.env.NX_API_BASE_URL:', envBaseURL);
  if (envBaseURL) {
    if (debug) console.log('[ApiClient] Using build-time baseURL:', envBaseURL);
    return envBaseURL;
  }

  // 4. Default fallback
  if (debug) console.log('[ApiClient] Using default fallback URL');
  return 'https://localhost/api';
}

/**
 * Type-safe API Client
 *
 * IMPORTANT: The axios instance is created lazily on first use to ensure
 * runtime configuration (like window.__ENV__) has been loaded before
 * determining the base URL. This is critical for CI environments where
 * env.js is injected at runtime.
 */
export class ApiClient {
  private _axiosInstance: AxiosInstance | null = null;
  private tokenProvider?: TokenProvider;
  private onTokenRefresh?: (accessToken: string, refreshToken: string) => void;
  private onUnauthorized?: () => void;
  private configBaseURL?: string;
  private configTimeout: number;
  private configRefreshURL?: string;

  constructor(config: ApiClientConfig = {}) {
    // Store config for lazy initialization
    this.configBaseURL = config.baseURL;
    this.configTimeout = config.timeout ?? 30000;
    this.configRefreshURL = config.refreshURL;
    this.tokenProvider = config.tokenProvider;
    this.onTokenRefresh = config.onTokenRefresh;
    this.onUnauthorized = config.onUnauthorized;
  }

  /**
   * Get or create the axios instance lazily
   * This ensures runtime config (window.__ENV__) is available
   */
  private get axiosInstance(): AxiosInstance {
    if (!this._axiosInstance) {
      const baseURL = resolveBaseURL(this.configBaseURL);
      const refreshURL = this.configRefreshURL ?? baseURL;

      this._axiosInstance = axios.create({
        baseURL,
        timeout: this.configTimeout,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Setup interceptors
      setupInterceptors(
        this._axiosInstance,
        {
          getAccessToken: () => this.tokenProvider?.getAccessToken() ?? null,
          getRefreshToken: () => this.tokenProvider?.getRefreshToken() ?? null,
          setTokens: (accessToken, refreshToken) => {
            this.tokenProvider?.setTokens(accessToken, refreshToken);
            this.onTokenRefresh?.(accessToken, refreshToken);
          },
          clearTokens: () => {
            this.tokenProvider?.clearTokens();
            this.onUnauthorized?.();
          },
        },
        refreshURL
      );
    }
    return this._axiosInstance;
  }

  /**
   * GET request
   */
  async get<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  /**
   * POST request
   */
  async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.post<ApiResponse<T>>(
      url,
      data,
      config
    );
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.put<ApiResponse<T>>(
      url,
      data,
      config
    );
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.patch<ApiResponse<T>>(
      url,
      data,
      config
    );
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.delete<ApiResponse<T>>(
      url,
      config
    );
    return response.data;
  }

  /**
   * Get the underlying Axios instance (for advanced usage)
   */
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  /**
   * Update token provider (useful when auth store is initialized)
   */
  setTokenProvider(provider: TokenProvider): void {
    this.tokenProvider = provider;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.tokenProvider?.getAccessToken();
    return !!token;
  }
}

/**
 * Default API client instance
 * Can be configured via environment variables or by creating a new instance
 *
 * Note: This is created lazily to avoid issues during module initialization
 * in test environments where axios might not be properly mocked yet.
 */
let defaultApiClient: ApiClient | null = null;

export function getApiClient(): ApiClient {
  if (!defaultApiClient) {
    defaultApiClient = new ApiClient();
  }
  return defaultApiClient;
}

/**
 * Default API client instance (lazy initialization)
 * Use getApiClient() for explicit initialization
 */
export const apiClient = new Proxy({} as ApiClient, {
  get(_target, prop) {
    return getApiClient()[prop as keyof ApiClient];
  },
});
