/**
 * Auth Events
 *
 * Event definitions for authentication-related operations
 * Emitted by Auth MFE
 */

import { BaseEvent } from '../types';

/**
 * User data included in auth events
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'CUSTOMER' | 'VENDOR';
}

/**
 * Auth login event payload
 * Emitted when a user successfully logs in
 */
export interface AuthLoginPayload {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

/**
 * Auth logout event payload
 * Emitted when a user logs out
 */
export interface AuthLogoutPayload {
  userId: string;
  reason?: 'user_initiated' | 'session_expired' | 'token_invalid';
}

/**
 * Auth token refreshed event payload
 * Emitted when the access token is refreshed
 */
export interface AuthTokenRefreshedPayload {
  userId: string;
  accessToken: string;
}

/**
 * Auth session expired event payload
 * Emitted when a user's session expires
 */
export interface AuthSessionExpiredPayload {
  userId: string;
  expiredAt: string;
}

/**
 * Auth events union type
 */
export type AuthEvent =
  | (BaseEvent<AuthLoginPayload> & { type: 'auth:login' })
  | (BaseEvent<AuthLogoutPayload> & { type: 'auth:logout' })
  | (BaseEvent<AuthTokenRefreshedPayload> & { type: 'auth:token-refreshed' })
  | (BaseEvent<AuthSessionExpiredPayload> & { type: 'auth:session-expired' });

/**
 * Auth event type strings
 */
export type AuthEventType = AuthEvent['type'];
