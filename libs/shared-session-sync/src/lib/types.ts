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

export interface TokenRefreshPayload {
  token: string;
}

export interface LogoutPayload {
  triggeredBy: string;
}

export interface ThemeChangePayload {
  theme: 'light' | 'dark' | 'system';
}
