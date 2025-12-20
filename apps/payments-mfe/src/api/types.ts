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
 * Update payment details payload
 * Matches backend PUT /payments/:id validator (`updatePaymentSchema`)
 */
export interface UpdatePaymentDetailsDto {
  amount?: number;
  currency?: string;
  description?: string;
  recipientEmail?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Payment reports data (for VENDOR and ADMIN)
 */
export interface PaymentReports {
  totalPayments: number;
  totalAmount: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  period: {
    start: string;
    end: string;
  };
}

/**
 * Payment reports query parameters
 */
export interface PaymentReportsParams {
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

/**
 * Export shared enums and models for convenience in the app
 */
export { Payment, PaymentStatus, PaymentType };
