/**
 * Event Bus Validation Schemas
 *
 * Zod schemas for runtime validation of event payloads
 * Provides additional security layer beyond TypeScript compile-time checks
 *
 * These schemas match the TypeScript interfaces in the events/ directory
 */

import { z } from 'zod';

// ==================== Shared Schemas ====================

/**
 * User role enum
 */
export const UserRoleSchema = z.enum(['ADMIN', 'CUSTOMER', 'VENDOR']);

/**
 * Auth user schema - matches AuthUser interface
 */
export const AuthUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1).max(255),
  role: UserRoleSchema,
});

/**
 * Event source schema
 */
export const EventSourceSchema = z.enum([
  'shell',
  'auth-mfe',
  'payments-mfe',
  'admin-mfe',
]);

// ==================== Auth Event Schemas ====================
// Matches interfaces in events/auth.ts

export const AuthLoginPayloadSchema = z.object({
  user: AuthUserSchema,
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});

export const AuthLogoutPayloadSchema = z.object({
  userId: z.string().min(1),
  reason: z
    .enum(['user_initiated', 'session_expired', 'token_invalid'])
    .optional(),
});

export const AuthTokenRefreshedPayloadSchema = z.object({
  userId: z.string().min(1),
  accessToken: z.string().min(1),
});

export const AuthSessionExpiredPayloadSchema = z.object({
  userId: z.string().min(1),
  expiredAt: z.string().min(1),
});

export const AuthSignupPayloadSchema = z.object({
  email: z.string().email(),
  emailVerificationRequired: z.boolean(),
});

// ==================== Payment Event Schemas ====================
// Matches interfaces in events/payments.ts

export const PaymentStatusSchema = z.enum([
  'pending',
  'initiated',
  'processing',
  'completed',
  'failed',
  'cancelled',
]);

export const PaymentTypeSchema = z.enum(['initiate', 'payment']);

export const PaymentDataSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  amount: z.number(),
  currency: z.string().min(1),
  status: PaymentStatusSchema,
  type: PaymentTypeSchema,
  description: z.string().optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const PaymentCreatedPayloadSchema = z.object({
  payment: PaymentDataSchema,
});

export const PaymentUpdatedPayloadSchema = z.object({
  payment: PaymentDataSchema,
  previousStatus: PaymentStatusSchema,
});

export const PaymentCompletedPayloadSchema = z.object({
  payment: PaymentDataSchema,
  completedAt: z.string().min(1),
});

export const PaymentFailedPayloadSchema = z.object({
  payment: PaymentDataSchema,
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

// ==================== Admin Event Schemas ====================
// Matches interfaces in events/admin.ts

export const AdminUserDataSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
  role: UserRoleSchema,
});

export const AdminUserCreatedPayloadSchema = z.object({
  user: AdminUserDataSchema,
  createdBy: z.string().min(1),
});

export const AdminUserUpdatedPayloadSchema = z.object({
  user: AdminUserDataSchema,
  updatedBy: z.string().min(1),
  changes: z.record(
    z.object({
      from: z.unknown(),
      to: z.unknown(),
    })
  ),
});

export const AdminUserDeletedPayloadSchema = z.object({
  userId: z.string().min(1),
  deletedBy: z.string().min(1),
});

export const AdminConfigUpdatedPayloadSchema = z.object({
  key: z.string().min(1),
  value: z.unknown(),
  updatedBy: z.string().min(1),
});

// ==================== System Event Schemas ====================
// Matches interfaces in events/system.ts

export const SystemErrorPayloadSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    stack: z.string().optional(),
  }),
  context: z.record(z.unknown()).optional(),
});

export const SystemNavigationPayloadSchema = z.object({
  from: z.string(),
  to: z.string(),
  userId: z.string().optional(),
});

// ==================== Event Type to Schema Map ====================

/**
 * Map of event types to their validation schemas
 */
export const eventPayloadSchemas = {
  'auth:login': AuthLoginPayloadSchema,
  'auth:logout': AuthLogoutPayloadSchema,
  'auth:token-refreshed': AuthTokenRefreshedPayloadSchema,
  'auth:session-expired': AuthSessionExpiredPayloadSchema,
  'auth:signup': AuthSignupPayloadSchema,
  'payments:created': PaymentCreatedPayloadSchema,
  'payments:updated': PaymentUpdatedPayloadSchema,
  'payments:completed': PaymentCompletedPayloadSchema,
  'payments:failed': PaymentFailedPayloadSchema,
  'admin:user-created': AdminUserCreatedPayloadSchema,
  'admin:user-updated': AdminUserUpdatedPayloadSchema,
  'admin:user-deleted': AdminUserDeletedPayloadSchema,
  'admin:config-updated': AdminConfigUpdatedPayloadSchema,
  'system:error': SystemErrorPayloadSchema,
  'system:navigation': SystemNavigationPayloadSchema,
} as const;

export type EventPayloadSchemas = typeof eventPayloadSchemas;

/**
 * Validate an event payload against its schema
 *
 * @param eventType - The event type identifier
 * @param payload - The payload to validate
 * @returns Validation result with success status and parsed data or error
 */
export function validateEventPayload<T extends keyof EventPayloadSchemas>(
  eventType: T,
  payload: unknown
):
  | { success: true; data: z.infer<EventPayloadSchemas[T]> }
  | { success: false; error: z.ZodError } {
  const schema = eventPayloadSchemas[eventType];

  if (!schema) {
    return {
      success: false,
      error: new z.ZodError([
        {
          code: 'custom',
          path: ['eventType'],
          message: `Unknown event type: ${eventType}`,
        },
      ]),
    };
  }

  const result = schema.safeParse(payload);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, error: result.error };
}

/**
 * Check if an event type has a registered schema
 */
export function hasEventSchema(
  eventType: string
): eventType is keyof EventPayloadSchemas {
  return eventType in eventPayloadSchemas;
}
