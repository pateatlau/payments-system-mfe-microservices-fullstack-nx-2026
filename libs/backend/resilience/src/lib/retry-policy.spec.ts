/**
 * Retry Policy Tests
 */

import {
  withRetry,
  withHttpRetry,
  RetryPolicy,
  createRetryPolicy,
  getRetryBudget,
  getRetryBudgetStats,
  getAllRetryBudgetStats,
  resetRetryBudget,
  resetAllRetryBudgets,
  isIdempotentMethod,
  isSafeToRetry,
  isRetryableError,
  calculateRetryDelay,
  initRetryMetrics,
  registerServiceRetryPolicy,
  getServiceRetryPolicy,
  getOrCreateServiceRetryPolicy,
} from './retry-policy';

describe('Retry Policy', () => {
  beforeEach(() => {
    // Reset all budgets before each test
    resetAllRetryBudgets();
  });

  describe('isIdempotentMethod', () => {
    it('should return true for idempotent methods', () => {
      expect(isIdempotentMethod('GET')).toBe(true);
      expect(isIdempotentMethod('HEAD')).toBe(true);
      expect(isIdempotentMethod('OPTIONS')).toBe(true);
      expect(isIdempotentMethod('PUT')).toBe(true);
      expect(isIdempotentMethod('DELETE')).toBe(true);
    });

    it('should return false for non-idempotent methods', () => {
      expect(isIdempotentMethod('POST')).toBe(false);
      expect(isIdempotentMethod('PATCH')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isIdempotentMethod('get')).toBe(true);
      expect(isIdempotentMethod('post')).toBe(false);
    });
  });

  describe('isSafeToRetry', () => {
    it('should respect explicit idempotent flag', () => {
      expect(isSafeToRetry('POST', true)).toBe(true);
      expect(isSafeToRetry('GET', false)).toBe(false);
    });

    it('should fall back to method detection', () => {
      expect(isSafeToRetry('GET')).toBe(true);
      expect(isSafeToRetry('POST')).toBe(false);
    });
  });

  describe('isRetryableError', () => {
    it('should return true for network errors', () => {
      expect(isRetryableError({ code: 'ECONNRESET' })).toBe(true);
      expect(isRetryableError({ code: 'ETIMEDOUT' })).toBe(true);
      expect(isRetryableError({ code: 'ECONNREFUSED' })).toBe(true);
    });

    it('should return true for retryable HTTP status codes', () => {
      expect(isRetryableError({ status: 500 })).toBe(true);
      expect(isRetryableError({ status: 502 })).toBe(true);
      expect(isRetryableError({ status: 503 })).toBe(true);
      expect(isRetryableError({ status: 504 })).toBe(true);
      expect(isRetryableError({ statusCode: 429 })).toBe(true);
    });

    it('should return false for non-retryable errors', () => {
      expect(isRetryableError({ status: 400 })).toBe(false);
      expect(isRetryableError({ status: 401 })).toBe(false);
      expect(isRetryableError({ status: 404 })).toBe(false);
      expect(isRetryableError({ code: 'SOME_OTHER_ERROR' })).toBe(false);
    });

    it('should return true for timeout errors', () => {
      expect(isRetryableError(new Error('Request timeout'))).toBe(true);
      expect(isRetryableError({ name: 'TimeoutError' })).toBe(true);
    });

    it('should return false for null/undefined', () => {
      expect(isRetryableError(null)).toBe(false);
      expect(isRetryableError(undefined)).toBe(false);
    });
  });

  describe('calculateRetryDelay', () => {
    it('should calculate exponential backoff', () => {
      // With jitter disabled for predictable tests
      const delay1 = calculateRetryDelay(1, 100, 2, 5000, false);
      const delay2 = calculateRetryDelay(2, 100, 2, 5000, false);
      const delay3 = calculateRetryDelay(3, 100, 2, 5000, false);

      expect(delay1).toBe(100);  // 100 * 2^0 = 100
      expect(delay2).toBe(200);  // 100 * 2^1 = 200
      expect(delay3).toBe(400);  // 100 * 2^2 = 400
    });

    it('should cap at max delay', () => {
      const delay = calculateRetryDelay(10, 100, 2, 5000, false);
      expect(delay).toBe(5000);
    });

    it('should add jitter by default', () => {
      const delays = new Set<number>();
      for (let i = 0; i < 10; i++) {
        delays.add(calculateRetryDelay(1, 100, 2, 5000, true));
      }
      // With jitter, we should get some variance
      expect(delays.size).toBeGreaterThan(1);
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await withRetry(operation, {
        maxRetries: 3,
        serviceName: 'test-service-1',
      });

      expect(result.success).toBe(true);
      expect(result.value).toBe('success');
      expect(result.attempts).toBe(1);
      expect(result.retriesNeeded).toBe(false);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on transient failure and succeed', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce({ code: 'ECONNRESET' })
        .mockRejectedValueOnce({ code: 'ETIMEDOUT' })
        .mockResolvedValue('success');

      const result = await withRetry(operation, {
        maxRetries: 3,
        initialDelayMs: 10,
        serviceName: 'test-service-2',
      });

      expect(result.success).toBe(true);
      expect(result.value).toBe('success');
      expect(result.attempts).toBe(3);
      expect(result.retriesNeeded).toBe(true);
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const error = { code: 'ECONNREFUSED' };
      const operation = jest.fn().mockRejectedValue(error);

      const result = await withRetry(operation, {
        maxRetries: 2,
        initialDelayMs: 10,
        serviceName: 'test-service-3',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.attempts).toBe(3); // 1 + 2 retries
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-retryable errors', async () => {
      const error = { status: 400 }; // Bad request - not retryable
      const operation = jest.fn().mockRejectedValue(error);

      const result = await withRetry(operation, {
        maxRetries: 3,
        serviceName: 'test-service-4',
      });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should not retry non-idempotent operations', async () => {
      const error = { code: 'ECONNRESET' }; // Retryable error
      const operation = jest.fn().mockRejectedValue(error);

      const result = await withRetry(operation, {
        maxRetries: 3,
        isIdempotent: false,
        serviceName: 'test-service-5',
      });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry callback', async () => {
      const onRetry = jest.fn();
      const operation = jest.fn()
        .mockRejectedValueOnce({ code: 'ECONNRESET' })
        .mockResolvedValue('success');

      await withRetry(operation, {
        maxRetries: 3,
        initialDelayMs: 10,
        onRetry,
        serviceName: 'test-service-6',
      });

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Object), expect.any(Number));
    });

    it('should use custom isRetryable function', async () => {
      const customIsRetryable = jest.fn().mockReturnValue(false);
      const operation = jest.fn().mockRejectedValue(new Error('test'));

      const result = await withRetry(operation, {
        maxRetries: 3,
        isRetryable: customIsRetryable,
        serviceName: 'test-service-7',
      });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(customIsRetryable).toHaveBeenCalled();
    });
  });

  describe('withHttpRetry', () => {
    it('should detect idempotency from HTTP method', async () => {
      const error = { code: 'ECONNRESET' };
      const operation = jest.fn().mockRejectedValue(error);

      // GET is idempotent, should retry
      const getResult = await withHttpRetry(operation, {
        method: 'GET',
        maxRetries: 2,
        initialDelayMs: 10,
        serviceName: 'http-test-1',
      });
      expect(getResult.attempts).toBeGreaterThan(1);

      operation.mockClear();

      // POST is not idempotent, should not retry
      const postResult = await withHttpRetry(operation, {
        method: 'POST',
        maxRetries: 2,
        serviceName: 'http-test-2',
      });
      expect(postResult.attempts).toBe(1);
    });

    it('should allow explicit override of idempotency', async () => {
      const error = { code: 'ECONNRESET' };
      const operation = jest.fn().mockRejectedValue(error);

      // POST with explicit isIdempotent=true should retry
      const result = await withHttpRetry(operation, {
        method: 'POST',
        isIdempotent: true,
        maxRetries: 2,
        initialDelayMs: 10,
        serviceName: 'http-test-3',
      });
      expect(result.attempts).toBeGreaterThan(1);
    });
  });

  describe('Retry Budget', () => {
    it('should track requests and retries', () => {
      const budget = getRetryBudget('budget-test-1');

      budget.recordRequest();
      budget.recordRequest();
      budget.recordRetry();

      const stats = budget.getStats();
      expect(stats.totalRequests).toBe(2);
      expect(stats.totalRetries).toBe(1);
      expect(stats.retryRatio).toBe(0.5);
    });

    it('should allow retries within budget', () => {
      const budget = getRetryBudget('budget-test-2', {
        maxRetryRatio: 0.2, // 20% retry ratio
        minRequestsForBudget: 5,
      });

      // Add enough requests to activate budget
      for (let i = 0; i < 10; i++) {
        budget.recordRequest();
      }

      // With 10 requests and 20% ratio, max 2 retries allowed
      // After 2 retries, ratio = 2/10 = 0.2, which should block further retries
      expect(budget.canRetry()).toBe(true);
      budget.recordRetry();
      expect(budget.canRetry()).toBe(true);
      budget.recordRetry();

      // Should block when budget exhausted (ratio >= 0.2)
      expect(budget.canRetry()).toBe(false);
    });

    it('should always allow retries below minimum threshold', () => {
      const budget = getRetryBudget('budget-test-3', {
        maxRetryRatio: 0.1, // Very low ratio
        minRequestsForBudget: 10,
      });

      // Below minimum, should always allow
      budget.recordRequest();
      budget.recordRetry();
      expect(budget.canRetry()).toBe(true);

      budget.recordRetry();
      expect(budget.canRetry()).toBe(true);
    });

    it('should reset budget correctly', () => {
      const budget = getRetryBudget('budget-test-4');

      budget.recordRequest();
      budget.recordRetry();
      budget.reset();

      const stats = budget.getStats();
      expect(stats.totalRequests).toBe(0);
      expect(stats.totalRetries).toBe(0);
    });

    it('should get all budget stats', () => {
      getRetryBudget('budget-test-5').recordRequest();
      getRetryBudget('budget-test-6').recordRequest();

      const allStats = getAllRetryBudgetStats();
      expect(allStats['budget-test-5']).toBeDefined();
      expect(allStats['budget-test-6']).toBeDefined();
    });
  });

  describe('RetryPolicy class', () => {
    it('should execute with configured settings', async () => {
      const policy = createRetryPolicy({
        maxRetries: 2,
        initialDelayMs: 10,
        serviceName: 'policy-test-1',
      });

      const operation = jest.fn()
        .mockRejectedValueOnce({ code: 'ECONNRESET' })
        .mockResolvedValue('success');

      const result = await policy.execute(operation);

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
    });

    it('should execute HTTP operations', async () => {
      const policy = createRetryPolicy({
        maxRetries: 2,
        initialDelayMs: 10,
        serviceName: 'policy-test-2',
      });

      const error = { code: 'ECONNRESET' };
      const operation = jest.fn().mockRejectedValue(error);

      // POST should not retry
      const postResult = await policy.executeHttp(operation, 'POST');
      expect(postResult.attempts).toBe(1);

      operation.mockClear();

      // GET should retry
      const getResult = await policy.executeHttp(operation, 'GET');
      expect(getResult.attempts).toBeGreaterThan(1);
    });

    it('should track budget stats', () => {
      const policy = createRetryPolicy({
        serviceName: 'policy-test-3',
      });

      const stats = policy.getBudgetStats();
      expect(stats).toBeDefined();
      expect(stats.totalRequests).toBe(0);
    });
  });

  describe('Service Retry Policies', () => {
    it('should register and retrieve service policies', () => {
      const policy = registerServiceRetryPolicy('test-service', {
        maxRetries: 5,
      });

      expect(policy).toBeDefined();
      expect(getServiceRetryPolicy('test-service')).toBe(policy);
    });

    it('should get or create policy', () => {
      const policy1 = getOrCreateServiceRetryPolicy('new-service', { maxRetries: 3 });
      const policy2 = getOrCreateServiceRetryPolicy('new-service');

      expect(policy1).toBe(policy2);
    });
  });

  describe('Metrics', () => {
    it('should initialize metrics without error', () => {
      expect(() => initRetryMetrics()).not.toThrow();
    });
  });
});
