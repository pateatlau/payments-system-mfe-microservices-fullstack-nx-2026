import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getApiClient, type TokenProvider } from '@mfe/shared-api-client';
import { eventBus } from '@mfe/shared-event-bus';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from 'shared-types';
import type { User, UserRole } from 'shared-types';

/**
 * Sign-up data interface
 */
export interface SignUpData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

/**
 * Auth state interface
 */
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (data: SignUpData) => Promise<void>;
  setAccessToken: (accessToken: string, refreshToken: string) => void;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  clearError: () => void;
}

/**
 * Get API client instance
 * Initializes with token provider from auth store
 */
function getApiClientWithTokenProvider(tokenProvider: TokenProvider) {
  const client = getApiClient();
  client.setTokenProvider(tokenProvider);
  return client;
}

/**
 * Zustand auth store with persistence middleware
 * Uses localStorage to persist auth state across page reloads
 * Integrates with backend Auth Service for real JWT authentication
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      // Create token provider for API client
      const tokenProvider: TokenProvider = {
        getAccessToken: () => get().accessToken ?? null,
        getRefreshToken: () => get().refreshToken ?? null,
        setTokens: (accessToken: string, refreshToken: string) => {
          set({ accessToken, refreshToken });
        },
        clearTokens: () => {
          set({ accessToken: null, refreshToken: null });
        },
      };

      // Initialize API client with token provider
      const apiClient = getApiClientWithTokenProvider(tokenProvider);

      return {
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        login: async (email: string, password: string) => {
          set({ isLoading: true, error: null });
          try {
            // Debug: Log API client base URL
            // eslint-disable-next-line no-console
            console.log('[Auth Store] API Base URL:', (apiClient as unknown as { getAxiosInstance: () => { defaults: { baseURL: string } } }).getAxiosInstance().defaults.baseURL);

            const request: LoginRequest = { email, password };
            const response: LoginResponse = await apiClient.post(
              '/auth/login',
              request
            );

            if (!response.success || !response.data) {
              throw new Error(response.message ?? 'Login failed');
            }

            const { user, accessToken, refreshToken } = response.data;

            set({
              user,
              accessToken,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            // Emit login event to event bus
            eventBus.emit(
              'auth:login',
              {
                user: {
                  id: user.id,
                  email: user.email,
                  name: user.name,
                  role: user.role,
                },
                accessToken,
                refreshToken,
              },
              'auth-mfe'
            );
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : 'Login failed. Please check your credentials.';
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
              error: errorMessage,
            });
          }
        },

        logout: async () => {
          const { accessToken } = get();
          const userId = get().user?.id;

          try {
            // Call logout endpoint if we have a token
            if (accessToken) {
              try {
                await apiClient.post('/auth/logout', {});
              } catch (_error) {
                // Log error but continue with logout
                console.warn('Logout API call failed:', _error);
              }
            }

            // Clear state
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
              error: null,
            });

            // Emit logout event to event bus
            if (userId) {
              eventBus.emit(
                'auth:logout',
                {
                  userId,
                  reason: 'user_initiated',
                },
                'auth-mfe'
              );
            }
          } catch (_error) {
            // Even if logout fails, clear local state
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
              error: null,
            });
          }
        },

        signup: async (data: SignUpData) => {
          set({ isLoading: true, error: null });
          try {
            const request: RegisterRequest = {
              email: data.email,
              password: data.password,
              name: data.name,
              role: data.role,
            };
            const response: RegisterResponse = await apiClient.post(
              '/auth/register',
              request
            );

            if (!response.success || !response.data) {
              throw new Error(response.message ?? 'Sign-up failed');
            }

            const { user, accessToken, refreshToken } = response.data;

            set({
              user,
              accessToken,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            // Emit login event to event bus (signup also logs user in)
            eventBus.emit(
              'auth:login',
              {
                user: {
                  id: user.id,
                  email: user.email,
                  name: user.name,
                  role: user.role,
                },
                accessToken,
                refreshToken,
              },
              'auth-mfe'
            );
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : 'Sign-up failed. Please try again.';
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
              error: errorMessage,
            });
          }
        },

        setAccessToken: (accessToken: string, refreshToken: string) => {
          set({ accessToken, refreshToken });

          // Emit token refreshed event
          const userId = get().user?.id;
          if (userId) {
            eventBus.emit(
              'auth:token-refreshed',
              {
                userId,
                accessToken,
              },
              'auth-mfe'
            );
          }
        },

        hasRole: (role: UserRole): boolean => {
          const { user } = get();
          return user?.role === role;
        },

        hasAnyRole: (roles: UserRole[]): boolean => {
          const { user } = get();
          if (!user) return false;
          return roles.includes(user.role);
        },

        clearError: () => {
          set({ error: null });
        },
      };
    },
    {
      name: 'auth-storage',
      partialize: state => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
