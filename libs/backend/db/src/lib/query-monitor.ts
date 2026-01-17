/**
 * Query Monitor - Database Query Performance Monitoring
 *
 * Provides Prisma middleware for:
 * - Query timeout enforcement
 * - Slow query logging
 * - Query performance metrics
 *
 * Phase 4.2 - Database Security Hardening
 */

/**
 * Configuration for the query monitor middleware
 */
export interface QueryMonitorConfig {
  /** Service name for logging and metrics labeling */
  serviceName: string;
  /** Query timeout in milliseconds (default: 10000ms / 10s) */
  queryTimeoutMs?: number;
  /** Slow query threshold in milliseconds (default: 1000ms / 1s) */
  slowQueryThresholdMs?: number;
  /** Enable Prometheus metrics collection (default: true) */
  enableMetrics?: boolean;
  /** Enable slow query logging (default: true) */
  enableLogging?: boolean;
  /** Custom logger function (default: console.warn) */
  logger?: (message: string, context: Record<string, unknown>) => void;
  /** Callback for slow query alerts */
  onSlowQuery?: (queryInfo: SlowQueryInfo) => void;
  /** Callback for query timeout */
  onQueryTimeout?: (queryInfo: QueryTimeoutInfo) => void;
}

/**
 * Information about a slow query
 */
export interface SlowQueryInfo {
  serviceName: string;
  model: string | undefined;
  action: string;
  durationMs: number;
  threshold: number;
  timestamp: Date;
  args?: unknown;
}

/**
 * Information about a query timeout
 */
export interface QueryTimeoutInfo {
  serviceName: string;
  model: string | undefined;
  action: string;
  timeoutMs: number;
  timestamp: Date;
  error: Error;
}

/**
 * Query statistics tracked by the monitor
 */
export interface QueryStats {
  totalQueries: number;
  slowQueries: number;
  timeoutQueries: number;
  totalDurationMs: number;
  avgDurationMs: number;
  maxDurationMs: number;
  minDurationMs: number;
  queriesByModel: Record<string, number>;
  queriesByAction: Record<string, number>;
  lastUpdated: Date;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Required<Omit<QueryMonitorConfig, 'serviceName' | 'onSlowQuery' | 'onQueryTimeout'>> = {
  queryTimeoutMs: 10000,      // 10 seconds
  slowQueryThresholdMs: 1000, // 1 second
  enableMetrics: true,
  enableLogging: true,
  logger: (message: string, context: Record<string, unknown>) => {
    console.warn(JSON.stringify({ level: 'warn', message, ...context, timestamp: new Date().toISOString() }));
  },
};

/**
 * Query monitor state (per service)
 */
const queryStatsMap = new Map<string, QueryStats>();

/**
 * Initialize query stats for a service
 */
function initializeStats(serviceName: string): QueryStats {
  const stats: QueryStats = {
    totalQueries: 0,
    slowQueries: 0,
    timeoutQueries: 0,
    totalDurationMs: 0,
    avgDurationMs: 0,
    maxDurationMs: 0,
    minDurationMs: Infinity,
    queriesByModel: {},
    queriesByAction: {},
    lastUpdated: new Date(),
  };
  queryStatsMap.set(serviceName, stats);
  return stats;
}

/**
 * Get query stats for a service
 */
export function getQueryStats(serviceName: string): QueryStats | undefined {
  return queryStatsMap.get(serviceName);
}

/**
 * Reset query stats for a service
 */
export function resetQueryStats(serviceName: string): void {
  initializeStats(serviceName);
}

/**
 * Prisma middleware params type
 */
interface PrismaMiddlewareParams {
  model?: string;
  action: string;
  args?: unknown;
  dataPath: string[];
  runInTransaction: boolean;
}

/**
 * Creates a timeout promise that rejects after the specified duration
 */
function createTimeoutPromise(timeoutMs: number, model: string | undefined, action: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const modelName = model || 'unknown';
      const error = new Error(
        'Query timeout: ' + modelName + '.' + action + ' exceeded ' + timeoutMs + 'ms'
      );
      error.name = 'QueryTimeoutError';
      reject(error);
    }, timeoutMs);
  });
}

/**
 * Create a Prisma middleware for query monitoring
 *
 * @param config - Query monitor configuration
 * @returns Prisma middleware function
 *
 * @example
 * ```typescript
 * const middleware = createQueryMonitorMiddleware({
 *   serviceName: 'auth-service',
 *   queryTimeoutMs: 10000,
 *   slowQueryThresholdMs: 1000,
 * });
 * prisma.$use(middleware);
 * ```
 */
