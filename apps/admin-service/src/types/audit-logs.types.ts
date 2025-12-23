/**
 * Audit Logs Types
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

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AuditLogsListResponse {
  data: AuditLog[];
  pagination: PaginationInfo;
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  action?: string;
  userId?: string;
  resourceType?: string;
  startDate?: Date;
  endDate?: Date;
}
