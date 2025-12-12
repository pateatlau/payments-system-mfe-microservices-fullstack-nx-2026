/**
 * Prometheus Metrics Collection
 *
 * Provides centralized Prometheus metrics for all backend services.
 * Supports HTTP request metrics, business metrics, and Node.js runtime metrics.
 */

import {
  Registry,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from 'prom-client';

/**
 * Create a new metrics registry for a service
 * Each service should have its own registry to avoid metric name conflicts
 */
export function createMetricsRegistry(): Registry {
  const registry = new Registry();

  // Collect default Node.js metrics (CPU, memory, event loop, etc.)
  collectDefaultMetrics({
    register: registry,
    prefix: 'nodejs_',
  });

  return registry;
}

/**
 * HTTP Metrics
 * Track HTTP request count and duration
 */
export function createHttpMetrics(registry: Registry) {
  // HTTP request counter
  const httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'path', 'status'],
    registers: [registry],
  });

  // HTTP request duration histogram
  const httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'path', 'status'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
    registers: [registry],
  });

  // Active connections gauge
  const httpActiveConnections = new Gauge({
    name: 'http_active_connections',
    help: 'Number of active HTTP connections',
    registers: [registry],
  });

  // Error rate counter
  const httpErrorsTotal = new Counter({
    name: 'http_errors_total',
    help: 'Total number of HTTP errors (4xx, 5xx)',
    labelNames: ['method', 'path', 'status'],
    registers: [registry],
  });

  return {
    httpRequestsTotal,
    httpRequestDuration,
    httpActiveConnections,
    httpErrorsTotal,
  };
}

/**
 * Database Metrics
 * Track database query performance
 */
export function createDatabaseMetrics(registry: Registry) {
  const dbQueryDuration = new Histogram({
    name: 'db_query_duration_seconds',
    help: 'Database query duration in seconds',
    labelNames: ['operation', 'table'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2],
    registers: [registry],
  });

  const dbQueryErrorsTotal = new Counter({
    name: 'db_query_errors_total',
    help: 'Total number of database query errors',
    labelNames: ['operation', 'table'],
    registers: [registry],
  });

  return {
    dbQueryDuration,
    dbQueryErrorsTotal,
  };
}

/**
 * Cache Metrics
 * Track cache hit/miss rates
 */
export function createCacheMetrics(registry: Registry) {
  const cacheHitsTotal = new Counter({
    name: 'cache_hits_total',
    help: 'Total number of cache hits',
    labelNames: ['cache_type'],
    registers: [registry],
  });

  const cacheMissesTotal = new Counter({
    name: 'cache_misses_total',
    help: 'Total number of cache misses',
    labelNames: ['cache_type'],
    registers: [registry],
  });

  const cacheOperationsDuration = new Histogram({
    name: 'cache_operations_duration_seconds',
    help: 'Cache operation duration in seconds',
    labelNames: ['operation', 'cache_type'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1],
    registers: [registry],
  });

  return {
    cacheHitsTotal,
    cacheMissesTotal,
    cacheOperationsDuration,
  };
}

/**
 * Business Metrics
 * Service-specific business metrics
 */
export function createBusinessMetrics(registry: Registry) {
  // Payments metrics
  const paymentsCreatedTotal = new Counter({
    name: 'payments_created_total',
    help: 'Total number of payments created',
    labelNames: ['type', 'status'],
    registers: [registry],
  });

  const paymentsAmountTotal = new Counter({
    name: 'payments_amount_total',
    help: 'Total payment amount',
    labelNames: ['currency'],
    registers: [registry],
  });

  // Auth metrics
  const authLoginTotal = new Counter({
    name: 'auth_login_total',
    help: 'Total number of login attempts',
    labelNames: ['status'],
    registers: [registry],
  });

  const authRegisterTotal = new Counter({
    name: 'auth_register_total',
    help: 'Total number of registrations',
    labelNames: ['status'],
    registers: [registry],
  });

  return {
    paymentsCreatedTotal,
    paymentsAmountTotal,
    authLoginTotal,
    authRegisterTotal,
  };
}

/**
 * Initialize all metrics for a service
 *
 * @param _serviceName - Name of the service (reserved for future metric labels)
 * @returns Object containing registry and all metric collections
 */
export function initPrometheusMetrics(_serviceName: string) {
  const registry = createMetricsRegistry();
  const httpMetrics = createHttpMetrics(registry);
  const dbMetrics = createDatabaseMetrics(registry);
  const cacheMetrics = createCacheMetrics(registry);
  const businessMetrics = createBusinessMetrics(registry);

  return {
    registry,
    http: httpMetrics,
    db: dbMetrics,
    cache: cacheMetrics,
    business: businessMetrics,
  };
}
