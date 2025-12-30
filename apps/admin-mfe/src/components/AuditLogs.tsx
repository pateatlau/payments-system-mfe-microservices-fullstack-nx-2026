/**
 * Audit Logs Component
 *
 * Displays system audit logs with filtering and pagination
 */

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Label,
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
import type { AuditLog, AuditLogFilters } from '../api/audit-logs';
import { getAuditLogs, getAvailableActions } from '../api/audit-logs';

/**
 * Audit Logs Component
 */
export function AuditLogs() {
  // State
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [availableActions, setAvailableActions] = useState<string[]>([]);

  // Filters
  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    limit: 20,
    action: undefined,
    userId: undefined,
    startDate: undefined,
    endDate: undefined,
  });

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  /**
   * Load audit logs from API
   */
  const loadAuditLogs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getAuditLogs(filters);
      setLogs(result.data);
      setPagination(result.pagination);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load audit logs'
      );
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load available actions for filter dropdown
   */
  const loadAvailableActions = async () => {
    try {
      const actions = await getAvailableActions();
      setAvailableActions(actions);
    } catch (err) {
      console.error('Failed to load available actions:', err);
    }
  };

  /**
   * Load logs when filters change
   */
  useEffect(() => {
    loadAuditLogs();
  }, [filters]);

  /**
   * Load available actions on mount
   */
  useEffect(() => {
    loadAvailableActions();
  }, []);

  /**
   * Handle action filter change
   */
  const handleActionFilterChange = (action: string) => {
    setFilters(prev => ({
      ...prev,
      action: action === 'ALL' ? undefined : action,
      page: 1,
    }));
  };

  /**
   * Handle view details
   */
  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
  };

  /**
   * Get action badge variant
   */
  const getActionBadgeVariant = (
    action: string
  ): 'default' | 'secondary' | 'destructive' | 'success' | 'warning' => {
    if (action.includes('DELETE') || action.includes('FAILED')) {
      return 'destructive';
    }
    if (action.includes('CREATED') || action.includes('COMPLETED')) {
      return 'success';
    }
    if (action.includes('UPDATED') || action.includes('CHANGED')) {
      return 'warning';
    }
    if (action.includes('LOGIN') || action.includes('LOGOUT')) {
      return 'secondary';
    }
    return 'default';
  };

  /**
   * Format timestamp to relative time
   */
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Audit Logs</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Track system activity and user actions
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter audit logs by action type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="action-filter">Filter by Action</Label>
            <Select
              value={filters.action || 'ALL'}
              onValueChange={handleActionFilterChange}
            >
              <SelectTrigger id="action-filter">
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Actions</SelectItem>
                {availableActions.map(action => (
                  <SelectItem key={action} value={action}>
                    {action.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail ({pagination.total} logs)</CardTitle>
          <CardDescription>
            Page {pagination.page} of {pagination.totalPages || 1}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loading size="lg" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Resource
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-muted/50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">
                          {formatTimestamp(log.timestamp)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-foreground">
                          {log.userName || 'Unknown'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {log.userEmail}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {log.action.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-foreground">
                          {log.resourceType}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {log.resourceId}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">
                          {log.ipAddress || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(log)}
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl mx-4">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">
                Audit Log Details
              </h3>
            </div>

            {/* Content */}
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Action</Label>
                  <Badge
                    variant={getActionBadgeVariant(selectedLog.action)}
                    className="mt-1"
                  >
                    {selectedLog.action.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <div>
                  <Label>Timestamp</Label>
                  <p className="text-sm text-foreground mt-1">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label>User</Label>
                  <p className="text-sm text-foreground mt-1">
                    {selectedLog.userName || 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedLog.userEmail}
                  </p>
                </div>
                <div>
                  <Label>IP Address</Label>
                  <p className="text-sm text-foreground mt-1">
                    {selectedLog.ipAddress || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label>Resource Type</Label>
                  <p className="text-sm text-foreground mt-1">
                    {selectedLog.resourceType}
                  </p>
                </div>
                <div>
                  <Label>Resource ID</Label>
                  <p className="text-sm text-foreground mt-1 break-all">
                    {selectedLog.resourceId}
                  </p>
                </div>
              </div>

              {selectedLog.details && (
                <div>
                  <Label>Details</Label>
                  <pre className="mt-1 p-3 bg-muted border border-border rounded text-xs overflow-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.userAgent && (
                <div>
                  <Label>User Agent</Label>
                  <p className="text-xs text-muted-foreground mt-1 break-all">
                    {selectedLog.userAgent}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex justify-end">
              <Button onClick={() => setSelectedLog(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditLogs;
