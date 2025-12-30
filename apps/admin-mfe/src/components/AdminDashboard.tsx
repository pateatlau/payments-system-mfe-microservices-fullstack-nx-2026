/**
 * Admin Dashboard Component
 * Main admin interface - exposed via Module Federation
 *
 * Features:
 * - Tab-based navigation
 * - Real-time statistics
 * - Recent activity feed
 * - Quick actions
 * - Design system components
 */

import { useMemo } from 'react';
import { useAuthStore } from 'shared-auth-store';
import { Alert, AlertDescription } from '@mfe/shared-design-system';
import { DashboardTabs, useDashboardTabs } from './DashboardTabs';
import { DashboardStats } from './DashboardStats';
import { RecentActivity } from './RecentActivity';
import { QuickActions } from './QuickActions';
import { UserManagement } from './UserManagement';
import { AuditLogs } from './AuditLogs';
import { SystemHealth } from './SystemHealth';
import { useDashboardStats, useRecentActivity } from '../hooks/useDashboard';
import { useDashboardUpdates } from '../hooks/useDashboardUpdates';
import type { DashboardStat } from './DashboardStats';
import type { ActivityItem } from './RecentActivity';
import type { QuickAction } from './QuickActions';

/**
 * AdminDashboard Component
 * Main entry point for the admin interface
 */
/**
 * Map audit log action to activity type
 */
function mapActionToType(action: string): 'user' | 'payment' | 'system' {
  if (action.includes('USER_') || action.includes('user')) {
    return 'user';
  }
  if (action.includes('PAYMENT_') || action.includes('payment')) {
    return 'payment';
  }
  return 'system';
}

/**
 * Map audit log action to status
 */
function mapActionToStatus(action: string): 'success' | 'warning' | 'error' {
  if (action.includes('FAILED') || action.includes('ERROR')) {
    return 'error';
  }
  if (action.includes('CHANGED') || action.includes('UPDATED')) {
    return 'warning';
  }
  return 'success';
}

export function AdminDashboard() {
  const { user } = useAuthStore();
  const { activeTab, setActiveTab } = useDashboardTabs();

  // Real-time dashboard updates via WebSocket
  // Note: WebSocket activity is tracked but not displayed yet
  // Current implementation uses REST API audit logs (auditLogs) below
  useDashboardUpdates();

  // Fetch dashboard data using TanStack Query
  const {
    data: dashboardStats,
    isLoading: isLoadingStats,
    error: statsError,
  } = useDashboardStats();

  const {
    data: auditLogs,
    isLoading: isLoadingActivity,
    error: activityError,
  } = useRecentActivity(10);

  // Map dashboard stats to DashboardStat format
  const stats: DashboardStat[] = useMemo(() => {
    if (!dashboardStats) {
      return [
        {
          label: 'Total Users',
          value: 0,
          trend: { value: 0, isPositive: true },
        },
        {
          label: 'Active Payments',
          value: 0,
          trend: { value: 0, isPositive: true },
        },
        {
          label: 'Total Volume',
          value: '$0',
          trend: { value: 0, isPositive: false },
        },
        {
          label: 'System Health',
          value: '100%',
          trend: { value: 0, isPositive: true },
        },
      ];
    }

    // Format total volume as currency
    const formattedVolume = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(dashboardStats.totalVolume);

    return [
      {
        label: 'Total Users',
        value: dashboardStats.totalUsers,
        trend: { value: 0, isPositive: true }, // Trend calculation would require historical data
      },
      {
        label: 'Active Payments',
        value: dashboardStats.activePayments,
        trend: { value: 0, isPositive: true },
      },
      {
        label: 'Total Volume',
        value: formattedVolume,
        trend: { value: 0, isPositive: false },
      },
      {
        label: 'System Health',
        value: dashboardStats.systemHealth,
        trend: { value: 0, isPositive: true },
      },
    ];
  }, [dashboardStats]);

  // Map audit logs to ActivityItem format
  const activities: ActivityItem[] = useMemo(() => {
    if (!auditLogs) {
      return [];
    }

    return auditLogs.map(log => ({
      id: log.id,
      type: mapActionToType(log.action),
      action: log.action.replace(/_/g, ' ').toLowerCase(),
      user: log.userEmail || log.userName || undefined,
      timestamp: log.timestamp,
      status: mapActionToStatus(log.action),
    }));
  }, [auditLogs]);

  const isLoading = isLoadingStats || isLoadingActivity;

  const quickActions: QuickAction[] = [
    {
      id: 'users',
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: '👥',
      onClick: () => setActiveTab('users'),
    },
    {
      id: 'payments',
      title: 'Payment Reports',
      description: 'View and analyze payment data',
      icon: '💳',
      onClick: () => setActiveTab('payments'),
    },
    {
      id: 'audit',
      title: 'Audit Logs',
      description: 'Review system activity',
      icon: '📋',
      onClick: () => setActiveTab('audit'),
    },
    {
      id: 'system',
      title: 'System Health',
      description: 'Monitor system status',
      icon: '🔧',
      onClick: () => setActiveTab('system'),
    },
  ];

  return (
    <div className="w-full pb-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground">
            Welcome back, {user?.name || 'Admin'} · Role: {user?.role || 'N/A'}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8 bg-card rounded-lg shadow-sm">
          <div className="px-4">
            <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Error alerts */}
            {statsError && (
              <Alert variant="destructive">
                <AlertDescription>
                  Failed to load dashboard statistics. Please try refreshing the
                  page.
                </AlertDescription>
              </Alert>
            )}
            {activityError && (
              <Alert variant="destructive">
                <AlertDescription>
                  Failed to load recent activity. Please try refreshing the
                  page.
                </AlertDescription>
              </Alert>
            )}

            {/* Statistics */}
            <DashboardStats stats={stats} isLoading={isLoading} />

            {/* Quick Actions */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Quick Actions
              </h2>
              <QuickActions actions={quickActions} />
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RecentActivity activities={activities} isLoading={isLoading} />
              </div>
              <div className="space-y-4">
                {/* Additional info cards can go here */}
                <Alert variant="default">
                  <AlertDescription>
                    <strong>System Status:</strong> All services operational
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && <UserManagement />}

        {activeTab === 'payments' && (
          <Alert>
            <AlertDescription>
              💳 <strong>Payment Reports</strong> will be implemented in a
              future task
            </AlertDescription>
          </Alert>
        )}

        {activeTab === 'audit' && <AuditLogs />}

        {activeTab === 'system' && <SystemHealth />}
      </div>
    </div>
  );
}

export default AdminDashboard;
