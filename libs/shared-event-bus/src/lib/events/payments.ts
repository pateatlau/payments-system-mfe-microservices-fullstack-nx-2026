/**
 * Payment Events
 *
 * Event definitions for payment-related operations
 * Emitted by Payments MFE
 */

import { BaseEvent } from '../types';

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
 * Emitted when a new payment is created
 */
export interface PaymentCreatedPayload {
  payment: PaymentData;
}

/**
 * Payment updated event payload
 * Emitted when a payment is updated
 */
export interface PaymentUpdatedPayload {
  payment: PaymentData;
  previousStatus: PaymentStatus;
}

/**
 * Payment completed event payload
 * Emitted when a payment is successfully completed
 */
export interface PaymentCompletedPayload {
  payment: PaymentData;
  completedAt: string;
}

/**
 * Payment failed event payload
 * Emitted when a payment fails
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

/**
 * Payment event type strings
 */
export type PaymentEventType = PaymentEvent['type'];
