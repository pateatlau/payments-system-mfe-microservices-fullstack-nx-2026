/**
 * Payment Request Validators
 *
 * Enhanced with:
 * - Text sanitization (XSS prevention)
 * - Amount limits (max transaction value)
 * - ISO 4217 currency validation
 * - UUID validation for IDs
 */

import { z } from 'zod';

// ============================================================================
// SECURITY: Text Sanitization
// ============================================================================

/**
 * Sanitize string input to prevent XSS attacks
 * - Removes HTML tags
 * - Trims whitespace
 * - Normalizes unicode
 */
function sanitizeString(value: string): string {
  return value
    .trim()
    .normalize('NFC')
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script-like patterns
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    // Remove null bytes
    .replace(/\0/g, '');
}

/**
 * Create a sanitized string schema with optional length constraints
 * Sanitizes input then validates length
 */
const sanitizedString = (minLength = 0, maxLength?: number) => {
  // Base: transform to sanitize the string
  const baseSchema = z.string().transform(sanitizeString);

  // Build validation chain based on constraints
  if (minLength > 0 && maxLength !== undefined) {
    return baseSchema.pipe(
      z
        .string()
        .min(minLength, `Must be at least ${minLength} characters`)
        .max(maxLength, `Must be at most ${maxLength} characters`)
    );
  } else if (minLength > 0) {
    return baseSchema.pipe(
      z.string().min(minLength, `Must be at least ${minLength} characters`)
    );
  } else if (maxLength !== undefined) {
    return baseSchema.pipe(
      z.string().max(maxLength, `Must be at most ${maxLength} characters`)
    );
  }

  return baseSchema;
};

// ============================================================================
// SECURITY: Amount Validation
// ============================================================================

/**
 * Maximum payment amount (10 million in base currency)
 * This limit prevents:
 * - Integer overflow attacks
 * - Fraudulent large transactions
 * - Database precision issues
 */
const MAX_PAYMENT_AMOUNT = 10_000_000;
const MIN_PAYMENT_AMOUNT = 0.01;

const amountSchema = z
  .number()
  .positive('Amount must be positive')
  .min(MIN_PAYMENT_AMOUNT, `Amount must be at least ${MIN_PAYMENT_AMOUNT}`)
  .max(MAX_PAYMENT_AMOUNT, `Amount cannot exceed ${MAX_PAYMENT_AMOUNT.toLocaleString()}`);

// ============================================================================
// SECURITY: ISO 4217 Currency Validation
// ============================================================================

/**
 * Common ISO 4217 currency codes
 * Add more as needed for your business requirements
 */
const ISO_4217_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'MXN',
  'BRL', 'KRW', 'SGD', 'HKD', 'NOK', 'SEK', 'DKK', 'NZD', 'ZAR', 'RUB',
  'AED', 'SAR', 'THB', 'MYR', 'IDR', 'PHP', 'VND', 'PLN', 'CZK', 'HUF',
  'ILS', 'TRY', 'TWD', 'CLP', 'COP', 'PEN', 'ARS', 'EGP', 'NGN', 'KES',
] as const;

const currencySchema = z
  .string()
  .length(3, 'Currency must be a 3-letter ISO 4217 code')
  .toUpperCase()
  .refine(
    (val) => ISO_4217_CURRENCIES.includes(val as typeof ISO_4217_CURRENCIES[number]),
    { message: 'Invalid currency code. Must be a valid ISO 4217 currency.' }
  );

// ============================================================================
// SECURITY: UUID Validation for IDs
// ============================================================================

/**
 * Schema for validating UUID path parameters
 */
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export type UuidParam = z.infer<typeof uuidParamSchema>;

// ============================================================================
// SCHEMAS: List Payments Query
// ============================================================================

/**
 * Valid payment statuses (whitelist)
 */
const PAYMENT_STATUSES = ['pending', 'processing', 'completed', 'failed', 'cancelled'] as const;

/**
 * Valid payment types (whitelist)
 */
