/**
 * Dashboard Hooks
 *
 * TanStack Query hooks for admin dashboard data
 */

import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, getRecentActivity } from '../api/dashboard';
import type { AuditLog } from '../api/audit-logs';

/**
 * Query keys for dashboard data
 */
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  activity: (limit?: number) =>
    [...dashboardKeys.all, 'activity', limit] as const,
};

/**
 * Hook to fetch dashboard statistics
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: getDashboardStats,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}

/**
 * Hook to fetch recent activity
 */
export function useRecentActivity(limit = 10) {
  return useQuery<AuditLog[]>({
    queryKey: dashboardKeys.activity(limit),
    queryFn: () => getRecentActivity(limit),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}
