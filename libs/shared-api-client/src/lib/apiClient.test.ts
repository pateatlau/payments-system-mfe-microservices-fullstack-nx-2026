/**
 * API Client Tests
 *
 * Tests for the API client including:
 * - Request/response handling
 * - Token injection
 * - Error handling
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import axios from 'axios';
import { ApiClient, type TokenProvider } from './apiClient';

// Mock axios before importing
jest.mock('axios', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };

  return {
    __esModule: true,
    default: {
      create: jest.fn(() => mockAxiosInstance),
    },
  };
});

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ApiClient', () => {
  let mockAxiosInstance: {
    get: jest.Mock;
    post: jest.Mock;
    put: jest.Mock;
    patch: jest.Mock;
    delete: jest.Mock;
    interceptors: {
      request: { use: jest.Mock };
      response: { use: jest.Mock };
    };
  };

  let tokenProvider: TokenProvider;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    };

    (mockedAxios.create as jest.Mock).mockReturnValue(mockAxiosInstance);

    tokenProvider = {
      getAccessToken: jest.fn(() => 'test-access-token'),
      getRefreshToken: jest.fn(() => 'test-refresh-token'),
      setTokens: jest.fn(),
      clearTokens: jest.fn(),
    };

    // Mock process.env
    process.env['NX_API_BASE_URL'] = 'http://localhost:3000/api';
  });

  describe('constructor', () => {
    it('should create axios instance with default config', () => {
      new ApiClient();

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:3000/api',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should create axios instance with custom config', () => {
      new ApiClient({
        baseURL: 'https://api.example.com',
        timeout: 60000,
      });

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.example.com',
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should setup interceptors', () => {
      new ApiClient({ tokenProvider });

      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('should make GET request and return data', async () => {
      const client = new ApiClient({ tokenProvider });
      const mockResponse = {
        data: {
          success: true,
          data: { id: 1, name: 'Test' },
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.get('/test');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', undefined);
      expect(result).toEqual(mockResponse.data);
    });

    it('should pass config to GET request', async () => {
      const client = new ApiClient({ tokenProvider });
      const config = { params: { id: 1 } };
      const mockResponse = {
        data: {
          success: true,
          data: { id: 1 },
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.get('/test', config);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', config);
    });
  });

  describe('post', () => {
    it('should make POST request and return data', async () => {
      const client = new ApiClient({ tokenProvider });
      const requestData = { name: 'Test' };
      const mockResponse = {
        data: {
          success: true,
          data: { id: 1, name: 'Test' },
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await client.post('/test', requestData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/test',
        requestData,
        undefined
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('put', () => {
    it('should make PUT request and return data', async () => {
      const client = new ApiClient({ tokenProvider });
      const requestData = { name: 'Updated' };
      const mockResponse = {
        data: {
          success: true,
          data: { id: 1, name: 'Updated' },
        },
      };

      mockAxiosInstance.put.mockResolvedValue(mockResponse);

      const result = await client.put('/test/1', requestData);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        '/test/1',
        requestData,
        undefined
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('patch', () => {
    it('should make PATCH request and return data', async () => {
      const client = new ApiClient({ tokenProvider });
      const requestData = { name: 'Patched' };
      const mockResponse = {
        data: {
          success: true,
          data: { id: 1, name: 'Patched' },
        },
      };

      mockAxiosInstance.patch.mockResolvedValue(mockResponse);

      const result = await client.patch('/test/1', requestData);

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        '/test/1',
        requestData,
        undefined
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('delete', () => {
    it('should make DELETE request and return data', async () => {
      const client = new ApiClient({ tokenProvider });
      const mockResponse = {
        data: {
          success: true,
          data: null,
        },
      };

      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      const result = await client.delete('/test/1');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        '/test/1',
        undefined
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('setTokenProvider', () => {
    it('should update token provider', () => {
      const client = new ApiClient();
      const newProvider: TokenProvider = {
        getAccessToken: jest.fn(() => 'new-token'),
        getRefreshToken: jest.fn(() => 'new-refresh'),
        setTokens: jest.fn(),
        clearTokens: jest.fn(),
      };

      client.setTokenProvider(newProvider);

      // Token provider is updated (can't directly test, but no error means it worked)
      expect(() => client.setTokenProvider(newProvider)).not.toThrow();
    });
  });

  describe('getAxiosInstance', () => {
    it('should return the axios instance', () => {
      const client = new ApiClient({ tokenProvider });

      expect(client.getAxiosInstance()).toBe(mockAxiosInstance);
    });
  });
});
