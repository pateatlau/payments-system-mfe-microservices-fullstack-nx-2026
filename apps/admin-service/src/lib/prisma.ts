/**
 * Admin Service Prisma Client
 *
 * This module exports a Prisma client instance configured for the Admin Service database.
 * Uses the service-specific Prisma client generated from apps/admin-service/prisma/schema.prisma
 *
 * Connection Pool Configuration (Phase 4.1 - Database Security Hardening):
 * - Min connections: 2
 * - Max connections: 10
 * - Connection timeout: 30s
 * - Idle timeout: 600s (10 minutes)
 *
 * Query Monitoring (Phase 4.2 - Database Security Hardening):
 * - Query timeout: 10s (configurable via DB_QUERY_TIMEOUT_MS)
 * - Slow query logging: >1s (configurable via DB_SLOW_QUERY_THRESHOLD_MS)
 * - Query performance metrics for Prometheus
 *
 * Usage:
 *   import { prisma } from './lib/prisma';
 *   const logs = await prisma.auditLog.findMany();
 */

// Dynamic require with absolute path to work from dist
import path from 'path';
import {
  createQueryMonitorMiddleware,
  getQueryStats as getQueryStatsFromMonitor,
  getQueryMonitorConfigFromEnv,
  type QueryStats,
} from '@payments-system/db';
const clientPath = path.join(
  process.cwd(),
  'apps/admin-service/node_modules/.prisma/admin-client'
);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient, UserRole: UserRoleEnum } = require(clientPath);

// Re-export UserRole enum (value for runtime)
export const UserRole = UserRoleEnum;

// Type-only re-exports from the generated client (stripped at compile time, doesn't affect runtime)
// This allows TypeScript to understand the types while using dynamic require for runtime
export type {
  AuditLog,
  User,
  SystemConfig,
  Prisma,
  UserRole as UserRoleType,
} from '../../node_modules/.prisma/admin-client';

const SERVICE_NAME = 'admin-service';

/**
 * Connection pool configuration
 * These settings prevent connection pool exhaustion and optimize resource usage
 */
const POOL_CONFIG = {
  /** Minimum number of connections to keep in the pool */
  connectionLimit: parseInt(process.env.DB_POOL_MAX_CONNECTIONS || '10', 10),
  /** Connection timeout in seconds */
  connectTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30', 10),
  /** Idle timeout in seconds (connections idle longer than this are closed) */
  poolTimeout: parseInt(process.env.DB_POOL_TIMEOUT || '600', 10),
};

/**
 * Build database URL with connection pool parameters
 * Prisma uses URL query parameters for pool configuration
 */
function buildDatabaseUrl(): string {
  const baseUrl =
    process.env.ADMIN_DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5434/admin_db';

  // Parse existing URL to check if it already has parameters
  const url = new URL(baseUrl);

  // Add connection pool parameters if not already present
  if (!url.searchParams.has('connection_limit')) {
    url.searchParams.set('connection_limit', POOL_CONFIG.connectionLimit.toString());
  }
  if (!url.searchParams.has('connect_timeout')) {
    url.searchParams.set('connect_timeout', POOL_CONFIG.connectTimeout.toString());
  }
  if (!url.searchParams.has('pool_timeout')) {
    url.searchParams.set('pool_timeout', POOL_CONFIG.poolTimeout.toString());
  }

  return url.toString();
}

/**
 * Pool metrics tracking
 * Used for monitoring connection pool health
 */
interface PoolMetrics {
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  totalConnections: number;
  maxConnections: number;
  connectionTimeouts: number;
  lastUpdated: Date;
}

let poolMetrics: PoolMetrics = {
  activeConnections: 0,
  idleConnections: 0,
  waitingRequests: 0,
  totalConnections: 0,
  maxConnections: POOL_CONFIG.connectionLimit,
  connectionTimeouts: 0,
  lastUpdated: new Date(),
};

/**
 * Get current pool metrics
 * Can be used by Prometheus metrics collector
 */
export function getPoolMetrics(): PoolMetrics {
  return { ...poolMetrics };
}

/**
 * Get service name for metrics labeling
 */
export function getServiceName(): string {
  return SERVICE_NAME;
}

/**
 * Get pool configuration
 */
export function getPoolConfig(): typeof POOL_CONFIG {
  return { ...POOL_CONFIG };
}

/**
 * Prisma Client instance for Admin Service
 *
 * Connects to admin_db database (port 5434)
 * In development, the client will log queries to help with debugging.
 * In production, logging is disabled for performance.
 *
 * Connection pool is configured via URL parameters:
 * - connection_limit: Maximum connections (default: 10)
 * - connect_timeout: Connection timeout in seconds (default: 30)
 * - pool_timeout: Idle timeout in seconds (default: 600)
 */
const prismaClientSingleton = () => {
  const databaseUrl = buildDatabaseUrl();

  console.log(`[${SERVICE_NAME}] Initializing Prisma client with pool config:`, {
    maxConnections: POOL_CONFIG.connectionLimit,
    connectTimeout: `${POOL_CONFIG.connectTimeout}s`,
    poolTimeout: `${POOL_CONFIG.poolTimeout}s`,
  });

  const client = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log:
      process.env['NODE_ENV'] === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

  // Add middleware to track connection metrics (Phase 4.1)
  client.$use(async (params: { model?: string; action: string }, next: (params: unknown) => Promise<unknown>) => {
    const startTime = Date.now();
    poolMetrics.activeConnections++;
    poolMetrics.lastUpdated = new Date();

    try {
      const result = await next(params);
      return result;
    } catch (error: unknown) {
      // Track connection timeout errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes('timeout') ||
        errorMessage.includes('connection')
      ) {
        poolMetrics.connectionTimeouts++;
        console.error(`[${SERVICE_NAME}] Database connection error:`, {
          action: params.action,
          model: params.model,
          error: errorMessage,
          duration: Date.now() - startTime,
        });
      }
      throw error;
    } finally {
      poolMetrics.activeConnections = Math.max(0, poolMetrics.activeConnections - 1);
      poolMetrics.lastUpdated = new Date();
    }
  });

  // Add query monitoring middleware (Phase 4.2)
  const queryMonitorConfig = getQueryMonitorConfigFromEnv(SERVICE_NAME);
  console.log(`[${SERVICE_NAME}] Initializing query monitor with config:`, {
    queryTimeoutMs: queryMonitorConfig.queryTimeoutMs,
    slowQueryThresholdMs: queryMonitorConfig.slowQueryThresholdMs,
  });
  client.$use(createQueryMonitorMiddleware(queryMonitorConfig));

  return client;
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

/**
 * Global Prisma client instance
 *
 * Uses a global variable to prevent multiple instances in development
 * (hot module replacement can create multiple instances).
 */
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env['NODE_ENV'] !== 'production') {
  globalThis.prismaGlobal = prisma;
}

/**
 * Graceful shutdown handler
 * Ensures all connections are properly closed
 */
export async function disconnectPrisma(): Promise<void> {
  console.log(`[${SERVICE_NAME}] Disconnecting Prisma client...`);
  await prisma.$disconnect();
  console.log(`[${SERVICE_NAME}] Prisma client disconnected`);
}

/**
 * Get query statistics for monitoring
 * Returns stats like total queries, slow queries, timeouts, avg duration
 */
export function getQueryStats(): QueryStats | undefined {
  return getQueryStatsFromMonitor(SERVICE_NAME);
}

export default prisma;
export { prisma };
