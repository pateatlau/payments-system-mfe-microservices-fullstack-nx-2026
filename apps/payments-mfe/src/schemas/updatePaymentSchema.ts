import { z } from 'zod';

/**
 * Validation schema for updating payment details
 *
 * Rules:
 * - Amount must be positive if provided
 * - Currency must be 3 uppercase letters if provided (e.g., USD, EUR, GBP)
 * - Recipient email must be valid format if provided
 * - Description can be any string if provided
 * - Metadata can be any object if provided
 *
 * Note: Form-level validation should prevent updates to completed/failed payments
 */
export const updatePaymentSchema = z.object({
  amount: z
    .number({
      invalid_type_error: 'Amount must be a number',
    })
    .positive('Amount must be greater than 0')
    .optional(),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/, 'Currency must be 3 uppercase letters (e.g., USD)')
    .optional(),
  description: z.string().optional(),
  recipientEmail: z
    .string()
    .email('Invalid email format')
    .optional()
    .or(z.literal('')), // Allow empty string
  metadata: z.record(z.unknown()).optional(),
});

export type UpdatePaymentFormData = z.infer<typeof updatePaymentSchema>;
