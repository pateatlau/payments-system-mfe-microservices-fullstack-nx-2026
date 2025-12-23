/**
 * Audit Logs Controller
 * Handles retrieval of audit log entries
 */

import { Request, Response } from 'express';
import { getAuditLogs } from '../services/audit-logs.service';
import { AuditLogFilters } from '../types/audit-logs.types';

/**
 * GET /api/admin/audit-logs
 * Get paginated list of audit logs with optional filters
 */
export async function listAuditLogs(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const filters: AuditLogFilters = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      action: req.query.action as string | undefined,
      userId: req.query.userId as string | undefined,
      resourceType: req.query.resourceType as string | undefined,
      startDate: req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined,
      endDate: req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined,
    };

    const result = await getAuditLogs(filters);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Admin Controller] Error listing audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve audit logs',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
