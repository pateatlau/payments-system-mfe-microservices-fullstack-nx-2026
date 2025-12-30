/**
 * System Health Component
 *
 * Displays real-time system health status with auto-refresh
 */

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Alert,
  AlertDescription,
  Loading,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@mfe/shared-design-system';
import {
  getSystemHealth,
  getServiceDisplayName,
  getStatusBadgeVariant,
  getStatusIcon,
  type SystemHealthData,
  type ServiceStatus,
} from '../api/system-health';

/**
 * System Health Component
 */
export function SystemHealth() {
  // State
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  /**
   * Load system health data
   */
  const loadHealthData = async () => {
    try {
      setError(null);
      const data = await getSystemHealth();
      setHealthData(data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('[SystemHealth] Failed to load health data:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load health data'
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load health data on mount
   */
  useEffect(() => {
    loadHealthData();
  }, []);

  /**
   * Auto-refresh health data
   */
  useEffect(() => {
    if (!autoRefresh) return;

    const timer = setInterval(() => {
      loadHealthData();
    }, refreshInterval * 1000);

    return () => clearInterval(timer);
  }, [autoRefresh, refreshInterval]);

  /**
   * Handle manual refresh
   */
  const handleRefresh = () => {
    setIsLoading(true);
    loadHealthData();
  };

  /**
   * Format uptime
   */
  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  /**
   * Get overall status badge
   */
  const getOverallStatusBadge = () => {
    if (!healthData) return null;

    const variant =
      healthData.status === 'healthy'
        ? 'success'
        : healthData.status === 'degraded'
          ? 'warning'
          : 'destructive';

    const icon =
      healthData.status === 'healthy'
        ? '✅'
        : healthData.status === 'degraded'
          ? '⚠️'
          : '❌';

    return (
      <Badge variant={variant} className="text-lg px-4 py-2">
        {icon} {healthData.status.toUpperCase()}
      </Badge>
    );
  };

  /**
   * Get service entries
   */
  const getServiceEntries = () => {
    if (!healthData) return [];

    return Object.entries(healthData.services).map(([key, status]) => ({
      key,
      name: getServiceDisplayName(key),
      status: status as ServiceStatus,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">System Health</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time monitoring of system services
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Auto-refresh toggle */}
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              className="rounded border-border"
            />
            Auto-refresh ({refreshInterval}s)
          </label>

          {/* Manual refresh button */}
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? 'Refreshing...' : '🔄 Refresh'}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Overall Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Overall System Status</CardTitle>
          <CardDescription>
            Last checked: {lastRefresh.toLocaleTimeString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !healthData ? (
            <div className="flex items-center justify-center py-8">
              <Loading size="lg" />
            </div>
          ) : healthData ? (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center justify-center py-4">
                {getOverallStatusBadge()}
              </div>

              {/* System Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Version</div>
                  <div className="text-lg font-semibold text-foreground">
                    {healthData.version}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Timestamp</div>
                  <div className="text-lg font-semibold text-foreground">
                    {new Date(healthData.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                {healthData.uptime && (
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Uptime</div>
                    <div className="text-lg font-semibold text-foreground">
                      {formatUptime(healthData.uptime)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Services Status */}
      <Card>
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
          <CardDescription>
            Status of all system services and dependencies
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !healthData ? (
            <div className="flex items-center justify-center py-8">
              <Loading size="lg" />
            </div>
          ) : healthData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getServiceEntries().map(service => (
                <div
                  key={service.key}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {getStatusIcon(service.status)}
                    </span>
                    <div>
                      <div className="font-medium text-foreground">
                        {service.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {service.key}
                      </div>
                    </div>
                  </div>
                  <Badge variant={getStatusBadgeVariant(service.status)}>
                    {service.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Refresh Interval Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Auto-Refresh Settings</CardTitle>
          <CardDescription>
            Configure automatic health check interval
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-foreground">
              Refresh Interval:
            </label>
            <Select
              value={String(refreshInterval)}
              onValueChange={value => setRefreshInterval(Number(value))}
              disabled={!autoRefresh}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 seconds</SelectItem>
                <SelectItem value="30">30 seconds</SelectItem>
                <SelectItem value="60">1 minute</SelectItem>
                <SelectItem value="300">5 minutes</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              {autoRefresh ? 'Active' : 'Paused'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SystemHealth;
