/**
 * Audit Logs API
 *
 * API functions for retrieving audit logs (ADMIN only)
 *
 * Note: Backend audit logging is currently deferred to Event Hub integration (Phase 3).
 * This API client is ready for when the backend implementation is complete.
 */

import { adminApiClient } from './adminApiClient';

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

  const response = await adminApiClient.get<AuditLogsListResponse>(
    `/admin/audit-logs?${params.toString()}`
  );

  return response.data;
}

/**
 * Get available audit log actions for filtering
 *
 * @returns Promise with list of action types
 */
export async function getAvailableActions(): Promise<string[]> {
  try {
    // ApiClient.get<T> returns ApiResponse<T> where response.data is T
    // Backend returns { success: true, data: string[] }
    // So T = string[] and response.data = string[]
    const response = await adminApiClient.get<string[]>(
      '/admin/audit-logs/actions'
    );
    return response.data ?? [];
  } catch (_error) {
    // Return empty array if endpoint not available yet
    console.warn('Failed to fetch available actions:', _error);
    return [];
  }
}
