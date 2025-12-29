// Mock the API client BEFORE imports to prevent initialization errors
jest.mock('@mfe/shared-api-client', () => ({
  getApiClient: jest.fn(() => ({
    get: jest.fn(),
    put: jest.fn(),
    setTokenProvider: jest.fn(),
  })),
}));

import { renderHook, act } from '@testing-library/react';
import {
  useThemeStore,
  useTheme,
  useResolvedTheme,
  type Theme,
} from './theme-store';
import * as apiClient from '@mfe/shared-api-client';

// TODO: Fix theme-store test configuration issues
describe.skip('theme-store', () => {
  beforeEach(() => {
    // Clear DOM
    document.documentElement.classList.remove('dark');

    // Reset store state
    useThemeStore.setState({
      theme: 'system',
      resolvedTheme: 'light',
      isLoading: false,
      error: null,
    });

    // Reset mock
    jest.clearAllMocks();
  });

  describe('useThemeStore', () => {
    it('should initialize with system preference', () => {
      const { result } = renderHook(() => useThemeStore());

      expect(result.current.theme).toBe('system');
      expect(result.current.resolvedTheme).toBeDefined();
      expect(['light', 'dark']).toContain(result.current.resolvedTheme);
    });

    it('should set theme and update resolved theme', async () => {
      const mockApiClient = {
        get: jest.fn(),
        put: jest.fn().mockResolvedValue({ success: true }),
      };
      (apiClient.getApiClient as jest.Mock).mockReturnValue(mockApiClient);

      const { result } = renderHook(() => useThemeStore());

      await act(async () => {
        await result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
      expect(result.current.resolvedTheme).toBe('dark');
      expect(mockApiClient.put).toHaveBeenCalledWith('/profile/preferences', {
        theme: 'dark',
      });
    });

    it('should set light theme', async () => {
      const mockApiClient = {
        get: jest.fn(),
        put: jest.fn().mockResolvedValue({ success: true }),
      };
      (apiClient.getApiClient as jest.Mock).mockReturnValue(mockApiClient);

      const { result } = renderHook(() => useThemeStore());

      await act(async () => {
        await result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
      expect(result.current.resolvedTheme).toBe('light');
    });

    it('should apply dark class to html element when theme is dark', async () => {
      const mockApiClient = {
        get: jest.fn(),
        put: jest.fn().mockResolvedValue({ success: true }),
      };
      (apiClient.getApiClient as jest.Mock).mockReturnValue(mockApiClient);

      const { result } = renderHook(() => useThemeStore());

      await act(async () => {
        await result.current.setTheme('dark');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should remove dark class from html element when theme is light', async () => {
      const mockApiClient = {
        get: jest.fn(),
        put: jest.fn().mockResolvedValue({ success: true }),
      };
      (apiClient.getApiClient as jest.Mock).mockReturnValue(mockApiClient);

      const { result } = renderHook(() => useThemeStore());

      // Set to dark first
      await act(async () => {
        await result.current.setTheme('dark');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);

      // Then set to light
      await act(async () => {
        await result.current.setTheme('light');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should resolve system theme to light or dark', async () => {
      const mockApiClient = {
        get: jest.fn(),
        put: jest.fn().mockResolvedValue({ success: true }),
      };
      (apiClient.getApiClient as jest.Mock).mockReturnValue(mockApiClient);

      const { result } = renderHook(() => useThemeStore());

      await act(async () => {
        await result.current.setTheme('system');
      });

      expect(result.current.theme).toBe('system');
      expect(['light', 'dark']).toContain(result.current.resolvedTheme);
    });

    it('should initialize with stored theme', async () => {
      const mockApiClient = {
        get: jest.fn(),
        put: jest.fn(),
      };
      (apiClient.getApiClient as jest.Mock).mockReturnValue(mockApiClient);

      const { result } = renderHook(() => useThemeStore());

      await act(async () => {
        await result.current.initializeTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
      expect(result.current.resolvedTheme).toBe('dark');
      expect(result.current.isLoading).toBe(false);
    });

    it('should fetch theme from API on initialize', async () => {
      const mockApiClient = {
        get: jest.fn().mockResolvedValue({
          success: true,
          data: { theme: 'dark' },
        }),
        put: jest.fn(),
      };
      (apiClient.getApiClient as jest.Mock).mockReturnValue(mockApiClient);

      const { result } = renderHook(() => useThemeStore());

      await act(async () => {
        await result.current.initializeTheme();
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('/profile/preferences');
      expect(result.current.theme).toBe('dark');
      expect(result.current.isLoading).toBe(false);
    });

    it('should fallback to system when API returns no theme', async () => {
      const mockApiClient = {
        get: jest.fn().mockResolvedValue({
          success: true,
          data: {},
        }),
        put: jest.fn(),
      };
      (apiClient.getApiClient as jest.Mock).mockReturnValue(mockApiClient);

      const { result } = renderHook(() => useThemeStore());

      await act(async () => {
        await result.current.initializeTheme();
      });

      expect(result.current.theme).toBe('system');
      expect(['light', 'dark']).toContain(result.current.resolvedTheme);
    });

    it('should handle API errors gracefully', async () => {
      const mockApiClient = {
        get: jest.fn().mockRejectedValue(new Error('Network error')),
        put: jest.fn(),
      };
      (apiClient.getApiClient as jest.Mock).mockReturnValue(mockApiClient);

      const { result } = renderHook(() => useThemeStore());

      await act(async () => {
        await result.current.initializeTheme();
      });

      // Should fallback to system
      expect(result.current.theme).toBe('system');
      expect(result.current.isLoading).toBe(false);
    });

    it('should apply theme to DOM during initialization', async () => {
      const mockApiClient = {
        get: jest.fn(),
        put: jest.fn(),
      };
      (apiClient.getApiClient as jest.Mock).mockReturnValue(mockApiClient);

      const { result } = renderHook(() => useThemeStore());

      await act(async () => {
        await result.current.initializeTheme('dark');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should update local state immediately even if API fails', async () => {
      const mockApiClient = {
        get: jest.fn(),
        put: jest.fn().mockRejectedValue(new Error('API error')),
      };
      (apiClient.getApiClient as jest.Mock).mockReturnValue(mockApiClient);

      const { result } = renderHook(() => useThemeStore());

      await act(async () => {
        await result.current.setTheme('dark');
      });

      // Local state should be updated despite API failure
      expect(result.current.theme).toBe('dark');
      expect(result.current.resolvedTheme).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should clear error', () => {
      const { result } = renderHook(() => useThemeStore());

      // Simulate an error
      act(() => {
        useThemeStore.setState({ error: 'Test error' });
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('useTheme hook', () => {
    it('should return theme state and actions', () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current).toHaveProperty('theme');
      expect(result.current).toHaveProperty('resolvedTheme');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('setTheme');
      expect(result.current).toHaveProperty('initializeTheme');
      expect(result.current).toHaveProperty('clearError');
    });

    it('should update when theme changes', async () => {
      const mockApiClient = {
        get: jest.fn(),
        put: jest.fn().mockResolvedValue({ success: true }),
      };
      (apiClient.getApiClient as jest.Mock).mockReturnValue(mockApiClient);

      const { result, rerender } = renderHook(() => useTheme());

      const initialTheme = result.current.theme;

      await act(async () => {
        await result.current.setTheme('dark');
      });

      rerender();

      expect(result.current.theme).not.toBe(initialTheme);
      expect(result.current.theme).toBe('dark');
    });

    it('should allow setting theme through hook', async () => {
      const mockApiClient = {
        get: jest.fn(),
        put: jest.fn().mockResolvedValue({ success: true }),
      };
      (apiClient.getApiClient as jest.Mock).mockReturnValue(mockApiClient);

      const { result } = renderHook(() => useTheme());

      await act(async () => {
        await result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
    });
  });

  describe('useResolvedTheme hook', () => {
    it('should return only resolved theme', () => {
      const { result } = renderHook(() => useResolvedTheme());

      expect(['light', 'dark']).toContain(result.current);
    });

    it('should update when resolved theme changes', async () => {
      const mockApiClient = {
        get: jest.fn(),
        put: jest.fn().mockResolvedValue({ success: true }),
      };
      (apiClient.getApiClient as jest.Mock).mockReturnValue(mockApiClient);

      const { result: storeResult } = renderHook(() => useThemeStore());
      const { result: resolvedResult, rerender } = renderHook(() =>
        useResolvedTheme()
      );

      const initialTheme = resolvedResult.current;

      // Switch to a different resolved theme
      const otherTheme = initialTheme === 'light' ? 'dark' : 'light';

      await act(async () => {
        await storeResult.current.setTheme(otherTheme as Theme);
      });

      rerender();

      expect(resolvedResult.current).toBe(otherTheme);
    });
  });

  describe('system preference detection', () => {
    it('should have system preference defined', () => {
      const { result } = renderHook(() => useThemeStore());

      act(() => {
        useThemeStore.setState({ theme: 'system' });
      });

      expect(result.current.resolvedTheme).toBeDefined();
      expect(['light', 'dark']).toContain(result.current.resolvedTheme);
    });
  });
});
