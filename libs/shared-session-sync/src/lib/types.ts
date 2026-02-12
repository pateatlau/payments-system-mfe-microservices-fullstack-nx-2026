/**
 * Session Sync Types
 *
 * Type definitions for cross-tab session synchronization.
 */

export type SessionEventType =
  | 'AUTH_STATE_CHANGE'
  | 'LOGOUT'
  | 'TOKEN_REFRESH'
  | 'SESSION_SYNC'
  | 'THEME_CHANGE';

export interface SessionEvent {
  type: SessionEventType;
  payload: unknown;
  timestamp: number;
  tabId: string;
}

export interface AuthStateChangePayload {
  isAuthenticated: boolean;
  user?: unknown;
}

/**
 * POC-3 Phase 7.2: Token no longer included in payload for security
 * The payload now just signals that a token refresh occurred
 * Other tabs will refresh their own token via the HttpOnly cookie
 */
export interface TokenRefreshPayload {
  // POC-3 Phase 7.2: token removed for security - not accessible to JS
  // This event now just signals that a refresh occurred
  refreshedAt: number;
}

export interface LogoutPayload {
  triggeredBy: string;
}

export interface ThemeChangePayload {
  theme: 'light' | 'dark' | 'system';
}
