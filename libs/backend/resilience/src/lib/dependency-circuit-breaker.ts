/**
 * Dependency Circuit Breakers
 *
 * Provides circuit breaker wrappers for external dependencies:
 * - Database (Prisma)
 * - Redis
 * - RabbitMQ
 *
 * Phase 5.1 - Service Resilience
 */

import {
  createCircuitBreaker,
  CircuitState,
  getCircuitState,
  getCircuitStats,
  CircuitBreakerStats,
} from './circuit-breaker';

/**
 * Circuit breaker instance type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CircuitBreakerInstance = any;

/**
 * Dependency types
 */
export enum DependencyType {
  DATABASE = 'database',
  REDIS = 'redis',
  RABBITMQ = 'rabbitmq',
  EXTERNAL_API = 'external-api',
}

/**
 * Dependency circuit breaker configuration
 */
export interface DependencyCircuitBreakerConfig {
  /** Service name (e.g., 'auth-service') */
  serviceName: string;
  /** Dependency type */
  dependencyType: DependencyType;
  /** Dependency identifier (e.g., 'primary-db', 'cache-redis') */
  dependencyId?: string;
  /** Timeout in milliseconds (default varies by dependency type) */
  timeout?: number;
  /** Error threshold percentage (default: 50) */
  errorThresholdPercentage?: number;
  /** Time in ms to wait before testing circuit (default: 30000) */
  resetTimeout?: number;
  /** Minimum number of requests before threshold calculation (default: 5) */
  volumeThreshold?: number;
  /** Custom logger */
  logger?: (message: string, context: Record<string, unknown>) => void;
  /** Callback when circuit state changes */
  onStateChange?: (state: CircuitState, dependencyType: DependencyType) => void;
  /** Fallback function */
  fallback?: (...args: unknown[]) => unknown;
}

/**
 * Default timeouts per dependency type
 */
const DEFAULT_TIMEOUTS: Record<DependencyType, number> = {
  [DependencyType.DATABASE]: 10000,    // 10 seconds for DB
  [DependencyType.REDIS]: 3000,        // 3 seconds for Redis (should be fast)
  [DependencyType.RABBITMQ]: 5000,     // 5 seconds for RabbitMQ
  [DependencyType.EXTERNAL_API]: 10000, // 10 seconds for external APIs
};

/**
 * Default error thresholds per dependency type
 */
const DEFAULT_ERROR_THRESHOLDS: Record<DependencyType, number> = {
  [DependencyType.DATABASE]: 50,       // 50% for DB (critical)
  [DependencyType.REDIS]: 70,          // 70% for Redis (can degrade)
  [DependencyType.RABBITMQ]: 60,       // 60% for RabbitMQ
  [DependencyType.EXTERNAL_API]: 50,   // 50% for external APIs
};

/**
 * Store for dependency circuit breakers
 */
const dependencyBreakers = new Map<string, { breaker: CircuitBreakerInstance; config: DependencyCircuitBreakerConfig }>();

/**
 * Generate a unique key for a dependency circuit breaker
 */
function getDependencyKey(serviceName: string, dependencyType: DependencyType, dependencyId?: string): string {
  const id = dependencyId || 'default';
  return `${serviceName}:${dependencyType}:${id}`;
}

/**
 * Create a circuit breaker for a dependency
 *
 * @param action - The async function to protect
 * @param config - Circuit breaker configuration
 * @returns The circuit breaker instance
 */
export function createDependencyCircuitBreaker(
  action: (...args: unknown[]) => Promise<unknown>,
  config: DependencyCircuitBreakerConfig
): CircuitBreakerInstance {
  const {
    serviceName,
    dependencyType,
    dependencyId,
    timeout = DEFAULT_TIMEOUTS[dependencyType],
    errorThresholdPercentage = DEFAULT_ERROR_THRESHOLDS[dependencyType],
    resetTimeout = 30000,
    volumeThreshold = 5,
    logger,
    onStateChange,
    fallback,
  } = config;

  const key = getDependencyKey(serviceName, dependencyType, dependencyId);

  // Return existing breaker if available
  const existing = dependencyBreakers.get(key);
  if (existing) {
    return existing.breaker;
  }

  const breaker = createCircuitBreaker(action, {
    name: key,
    timeout,
    errorThresholdPercentage,
    resetTimeout,
    volumeThreshold,
    logger,
    fallback,
    onOpen: () => {
      if (onStateChange) {
        onStateChange(CircuitState.OPEN, dependencyType);
      }
    },
    onClose: () => {
      if (onStateChange) {
        onStateChange(CircuitState.CLOSED, dependencyType);
      }
    },
    onHalfOpen: () => {
      if (onStateChange) {
        onStateChange(CircuitState.HALF_OPEN, dependencyType);
      }
    },
  });

  dependencyBreakers.set(key, { breaker, config });

  return breaker;
}

