/**
 * Payment Validators - Unit Tests
 */

import {
  listPaymentsSchema,
  createPaymentSchema,
  updatePaymentStatusSchema,
  webhookPayloadSchema,
} from './payment.validators';
import { ZodError } from 'zod';

describe('Payment Validators', () => {
  describe('listPaymentsSchema', () => {
    it('should validate valid query parameters', () => {
      const validQuery = {
        page: '1',
        limit: '10',
        sort: 'createdAt',
        order: 'desc',
      };

      const result = listPaymentsSchema.parse(validQuery);

      expect(result).toEqual({
        page: 1,
        limit: 10,
        sort: 'createdAt',
        order: 'desc',
      });
    });

    it('should use default values for missing parameters', () => {
      const result = listPaymentsSchema.parse({});

      expect(result).toEqual({
        page: 1,
        limit: 10,
        sort: 'createdAt',
        order: 'desc',
      });
    });

    it('should validate status filter', () => {
      const result = listPaymentsSchema.parse({ status: 'completed' });

      expect(result.status).toBe('completed');
    });

    it('should validate type filter', () => {
      const result = listPaymentsSchema.parse({ type: 'instant' });

      expect(result.type).toBe('instant');
    });

    it('should validate date range filters', () => {
      const query = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      const result = listPaymentsSchema.parse(query);

      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
      expect(result.startDate?.toISOString()).toContain('2024-01-01');
      expect(result.endDate?.toISOString()).toContain('2024-12-31');
    });

    it('should reject limit over 100', () => {
      expect(() => {
        listPaymentsSchema.parse({ limit: '150' });
      }).toThrow(ZodError);
    });

    it('should reject invalid page number', () => {
      expect(() => {
        listPaymentsSchema.parse({ page: '0' });
      }).toThrow(ZodError);
    });

    it('should reject invalid sort field', () => {
      expect(() => {
        listPaymentsSchema.parse({ sort: 'invalid' });
      }).toThrow(ZodError);
    });

    it('should reject invalid order', () => {
      expect(() => {
        listPaymentsSchema.parse({ order: 'invalid' });
      }).toThrow(ZodError);
    });

    it('should accept any string for status (filtered at service layer)', () => {
      const result = listPaymentsSchema.parse({ status: 'invalid' });
      expect(result.status).toBe('invalid');
    });

    it('should accept any string for type (filtered at service layer)', () => {
      const result = listPaymentsSchema.parse({ type: 'invalid' });
      expect(result.type).toBe('invalid');
    });
  });

  describe('createPaymentSchema', () => {
    const validPaymentData = {
      type: 'instant',
      amount: 100.0,
      currency: 'USD',
      description: 'Test payment',
      recipientEmail: 'recipient@example.com',
    };

    it('should validate valid payment data with recipientEmail', () => {
      const result = createPaymentSchema.parse(validPaymentData);

      expect(result).toEqual(validPaymentData);
    });

    it('should validate valid payment data with recipientId', () => {
      const data = {
        ...validPaymentData,
        recipientId: '123e4567-e89b-12d3-a456-426614174000',
        recipientEmail: undefined,
      };

      const result = createPaymentSchema.parse(data);

      expect(result.recipientId).toBe(data.recipientId);
    });

    it('should use default currency INR', () => {
      const data = { ...validPaymentData, currency: undefined };

      const result = createPaymentSchema.parse(data);

      expect(result.currency).toBe('INR');
    });

    it('should validate metadata', () => {
      const data = {
        ...validPaymentData,
        metadata: { key: 'value', nested: { foo: 'bar' } },
      };

      const result = createPaymentSchema.parse(data);

      expect(result.metadata).toEqual(data.metadata);
    });

    it('should reject invalid type', () => {
      const data = { ...validPaymentData, type: 'invalid' };

      expect(() => {
        createPaymentSchema.parse(data);
      }).toThrow(ZodError);
    });

    it('should reject negative amount', () => {
      const data = { ...validPaymentData, amount: -100 };

      expect(() => {
        createPaymentSchema.parse(data);
      }).toThrow(ZodError);
    });

    it('should reject zero amount', () => {
      const data = { ...validPaymentData, amount: 0 };

      expect(() => {
        createPaymentSchema.parse(data);
      }).toThrow(ZodError);
    });

    it('should reject invalid currency format', () => {
      const data = { ...validPaymentData, currency: 'US' };

      expect(() => {
        createPaymentSchema.parse(data);
      }).toThrow(ZodError);
    });

    it('should reject empty description', () => {
      const data = { ...validPaymentData, description: '' };

      expect(() => {
        createPaymentSchema.parse(data);
      }).toThrow(ZodError);
    });

    it('should reject description longer than 500 chars', () => {
      const data = { ...validPaymentData, description: 'a'.repeat(501) };

      expect(() => {
        createPaymentSchema.parse(data);
      }).toThrow(ZodError);
    });

    it('should reject invalid email format', () => {
      const data = { ...validPaymentData, recipientEmail: 'invalid-email' };

      expect(() => {
        createPaymentSchema.parse(data);
      }).toThrow(ZodError);
    });

    it('should reject invalid UUID format for recipientId', () => {
      const data = {
        ...validPaymentData,
        recipientId: 'invalid-uuid',
        recipientEmail: undefined,
      };

      expect(() => {
        createPaymentSchema.parse(data);
      }).toThrow(ZodError);
    });

    it('should reject when both recipientId and recipientEmail are missing', () => {
      const data = {
        ...validPaymentData,
        recipientId: undefined,
        recipientEmail: undefined,
      };

      expect(() => {
        createPaymentSchema.parse(data);
      }).toThrow(ZodError);
    });
  });

  describe('updatePaymentStatusSchema', () => {
    it('should validate valid status update', () => {
      const validData = {
        status: 'completed',
        reason: 'Payment processed',
      };

      const result = updatePaymentStatusSchema.parse(validData);

      expect(result).toEqual(validData);
    });

    it('should validate status update without reason', () => {
      const validData = {
        status: 'completed',
      };

      const result = updatePaymentStatusSchema.parse(validData);

      expect(result.status).toBe('completed');
      expect(result.reason).toBeUndefined();
    });

    it('should validate all valid statuses', () => {
      const validStatuses = [
        'pending',
        'processing',
        'completed',
        'failed',
        'cancelled',
      ];

      validStatuses.forEach(status => {
        const result = updatePaymentStatusSchema.parse({ status });
        expect(result.status).toBe(status);
      });
    });

    it('should reject invalid status', () => {
      expect(() => {
        updatePaymentStatusSchema.parse({ status: 'invalid' });
      }).toThrow(ZodError);
    });

    it('should reject reason longer than 500 chars', () => {
      const data = {
        status: 'failed',
        reason: 'a'.repeat(501),
      };

      expect(() => {
        updatePaymentStatusSchema.parse(data);
      }).toThrow(ZodError);
    });
  });

  describe('webhookPayloadSchema', () => {
    it('should validate complete webhook payload', () => {
      const validPayload = {
        paymentId: '123e4567-e89b-12d3-a456-426614174000',
        status: 'completed',
        pspTransactionId: 'psp-tx-123',
        pspStatus: 'success',
        failureReason: 'None',
        metadata: { key: 'value' },
      };

      const result = webhookPayloadSchema.parse(validPayload);

      expect(result).toEqual(validPayload);
    });

    it('should validate minimal webhook payload', () => {
      const validPayload = {
        paymentId: '123e4567-e89b-12d3-a456-426614174000',
        status: 'completed',
      };

      const result = webhookPayloadSchema.parse(validPayload);

      expect(result.paymentId).toBe(validPayload.paymentId);
      expect(result.status).toBe(validPayload.status);
    });

    it('should validate all valid statuses', () => {
      const validStatuses = [
        'pending',
        'processing',
        'completed',
        'failed',
        'cancelled',
      ];

      validStatuses.forEach(status => {
        const payload = {
          paymentId: '123e4567-e89b-12d3-a456-426614174000',
          status,
        };
        const result = webhookPayloadSchema.parse(payload);
        expect(result.status).toBe(status);
      });
    });

    it('should reject invalid paymentId format', () => {
      const payload = {
        paymentId: 'invalid-uuid',
        status: 'completed',
      };

      expect(() => {
        webhookPayloadSchema.parse(payload);
      }).toThrow(ZodError);
    });

    it('should reject invalid status', () => {
      const payload = {
        paymentId: '123e4567-e89b-12d3-a456-426614174000',
        status: 'invalid',
      };

      expect(() => {
        webhookPayloadSchema.parse(payload);
      }).toThrow(ZodError);
    });

    it('should accept pspTransactionId of any length', () => {
      const payload = {
        paymentId: '123e4567-e89b-12d3-a456-426614174000',
        status: 'completed',
        pspTransactionId: 'a'.repeat(256),
      };

      const result = webhookPayloadSchema.parse(payload);
      expect(result.pspTransactionId).toBe('a'.repeat(256));
    });
  });
});
