/**
 * Audit Logs API
 *
 * API functions for retrieving audit logs (ADMIN only)
 *
 * Note: Backend audit logging is currently deferred to Event Hub integration (Phase 3).
 * This API client is ready for when the backend implementation is complete.
 */

import { apiClient } from '@mfe/shared-api-client';

/**
 * Audit log entry interface
 */
export interface AuditLog {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

/**
 * Pagination info
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Audit logs list response
 */
export interface AuditLogsListResponse {
  data: AuditLog[];
  pagination: PaginationInfo;
}

/**
 * Audit log filters
 */
export interface AuditLogFilters {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Get list of audit logs
 *
 * @param filters - Optional filters (page, limit, userId, action, startDate, endDate)
 * @returns Promise with audit logs list and pagination
 *
 * @throws Error if backend audit logging is not yet implemented
 */
export async function getAuditLogs(
  filters?: AuditLogFilters
): Promise<AuditLogsListResponse> {
  const params = new URLSearchParams();

  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.userId) params.append('userId', filters.userId);
  if (filters?.action) params.append('action', filters.action);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);

  const response = await apiClient.get<AuditLogsListResponse>(
    `/admin/audit-logs?${params.toString()}`
  );

  return response.data;
}

/**
 * Get available audit log actions for filtering
 *
 * @returns Promise with list of action types
 */
export function getAvailableActions(): string[] {
  return [
    'USER_LOGIN',
    'USER_LOGOUT',
    'USER_CREATED',
    'USER_UPDATED',
    'USER_DELETED',
    'USER_ROLE_CHANGED',
    'PAYMENT_CREATED',
    'PAYMENT_UPDATED',
    'PAYMENT_COMPLETED',
    'PAYMENT_FAILED',
    'PAYMENT_CANCELLED',
    'SYSTEM_CONFIG_CHANGED',
    'ADMIN_ACTION',
  ];
}
