/**
 * Circuit Breaker Tests
 *
 * Phase 5.1 - Service Resilience
 */

import {
  createCircuitBreaker,
  getCircuitBreaker,
  getAllCircuitBreakers,
  getCircuitState,
  getCircuitStats,
  getAllCircuitStats,
  openCircuit,
  closeCircuit,
  removeCircuitBreaker,
  shutdownAllCircuitBreakers,
  formatCircuitStats,
  hasOpenCircuits,
  getOpenCircuits,
  CircuitState,
} from './circuit-breaker';

describe('Circuit Breaker', () => {
  // Clean up after each test
  afterEach(() => {
    shutdownAllCircuitBreakers();
  });

  describe('createCircuitBreaker', () => {
    it('should create a circuit breaker with default config', async () => {
      const action = jest.fn().mockResolvedValue('success');
      const breaker = createCircuitBreaker(action, {
        name: 'test-breaker',
      });

      expect(breaker).toBeDefined();
      expect(getCircuitBreaker('test-breaker')).toBe(breaker);
    });

    it('should return existing breaker if name already exists', () => {
      const action1 = jest.fn().mockResolvedValue('success1');
      const action2 = jest.fn().mockResolvedValue('success2');

      const breaker1 = createCircuitBreaker(action1, { name: 'same-name' });
      const breaker2 = createCircuitBreaker(action2, { name: 'same-name' });

      expect(breaker1).toBe(breaker2);
    });

    it('should execute action through circuit breaker', async () => {
      const action = jest.fn().mockResolvedValue('success');
      const breaker = createCircuitBreaker(action, { name: 'exec-test' });

      const result = await breaker.fire();
      expect(result).toBe('success');
      expect(action).toHaveBeenCalled();
    });

    it('should call onSuccess callback on successful request', async () => {
      const onSuccess = jest.fn();
      const action = jest.fn().mockResolvedValue('success');

      const breaker = createCircuitBreaker(action, {
        name: 'success-callback',
        onSuccess,
      });

      await breaker.fire();

      // Wait for event to be processed
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(onSuccess).toHaveBeenCalledWith('success-callback', expect.any(Number));
    });

    it('should call onFailure callback on failed request', async () => {
      const onFailure = jest.fn();
      const error = new Error('test error');
      const action = jest.fn().mockRejectedValue(error);

      const breaker = createCircuitBreaker(action, {
        name: 'failure-callback',
        onFailure,
      });

      await expect(breaker.fire()).rejects.toThrow('test error');

      // Wait for event to be processed
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(onFailure).toHaveBeenCalledWith('failure-callback', error);
    });

    it('should use fallback when circuit is open', async () => {
      const action = jest.fn().mockRejectedValue(new Error('fail'));
      const fallback = jest.fn().mockReturnValue('fallback-value');

      const breaker = createCircuitBreaker(action, {
        name: 'fallback-test',
        volumeThreshold: 1,
        errorThresholdPercentage: 1,
        fallback,
      });

      // Trigger enough failures to open circuit
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.fire();
        } catch {
          // Expected
        }
      }

      // Wait for circuit to process state change
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Now fallback should be used
      const result = await breaker.fire();
      expect(result).toBe('fallback-value');
    });
  });

  describe('getCircuitState', () => {
    it('should return CLOSED for new circuit', () => {
      const action = jest.fn().mockResolvedValue('success');
      createCircuitBreaker(action, { name: 'state-test' });

      expect(getCircuitState('state-test')).toBe(CircuitState.CLOSED);
    });

    it('should return undefined for non-existent circuit', () => {
      expect(getCircuitState('non-existent')).toBeUndefined();
    });
  });

  describe('getCircuitStats', () => {
    it('should track successes', async () => {
      const action = jest.fn().mockResolvedValue('success');
      const breaker = createCircuitBreaker(action, { name: 'stats-success' });

      await breaker.fire();
      await breaker.fire();

      const stats = getCircuitStats('stats-success');
      expect(stats).toBeDefined();
      expect(stats?.successes).toBe(2);
    });

    it('should track failures', async () => {
      const action = jest.fn().mockRejectedValue(new Error('fail'));
      const breaker = createCircuitBreaker(action, { name: 'stats-failure' });

      try {
        await breaker.fire();
      } catch {
        // Expected
      }

      const stats = getCircuitStats('stats-failure');
      expect(stats).toBeDefined();
      expect(stats?.failures).toBe(1);
    });

    it('should return undefined for non-existent circuit', () => {
      expect(getCircuitStats('non-existent')).toBeUndefined();
    });
  });

  describe('getAllCircuitBreakers', () => {
    it('should return all circuit breakers', () => {
      const action = jest.fn().mockResolvedValue('success');
      createCircuitBreaker(action, { name: 'breaker-1' });
      createCircuitBreaker(action, { name: 'breaker-2' });
      createCircuitBreaker(action, { name: 'breaker-3' });

      const all = getAllCircuitBreakers();
      expect(all.size).toBe(3);
      expect(all.has('breaker-1')).toBe(true);
      expect(all.has('breaker-2')).toBe(true);
      expect(all.has('breaker-3')).toBe(true);
    });
  });

  describe('getAllCircuitStats', () => {
    it('should return stats for all circuits', async () => {
      const action = jest.fn().mockResolvedValue('success');
      const breaker1 = createCircuitBreaker(action, { name: 'all-stats-1' });
      const breaker2 = createCircuitBreaker(action, { name: 'all-stats-2' });

      await breaker1.fire();
      await breaker2.fire();
      await breaker2.fire();

      const allStats = getAllCircuitStats();
      expect(allStats.length).toBe(2);

      const stats1 = allStats.find((s) => s.name === 'all-stats-1');
      const stats2 = allStats.find((s) => s.name === 'all-stats-2');

      expect(stats1?.successes).toBe(1);
      expect(stats2?.successes).toBe(2);
    });
  });

  describe('openCircuit', () => {
    it('should manually open circuit', () => {
      const action = jest.fn().mockResolvedValue('success');
      createCircuitBreaker(action, { name: 'manual-open' });

      expect(getCircuitState('manual-open')).toBe(CircuitState.CLOSED);

      openCircuit('manual-open');

      expect(getCircuitState('manual-open')).toBe(CircuitState.OPEN);
    });

    it('should return false for non-existent circuit', () => {
      expect(openCircuit('non-existent')).toBe(false);
    });
  });

  describe('closeCircuit', () => {
    it('should manually close circuit', () => {
      const action = jest.fn().mockResolvedValue('success');
      createCircuitBreaker(action, { name: 'manual-close' });

      openCircuit('manual-close');
      expect(getCircuitState('manual-close')).toBe(CircuitState.OPEN);

      closeCircuit('manual-close');
      expect(getCircuitState('manual-close')).toBe(CircuitState.CLOSED);
    });

    it('should return false for non-existent circuit', () => {
      expect(closeCircuit('non-existent')).toBe(false);
    });
  });

  describe('removeCircuitBreaker', () => {
    it('should remove circuit breaker', () => {
      const action = jest.fn().mockResolvedValue('success');
      createCircuitBreaker(action, { name: 'to-remove' });

      expect(getCircuitBreaker('to-remove')).toBeDefined();

      removeCircuitBreaker('to-remove');

      expect(getCircuitBreaker('to-remove')).toBeUndefined();
    });

    it('should return false for non-existent circuit', () => {
      expect(removeCircuitBreaker('non-existent')).toBe(false);
    });
  });

  describe('hasOpenCircuits', () => {
    it('should return false when all circuits are closed', () => {
      const action = jest.fn().mockResolvedValue('success');
      createCircuitBreaker(action, { name: 'check-open-1' });
      createCircuitBreaker(action, { name: 'check-open-2' });

      expect(hasOpenCircuits()).toBe(false);
    });

    it('should return true when any circuit is open', () => {
      const action = jest.fn().mockResolvedValue('success');
      createCircuitBreaker(action, { name: 'check-open-3' });
      createCircuitBreaker(action, { name: 'check-open-4' });

      openCircuit('check-open-3');

      expect(hasOpenCircuits()).toBe(true);
    });
  });

  describe('getOpenCircuits', () => {
    it('should return names of open circuits', () => {
      const action = jest.fn().mockResolvedValue('success');
      createCircuitBreaker(action, { name: 'open-names-1' });
      createCircuitBreaker(action, { name: 'open-names-2' });
      createCircuitBreaker(action, { name: 'open-names-3' });

      openCircuit('open-names-1');
      openCircuit('open-names-3');

      const openCircuits = getOpenCircuits();
      expect(openCircuits).toContain('open-names-1');
      expect(openCircuits).toContain('open-names-3');
      expect(openCircuits).not.toContain('open-names-2');
    });
  });

  describe('formatCircuitStats', () => {
    it('should format stats correctly', async () => {
      const action = jest.fn().mockResolvedValue('success');
      const breaker = createCircuitBreaker(action, { name: 'format-stats' });

      await breaker.fire();
      await breaker.fire();

      const stats = getCircuitStats('format-stats');
      expect(stats).toBeDefined();

      const formatted = formatCircuitStats(stats!);
      expect(formatted.name).toBe('format-stats');
      expect(formatted.state).toBe(CircuitState.CLOSED);
      expect(formatted.successes).toBe(2);
      expect(formatted.successRate).toMatch(/%$/);
      expect(formatted.latency).toBeDefined();
    });
  });

  describe('shutdownAllCircuitBreakers', () => {
    it('should shutdown all circuit breakers', () => {
      const action = jest.fn().mockResolvedValue('success');
      createCircuitBreaker(action, { name: 'shutdown-1' });
      createCircuitBreaker(action, { name: 'shutdown-2' });

      expect(getAllCircuitBreakers().size).toBe(2);

      shutdownAllCircuitBreakers();

      expect(getAllCircuitBreakers().size).toBe(0);
    });
  });

  describe('timeout handling', () => {
    it('should call onTimeout callback when request times out', async () => {
      const onTimeout = jest.fn();
      const slowAction = jest.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 500))
      );

      const breaker = createCircuitBreaker(slowAction, {
        name: 'timeout-test',
        timeout: 100,
        onTimeout,
      });

      await expect(breaker.fire()).rejects.toThrow();

      // Wait for timeout event to be processed
      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(onTimeout).toHaveBeenCalledWith('timeout-test');
    });
  });

  describe('circuit open/close events', () => {
    it('should call onOpen when circuit opens', async () => {
      const onOpen = jest.fn();
      const action = jest.fn().mockRejectedValue(new Error('fail'));

      const breaker = createCircuitBreaker(action, {
        name: 'open-event',
        volumeThreshold: 1,
        errorThresholdPercentage: 1,
        onOpen,
      });

      // Trigger failures to open circuit
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.fire();
        } catch {
          // Expected
        }
      }

      // Wait for event processing
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(onOpen).toHaveBeenCalledWith('open-event');
    });
  });
});
