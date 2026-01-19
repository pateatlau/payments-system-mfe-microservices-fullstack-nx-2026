/**
 * Circuit Breaker Prometheus Metrics
 *
 * Provides Prometheus metrics for circuit breaker monitoring.
 *
 * Phase 5.1 - Service Resilience
 */

import { Registry, Counter, Gauge, Histogram } from 'prom-client';
import {
  getAllCircuitBreakers,
  getCircuitState,
  CircuitState,
  getAllCircuitStats,
} from './circuit-breaker';

/**
 * Circuit breaker metrics collection
 */
export interface CircuitBreakerMetrics {
  /** Circuit state gauge (0=closed, 1=half-open, 2=open) */
  circuitState: Gauge;
  /** Total requests counter */
  requestsTotal: Counter;
  /** Successful requests counter */
  successesTotal: Counter;
  /** Failed requests counter */
  failuresTotal: Counter;
  /** Timed out requests counter */
  timeoutsTotal: Counter;
  /** Rejected requests counter (circuit open) */
  rejectsTotal: Counter;
  /** Fallback executions counter */
  fallbacksTotal: Counter;
  /** Request duration histogram */
  requestDuration: Histogram;
}

/**
 * State to numeric value mapping
 */
const STATE_VALUES: Record<CircuitState, number> = {
  [CircuitState.CLOSED]: 0,
  [CircuitState.HALF_OPEN]: 1,
  [CircuitState.OPEN]: 2,
};

/**
 * Create circuit breaker metrics for Prometheus
 *
 * @param registry - Prometheus registry to register metrics to
 * @param prefix - Metric name prefix (default: 'circuit_breaker')
 * @returns Circuit breaker metrics collection
 */
