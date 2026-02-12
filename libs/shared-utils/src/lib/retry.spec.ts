/**
 * Tests for Retry Utility
 */

import {
  calculateBackoffDelay,
  sleep,
  withRetry,
  createRetryHandler,
} from './retry';

describe('Retry Utility', () => {
  describe('calculateBackoffDelay', () => {
    it('should calculate correct delay for attempt 0', () => {
      const delay = calculateBackoffDelay(0, { jitter: false });
      expect(delay).toBe(1000); // initialDelay
    });

    it('should calculate correct delay for attempt 1', () => {
      const delay = calculateBackoffDelay(1, { jitter: false });
      expect(delay).toBe(2000); // 1000 * 2^1
    });

    it('should calculate correct delay for attempt 2', () => {
      const delay = calculateBackoffDelay(2, { jitter: false });
      expect(delay).toBe(4000); // 1000 * 2^2
    });

    it('should respect maxDelay', () => {
      const delay = calculateBackoffDelay(10, { maxDelay: 5000, jitter: false });
      expect(delay).toBe(5000);
    });

    it('should use custom initialDelay', () => {
      const delay = calculateBackoffDelay(0, {
        initialDelay: 500,
        jitter: false,
      });
      expect(delay).toBe(500);
    });

    it('should use custom backoffFactor', () => {
      const delay = calculateBackoffDelay(1, {
        initialDelay: 1000,
        backoffFactor: 3,
        jitter: false,
      });
      expect(delay).toBe(3000);
    });

    it('should add jitter when enabled', () => {
      const delays = new Set<number>();
      // Run multiple times to check for variance
      for (let i = 0; i < 10; i++) {
        delays.add(calculateBackoffDelay(0, { jitter: true }));
      }
      // With jitter, we should see some variance
      // The delay should be between 1000 and 1250 (25% jitter)
      delays.forEach(delay => {
        expect(delay).toBeGreaterThanOrEqual(1000);
        expect(delay).toBeLessThanOrEqual(1250);
      });
    });
  });

  describe('sleep', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should resolve after specified duration', async () => {
      const promise = sleep(1000);

      jest.advanceTimersByTime(1000);

      await expect(promise).resolves.toBeUndefined();
    });
  });

  describe('withRetry', () => {
    // Use real timers with very short delays for these tests
    it('should return result on first success', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await withRetry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockResolvedValueOnce('success');

      const result = await withRetry(fn, {
        maxAttempts: 3,
        initialDelay: 10, // Very short delay
        maxDelay: 50,
        jitter: false,
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throw after max attempts', async () => {
      const error = new Error('Persistent failure');
      const fn = jest.fn().mockRejectedValue(error);

      await expect(
        withRetry(fn, {
          maxAttempts: 3,
          initialDelay: 10,
          maxDelay: 50,
          jitter: false,
        })
      ).rejects.toThrow('Persistent failure');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should call onRetry callback before each retry', async () => {
      const onRetry = jest.fn();
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValueOnce('success');

      await withRetry(fn, {
        maxAttempts: 3,
        initialDelay: 10,
        maxDelay: 50,
        jitter: false,
        onRetry,
      });

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(
        1, // attempt number
        expect.any(Number), // delay
        expect.any(Error) // error
      );
    });
  });

  describe('createRetryHandler', () => {
    it('should start with default state', () => {
      const handler = createRetryHandler();
      const state = handler.getState();

      expect(state.attempt).toBe(0);
      expect(state.isRetrying).toBe(false);
      expect(state.lastError).toBeUndefined();
    });

    it('should allow retry when under max attempts', () => {
      const handler = createRetryHandler({ maxAttempts: 3 });
      expect(handler.canRetry()).toBe(true);
    });

    it('should track retry scheduling', () => {
      const handler = createRetryHandler({ maxAttempts: 3 });
      const error = new Error('Test error');

      const result = handler.scheduleRetry(error);

      expect(result.willRetry).toBe(true);
      expect(result.delay).toBeGreaterThan(0);

      const state = handler.getState();
      expect(state.attempt).toBe(1);
      expect(state.isRetrying).toBe(true);
      expect(state.lastError).toBe(error);
    });

    it('should not retry when max attempts reached', () => {
      const handler = createRetryHandler({ maxAttempts: 2 });

      handler.scheduleRetry(new Error('Error 1'));
      handler.scheduleRetry(new Error('Error 2'));

      expect(handler.canRetry()).toBe(false);

      const result = handler.scheduleRetry(new Error('Error 3'));
      expect(result.willRetry).toBe(false);
    });

    it('should reset state', () => {
      const handler = createRetryHandler();

      handler.scheduleRetry(new Error('Error'));
      handler.reset();

      const state = handler.getState();
      expect(state.attempt).toBe(0);
      expect(state.isRetrying).toBe(false);
    });

    it('should reset state on success', () => {
      const handler = createRetryHandler();

      handler.scheduleRetry(new Error('Error'));
      handler.markSuccess();

      const state = handler.getState();
      expect(state.attempt).toBe(0);
      expect(state.isRetrying).toBe(false);
    });

    it('should mark failure', () => {
      const handler = createRetryHandler();

      handler.scheduleRetry(new Error('Error'));
      handler.markFailure();

      const state = handler.getState();
      expect(state.isRetrying).toBe(false);
      expect(state.attempt).toBe(1); // Attempt count preserved
    });

    it('should calculate increasing delays', () => {
      const handler = createRetryHandler({
        initialDelay: 1000,
        jitter: false,
      });

      const delay1 = handler.getDelay(); // attempt 0
      handler.scheduleRetry(new Error('Error 1'));

      const delay2 = handler.getDelay(); // attempt 1
      handler.scheduleRetry(new Error('Error 2'));

      const delay3 = handler.getDelay(); // attempt 2

      expect(delay1).toBe(1000);
      expect(delay2).toBe(2000);
      expect(delay3).toBe(4000);
    });

    it('should call onRetry callback', () => {
      const onRetry = jest.fn();
      const handler = createRetryHandler({ onRetry });
      const error = new Error('Test');

      handler.scheduleRetry(error);

      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Number), error);
    });
  });
});
