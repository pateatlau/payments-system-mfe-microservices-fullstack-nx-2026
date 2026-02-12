/**
 * Circuit Breaker Implementation for Module Federation Remotes
 *
 * Prevents repeated failed requests to unavailable remotes by tracking failure
 * counts and temporarily "opening" the circuit to prevent further attempts.
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Failures exceeded threshold, requests are blocked
 * - HALF_OPEN: Testing if service recovered, limited requests allowed
 *
 * @security Helps prevent DoS on unavailable services and improves user experience
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  /** Number of failures before opening circuit (default: 3) */
  failureThreshold?: number;
  /** Time in ms to keep circuit open before trying again (default: 30000) */
  resetTimeout?: number;
  /** Number of successful requests needed to close circuit (default: 1) */
  successThreshold?: number;
  /** Callback when circuit state changes */
  onStateChange?: (remoteName: string, oldState: CircuitState, newState: CircuitState) => void;
  /** Callback when circuit opens (remote marked as failing) */
  onOpen?: (remoteName: string, error: Error) => void;
  /** Callback when circuit closes (remote recovered) */
  onClose?: (remoteName: string) => void;
}

interface CircuitStatus {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: number;
  lastError?: Error;
}

const DEFAULT_CONFIG: Required<Omit<CircuitBreakerConfig, 'onStateChange' | 'onOpen' | 'onClose'>> = {
  failureThreshold: 3,
  resetTimeout: 30000, // 30 seconds
  successThreshold: 1,
};

/**
 * Circuit Breaker for Module Federation Remotes
 *
 * Tracks failures per remote and prevents repeated failed requests.
 * Automatically recovers after reset timeout.
 */
export class CircuitBreaker {
  private circuits: Map<string, CircuitStatus> = new Map();
  private config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get the current state of a circuit
   */
  getState(remoteName: string): CircuitState {
    const status = this.circuits.get(remoteName);
    if (!status) return 'CLOSED';

    // Check if reset timeout has passed
    if (status.state === 'OPEN') {
      const timeSinceFailure = Date.now() - status.lastFailureTime;
      if (timeSinceFailure >= (this.config.resetTimeout || DEFAULT_CONFIG.resetTimeout)) {
        this.transitionState(remoteName, status, 'HALF_OPEN');
        return 'HALF_OPEN';
      }
    }

    return status.state;
  }

  /**
   * Check if a request to the remote should be allowed
   */
  canRequest(remoteName: string): boolean {
    const state = this.getState(remoteName);
    return state !== 'OPEN';
  }

  /**
   * Record a successful request
   */
  recordSuccess(remoteName: string): void {
    const status = this.circuits.get(remoteName);
    if (!status) return;

    // Trigger state update (OPEN -> HALF_OPEN if timeout passed)
    const currentState = this.getState(remoteName);

    if (currentState === 'HALF_OPEN') {
      status.successCount++;
      if (status.successCount >= (this.config.successThreshold || DEFAULT_CONFIG.successThreshold)) {
        this.transitionState(remoteName, status, 'CLOSED');
        this.config.onClose?.(remoteName);
      }
    } else if (currentState === 'CLOSED') {
      // Reset failure count on success
      status.failureCount = 0;
    }
  }

  /**
   * Record a failed request
   */
  recordFailure(remoteName: string, error: Error): void {
    let status = this.circuits.get(remoteName);

    if (!status) {
      status = {
        state: 'CLOSED',
        failureCount: 0,
        successCount: 0,
        lastFailureTime: 0,
      };
      this.circuits.set(remoteName, status);
    }

    status.failureCount++;
    status.lastFailureTime = Date.now();
    status.lastError = error;

    if (status.state === 'HALF_OPEN') {
      // Any failure in half-open state reopens the circuit
      this.transitionState(remoteName, status, 'OPEN');
      this.config.onOpen?.(remoteName, error);
    } else if (status.state === 'CLOSED' &&
               status.failureCount >= (this.config.failureThreshold || DEFAULT_CONFIG.failureThreshold)) {
      // Threshold reached, open the circuit
      this.transitionState(remoteName, status, 'OPEN');
      this.config.onOpen?.(remoteName, error);
    }
  }

  /**
   * Get time remaining before circuit can be tested
   */
  getTimeToRetry(remoteName: string): number {
    const status = this.circuits.get(remoteName);
    if (!status || status.state !== 'OPEN') return 0;

    const elapsed = Date.now() - status.lastFailureTime;
    const remaining = (this.config.resetTimeout || DEFAULT_CONFIG.resetTimeout) - elapsed;
    return Math.max(0, remaining);
  }

  /**
   * Get the last error for a remote
   */
  getLastError(remoteName: string): Error | undefined {
    return this.circuits.get(remoteName)?.lastError;
  }

  /**
   * Reset a circuit (manual recovery)
   */
  reset(remoteName: string): void {
    const status = this.circuits.get(remoteName);
    if (status) {
      this.transitionState(remoteName, status, 'CLOSED');
      status.failureCount = 0;
      status.successCount = 0;
      status.lastError = undefined;
    }
  }

  /**
   * Reset all circuits
   */
  resetAll(): void {
    for (const remoteName of this.circuits.keys()) {
      this.reset(remoteName);
    }
  }

  /**
   * Get all circuit statuses (for monitoring)
   */
  getAllStatuses(): Map<string, { state: CircuitState; failureCount: number; timeToRetry: number }> {
    const result = new Map();
    for (const [name, status] of this.circuits) {
      result.set(name, {
        state: this.getState(name), // Recalculate state for HALF_OPEN transition
        failureCount: status.failureCount,
        timeToRetry: this.getTimeToRetry(name),
      });
    }
    return result;
  }

  private transitionState(remoteName: string, status: CircuitStatus, newState: CircuitState): void {
    const oldState = status.state;
    if (oldState === newState) return;

    status.state = newState;

    // Reset counters on state change
    if (newState === 'HALF_OPEN') {
      status.successCount = 0;
    } else if (newState === 'CLOSED') {
      status.failureCount = 0;
      status.successCount = 0;
    }

    this.config.onStateChange?.(remoteName, oldState, newState);
  }
}

/**
 * Global circuit breaker instance for Module Federation remotes
 */
export const remoteCircuitBreaker = new CircuitBreaker();

/**
 * Check if a remote is available (circuit not open)
 */
export function isRemoteAvailable(remoteName: string): boolean {
  return remoteCircuitBreaker.canRequest(remoteName);
}

/**
 * Get the circuit state for a remote
 */
export function getRemoteCircuitState(remoteName: string): CircuitState {
  return remoteCircuitBreaker.getState(remoteName);
}
