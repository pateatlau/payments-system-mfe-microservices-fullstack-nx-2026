/**
 * Remote Health Check Utilities for Module Federation
 *
 * Provides health checking capabilities for MFE remotes before loading.
 * Integrates with the circuit breaker to prevent loading unhealthy remotes.
 *
 * Health Check Flow:
 * 1. Shell checks health endpoint before loading remote
 * 2. If healthy, proceed with remote loading
 * 3. If unhealthy, mark circuit as open and use fallback
 *
 * @security Health checks help identify compromised or unavailable remotes
 */

import { remoteCircuitBreaker, CircuitState } from './circuit-breaker';

/**
 * Health check response from a remote MFE
 */
export interface RemoteHealthResponse {
  /** Status of the remote (healthy, degraded, unhealthy) */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Name of the MFE */
  name: string;
  /** Version of the MFE (if available) */
  version?: string;
  /** Unix timestamp of when the health check was performed */
  timestamp: number;
  /** Optional message with additional details */
  message?: string;
  /** Exposed components (for verification) */
  components?: string[];
}

/**
 * Result of a health check
 */
export interface HealthCheckResult {
  /** Whether the remote is healthy and available */
  healthy: boolean;
  /** Health response if successful */
  response?: RemoteHealthResponse;
  /** Error message if health check failed */
  error?: string;
  /** HTTP status code (if applicable) */
  statusCode?: number;
  /** Time taken for the health check (ms) */
  duration: number;
  /** Circuit breaker state for this remote */
  circuitState: CircuitState;
}

/**
 * Configuration for health checks
 */
export interface HealthCheckConfig {
  /** Timeout for health check requests (default: 5000ms) */
  timeout?: number;
  /** Whether to update circuit breaker on health check result (default: true) */
  updateCircuitBreaker?: boolean;
  /** Treat degraded status as healthy (default: true) */
  acceptDegraded?: boolean;
  /** Custom fetch function (for testing) */
  fetchFn?: typeof fetch;
}

/**
 * MFE configuration for health checks
 */
export interface MfeConfig {
  /** Name of the remote (e.g., 'authMfe') */
  name: string;
  /** Base URL of the MFE (e.g., 'http://localhost:4201') */
  baseUrl: string;
  /** Health check endpoint path (default: '/health.json') */
  healthPath?: string;
}

/**
 * Default health check configuration
 */
const DEFAULT_CONFIG: Required<Omit<HealthCheckConfig, 'fetchFn'>> = {
  timeout: 5000,
  updateCircuitBreaker: true,
  acceptDegraded: true,
};

/**
 * Default MFE configurations based on environment
 *
 * Production: Uses NX_*_MFE_URL env vars (baked in at build time via DefinePlugin)
 * HTTPS mode: MFEs accessed via nginx proxy (local dev)
 * HTTP mode: Direct access to MFE dev servers (local dev)
 */
export function getDefaultMfeConfigs(isHttpsMode: boolean): MfeConfig[] {
  // Production: use env-var-based URLs if available
  const envVars: Record<string, string | undefined> = {
    NX_AUTH_MFE_URL: process.env['NX_AUTH_MFE_URL'],
    NX_PAYMENTS_MFE_URL: process.env['NX_PAYMENTS_MFE_URL'],
    NX_ADMIN_MFE_URL: process.env['NX_ADMIN_MFE_URL'],
    NX_PROFILE_MFE_URL: process.env['NX_PROFILE_MFE_URL'],
  };

  const presentKeys = Object.keys(envVars).filter(k => Boolean(envVars[k]));
  const missingKeys = Object.keys(envVars).filter(k => !envVars[k]);

  if (presentKeys.length > 0 && missingKeys.length > 0) {
    // Partial config — surface a clear error rather than silently using localhost
    const message = `[MFE Health] Incomplete MFE URL configuration. Missing env var(s): ${missingKeys.join(', ')}. All four NX_*_MFE_URL vars must be set together.`;
    if (process.env['NODE_ENV'] === 'production') {
      throw new Error(message);
    }
    // eslint-disable-next-line no-console
    console.error(message);
  }

  if (presentKeys.length === 4) {
    return [
      { name: 'authMfe', baseUrl: envVars['NX_AUTH_MFE_URL'] as string },
      {
        name: 'paymentsMfe',
        baseUrl: envVars['NX_PAYMENTS_MFE_URL'] as string,
      },
      { name: 'adminMfe', baseUrl: envVars['NX_ADMIN_MFE_URL'] as string },
      { name: 'profileMfe', baseUrl: envVars['NX_PROFILE_MFE_URL'] as string },
    ];
  }

  if (isHttpsMode) {
    // HTTPS mode: MFEs accessed via nginx proxy
    return [
      { name: 'authMfe', baseUrl: 'https://localhost/mfe/auth' },
      { name: 'paymentsMfe', baseUrl: 'https://localhost/mfe/payments' },
      { name: 'adminMfe', baseUrl: 'https://localhost/mfe/admin' },
      { name: 'profileMfe', baseUrl: 'https://localhost/mfe/profile' },
    ];
  }

  // HTTP mode: Direct access to MFE dev servers
  return [
    { name: 'authMfe', baseUrl: 'http://localhost:4201' },
    { name: 'paymentsMfe', baseUrl: 'http://localhost:4202' },
    { name: 'adminMfe', baseUrl: 'http://localhost:4203' },
    { name: 'profileMfe', baseUrl: 'http://localhost:4204' },
  ];
}

