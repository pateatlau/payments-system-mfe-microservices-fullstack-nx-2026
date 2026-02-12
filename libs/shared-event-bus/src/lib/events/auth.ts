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
 *
 * POC-3 Phase 7.2: Tokens are no longer emitted for security
 * - accessToken: Memory only in the store, not broadcast across tabs
 * - refreshToken: HttpOnly cookie only, not accessible to JS
 *
 * Cross-tab session sync now relies on the auth state change, not token sharing.
 * Other tabs refresh their own tokens via the HttpOnly cookie.
 */
export interface AuthLoginPayload {
  user: AuthUser;
  // POC-3 Phase 7.2: Tokens removed for security - not emitted across tabs
  // accessToken?: string;   // REMOVED - memory only
  // refreshToken?: string;  // REMOVED - HttpOnly cookie only
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
 *
 * POC-3 Phase 7.2: Token is no longer emitted for security
 * This event now just signals that a token refresh occurred.
 * Other tabs will refresh their own token via the HttpOnly cookie.
 */
export interface AuthTokenRefreshedPayload {
  userId: string;
  // POC-3 Phase 7.2: accessToken removed for security
  // Other tabs refresh via HttpOnly cookie, not via event
}

/**
 * Auth session expired event payload
 * Emitted when a user's session expires
 *
 * POC-3 Phase 7.4: Added reason field for different expiration causes
 */
export interface AuthSessionExpiredPayload {
  userId: string;
  // Can be either a timestamp (legacy) or a reason (POC-3 7.4)
  expiredAt?: string;
  reason?: 'inactivity_timeout' | 'token_expired' | 'forced_logout';
}

/**
 * Auth signup event payload
 * Emitted when a user successfully registers (but needs to verify email)
 */
export interface AuthSignupPayload {
  email: string;
  emailVerificationRequired: boolean;
}

/**
 * Auth events union type
 */
export type AuthEvent =
  | (BaseEvent<AuthLoginPayload> & { type: 'auth:login' })
  | (BaseEvent<AuthLogoutPayload> & { type: 'auth:logout' })
  | (BaseEvent<AuthTokenRefreshedPayload> & { type: 'auth:token-refreshed' })
  | (BaseEvent<AuthSessionExpiredPayload> & { type: 'auth:session-expired' })
  | (BaseEvent<AuthSignupPayload> & { type: 'auth:signup' });

/**
 * Auth event type strings
 */
export type AuthEventType = AuthEvent['type'];
