/**
 * Remote Health Status Component
 *
 * Displays the health status of all remote MFEs.
 * Useful for debugging and monitoring in admin panels.
 *
 * @security Part of Module Federation Security (Phase 6 Task 6.5)
 */

import { useRemoteHealth } from '../hooks/useRemoteHealth';

/**
 * Health status indicator color based on status
 */
function getStatusColor(healthy: boolean, circuitState: string): string {
  if (circuitState === 'OPEN') return 'bg-red-500';
  if (circuitState === 'HALF_OPEN') return 'bg-yellow-500';
  return healthy ? 'bg-green-500' : 'bg-red-500';
}

/**
 * Health status text based on status
 */
function getStatusText(healthy: boolean, circuitState: string): string {
  if (circuitState === 'OPEN') return 'Blocked';
  if (circuitState === 'HALF_OPEN') return 'Testing';
  return healthy ? 'Healthy' : 'Unhealthy';
}

/**
 * Props for RemoteHealthStatus component
 */
export interface RemoteHealthStatusProps {
  /** Whether to enable automatic polling (default: false) */
  enablePolling?: boolean;
  /** Polling interval in ms (default: 30000) */
  pollingInterval?: number;
  /** Whether to show detailed information (default: false) */
  detailed?: boolean;
  /** CSS class name for the container */
  className?: string;
}

/**
 * Remote Health Status Component
 *
 * @example
 * ```tsx
 * // Basic usage
 * <RemoteHealthStatus />
 *
 * // With polling
 * <RemoteHealthStatus enablePolling pollingInterval={10000} />
 *
 * // With detailed view
 * <RemoteHealthStatus detailed />
 * ```
 */
export function RemoteHealthStatus({
  enablePolling = false,
  pollingInterval = 30000,
  detailed = false,
  className = '',
}: RemoteHealthStatusProps) {
  const { status, isLoading, error, checkHealth, lastChecked } = useRemoteHealth({
    enablePolling,
    pollingInterval,
  });

  if (error) {
    return (
      <div className={`p-4 bg-red-50 dark:bg-red-900/20 rounded-lg ${className}`}>
        <p className="text-sm text-red-600 dark:text-red-400">
          Failed to check MFE health: {error.message}
        </p>
        <button
          onClick={checkHealth}
          className="mt-2 text-sm text-red-600 dark:text-red-400 underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isLoading && !status) {
    return (
      <div className={`p-4 bg-muted rounded-lg ${className}`}>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">
            Checking MFE health...
          </span>
        </div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <div className={`p-4 bg-card rounded-lg border ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground">MFE Health Status</h3>
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
          <button
            onClick={checkHealth}
            disabled={isLoading}
            className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
            aria-label="Refresh health status"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`h-2 w-2 rounded-full ${
            status.status === 'all_healthy'
              ? 'bg-green-500'
              : status.status === 'all_unhealthy'
                ? 'bg-red-500'
                : 'bg-yellow-500'
          }`}
        />
        <span className="text-sm text-muted-foreground">
          {status.healthyCount}/{status.totalCount} healthy
        </span>
      </div>

      {/* Individual statuses */}
      <div className="space-y-2">
        {Array.from(status.results.entries()).map(([name, result]) => (
          <div
            key={name}
            className="flex items-center justify-between py-1 border-b border-border last:border-0"
          >
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${getStatusColor(result.healthy, result.circuitState)}`}
              />
              <span className="text-sm text-foreground">{name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {getStatusText(result.healthy, result.circuitState)}
              </span>
              {detailed && (
                <span className="text-xs text-muted-foreground">
                  ({Math.round(result.duration)}ms)
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Detailed view */}
      {detailed && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="text-xs text-muted-foreground space-y-1">
            {lastChecked && (
              <p>Last checked: {new Date(lastChecked).toLocaleTimeString()}</p>
            )}
            {status.unhealthyRemotes.length > 0 && (
              <p className="text-yellow-600 dark:text-yellow-400">
                Unhealthy: {status.unhealthyRemotes.join(', ')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact health status badge for use in headers/navigation
 */
export function RemoteHealthBadge({
  enablePolling = true,
  pollingInterval = 60000,
}: {
  enablePolling?: boolean;
  pollingInterval?: number;
}) {
  const { status } = useRemoteHealth({
    enablePolling,
    pollingInterval,
  });

  if (!status) return null;

  const allHealthy = status.status === 'all_healthy';

  return (
    <div
      className="flex items-center gap-1.5"
      title={`${status.healthyCount}/${status.totalCount} MFEs healthy`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          allHealthy ? 'bg-green-500' : 'bg-yellow-500'
        }`}
      />
      <span className="text-xs text-muted-foreground sr-only">
        MFE Health: {allHealthy ? 'All healthy' : 'Some issues'}
      </span>
    </div>
  );
}
