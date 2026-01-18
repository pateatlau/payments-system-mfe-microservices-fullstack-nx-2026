/**
 * @payments-system/resilience
 *
 * Service resilience library providing circuit breaker patterns for:
 * - Inter-service HTTP calls
 * - Database operations
 * - Redis cache operations
 * - RabbitMQ message operations
 *
 * Phase 5.1 - Service Resilience
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