/**
 * Perform a health check on a single remote MFE
 *
 * @param mfe - MFE configuration
 * @param config - Health check configuration
 * @returns Health check result
 *
 * @example
 * ```typescript
 * const result = await checkRemoteHealth({
 *   name: 'authMfe',
 *   baseUrl: 'http://localhost:4201'
 * });
 *
 * if (result.healthy) {
 *   console.log('Auth MFE is healthy');
 * } else {
 *   console.warn('Auth MFE health check failed:', result.error);
 * }
 * ```
 */
export async function checkRemoteHealth(
  mfe: MfeConfig,
  config: HealthCheckConfig = {}
): Promise<HealthCheckResult> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const healthPath = mfe.healthPath || '/health.json';
  const healthUrl = `${mfe.baseUrl.replace(/\/+$/, '')}${healthPath}`;
  const fetchFn = config.fetchFn || fetch;

  const startTime = performance.now();
  let duration = 0;

  // Get current circuit state
  const circuitState = remoteCircuitBreaker.getState(mfe.name);

  // If circuit is open, skip the health check
  if (circuitState === 'OPEN') {
    return {
      healthy: false,
      error: 'Circuit breaker is open - remote temporarily blocked',
      duration: 0,
      circuitState,
    };
  }

  // Create abort controller for timeout - declared outside try for cleanup in finally
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), mergedConfig.timeout);

  try {
    const response = await fetchFn(healthUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
      // Prevent caching of health check responses
      cache: 'no-store',
    });

    duration = performance.now() - startTime;

    if (!response.ok) {
      const error = `HTTP ${response.status}: ${response.statusText}`;

      if (mergedConfig.updateCircuitBreaker) {
        remoteCircuitBreaker.recordFailure(mfe.name, new Error(error));
      }

      return {
        healthy: false,
        error,
        statusCode: response.status,
        duration,
        circuitState: remoteCircuitBreaker.getState(mfe.name),
      };
    }

    // Parse health response
    const healthResponse: RemoteHealthResponse = await response.json();

    // Validate response structure
    if (!isValidHealthResponse(healthResponse)) {
      const error = 'Invalid health response format';

      if (mergedConfig.updateCircuitBreaker) {
        remoteCircuitBreaker.recordFailure(mfe.name, new Error(error));
      }

      return {
        healthy: false,
        error,
        duration,
        circuitState: remoteCircuitBreaker.getState(mfe.name),
      };
    }

    // Check if remote is healthy
    const isHealthy =
      healthResponse.status === 'healthy' ||
      (mergedConfig.acceptDegraded && healthResponse.status === 'degraded');

    if (isHealthy) {
      if (mergedConfig.updateCircuitBreaker) {
        remoteCircuitBreaker.recordSuccess(mfe.name);
      }

      return {
        healthy: true,
        response: healthResponse,
        duration,
        circuitState: remoteCircuitBreaker.getState(mfe.name),
      };
    }

    // Remote reports unhealthy
    const error = healthResponse.message || 'Remote reported unhealthy status';

    if (mergedConfig.updateCircuitBreaker) {
      remoteCircuitBreaker.recordFailure(mfe.name, new Error(error));
    }

    return {
      healthy: false,
      response: healthResponse,
      error,
      duration,
      circuitState: remoteCircuitBreaker.getState(mfe.name),
    };
  } catch (err) {
    duration = performance.now() - startTime;
    const error = err instanceof Error ? err.message : 'Unknown error';
    const isTimeout = error.includes('abort') || error.includes('timeout');

    if (mergedConfig.updateCircuitBreaker) {
      remoteCircuitBreaker.recordFailure(
        mfe.name,
        new Error(
          isTimeout
            ? `Health check timeout after ${mergedConfig.timeout}ms`
            : error
        )
      );
    }

    return {
      healthy: false,
      error: isTimeout
        ? `Health check timeout after ${mergedConfig.timeout}ms`
        : error,
      duration,
      circuitState: remoteCircuitBreaker.getState(mfe.name),
    };
  } finally {
    // Always clear the timeout to prevent memory leaks
    clearTimeout(timeoutId);
  }
}

/**
 * Validate that a health response has the required structure
 */
function isValidHealthResponse(
  response: unknown
): response is RemoteHealthResponse {
  if (typeof response !== 'object' || response === null) return false;

  const r = response as Record<string, unknown>;

  return (
    typeof r['status'] === 'string' &&
    ['healthy', 'degraded', 'unhealthy'].includes(r['status']) &&
    typeof r['name'] === 'string' &&
    typeof r['timestamp'] === 'number'
  );
}

