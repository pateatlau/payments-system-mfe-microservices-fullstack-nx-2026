/**
 * Payment Validators - Unit Tests
 *
 * Tests for enhanced validation including:
 * - XSS sanitization
 * - Amount limits
 * - ISO 4217 currency validation
 * - UUID validation
 */

import {
  listPaymentsSchema,
  createPaymentSchema,
  updatePaymentStatusSchema,
  updatePaymentSchema,
  webhookPayloadSchema,
  uuidParamSchema,
  reportsQuerySchema,
  MAX_PAYMENT_AMOUNT,
  MIN_PAYMENT_AMOUNT,
  ISO_4217_CURRENCIES,
  PAYMENT_STATUSES,
  PAYMENT_TYPES,
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

    // Enhanced: status and type are now strict enums
    it('should validate valid status enum', () => {
      PAYMENT_STATUSES.forEach((status) => {
        const result = listPaymentsSchema.parse({ status });
        expect(result.status).toBe(status);
      });
    });

    it('should validate valid type enum', () => {
      PAYMENT_TYPES.forEach((type) => {
        const result = listPaymentsSchema.parse({ type });
        expect(result.type).toBe(type);
      });
    });

    it('should reject invalid status', () => {
      expect(() => {
        listPaymentsSchema.parse({ status: 'invalid' });
      }).toThrow(ZodError);
    });

    it('should reject invalid type', () => {
      expect(() => {
        listPaymentsSchema.parse({ type: 'invalid' });
      }).toThrow(ZodError);
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

    // Enhanced: XSS sanitization tests
    describe('XSS sanitization', () => {
      it('should sanitize HTML tags from description', () => {
        const data = {
          ...validPaymentData,
          description: '<script>alert("xss")</script>Test payment',
        };

        const result = createPaymentSchema.parse(data);
        expect(result.description).toBe('alert("xss")Test payment');
        expect(result.description).not.toContain('<script>');
      });

      it('should sanitize javascript: protocol from description', () => {
        const data = {
          ...validPaymentData,
          description: 'javascript:alert("xss") Payment',
        };

        const result = createPaymentSchema.parse(data);
        expect(result.description).not.toContain('javascript:');
      });

      it('should sanitize onclick handlers from description', () => {
        const data = {
          ...validPaymentData,
          description: 'Test onclick=alert("xss") payment',
        };

        const result = createPaymentSchema.parse(data);
        expect(result.description).not.toMatch(/onclick\s*=/i);
      });

      it('should trim whitespace from description', () => {
        const data = {
          ...validPaymentData,
          description: '  Test payment  ',
        };

        const result = createPaymentSchema.parse(data);
        expect(result.description).toBe('Test payment');
      });

      it('should remove null bytes from description', () => {
        const data = {
          ...validPaymentData,
          description: 'Test\0payment',
        };

        const result = createPaymentSchema.parse(data);
        expect(result.description).toBe('Testpayment');
      });
    });

    // Enhanced: Amount limits tests
    describe('Amount limits', () => {
      it('should accept minimum valid amount', () => {
        const data = {
          ...validPaymentData,
          amount: MIN_PAYMENT_AMOUNT,
        };

        const result = createPaymentSchema.parse(data);
        expect(result.amount).toBe(MIN_PAYMENT_AMOUNT);
      });

      it('should accept maximum valid amount', () => {
        const data = {
          ...validPaymentData,
          amount: MAX_PAYMENT_AMOUNT,
        };

        const result = createPaymentSchema.parse(data);
        expect(result.amount).toBe(MAX_PAYMENT_AMOUNT);
      });

      it('should reject amount exceeding maximum', () => {
        const data = {
          ...validPaymentData,
          amount: MAX_PAYMENT_AMOUNT + 1,
        };

        expect(() => {
          createPaymentSchema.parse(data);
        }).toThrow(ZodError);
      });

      it('should reject amount below minimum', () => {
        const data = {
          ...validPaymentData,
          amount: MIN_PAYMENT_AMOUNT / 2,
        };

        expect(() => {
          createPaymentSchema.parse(data);
        }).toThrow(ZodError);
      });
    });

    // Enhanced: ISO 4217 currency validation tests
    describe('ISO 4217 currency validation', () => {
      it('should accept valid ISO 4217 currencies', () => {
        const validCurrencies = ['USD', 'EUR', 'GBP', 'INR', 'JPY'];
        validCurrencies.forEach((currency) => {
          const data = { ...validPaymentData, currency };
          const result = createPaymentSchema.parse(data);
          expect(result.currency).toBe(currency);
        });
      });

      it('should normalize currency to uppercase', () => {
        const data = { ...validPaymentData, currency: 'usd' };
        const result = createPaymentSchema.parse(data);
        expect(result.currency).toBe('USD');
      });

      it('should reject invalid currency code', () => {
        const data = { ...validPaymentData, currency: 'XYZ' };

        expect(() => {
          createPaymentSchema.parse(data);
        }).toThrow(ZodError);
      });

      it('should reject currency code with wrong length', () => {
        const data = { ...validPaymentData, currency: 'US' };

        expect(() => {
          createPaymentSchema.parse(data);
        }).toThrow(ZodError);
      });
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

    it('should accept pspTransactionId within length limit', () => {
      const payload = {
        paymentId: '123e4567-e89b-12d3-a456-426614174000',
        status: 'completed',
        pspTransactionId: 'a'.repeat(255),
      };

      const result = webhookPayloadSchema.parse(payload);
      expect(result.pspTransactionId).toBe('a'.repeat(255));
    });

    it('should reject pspTransactionId exceeding length limit', () => {
      const payload = {
        paymentId: '123e4567-e89b-12d3-a456-426614174000',
        status: 'completed',
        pspTransactionId: 'a'.repeat(256),
      };

      expect(() => {
        webhookPayloadSchema.parse(payload);
      }).toThrow(ZodError);
    });

    it('should sanitize XSS in failureReason', () => {
      const payload = {
        paymentId: '123e4567-e89b-12d3-a456-426614174000',
        status: 'failed',
        failureReason: '<script>alert("xss")</script>Insufficient funds',
      };

      const result = webhookPayloadSchema.parse(payload);
      expect(result.failureReason).not.toContain('<script>');
      expect(result.failureReason).toContain('Insufficient funds');
    });
  });

  describe('uuidParamSchema', () => {
    it('should validate valid UUID', () => {
      const result = uuidParamSchema.parse({
        id: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should reject invalid UUID format', () => {
      expect(() => {
        uuidParamSchema.parse({ id: 'invalid-uuid' });
      }).toThrow(ZodError);
    });

    it('should reject empty string', () => {
      expect(() => {
        uuidParamSchema.parse({ id: '' });
      }).toThrow(ZodError);
    });

    it('should reject missing id', () => {
      expect(() => {
        uuidParamSchema.parse({});
      }).toThrow(ZodError);
    });
  });

  describe('reportsQuerySchema', () => {
    it('should validate date range parameters', () => {
      const result = reportsQuerySchema.parse({
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });

      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
    });

    it('should accept empty query', () => {
      const result = reportsQuerySchema.parse({});
      expect(result.startDate).toBeUndefined();
      expect(result.endDate).toBeUndefined();
    });
  });

  describe('updatePaymentSchema', () => {
    it('should validate update with amount', () => {
      const result = updatePaymentSchema.parse({ amount: 100 });
      expect(result.amount).toBe(100);
    });

    it('should validate update with description', () => {
      const result = updatePaymentSchema.parse({
        description: 'Updated description',
      });
      expect(result.description).toBe('Updated description');
    });

    it('should reject empty update', () => {
      expect(() => {
        updatePaymentSchema.parse({});
      }).toThrow(ZodError);
    });

    it('should sanitize XSS in description', () => {
      const result = updatePaymentSchema.parse({
        description: '<img src=x onerror=alert("xss")>Test',
      });
      expect(result.description).not.toContain('<img');
      expect(result.description).not.toMatch(/onerror\s*=/i);
    });

    it('should reject amount exceeding maximum', () => {
      expect(() => {
        updatePaymentSchema.parse({ amount: MAX_PAYMENT_AMOUNT + 1 });
      }).toThrow(ZodError);
    });
  });

  describe('Exported constants', () => {
    it('should export PAYMENT_STATUSES array', () => {
      expect(PAYMENT_STATUSES).toContain('pending');
      expect(PAYMENT_STATUSES).toContain('completed');
      expect(PAYMENT_STATUSES.length).toBe(5);
    });

    it('should export PAYMENT_TYPES array', () => {
      expect(PAYMENT_TYPES).toContain('instant');
      expect(PAYMENT_TYPES).toContain('scheduled');
      expect(PAYMENT_TYPES).toContain('recurring');
      expect(PAYMENT_TYPES.length).toBe(3);
    });

    it('should export ISO_4217_CURRENCIES array', () => {
      expect(ISO_4217_CURRENCIES).toContain('USD');
      expect(ISO_4217_CURRENCIES).toContain('EUR');
      expect(ISO_4217_CURRENCIES).toContain('INR');
      expect(ISO_4217_CURRENCIES.length).toBeGreaterThan(10);
    });

    it('should export amount limits', () => {
      expect(MAX_PAYMENT_AMOUNT).toBe(10_000_000);
      expect(MIN_PAYMENT_AMOUNT).toBe(0.01);
    });
  });
});
