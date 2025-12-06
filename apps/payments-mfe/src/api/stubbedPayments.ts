/**
 * Stubbed Payment APIs
 *
 * ⚠️ IMPORTANT: All payment operations are STUBBED (no actual PSP integration)
 * This is for POC-1 only. Real Payment Service Provider integration will be
 * implemented in MVP/Production phases.
 *
 * These APIs simulate payment processing with:
 * - In-memory storage (no database)
 * - Simulated network delays
 * - Mock payment processing
 * - No actual money transfers
 */

import type {
  Payment,
  CreatePaymentDto,
  UpdatePaymentDto,
  PaymentStatus,
} from './types';

/**
 * In-memory payment storage (simulates database)
 * In production, this would be replaced with actual database calls
 */
let paymentsStore: Payment[] = [
  {
    id: '1',
    userId: 'user-1',
    amount: 100.0,
    currency: 'USD',
    status: 'completed',
    type: 'payment',
    description: 'Payment for services',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '2',
    userId: 'user-2',
    amount: 250.5,
    currency: 'USD',
    status: 'pending',
    type: 'initiate',
    description: 'Initiated payment request',
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '3',
    userId: 'user-1',
    amount: 75.25,
    currency: 'USD',
    status: 'processing',
    type: 'payment',
    description: 'Payment in progress',
    createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
  },
];

/**
 * Simulate network delay
 * @param ms - Milliseconds to delay
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a unique payment ID
 */
function generatePaymentId(): string {
  return `payment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get all payments
 * In production, this would filter by user role and permissions
 *
 * @param userId - Optional user ID to filter payments (for CUSTOMER role)
 * @returns Promise resolving to array of payments
 */
export async function getPayments(userId?: string): Promise<Payment[]> {
  // Simulate network delay (300-500ms)
  await delay(300 + Math.random() * 200);

  let payments = [...paymentsStore];

  // If userId provided, filter by user (for CUSTOMER role - see own payments only)
  if (userId) {
    payments = payments.filter((payment) => payment.userId === userId);
  }

  // Sort by created date (newest first)
  return payments.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Get a single payment by ID
 *
 * @param id - Payment ID
 * @returns Promise resolving to payment or null if not found
 */
export async function getPaymentById(id: string): Promise<Payment | null> {
  // Simulate network delay (200-400ms)
  await delay(200 + Math.random() * 200);

  const payment = paymentsStore.find((p) => p.id === id);
  return payment ? { ...payment } : null;
}

/**
 * Create a new payment (stubbed)
 * In production, this would:
 * - Validate payment data
 * - Create payment record in database
 * - Initiate payment processing with PSP
 * - Publish payment.created event
 *
 * @param userId - User ID creating the payment
 * @param data - Payment data
 * @returns Promise resolving to created payment
 */
export async function createPayment(
  userId: string,
  data: CreatePaymentDto
): Promise<Payment> {
  // Simulate network delay (400-600ms)
  await delay(400 + Math.random() * 200);

  const now = new Date().toISOString();

  // Determine initial status based on payment type
  let status: PaymentStatus = 'pending';
  if (data.type === 'initiate') {
    status = 'initiated';
  } else if (data.type === 'payment') {
    status = 'processing';
  }

  const paymentId = generatePaymentId();
  const newPayment: Payment = {
    id: paymentId,
    userId,
    amount: data.amount,
    currency: data.currency ?? 'USD',
    status,
    type: data.type,
    description: data.description,
    metadata: data.metadata,
    createdAt: now,
    updatedAt: now,
  };

  paymentsStore.push(newPayment);

  // Simulate payment processing - after a delay, mark as completed (for payment type only)
  if (data.type === 'payment' && status === 'processing') {
    setTimeout(() => {
      const payment = paymentsStore.find((p) => p.id === paymentId);
      if (payment && payment.status === 'processing') {
        payment.status = 'completed';
        payment.updatedAt = new Date().toISOString();
      }
    }, 2000);
  }

  return { ...newPayment };
}

/**
 * Update an existing payment (stubbed)
 * In production, this would:
 * - Validate update data
 * - Update payment record in database
 * - Publish payment.updated event
 *
 * @param id - Payment ID
 * @param data - Update data
 * @returns Promise resolving to updated payment or null if not found
 */
export async function updatePayment(
  id: string,
  data: UpdatePaymentDto
): Promise<Payment | null> {
  // Simulate network delay (300-500ms)
  await delay(300 + Math.random() * 200);

  const paymentIndex = paymentsStore.findIndex((p) => p.id === id);

  if (paymentIndex === -1) {
    return null;
  }

  const payment = paymentsStore[paymentIndex];
  if (!payment) {
    return null;
  }

  // Create updated payment object
  const updatedPayment: Payment = {
    ...payment,
    ...(data.amount !== undefined && { amount: data.amount }),
    ...(data.currency !== undefined && { currency: data.currency }),
    ...(data.status !== undefined && { status: data.status }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.metadata !== undefined && { metadata: data.metadata }),
    updatedAt: new Date().toISOString(),
  };

  // Update the store
  paymentsStore[paymentIndex] = updatedPayment;

  return { ...updatedPayment };
}

/**
 * Delete (cancel) a payment (stubbed)
 * In production, this would:
 * - Validate payment can be cancelled
 * - Update payment status to 'cancelled'
 * - Publish payment.cancelled event
 *
 * @param id - Payment ID
 * @returns Promise resolving to true if deleted, false if not found
 */
export async function deletePayment(id: string): Promise<boolean> {
  // Simulate network delay (200-400ms)
  await delay(200 + Math.random() * 200);

  const paymentIndex = paymentsStore.findIndex((p) => p.id === id);

  if (paymentIndex === -1) {
    return false;
  }

  const payment = paymentsStore[paymentIndex];
  if (!payment) {
    return false;
  }

  // Instead of deleting, mark as cancelled (soft delete pattern)
  payment.status = 'cancelled';
  payment.updatedAt = new Date().toISOString();

  return true;
}

/**
 * Reset the payments store (useful for testing)
 * ⚠️ This should only be used in test environments
 */
export function resetPaymentsStore(): void {
  paymentsStore = [
    {
      id: '1',
      userId: 'user-1',
      amount: 100.0,
      currency: 'USD',
      status: 'completed',
      type: 'payment',
      description: 'Payment for services',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: '2',
      userId: 'user-2',
      amount: 250.5,
      currency: 'USD',
      status: 'pending',
      type: 'initiate',
      description: 'Initiated payment request',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      userId: 'user-1',
      amount: 75.25,
      currency: 'USD',
      status: 'processing',
      type: 'payment',
      description: 'Payment in progress',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ];
}

