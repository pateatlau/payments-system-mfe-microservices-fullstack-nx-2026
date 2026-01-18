/**
 * Retry Policy Implementation
 *
 * Provides exponential backoff retry with:
 * - Configurable max retries, delays, and backoff
 * - Idempotent operation detection
 * - Retry budget to prevent retry storms
 * - Prometheus metrics integration
 *
 * Phase 5.2 - Service Resilience
 */

import { Counter, Histogram, Gauge, Registry } from 'prom-client';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * HTTP methods considered idempotent (safe to retry)
 */
export type IdempotentMethod = 'GET' | 'HEAD' | 'OPTIONS' | 'PUT' | 'DELETE';

/**
 * HTTP methods that are NOT idempotent by default
 */
export type NonIdempotentMethod = 'POST' | 'PATCH';

/**
 * All HTTP methods
 */
export type HttpMethod = IdempotentMethod | NonIdempotentMethod;

/**
 * Configuration for retry policy
 */
export interface RetryPolicyConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in ms before first retry (default: 100ms) */
  initialDelayMs?: number;
  /** Backoff multiplier for each retry (default: 2) */
  backoffFactor?: number;
  /** Maximum delay in ms between retries (default: 5000ms) */
  maxDelayMs?: number;
  /** Whether the operation is idempotent (default: auto-detect from method) */
  isIdempotent?: boolean;
  /** Custom function to determine if error is retryable */
  isRetryable?: (error: unknown) => boolean;
  /** Callback when retry is attempted */
  onRetry?: (attempt: number, error: unknown, delayMs: number) => void;
  /** Operation name for metrics/logging */
  operationName?: string;
  /** Service name for metrics */
  serviceName?: string;
}

/**
 * Result of a retry operation
 */
export interface RetryResult<T> {
  /** The result value if successful */
  value?: T;
  /** The final error if all retries failed */
  error?: Error;
  /** Whether the operation succeeded */
  success: boolean;
  /** Number of attempts made (1 = no retries) */
  attempts: number;
  /** Total time spent including retries (ms) */
  totalTimeMs: number;
  /** Whether any retries were needed */
  retriesNeeded: boolean;
}

/**
 * Retry budget configuration
 */
export interface RetryBudgetConfig {
  /** Time window in ms for budget calculation (default: 10000ms = 10s) */
  windowMs?: number;
  /** Maximum retry ratio (retries/requests) in window (default: 0.2 = 20%) */
  maxRetryRatio?: number;
  /** Minimum requests before budget applies (default: 10) */
  minRequestsForBudget?: number;
  /** Budget name for tracking */
  name?: string;
}

/**
 * Retry budget statistics
 */
export interface RetryBudgetStats {
  /** Current retry ratio */
  retryRatio: number;
  /** Total requests in window */
  totalRequests: number;
  /** Total retries in window */
  totalRetries: number;
  /** Whether budget is exhausted */
  budgetExhausted: boolean;
  /** Remaining retries allowed in window */
  remainingRetries: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_RETRY_CONFIG: Required<
  Omit<RetryPolicyConfig, 'isRetryable' | 'onRetry' | 'operationName' | 'serviceName' | 'isIdempotent'>
> = {
  maxRetries: 3,
  initialDelayMs: 100,
  backoffFactor: 2,
  maxDelayMs: 5000,
};

const DEFAULT_BUDGET_CONFIG: Required<Omit<RetryBudgetConfig, 'name'>> = {
  windowMs: 10000,
  maxRetryRatio: 0.2,
  minRequestsForBudget: 10,
};

// ============================================================================
// Retry Budget Implementation
// ============================================================================

interface BudgetEntry {
  timestamp: number;
  isRetry: boolean;
}

class RetryBudget {
  private entries: BudgetEntry[] = [];
  private readonly config: Required<Omit<RetryBudgetConfig, 'name'>>;
  readonly name: string;

  constructor(config: RetryBudgetConfig = {}) {
    this.name = config.name || 'default';
    this.config = {
      windowMs: config.windowMs ?? DEFAULT_BUDGET_CONFIG.windowMs,
      maxRetryRatio: config.maxRetryRatio ?? DEFAULT_BUDGET_CONFIG.maxRetryRatio,
      minRequestsForBudget: config.minRequestsForBudget ?? DEFAULT_BUDGET_CONFIG.minRequestsForBudget,
    };
  }