/**
 * Check health of multiple remotes in parallel
 *
 * @param mfes - Array of MFE configurations
 * @param config - Health check configuration
 * @returns Map of remote name to health check result
 *
 * @example
 * ```typescript
 * const results = await checkAllRemotesHealth([
 *   { name: 'authMfe', baseUrl: 'http://localhost:4201' },
 *   { name: 'paymentsMfe', baseUrl: 'http://localhost:4202' },
 * ]);
 *
 * for (const [name, result] of results) {
 *   console.log(`${name}: ${result.healthy ? 'healthy' : 'unhealthy'}`);
 * }
 * ```
 */
export async function checkAllRemotesHealth(
  mfes: MfeConfig[],
  config: HealthCheckConfig = {}
): Promise<Map<string, HealthCheckResult>> {
  const results = new Map<string, HealthCheckResult>();

  // Run health checks in parallel
  const checks = await Promise.all(
    mfes.map(async mfe => ({
      name: mfe.name,
      result: await checkRemoteHealth(mfe, config),
    }))
  );

  for (const check of checks) {
    results.set(check.name, check.result);
  }

  return results;
}

/**
 * Get aggregated health status of all remotes
 */
export interface AggregatedHealthStatus {
  /** Overall health status */
  status: 'all_healthy' | 'some_unhealthy' | 'all_unhealthy';
  /** Number of healthy remotes */
  healthyCount: number;
  /** Number of unhealthy remotes */
  unhealthyCount: number;
  /** Total number of remotes */
  totalCount: number;
  /** List of healthy remote names */
  healthyRemotes: string[];
  /** List of unhealthy remote names */
  unhealthyRemotes: string[];
  /** Timestamp of the health check */
  timestamp: number;
  /** Individual health check results */
  results: Map<string, HealthCheckResult>;
}

/**
 * Get aggregated health status of all remotes
 *
 * @param mfes - Array of MFE configurations
 * @param config - Health check configuration
 * @returns Aggregated health status
 */
export async function getAggregatedHealthStatus(
  mfes: MfeConfig[],
  config: HealthCheckConfig = {}
): Promise<AggregatedHealthStatus> {
  const results = await checkAllRemotesHealth(mfes, config);

  const healthyRemotes: string[] = [];
  const unhealthyRemotes: string[] = [];

  for (const [name, result] of results) {
    if (result.healthy) {
      healthyRemotes.push(name);
    } else {
      unhealthyRemotes.push(name);
    }
  }

  const healthyCount = healthyRemotes.length;
  const unhealthyCount = unhealthyRemotes.length;
  const totalCount = mfes.length;

  let status: AggregatedHealthStatus['status'];
  if (healthyCount === totalCount) {
    status = 'all_healthy';
  } else if (unhealthyCount === totalCount) {
    status = 'all_unhealthy';
  } else {
    status = 'some_unhealthy';
  }

  return {
    status,
    healthyCount,
    unhealthyCount,
    totalCount,
    healthyRemotes,
    unhealthyRemotes,
    timestamp: Date.now(),
    results,
  };
}

/**
 * Check if a specific remote is healthy (with caching)
 * Uses circuit breaker state to avoid unnecessary health checks
 */
export function isRemoteHealthy(remoteName: string): boolean {
  const state = remoteCircuitBreaker.getState(remoteName);
  return state !== 'OPEN';
}

/**
 * Pre-load health check for shell initialization
 * Checks all MFEs and logs results, but doesn't block loading
 *
 * @param isHttpsMode - Whether to use HTTPS mode URLs
 * @param config - Health check configuration
 * @returns Promise that resolves with aggregated status
 */
export async function preloadHealthCheck(
  isHttpsMode: boolean,
  config: HealthCheckConfig = {}
): Promise<AggregatedHealthStatus> {
  const mfes = getDefaultMfeConfigs(isHttpsMode);

  // Use shorter timeout for preload
  const preloadConfig: HealthCheckConfig = {
    timeout: 3000,
    ...config,
  };

  const status = await getAggregatedHealthStatus(mfes, preloadConfig);

  // Log health status
  if (status.status === 'all_healthy') {
    // eslint-disable-next-line no-console
    console.log(
      '[MFE Health] All remotes healthy:',
      status.healthyRemotes.join(', ')
    );
  } else if (status.status === 'all_unhealthy') {
    // eslint-disable-next-line no-console
    console.error(
      '[MFE Health] All remotes unhealthy:',
      status.unhealthyRemotes.join(', ')
    );
  } else {
    // eslint-disable-next-line no-console
    console.warn('[MFE Health] Some remotes unhealthy:');
    // eslint-disable-next-line no-console
    console.warn('  Healthy:', status.healthyRemotes.join(', ') || 'none');
    // eslint-disable-next-line no-console
    console.warn('  Unhealthy:', status.unhealthyRemotes.join(', '));
  }

  return status;
}
