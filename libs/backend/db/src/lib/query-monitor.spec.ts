import {
  createQueryMonitorMiddleware,
  getQueryStats,
  resetQueryStats,
  getAllQueryStats,
  formatQueryStats,
  getQueryMonitorConfigFromEnv,
  QueryMonitorConfig,
  SlowQueryInfo,
  QueryTimeoutInfo,
} from './query-monitor';

describe('QueryMonitor', () => {
  const serviceName = 'test-service';

  beforeEach(() => {
    resetQueryStats(serviceName);
  });

  describe('createQueryMonitorMiddleware', () => {
    it('should create middleware function', () => {
      const middleware = createQueryMonitorMiddleware({ serviceName });
      expect(typeof middleware).toBe('function');
    });

    it('should initialize query stats for service', () => {
      createQueryMonitorMiddleware({ serviceName });
      const stats = getQueryStats(serviceName);
      expect(stats).toBeDefined();
      expect(stats?.totalQueries).toBe(0);
      expect(stats?.slowQueries).toBe(0);
      expect(stats?.timeoutQueries).toBe(0);
    });

    it('should track query execution', async () => {
      const middleware = createQueryMonitorMiddleware({ serviceName });
      const mockNext = jest.fn().mockResolvedValue({ id: 1 });

      const params = {
        model: 'User',
        action: 'findUnique',
        args: { where: { id: 1 } },
        dataPath: [],
        runInTransaction: false,
      };

      await middleware(params, mockNext);

      const stats = getQueryStats(serviceName);
      expect(stats?.totalQueries).toBe(1);
      expect(stats?.queriesByModel['User']).toBe(1);
      expect(stats?.queriesByAction['findUnique']).toBe(1);
    });

    it('should track multiple queries', async () => {
      const middleware = createQueryMonitorMiddleware({ serviceName });
      const mockNext = jest.fn().mockResolvedValue({ id: 1 });

      const params1 = { model: 'User', action: 'findUnique', args: {}, dataPath: [], runInTransaction: false };
      const params2 = { model: 'User', action: 'findMany', args: {}, dataPath: [], runInTransaction: false };
      const params3 = { model: 'Post', action: 'findUnique', args: {}, dataPath: [], runInTransaction: false };

      await middleware(params1, mockNext);
      await middleware(params2, mockNext);
      await middleware(params3, mockNext);

      const stats = getQueryStats(serviceName);
      expect(stats?.totalQueries).toBe(3);
      expect(stats?.queriesByModel['User']).toBe(2);
      expect(stats?.queriesByModel['Post']).toBe(1);
      expect(stats?.queriesByAction['findUnique']).toBe(2);
      expect(stats?.queriesByAction['findMany']).toBe(1);
    });

    it('should detect slow queries', async () => {
      const slowQueryCallback = jest.fn();
      const middleware = createQueryMonitorMiddleware({
        serviceName,
        slowQueryThresholdMs: 10,
        onSlowQuery: slowQueryCallback,
      });

      // Mock a slow query (delay 50ms)
      const mockNext = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return { id: 1 };
      });

      const params = { model: 'User', action: 'findMany', args: {}, dataPath: [], runInTransaction: false };
      await middleware(params, mockNext);

      const stats = getQueryStats(serviceName);
      expect(stats?.slowQueries).toBe(1);
      expect(slowQueryCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          serviceName,
          model: 'User',
          action: 'findMany',
        })
      );
    });

    it('should detect query timeouts', async () => {
      const timeoutCallback = jest.fn();
      const middleware = createQueryMonitorMiddleware({
        serviceName,
        queryTimeoutMs: 50,
        onQueryTimeout: timeoutCallback,
      });

      // Mock a query that takes longer than timeout
      const mockNext = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return { id: 1 };
      });

      const params = { model: 'User', action: 'findMany', args: {}, dataPath: [], runInTransaction: false };
      
      await expect(middleware(params, mockNext)).rejects.toThrow('Query timeout');
      
      const stats = getQueryStats(serviceName);
      expect(stats?.timeoutQueries).toBe(1);
      expect(timeoutCallback).toHaveBeenCalled();
    }, 10000);

    it('should handle queries without model', async () => {
      const middleware = createQueryMonitorMiddleware({ serviceName });
      const mockNext = jest.fn().mockResolvedValue([]);

      const params = { model: undefined, action: 'queryRaw', args: {}, dataPath: [], runInTransaction: false };
      await middleware(params, mockNext);

      const stats = getQueryStats(serviceName);
      expect(stats?.queriesByModel['unknown']).toBe(1);
    });

    it('should pass through query results', async () => {
      const middleware = createQueryMonitorMiddleware({ serviceName });
      const expectedResult = { id: 1, name: 'Test' };
      const mockNext = jest.fn().mockResolvedValue(expectedResult);

      const params = { model: 'User', action: 'findUnique', args: {}, dataPath: [], runInTransaction: false };
      const result = await middleware(params, mockNext);

      expect(result).toEqual(expectedResult);
    });

    it('should rethrow non-timeout errors', async () => {
      const middleware = createQueryMonitorMiddleware({ serviceName });
      const error = new Error('Database error');
      const mockNext = jest.fn().mockRejectedValue(error);

      const params = { model: 'User', action: 'findUnique', args: {}, dataPath: [], runInTransaction: false };
      
      await expect(middleware(params, mockNext)).rejects.toThrow('Database error');
    });

    it('should update duration statistics', async () => {
      const middleware = createQueryMonitorMiddleware({ serviceName });
      const mockNext = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return { id: 1 };
      });

      const params = { model: 'User', action: 'findUnique', args: {}, dataPath: [], runInTransaction: false };
      await middleware(params, mockNext);
      await middleware(params, mockNext);

      const stats = getQueryStats(serviceName);
      expect(stats?.avgDurationMs).toBeGreaterThan(0);
      expect(stats?.maxDurationMs).toBeGreaterThan(0);
      expect(stats?.minDurationMs).toBeGreaterThan(0);
    });
  });

  describe('getQueryStats', () => {
    it('should return undefined for unknown service', () => {
      const stats = getQueryStats('unknown-service');
      expect(stats).toBeUndefined();
    });

    it('should return stats for known service', () => {
      createQueryMonitorMiddleware({ serviceName });
      const stats = getQueryStats(serviceName);
      expect(stats).toBeDefined();
    });
  });

  describe('resetQueryStats', () => {
    it('should reset all stats to initial values', async () => {
      const middleware = createQueryMonitorMiddleware({ serviceName });
      const mockNext = jest.fn().mockResolvedValue({ id: 1 });

      await middleware({ model: 'User', action: 'findUnique', args: {}, dataPath: [], runInTransaction: false }, mockNext);
      
      let stats = getQueryStats(serviceName);
      expect(stats?.totalQueries).toBe(1);

      resetQueryStats(serviceName);
      
      stats = getQueryStats(serviceName);
      expect(stats?.totalQueries).toBe(0);
    });
  });

  describe('getAllQueryStats', () => {
    it('should return stats for all services', () => {
      createQueryMonitorMiddleware({ serviceName: 'service-a' });
      createQueryMonitorMiddleware({ serviceName: 'service-b' });

      const allStats = getAllQueryStats();
      expect(allStats.has('service-a')).toBe(true);
      expect(allStats.has('service-b')).toBe(true);
    });
  });

  describe('formatQueryStats', () => {
    it('should format stats for output', () => {
      createQueryMonitorMiddleware({ serviceName });
      const stats = getQueryStats(serviceName)!;
      const formatted = formatQueryStats(stats);

      expect(formatted).toHaveProperty('totalQueries');
      expect(formatted).toHaveProperty('slowQueries');
      expect(formatted).toHaveProperty('timeoutQueries');
      expect(formatted).toHaveProperty('avgDurationMs');
      expect(formatted).toHaveProperty('slowQueryRate');
      expect(formatted).toHaveProperty('timeoutRate');
      expect(formatted).toHaveProperty('lastUpdated');
    });

    it('should handle minDurationMs Infinity', () => {
      createQueryMonitorMiddleware({ serviceName });
      const stats = getQueryStats(serviceName)!;
      const formatted = formatQueryStats(stats);

      expect(formatted.minDurationMs).toBe(0);
    });
  });

  describe('getQueryMonitorConfigFromEnv', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should return default values', () => {
      const config = getQueryMonitorConfigFromEnv('test');
      expect(config.serviceName).toBe('test');
      expect(config.queryTimeoutMs).toBe(10000);
      expect(config.slowQueryThresholdMs).toBe(1000);
      expect(config.enableMetrics).toBe(true);
      expect(config.enableLogging).toBe(true);
    });

    it('should read from environment variables', () => {
      process.env.DB_QUERY_TIMEOUT_MS = '5000';
      process.env.DB_SLOW_QUERY_THRESHOLD_MS = '500';
      process.env.DB_ENABLE_QUERY_METRICS = 'false';
      process.env.DB_ENABLE_SLOW_QUERY_LOGGING = 'false';

      const config = getQueryMonitorConfigFromEnv('test');
      expect(config.queryTimeoutMs).toBe(5000);
      expect(config.slowQueryThresholdMs).toBe(500);
      expect(config.enableMetrics).toBe(false);
      expect(config.enableLogging).toBe(false);
    });
  });
});
