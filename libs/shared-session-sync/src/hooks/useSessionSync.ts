/**
 * React Hook for Session Sync
 *
 * Integrates session sync with the auth store to keep authentication
 * state synchronized across browser tabs.
 */

import { useEffect, useCallback } from 'react';
import { sessionSync } from '../lib/session-sync';
import { useAuthStore } from 'shared-auth-store';
import type { AuthStateChangePayload, TokenRefreshPayload } from '../lib/types';

/**
 * Hook to enable cross-tab session synchronization
 *
 * Automatically:
 * - Listens for logout events from other tabs
 * - Listens for auth state changes from other tabs
 * - Listens for token refresh events from other tabs
 *
 * @returns Object with broadcast functions for manual synchronization
 */
export function useSessionSync() {
  const logout = useAuthStore(state => state.logout);
  const setAccessToken = useAuthStore(state => state.setAccessToken);
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  useEffect(() => {
    // Listen for logout from other tabs
    const unsubLogout = sessionSync.on('LOGOUT', () => {
      logout();
    });

    // Listen for auth state changes from other tabs
    const unsubAuth = sessionSync.on('AUTH_STATE_CHANGE', data => {
      const payload = data as AuthStateChangePayload;
      if (payload.isAuthenticated && payload.user) {
        // Update user and tokens if provided
        // Note: The auth store persists state, so we mainly need to trigger a re-render
        // The actual state will be synced via localStorage persistence
        // For now, we'll just ensure the store is aware of the change
        // Since we can't directly set user, we rely on localStorage sync
        // The persist middleware will handle the sync
      } else {
        // User logged out in another tab
        logout();
      }
    });

    // Listen for token refresh from other tabs
    const unsubToken = sessionSync.on('TOKEN_REFRESH', data => {
      const payload = data as TokenRefreshPayload;
      // Get current refresh token from store to maintain it
      const currentRefreshToken = useAuthStore.getState().refreshToken;
      if (currentRefreshToken) {
        // Update access token, keep refresh token
        setAccessToken(payload.token, currentRefreshToken);
      }
    });

    return () => {
      unsubLogout();
      unsubAuth();
      unsubToken();
    };
  }, [logout, setAccessToken]);

  /**
   * Broadcast logout to all tabs
   */
  const broadcastLogout = useCallback(() => {
    sessionSync.broadcastLogout();
  }, []);

  /**
   * Broadcast current auth state to all tabs
   */
  const broadcastAuthState = useCallback(() => {
    sessionSync.broadcastAuthState(isAuthenticated, user);
  }, [isAuthenticated, user]);

  /**
   * Broadcast token refresh to all tabs
   */
  const broadcastTokenRefresh = useCallback((newToken: string) => {
    sessionSync.broadcastTokenRefresh(newToken);
  }, []);

  return {
    broadcastLogout,
    broadcastAuthState,
    broadcastTokenRefresh,
  };
}

/**
 * Hook to automatically broadcast auth state changes
 *
 * Call this hook in your app to automatically sync auth state
 * when login/logout occurs in the current tab.
 */
export function useAutoSyncAuthState() {
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const { broadcastAuthState } = useSessionSync();

  useEffect(() => {
    // Broadcast auth state whenever it changes
    broadcastAuthState();
  }, [user, isAuthenticated, broadcastAuthState]);
}
