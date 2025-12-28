import { create } from 'zustand';
import { getApiClient } from '@mfe/shared-api-client';
import { SessionSync, type ThemeChangePayload } from 'shared-session-sync';

/**
 * Theme type - user preference ('light', 'dark', or 'system' to follow OS preference)
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Resolved theme - the actual theme to use after resolving 'system' preference
 */
export type ResolvedTheme = 'light' | 'dark';

/**
 * Profile preferences with theme
 */
interface ProfilePreferences {
  theme?: Theme;
}

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

  // Set theme preference and sync with API
  setTheme: (theme: Theme) => Promise<void>;

  // Initialize theme from API or fallback to stored value
  initializeTheme: (storedTheme?: Theme) => Promise<void>;

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
 * Fetch theme preference from Profile Service API
 * Returns null if user is not authenticated (no tokens available)
 */
async function getThemePreference(): Promise<Theme | null> {
  try {
    const apiClient = getApiClient();

    // Check if user is authenticated before making API call
    const tokenProvider = (apiClient as { tokenProvider?: { getAccessToken?: () => string | null } }).tokenProvider;
    const accessToken = tokenProvider?.getAccessToken?.();

    // Skip API call if user is not authenticated
    if (!accessToken) {
      return null;
    }

    const response = await apiClient.get<ProfilePreferences>(
      '/profile/preferences'
    );

    if (response.success && response.data?.theme) {
      return response.data.theme;
    }

    // Fallback to system if API doesn't return theme
    return 'system';
  } catch (error) {
    console.warn('Failed to fetch theme preference from API:', error);
    // Fallback to null on API error (will use local storage or default)
    return null;
  }
}

/**
 * Update theme preference in Profile Service API
 */
async function updateThemePreference(theme: Theme): Promise<void> {
  try {
    const apiClient = getApiClient();
    const response = await apiClient.put<ProfilePreferences>(
      '/profile/preferences',
      { theme }
    );

    if (!response.success) {
      throw new Error(response.message ?? 'Failed to update theme preference');
    }
  } catch (error) {
    // Log error but don't throw - allow local state to update even if API fails
    console.warn('Failed to update theme preference on API:', error);
  }
}

/**
 * Zustand theme store
 * Manages theme state, applies theme to DOM, and syncs with Profile Service API
 * Includes cross-tab synchronization via SessionSync
 */
export const useThemeStore = create<ThemeState>((set, get) => {
  // Initialize SessionSync for cross-tab communication
  let sessionSync: SessionSync | null = null;
  if (typeof window !== 'undefined') {
    sessionSync = new SessionSync('theme-sync');

    // Subscribe to theme changes from other tabs
    sessionSync.on('THEME_CHANGE', (data: unknown) => {
      const payload = data as ThemeChangePayload;
      const { theme } = payload;

      // Update local state when theme changes in another tab
      const resolvedTheme = resolveTheme(theme);
      set({
        theme,
        resolvedTheme,
      });
      applyThemeToDom(resolvedTheme);
    });
  }

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

    setTheme: async (theme: Theme) => {
      try {
        set({ isLoading: true, error: null });

        const resolvedTheme = resolveTheme(theme);

        // Update local state immediately
        set({
          theme,
          resolvedTheme,
          error: null,
        });
        applyThemeToDom(resolvedTheme);

        // Broadcast theme change to other tabs
        if (sessionSync) {
          sessionSync.broadcast('THEME_CHANGE', {
            theme,
          } as ThemeChangePayload);
        }

        // Sync with API in the background
        // If API fails, local state is still updated (graceful degradation)
        await updateThemePreference(theme);

        set({ isLoading: false });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to set theme';
        set({
          isLoading: false,
          error: errorMessage,
        });
      }
    },

    initializeTheme: async (storedTheme?: Theme) => {
      try {
        set({ isLoading: true });

        let themeToApply: Theme;

        // Try to fetch from API first (only if user is authenticated)
        if (!storedTheme) {
          const apiTheme = await getThemePreference();
          // Use API theme if available, otherwise default to 'system'
          themeToApply = apiTheme ?? 'system';
        } else {
          themeToApply = storedTheme;
        }

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

        // Apply fallback theme to DOM
        applyThemeToDom(getSystemPreference());
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
