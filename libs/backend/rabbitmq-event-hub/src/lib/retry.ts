/**
 * Retry Utility
 *
 * Purpose: Exponential backoff retry logic for RabbitMQ operations
 * Features: Exponential backoff, jitter, max retries, configurable delays
 */

import { RetryStrategy } from './types';

/**
 * Default Retry Strategy
 */
export const defaultRetryStrategy: RetryStrategy = {
  maxRetries: 5,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  multiplier: 2,
  jitter: true,
};

/**
 * Calculate retry delay with exponential backoff
 *
 * @param attempt - Current retry attempt (0-based)
 * @param strategy - Retry strategy configuration
 * @returns Delay in milliseconds
 */
export function calculateRetryDelay(
  attempt: number,
  strategy: RetryStrategy = defaultRetryStrategy
): number {
  const { initialDelay, maxDelay, multiplier, jitter } = strategy;

  // Calculate exponential backoff delay
  let delay = initialDelay * Math.pow(multiplier, attempt);

  // Cap at max delay
  delay = Math.min(delay, maxDelay);

  // Add jitter if enabled (±25% randomness)
  if (jitter) {
    const jitterAmount = delay * 0.25;
    const randomJitter = Math.random() * 2 * jitterAmount - jitterAmount;
    delay += randomJitter;
  }

  return Math.floor(delay);
}

/**
 * Sleep for a specified duration
 *
 * @param ms - Duration in milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 *
 * @param fn - Function to retry
 * @param strategy - Retry strategy configuration
 * @param onRetry - Optional callback invoked before each retry
 * @returns Promise resolving to the function result
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  strategy: RetryStrategy = defaultRetryStrategy,
  onRetry?: (attempt: number, error: Error, delay: number) => void
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= strategy.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // If we've exhausted all retries, throw the error
      if (attempt >= strategy.maxRetries) {
        throw new Error(
          `Operation failed after ${strategy.maxRetries} retries: ${lastError.message}`
        );
      }

      // Calculate delay for next retry
      const delay = calculateRetryDelay(attempt, strategy);

      // Invoke retry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, lastError, delay);
      }

      // Wait before retrying
      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError!;
}

/**
 * Create a retry wrapper for a function
 *
 * @param fn - Function to wrap
 * @param strategy - Retry strategy configuration
 * @returns Wrapped function with retry logic
 */
export function createRetryWrapper<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  strategy: RetryStrategy = defaultRetryStrategy
): T {
  return (async (...args: unknown[]) => {
    return withRetry(() => fn(...args), strategy);
  }) as T;
}

/**
 * Check if an error is retryable
 *
 * @param error - Error to check
 * @returns True if the error is retryable
 */
export function isRetryableError(error: Error): boolean {
  const retryableMessages = [
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
    'ECONNRESET',
    'EPIPE',
    'Channel closed',
    'Connection closed',
  ];

  return retryableMessages.some((msg) =>
    error.message.includes(msg)
  );
}

/**
 * Retry only if the error is retryable
 *
 * @param fn - Function to retry
 * @param strategy - Retry strategy configuration
 * @param onRetry - Optional callback invoked before each retry
 * @returns Promise resolving to the function result
 */
export async function withRetryIfRetryable<T>(
  fn: () => Promise<T>,
  strategy: RetryStrategy = defaultRetryStrategy,
  onRetry?: (attempt: number, error: Error, delay: number) => void
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= strategy.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // If error is not retryable, throw immediately
      if (!isRetryableError(lastError)) {
        throw lastError;
      }

      // If we've exhausted all retries, throw the error
      if (attempt >= strategy.maxRetries) {
        throw new Error(
          `Operation failed after ${strategy.maxRetries} retries: ${lastError.message}`
        );
      }

      // Calculate delay for next retry
      const delay = calculateRetryDelay(attempt, strategy);

      // Invoke retry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, lastError, delay);
      }

      // Wait before retrying
      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError!;
}