  /**
   * Clean old entries outside the time window
   */
  private cleanOldEntries(): void {
    const cutoff = Date.now() - this.config.windowMs;
    this.entries = this.entries.filter(e => e.timestamp >= cutoff);
  }

  /**
   * Record a request (not a retry)
   */
  recordRequest(): void {
    this.cleanOldEntries();
    this.entries.push({ timestamp: Date.now(), isRetry: false });
  }

  /**
   * Record a retry attempt
   */
  recordRetry(): void {
    this.cleanOldEntries();
    this.entries.push({ timestamp: Date.now(), isRetry: true });
  }

  /**
   * Check if a retry is allowed by budget
   */
  canRetry(): boolean {
    this.cleanOldEntries();

    const totalRequests = this.entries.filter(e => !e.isRetry).length;
    const totalRetries = this.entries.filter(e => e.isRetry).length;

    // Always allow retries if below minimum threshold
    if (totalRequests < this.config.minRequestsForBudget) {
      return true;
    }

    // Calculate current retry ratio
    const retryRatio = totalRetries / totalRequests;
    return retryRatio < this.config.maxRetryRatio;
  }

  /**
   * Get current budget statistics
   */
  getStats(): RetryBudgetStats {
    this.cleanOldEntries();

    const totalRequests = this.entries.filter(e => !e.isRetry).length;
    const totalRetries = this.entries.filter(e => e.isRetry).length;
    const retryRatio = totalRequests > 0 ? totalRetries / totalRequests : 0;
    const budgetExhausted = totalRequests >= this.config.minRequestsForBudget && retryRatio >= this.config.maxRetryRatio;

    // Calculate remaining retries
    const maxRetries = Math.floor(totalRequests * this.config.maxRetryRatio);
    const remainingRetries = Math.max(0, maxRetries - totalRetries);

    return {
      retryRatio,
      totalRequests,
      totalRetries,
      budgetExhausted,
      remainingRetries,
    };
  }

