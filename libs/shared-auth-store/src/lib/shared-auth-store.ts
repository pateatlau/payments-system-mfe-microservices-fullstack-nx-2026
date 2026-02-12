import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getApiClient, type TokenProvider } from '@mfe/shared-api-client';
import { eventBus } from '@mfe/shared-event-bus';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  MfaCompleteRequest,
  MfaCompleteResponse,
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
 * Email verification pending state
 * Returned after successful registration when email verification is required
 */
export interface EmailVerificationPendingState {
  email: string;
  message: string;
  // DEV ONLY: Token info for testing (only present in development mode)
  _dev?: {
    verificationToken: string;
    userId: string;
    expiresAt: string;
    verifyUrl: string;
  };
}

/**
 * Auth state interface
 *
 * POC-3 Phase 7.2: Security hardening for token storage
 * - accessToken: Kept in memory only (not persisted to localStorage)
 * - refreshToken: Removed from frontend state entirely (stored in HttpOnly cookie)
 * - Only user info and isAuthenticated are persisted to localStorage for UX
 */
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  // POC-3 Phase 7.2: refreshToken removed from state - now in HttpOnly cookie only
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  errorCode: string | null;
  // MFA state
  mfaPending: boolean;
  mfaToken: string | null;
  // Email verification state
  emailVerificationPending: EmailVerificationPendingState | null;
  // Actions
  login: (email: string, password: string) => Promise<void>;
  completeMfaLogin: (code: string) => Promise<void>;
  cancelMfaLogin: () => void;
  logout: () => Promise<void>;
  signup: (data: SignUpData) => Promise<void>;
  setAccessToken: (accessToken: string) => void;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  clearError: () => void;
  clearEmailVerificationPending: () => void;
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
 *
 * POC-3 Phase 7.2: Security hardening
 * - accessToken: Memory only (cleared on page reload for security)
 * - refreshToken: HttpOnly cookie only (not accessible to JS)
 * - user + isAuthenticated: Persisted to localStorage for UX
 *
 * On page reload:
 * - User info is restored from localStorage (for immediate UI)
 * - Access token is null (user appears logged out momentarily)
 * - First API call triggers automatic token refresh via HttpOnly cookie
 * - Session is seamlessly restored
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      // Create token provider for API client
      // POC-3 Phase 7.2: refreshToken returns null - server uses HttpOnly cookie
      const tokenProvider: TokenProvider = {
        getAccessToken: () => get().accessToken ?? null,
        // Refresh token is now in HttpOnly cookie, not accessible to JS
        getRefreshToken: () => null,
        setTokens: (accessToken: string, _refreshToken: string) => {
          // Only store access token in memory
          // refreshToken is ignored - it's set as HttpOnly cookie by server
          set({ accessToken });
        },
        clearTokens: () => {
          set({ accessToken: null });
        },
      };

      // Initialize API client with token provider
      const apiClient = getApiClientWithTokenProvider(tokenProvider);

      return {
        user: null,
        accessToken: null,
        // POC-3 Phase 7.2: refreshToken removed - now in HttpOnly cookie
        isAuthenticated: false,
        isLoading: false,
        error: null,
        errorCode: null,
        // MFA initial state
        mfaPending: false,
        mfaToken: null,
        // Email verification initial state
        emailVerificationPending: null,

        login: async (email: string, password: string) => {
          set({ isLoading: true, error: null, errorCode: null, mfaPending: false, mfaToken: null });
          try {
            const request: LoginRequest = { email, password };
            const response: LoginResponse = await apiClient.post(
              '/auth/login',
              request
            );

            if (!response.success || !response.data) {
              throw new Error(response.message ?? 'Login failed');
            }

            const data = response.data;

            // Check if MFA is required
            if ('mfaRequired' in data && data.mfaRequired === true) {
              // MFA required - store temporary token and wait for MFA code
              set({
                user: data.user,
                mfaPending: true,
                mfaToken: data.mfaToken,
                isLoading: false,
                error: null,
                // Don't set authenticated yet
                isAuthenticated: false,
                accessToken: null,
                refreshToken: null,
              });
              return;
            }

            // Standard login (no MFA)
            // POC-3 Phase 7.2: refreshToken is now in HttpOnly cookie, not stored in state
            const { user, accessToken } = data;

            set({
              user,
              accessToken,
              // refreshToken removed - now in HttpOnly cookie
              isAuthenticated: true,
              isLoading: false,
              error: null,
              mfaPending: false,
              mfaToken: null,
            });

            // Emit login event to event bus
            // POC-3 Phase 7.2: Don't emit refreshToken for security
            eventBus.emit(
              'auth:login',
              {
                user: {
                  id: user.id,
                  email: user.email,
                  name: user.name,
                  role: user.role,
                },
                // accessToken not emitted for security - other tabs will refresh via cookie
              },
              'auth-mfe'
            );
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : 'Login failed. Please check your credentials.';
            const errorCode =
              error instanceof Error && 'code' in error
                ? (error as Error & { code?: string }).code ?? null
                : null;
            set({
              user: null,
              accessToken: null,
              isAuthenticated: false,
              isLoading: false,
              error: errorMessage,
              errorCode,
              mfaPending: false,
              mfaToken: null,
            });
          }
        },

        completeMfaLogin: async (code: string) => {
          const { mfaToken } = get();

          if (!mfaToken) {
            set({ error: 'MFA session expired. Please login again.' });
            return;
          }

          set({ isLoading: true, error: null });

          try {
            const request: MfaCompleteRequest = { mfaToken, code };
            const response: MfaCompleteResponse = await apiClient.post(
              '/auth/mfa/complete',
              request
            );

            if (!response.success || !response.data) {
              throw new Error(response.message ?? 'MFA verification failed');
            }

            // POC-3 Phase 7.2: refreshToken is in HttpOnly cookie, not stored in state
            const { accessToken, user: updatedUser } = response.data;

            set({
              user: updatedUser,
              accessToken,
              // refreshToken removed - now in HttpOnly cookie
              isAuthenticated: true,
              isLoading: false,
              error: null,
              mfaPending: false,
              mfaToken: null,
            });

            // Emit login event to event bus
            // POC-3 Phase 7.2: Don't emit tokens for security
            eventBus.emit(
              'auth:login',
              {
                user: {
                  id: updatedUser.id,
                  email: updatedUser.email,
                  name: updatedUser.name,
                  role: updatedUser.role,
                },
              },
              'auth-mfe'
            );
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : 'MFA verification failed. Please try again.';
            set({
              isLoading: false,
              error: errorMessage,
              // Keep MFA state so user can retry
            });
          }
        },

        cancelMfaLogin: () => {
          set({
            user: null,
            mfaPending: false,
            mfaToken: null,
            error: null,
            isLoading: false,
          });
        },

        logout: async () => {
          const { accessToken } = get();
          const userId = get().user?.id;

          try {
            // Call logout endpoint if we have a token
            if (accessToken) {
              try {
                await apiClient.post('/auth/logout', {});
              } catch (error) {
                // Log error but continue with logout
                console.warn('Logout API call failed:', error);
              }
            }

            // Clear state
            // POC-3 Phase 7.2: refreshToken is cleared by server (HttpOnly cookie)
            set({
              user: null,
              accessToken: null,
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
              isAuthenticated: false,
              error: null,
            });
          }
        },

        signup: async (data: SignUpData) => {
          set({ isLoading: true, error: null, emailVerificationPending: null });
          try {
            const request: RegisterRequest = {
              email: data.email,
              password: data.password,
              name: data.name,
              role: data.role,
            };

            // Response can be either:
            // 1. New flow: { success, emailVerificationRequired, email, message, _dev? }
            // 2. Legacy flow: { success, data: { user, accessToken, refreshToken } }
            type VerificationRequiredResponse = {
              success: true;
              emailVerificationRequired: true;
              email: string;
              message: string;
              _dev?: {
                verificationToken: string;
                userId: string;
                expiresAt: string;
                verifyUrl: string;
              };
            };

            const response = await apiClient.post('/auth/register', request);

            if (!response.success) {
              throw new Error(response.message ?? 'Sign-up failed');
            }

            // Check if email verification is required (new flow)
            const verificationResponse = response as unknown as VerificationRequiredResponse;
            if (verificationResponse.emailVerificationRequired) {
              set({
                user: null,
                accessToken: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
                emailVerificationPending: {
                  email: verificationResponse.email,
                  message: verificationResponse.message,
                  _dev: verificationResponse._dev,
                },
              });

              // Emit signup event (not login - user needs to verify email first)
              eventBus.emit(
                'auth:signup',
                {
                  email: verificationResponse.email,
                  emailVerificationRequired: true,
                },
                'auth-mfe'
              );
              return;
            }

            // Legacy flow: direct login after signup (kept for backwards compatibility)
            // POC-3 Phase 7.2: refreshToken is in HttpOnly cookie, not stored in state
            const legacyResponse = response as RegisterResponse;
            if (legacyResponse.data) {
              const { user, accessToken } = legacyResponse.data;

              set({
                user,
                accessToken,
                // refreshToken removed - now in HttpOnly cookie
                isAuthenticated: true,
                isLoading: false,
                error: null,
                emailVerificationPending: null,
              });

              // Emit login event to event bus (signup also logs user in)
              // POC-3 Phase 7.2: Don't emit tokens for security
              eventBus.emit(
                'auth:login',
                {
                  user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                  },
                },
                'auth-mfe'
              );
            } else {
              // Response was successful but had neither emailVerificationRequired nor data
              // This is an unexpected state - treat it as an error
              throw new Error(response.message ?? 'Sign-up failed');
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : 'Sign-up failed. Please try again.';
            set({
              user: null,
              accessToken: null,
              isAuthenticated: false,
              isLoading: false,
              error: errorMessage,
              emailVerificationPending: null,
            });
          }
        },

        // POC-3 Phase 7.2: Only accepts accessToken (refreshToken is in HttpOnly cookie)
        setAccessToken: (accessToken: string) => {
          set({ accessToken });

          // Emit token refreshed event (without exposing the token)
          const userId = get().user?.id;
          if (userId) {
            eventBus.emit(
              'auth:token-refreshed',
              {
                userId,
                // POC-3 Phase 7.2: Don't emit accessToken for security
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
          set({ error: null, errorCode: null });
        },

        clearEmailVerificationPending: () => {
          set({ emailVerificationPending: null });
        },
      };
    },
    {
      name: 'auth-storage',
      /**
       * POC-3 Phase 7.2: Security-hardened persistence
       *
       * Only persist non-sensitive user info:
       * - user: For immediate UI display on page reload
       * - isAuthenticated: To show correct UI state
       *
       * NOT persisted (security):
       * - accessToken: Memory only, cleared on reload (refreshed via cookie)
       * - refreshToken: HttpOnly cookie only, not accessible to JS
       * - MFA state: User must re-authenticate if page reloads during MFA
       *
       * On page reload, the first API call will trigger automatic token
       * refresh using the HttpOnly cookie, restoring the session seamlessly.
       */
      partialize: state => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // accessToken: NOT persisted (memory only for security)
        // refreshToken: NOT persisted (HttpOnly cookie only)
        // MFA state: NOT persisted (user should re-login)
      }),
    }
  )
);
