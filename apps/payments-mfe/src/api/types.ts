import type { Payment } from 'shared-types';
import { PaymentStatus, PaymentType } from 'shared-types';

/**
 * Create payment request payload
 * Matches backend validator (`createPaymentSchema`)
 */
export interface CreatePaymentDto {
  type: PaymentType;
  amount: number;
  currency?: string;
  description?: string;
  recipientId?: string;
  recipientEmail?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Update payment status payload
 * Matches backend validator (`updatePaymentStatusSchema`)
 */
export interface UpdatePaymentDto {
  status: PaymentStatus;
  reason?: string;
}

/**
 * Export shared enums and models for convenience in the app
 */
export { Payment, PaymentStatus, PaymentType };