export function createCircuitBreakerMetrics(
  registry: Registry,
  prefix = 'circuit_breaker'
): CircuitBreakerMetrics {
  // Circuit state gauge (0=closed, 1=half-open, 2=open)
  const circuitState = new Gauge({
    name: `${prefix}_state`,
    help: 'Circuit breaker state (0=closed, 1=half-open, 2=open)',
    labelNames: ['circuit', 'service'],
    registers: [registry],
  });

  // Total requests counter
  const requestsTotal = new Counter({
    name: `${prefix}_requests_total`,
    help: 'Total number of requests through circuit breaker',
    labelNames: ['circuit', 'service'],
    registers: [registry],
  });

  // Successful requests counter
  const successesTotal = new Counter({
    name: `${prefix}_successes_total`,
    help: 'Total number of successful requests',
    labelNames: ['circuit', 'service'],
    registers: [registry],
  });

  // Failed requests counter
  const failuresTotal = new Counter({
    name: `${prefix}_failures_total`,
    help: 'Total number of failed requests',
    labelNames: ['circuit', 'service'],
    registers: [registry],
  });

  // Timed out requests counter
  const timeoutsTotal = new Counter({
    name: `${prefix}_timeouts_total`,
    help: 'Total number of timed out requests',
    labelNames: ['circuit', 'service'],
    registers: [registry],
  });

  // Rejected requests counter
  const rejectsTotal = new Counter({
    name: `${prefix}_rejects_total`,
    help: 'Total number of rejected requests (circuit open)',
    labelNames: ['circuit', 'service'],
    registers: [registry],
  });

  // Fallback executions counter
  const fallbacksTotal = new Counter({
    name: `${prefix}_fallbacks_total`,
    help: 'Total number of fallback executions',
    labelNames: ['circuit', 'service'],
    registers: [registry],
  });

  // Request duration histogram
  const requestDuration = new Histogram({
    name: `${prefix}_request_duration_seconds`,
    help: 'Request duration through circuit breaker in seconds',
    labelNames: ['circuit', 'service'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [registry],
  });

  return {
    circuitState,
    requestsTotal,
    successesTotal,
    failuresTotal,
    timeoutsTotal,
    rejectsTotal,
    fallbacksTotal,
    requestDuration,
  };
}

/**
 * Extract service name from circuit name
 * Circuit names are formatted as: "http-serviceName" or "serviceName:dependencyType:id"
 */
function extractServiceName(circuitName: string): string {
  if (circuitName.startsWith('http-')) {
    return circuitName.replace('http-', '');
  }
  const parts = circuitName.split(':');
  return parts[0] || circuitName;
}

/**
 * Create metric callbacks for a circuit breaker
 *
 * @param metrics - Circuit breaker metrics
 * @param circuitName - Name of the circuit breaker
 * @returns Callback functions to be used in circuit breaker config
 */
export function createMetricCallbacks(
  metrics: CircuitBreakerMetrics,
  circuitName: string
): {
  onSuccess: (name: string, durationMs: number) => void;
  onFailure: (name: string, error: Error) => void;
  onTimeout: (name: string) => void;
  onReject: (name: string) => void;
  onOpen: (name: string) => void;
  onClose: (name: string) => void;
  onHalfOpen: (name: string) => void;
} {
  const serviceName = extractServiceName(circuitName);
  const labels = { circuit: circuitName, service: serviceName };

  return {
    onSuccess: (_name: string, durationMs: number) => {
      metrics.requestsTotal.inc(labels);
      metrics.successesTotal.inc(labels);
      metrics.requestDuration.observe(labels, durationMs / 1000);
    },
    onFailure: (_name: string, _error: Error) => {
      metrics.requestsTotal.inc(labels);
      metrics.failuresTotal.inc(labels);
    },
    onTimeout: (_name: string) => {
      metrics.requestsTotal.inc(labels);
      metrics.timeoutsTotal.inc(labels);
    },
    onReject: (_name: string) => {
      metrics.requestsTotal.inc(labels);
      metrics.rejectsTotal.inc(labels);
    },
    onOpen: (_name: string) => {
      metrics.circuitState.set(labels, STATE_VALUES[CircuitState.OPEN]);
    },
    onClose: (_name: string) => {
      metrics.circuitState.set(labels, STATE_VALUES[CircuitState.CLOSED]);
    },
    onHalfOpen: (_name: string) => {
      metrics.circuitState.set(labels, STATE_VALUES[CircuitState.HALF_OPEN]);
    },
  };
}

/**
 * Update all circuit metrics from current state
 * Call this periodically (e.g., every 15 seconds) to sync metrics
 */
export function updateCircuitMetrics(metrics: CircuitBreakerMetrics): void {
  const allBreakers = getAllCircuitBreakers();

  for (const [name] of allBreakers) {
    const state = getCircuitState(name);
    if (state !== undefined) {
      const serviceName = extractServiceName(name);
      const labels = { circuit: name, service: serviceName };
      metrics.circuitState.set(labels, STATE_VALUES[state]);
    }
  }
}

/**
 * Get circuit breaker stats in Prometheus-compatible format
 */
export function getCircuitMetricsSnapshot(): Record<string, unknown>[] {
  const stats = getAllCircuitStats();
  const snapshots: Record<string, unknown>[] = [];

  for (const stat of stats) {
    const serviceName = extractServiceName(stat.name);
    const total = stat.successes + stat.failures + stat.timeouts;
    const successRate = total > 0 ? (stat.successes / total) * 100 : 100;

    snapshots.push({
      circuit: stat.name,
      service: serviceName,
      state: stat.state,
      stateValue: STATE_VALUES[stat.state],
      successRate: Math.round(successRate * 100) / 100,
      successes: stat.successes,
      failures: stat.failures,
      timeouts: stat.timeouts,
      rejects: stat.rejects,
      fallbacks: stat.fallbacks,
      latencyMean: Math.round(stat.latencyMean),
      latencyP95: Math.round(stat.latencyP95),
      latencyP99: Math.round(stat.latencyP99),
      totalRequests: stat.fires,
      lastStateChange: stat.lastStateChange.toISOString(),
    });
  }

  return snapshots;
}

/**
 * Initialize circuit metrics collector that updates periodically
 *
 * @param metrics - Circuit breaker metrics
 * @param intervalMs - Update interval in milliseconds (default: 15000)
 * @returns Cleanup function to stop the collector
 */
export function initCircuitMetricsCollector(
  metrics: CircuitBreakerMetrics,
  intervalMs = 15000
): () => void {
  // Initial update
  updateCircuitMetrics(metrics);

  // Periodic update
  const interval = setInterval(() => {
    updateCircuitMetrics(metrics);
  }, intervalMs);

  // Return cleanup function
  return () => {
    clearInterval(interval);
  };
}

/**
 * Create a middleware to expose circuit metrics endpoint
 * This is an Express middleware that returns circuit stats as JSON
 */
export function createCircuitMetricsMiddleware() {
  return (_req: unknown, res: { json: (data: unknown) => void }) => {
    const snapshot = getCircuitMetricsSnapshot();
    res.json({
      circuits: snapshot,
      timestamp: new Date().toISOString(),
    });
  };
}
