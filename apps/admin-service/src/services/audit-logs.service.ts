/**
 * Audit Logs Service
 * Business logic for retrieving and managing audit logs
 */

import { AuditLog, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
  AuditLogFilters,
  AuditLogsListResponse,
} from '../types/audit-logs.types';

/**
 * Get paginated list of audit logs with optional filters
 */
export async function getAuditLogs(
  filters: AuditLogFilters
): Promise<AuditLogsListResponse> {
  const {
    page = 1,
    limit = 20,
    action,
    userId,
    resourceType,
    startDate,
    endDate,
  } = filters;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.AuditLogWhereInput = {};

  if (action) {
    where.action = action;
  }

  if (userId) {
    where.userId = userId;
  }

  if (resourceType) {
    where.resourceType = resourceType;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = startDate;
    }
    if (endDate) {
      where.createdAt.lte = endDate;
    }
  }

  // Get audit logs with pagination
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  // Enrich logs with user information
  const enrichedLogs = await Promise.all(
    logs.map(async (log: AuditLog) => {
      let userName: string | undefined;
      let userEmail: string | undefined;

      if (log.userId) {
        const user = await prisma.user.findUnique({
          where: { id: log.userId },
          select: { name: true, email: true },
        });

        if (user) {
          userName = user.name;
          userEmail = user.email;
        }
      }

      return {
        id: log.id,
        userId: log.userId || '',
        userName,
        userEmail,
        action: log.action,
        resourceType: log.resourceType || '',
        resourceId: log.resourceId || '',
        details: log.details as Record<string, unknown> | undefined,
        ipAddress: log.ipAddress || undefined,
        userAgent: log.userAgent || undefined,
        timestamp: log.createdAt.toISOString(),
      };
    })
  );

  const totalPages = Math.ceil(total / limit);

  return {
    data: enrichedLogs,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

/**
 * Get available actions for filtering
 * Returns unique list of actions from audit logs
 */
export async function getAvailableActions(): Promise<string[]> {
  const actions = await prisma.auditLog.findMany({
    select: { action: true },
    distinct: ['action'],
    orderBy: { action: 'asc' },
  });

  return actions.map((a: { action: string }) => a.action);
}
