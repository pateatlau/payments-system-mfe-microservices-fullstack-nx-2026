/**
 * Retry Utility Tests
 */

import {
  calculateRetryDelay,
  sleep,
  withRetry,
  isRetryableError,
  defaultRetryStrategy,
} from './retry';

describe('Retry Utility', () => {
  describe('calculateRetryDelay', () => {
    it('should calculate exponential backoff correctly', () => {
      const delay0 = calculateRetryDelay(0, {
        ...defaultRetryStrategy,
        jitter: false,
      });
      const delay1 = calculateRetryDelay(1, {
        ...defaultRetryStrategy,
        jitter: false,
      });
      const delay2 = calculateRetryDelay(2, {
        ...defaultRetryStrategy,
        jitter: false,
      });

      expect(delay0).toBe(1000); // 1000 * 2^0 = 1000
      expect(delay1).toBe(2000); // 1000 * 2^1 = 2000
      expect(delay2).toBe(4000); // 1000 * 2^2 = 4000
    });

    it('should cap at max delay', () => {
      const delay = calculateRetryDelay(10, {
        ...defaultRetryStrategy,
        jitter: false,
      });
      expect(delay).toBe(30000); // Max delay
    });

    it('should add jitter when enabled', () => {
      const delay1 = calculateRetryDelay(0, {
        ...defaultRetryStrategy,
        jitter: true,
      });
      const delay2 = calculateRetryDelay(0, {
        ...defaultRetryStrategy,
        jitter: true,
      });

      // Jitter adds ±25% randomness, so values should be different
      expect(delay1).toBeGreaterThan(700);
      expect(delay1).toBeLessThan(1300);
      expect(delay2).toBeGreaterThan(700);
      expect(delay2).toBeLessThan(1300);
    });
  });

  describe('sleep', () => {
    it('should sleep for specified duration', async () => {
      const start = Date.now();
      await sleep(100);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(90); // Allow 10ms margin
      // Use generous upper bound for CI environments where system load can cause delays
      expect(elapsed).toBeLessThan(500);
    });
  });

  describe('withRetry', () => {
    it('should return result on first success', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await withRetry(fn, {
        ...defaultRetryStrategy,
        maxRetries: 3,
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');

      const result = await withRetry(fn, {
        maxRetries: 3,
        initialDelay: 10,
        maxDelay: 100,
        multiplier: 2,
        jitter: false,
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('persistent failure'));

      await expect(
        withRetry(fn, {
          maxRetries: 2,
          initialDelay: 10,
          maxDelay: 100,
          multiplier: 2,
        })
      ).rejects.toThrow('Operation failed after 2 retries');

      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should invoke onRetry callback', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');

      const onRetry = jest.fn();

      await withRetry(
        fn,
        {
          maxRetries: 3,
          initialDelay: 10,
          maxDelay: 100,
          multiplier: 2,
          jitter: false,
        },
        onRetry
      );

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error), 10);
    });
  });

  describe('isRetryableError', () => {
    it('should identify retryable errors', () => {
      expect(isRetryableError(new Error('ECONNREFUSED'))).toBe(true);
      expect(isRetryableError(new Error('ENOTFOUND'))).toBe(true);
      expect(isRetryableError(new Error('ETIMEDOUT'))).toBe(true);
      expect(isRetryableError(new Error('ECONNRESET'))).toBe(true);
      expect(isRetryableError(new Error('Channel closed'))).toBe(true);
      expect(isRetryableError(new Error('Connection closed'))).toBe(true);
    });

    it('should identify non-retryable errors', () => {
      expect(isRetryableError(new Error('Invalid input'))).toBe(false);
      expect(isRetryableError(new Error('Validation failed'))).toBe(false);
      expect(isRetryableError(new Error('Not found'))).toBe(false);
    });
  });
});
