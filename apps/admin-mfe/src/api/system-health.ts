/**
 * System Health API
 *
 * API functions for monitoring system health (ADMIN only)
 */

import { adminApiClient } from './adminApiClient';

/**
 * Service health status
 */
export type ServiceStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

/**
 * Overall system status
 */
export type SystemStatus = 'healthy' | 'degraded' | 'unhealthy';

/**
 * Service health info
 */
export interface ServiceHealth {
  status: ServiceStatus;
  responseTime?: number;
  lastChecked?: string;
  error?: string;
}

/**
 * System health response
 */
export interface SystemHealthData {
  status: SystemStatus;
  timestamp: string;
  services: {
    database: ServiceStatus;
    redis: ServiceStatus;
    authService: ServiceStatus;
    paymentsService: ServiceStatus;
    adminService?: ServiceStatus;
    profileService?: ServiceStatus;
  };
  version: string;
  uptime?: number;
}

/**
 * Get system health status
 *
 * @returns Promise with system health data
 */
export async function getSystemHealth(): Promise<SystemHealthData> {
  const response = await adminApiClient.get<{ data: SystemHealthData }>(
    '/admin/health'
  );

  return response.data.data;
}

/**
 * Get service display name
 *
 * @param serviceName - Service key name
 * @returns Display name
 */
export function getServiceDisplayName(serviceName: string): string {
  const displayNames: Record<string, string> = {
    database: 'PostgreSQL Database',
    redis: 'Redis Cache',
    authService: 'Auth Service',
    paymentsService: 'Payments Service',
    adminService: 'Admin Service',
    profileService: 'Profile Service',
  };

  return displayNames[serviceName] || serviceName;
}

/**
 * Get status badge variant
 *
 * @param status - Service status
 * @returns Badge variant
 */
export function getStatusBadgeVariant(
  status: ServiceStatus
): 'success' | 'warning' | 'destructive' | 'secondary' {
  switch (status) {
    case 'healthy':
      return 'success';
    case 'degraded':
      return 'warning';
    case 'unhealthy':
      return 'destructive';
    default:
      return 'secondary';
  }
}

/**
 * Get status icon
 *
 * @param status - Service status
 * @returns Icon emoji
 */
export function getStatusIcon(status: ServiceStatus): string {
  switch (status) {
    case 'healthy':
      return '✅';
    case 'degraded':
      return '⚠️';
    case 'unhealthy':
      return '❌';
    default:
      return '❓';
  }
}
