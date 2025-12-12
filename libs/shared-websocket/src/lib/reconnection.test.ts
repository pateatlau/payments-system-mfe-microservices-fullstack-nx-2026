/**
 * ReconnectionManager Tests
 */

import { ReconnectionManager } from './reconnection';

describe('ReconnectionManager', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getNextDelay', () => {
    it('should return exponential backoff delay', () => {
      const manager = new ReconnectionManager({
        maxAttempts: 5,
        initialDelay: 1000,
        maxDelay: 10000,
      });

      // First attempt: ~1000ms
      const delay1 = manager.getNextDelay();
      expect(delay1).toBeGreaterThanOrEqual(800);
      expect(delay1).toBeLessThanOrEqual(1200);

      // Increment attempts
      manager.scheduleReconnect(() => {});
      jest.advanceTimersByTime(delay1);

      // Second attempt: ~2000ms
      const delay2 = manager.getNextDelay();
      expect(delay2).toBeGreaterThanOrEqual(1600);
      expect(delay2).toBeLessThanOrEqual(2400);
    });

    it('should cap delay at maxDelay', () => {
      const manager = new ReconnectionManager({
        maxAttempts: 10,
        initialDelay: 1000,
        maxDelay: 5000,
      });

      // Simulate many attempts
      for (let i = 0; i < 5; i++) {
        manager.scheduleReconnect(() => {});
        const delay = manager.getNextDelay();
        jest.advanceTimersByTime(delay);
      }

      const delay = manager.getNextDelay();
      expect(delay).toBeLessThanOrEqual(6000); // 5000 + 20% jitter
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
