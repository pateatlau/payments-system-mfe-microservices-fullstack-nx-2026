# Event Bus Contract - POC-2

**Status:** ✅ Complete & Implemented  
**Version:** 1.0  
**Date:** 2026-12-09  
**Implementation Status:** ✅ Complete (2026-12-09)

---

## 1. Overview

This document defines the event bus contract for inter-MFE communication in POC-2. The event bus enables decoupled communication between microfrontends, replacing the shared Zustand stores used in POC-1.

**Purpose:**

- Define all event types with payload schemas
- Establish naming conventions
- Specify versioning strategy
- Document error handling patterns
- Provide usage examples

---

## 2. Event Naming Conventions

### 2.1 Format

Events follow the format: `{domain}:{action}`

```
domain:action
```

**Examples:**

- `auth:login` - User logged in
- `auth:logout` - User logged out
- `payments:created` - Payment created
- `admin:user-updated` - Admin updated a user

### 2.2 Domain Prefixes

| Domain     | Description                     | MFE Source   |
| ---------- | ------------------------------- | ------------ |
| `auth`     | Authentication events           | Auth MFE     |
| `payments` | Payment operation events        | Payments MFE |
| `admin`    | Administrative operation events | Admin MFE    |
| `system`   | System-level events             | Shell        |

### 2.3 Action Naming

- Use lowercase with hyphens for multi-word actions
- Use past tense for completed actions: `created`, `updated`, `deleted`
- Use present tense for state changes: `login`, `logout`

---

## 3. Event Type Definitions

### 3.1 Base Event Interface

All events extend this base interface:

```typescript
// libs/shared-event-bus/src/types.ts

/**
 * Base event interface - all events extend this
 */
export interface BaseEvent<T = unknown> {
  /** Event type identifier */
  type: string;
  /** Event payload */
  payload: T;
  /** Event metadata */
  meta: EventMeta;
}

/**
 * Event metadata
 */
export interface EventMeta {
  /** Timestamp when event was created */
  timestamp: string;
  /** Source MFE that emitted the event */
  source: EventSource;
  /** Event version for schema evolution */
  version: number;
  /** Optional correlation ID for tracing */
  correlationId?: string;
}

/**
 * Event source identifiers
 */
export type EventSource = 'shell' | 'auth-mfe' | 'payments-mfe' | 'admin-mfe';
```

### 3.2 Auth Events

```typescript
// libs/shared-event-bus/src/events/auth.ts

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
 */
export interface AuthLoginPayload {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

/**
 * Auth logout event payload
 */
export interface AuthLogoutPayload {
  userId: string;
  reason?: 'user_initiated' | 'session_expired' | 'token_invalid';
}

/**
 * Auth token refreshed event payload
 */
export interface AuthTokenRefreshedPayload {
  userId: string;
  accessToken: string;
}

/**
 * Auth session expired event payload
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
```

### 3.3 Payment Events

```typescript
// libs/shared-event-bus/src/events/payments.ts

/**
 * Payment status
 */
export type PaymentStatus =
  | 'pending'
  | 'initiated'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Payment type
 */
export type PaymentType = 'initiate' | 'payment';

/**
 * Payment data included in payment events
 */
export interface PaymentData {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  type: PaymentType;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Payment created event payload
 */
export interface PaymentCreatedPayload {
  payment: PaymentData;
}

/**
 * Payment updated event payload
 */
export interface PaymentUpdatedPayload {
  payment: PaymentData;
  previousStatus: PaymentStatus;
}

/**
 * Payment completed event payload
 */
export interface PaymentCompletedPayload {
  payment: PaymentData;
  completedAt: string;
}

/**
 * Payment failed event payload
 */
export interface PaymentFailedPayload {
  payment: PaymentData;
  error: {
    code: string;
    message: string;
  };
}

/**
 * Payment events union type
 */
export type PaymentEvent =
  | (BaseEvent<PaymentCreatedPayload> & { type: 'payments:created' })
  | (BaseEvent<PaymentUpdatedPayload> & { type: 'payments:updated' })
  | (BaseEvent<PaymentCompletedPayload> & { type: 'payments:completed' })
  | (BaseEvent<PaymentFailedPayload> & { type: 'payments:failed' });
```

