/**
 * Payment Model
 *
 * Payment model types matching the Prisma schema
 */

import { PaymentStatus, PaymentType } from '../enums';

/**
 * Payment model
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
 * Payment transaction model
 */
export interface PaymentTransaction {
  id: string;
  paymentId: string;
  transactionType: string;
  amount: number;
  status: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
