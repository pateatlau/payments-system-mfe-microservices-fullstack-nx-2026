import { create } from 'zustand';

/**
 * Theme type - user preference ('light', 'dark', or 'system' to follow OS preference)
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Resolved theme - the actual theme to use after resolving 'system' preference
 */
export type ResolvedTheme = 'light' | 'dark';

/**
 * Theme state interface
 */
export interface ThemeState {
  // User's theme preference ('light' | 'dark' | 'system')
  theme: Theme;

  // Resolved theme after system preference detection ('light' | 'dark')
  resolvedTheme: ResolvedTheme;

  // Loading state during API fetch
  isLoading: boolean;

  // Error message if theme operations fail
  error: string | null;

  // Set theme preference and apply it
  setTheme: (theme: Theme) => void;

  // Initialize theme from system preference or stored value
  initializeTheme: (storedTheme?: Theme) => void;

  // Clear error message
  clearError: () => void;
}

/**
 * Get system preference for color scheme
 * Returns 'light' or 'dark' based on OS preference
 */
function getSystemPreference(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';

  try {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    return darkModeQuery.matches ? 'dark' : 'light';
  } catch {
    // Fallback if matchMedia is not available
    return 'light';
  }
}

/**
 * Calculate resolved theme
 * If theme is 'system', use system preference; otherwise use the theme directly
 */
function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === 'system' ? getSystemPreference() : theme;
}

/**
 * Apply theme to DOM
 * Adds or removes 'dark' class on html element
 */
function applyThemeToDom(resolvedTheme: ResolvedTheme): void {
  if (typeof document === 'undefined') return;

  const htmlElement = document.documentElement;

  if (resolvedTheme === 'dark') {
    htmlElement.classList.add('dark');
  } else {
    htmlElement.classList.remove('dark');
  }
}

/**
 * Zustand theme store
 * Manages theme state, applies theme to DOM, and handles system preference changes
 */
export const useThemeStore = create<ThemeState>((set, get) => {
  // Set up listener for system preference changes
  if (typeof window !== 'undefined') {
    try {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemPreferenceChange = () => {
        const { theme } = get();

        // Only update resolved theme if user preference is 'system'
        if (theme === 'system') {
          const newResolvedTheme = resolveTheme(theme);
          set({ resolvedTheme: newResolvedTheme });
          applyThemeToDom(newResolvedTheme);
        }
      };

      // Use addEventListener for better browser support
      darkModeQuery.addEventListener('change', handleSystemPreferenceChange);
    } catch {
      // Fallback if matchMedia is not available in test environment
      // System preference detection will just default to 'light'
    }
  }

  return {
    theme: 'system',
    resolvedTheme: getSystemPreference(),
    isLoading: false,
    error: null,

    setTheme: (theme: Theme) => {
      try {
        const resolvedTheme = resolveTheme(theme);
        set({
          theme,
          resolvedTheme,
          error: null,
        });
        applyThemeToDom(resolvedTheme);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to set theme';
        set({ error: errorMessage });
      }
    },

    initializeTheme: (storedTheme?: Theme) => {
      try {
        set({ isLoading: true });

        // Use stored theme or default to 'system'
        const themeToApply = storedTheme ?? 'system';
        const resolvedTheme = resolveTheme(themeToApply);

        set({
          theme: themeToApply,
          resolvedTheme,
          isLoading: false,
          error: null,
        });

        // Apply theme to DOM immediately
        applyThemeToDom(resolvedTheme);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to initialize theme';
        set({
          isLoading: false,
          error: errorMessage,
          theme: 'system',
          resolvedTheme: getSystemPreference(),
        });
      }
    },

    clearError: () => {
      set({ error: null });
    },
  };
});

/**
 * Hook to access theme state and actions
 * Usage: const { theme, setTheme } = useTheme();
 */
export function useTheme() {
  return useThemeStore(state => ({
    theme: state.theme,
    resolvedTheme: state.resolvedTheme,
    isLoading: state.isLoading,
    error: state.error,
    setTheme: state.setTheme,
    initializeTheme: state.initializeTheme,
    clearError: state.clearError,
  }));
}

/**
 * Hook to access only resolved theme
 * Useful for components that only care about the final 'light' or 'dark' value
 * Usage: const resolvedTheme = useResolvedTheme();
 */
export function useResolvedTheme(): ResolvedTheme {
  return useThemeStore(state => state.resolvedTheme);
}