### 3.4 Admin Events

```typescript
// libs/shared-event-bus/src/events/admin.ts

/**
 * User data for admin events
 */
export interface AdminUserData {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'CUSTOMER' | 'VENDOR';
}

/**
 * Admin user created event payload
 */
export interface AdminUserCreatedPayload {
  user: AdminUserData;
  createdBy: string;
}

/**
 * Admin user updated event payload
 */
export interface AdminUserUpdatedPayload {
  user: AdminUserData;
  updatedBy: string;
  changes: Record<string, { from: unknown; to: unknown }>;
}

/**
 * Admin user deleted event payload
 */
export interface AdminUserDeletedPayload {
  userId: string;
  deletedBy: string;
}

/**
 * Admin config updated event payload
 */
export interface AdminConfigUpdatedPayload {
  key: string;
  value: unknown;
  updatedBy: string;
}

/**
 * Admin events union type
 */
export type AdminEvent =
  | (BaseEvent<AdminUserCreatedPayload> & { type: 'admin:user-created' })
  | (BaseEvent<AdminUserUpdatedPayload> & { type: 'admin:user-updated' })
  | (BaseEvent<AdminUserDeletedPayload> & { type: 'admin:user-deleted' })
  | (BaseEvent<AdminConfigUpdatedPayload> & { type: 'admin:config-updated' });
```

### 3.5 System Events

```typescript
// libs/shared-event-bus/src/events/system.ts

/**
 * System error event payload
 */
export interface SystemErrorPayload {
  error: {
    code: string;
    message: string;
    stack?: string;
  };
  context?: Record<string, unknown>;
}

/**
 * System navigation event payload
 */
export interface SystemNavigationPayload {
  from: string;
  to: string;
  userId?: string;
}

/**
 * System events union type
 */
export type SystemEvent =
  | (BaseEvent<SystemErrorPayload> & { type: 'system:error' })
  | (BaseEvent<SystemNavigationPayload> & { type: 'system:navigation' });
```

### 3.6 All Events Union

```typescript
// libs/shared-event-bus/src/events/index.ts

import { AuthEvent } from './auth';
import { PaymentEvent } from './payments';
import { AdminEvent } from './admin';
import { SystemEvent } from './system';

/**
 * All event types union
 */
export type AppEvent = AuthEvent | PaymentEvent | AdminEvent | SystemEvent;

/**
 * Event type strings
 */
export type AppEventType = AppEvent['type'];

/**
 * Event type to payload mapping
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
```

---

## 4. Event Bus Implementation

### 4.1 Event Bus Interface

```typescript
// libs/shared-event-bus/src/event-bus.ts

import { AppEvent, AppEventType, EventPayloadMap } from './events';
import { EventMeta, EventSource } from './types';

/**
 * Event handler function type
 */
export type EventHandler<T extends AppEventType> = (
  payload: EventPayloadMap[T],
  meta: EventMeta
) => void;

/**
 * Event bus interface
 */
export interface IEventBus {
  /**
   * Subscribe to an event type
   */
  on<T extends AppEventType>(
    eventType: T,
    handler: EventHandler<T>
  ): () => void;

  /**
   * Unsubscribe from an event type
   */
  off<T extends AppEventType>(eventType: T, handler: EventHandler<T>): void;

  /**
   * Emit an event
   */
  emit<T extends AppEventType>(
    eventType: T,
    payload: EventPayloadMap[T],
    source: EventSource
  ): void;

  /**
   * Subscribe to an event type once
   */
  once<T extends AppEventType>(
    eventType: T,
    handler: EventHandler<T>
  ): () => void;
}
```

### 4.2 Event Bus Class

