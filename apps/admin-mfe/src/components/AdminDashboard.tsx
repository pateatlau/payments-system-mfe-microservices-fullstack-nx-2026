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

import { useState, useEffect } from 'react';
import { useAuthStore } from 'shared-auth-store';
import { Alert, AlertDescription } from '@mfe/shared-design-system';
import { DashboardTabs, useDashboardTabs } from './DashboardTabs';
import { DashboardStats } from './DashboardStats';
import { RecentActivity } from './RecentActivity';
import { QuickActions } from './QuickActions';
import { UserManagement } from './UserManagement';
import { AuditLogs } from './AuditLogs';
import { SystemHealth } from './SystemHealth';
import type { DashboardStat } from './DashboardStats';
import type { ActivityItem } from './RecentActivity';
import type { QuickAction } from './QuickActions';

/**
 * AdminDashboard Component
 * Main entry point for the admin interface
 */
export function AdminDashboard() {
  const { user } = useAuthStore();
  const { activeTab, setActiveTab } = useDashboardTabs();
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for demonstration - will be replaced with real API calls
  const [stats, setStats] = useState<DashboardStat[]>([
    { label: 'Total Users', value: 0, trend: { value: 0, isPositive: true } },
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
  ]);

  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      // Mock data - in real implementation, this would come from API
      setStats([
        {
          label: 'Total Users',
          value: 1247,
          trend: { value: 12.5, isPositive: true },
        },
        {
          label: 'Active Payments',
          value: 89,
          trend: { value: 8.2, isPositive: true },
        },
        {
          label: 'Total Volume',
          value: '$45,231',
          trend: { value: 3.1, isPositive: false },
        },
        {
          label: 'System Health',
          value: '98.5%',
          trend: { value: 0.5, isPositive: true },
        },
      ]);

      setActivities([
        {
          id: '1',
          type: 'user',
          action: 'New user registered',
          user: 'john.doe@example.com',
          timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
          status: 'success',
        },
        {
          id: '2',
          type: 'payment',
          action: 'Payment completed',
          user: 'alice.smith@example.com',
          timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
          status: 'success',
        },
        {
          id: '3',
          type: 'system',
          action: 'Database backup completed',
          timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
          status: 'success',
        },
        {
          id: '4',
          type: 'user',
          action: 'User role changed to ADMIN',
          user: 'bob.jones@example.com',
          timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
          status: 'warning',
        },
        {
          id: '5',
          type: 'payment',
          action: 'Payment failed',
          user: 'charlie.brown@example.com',
          timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
          status: 'error',
        },
      ]);

      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="mt-2 text-slate-600">
            Welcome back, {user?.name || 'Admin'} · Role: {user?.role || 'N/A'}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8 bg-white rounded-lg shadow-sm">
          <div className="px-4">
            <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Alert for demo purposes */}
            <Alert>
              <AlertDescription>
                📊 <strong>Demo Data:</strong> This dashboard is using mock data
                for demonstration. Real API integration will be added in the
                following tasks.
              </AlertDescription>
            </Alert>

            {/* Statistics */}
            <DashboardStats stats={stats} isLoading={isLoading} />

            {/* Quick Actions */}
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
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
