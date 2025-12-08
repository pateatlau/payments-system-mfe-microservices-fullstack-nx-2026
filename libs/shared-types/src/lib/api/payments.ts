/**
 * Payments API Types
 *
 * Request and response types for Payments Service endpoints
 */

import type { Payment, PaymentTransaction } from '../models/payment';
import type { PaymentStatus, PaymentType } from '../enums';
import type { ApiResponse, PaginatedResponse } from './common';

/**
 * Create payment request
 */
export interface CreatePaymentRequest {
  amount: number;
  currency: string;
  description?: string;
  type: PaymentType;
  metadata?: Record<string, unknown>;
}

/**
 * Create payment response
 */
export type CreatePaymentResponse = ApiResponse<Payment>;

/**
 * Update payment request
 */
export interface UpdatePaymentRequest {
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Update payment response
 */
export type UpdatePaymentResponse = ApiResponse<Payment>;

/**
 * Update payment status request
 */
export interface UpdatePaymentStatusRequest {
  status: PaymentStatus;
}

/**
 * Update payment status response
 */
export type UpdatePaymentStatusResponse = ApiResponse<Payment>;

/**
 * Get payments query parameters
 */
export interface GetPaymentsParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  status?: PaymentStatus;
  type?: PaymentType;
  startDate?: string;
  endDate?: string;
}

/**
 * Get payments response
 */
export type GetPaymentsResponse = PaginatedResponse<Payment>;

/**
 * Payment with transactions
 */
export interface PaymentWithTransactions extends Payment {
  transactions: PaymentTransaction[];
}

/**
 * Get payment by ID response
 */
export type GetPaymentResponse = ApiResponse<PaymentWithTransactions>;
