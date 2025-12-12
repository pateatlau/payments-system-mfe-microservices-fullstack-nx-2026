/**
 * Audit Logs Component
 *
 * Displays system audit logs with filtering and pagination
 *
 * Note: Backend audit logging deferred to Event Hub integration.
 * Currently uses mock data to demonstrate UI/UX.
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
} from '@mfe/shared-design-system';
import type { AuditLog, AuditLogFilters } from '../api/audit-logs';
import { getAvailableActions } from '../api/audit-logs';

/**
 * Audit Logs Component
 */
export function AuditLogs() {
  // State
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

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
   * Load mock audit logs for demonstration
   * In production, this would call getAuditLogs() API
   */
  const loadAuditLogs = async () => {
    setIsLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock data for demonstration
    const mockLogs: AuditLog[] = [
      {
        id: '1',
        userId: 'user-123',
        userName: 'John Doe',
        userEmail: 'john@example.com',
        action: 'USER_LOGIN',
        resourceType: 'user',
        resourceId: 'user-123',
        details: { ipAddress: '192.168.1.100' },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      },
      {
        id: '2',
        userId: 'admin-456',
        userName: 'Admin User',
        userEmail: 'admin@example.com',
        action: 'USER_ROLE_CHANGED',
        resourceType: 'user',
        resourceId: 'user-789',
        details: { oldRole: 'CUSTOMER', newRole: 'VENDOR' },
        ipAddress: '192.168.1.50',
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      },
      {
        id: '3',
        userId: 'user-789',
        userName: 'Jane Smith',
        userEmail: 'jane@example.com',
        action: 'PAYMENT_CREATED',
        resourceType: 'payment',
        resourceId: 'payment-001',
        details: { amount: 100.0, currency: 'USD' },
        ipAddress: '192.168.1.120',
        timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
      },
      {
        id: '4',
        userId: 'admin-456',
        userName: 'Admin User',
        userEmail: 'admin@example.com',
        action: 'USER_DELETED',
        resourceType: 'user',
        resourceId: 'user-deleted',
        details: { reason: 'Account closure request' },
        ipAddress: '192.168.1.50',
        timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
      },
      {
        id: '5',
        userId: 'system',
        userName: 'System',
        userEmail: 'system@internal',
        action: 'SYSTEM_CONFIG_CHANGED',
        resourceType: 'config',
        resourceId: 'config-main',
        details: { setting: 'max_login_attempts', value: 5 },
        ipAddress: 'internal',
        timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
      },
    ];

    // Apply filters (mock implementation)
    let filteredLogs = [...mockLogs];

    if (filters.action && filters.action !== 'ALL') {
      filteredLogs = filteredLogs.filter(log => log.action === filters.action);
    }

    setLogs(filteredLogs);
    setPagination({
      page: 1,
      limit: 20,
      total: filteredLogs.length,
      totalPages: Math.ceil(filteredLogs.length / 20),
    });

    setIsLoading(false);
  };

  /**
   * Load logs when filters change
   */
  useEffect(() => {
    loadAuditLogs();
  }, [filters]);

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
        <h2 className="text-2xl font-bold text-slate-900">Audit Logs</h2>
        <p className="text-sm text-slate-600 mt-1">
          Track system activity and user actions
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertDescription>
          📝 <strong>Note:</strong> Backend audit logging is currently deferred
          to Event Hub integration (Phase 3). This UI demonstrates the intended
          functionality with mock data. Real audit logs will be available when
          the backend implementation is complete.
        </AlertDescription>
      </Alert>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter audit logs by action type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="action-filter">Filter by Action</Label>
            <select
              id="action-filter"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.action || 'ALL'}
              onChange={e => handleActionFilterChange(e.target.value)}
            >
              <option value="ALL">All Actions</option>
              {getAvailableActions().map(action => (
                <option key={action} value={action}>
                  {action.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
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
              <p className="text-slate-500">No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Resource
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">
                          {formatTimestamp(log.timestamp)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-slate-900">
                          {log.userName || 'Unknown'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {log.userEmail}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {log.action.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-slate-900">
                          {log.resourceType}
                        </div>
                        <div className="text-xs text-slate-500 truncate max-w-[150px]">
                          {log.resourceId}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600">
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
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
                  <p className="text-sm text-slate-900 mt-1">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label>User</Label>
                  <p className="text-sm text-slate-900 mt-1">
                    {selectedLog.userName || 'Unknown'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {selectedLog.userEmail}
                  </p>
                </div>
                <div>
                  <Label>IP Address</Label>
                  <p className="text-sm text-slate-900 mt-1">
                    {selectedLog.ipAddress || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label>Resource Type</Label>
                  <p className="text-sm text-slate-900 mt-1">
                    {selectedLog.resourceType}
                  </p>
                </div>
                <div>
                  <Label>Resource ID</Label>
                  <p className="text-sm text-slate-900 mt-1 break-all">
                    {selectedLog.resourceId}
                  </p>
                </div>
              </div>

              {selectedLog.details && (
                <div>
                  <Label>Details</Label>
                  <pre className="mt-1 p-3 bg-slate-50 border border-slate-200 rounded text-xs overflow-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.userAgent && (
                <div>
                  <Label>User Agent</Label>
                  <p className="text-xs text-slate-600 mt-1 break-all">
                    {selectedLog.userAgent}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
              <Button onClick={() => setSelectedLog(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditLogs;
