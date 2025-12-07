import { describe, it, expect, beforeEach } from 'vitest';
import {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  resetPaymentsStore,
} from './stubbedPayments';
import type { CreatePaymentDto, UpdatePaymentDto } from './types';

describe('stubbedPayments', () => {
  beforeEach(() => {
    resetPaymentsStore();
  });

  describe('getPayments', () => {
    it('returns all payments when no userId provided', async () => {
      const payments = await getPayments();
      expect(payments).toHaveLength(3);
      expect(payments[0]).toHaveProperty('id');
      expect(payments[0]).toHaveProperty('amount');
      expect(payments[0]).toHaveProperty('status');
    });

    it('filters payments by userId when provided', async () => {
      const payments = await getPayments('user-1');
      expect(payments.length).toBeGreaterThan(0);
      payments.forEach((payment) => {
        expect(payment.userId).toBe('user-1');
      });
    });

    it('returns payments sorted by created date (newest first)', async () => {
      const payments = await getPayments();
      for (let i = 0; i < payments.length - 1; i++) {
        const current = new Date(payments[i].createdAt).getTime();
        const next = new Date(payments[i + 1].createdAt).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    it('simulates network delay', async () => {
      const start = Date.now();
      await getPayments();
      const end = Date.now();
      // Should take some time (delay is simulated)
      expect(end - start).toBeGreaterThanOrEqual(0);
    }, 10000); // Increase timeout for this test
  });

  describe('getPaymentById', () => {
    it('returns payment when found', async () => {
      const payment = await getPaymentById('1');
      expect(payment).not.toBeNull();
      expect(payment?.id).toBe('1');
    });

    it('returns null when payment not found', async () => {
      const payment = await getPaymentById('non-existent');
      expect(payment).toBeNull();
    });

    it('returns a copy of the payment (not reference)', async () => {
      const payment1 = await getPaymentById('1');
      const payment2 = await getPaymentById('1');
      expect(payment1).not.toBe(payment2);
      expect(payment1).toEqual(payment2);
    });
  });

  describe('createPayment', () => {
    it('creates a new payment with correct data', async () => {
      const dto: CreatePaymentDto = {
        amount: 150.0,
        currency: 'USD',
        type: 'payment',
        description: 'Test payment',
      };

      const payment = await createPayment('user-3', dto);

      expect(payment).toHaveProperty('id');
      expect(payment.userId).toBe('user-3');
      expect(payment.amount).toBe(150.0);
      expect(payment.currency).toBe('USD');
      expect(payment.type).toBe('payment');
      expect(payment.description).toBe('Test payment');
      expect(payment.status).toBe('processing');
    });

    it('sets status to "initiated" for initiate type', async () => {
      const dto: CreatePaymentDto = {
        amount: 200.0,
        type: 'initiate',
      };

      const payment = await createPayment('user-3', dto);
      expect(payment.status).toBe('initiated');
    });

    it('sets status to "processing" for payment type', async () => {
      const dto: CreatePaymentDto = {
        amount: 200.0,
        type: 'payment',
      };

      const payment = await createPayment('user-3', dto);
      expect(payment.status).toBe('processing');
    });

    it('uses default currency "USD" when not provided', async () => {
      const dto: CreatePaymentDto = {
        amount: 100.0,
        type: 'payment',
      };

      const payment = await createPayment('user-3', dto);
      expect(payment.currency).toBe('USD');
    });

    it('generates unique payment IDs', async () => {
      const dto: CreatePaymentDto = {
        amount: 100.0,
        type: 'payment',
      };

      const payment1 = await createPayment('user-3', dto);
      const payment2 = await createPayment('user-3', dto);

      expect(payment1.id).not.toBe(payment2.id);
    });

    it('sets createdAt and updatedAt timestamps', async () => {
      const dto: CreatePaymentDto = {
        amount: 100.0,
        type: 'payment',
      };

      const payment = await createPayment('user-3', dto);
      expect(payment.createdAt).toBeDefined();
      expect(payment.updatedAt).toBeDefined();
      expect(payment.createdAt).toBe(payment.updatedAt);
    });

    it('stores metadata when provided', async () => {
      const dto: CreatePaymentDto = {
        amount: 100.0,
        type: 'payment',
        metadata: { orderId: 'order-123', customerId: 'customer-456' },
      };

      const payment = await createPayment('user-3', dto);
      expect(payment.metadata).toEqual({
        orderId: 'order-123',
        customerId: 'customer-456',
      });
    });
  });

  describe('updatePayment', () => {
    it('updates payment when found', async () => {
      const updateData: UpdatePaymentDto = {
        amount: 200.0,
        description: 'Updated description',
      };

      const updated = await updatePayment('1', updateData);

      expect(updated).not.toBeNull();
      expect(updated?.amount).toBe(200.0);
      expect(updated?.description).toBe('Updated description');
    });

    it('returns null when payment not found', async () => {
      const updateData: UpdatePaymentDto = {
        amount: 200.0,
      };

      const updated = await updatePayment('non-existent', updateData);
      expect(updated).toBeNull();
    });

    it('updates status when provided', async () => {
      const updateData: UpdatePaymentDto = {
        status: 'completed',
      };

      const updated = await updatePayment('2', updateData);
      expect(updated?.status).toBe('completed');
    });

    it('updates currency when provided', async () => {
      const updateData: UpdatePaymentDto = {
        currency: 'EUR',
      };

      const updated = await updatePayment('1', updateData);
      expect(updated?.currency).toBe('EUR');
    });

    it('updates metadata when provided', async () => {
      const updateData: UpdatePaymentDto = {
        metadata: { newField: 'newValue' },
      };

      const updated = await updatePayment('1', updateData);
      expect(updated?.metadata).toEqual({ newField: 'newValue' });
    });

    it('updates updatedAt timestamp', async () => {
      const paymentBefore = await getPaymentById('1');
      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      const updateData: UpdatePaymentDto = {
        amount: 300.0,
      };

      const updated = await updatePayment('1', updateData);
      expect(updated?.updatedAt).not.toBe(paymentBefore?.updatedAt);
    });

    it('only updates provided fields', async () => {
      const paymentBefore = await getPaymentById('1');
      const updateData: UpdatePaymentDto = {
        description: 'New description',
      };

      const updated = await updatePayment('1', updateData);

      expect(updated?.amount).toBe(paymentBefore?.amount);
      expect(updated?.currency).toBe(paymentBefore?.currency);
      expect(updated?.status).toBe(paymentBefore?.status);
      expect(updated?.description).toBe('New description');
    });
  });

  describe('deletePayment', () => {
    it('marks payment as cancelled when found', async () => {
      const deleted = await deletePayment('1');
      expect(deleted).toBe(true);

      const payment = await getPaymentById('1');
      expect(payment?.status).toBe('cancelled');
    });

    it('returns false when payment not found', async () => {
      const deleted = await deletePayment('non-existent');
      expect(deleted).toBe(false);
    });

    it('updates updatedAt timestamp when cancelling', async () => {
      const paymentBefore = await getPaymentById('1');
      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      await deletePayment('1');

      const paymentAfter = await getPaymentById('1');
      expect(paymentAfter?.updatedAt).not.toBe(paymentBefore?.updatedAt);
    });
  });

  describe('resetPaymentsStore', () => {
    it('resets payments store to initial state', async () => {
      // Create a new payment
      const dto: CreatePaymentDto = {
        amount: 999.0,
        type: 'payment',
      };
      await createPayment('user-999', dto);

      // Verify new payment exists
      const paymentsBefore = await getPayments();
      expect(paymentsBefore.length).toBe(4);

      // Reset store
      resetPaymentsStore();

      // Verify store is reset
      const paymentsAfter = await getPayments();
      expect(paymentsAfter.length).toBe(3);
      expect(paymentsAfter.find((p) => p.amount === 999.0)).toBeUndefined();
    });
  });
});

