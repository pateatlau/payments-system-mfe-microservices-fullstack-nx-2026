/**
 * Event Type Exports
 *
 * Central export point for all event types and payload definitions
 */

export * from './auth';
export * from './payments';
export * from './admin';
export * from './system';

import type {
  AuthEvent,
  AuthLoginPayload,
  AuthLogoutPayload,
  AuthTokenRefreshedPayload,
  AuthSessionExpiredPayload,
} from './auth';
import type {
  PaymentEvent,
  PaymentCreatedPayload,
  PaymentUpdatedPayload,
  PaymentCompletedPayload,
  PaymentFailedPayload,
} from './payments';
import type {
  AdminEvent,
  AdminUserCreatedPayload,
  AdminUserUpdatedPayload,
  AdminUserDeletedPayload,
  AdminConfigUpdatedPayload,
} from './admin';
import type {
  SystemEvent,
  SystemErrorPayload,
  SystemNavigationPayload,
} from './system';

/**
 * All event types union
 * Represents any event that can be emitted in the system
 */
export type AppEvent = AuthEvent | PaymentEvent | AdminEvent | SystemEvent;

/**
 * Event type strings
 * Union of all possible event type identifiers
 */
export type AppEventType = AppEvent['type'];

/**
 * Event type to payload mapping
 * Maps event type strings to their corresponding payload types
 */
export type EventPayloadMap = {
  'auth:login': AuthLoginPayload;
  'auth:logout': AuthLogoutPayload;
  'auth:token-refreshed': AuthTokenRefreshedPayload;
  'auth:session-expired': AuthSessionExpiredPayload;
  'payments:created': PaymentCreatedPayload;
  'payments:updated': PaymentUpdatedPayload;
  'payments:completed': PaymentCompletedPayload;
  'payments:failed': PaymentFailedPayload;
  'admin:user-created': AdminUserCreatedPayload;
  'admin:user-updated': AdminUserUpdatedPayload;
  'admin:user-deleted': AdminUserDeletedPayload;
  'admin:config-updated': AdminConfigUpdatedPayload;
  'system:error': SystemErrorPayload;
  'system:navigation': SystemNavigationPayload;
};