/**
 * Get dependency circuit breaker
 */
export function getDependencyBreaker(
  serviceName: string,
  dependencyType: DependencyType,
  dependencyId?: string
): CircuitBreakerInstance | undefined {
  const key = getDependencyKey(serviceName, dependencyType, dependencyId);
  return dependencyBreakers.get(key)?.breaker;
}

/**
 * Get dependency circuit state
 */
export function getDependencyState(
  serviceName: string,
  dependencyType: DependencyType,
  dependencyId?: string
): CircuitState | undefined {
  const key = getDependencyKey(serviceName, dependencyType, dependencyId);
  return getCircuitState(key);
}

/**
 * Get dependency circuit stats
 */
export function getDependencyStats(
  serviceName: string,
  dependencyType: DependencyType,
  dependencyId?: string
): CircuitBreakerStats | undefined {
  const key = getDependencyKey(serviceName, dependencyType, dependencyId);
  return getCircuitStats(key);
}

/**
 * Get all dependency stats for a service
 */
export function getServiceDependencyStats(serviceName: string): Record<string, CircuitBreakerStats> {
  const stats: Record<string, CircuitBreakerStats> = {};

  for (const [key] of dependencyBreakers) {
    if (key.startsWith(`${serviceName}:`)) {
      const circuitStats = getCircuitStats(key);
      if (circuitStats) {
        stats[key] = circuitStats;
      }
    }
  }

  return stats;
}

/**
 * Check if all dependencies for a service are healthy
 */
