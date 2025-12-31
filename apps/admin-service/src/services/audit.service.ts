/**
 * Audit Service
 * Utility for creating audit log entries
 */

import { prisma, Prisma } from '../lib/prisma';

/**
 * Audit action types for user management
 */
export const AuditAction = {
  // User management actions
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  USER_ROLE_CHANGED: 'USER_ROLE_CHANGED',
  USER_STATUS_CHANGED: 'USER_STATUS_CHANGED',

  // Authentication events (from auth service)
  USER_REGISTERED: 'USER_REGISTERED',
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_PASSWORD_CHANGED: 'USER_PASSWORD_CHANGED',

  // Payment events (from payments service)
  PAYMENT_CREATED: 'PAYMENT_CREATED',
  PAYMENT_UPDATED: 'PAYMENT_UPDATED',
  PAYMENT_COMPLETED: 'PAYMENT_COMPLETED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_CANCELLED: 'PAYMENT_CANCELLED',

  // System events
  SYSTEM_CONFIG_CHANGED: 'SYSTEM_CONFIG_CHANGED',
} as const;

export type AuditActionType = (typeof AuditAction)[keyof typeof AuditAction];

/**
 * Resource types for audit logging
 */
export const ResourceType = {
  USER: 'user',
  PAYMENT: 'payment',
  SYSTEM_CONFIG: 'system_config',
  SESSION: 'session',
} as const;

export type ResourceTypeValue = (typeof ResourceType)[keyof typeof ResourceType];

/**
 * Options for creating an audit log entry
 */
export interface CreateAuditLogOptions {
  /** The action performed */
  action: AuditActionType | string;
  /** The type of resource affected */
  resourceType: ResourceTypeValue | string;
  /** The ID of the resource affected */
  resourceId: string;
  /** The ID of the user who performed the action (optional for system events) */
  userId?: string;
  /** Additional details about the action */
  details?: Record<string, unknown>;
  /** IP address of the request */
  ipAddress?: string;
  /** User agent of the request */
  userAgent?: string;
}

/**
 * Create an audit log entry
 *
 * @param options - Audit log options
 * @returns The created audit log entry
 */
export async function createAuditLog(options: CreateAuditLogOptions) {
  const { action, resourceType, resourceId, userId, details, ipAddress, userAgent } =
    options;

  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        action,
        resourceType,
        resourceId,
        userId: userId || null,
        details: details as Prisma.InputJsonValue,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });

    console.log(
      `[Audit] ${action} on ${resourceType}:${resourceId}${userId ? ` by user ${userId}` : ''}`
    );

    return auditLog;
  } catch (error) {
    console.error('[Audit] Failed to create audit log:', error);
    // Don't throw - audit logging should not break the main operation
    return null;
  }
}

/**
 * Extract request metadata for audit logging
 *
 * @param req - Express request object
 * @returns Object with IP address and user agent
 */
export function getRequestMetadata(req: {
  ip?: string;
  headers?: { 'user-agent'?: string; 'x-forwarded-for'?: string };
}) {
  const ipAddress =
    req.headers?.['x-forwarded-for']?.toString().split(',')[0] || req.ip || 'unknown';
  const userAgent = req.headers?.['user-agent'] || undefined;

  return { ipAddress, userAgent };
}
