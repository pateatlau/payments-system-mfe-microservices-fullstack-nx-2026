/**
 * Hook for monitoring remote MFE health status
 *
 * Provides real-time health monitoring of remote MFEs with automatic polling.
 * Integrates with circuit breaker to track remote availability.
 *
 * @security Part of Module Federation Security (Phase 6 Task 6.5)
 */

import { useState, useEffect, useCallback } from 'react';
import {
  checkAllRemotesHealth,
  getDefaultMfeConfigs,
  HealthCheckResult,
  AggregatedHealthStatus,
  getAggregatedHealthStatus,
  MfeConfig,
} from '@mfe/shared-utils';

/**
 * Configuration for the useRemoteHealth hook
 */
export interface UseRemoteHealthConfig {
  /** Whether to enable automatic polling (default: false) */
  enablePolling?: boolean;
  /** Polling interval in ms (default: 30000 - 30 seconds) */
  pollingInterval?: number;
  /** Whether to check health on mount (default: true) */
  checkOnMount?: boolean;
  /** Custom MFE configurations (default: auto-detected based on protocol) */
  mfeConfigs?: MfeConfig[];
  /** Timeout for health checks in ms (default: 5000) */
  timeout?: number;
}

/**
 * Return type for useRemoteHealth hook
 */
export interface UseRemoteHealthReturn {
  /** Current health status of all remotes */
  status: AggregatedHealthStatus | null;
  /** Whether a health check is currently in progress */
  isLoading: boolean;
  /** Error if the last health check failed */
  error: Error | null;
  /** Trigger a manual health check */
  checkHealth: () => Promise<void>;
  /** Get health result for a specific remote */
  getRemoteHealth: (remoteName: string) => HealthCheckResult | undefined;
  /** Timestamp of last health check */
  lastChecked: number | null;
}

/**
 * Hook for monitoring remote MFE health status
 *
 * @param config - Configuration options
 * @returns Health status and utility functions
 *
 * @example
 * ```tsx
 * function RemoteHealthMonitor() {
 *   const {
 *     status,
 *     isLoading,
 *     checkHealth,
 *     getRemoteHealth,
 *   } = useRemoteHealth({ enablePolling: true });
 *
 *   if (isLoading) return <div>Checking health...</div>;
 *
 *   return (
 *     <div>
 *       <h2>MFE Health Status</h2>
 *       <p>Status: {status?.status}</p>
 *       <p>Healthy: {status?.healthyCount}/{status?.totalCount}</p>
 *       <button onClick={checkHealth}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useRemoteHealth(
  config: UseRemoteHealthConfig = {}
): UseRemoteHealthReturn {
  const {
    enablePolling = false,
    pollingInterval = 30000,
    checkOnMount = true,
    mfeConfigs,
    timeout = 5000,
  } = config;

  const [status, setStatus] = useState<AggregatedHealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastChecked, setLastChecked] = useState<number | null>(null);

  // Determine MFE configs based on protocol or use provided configs
  const getMfeConfigs = useCallback((): MfeConfig[] => {
    if (mfeConfigs) return mfeConfigs;
    const isHttpsMode = typeof window !== 'undefined' && window.location.protocol === 'https:';
    return getDefaultMfeConfigs(isHttpsMode);
  }, [mfeConfigs]);

  // Perform health check
  const checkHealth = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const configs = getMfeConfigs();
      const aggregatedStatus = await getAggregatedHealthStatus(configs, { timeout });
      setStatus(aggregatedStatus);
      setLastChecked(Date.now());
    } catch (err) {
      const healthError = err instanceof Error ? err : new Error('Health check failed');
      setError(healthError);
      // eslint-disable-next-line no-console
      console.error('[useRemoteHealth] Health check failed:', healthError);
    } finally {
      setIsLoading(false);
    }
  }, [getMfeConfigs, timeout]);

  // Get health result for a specific remote
  const getRemoteHealth = useCallback(
    (remoteName: string): HealthCheckResult | undefined => {
      return status?.results.get(remoteName);
    },
    [status]
  );

  // Check health on mount
  useEffect(() => {
    if (checkOnMount) {
      checkHealth();
    }
  }, [checkOnMount, checkHealth]);

  // Set up polling if enabled
  useEffect(() => {
    if (!enablePolling) return;

    const intervalId = setInterval(checkHealth, pollingInterval);
    return () => clearInterval(intervalId);
  }, [enablePolling, pollingInterval, checkHealth]);

  return {
    status,
    isLoading,
    error,
    checkHealth,
    getRemoteHealth,
    lastChecked,
  };
}

/**
 * Hook for checking health of a single remote
 *
 * @param remoteName - Name of the remote to check
 * @param config - Configuration options
 * @returns Health status for the specific remote
 */
export function useSingleRemoteHealth(
  remoteName: string,
  config: Omit<UseRemoteHealthConfig, 'mfeConfigs'> = {}
): {
  health: HealthCheckResult | null;
  isLoading: boolean;
  error: Error | null;
  checkHealth: () => Promise<void>;
} {
  const [health, setHealth] = useState<HealthCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { timeout = 5000, checkOnMount = true, enablePolling = false, pollingInterval = 30000 } = config;

  // Get the MFE config for this specific remote
  const getMfeConfig = useCallback((): MfeConfig | undefined => {
    const isHttpsMode = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const configs = getDefaultMfeConfigs(isHttpsMode);
    return configs.find(c => c.name === remoteName);
  }, [remoteName]);

  // Perform health check for this remote
  const checkHealth = useCallback(async () => {
    const mfeConfig = getMfeConfig();
    if (!mfeConfig) {
      setError(new Error(`Unknown remote: ${remoteName}`));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await checkAllRemotesHealth([mfeConfig], { timeout });
      const result = results.get(remoteName);
      setHealth(result || null);
    } catch (err) {
      const healthError = err instanceof Error ? err : new Error('Health check failed');
      setError(healthError);
    } finally {
      setIsLoading(false);
    }
  }, [getMfeConfig, remoteName, timeout]);

  // Check health on mount
  useEffect(() => {
    if (checkOnMount) {
      checkHealth();
    }
  }, [checkOnMount, checkHealth]);

  // Set up polling if enabled
  useEffect(() => {
    if (!enablePolling) return;

    const intervalId = setInterval(checkHealth, pollingInterval);
    return () => clearInterval(intervalId);
  }, [enablePolling, pollingInterval, checkHealth]);

  return {
    health,
    isLoading,
    error,
    checkHealth,
  };
}