export function areServiceDependenciesHealthy(serviceName: string): boolean {
  for (const [key] of dependencyBreakers) {
    if (key.startsWith(`${serviceName}:`)) {
      const state = getCircuitState(key);
      if (state === CircuitState.OPEN) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Get unhealthy dependencies for a service
 */
export function getUnhealthyDependencies(serviceName: string): string[] {
  const unhealthy: string[] = [];

  for (const [key] of dependencyBreakers) {
    if (key.startsWith(`${serviceName}:`)) {
      const state = getCircuitState(key);
      if (state === CircuitState.OPEN || state === CircuitState.HALF_OPEN) {
        unhealthy.push(key);
      }
    }
  }

  return unhealthy;
}

// ============================================================================
// Database Circuit Breaker
// ============================================================================

/**
 * Database operation wrapper with circuit breaker
 */
export interface DatabaseCircuitBreakerConfig extends Omit<DependencyCircuitBreakerConfig, 'dependencyType'> {
  /** Fallback value for read operations */
  readFallback?: unknown;
  /** Whether to allow writes when circuit is degraded */
  allowDegradedWrites?: boolean;
}

/**
 * Create a database operation circuit breaker
 *
 * @example
 * ```typescript
 * const dbBreaker = createDatabaseCircuitBreaker({
 *   serviceName: 'auth-service',
 *   dependencyId: 'auth-db',
 *   timeout: 10000,
 * });
 *
 * const user = await dbBreaker.fire(async () => prisma.user.findUnique({ where: { id } }));
 * ```
 */
export function createDatabaseCircuitBreaker(
  config: DatabaseCircuitBreakerConfig
): CircuitBreakerInstance {
  return createDependencyCircuitBreaker(
    async (operation: () => Promise<unknown>) => operation(),
    {
      ...config,
      dependencyType: DependencyType.DATABASE,
    }
  );
}

/**
 * Wrap a Prisma operation with circuit breaker protection
 */
export function withDatabaseCircuitBreaker<T>(
  serviceName: string,
  operation: () => Promise<T>,
  options?: { dependencyId?: string; fallback?: () => T }
): Promise<T> {
  const key = getDependencyKey(serviceName, DependencyType.DATABASE, options?.dependencyId);
  const entry = dependencyBreakers.get(key);

  if (!entry) {
    // No circuit breaker configured, run operation directly
    return operation();
  }

  if (options?.fallback) {
    entry.breaker.fallback(options.fallback);
  }

  return entry.breaker.fire(operation) as Promise<T>;
}

// ============================================================================
// Redis Circuit Breaker
// ============================================================================

/**
 * Redis circuit breaker configuration
 */
export interface RedisCircuitBreakerConfig extends Omit<DependencyCircuitBreakerConfig, 'dependencyType'> {
  /** Cache fallback value */
  cacheFallback?: unknown;
}

/**
 * Create a Redis operation circuit breaker
 *
 * @example
 * ```typescript
 * const redisBreaker = createRedisCircuitBreaker({
 *   serviceName: 'auth-service',
 *   dependencyId: 'cache',
 *   timeout: 3000,
 * });
 *
 * const cached = await redisBreaker.fire(async () => redis.get('user:123'));
 * ```
 */
export function createRedisCircuitBreaker(
  config: RedisCircuitBreakerConfig
): CircuitBreakerInstance {
  return createDependencyCircuitBreaker(
    async (operation: () => Promise<unknown>) => operation(),
    {
      ...config,
      dependencyType: DependencyType.REDIS,
      timeout: config.timeout || DEFAULT_TIMEOUTS[DependencyType.REDIS],
      errorThresholdPercentage: config.errorThresholdPercentage || DEFAULT_ERROR_THRESHOLDS[DependencyType.REDIS],
    }
  );
}

/**
 * Wrap a Redis operation with circuit breaker protection
 */
export function withRedisCircuitBreaker<T>(
  serviceName: string,
  operation: () => Promise<T>,
  options?: { dependencyId?: string; fallback?: () => T }
): Promise<T> {
  const key = getDependencyKey(serviceName, DependencyType.REDIS, options?.dependencyId);
  const entry = dependencyBreakers.get(key);

  if (!entry) {
    // No circuit breaker configured, run operation directly
    return operation();
  }

  if (options?.fallback) {
    entry.breaker.fallback(options.fallback);
  }

  return entry.breaker.fire(operation) as Promise<T>;
}

// ============================================================================
// RabbitMQ Circuit Breaker
// ============================================================================

/**
 * RabbitMQ circuit breaker configuration
 */
export interface RabbitMQCircuitBreakerConfig extends Omit<DependencyCircuitBreakerConfig, 'dependencyType'> {
  /** Whether to queue messages locally when circuit is open */
  enableLocalQueue?: boolean;
  /** Maximum local queue size */
  maxLocalQueueSize?: number;
}

/**
 * Create a RabbitMQ operation circuit breaker
 *
 * @example
 * ```typescript
 * const rabbitBreaker = createRabbitMQCircuitBreaker({
 *   serviceName: 'payments-service',
 *   dependencyId: 'events',
 *   timeout: 5000,
 * });
 *
 * await rabbitBreaker.fire(async () => eventHub.publish('payment.created', data));
 * ```
 */
export function createRabbitMQCircuitBreaker(
  config: RabbitMQCircuitBreakerConfig
): CircuitBreakerInstance {
  return createDependencyCircuitBreaker(
    async (operation: () => Promise<unknown>) => operation(),
    {
      ...config,
      dependencyType: DependencyType.RABBITMQ,
      timeout: config.timeout || DEFAULT_TIMEOUTS[DependencyType.RABBITMQ],
      errorThresholdPercentage: config.errorThresholdPercentage || DEFAULT_ERROR_THRESHOLDS[DependencyType.RABBITMQ],
    }
  );
}

/**
 * Wrap a RabbitMQ operation with circuit breaker protection
 */
export function withRabbitMQCircuitBreaker<T>(
  serviceName: string,
  operation: () => Promise<T>,
  options?: { dependencyId?: string; fallback?: () => T }
): Promise<T> {
  const key = getDependencyKey(serviceName, DependencyType.RABBITMQ, options?.dependencyId);
  const entry = dependencyBreakers.get(key);

  if (!entry) {
    // No circuit breaker configured, run operation directly
    return operation();
  }

  if (options?.fallback) {
    entry.breaker.fallback(options.fallback);
  }

  return entry.breaker.fire(operation) as Promise<T>;
}

// ============================================================================
// Health Check Utilities
// ============================================================================

/**
 * Dependency health status
 */
export interface DependencyHealthStatus {
  type: DependencyType;
  id: string;
  healthy: boolean;
  state: CircuitState;
  stats?: CircuitBreakerStats;
}

/**
 * Get health status for all dependencies of a service
 */
export function getServiceDependenciesHealth(serviceName: string): DependencyHealthStatus[] {
  const health: DependencyHealthStatus[] = [];

  for (const [key, { config }] of dependencyBreakers) {
    if (key.startsWith(`${serviceName}:`)) {
      const state = getCircuitState(key);
      const stats = getCircuitStats(key);

      health.push({
        type: config.dependencyType,
        id: config.dependencyId || 'default',
        healthy: state === CircuitState.CLOSED,
        state: state || CircuitState.CLOSED,
        stats,
      });
    }
  }

  return health;
}

/**
 * Get overall health level for a service
 * Returns: 'healthy' | 'degraded' | 'unhealthy'
 */
export function getServiceHealthLevel(serviceName: string): 'healthy' | 'degraded' | 'unhealthy' {
  let hasOpen = false;
  let hasHalfOpen = false;

  for (const [key] of dependencyBreakers) {
    if (key.startsWith(`${serviceName}:`)) {
      const state = getCircuitState(key);
      if (state === CircuitState.OPEN) {
        hasOpen = true;
      } else if (state === CircuitState.HALF_OPEN) {
        hasHalfOpen = true;
      }
    }
  }

  if (hasOpen) {
    return 'unhealthy';
  }
  if (hasHalfOpen) {
    return 'degraded';
  }
  return 'healthy';
}
