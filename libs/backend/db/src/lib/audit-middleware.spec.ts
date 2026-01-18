/**
 * Database Audit Middleware Tests
 */

import {
  createDbAuditMiddleware,
  DbAuditAction,
  DbAuditEvent,
  getDbAuditConfigFromEnv,
  getDbAuditStats,
  resetDbAuditStats,
  trackAuditEvent,
} from './audit-middleware';

describe('Database Audit Middleware', () => {
  // Mock next function
  const createMockNext = (result: unknown) =>
    jest.fn().mockResolvedValue(result);

  // Mock params
  const createMockParams = (
    action: string,
    model: string,
    args?: Record<string, unknown>
  ) => ({
    model,
    action,
    args,
    dataPath: [],
    runInTransaction: false,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createDbAuditMiddleware', () => {
    it('should audit create operations', async () => {
      const onAuditEvent = jest.fn();
      const middleware = createDbAuditMiddleware({
        serviceName: 'test-service',
        onAuditEvent,
        logger: jest.fn(),
      });

      const mockResult = { id: '123', name: 'Test User', email: 'test@example.com' };
      const next = createMockNext(mockResult);
      const params = createMockParams('create', 'User', { data: { name: 'Test User' } });

      const result = await middleware(params, next);

      expect(result).toEqual(mockResult);
      expect(next).toHaveBeenCalledWith(params);

      // Wait for async callback
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(onAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          serviceName: 'test-service',
          action: DbAuditAction.DB_CREATE,
          model: 'User',
          recordId: '123',
        })
      );
    });

    it('should audit update operations', async () => {
      const onAuditEvent = jest.fn();
      const middleware = createDbAuditMiddleware({
        serviceName: 'test-service',
        onAuditEvent,
        logger: jest.fn(),
      });

      const mockResult = { id: '123', name: 'Updated User' };
      const next = createMockNext(mockResult);
      const params = createMockParams('update', 'User', {
        where: { id: '123' },
        data: { name: 'Updated User' },
      });

      await middleware(params, next);

      // Wait for async callback
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(onAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: DbAuditAction.DB_UPDATE,
          model: 'User',
          metadata: expect.objectContaining({
            where: { id: '123' },
            dataInput: { name: 'Updated User' },
          }),
        })
      );
    });

    it('should audit delete operations', async () => {
      const onAuditEvent = jest.fn();
      const middleware = createDbAuditMiddleware({
        serviceName: 'test-service',
        onAuditEvent,
        logger: jest.fn(),
      });

      const mockResult = { id: '123', name: 'Deleted User' };
      const next = createMockNext(mockResult);
      const params = createMockParams('delete', 'User', { where: { id: '123' } });

      await middleware(params, next);

      // Wait for async callback
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(onAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: DbAuditAction.DB_DELETE,
          model: 'User',
          metadata: expect.objectContaining({
            where: { id: '123' },
          }),
        })
      );
    });

    it('should skip non-write operations', async () => {
      const onAuditEvent = jest.fn();
      const middleware = createDbAuditMiddleware({
        serviceName: 'test-service',
        onAuditEvent,
        logger: jest.fn(),
      });

      const mockResult = [{ id: '1' }, { id: '2' }];
      const next = createMockNext(mockResult);
      const params = createMockParams('findMany', 'User', {});

      await middleware(params, next);

      expect(onAuditEvent).not.toHaveBeenCalled();
    });

    it('should redact sensitive fields', async () => {
      const onAuditEvent = jest.fn();
      const middleware = createDbAuditMiddleware({
        serviceName: 'test-service',
        onAuditEvent,
        redactFields: ['password', 'token'],
        logger: jest.fn(),
      });

      const mockResult = {
        id: '123',
        email: 'test@example.com',
        password: 'secret123',
        token: 'abc123',
      };
      const next = createMockNext(mockResult);
      const params = createMockParams('create', 'User', {
        data: { email: 'test@example.com', password: 'secret123' },
      });

      await middleware(params, next);

      // Wait for async callback
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(onAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          dataAfter: expect.objectContaining({
            email: 'test@example.com',
            password: '[REDACTED]',
            token: '[REDACTED]',
          }),
        })
      );
    });

    it('should exclude specified models', async () => {
      const onAuditEvent = jest.fn();
      const middleware = createDbAuditMiddleware({
        serviceName: 'test-service',
        onAuditEvent,
        excludeModels: ['AuditLog', 'Session'],
        logger: jest.fn(),
      });

      const next = createMockNext({ id: '123' });
      const params = createMockParams('create', 'AuditLog', {});

      await middleware(params, next);

      expect(onAuditEvent).not.toHaveBeenCalled();
    });

    it('should only include specified models when includeModels is set', async () => {
      const onAuditEvent = jest.fn();
      const middleware = createDbAuditMiddleware({
        serviceName: 'test-service',
        onAuditEvent,
        includeModels: ['User', 'Payment'],
        logger: jest.fn(),
      });

      const next = createMockNext({ id: '123' });

      // Should audit User
      await middleware(createMockParams('create', 'User', {}), next);
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(onAuditEvent).toHaveBeenCalledTimes(1);

      // Should not audit Session
      await middleware(createMockParams('create', 'Session', {}), next);
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(onAuditEvent).toHaveBeenCalledTimes(1); // Still 1
    });

    it('should include user context when provided', async () => {
      const onAuditEvent = jest.fn();
      const middleware = createDbAuditMiddleware({
        serviceName: 'test-service',
        onAuditEvent,
        getUserContext: () => ({ userId: 'user-456', metadata: { role: 'admin' } }),
        logger: jest.fn(),
      });

      const next = createMockNext({ id: '123' });
      const params = createMockParams('create', 'User', {});

      await middleware(params, next);

      // Wait for async callback
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(onAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-456',
          metadata: expect.objectContaining({
            role: 'admin',
          }),
        })
      );
    });

    it('should handle errors and still log', async () => {
      const logger = jest.fn();
      const middleware = createDbAuditMiddleware({
        serviceName: 'test-service',
        logger,
      });

      const error = new Error('Database error');
      const next = jest.fn().mockRejectedValue(error);
      const params = createMockParams('create', 'User', {});

      await expect(middleware(params, next)).rejects.toThrow('Database error');

      expect(logger).toHaveBeenCalledWith(
        '[DB Audit] FAILED DB_CREATE on User',
        expect.objectContaining({
          error: 'Database error',
        })
      );
    });

    it('should be disabled when enabled=false', async () => {
      const onAuditEvent = jest.fn();
      const middleware = createDbAuditMiddleware({
        serviceName: 'test-service',
        enabled: false,
        onAuditEvent,
        logger: jest.fn(),
      });

      const next = createMockNext({ id: '123' });
      const params = createMockParams('create', 'User', {});

      await middleware(params, next);

      expect(onAuditEvent).not.toHaveBeenCalled();
    });

    it('should audit createMany operations', async () => {
      const onAuditEvent = jest.fn();
      const middleware = createDbAuditMiddleware({
        serviceName: 'test-service',
        onAuditEvent,
        logger: jest.fn(),
      });

      const mockResult = { count: 3 };
      const next = createMockNext(mockResult);
      const params = createMockParams('createMany', 'User', {
        data: [{ name: 'User 1' }, { name: 'User 2' }, { name: 'User 3' }],
      });

      await middleware(params, next);

      // Wait for async callback
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(onAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: DbAuditAction.DB_CREATE_MANY,
          model: 'User',
        })
      );
    });

    it('should audit upsert operations', async () => {
      const onAuditEvent = jest.fn();
      const middleware = createDbAuditMiddleware({
        serviceName: 'test-service',
        onAuditEvent,
        logger: jest.fn(),
      });

      const mockResult = { id: '123', name: 'Upserted User' };
      const next = createMockNext(mockResult);
      const params = createMockParams('upsert', 'User', {
        where: { email: 'test@example.com' },
        create: { email: 'test@example.com', name: 'New User' },
        update: { name: 'Updated User' },
      });

      await middleware(params, next);

      // Wait for async callback
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(onAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: DbAuditAction.DB_UPSERT,
          model: 'User',
        })
      );
    });

    it('should extract record IDs from array results', async () => {
      const onAuditEvent = jest.fn();
      const middleware = createDbAuditMiddleware({
        serviceName: 'test-service',
        onAuditEvent,
        logger: jest.fn(),
      });

      const mockResult = [
        { id: '1', name: 'User 1' },
        { id: '2', name: 'User 2' },
      ];
      const next = createMockNext(mockResult);
      const params = createMockParams('create', 'User', {}); // Hypothetical batch create

      await middleware(params, next);

      // Wait for async callback
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(onAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          recordId: ['1', '2'],
        })
      );
    });
  });

  describe('getDbAuditConfigFromEnv', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should return default config when no env vars set', () => {
      const config = getDbAuditConfigFromEnv('test-service');

      expect(config.serviceName).toBe('test-service');
      expect(config.enabled).toBe(true);
    });

    it('should respect DB_AUDIT_ENABLED=false', () => {
      process.env.DB_AUDIT_ENABLED = 'false';
      const config = getDbAuditConfigFromEnv('test-service');

      expect(config.enabled).toBe(false);
    });

    it('should parse DB_AUDIT_EXCLUDE_MODELS', () => {
      process.env.DB_AUDIT_EXCLUDE_MODELS = 'AuditLog, Session, Token';
      const config = getDbAuditConfigFromEnv('test-service');

      expect(config.excludeModels).toEqual(['AuditLog', 'Session', 'Token']);
    });

    it('should parse DB_AUDIT_INCLUDE_MODELS', () => {
      process.env.DB_AUDIT_INCLUDE_MODELS = 'User, Payment';
      const config = getDbAuditConfigFromEnv('test-service');

      expect(config.includeModels).toEqual(['User', 'Payment']);
    });

    it('should parse DB_AUDIT_REDACT_FIELDS', () => {
      process.env.DB_AUDIT_REDACT_FIELDS = 'password, secret, apiKey';
      const config = getDbAuditConfigFromEnv('test-service');

      expect(config.redactFields).toEqual(['password', 'secret', 'apiKey']);
    });
  });

  describe('Audit Stats', () => {
    beforeEach(() => {
      resetDbAuditStats('test-service');
    });

    it('should track audit events', () => {
      const event: DbAuditEvent = {
        serviceName: 'test-service',
        action: DbAuditAction.DB_CREATE,
        model: 'User',
        recordId: '123',
        durationMs: 50,
        timestamp: new Date(),
      };

      trackAuditEvent(event);

      const stats = getDbAuditStats('test-service');
      expect(stats).toBeDefined();
      expect(stats?.totalEvents).toBe(1);
      expect(stats?.eventsByAction[DbAuditAction.DB_CREATE]).toBe(1);
      expect(stats?.eventsByModel['User']).toBe(1);
    });

    it('should accumulate stats across multiple events', () => {
      trackAuditEvent({
        serviceName: 'test-service',
        action: DbAuditAction.DB_CREATE,
        model: 'User',
        durationMs: 50,
        timestamp: new Date(),
      });

      trackAuditEvent({
        serviceName: 'test-service',
        action: DbAuditAction.DB_UPDATE,
        model: 'User',
        durationMs: 30,
        timestamp: new Date(),
      });

      trackAuditEvent({
        serviceName: 'test-service',
        action: DbAuditAction.DB_CREATE,
        model: 'Payment',
        durationMs: 40,
        timestamp: new Date(),
      });

      const stats = getDbAuditStats('test-service');
      expect(stats?.totalEvents).toBe(3);
      expect(stats?.eventsByAction[DbAuditAction.DB_CREATE]).toBe(2);
      expect(stats?.eventsByAction[DbAuditAction.DB_UPDATE]).toBe(1);
      expect(stats?.eventsByModel['User']).toBe(2);
      expect(stats?.eventsByModel['Payment']).toBe(1);
    });

    it('should reset stats', () => {
      trackAuditEvent({
        serviceName: 'test-service',
        action: DbAuditAction.DB_CREATE,
        model: 'User',
        durationMs: 50,
        timestamp: new Date(),
      });

      expect(getDbAuditStats('test-service')?.totalEvents).toBe(1);

      resetDbAuditStats('test-service');

      expect(getDbAuditStats('test-service')?.totalEvents).toBe(0);
    });

    it('should return undefined for unknown service', () => {
      expect(getDbAuditStats('unknown-service')).toBeUndefined();
    });
  });
});
