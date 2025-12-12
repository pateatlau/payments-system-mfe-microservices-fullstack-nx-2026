/**
 * WebSocket Reconnection Logic
 *
 * Exponential backoff with jitter for WebSocket reconnection
 */

export interface ReconnectionConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
}

export class ReconnectionManager {
  private attempts = 0;
  private config: ReconnectionConfig;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(config: ReconnectionConfig) {
    this.config = config;
  }

  /**
   * Calculate next reconnection delay with exponential backoff + jitter
   */
  getNextDelay(): number {
    if (this.attempts >= this.config.maxAttempts) {
      return -1; // No more attempts
    }

    // Exponential backoff: initialDelay * 2^attempts
    const exponentialDelay =
      this.config.initialDelay * Math.pow(2, this.attempts);

    // Cap at maxDelay
    const cappedDelay = Math.min(exponentialDelay, this.config.maxDelay);

    // Add jitter (±20%)
    const jitter = cappedDelay * 0.2 * (Math.random() * 2 - 1);

    return Math.max(0, cappedDelay + jitter);
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect(callback: () => void): boolean {
    const delay = this.getNextDelay();

    if (delay < 0) {
      return false; // Max attempts reached
    }

    this.reconnectTimer = setTimeout(() => {
      this.attempts++;
      callback();
    }, delay);

    return true;
  }

  /**
   * Cancel scheduled reconnection
   */
  cancelReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Reset reconnection state (on successful connection)
   */
  reset(): void {
    this.attempts = 0;
    this.cancelReconnect();
  }

  /**
   * Get current attempt count
   */
  getAttempts(): number {
    return this.attempts;
  }

  /**
   * Check if max attempts reached
   */
  hasReachedMaxAttempts(): boolean {
    return this.attempts >= this.config.maxAttempts;
  }
}