const PAYMENT_TYPES = ['instant', 'scheduled', 'recurring'] as const;

/**
 * List payments query parameters
 * - Strict enum validation for status/type to prevent SQL injection via filter manipulation
 * - Pagination with limits
 */
export const listPaymentsSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  sort: z
    .enum(['createdAt', 'amount', 'status'])
    .optional()
    .default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  // Enhanced: Strict enum validation instead of any string
  status: z.enum(PAYMENT_STATUSES).optional(),
  type: z.enum(PAYMENT_TYPES).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type ListPaymentsQuery = z.infer<typeof listPaymentsSchema>;

// ============================================================================
// SCHEMAS: Create Payment
// ============================================================================

/**
 * Create payment request body
 * Enhanced with:
 * - Sanitized description (XSS prevention)
 * - Amount limits (min/max)
 * - ISO 4217 currency validation
 */
export const createPaymentSchema = z
  .object({
    type: z.enum(PAYMENT_TYPES),
    amount: amountSchema,
    currency: currencySchema.default('INR'),
    description: sanitizedString(1, 500),
    recipientId: z.string().uuid().optional(),
    recipientEmail: z.string().email().optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .refine((data) => data.recipientId || data.recipientEmail, {
    message: 'Either recipientId or recipientEmail must be provided',
  });

export type CreatePaymentRequest = z.infer<typeof createPaymentSchema>;

// ============================================================================
// SCHEMAS: Update Payment Status
// ============================================================================

/**
 * Update payment status request body
 * Enhanced with sanitized reason text
 */
export const updatePaymentStatusSchema = z.object({
  status: z.enum(PAYMENT_STATUSES),
  reason: sanitizedString(0, 500).optional(),
});

export type UpdatePaymentStatusRequest = z.infer<
  typeof updatePaymentStatusSchema
>;

// ============================================================================
// SCHEMAS: Update Payment
// ============================================================================

/**
 * Payload for PUT /api/payments/:id
 * - Currency updates are intentionally disallowed.
 * - Metadata is treated as a full replacement when provided.
 * - At least one field must be present.
 * Enhanced with:
 * - Amount limits
 * - Sanitized description
 */
export const updatePaymentSchema = z
  .object({
    amount: amountSchema.optional(),
    description: sanitizedString(0, 500).optional(),
    recipientId: z.string().uuid().optional(),
    recipientEmail: z.string().email().optional(),
    metadata: z.record(z.unknown()).optional(),
    type: z.enum(PAYMENT_TYPES).optional(),
  })
  .refine(
    (data) =>
      data.amount !== undefined ||
      data.description !== undefined ||
      data.recipientId !== undefined ||
      data.recipientEmail !== undefined ||
      data.metadata !== undefined ||
      data.type !== undefined,
    { message: 'Must provide at least one field to update' }
  );

export type UpdatePaymentRequest = z.infer<typeof updatePaymentSchema>;

// ============================================================================
// SCHEMAS: Webhook Payload
// ============================================================================

/**
 * Webhook payload (for PSP callbacks)
 * Enhanced with:
 * - Sanitized string fields
 * - Length limits on PSP fields
 */
export const webhookPayloadSchema = z.object({
  paymentId: z.string().uuid(),
  status: z.enum(PAYMENT_STATUSES),
  pspTransactionId: sanitizedString(0, 255).optional(),
  pspStatus: sanitizedString(0, 100).optional(),
  failureReason: sanitizedString(0, 1000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;

// ============================================================================
// SCHEMAS: Reports Query
// ============================================================================

/**
 * Reports query parameters
 * For GET /api/payments/reports
 */
export const reportsQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type ReportsQuery = z.infer<typeof reportsQuerySchema>;

// ============================================================================
// EXPORT: Constants for reuse
// ============================================================================

export { PAYMENT_STATUSES, PAYMENT_TYPES, ISO_4217_CURRENCIES, MAX_PAYMENT_AMOUNT, MIN_PAYMENT_AMOUNT };
