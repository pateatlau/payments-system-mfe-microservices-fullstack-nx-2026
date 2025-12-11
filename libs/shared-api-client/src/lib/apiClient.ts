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
 * Type-safe API Client
 */
export class ApiClient {
  private axiosInstance: AxiosInstance;
  private tokenProvider?: TokenProvider;
  private onTokenRefresh?: (accessToken: string, refreshToken: string) => void;
  private onUnauthorized?: () => void;

  constructor(config: ApiClientConfig = {}) {
    // POC-3: Using API Gateway
    // Development: Direct to API Gateway (http://localhost:3000/api)
    // Production: Through nginx proxy (https://localhost/api)
    // API Gateway proxies to backend services (Auth, Payments, Admin, Profile)

    // Access environment variable (replaced by DefinePlugin at build time in browser)
    // DefinePlugin replaces process.env.NX_API_BASE_URL with the actual string value
    // Use dot notation so DefinePlugin can replace it properly
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const envBaseURL =
      typeof process !== 'undefined' && process.env
        ? (process.env as { NX_API_BASE_URL?: string }).NX_API_BASE_URL
        : undefined;
    // Default to direct API Gateway URL for development
    const baseURL = config.baseURL ?? envBaseURL ?? 'http://localhost:3000/api';

    this.axiosInstance = axios.create({
      baseURL,
      timeout: config.timeout ?? 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.tokenProvider = config.tokenProvider;
    this.onTokenRefresh = config.onTokenRefresh;
    this.onUnauthorized = config.onUnauthorized;

    // Setup interceptors
    // Use refreshURL if provided, otherwise use baseURL (for services other than auth)
    const refreshURL = config.refreshURL ?? baseURL;

    setupInterceptors(
      this.axiosInstance,
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
