/**
 * Audit Logs Controller
 * Handles retrieval of audit log entries
 *
 * Enhanced with:
 * - Zod schema validation for query parameters
 * - Strict enum validation for action/resourceType filters
 */

import { Request, Response, NextFunction } from 'express';
import { getAuditLogs } from '../services/audit-logs.service';
import { auditLogsQuerySchema } from '../validators/admin.validators';

/**
 * GET /api/admin/audit-logs
 * Get paginated list of audit logs with optional filters
 */
export async function listAuditLogs(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate and parse query parameters using Zod schema
    const filters = auditLogsQuerySchema.parse(req.query);

    const result = await getAuditLogs(filters);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    // Let the error middleware handle Zod validation errors
    next(error);
  }
}
