/**
 * Audit Log Model
 *
 * Audit log model types matching the Prisma schema
 */

/**
 * Audit log model
 */
export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}
