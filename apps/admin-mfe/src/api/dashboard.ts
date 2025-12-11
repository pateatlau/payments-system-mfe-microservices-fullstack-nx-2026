/**
 * Dashboard API
 *
 * API functions for admin dashboard statistics and analytics
 */

import { ApiClient } from '@mfe/shared-api-client';
import { useAuthStore } from 'shared-auth-store';
import { getUsers } from './users';
import { getAuditLogs } from './audit-logs';

/**
 * Payment reports response type
 */
interface PaymentReports {
  totalPayments: number;
  totalAmount: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  period: {
    start: string;
    end: string;
  };
}

// Access environment variable (replaced by DefinePlugin at build time)
const envBaseURL =
  typeof process !== 'undefined' && process.env
    ? (process.env as { NX_API_BASE_URL?: string }).NX_API_BASE_URL
    : undefined;

/**
 * Payments API client for admin dashboard (via API Gateway - POC-3)
 *
 * Development: Direct to API Gateway (http://localhost:3000/api)
 * Production: Through nginx proxy (https://localhost/api)
 */
const paymentsApiClient = new ApiClient({
  // Use API Gateway URL (without service suffix - added in API calls)
  // Development: http://localhost:3000/api
  // Production: https://localhost/api
  baseURL: envBaseURL || 'http://localhost:3000/api',
  timeout: 30000,
  tokenProvider: {
    getAccessToken: () => useAuthStore.getState().accessToken ?? null,
    getRefreshToken: () => useAuthStore.getState().refreshToken ?? null,
    setTokens: (accessToken: string, refreshToken: string) => {
      useAuthStore.getState().setAccessToken(accessToken, refreshToken);
    },
    clearTokens: () => {
      useAuthStore.getState().logout();
    },
  },
  onUnauthorized: () => {
    useAuthStore.getState().logout();
  },
});

/**
 * Dashboard statistics response
 */
export interface DashboardStats {
  totalUsers: number;
  activePayments: number;
  totalVolume: number;
  systemHealth: string;
}

/**
 * Get dashboard statistics
 * Combines data from multiple sources: users, payments, system health
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  // Fetch users count
  const usersResponse = await getUsers({ page: 1, limit: 1 });
  const totalUsers = usersResponse.pagination.total;

  // Fetch payment reports for statistics
  let activePayments = 0;
  let totalVolume = 0;

  try {
    const paymentReportsResponse =
      await paymentsApiClient.get<PaymentReports>('/payments/reports');
    const paymentReports = paymentReportsResponse.data;

    // Calculate active payments (pending + initiated + processing)
    activePayments =
      (paymentReports.byStatus.pending || 0) +
      (paymentReports.byStatus.initiated || 0) +
      (paymentReports.byStatus.processing || 0);

    totalVolume = paymentReports.totalAmount;
  } catch (error) {
    // If payments API fails, set defaults
    activePayments = 0;
    totalVolume = 0;
  }

  // Fetch system health
  let systemHealth = '100%';
  try {
    const { getSystemHealth } = await import('./system-health');
    const healthResponse = await getSystemHealth();
    if (healthResponse.status === 'healthy') {
      // Calculate health percentage based on services
      const services = healthResponse.services;
      const serviceCount = Object.keys(services).length;
      const healthyCount = Object.values(services).filter(
        s => s === 'healthy'
      ).length;
      systemHealth = `${Math.round((healthyCount / serviceCount) * 100)}%`;
    } else {
      systemHealth = '0%';
    }
  } catch (error) {
    systemHealth = 'Unknown';
  }

  return {
    totalUsers,
    activePayments,
    totalVolume,
    systemHealth,
  };
}

/**
 * Get recent activity from audit logs
 * Returns empty array if audit logs are not available
 */
export async function getRecentActivity(limit = 10) {
  try {
    const auditLogsResponse = await getAuditLogs({
      page: 1,
      limit,
    });

    return auditLogsResponse.data;
  } catch (error) {
    // Audit logs endpoint may not be implemented yet
    // Return empty array to allow dashboard to still function
    return [];
  }
}
