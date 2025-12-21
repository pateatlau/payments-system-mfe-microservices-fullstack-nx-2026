import { renderHook, act } from '@testing-library/react';
import {
  useThemeStore,
  useTheme,
  useResolvedTheme,
  type Theme,
} from './theme-store';

describe('theme-store', () => {
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
  });

  describe('useThemeStore', () => {
    it('should initialize with system preference', () => {
      const { result } = renderHook(() => useThemeStore());

      expect(result.current.theme).toBe('system');
      expect(result.current.resolvedTheme).toBeDefined();
      expect(['light', 'dark']).toContain(result.current.resolvedTheme);
    });

    it('should set theme and update resolved theme', () => {
      const { result } = renderHook(() => useThemeStore());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
      expect(result.current.resolvedTheme).toBe('dark');
    });

    it('should set light theme', () => {
      const { result } = renderHook(() => useThemeStore());

      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
      expect(result.current.resolvedTheme).toBe('light');
    });

    it('should apply dark class to html element when theme is dark', () => {
      const { result } = renderHook(() => useThemeStore());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should remove dark class from html element when theme is light', () => {
      const { result } = renderHook(() => useThemeStore());

      // Set to dark first
      act(() => {
        result.current.setTheme('dark');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);

      // Then set to light
      act(() => {
        result.current.setTheme('light');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should resolve system theme to light or dark', () => {
      const { result } = renderHook(() => useThemeStore());

      act(() => {
        result.current.setTheme('system');
      });

      expect(result.current.theme).toBe('system');
      expect(['light', 'dark']).toContain(result.current.resolvedTheme);
    });

    it('should initialize with stored theme', () => {
      const { result } = renderHook(() => useThemeStore());

      act(() => {
        result.current.initializeTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
      expect(result.current.resolvedTheme).toBe('dark');
      expect(result.current.isLoading).toBe(false);
    });

    it('should initialize with system when no stored theme provided', () => {
      const { result } = renderHook(() => useThemeStore());

      act(() => {
        result.current.initializeTheme();
      });

      expect(result.current.theme).toBe('system');
      expect(['light', 'dark']).toContain(result.current.resolvedTheme);
      expect(result.current.isLoading).toBe(false);
    });

    it('should apply theme to DOM during initialization', () => {
      const { result } = renderHook(() => useThemeStore());

      act(() => {
        result.current.initializeTheme('dark');
      });

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

    it('should update when theme changes', () => {
      const { result, rerender } = renderHook(() => useTheme());

      const initialTheme = result.current.theme;

      act(() => {
        result.current.setTheme('dark');
      });

      rerender();

      expect(result.current.theme).not.toBe(initialTheme);
      expect(result.current.theme).toBe('dark');
    });

    it('should allow setting theme through hook', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
    });
  });

  describe('useResolvedTheme hook', () => {
    it('should return only resolved theme', () => {
      const { result } = renderHook(() => useResolvedTheme());

      expect(['light', 'dark']).toContain(result.current);
    });

    it('should update when resolved theme changes', () => {
      const { result: storeResult } = renderHook(() => useThemeStore());
      const { result: resolvedResult, rerender } = renderHook(() =>
        useResolvedTheme()
      );

      const initialTheme = resolvedResult.current;

      // Switch to a different resolved theme
      const otherTheme = initialTheme === 'light' ? 'dark' : 'light';

      act(() => {
        storeResult.current.setTheme(otherTheme as Theme);
      });

      rerender();

      expect(resolvedResult.current).toBe(otherTheme);
    });
  });

  describe('system preference detection', () => {
    it('should have system preference defined', () => {
      const { result } = renderHook(() => useThemeStore());

      act(() => {
        result.current.initializeTheme();
      });

      expect(result.current.resolvedTheme).toBeDefined();
      expect(['light', 'dark']).toContain(result.current.resolvedTheme);
    });
  });
});