  /**
   * Reset the budget (clear all entries)
   */
  reset(): void {
    this.entries = [];
  }
}

// Global registry of retry budgets
const retryBudgets = new Map<string, RetryBudget>();

/**
 * Get or create a retry budget
 */
export function getRetryBudget(name: string, config?: RetryBudgetConfig): RetryBudget {
  let budget = retryBudgets.get(name);
  if (!budget) {
    budget = new RetryBudget({ ...config, name });
    retryBudgets.set(name, budget);
  }
  return budget;
}

/**
 * Get retry budget statistics
 */
export function getRetryBudgetStats(name: string): RetryBudgetStats | null {
  const budget = retryBudgets.get(name);
  return budget ? budget.getStats() : null;
}

/**
 * Get all retry budget statistics
 */
export function getAllRetryBudgetStats(): Record<string, RetryBudgetStats> {
  const stats: Record<string, RetryBudgetStats> = {};
  for (const [name, budget] of retryBudgets) {
    stats[name] = budget.getStats();
  }
  return stats;
}

/**
 * Reset a retry budget
 */
export function resetRetryBudget(name: string): void {
  const budget = retryBudgets.get(name);
  if (budget) {
    budget.reset();
  }
}

/**
 * Reset all retry budgets
 */
export function resetAllRetryBudgets(): void {
  for (const budget of retryBudgets.values()) {
    budget.reset();
  }
}

// ============================================================================
// Idempotency Helpers
// ============================================================================

const IDEMPOTENT_METHODS: Set<string> = new Set(['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE']);

/**
 * Check if an HTTP method is idempotent
 */
export function isIdempotentMethod(method: string): boolean {
  return IDEMPOTENT_METHODS.has(method.toUpperCase());
}

/**
 * Check if an operation is safe to retry based on method and config
 */
export function isSafeToRetry(method: string, explicitIdempotent?: boolean): boolean {
  if (explicitIdempotent !== undefined) {
    return explicitIdempotent;
  }
  return isIdempotentMethod(method);
}

// ============================================================================
// Error Detection
// ============================================================================

/**
 * Default retryable errors
 */
const RETRYABLE_ERROR_CODES = new Set([
  'ECONNRESET',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'EPIPE',
  'ENOTFOUND',
  'ENETUNREACH',
  'EAI_AGAIN',
  'EHOSTUNREACH',
]);

/**
 * Retryable HTTP status codes (server errors that might be transient)
 */
const RETRYABLE_STATUS_CODES = new Set([
  408, // Request Timeout
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
]);

/**
 * Default function to determine if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (!error) return false;

  // Check error code (Node.js network errors)
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;

    // Check error code
    if (typeof err.code === 'string' && RETRYABLE_ERROR_CODES.has(err.code)) {
      return true;
    }

    // Check HTTP status code
    if (typeof err.status === 'number' && RETRYABLE_STATUS_CODES.has(err.status)) {
      return true;
    }
    if (typeof err.statusCode === 'number' && RETRYABLE_STATUS_CODES.has(err.statusCode)) {
      return true;
    }

    // Check response status
    if (err.response && typeof err.response === 'object') {
      const response = err.response as Record<string, unknown>;
      if (typeof response.status === 'number' && RETRYABLE_STATUS_CODES.has(response.status)) {
        return true;
      }
    }

    // Check for timeout errors
    if (err.name === 'TimeoutError' || (err.message && String(err.message).toLowerCase().includes('timeout'))) {
      return true;
    }
  }

  // Check for timeout in error message
  if (error instanceof Error && error.message.toLowerCase().includes('timeout')) {
    return true;
  }

  return false;
}

// ============================================================================
// Delay Calculation
// ============================================================================

/**
 * Calculate delay for a retry attempt with exponential backoff
 */
export function calculateRetryDelay(
  attempt: number,
  initialDelayMs: number,
  backoffFactor: number,
  maxDelayMs: number,
  jitter: boolean = true
): number {
  // Calculate base delay: initialDelay * backoffFactor^(attempt-1)
  const baseDelay = initialDelayMs * Math.pow(backoffFactor, attempt - 1);

  // Cap at max delay
  const cappedDelay = Math.min(baseDelay, maxDelayMs);

  // Add jitter (0-25% random variance) to prevent thundering herd
  if (jitter) {
    const jitterFactor = 1 + (Math.random() * 0.25);
    return Math.floor(cappedDelay * jitterFactor);
  }

  return Math.floor(cappedDelay);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Prometheus Metrics
// ============================================================================

let retryMetrics: {
  attemptsTotal: Counter;
  successesTotal: Counter;
  failuresTotal: Counter;
  exhaustedTotal: Counter;
  budgetExhaustedTotal: Counter;
  attemptDuration: Histogram;
  budgetRatio: Gauge;
} | null = null;

/**
 * Initialize retry metrics for Prometheus
 */
export function initRetryMetrics(registry?: Registry): void {
  const reg = registry || new Registry();

  retryMetrics = {
    attemptsTotal: new Counter({
      name: 'retry_attempts_total',
      help: 'Total number of retry attempts',
      labelNames: ['service', 'operation', 'attempt'],
      registers: [reg],
    }),

    successesTotal: new Counter({
      name: 'retry_successes_total',
      help: 'Total number of successful operations (including retries)',
      labelNames: ['service', 'operation', 'attempts_needed'],
      registers: [reg],
    }),

    failuresTotal: new Counter({
      name: 'retry_failures_total',
      help: 'Total number of failed operations after all retries',
      labelNames: ['service', 'operation'],
      registers: [reg],
    }),

    exhaustedTotal: new Counter({
      name: 'retry_exhausted_total',
      help: 'Total number of operations where retries were exhausted',
      labelNames: ['service', 'operation'],
      registers: [reg],
    }),

    budgetExhaustedTotal: new Counter({
      name: 'retry_budget_exhausted_total',
      help: 'Total number of retries blocked by budget',
      labelNames: ['service', 'budget'],
      registers: [reg],
    }),

    attemptDuration: new Histogram({
      name: 'retry_attempt_duration_seconds',
      help: 'Duration of individual retry attempts',
      labelNames: ['service', 'operation', 'attempt'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [reg],
    }),

    budgetRatio: new Gauge({
      name: 'retry_budget_ratio',
      help: 'Current retry budget ratio (retries/requests)',
      labelNames: ['budget'],
      registers: [reg],
    }),
  };
}

/**
 * Record retry metrics
 */
function recordRetryMetrics(
  serviceName: string,
  operationName: string,
  attempt: number,
  durationMs: number,
  _success: boolean
): void {
  if (!retryMetrics) return;

  retryMetrics.attemptsTotal.inc({
    service: serviceName,
    operation: operationName,
    attempt: String(attempt),
  });

  retryMetrics.attemptDuration.observe(
    {
      service: serviceName,
      operation: operationName,
      attempt: String(attempt),
    },
    durationMs / 1000
  );
}

/**
 * Record final result metrics
 */
function recordResultMetrics(
  serviceName: string,
  operationName: string,
  result: RetryResult<unknown>
): void {
  if (!retryMetrics) return;

  if (result.success) {
    retryMetrics.successesTotal.inc({
      service: serviceName,
      operation: operationName,
      attempts_needed: String(result.attempts),
    });
  } else {
    retryMetrics.failuresTotal.inc({
      service: serviceName,
      operation: operationName,
    });
    retryMetrics.exhaustedTotal.inc({
      service: serviceName,
      operation: operationName,
    });
  }
}

/**
 * Update budget metrics
 */
export function updateBudgetMetrics(): void {
  if (!retryMetrics) return;

  for (const [name, budget] of retryBudgets) {
    const stats = budget.getStats();
    retryMetrics.budgetRatio.set({ budget: name }, stats.retryRatio);
  }
}

// ============================================================================
// Main Retry Function
// ============================================================================

/**
 * Execute an operation with retry logic
 *
 * @param operation The async operation to execute
 * @param config Retry configuration
 * @returns RetryResult with the outcome
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => httpClient.get('/api/data'),
 *   {
 *     maxRetries: 3,
 *     operationName: 'fetchData',
 *     serviceName: 'api-gateway',
 *   }
 * );
 *
 * if (result.success) {
 *   console.log('Data:', result.value);
 * } else {
 *   console.error('Failed after', result.attempts, 'attempts:', result.error);
 * }
 * ```
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryPolicyConfig = {}
): Promise<RetryResult<T>> {
  const {
    maxRetries = DEFAULT_RETRY_CONFIG.maxRetries,
    initialDelayMs = DEFAULT_RETRY_CONFIG.initialDelayMs,
    backoffFactor = DEFAULT_RETRY_CONFIG.backoffFactor,
    maxDelayMs = DEFAULT_RETRY_CONFIG.maxDelayMs,
    isIdempotent = true, // Default to idempotent if not specified
    isRetryable = isRetryableError,
    onRetry,
    operationName = 'unknown',
    serviceName = 'unknown',
  } = config;

  const startTime = Date.now();
  let attempts = 0;
  let lastError: Error | undefined;

  // Get or create retry budget for this service
  const budget = getRetryBudget(serviceName);

  while (attempts <= maxRetries) {
    attempts++;
    const attemptStart = Date.now();

    try {
      // Record request (only on first attempt)
      if (attempts === 1) {
        budget.recordRequest();
      }

      const value = await operation();

      // Record success metrics
      const attemptDuration = Date.now() - attemptStart;
      recordRetryMetrics(serviceName, operationName, attempts, attemptDuration, true);
      recordResultMetrics(serviceName, operationName, {
        success: true,
        attempts,
        totalTimeMs: Date.now() - startTime,
        retriesNeeded: attempts > 1,
      });

      return {
        value,
        success: true,
        attempts,
        totalTimeMs: Date.now() - startTime,
        retriesNeeded: attempts > 1,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Record attempt metrics
      const attemptDuration = Date.now() - attemptStart;
      recordRetryMetrics(serviceName, operationName, attempts, attemptDuration, false);

      // Check if we should retry
      if (attempts > maxRetries) {
        break; // Max retries reached
      }

      if (!isIdempotent) {
        // Don't retry non-idempotent operations
        break;
      }

      if (!isRetryable(error)) {
        // Error is not retryable
        break;
      }

      // Check retry budget
      if (!budget.canRetry()) {
        if (retryMetrics) {
          retryMetrics.budgetExhaustedTotal.inc({
            service: serviceName,
            budget: serviceName,
          });
        }
        break; // Budget exhausted
      }

      // Calculate delay and wait
      const delay = calculateRetryDelay(attempts, initialDelayMs, backoffFactor, maxDelayMs);

      // Record retry in budget
      budget.recordRetry();

      // Call onRetry callback
      if (onRetry) {
        onRetry(attempts, error, delay);
      }

      await sleep(delay);
    }
  }

  // All retries failed
  const result: RetryResult<T> = {
    error: lastError,
    success: false,
    attempts,
    totalTimeMs: Date.now() - startTime,
    retriesNeeded: attempts > 1,
  };

  recordResultMetrics(serviceName, operationName, result);

  return result;
}

// ============================================================================
// HTTP-Specific Retry Wrapper
// ============================================================================

/**
 * Configuration for HTTP retry
 */
export interface HttpRetryConfig extends RetryPolicyConfig {
  /** HTTP method (used to determine idempotency) */
  method?: HttpMethod;
}

/**
 * Execute an HTTP operation with retry logic
 * Automatically determines idempotency from HTTP method
 */
export async function withHttpRetry<T>(
  operation: () => Promise<T>,
  config: HttpRetryConfig = {}
): Promise<RetryResult<T>> {
  const { method, isIdempotent, ...restConfig } = config;

  // Determine idempotency from method if not explicitly set
  const effectiveIdempotent = isIdempotent ?? (method ? isIdempotentMethod(method) : true);

  return withRetry(operation, {
    ...restConfig,
    isIdempotent: effectiveIdempotent,
  });
}

// ============================================================================
// Retry Policy Class
// ============================================================================

/**
 * Retry policy class for reusable retry configuration
 */
export class RetryPolicy {
  private readonly config: RetryPolicyConfig;
  private readonly budget: RetryBudget;

  constructor(config: RetryPolicyConfig & { budgetConfig?: RetryBudgetConfig } = {}) {
    this.config = config;
    const budgetName = config.serviceName || 'default';
    this.budget = getRetryBudget(budgetName, config.budgetConfig);
  }

  /**
   * Execute an operation with this policy's retry configuration
   */
  async execute<T>(operation: () => Promise<T>, operationConfig?: Partial<RetryPolicyConfig>): Promise<RetryResult<T>> {
    return withRetry(operation, {
      ...this.config,
      ...operationConfig,
    });
  }

  /**
   * Execute an HTTP operation with this policy
   */
  async executeHttp<T>(
    operation: () => Promise<T>,
    method: HttpMethod,
    operationConfig?: Partial<RetryPolicyConfig>
  ): Promise<RetryResult<T>> {
    return withHttpRetry(operation, {
      ...this.config,
      ...operationConfig,
      method,
    });
  }

  /**
   * Get current retry budget stats
   */
  getBudgetStats(): RetryBudgetStats {
    return this.budget.getStats();
  }

  /**
   * Reset the retry budget
   */
  resetBudget(): void {
    this.budget.reset();
  }
}

/**
 * Create a new retry policy
 */
export function createRetryPolicy(config?: RetryPolicyConfig & { budgetConfig?: RetryBudgetConfig }): RetryPolicy {
  return new RetryPolicy(config);
}

// ============================================================================
// Service-Level Retry Policies
// ============================================================================

// Registry of service retry policies
const servicePolicies = new Map<string, RetryPolicy>();

/**
 * Register a retry policy for a service
 */
export function registerServiceRetryPolicy(
  serviceName: string,
  config?: RetryPolicyConfig & { budgetConfig?: RetryBudgetConfig }
): RetryPolicy {
  const policy = new RetryPolicy({
    ...config,
    serviceName,
  });
  servicePolicies.set(serviceName, policy);
  return policy;
}

/**
 * Get a service's retry policy
 */
export function getServiceRetryPolicy(serviceName: string): RetryPolicy | undefined {
  return servicePolicies.get(serviceName);
}

/**
 * Get or create a service's retry policy with default config
 */
export function getOrCreateServiceRetryPolicy(
  serviceName: string,
  config?: RetryPolicyConfig & { budgetConfig?: RetryBudgetConfig }
): RetryPolicy {
  let policy = servicePolicies.get(serviceName);
  if (!policy) {
    policy = registerServiceRetryPolicy(serviceName, config);
  }
  return policy;
}

/**
 * Get all registered service retry policies
 */
export function getAllServiceRetryPolicies(): Map<string, RetryPolicy> {
  return new Map(servicePolicies);
}
