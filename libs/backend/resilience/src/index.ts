/**
 * @payments-system/resilience
 *
 * Service resilience library providing:
 * - Circuit breaker patterns for inter-service calls
 * - Retry policies with exponential backoff
 * - Retry budgets to prevent retry storms
 * - Database, Redis, and RabbitMQ resilience
 *
 * Phase 5.1 - Circuit Breaker Implementation
 * Phase 5.2 - Retry Policies
 */

// Core circuit breaker
export {
  createCircuitBreaker,
  getCircuitBreaker,
  getAllCircuitBreakers,
  getCircuitState,
  getCircuitStats,
  getAllCircuitStats,
  openCircuit,
  closeCircuit,
  resetCircuitStats,
  removeCircuitBreaker,
  shutdownAllCircuitBreakers,
  formatCircuitStats,
  hasOpenCircuits,
  getOpenCircuits,
  CircuitState,
} from './lib/circuit-breaker';

export type {
  CircuitBreakerConfig,
  CircuitBreakerStats,
} from './lib/circuit-breaker';

// HTTP circuit breaker for inter-service calls
export {
  HttpCircuitBreaker,
  createHttpCircuitBreaker,
  registerServiceClient,
  getServiceClient,
  getAllServiceClients,
  getServicesHealth,
} from './lib/http-circuit-breaker';

export type {
  HttpCircuitBreakerConfig,
  HttpRequestConfig,
  HttpResponse,
} from './lib/http-circuit-breaker';

// Dependency circuit breakers (DB, Redis, RabbitMQ)
export {
  DependencyType,
  createDependencyCircuitBreaker,
  getDependencyBreaker,
  getDependencyState,
  getDependencyStats,
  getServiceDependencyStats,
  areServiceDependenciesHealthy,
  getUnhealthyDependencies,
  // Database
  createDatabaseCircuitBreaker,
  withDatabaseCircuitBreaker,
  // Redis
  createRedisCircuitBreaker,
  withRedisCircuitBreaker,
  // RabbitMQ
  createRabbitMQCircuitBreaker,
  withRabbitMQCircuitBreaker,
  // Health utilities
  getServiceDependenciesHealth,
  getServiceHealthLevel,
} from './lib/dependency-circuit-breaker';

export type {
  DependencyCircuitBreakerConfig,
  DatabaseCircuitBreakerConfig,
  RedisCircuitBreakerConfig,
  RabbitMQCircuitBreakerConfig,
  DependencyHealthStatus,
} from './lib/dependency-circuit-breaker';

// Prometheus metrics
export {
  createCircuitBreakerMetrics,
  createMetricCallbacks,
  updateCircuitMetrics,
  getCircuitMetricsSnapshot,
  initCircuitMetricsCollector,
  createCircuitMetricsMiddleware,
} from './lib/circuit-metrics';

export type { CircuitBreakerMetrics } from './lib/circuit-metrics';

// Retry policies (Phase 5.2)
export {
  // Main retry functions
  withRetry,
  withHttpRetry,
  // Retry Policy class
  RetryPolicy,
  createRetryPolicy,
  // Retry budget
  getRetryBudget,
  getRetryBudgetStats,
  getAllRetryBudgetStats,
  resetRetryBudget,
  resetAllRetryBudgets,
  // Idempotency helpers
  isIdempotentMethod,
  isSafeToRetry,
  // Error detection
  isRetryableError,
  // Delay calculation
  calculateRetryDelay,
  // Metrics
  initRetryMetrics,
  updateBudgetMetrics,
  // Service policies
  registerServiceRetryPolicy,
  getServiceRetryPolicy,
  getOrCreateServiceRetryPolicy,
  getAllServiceRetryPolicies,
} from './lib/retry-policy';

export type {
  IdempotentMethod,
  NonIdempotentMethod,
  HttpMethod,
  RetryPolicyConfig,
  RetryResult,
  RetryBudgetConfig,
  RetryBudgetStats,
  HttpRetryConfig,
} from './lib/retry-policy';
