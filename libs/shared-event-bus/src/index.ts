/**
 * Shared Event Bus Library
 *
 * Provides type-safe pub/sub pattern for inter-MFE communication
 * Features:
 * - Type-safe event emission and subscription
 * - Event history for debugging
 * - React hooks for easy integration
 * - Event validation with Zod schemas
 */

// Core event bus
export { EventBus, eventBus, createEventBus } from './lib/event-bus';
export type { IEventBus, EventHandler, UnsubscribeFn } from './lib/event-bus';

// Event types
export type { EventSource, EventMeta, BaseEvent } from './lib/types';

export type {
  AppEvent,
  AppEventType,
  EventPayloadMap,
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
  PaymentStatus,
  PaymentType,
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
} from './lib/events';

// React hooks
export {
  useEventSubscription,
  useEventEmitter,
  useEventSubscriptionOnce,
  useEventHistory,
  useClearEventHistory,
} from './lib/hooks';
