/**
 * ReconnectionManager Tests
 */

import { ReconnectionManager } from './reconnection';

describe('ReconnectionManager', () => {
  // Store original Math.random to restore after tests
  const originalRandom = Math.random;

  beforeEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();
    // Mock Math.random to return 0.5 (middle of range, no jitter effect)
    // This makes tests deterministic - jitter calculation: 0.5 * 2 - 1 = 0
    Math.random = jest.fn(() => 0.5);
  });

  afterEach(() => {
    jest.useRealTimers();
    // Restore original Math.random
    Math.random = originalRandom;
  });

  describe('getNextDelay', () => {
    it('should return exponential backoff delay', () => {
      const manager = new ReconnectionManager({
        maxAttempts: 5,
        initialDelay: 1000,
        maxDelay: 10000,
      });

      // First attempt: 1000ms (with mocked random = 0.5, jitter = 0)
      const delay1 = manager.getNextDelay();
      expect(delay1).toBe(1000);

      // Increment attempts by running scheduled reconnect
      manager.scheduleReconnect(() => {});
      jest.advanceTimersByTime(delay1);

      // Second attempt: 2000ms (1000 * 2^1)
      const delay2 = manager.getNextDelay();
      expect(delay2).toBe(2000);
    });

    it('should apply jitter when random varies', () => {
      const manager = new ReconnectionManager({
        maxAttempts: 5,
        initialDelay: 1000,
        maxDelay: 10000,
      });

      // Test with random = 0 (minimum jitter: -20%)
      (Math.random as jest.Mock).mockReturnValueOnce(0);
      const delayMin = manager.getNextDelay();
      expect(delayMin).toBe(800); // 1000 - 20%

      // Test with random = 1 (maximum jitter: +20%)
      (Math.random as jest.Mock).mockReturnValueOnce(1);
      const delayMax = manager.getNextDelay();
      expect(delayMax).toBe(1200); // 1000 + 20%
    });

    it('should cap delay at maxDelay', () => {
      const manager = new ReconnectionManager({
        maxAttempts: 10,
        initialDelay: 1000,
        maxDelay: 5000,
      });

      // Simulate many attempts to exceed maxDelay
      for (let i = 0; i < 5; i++) {
        manager.scheduleReconnect(() => {});
        jest.runAllTimers();
      }

      // At attempt 5: 1000 * 2^5 = 32000, capped to 5000
      const delay = manager.getNextDelay();
      expect(delay).toBe(5000); // Capped at maxDelay (with jitter = 0)
    });

    it('should return -1 when max attempts reached', () => {
      const manager = new ReconnectionManager({
        maxAttempts: 2,
        initialDelay: 1000,
        maxDelay: 10000,
      });

      // Use up attempts
      manager.scheduleReconnect(() => {});
      jest.runAllTimers();
      manager.scheduleReconnect(() => {});
      jest.runAllTimers();

      const delay = manager.getNextDelay();
      expect(delay).toBe(-1);
    });
  });

  describe('scheduleReconnect', () => {
    it('should schedule reconnection callback', () => {
      const manager = new ReconnectionManager({
        maxAttempts: 5,
        initialDelay: 1000,
        maxDelay: 10000,
      });

      const callback = jest.fn();
      const scheduled = manager.scheduleReconnect(callback);

      expect(scheduled).toBe(true);
      expect(callback).not.toHaveBeenCalled();

      jest.runAllTimers();

      expect(callback).toHaveBeenCalledTimes(1);
      expect(manager.getAttempts()).toBe(1);
    });

    it('should not schedule when max attempts reached', () => {
      const manager = new ReconnectionManager({
        maxAttempts: 1,
        initialDelay: 1000,
        maxDelay: 10000,
      });

      const callback = jest.fn();

      // First attempt succeeds
      expect(manager.scheduleReconnect(callback)).toBe(true);
      jest.runAllTimers();

      // Second attempt fails
      expect(manager.scheduleReconnect(callback)).toBe(false);
    });
  });

  describe('cancelReconnect', () => {
    it('should cancel scheduled reconnection', () => {
      const manager = new ReconnectionManager({
        maxAttempts: 5,
        initialDelay: 1000,
        maxDelay: 10000,
      });

      const callback = jest.fn();
      manager.scheduleReconnect(callback);

      manager.cancelReconnect();

      jest.runAllTimers();

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should reset attempt count', () => {
      const manager = new ReconnectionManager({
        maxAttempts: 5,
        initialDelay: 1000,
        maxDelay: 10000,
      });

      // Make some attempts
      manager.scheduleReconnect(() => {});
      jest.runAllTimers();
      manager.scheduleReconnect(() => {});
      jest.runAllTimers();

      expect(manager.getAttempts()).toBe(2);

      manager.reset();

      expect(manager.getAttempts()).toBe(0);
    });

    it('should cancel scheduled reconnection', () => {
      const manager = new ReconnectionManager({
        maxAttempts: 5,
        initialDelay: 1000,
        maxDelay: 10000,
      });

      const callback = jest.fn();
      manager.scheduleReconnect(callback);

      manager.reset();

      jest.runAllTimers();

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('hasReachedMaxAttempts', () => {
    it('should return true when max attempts reached', () => {
      const manager = new ReconnectionManager({
        maxAttempts: 2,
        initialDelay: 1000,
        maxDelay: 10000,
      });

      expect(manager.hasReachedMaxAttempts()).toBe(false);

      manager.scheduleReconnect(() => {});
      jest.runAllTimers();
      manager.scheduleReconnect(() => {});
      jest.runAllTimers();

      expect(manager.hasReachedMaxAttempts()).toBe(true);
    });
  });
});
