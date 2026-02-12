/**
 * Retry Utility with Exponential Backoff
 *
 * Provides retry functionality for Module Federation remote loading
 * with configurable backoff strategy.
 *
 * @security Prevents overwhelming failing services while allowing recovery
 */

export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  /** Initial delay in ms before first retry (default: 1000) */
  initialDelay?: number;
  /** Maximum delay in ms between retries (default: 10000) */
  maxDelay?: number;
  /** Backoff multiplier (default: 2) */
  backoffFactor?: number;
  /** Add random jitter to prevent thundering herd (default: true) */
  jitter?: boolean;
  /** Callback before each retry attempt */
  onRetry?: (attempt: number, delay: number, error: Error) => void;
}

const DEFAULT_CONFIG: Required<Omit<RetryConfig, 'onRetry'>> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  jitter: true,
};

/**
 * Calculate delay for a given attempt using exponential backoff
 */
export function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig = {}
): number {
  const {
    initialDelay = DEFAULT_CONFIG.initialDelay,
    maxDelay = DEFAULT_CONFIG.maxDelay,
    backoffFactor = DEFAULT_CONFIG.backoffFactor,
    jitter = DEFAULT_CONFIG.jitter,
  } = config;

  // Exponential backoff: initialDelay * (backoffFactor ^ attempt)
  let delay = initialDelay * Math.pow(backoffFactor, attempt);

  // Cap at maxDelay
  delay = Math.min(delay, maxDelay);

  // Add jitter (0-25% random variance)
  if (jitter) {
    const jitterAmount = delay * 0.25 * Math.random();
    delay = delay + jitterAmount;
  }

  return Math.floor(delay);
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic and exponential backoff
 *
 * @param fn - Async function to execute
 * @param config - Retry configuration
 * @returns Result of the function or throws after max attempts
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const { maxAttempts = DEFAULT_CONFIG.maxAttempts, onRetry } = config;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on last attempt
      if (attempt < maxAttempts - 1) {
        const delay = calculateBackoffDelay(attempt, config);
        onRetry?.(attempt + 1, delay, lastError);
        await sleep(delay);
      }
    }
  }

  // All attempts failed
  throw lastError;
}

/**
 * Retry state for tracking ongoing retries
 */
export interface RetryState {
  attempt: number;
  nextRetryTime: number;
  lastError?: Error;
  isRetrying: boolean;
}

/**
 * Create a retry handler with state tracking
 * Useful for React components that need to track retry state
 */
export function createRetryHandler(config: RetryConfig = {}) {
  const { maxAttempts = DEFAULT_CONFIG.maxAttempts } = config;

  let state: RetryState = {
    attempt: 0,
    nextRetryTime: 0,
    isRetrying: false,
  };

  const reset = () => {
    state = {
      attempt: 0,
      nextRetryTime: 0,
      isRetrying: false,
    };
  };

  const canRetry = () => {
    return state.attempt < maxAttempts;
  };

  const getDelay = () => {
    if (!canRetry()) return 0;
    return calculateBackoffDelay(state.attempt, config);
  };

  const scheduleRetry = (error: Error): { delay: number; willRetry: boolean } => {
    if (!canRetry()) {
      return { delay: 0, willRetry: false };
    }

    const delay = getDelay();
    state.attempt++;
    state.lastError = error;
    state.nextRetryTime = Date.now() + delay;
    state.isRetrying = true;

    config.onRetry?.(state.attempt, delay, error);

    return { delay, willRetry: true };
  };

  const markSuccess = () => {
    reset();
  };

  const markFailure = () => {
    state.isRetrying = false;
  };

  const getState = (): RetryState => ({ ...state });

  return {
    reset,
    canRetry,
    getDelay,
    scheduleRetry,
    markSuccess,
    markFailure,
    getState,
  };
}