```typescript
// libs/shared-event-bus/src/event-bus.ts

class EventBus implements IEventBus {
  private listeners: Map<string, Set<EventHandler<AppEventType>>> = new Map();
  private eventHistory: AppEvent[] = [];
  private maxHistorySize = 100;

  /**
   * Subscribe to an event type
   */
  on<T extends AppEventType>(
    eventType: T,
    handler: EventHandler<T>
  ): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(handler as EventHandler<AppEventType>);

    // Return unsubscribe function
    return () => this.off(eventType, handler);
  }

  /**
   * Unsubscribe from an event type
   */
  off<T extends AppEventType>(eventType: T, handler: EventHandler<T>): void {
    this.listeners
      .get(eventType)
      ?.delete(handler as EventHandler<AppEventType>);
  }

  /**
   * Emit an event
   */
  emit<T extends AppEventType>(
    eventType: T,
    payload: EventPayloadMap[T],
    source: EventSource
  ): void {
    const meta: EventMeta = {
      timestamp: new Date().toISOString(),
      source,
      version: 1,
      correlationId: crypto.randomUUID(),
    };

    // Log event in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[EventBus] ${eventType}`, { payload, meta });
    }

    // Store in history
    this.addToHistory({ type: eventType, payload, meta } as AppEvent);

    // Notify listeners
    this.listeners.get(eventType)?.forEach(handler => {
      try {
        handler(payload, meta);
      } catch (error) {
        console.error(`[EventBus] Error in handler for ${eventType}:`, error);
      }
    });
  }

  /**
   * Subscribe to an event type once
   */
  once<T extends AppEventType>(
    eventType: T,
    handler: EventHandler<T>
  ): () => void {
    const wrappedHandler: EventHandler<T> = (payload, meta) => {
      this.off(eventType, wrappedHandler);
      handler(payload, meta);
    };
    return this.on(eventType, wrappedHandler);
  }

  /**
   * Get event history (for debugging)
   */
  getHistory(): AppEvent[] {
    return [...this.eventHistory];
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  private addToHistory(event: AppEvent): void {
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }
}

// Singleton instance
export const eventBus = new EventBus();
```

---

## 5. Event Versioning Strategy

### 5.1 Version Field

Each event includes a `version` field in the metadata:

```typescript
meta: {
  version: 1, // Increment when payload schema changes
  // ...
}
```

### 5.2 Versioning Rules

1. **Additive Changes (No Version Bump):**
   - Adding optional fields to payload
   - Adding new event types

2. **Breaking Changes (Version Bump):**
   - Removing fields from payload
   - Changing field types
   - Renaming fields
   - Changing required/optional status

### 5.3 Version Migration

When a breaking change occurs:

1. Increment the version number
2. Update the payload interface
3. Create migration handler if needed
4. Document the change

```typescript
// Example: Handling multiple versions
function handleAuthLogin(payload: unknown, meta: EventMeta): void {
  if (meta.version === 1) {
    const v1Payload = payload as AuthLoginPayloadV1;
    // Handle v1 payload
  } else if (meta.version === 2) {
    const v2Payload = payload as AuthLoginPayloadV2;
    // Handle v2 payload
  }
}
```

---

## 6. Error Handling Patterns

### 6.1 Handler Error Isolation

Event handlers are isolated - one handler's error doesn't affect others:

```typescript
emit(eventType, payload, source): void {
  this.listeners.get(eventType)?.forEach((handler) => {
    try {
      handler(payload, meta);
    } catch (error) {
      // Log error but continue with other handlers
      console.error(`[EventBus] Error in handler for ${eventType}:`, error);

      // Optionally emit system error event
      if (eventType !== 'system:error') {
        this.emit('system:error', {
          error: {
            code: 'EVENT_HANDLER_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
          },
          context: { eventType, payload },
        }, 'shell');
      }
    }
  });
}
```

### 6.2 Event Validation

Validate events before emitting:

```typescript
import { z } from 'zod';

// Define Zod schema for validation
const AuthLoginPayloadSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().min(1),
    role: z.enum(['ADMIN', 'CUSTOMER', 'VENDOR']),
  }),
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});

