/**
 * Payment status enum
 */
export type PaymentStatus =
  | 'pending'
  | 'initiated'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Payment type enum
 */
export type PaymentType = 'initiate' | 'payment';

/**
 * Payment interface
 * Represents a payment in the system
 */
export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  type: PaymentType;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create payment DTO (Data Transfer Object)
 */
export interface CreatePaymentDto {
  amount: number;
  currency?: string;
  type: PaymentType;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Update payment DTO
 */
export interface UpdatePaymentDto {
  amount?: number;
  currency?: string;
  status?: PaymentStatus;
  description?: string;
  metadata?: Record<string, unknown>;
}

