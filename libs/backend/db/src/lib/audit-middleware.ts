/**
 * Database Audit Middleware - Prisma Middleware for Audit Logging
 *
 * Provides automatic audit logging for all database write operations:
 * - CREATE: Logs new records with full data
 * - UPDATE: Logs changes with before/after data
 * - DELETE: Logs deleted records
 *
 * Phase 4.4 - Database Security Hardening
 */

/**
 * Audit event types
 */
export const DbAuditAction = {
  DB_CREATE: 'DB_CREATE',
  DB_UPDATE: 'DB_UPDATE',
  DB_DELETE: 'DB_DELETE',
  DB_CREATE_MANY: 'DB_CREATE_MANY',
  DB_UPDATE_MANY: 'DB_UPDATE_MANY',
  DB_DELETE_MANY: 'DB_DELETE_MANY',
  DB_UPSERT: 'DB_UPSERT',
} as const;

export type DbAuditActionType = (typeof DbAuditAction)[keyof typeof DbAuditAction];

/**
 * Database audit event information
 */
export interface DbAuditEvent {
  /** Service that performed the operation */
  serviceName: string;
  /** Type of database action */
  action: DbAuditActionType;
  /** Prisma model name (e.g., 'User', 'Payment') */
  model: string;
  /** Record ID(s) affected (if available) */
  recordId?: string | string[];
  /** User ID who performed the action (from context) */
  userId?: string;
  /** Data before the operation (for updates/deletes) */
  dataBefore?: unknown;
  /** Data after the operation (for creates/updates) */
  dataAfter?: unknown;
  /** Duration of the operation in milliseconds */
  durationMs: number;
  /** Timestamp of the operation */
  timestamp: Date;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Configuration for the audit middleware
 */
export interface DbAuditConfig {
  /** Service name for logging */
  serviceName: string;
  /** Enable audit logging (default: true) */
  enabled?: boolean;
  /** Models to include (if specified, only these models are audited) */
  includeModels?: string[];
  /** Models to exclude from auditing */
  excludeModels?: string[];
  /** Actions to audit (default: all write actions) */
  auditActions?: DbAuditActionType[];
  /** Fields to redact from audit logs (e.g., 'password', 'token') */
  redactFields?: string[];
  /** Custom logger function */
  logger?: (message: string, context: Record<string, unknown>) => void;
  /** Callback when an audit event is created */
  onAuditEvent?: (event: DbAuditEvent) => void | Promise<void>;
  /** Get current user context (for tracking who made the change) */
  getUserContext?: () => { userId?: string; metadata?: Record<string, unknown> } | undefined;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Required<
  Omit<DbAuditConfig, 'serviceName' | 'onAuditEvent' | 'getUserContext' | 'includeModels'>
> = {
  enabled: true,
  excludeModels: [],
  auditActions: [
    DbAuditAction.DB_CREATE,
    DbAuditAction.DB_UPDATE,
    DbAuditAction.DB_DELETE,
    DbAuditAction.DB_CREATE_MANY,
    DbAuditAction.DB_UPDATE_MANY,
    DbAuditAction.DB_DELETE_MANY,
    DbAuditAction.DB_UPSERT,
  ],
  redactFields: ['password', 'passwordHash', 'token', 'refreshToken', 'secret', 'apiKey'],
  logger: (message: string, context: Record<string, unknown>) => {
    console.log(
      JSON.stringify({ level: 'info', message, ...context, timestamp: new Date().toISOString() })
    );
  },
};

/**
 * Map Prisma actions to audit actions
 */
const ACTION_MAP: Record<string, DbAuditActionType | undefined> = {
  create: DbAuditAction.DB_CREATE,
  update: DbAuditAction.DB_UPDATE,
  delete: DbAuditAction.DB_DELETE,
  createMany: DbAuditAction.DB_CREATE_MANY,
  updateMany: DbAuditAction.DB_UPDATE_MANY,
  deleteMany: DbAuditAction.DB_DELETE_MANY,
  upsert: DbAuditAction.DB_UPSERT,
};

/**
 * Prisma middleware params type
 */
interface PrismaMiddlewareParams {
  model?: string;
  action: string;
  args?: Record<string, unknown>;
  dataPath: string[];
  runInTransaction: boolean;
}

/**
 * Redact sensitive fields from an object
 */
function redactSensitiveFields(
  data: unknown,
  redactFields: string[]
): unknown {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveFields(item, redactFields));
  }

  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (redactFields.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSensitiveFields(value, redactFields);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

/**
 * Extract record ID from Prisma result
 */
function extractRecordId(result: unknown): string | string[] | undefined {
  if (!result) return undefined;

  if (Array.isArray(result)) {
    const ids = result
      .map((item) => {
        if (typeof item === 'object' && item !== null) {
          const obj = item as Record<string, unknown>;
          return (obj.id as string) || (obj.uuid as string) || undefined;
        }
        return undefined;
      })
      .filter((id): id is string => id !== undefined);
    return ids.length > 0 ? ids : undefined;
  }

  if (typeof result === 'object') {
    const obj = result as Record<string, unknown>;
    return (obj.id as string) || (obj.uuid as string) || undefined;
  }

  return undefined;
}

/**
 * Extract record ID from where clause
 */
function extractIdFromWhere(args?: Record<string, unknown>): string | undefined {
  if (!args?.where) return undefined;
  const where = args.where as Record<string, unknown>;
  return (where.id as string) || (where.uuid as string) || undefined;
}

/**
 * Create a Prisma middleware for database audit logging
 *
 * @param config - Audit middleware configuration
 * @returns Prisma middleware function
 *
 * @example
 * ```typescript
 * const auditMiddleware = createDbAuditMiddleware({
 *   serviceName: 'auth-service',
 *   redactFields: ['password', 'token'],
 *   onAuditEvent: async (event) => {
 *     // Publish to RabbitMQ or log to file
 *     await publishAuditEvent(event);
 *   },
 *   getUserContext: () => {
 *     // Get from AsyncLocalStorage or request context
 *     return { userId: getCurrentUserId() };
 *   },
 * });
 * prisma.$use(auditMiddleware);
 * ```
 */
export function createDbAuditMiddleware(config: DbAuditConfig) {
  const {
    serviceName,
    enabled = DEFAULT_CONFIG.enabled,
    includeModels,
    excludeModels = DEFAULT_CONFIG.excludeModels,
    auditActions = DEFAULT_CONFIG.auditActions,
    redactFields = DEFAULT_CONFIG.redactFields,
    logger = DEFAULT_CONFIG.logger,
    onAuditEvent,
    getUserContext,
  } = config;

  return async function dbAuditMiddleware(
    params: PrismaMiddlewareParams,
    next: (params: PrismaMiddlewareParams) => Promise<unknown>
  ): Promise<unknown> {
    // Skip if disabled
    if (!enabled) {
      return next(params);
    }

    const { model, action, args } = params;
    const modelName = model || 'unknown';

    // Check if this action should be audited
    const auditAction = ACTION_MAP[action];
    if (!auditAction || !auditActions.includes(auditAction)) {
      return next(params);
    }

    // Check model inclusion/exclusion
    if (includeModels && !includeModels.includes(modelName)) {
      return next(params);
    }
    if (excludeModels.includes(modelName)) {
      return next(params);
    }

    // Get user context
    const userContext = getUserContext?.();
    const startTime = Date.now();

    try {
      // Execute the query
      const result = await next(params);
      const durationMs = Date.now() - startTime;

      // Build audit event
      const auditEvent: DbAuditEvent = {
        serviceName,
        action: auditAction,
        model: modelName,
        recordId: extractRecordId(result) || extractIdFromWhere(args as Record<string, unknown>),
        userId: userContext?.userId,
        dataAfter: redactSensitiveFields(result, redactFields),
        durationMs,
        timestamp: new Date(),
        metadata: {
          ...userContext?.metadata,
          prismaAction: action,
        },
      };

      // For updates and deletes, include the where clause
      if (auditAction === DbAuditAction.DB_UPDATE || auditAction === DbAuditAction.DB_DELETE) {
        auditEvent.metadata = {
          ...auditEvent.metadata,
          where: redactSensitiveFields(
            (args as Record<string, unknown>)?.where,
            redactFields
          ),
        };
      }

      // For updates and upserts, include the data being set
      if (auditAction === DbAuditAction.DB_UPDATE || auditAction === DbAuditAction.DB_UPSERT) {
        auditEvent.metadata = {
          ...auditEvent.metadata,
          dataInput: redactSensitiveFields(
            (args as Record<string, unknown>)?.data,
            redactFields
          ),
        };
      }

      // Log the audit event
      logger(`[DB Audit] ${auditAction} on ${modelName}`, {
        service: serviceName,
        action: auditAction,
        model: modelName,
        recordId: auditEvent.recordId,
        userId: auditEvent.userId,
        durationMs,
      });

      // Call the audit event callback
      if (onAuditEvent) {
        // Fire and forget - don't block the main operation
        Promise.resolve(onAuditEvent(auditEvent)).catch((error) => {
          console.error('[DB Audit] Failed to process audit event:', error);
        });
      }

      return result;
    } catch (error) {
      // Log the failed operation
      const durationMs = Date.now() - startTime;
      logger(`[DB Audit] FAILED ${auditAction} on ${modelName}`, {
        service: serviceName,
        action: auditAction,
        model: modelName,
        userId: userContext?.userId,
        durationMs,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  };
}

/**
 * Audit middleware configuration from environment variables
 */
export function getDbAuditConfigFromEnv(serviceName: string): DbAuditConfig {
  const excludeModelsEnv = process.env.DB_AUDIT_EXCLUDE_MODELS;
  const includeModelsEnv = process.env.DB_AUDIT_INCLUDE_MODELS;
  const redactFieldsEnv = process.env.DB_AUDIT_REDACT_FIELDS;

  return {
    serviceName,
    enabled: process.env.DB_AUDIT_ENABLED !== 'false',
    excludeModels: excludeModelsEnv ? excludeModelsEnv.split(',').map((m) => m.trim()) : undefined,
    includeModels: includeModelsEnv ? includeModelsEnv.split(',').map((m) => m.trim()) : undefined,
    redactFields: redactFieldsEnv
      ? redactFieldsEnv.split(',').map((f) => f.trim())
      : DEFAULT_CONFIG.redactFields,
  };
}

/**
 * Audit statistics for monitoring
 */
interface DbAuditStats {
  totalEvents: number;
  eventsByAction: Record<string, number>;
  eventsByModel: Record<string, number>;
  lastEventTimestamp: Date | null;
}

const auditStatsMap = new Map<string, DbAuditStats>();

/**
 * Initialize audit stats for a service
 */
function initializeAuditStats(serviceName: string): DbAuditStats {
  const stats: DbAuditStats = {
    totalEvents: 0,
    eventsByAction: {},
    eventsByModel: {},
    lastEventTimestamp: null,
  };
  auditStatsMap.set(serviceName, stats);
  return stats;
}

/**
 * Get audit stats for a service
 */
export function getDbAuditStats(serviceName: string): DbAuditStats | undefined {
  return auditStatsMap.get(serviceName);
}

/**
 * Track audit event in statistics
 */
export function trackAuditEvent(event: DbAuditEvent): void {
  let stats = auditStatsMap.get(event.serviceName);
  if (!stats) {
    stats = initializeAuditStats(event.serviceName);
  }

  stats.totalEvents++;
  stats.eventsByAction[event.action] = (stats.eventsByAction[event.action] || 0) + 1;
  stats.eventsByModel[event.model] = (stats.eventsByModel[event.model] || 0) + 1;
  stats.lastEventTimestamp = event.timestamp;
}

/**
 * Reset audit stats for a service
 */
export function resetDbAuditStats(serviceName: string): void {
  initializeAuditStats(serviceName);
}
