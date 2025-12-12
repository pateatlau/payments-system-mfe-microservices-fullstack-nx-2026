/**
 * Event Types
 *
 * Re-export event types from shared-event-bus library
 * This provides a single import point for all types
 */

// Re-export all event types from shared-event-bus
export type {
  AppEvent,
  AppEventType,
  EventPayloadMap,
  EventSource,
  EventMeta,
  BaseEvent,
  // Auth events
  AuthEvent,
  AuthEventType,
  AuthUser,
  AuthLoginPayload,
  AuthLogoutPayload,
  AuthTokenRefreshedPayload,
  AuthSessionExpiredPayload,
  // Payment events
  PaymentEvent,
  PaymentEventType,
  PaymentData,
  PaymentCreatedPayload,
  PaymentUpdatedPayload,
  PaymentCompletedPayload,
  PaymentFailedPayload,
  // Admin events
  AdminEvent,
  AdminEventType,
  AdminUserData,
  AdminUserCreatedPayload,
  AdminUserUpdatedPayload,
  AdminUserDeletedPayload,
  AdminConfigUpdatedPayload,
  // System events
  SystemEvent,
  SystemEventType,
  SystemErrorPayload,
  SystemNavigationPayload,
} from '@mfe/shared-event-bus';
