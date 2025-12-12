/**
 * Interceptors Tests
 *
 * Tests for axios interceptors including:
 * - Request interceptor (token injection, request ID)
 * - Response interceptor (error handling, token refresh, retry logic)
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from '@jest/globals';
import {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosError,
  AxiosResponse,
} from 'axios';
import { setupInterceptors } from './interceptors';

// Mock fetch for token refresh
global.fetch = jest.fn() as jest.Mock;

describe('Interceptors', () => {
  let mockAxiosInstance: AxiosInstance;
  let requestMock: jest.Mock<Promise<AxiosResponse>>;

  let tokenManager: {
    getAccessToken: jest.Mock;
    getRefreshToken: jest.Mock;
    setTokens: jest.Mock;
    clearTokens: jest.Mock;
  };

  let requestInterceptor: (
    config: InternalAxiosRequestConfig
  ) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;
  let requestErrorInterceptor: (error: unknown) => unknown;
  let responseInterceptor: (
    response: AxiosResponse
  ) => AxiosResponse | Promise<AxiosResponse>;
  let responseErrorInterceptor: (error: AxiosError) => unknown;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    tokenManager = {
      getAccessToken: jest.fn(() => 'test-access-token'),
      getRefreshToken: jest.fn(() => 'test-refresh-token'),
      setTokens: jest.fn(),
      clearTokens: jest.fn(),
    };

    requestMock = jest.fn<Promise<AxiosResponse>>();

    // Create a callable function that also has interceptors and request method
    const axiosCallable = jest.fn<
      Promise<AxiosResponse>,
      [InternalAxiosRequestConfig]
    >((config: InternalAxiosRequestConfig) => {
      return requestMock(config);
    }) as unknown as AxiosInstance;

    // Add interceptors and request method to the callable function
    Object.assign(axiosCallable, {
      interceptors: {
        request: {
          use: jest.fn((onFulfilled, onRejected) => {
            if (onFulfilled) requestInterceptor = onFulfilled;
            if (onRejected) requestErrorInterceptor = onRejected;
            return 0;
          }),
        },
        response: {
          use: jest.fn((onFulfilled, onRejected) => {
            if (onFulfilled) responseInterceptor = onFulfilled;
            if (onRejected) responseErrorInterceptor = onRejected;
            return 0;
          }),
        },
      },
      request: requestMock,
    });

    mockAxiosInstance = axiosCallable;

    // Reset fetch mock
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Request Interceptor', () => {
    it('should add access token to Authorization header', () => {
      setupInterceptors(
        mockAxiosInstance,
        tokenManager,
        'http://localhost:3001'
      );

      const config: InternalAxiosRequestConfig = {
        headers: {},
      } as InternalAxiosRequestConfig;

      const result = requestInterceptor(config);

      expect(tokenManager.getAccessToken).toHaveBeenCalled();
      expect(result.headers.Authorization).toBe('Bearer test-access-token');
    });

    it('should not add token if token is null', () => {
      tokenManager.getAccessToken.mockReturnValue(null);

      setupInterceptors(
        mockAxiosInstance,
        tokenManager,
        'http://localhost:3001'
      );

      const config: InternalAxiosRequestConfig = {
        headers: {},
      } as InternalAxiosRequestConfig;

      const result = requestInterceptor(config);

      expect(result.headers.Authorization).toBeUndefined();
    });

    it('should add X-Request-ID header if not present', () => {
      setupInterceptors(
        mockAxiosInstance,
        tokenManager,
        'http://localhost:3001'
      );

      const config: InternalAxiosRequestConfig = {
        headers: {},
      } as InternalAxiosRequestConfig;

      const result = requestInterceptor(config);

      expect(result.headers['X-Request-ID']).toBeDefined();
      expect(typeof result.headers['X-Request-ID']).toBe('string');
    });

    it('should not override existing X-Request-ID header', () => {
      setupInterceptors(
        mockAxiosInstance,
        tokenManager,
        'http://localhost:3001'
      );

      const config: InternalAxiosRequestConfig = {
        headers: {
          'X-Request-ID': 'existing-id',
        },
      } as InternalAxiosRequestConfig;

      const result = requestInterceptor(config);

      expect(result.headers['X-Request-ID']).toBe('existing-id');
    });

    it('should handle request error', () => {
      setupInterceptors(
        mockAxiosInstance,
        tokenManager,
        'http://localhost:3001'
      );

      const error = new Error('Request error');
      const result = requestErrorInterceptor(error);

      expect(result).rejects.toBe(error);
    });
  });

  describe('Response Interceptor', () => {
    it('should pass through successful responses', () => {
      setupInterceptors(
        mockAxiosInstance,
        tokenManager,
        'http://localhost:3001'
      );

      const response: AxiosResponse = {
        status: 200,
        data: { success: true },
      } as AxiosResponse;

      const result = responseInterceptor(response);

      expect(result).toBe(response);
    });

    it('should handle 401 error and refresh token', async () => {
      const mockResponse = {
        success: true,
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      requestMock.mockResolvedValue({
        status: 200,
        data: { success: true },
      } as AxiosResponse);

      setupInterceptors(
        mockAxiosInstance,
        tokenManager,
        'http://localhost:3001'
      );

      const originalRequest: InternalAxiosRequestConfig = {
        headers: {},
        url: '/test',
        method: 'get',
      } as InternalAxiosRequestConfig;

      const error = {
        response: {
          status: 401,
        },
        config: originalRequest,
      } as AxiosError;

      const resultPromise = responseErrorInterceptor(error) as Promise<unknown>;

      await resultPromise;

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/auth/refresh',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: 'test-refresh-token' }),
        })
      );

      expect(tokenManager.setTokens).toHaveBeenCalledWith(
        'new-access-token',
        'new-refresh-token'
      );

      expect(requestMock).toHaveBeenCalled();
    });

    it('should handle multiple 401 errors during token refresh', async () => {
      const mockResponse = {
        success: true,
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      requestMock.mockResolvedValue({
        status: 200,
        data: { success: true },
      } as AxiosResponse);

      setupInterceptors(
        mockAxiosInstance,
        tokenManager,
        'http://localhost:3001'
      );

      const originalRequest1: InternalAxiosRequestConfig = {
        headers: {},
        url: '/test1',
        method: 'get',
      } as InternalAxiosRequestConfig;

      const originalRequest2: InternalAxiosRequestConfig = {
        headers: {},
        url: '/test2',
        method: 'get',
      } as InternalAxiosRequestConfig;

      const error1 = {
        response: { status: 401 },
        config: originalRequest1,
      } as AxiosError;

      const error2 = {
        response: { status: 401 },
        config: originalRequest2,
      } as AxiosError;

      // Start first request (triggers refresh)
      const promise1 = responseErrorInterceptor(error1) as Promise<unknown>;

      // Start second request (should wait for refresh)
      const promise2 = responseErrorInterceptor(error2) as Promise<unknown>;

      await Promise.all([promise1, promise2]);

      // Should only call fetch once (single refresh)
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should clear tokens and reject on refresh failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
      });

      setupInterceptors(
        mockAxiosInstance,
        tokenManager,
        'http://localhost:3001'
      );

      const originalRequest: InternalAxiosRequestConfig = {
        headers: {},
        url: '/test',
        method: 'get',
      } as InternalAxiosRequestConfig;

      const error = {
        response: { status: 401 },
        config: originalRequest,
      } as AxiosError;

      const resultPromise = responseErrorInterceptor(error) as Promise<unknown>;

      await expect(resultPromise).rejects.toBeDefined();
      expect(tokenManager.clearTokens).toHaveBeenCalled();
    });

    it('should handle refresh token missing', async () => {
      tokenManager.getRefreshToken.mockReturnValue(null);

      setupInterceptors(
        mockAxiosInstance,
        tokenManager,
        'http://localhost:3001'
      );

      const originalRequest: InternalAxiosRequestConfig = {
        headers: {},
        url: '/test',
        method: 'get',
      } as InternalAxiosRequestConfig;

      const error = {
        response: { status: 401 },
        config: originalRequest,
      } as AxiosError;

      const resultPromise = responseErrorInterceptor(error) as Promise<unknown>;

      await expect(resultPromise).rejects.toThrow('No refresh token available');
    });

    it('should transform API error responses', async () => {
      setupInterceptors(
        mockAxiosInstance,
        tokenManager,
        'http://localhost:3001'
      );

      const apiError = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: { field: 'email' },
        },
      };

      const error = {
        response: {
          status: 400,
          data: apiError,
        },
        config: {} as InternalAxiosRequestConfig,
      } as AxiosError;

      const resultPromise = responseErrorInterceptor(error) as Promise<unknown>;

      await expect(resultPromise).rejects.toMatchObject({
        message: 'Invalid input',
        code: 'VALIDATION_ERROR',
        details: { field: 'email' },
      });
    });

    it('should handle retry logic for network errors', async () => {
      setupInterceptors(
        mockAxiosInstance,
        tokenManager,
        'http://localhost:3001'
      );

      const originalRequest: InternalAxiosRequestConfig = {
        headers: {},
        url: '/test',
        method: 'get',
        _retry: 0,
      } as InternalAxiosRequestConfig;

      const error = {
        response: undefined, // Network error
        config: originalRequest,
      } as AxiosError;

      requestMock.mockResolvedValue({
        status: 200,
        data: { success: true },
      } as AxiosResponse);

      const resultPromise = responseErrorInterceptor(error) as Promise<unknown>;

      // Fast-forward timers for retry delay
      jest.advanceTimersByTime(2000);

      await resultPromise;

      expect(requestMock).toHaveBeenCalled();
    });

    it('should handle retry logic for 5xx errors', async () => {
      setupInterceptors(
        mockAxiosInstance,
        tokenManager,
        'http://localhost:3001'
      );

      const originalRequest: InternalAxiosRequestConfig = {
        headers: {},
        url: '/test',
        method: 'get',
        _retry: 0,
      } as InternalAxiosRequestConfig;

      const error = {
        response: {
          status: 500,
        },
        config: originalRequest,
      } as AxiosError;

      requestMock.mockResolvedValue({
        status: 200,
        data: { success: true },
      } as AxiosResponse);

      const resultPromise = responseErrorInterceptor(error) as Promise<unknown>;

      jest.advanceTimersByTime(2000);

      await resultPromise;

      expect(requestMock).toHaveBeenCalled();
    });

    it('should not retry if retry count exceeded', async () => {
      setupInterceptors(
        mockAxiosInstance,
        tokenManager,
        'http://localhost:3001'
      );

      const originalRequest: InternalAxiosRequestConfig = {
        headers: {},
        url: '/test',
        method: 'get',
        _retry: 3, // Already at max retries
      } as InternalAxiosRequestConfig;

      const error = {
        response: undefined,
        config: originalRequest,
      } as AxiosError;

      const resultPromise = responseErrorInterceptor(error) as Promise<unknown>;

      await expect(resultPromise).rejects.toBe(error);
      expect(requestMock).not.toHaveBeenCalled();
    });

    it('should not retry if retry condition is false', async () => {
      setupInterceptors(
        mockAxiosInstance,
        tokenManager,
        'http://localhost:3001',
        {
          retries: 3,
          retryDelay: 1000,
          retryCondition: () => false, // Never retry
        }
      );

      const originalRequest: InternalAxiosRequestConfig = {
        headers: {},
        url: '/test',
        method: 'get',
        _retry: 0,
      } as InternalAxiosRequestConfig;

      const error = {
        response: undefined,
        config: originalRequest,
      } as AxiosError;

      const resultPromise = responseErrorInterceptor(error) as Promise<unknown>;

      await expect(resultPromise).rejects.toBe(error);
      expect(requestMock).not.toHaveBeenCalled();
    });
  });

  describe('setupInterceptors', () => {
    it('should setup both request and response interceptors', () => {
      setupInterceptors(
        mockAxiosInstance,
        tokenManager,
        'http://localhost:3001'
      );

      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });
});
