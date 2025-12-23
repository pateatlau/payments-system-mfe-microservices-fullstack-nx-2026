/**
 * Payment Request Validators
 */

import { z } from 'zod';

// List payments query parameters
export const listPaymentsSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  sort: z
    .enum(['createdAt', 'amount', 'status'])
    .optional()
    .default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  status: z.string().optional(),
  type: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type ListPaymentsQuery = z.infer<typeof listPaymentsSchema>;

// Create payment request body
export const createPaymentSchema = z
  .object({
    type: z.enum(['instant', 'scheduled', 'recurring']),
    amount: z.number().positive(),
    currency: z.string().length(3).default('USD'),
    description: z.string().min(1).max(500),
    recipientId: z.string().uuid().optional(),
    recipientEmail: z.string().email().optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .refine(data => data.recipientId || data.recipientEmail, {
    message: 'Either recipientId or recipientEmail must be provided',
  });

export type CreatePaymentRequest = z.infer<typeof createPaymentSchema>;

// Update payment status request body
export const updatePaymentStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']),
  reason: z.string().max(500).optional(),
});

export type UpdatePaymentStatusRequest = z.infer<
  typeof updatePaymentStatusSchema
>;

/**
 * Payload for PUT /api/payments/:id
 * - Currency updates are intentionally disallowed.
 * - Metadata is treated as a full replacement when provided.
 * - At least one field must be present.
 */
export const updatePaymentSchema = z
  .object({
    amount: z.number().positive('Amount must be positive').optional(),
    description: z.string().max(500).optional(),
    recipientId: z.string().uuid().optional(),
    recipientEmail: z.string().email().optional(),
    metadata: z.record(z.unknown()).optional(),
    type: z.enum(['instant', 'scheduled', 'recurring']).optional(),
  })
  .refine(
    data =>
      data.amount !== undefined ||
      data.description !== undefined ||
      data.recipientId !== undefined ||
      data.recipientEmail !== undefined ||
      data.metadata !== undefined ||
      data.type !== undefined,
    { message: 'Must provide at least one field to update' }
  );

export type UpdatePaymentRequest = z.infer<typeof updatePaymentSchema>;

// Webhook payload (for PSP callbacks)
export const webhookPayloadSchema = z.object({
  paymentId: z.string().uuid(),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']),
  pspTransactionId: z.string().optional(),
  pspStatus: z.string().optional(),
  failureReason: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;
