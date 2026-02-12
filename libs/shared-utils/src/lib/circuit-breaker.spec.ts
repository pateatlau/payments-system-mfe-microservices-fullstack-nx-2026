/**
 * Tests for Circuit Breaker
 */

import {
  CircuitBreaker,
  remoteCircuitBreaker,
  isRemoteAvailable,
  getRemoteCircuitState,
} from './circuit-breaker';

describe('Circuit Breaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 1000, // 1 second for faster tests
      successThreshold: 1,
    });
  });

  describe('initial state', () => {
    it('should start in CLOSED state', () => {
      expect(circuitBreaker.getState('testRemote')).toBe('CLOSED');
    });

    it('should allow requests initially', () => {
      expect(circuitBreaker.canRequest('testRemote')).toBe(true);
    });
  });

  describe('failure tracking', () => {
    it('should stay CLOSED after one failure', () => {
      circuitBreaker.recordFailure('testRemote', new Error('Test error'));
      expect(circuitBreaker.getState('testRemote')).toBe('CLOSED');
    });

    it('should stay CLOSED after two failures', () => {
      circuitBreaker.recordFailure('testRemote', new Error('Error 1'));
      circuitBreaker.recordFailure('testRemote', new Error('Error 2'));
      expect(circuitBreaker.getState('testRemote')).toBe('CLOSED');
    });

    it('should OPEN after reaching failure threshold', () => {
      circuitBreaker.recordFailure('testRemote', new Error('Error 1'));
      circuitBreaker.recordFailure('testRemote', new Error('Error 2'));
      circuitBreaker.recordFailure('testRemote', new Error('Error 3'));
      expect(circuitBreaker.getState('testRemote')).toBe('OPEN');
    });

    it('should block requests when OPEN', () => {
      circuitBreaker.recordFailure('testRemote', new Error('Error 1'));
      circuitBreaker.recordFailure('testRemote', new Error('Error 2'));
      circuitBreaker.recordFailure('testRemote', new Error('Error 3'));
      expect(circuitBreaker.canRequest('testRemote')).toBe(false);
    });

    it('should store the last error', () => {
      const error = new Error('Last error');
      circuitBreaker.recordFailure('testRemote', error);
      expect(circuitBreaker.getLastError('testRemote')).toBe(error);
    });
  });

  describe('HALF_OPEN state', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should transition to HALF_OPEN after reset timeout', () => {
      // Open the circuit
      circuitBreaker.recordFailure('testRemote', new Error('Error 1'));
      circuitBreaker.recordFailure('testRemote', new Error('Error 2'));
      circuitBreaker.recordFailure('testRemote', new Error('Error 3'));
      expect(circuitBreaker.getState('testRemote')).toBe('OPEN');

      // Advance time past reset timeout
      jest.advanceTimersByTime(1100);

      // Should be HALF_OPEN
      expect(circuitBreaker.getState('testRemote')).toBe('HALF_OPEN');
    });

    it('should allow requests in HALF_OPEN state', () => {
      // Open the circuit
      circuitBreaker.recordFailure('testRemote', new Error('Error 1'));
      circuitBreaker.recordFailure('testRemote', new Error('Error 2'));
      circuitBreaker.recordFailure('testRemote', new Error('Error 3'));

      // Advance time past reset timeout
      jest.advanceTimersByTime(1100);

      expect(circuitBreaker.canRequest('testRemote')).toBe(true);
    });

    it('should close on success in HALF_OPEN state', () => {
      // Open the circuit
      circuitBreaker.recordFailure('testRemote', new Error('Error 1'));
      circuitBreaker.recordFailure('testRemote', new Error('Error 2'));
      circuitBreaker.recordFailure('testRemote', new Error('Error 3'));

      // Advance time past reset timeout
      jest.advanceTimersByTime(1100);

      // Record success
      circuitBreaker.recordSuccess('testRemote');

      expect(circuitBreaker.getState('testRemote')).toBe('CLOSED');
    });

    it('should reopen on failure in HALF_OPEN state', () => {
      // Open the circuit
      circuitBreaker.recordFailure('testRemote', new Error('Error 1'));
      circuitBreaker.recordFailure('testRemote', new Error('Error 2'));
      circuitBreaker.recordFailure('testRemote', new Error('Error 3'));

      // Advance time past reset timeout
      jest.advanceTimersByTime(1100);

      expect(circuitBreaker.getState('testRemote')).toBe('HALF_OPEN');

      // Record another failure
      circuitBreaker.recordFailure('testRemote', new Error('New error'));

      expect(circuitBreaker.getState('testRemote')).toBe('OPEN');
    });
  });

  describe('success tracking', () => {
    it('should reset failure count on success in CLOSED state', () => {
      circuitBreaker.recordFailure('testRemote', new Error('Error 1'));
      circuitBreaker.recordFailure('testRemote', new Error('Error 2'));
      circuitBreaker.recordSuccess('testRemote');

      // After success, should be able to handle another failure
      circuitBreaker.recordFailure('testRemote', new Error('Error 3'));
      circuitBreaker.recordFailure('testRemote', new Error('Error 4'));

      // Circuit should still be CLOSED (failures were reset)
      expect(circuitBreaker.getState('testRemote')).toBe('CLOSED');
    });
  });

  describe('reset', () => {
    it('should reset single circuit', () => {
      circuitBreaker.recordFailure('testRemote', new Error('Error 1'));
      circuitBreaker.recordFailure('testRemote', new Error('Error 2'));
      circuitBreaker.recordFailure('testRemote', new Error('Error 3'));
      expect(circuitBreaker.getState('testRemote')).toBe('OPEN');

      circuitBreaker.reset('testRemote');

      expect(circuitBreaker.getState('testRemote')).toBe('CLOSED');
      expect(circuitBreaker.canRequest('testRemote')).toBe(true);
    });

    it('should reset all circuits', () => {
      circuitBreaker.recordFailure('remote1', new Error('Error'));
      circuitBreaker.recordFailure('remote1', new Error('Error'));
      circuitBreaker.recordFailure('remote1', new Error('Error'));
      circuitBreaker.recordFailure('remote2', new Error('Error'));
      circuitBreaker.recordFailure('remote2', new Error('Error'));
      circuitBreaker.recordFailure('remote2', new Error('Error'));

      circuitBreaker.resetAll();

      expect(circuitBreaker.getState('remote1')).toBe('CLOSED');
      expect(circuitBreaker.getState('remote2')).toBe('CLOSED');
    });
  });

  describe('time to retry', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return 0 for CLOSED circuits', () => {
      expect(circuitBreaker.getTimeToRetry('testRemote')).toBe(0);
    });

    it('should return remaining time for OPEN circuits', () => {
      circuitBreaker.recordFailure('testRemote', new Error('Error 1'));
      circuitBreaker.recordFailure('testRemote', new Error('Error 2'));
      circuitBreaker.recordFailure('testRemote', new Error('Error 3'));

      // Immediately after opening
      expect(circuitBreaker.getTimeToRetry('testRemote')).toBeGreaterThan(0);
      expect(circuitBreaker.getTimeToRetry('testRemote')).toBeLessThanOrEqual(1000);

      // After 500ms
      jest.advanceTimersByTime(500);
      expect(circuitBreaker.getTimeToRetry('testRemote')).toBeGreaterThan(0);
      expect(circuitBreaker.getTimeToRetry('testRemote')).toBeLessThanOrEqual(500);
    });
  });

  describe('callbacks', () => {
    it('should call onStateChange when state changes', () => {
      const onStateChange = jest.fn();
      const cb = new CircuitBreaker({
        failureThreshold: 1,
        onStateChange,
      });

      cb.recordFailure('testRemote', new Error('Error'));

      expect(onStateChange).toHaveBeenCalledWith(
        'testRemote',
        'CLOSED',
        'OPEN'
      );
    });

    it('should call onOpen when circuit opens', () => {
      const onOpen = jest.fn();
      const cb = new CircuitBreaker({
        failureThreshold: 1,
        onOpen,
      });

      const error = new Error('Opening error');
      cb.recordFailure('testRemote', error);

      expect(onOpen).toHaveBeenCalledWith('testRemote', error);
    });

    it('should call onClose when circuit closes', () => {
      jest.useFakeTimers();

      const onClose = jest.fn();
      const cb = new CircuitBreaker({
        failureThreshold: 1,
        resetTimeout: 100,
        onClose,
      });

      cb.recordFailure('testRemote', new Error('Error'));
      jest.advanceTimersByTime(150);
      cb.getState('testRemote'); // Trigger HALF_OPEN transition
      cb.recordSuccess('testRemote');

      expect(onClose).toHaveBeenCalledWith('testRemote');

      jest.useRealTimers();
    });
  });

  describe('getAllStatuses', () => {
    it('should return status for all tracked circuits', () => {
      circuitBreaker.recordFailure('remote1', new Error('Error'));
      circuitBreaker.recordFailure('remote2', new Error('Error'));
      circuitBreaker.recordFailure('remote2', new Error('Error'));
      circuitBreaker.recordFailure('remote2', new Error('Error'));

      const statuses = circuitBreaker.getAllStatuses();

      expect(statuses.get('remote1')).toEqual({
        state: 'CLOSED',
        failureCount: 1,
        timeToRetry: 0,
      });
      expect(statuses.get('remote2')).toEqual({
        state: 'OPEN',
        failureCount: 3,
        timeToRetry: expect.any(Number),
      });
    });
  });
});

describe('Global circuit breaker instance', () => {
  beforeEach(() => {
    remoteCircuitBreaker.resetAll();
  });

  it('isRemoteAvailable returns true for unknown remotes', () => {
    expect(isRemoteAvailable('unknownRemote')).toBe(true);
  });

  it('getRemoteCircuitState returns CLOSED for unknown remotes', () => {
    expect(getRemoteCircuitState('unknownRemote')).toBe('CLOSED');
  });
});