// Validate before emitting
function emitAuthLogin(payload: AuthLoginPayload): void {
  const result = AuthLoginPayloadSchema.safeParse(payload);
  if (!result.success) {
    console.error('[EventBus] Invalid payload for auth:login', result.error);
    return;
  }
  eventBus.emit('auth:login', payload, 'auth-mfe');
}
```

---

## 7. Event Ordering Guarantees

### 7.1 Ordering Behavior

**Guarantees:**

- Events emitted synchronously are delivered in order
- Handlers for a single event type are called in subscription order
- No cross-event type ordering guarantees

**Non-Guarantees:**

- No persistence - events are not stored beyond the history buffer
- No replay - missed events cannot be replayed
- No delivery confirmation - fire-and-forget pattern

### 7.2 When Order Matters

If event order is critical, use correlation IDs:

```typescript
// First event
eventBus.emit('payments:created', payload1, 'payments-mfe');
// Handler sets correlationId

// Second event references first
eventBus.emit(
  'payments:updated',
  {
    ...payload2,
    // Reference original event
  },
  'payments-mfe'
);
```

---

## 8. Usage Examples

### 8.1 Publishing Events

**Auth MFE - Login:**

```typescript
// apps/auth-mfe/src/hooks/useAuth.ts
import { eventBus } from '@mfe/shared-event-bus';

export function useAuth() {
  const login = async (email: string, password: string) => {
    // Call API
    const response = await apiClient.post('/api/auth/login', {
      email,
      password,
    });
    const { user, accessToken, refreshToken } = response.data.data;

    // Update local store
    useAuthStore.getState().setUser(user);

    // Publish event to event bus
    eventBus.emit(
      'auth:login',
      { user, accessToken, refreshToken },
      'auth-mfe'
    );
  };

  return { login };
}
```

**Payments MFE - Create Payment:**

```typescript
// apps/payments-mfe/src/hooks/usePayments.ts
import { eventBus } from '@mfe/shared-event-bus';

export function useCreatePayment() {
  const createPayment = async (data: CreatePaymentDto) => {
    const response = await apiClient.post('/api/payments', data);
    const payment = response.data.data;

    // Publish event
    eventBus.emit('payments:created', { payment }, 'payments-mfe');

    return payment;
  };

  return { createPayment };
}
```

### 8.2 Subscribing to Events

**Shell - Listen for Auth Events:**

```typescript
// apps/shell/src/App.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { eventBus } from '@mfe/shared-event-bus';

export function App() {
  const navigate = useNavigate();

  useEffect(() => {
    // Subscribe to login event
    const unsubscribeLogin = eventBus.on('auth:login', (payload) => {
      console.log('User logged in:', payload.user.email);
      navigate('/payments');
    });

    // Subscribe to logout event
    const unsubscribeLogout = eventBus.on('auth:logout', (payload) => {
      console.log('User logged out:', payload.reason);
      navigate('/signin');
    });

    // Cleanup on unmount
    return () => {
      unsubscribeLogin();
      unsubscribeLogout();
    };
  }, [navigate]);

  return <AppContent />;
}
```

**Admin MFE - Listen for User Updates:**

```typescript
// apps/admin-mfe/src/hooks/useAdminEvents.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { eventBus } from '@mfe/shared-event-bus';

export function useAdminEvents() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Invalidate users query when user is updated
    const unsubscribe = eventBus.on('admin:user-updated', () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    });

    return unsubscribe;
  }, [queryClient]);
}
```

### 8.3 React Hook for Event Bus

```typescript
// libs/shared-event-bus/src/hooks/useEventBus.ts
import { useEffect, useCallback } from 'react';
import {
  eventBus,
  EventHandler,
  AppEventType,
  EventPayloadMap,
} from '../event-bus';

/**
 * Hook to subscribe to event bus events
 */
export function useEventSubscription<T extends AppEventType>(
  eventType: T,
  handler: EventHandler<T>,
  deps: React.DependencyList = []
): void {
  useEffect(() => {
    const unsubscribe = eventBus.on(eventType, handler);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventType, ...deps]);
}