export function createQueryMonitorMiddleware(config: QueryMonitorConfig) {
  const {
    serviceName,
    queryTimeoutMs = DEFAULT_CONFIG.queryTimeoutMs,
    slowQueryThresholdMs = DEFAULT_CONFIG.slowQueryThresholdMs,
    enableLogging = DEFAULT_CONFIG.enableLogging,
    logger = DEFAULT_CONFIG.logger,
    onSlowQuery,
    onQueryTimeout,
  } = config;

  // Initialize stats for this service
  if (!queryStatsMap.has(serviceName)) {
    initializeStats(serviceName);
  }

  return async function queryMonitorMiddleware(
    params: PrismaMiddlewareParams,
    next: (params: PrismaMiddlewareParams) => Promise<unknown>
  ): Promise<unknown> {
    const stats = queryStatsMap.get(serviceName)!;
    const startTime = Date.now();
    const { model, action } = params;
    const modelName = model || 'unknown';

    // Update query counts
    stats.totalQueries++;
    stats.queriesByModel[modelName] = (stats.queriesByModel[modelName] || 0) + 1;
    stats.queriesByAction[action] = (stats.queriesByAction[action] || 0) + 1;

    try {
      // Race between the query and a timeout
      const result = await Promise.race([
        next(params),
        createTimeoutPromise(queryTimeoutMs, model, action),
      ]);

      const duration = Date.now() - startTime;

      // Update duration stats
      stats.totalDurationMs += duration;
      stats.avgDurationMs = stats.totalDurationMs / stats.totalQueries;
      stats.maxDurationMs = Math.max(stats.maxDurationMs, duration);
      stats.minDurationMs = Math.min(stats.minDurationMs, duration);
      stats.lastUpdated = new Date();

      // Check for slow query
      if (duration > slowQueryThresholdMs) {
        stats.slowQueries++;

        const slowQueryInfo: SlowQueryInfo = {
          serviceName,
          model,
          action,
          durationMs: duration,
          threshold: slowQueryThresholdMs,
          timestamp: new Date(),
        };

        if (enableLogging) {
          logger('Slow query detected: ' + modelName + '.' + action, {
            service: serviceName,
            model: modelName,
            action,
            durationMs: duration,
            thresholdMs: slowQueryThresholdMs,
          });
        }

        if (onSlowQuery) {
          onSlowQuery(slowQueryInfo);
        }
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      stats.lastUpdated = new Date();

      // Check if this is a timeout error
      if (error instanceof Error && error.name === 'QueryTimeoutError') {
        stats.timeoutQueries++;

        const timeoutInfo: QueryTimeoutInfo = {
          serviceName,
          model,
          action,
          timeoutMs: queryTimeoutMs,
          timestamp: new Date(),
          error,
        };

        if (enableLogging) {
          logger('Query timeout: ' + modelName + '.' + action, {
            service: serviceName,
            model: modelName,
            action,
            timeoutMs: queryTimeoutMs,
            actualDurationMs: duration,
          });
        }

        if (onQueryTimeout) {
          onQueryTimeout(timeoutInfo);
        }
      }

      throw error;
    }
  };
}

/**
 * Get all query stats across all services
 */
export function getAllQueryStats(): Map<string, QueryStats> {
  return new Map(queryStatsMap);
}

/**
 * Format query stats for logging or API response
 */
export function formatQueryStats(stats: QueryStats): Record<string, unknown> {
  return {
    totalQueries: stats.totalQueries,
    slowQueries: stats.slowQueries,
    timeoutQueries: stats.timeoutQueries,
    avgDurationMs: Math.round(stats.avgDurationMs * 100) / 100,
    maxDurationMs: stats.maxDurationMs,
    minDurationMs: stats.minDurationMs === Infinity ? 0 : stats.minDurationMs,
    slowQueryRate: stats.totalQueries > 0
      ? Math.round((stats.slowQueries / stats.totalQueries) * 10000) / 100
      : 0,
    timeoutRate: stats.totalQueries > 0
      ? Math.round((stats.timeoutQueries / stats.totalQueries) * 10000) / 100
      : 0,
    queriesByModel: stats.queriesByModel,
    queriesByAction: stats.queriesByAction,
    lastUpdated: stats.lastUpdated.toISOString(),
  };
}

/**
 * Query monitor configuration from environment variables
 */
export function getQueryMonitorConfigFromEnv(serviceName: string): QueryMonitorConfig {
  return {
    serviceName,
    queryTimeoutMs: parseInt(process.env.DB_QUERY_TIMEOUT_MS || '10000', 10),
    slowQueryThresholdMs: parseInt(process.env.DB_SLOW_QUERY_THRESHOLD_MS || '1000', 10),
    enableMetrics: process.env.DB_ENABLE_QUERY_METRICS !== 'false',
    enableLogging: process.env.DB_ENABLE_SLOW_QUERY_LOGGING !== 'false',
  };
}
