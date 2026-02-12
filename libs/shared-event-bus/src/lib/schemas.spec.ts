import {
  validateEventPayload,
  hasEventSchema,
  AuthLoginPayloadSchema,
  PaymentCreatedPayloadSchema,
  eventPayloadSchemas,
} from './schemas';

describe('Event Bus Validation Schemas', () => {
  describe('hasEventSchema', () => {
    it('should return true for valid event types', () => {
      expect(hasEventSchema('auth:login')).toBe(true);
      expect(hasEventSchema('payments:created')).toBe(true);
      expect(hasEventSchema('admin:user-created')).toBe(true);
      expect(hasEventSchema('system:error')).toBe(true);
    });

    it('should return false for unknown event types', () => {
      expect(hasEventSchema('unknown:event')).toBe(false);
      expect(hasEventSchema('')).toBe(false);
    });
  });

  describe('validateEventPayload', () => {
    /**
     * POC-3 Phase 7.2: Auth login payload tests updated
     * Tokens are no longer included in auth:login events for security
     */
    describe('auth:login', () => {
      const validPayload = {
        user: {
          id: '123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'CUSTOMER' as const,
        },
        // POC-3 Phase 7.2: Tokens removed for security
      };

      it('should accept valid auth:login payload without tokens', () => {
        const result = validateEventPayload('auth:login', validPayload);
        expect(result.success).toBe(true);
      });

      it('should reject payload with empty user id', () => {
        const result = validateEventPayload('auth:login', {
          ...validPayload,
          user: { ...validPayload.user, id: '' },
        });
        expect(result.success).toBe(false);
      });

      it('should reject payload with invalid email', () => {
        const result = validateEventPayload('auth:login', {
          ...validPayload,
          user: { ...validPayload.user, email: 'not-an-email' },
        });
        expect(result.success).toBe(false);
      });

      it('should reject payload with invalid role', () => {
        const result = validateEventPayload('auth:login', {
          ...validPayload,
          user: { ...validPayload.user, role: 'INVALID_ROLE' },
        });
        expect(result.success).toBe(false);
      });
    });

    describe('payments:created', () => {
      const validPayload = {
        payment: {
          id: '123',
          userId: 'user1',
          amount: 100.5,
          currency: 'INR',
          status: 'pending' as const,
          type: 'payment' as const,
          createdAt: '2026-02-12T10:00:00.000Z',
          updatedAt: '2026-02-12T10:00:00.000Z',
        },
      };

      it('should accept valid payments:created payload', () => {
        const result = validateEventPayload('payments:created', validPayload);
        expect(result.success).toBe(true);
      });

      it('should reject payload with invalid status', () => {
        const result = validateEventPayload('payments:created', {
          payment: {
            ...validPayload.payment,
            status: 'INVALID',
          },
        });
        expect(result.success).toBe(false);
      });

      it('should reject payload with invalid type', () => {
        const result = validateEventPayload('payments:created', {
          payment: {
            ...validPayload.payment,
            type: 'invalid-type',
          },
        });
        expect(result.success).toBe(false);
      });

      it('should reject payload without payment object', () => {
        const result = validateEventPayload('payments:created', {
          amount: 100,
        });
        expect(result.success).toBe(false);
      });
    });

    describe('system:error', () => {
      it('should accept valid system:error payload', () => {
        const result = validateEventPayload('system:error', {
          error: {
            code: 'ERR_001',
            message: 'Something went wrong',
            stack: 'Error: Something went wrong\n  at ...',
          },
          context: { userId: '123', action: 'test' },
        });
        expect(result.success).toBe(true);
      });

      it('should accept minimal system:error payload', () => {
        const result = validateEventPayload('system:error', {
          error: {
            code: 'ERR_001',
            message: 'Something went wrong',
          },
        });
        expect(result.success).toBe(true);
      });

      it('should reject payload without error object', () => {
        const result = validateEventPayload('system:error', {
          message: 'Something went wrong',
        });
        expect(result.success).toBe(false);
      });

      it('should reject payload without error message', () => {
        const result = validateEventPayload('system:error', {
          error: {
            code: 'ERR_001',
          },
        });
        expect(result.success).toBe(false);
      });
    });

    describe('auth:logout', () => {
      it('should accept valid auth:logout payload', () => {
        const result = validateEventPayload('auth:logout', {
          userId: '123',
          reason: 'user_initiated',
        });
        expect(result.success).toBe(true);
      });

      it('should accept auth:logout without reason', () => {
        const result = validateEventPayload('auth:logout', {
          userId: '123',
        });
        expect(result.success).toBe(true);
      });

      it('should reject invalid reason', () => {
        const result = validateEventPayload('auth:logout', {
          userId: '123',
          reason: 'invalid_reason',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('system:navigation', () => {
      it('should accept valid system:navigation payload', () => {
        const result = validateEventPayload('system:navigation', {
          from: '/home',
          to: '/payments',
        });
        expect(result.success).toBe(true);
      });

      it('should accept system:navigation with userId', () => {
        const result = validateEventPayload('system:navigation', {
          from: '/home',
          to: '/payments',
          userId: 'user123',
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Individual Schema Tests', () => {
    /**
     * POC-3 Phase 7.2: Auth login schema updated - tokens removed for security
     */
    describe('AuthLoginPayloadSchema', () => {
      it('should validate payload with user only (no tokens)', () => {
        const result = AuthLoginPayloadSchema.safeParse({
          user: {
            id: '123',
            email: 'test@example.com',
            name: 'Test',
            role: 'ADMIN',
          },
          // POC-3 Phase 7.2: Tokens removed for security
        });
        expect(result.success).toBe(true);
      });
    });

    describe('PaymentCreatedPayloadSchema', () => {
      it('should validate complete payload', () => {
        const result = PaymentCreatedPayloadSchema.safeParse({
          payment: {
            id: '123',
            userId: 'user1',
            amount: 1000,
            currency: 'INR',
            status: 'pending',
            type: 'payment',
            createdAt: '2026-02-12T00:00:00.000Z',
            updatedAt: '2026-02-12T00:00:00.000Z',
          },
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('eventPayloadSchemas coverage', () => {
    it('should have schemas for all documented event types', () => {
      const expectedEventTypes = [
        'auth:login',
        'auth:logout',
        'auth:token-refreshed',
        'auth:session-expired',
        'auth:signup',
        'payments:created',
        'payments:updated',
        'payments:completed',
        'payments:failed',
        'admin:user-created',
        'admin:user-updated',
        'admin:user-deleted',
        'admin:config-updated',
        'system:error',
        'system:navigation',
      ];

      expectedEventTypes.forEach((eventType) => {
        expect(eventPayloadSchemas).toHaveProperty(eventType);
      });
    });
  });
});