/**
 * Hook to emit events
 */
export function useEventEmitter() {
  const emit = useCallback(
    <T extends AppEventType>(
      eventType: T,
      payload: EventPayloadMap[T],
      source: EventSource
    ) => {
      eventBus.emit(eventType, payload, source);
    },
    []
  );

  return { emit };
}
```

---

## 9. Testing Events

### 9.1 Testing Event Emission

```typescript
// tests/event-bus.test.ts
import { describe, it, expect, vi } from 'vitest';
import { eventBus } from '@mfe/shared-event-bus';

describe('EventBus', () => {
  it('should emit and receive events', () => {
    const handler = vi.fn();
    eventBus.on('auth:login', handler);

    eventBus.emit(
      'auth:login',
      {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test',
          role: 'CUSTOMER',
        },
        accessToken: 'token',
        refreshToken: 'refresh',
      },
      'auth-mfe'
    );

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({ email: 'test@example.com' }),
      }),
      expect.objectContaining({
        source: 'auth-mfe',
        version: 1,
      })
    );
  });

  it('should unsubscribe from events', () => {
    const handler = vi.fn();
    const unsubscribe = eventBus.on('auth:logout', handler);

    unsubscribe();

    eventBus.emit('auth:logout', { userId: '1' }, 'auth-mfe');

    expect(handler).not.toHaveBeenCalled();
  });
});
```

### 9.2 Mocking Event Bus in Tests

```typescript
// tests/mocks/event-bus.mock.ts
import { vi } from 'vitest';

export const mockEventBus = {
  on: vi.fn(() => vi.fn()),
  off: vi.fn(),
  emit: vi.fn(),
  once: vi.fn(() => vi.fn()),
  getHistory: vi.fn(() => []),
  clearHistory: vi.fn(),
};

vi.mock('@mfe/shared-event-bus', () => ({
  eventBus: mockEventBus,
}));
```

---

## 10. Event Summary Table

| Event Type             | Domain   | Payload                   | Source       | Description            |
| ---------------------- | -------- | ------------------------- | ------------ | ---------------------- |
| `auth:login`           | auth     | AuthLoginPayload          | auth-mfe     | User logged in         |
| `auth:logout`          | auth     | AuthLogoutPayload         | auth-mfe     | User logged out        |
| `auth:token-refreshed` | auth     | AuthTokenRefreshedPayload | auth-mfe     | JWT token refreshed    |
| `auth:session-expired` | auth     | AuthSessionExpiredPayload | shell        | Session expired        |
| `payments:created`     | payments | PaymentCreatedPayload     | payments-mfe | Payment created        |
| `payments:updated`     | payments | PaymentUpdatedPayload     | payments-mfe | Payment status updated |
| `payments:completed`   | payments | PaymentCompletedPayload   | payments-mfe | Payment completed      |
| `payments:failed`      | payments | PaymentFailedPayload      | payments-mfe | Payment failed         |
| `admin:user-created`   | admin    | AdminUserCreatedPayload   | admin-mfe    | Admin created user     |
| `admin:user-updated`   | admin    | AdminUserUpdatedPayload   | admin-mfe    | Admin updated user     |
| `admin:user-deleted`   | admin    | AdminUserDeletedPayload   | admin-mfe    | Admin deleted user     |
| `admin:config-updated` | admin    | AdminConfigUpdatedPayload | admin-mfe    | System config updated  |
| `system:error`         | system   | SystemErrorPayload        | any          | System error occurred  |
| `system:navigation`    | system   | SystemNavigationPayload   | shell        | Navigation occurred    |

---

## 11. Related Documents

- `docs/References/mfe-poc2-architecture.md` - POC-2 architecture
- `docs/adr/poc-2/0001-event-bus-for-inter-mfe-comm.md` - ADR for event bus decision
- `docs/POC-2-Implementation/type-sharing-strategy.md` - Type sharing strategy

---

**Last Updated:** 2026-01-XX  
**Status:** Authoritative
