/**
 * Admin Service Prisma Client
 *
 * This module exports a Prisma client instance configured for the Admin Service database.
 * Uses the service-specific Prisma client generated from apps/admin-service/prisma/schema.prisma
 *
 * Usage:
 *   import { prisma } from './lib/prisma';
 *   const logs = await prisma.auditLog.findMany();
 */

// Import and re-export types from the generated client location
import type {
  AuditLog,
  User,
  SystemConfig,
  Prisma,
} from '../../node_modules/.prisma/admin-client';

export type { AuditLog, User, SystemConfig, Prisma };

// Dynamic require with absolute path to work from dist
import path from 'path';
const clientPath = path.join(
  process.cwd(),
  'apps/admin-service/node_modules/.prisma/admin-client'
);
const { PrismaClient } = require(clientPath);

/**
 * Prisma Client instance for Admin Service
 *
 * Connects to admin_db database (port 5434)
 * In development, the client will log queries to help with debugging.
 * In production, logging is disabled for performance.
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url:
          process.env.ADMIN_DATABASE_URL ||
          'postgresql://postgres:postgres@localhost:5434/admin_db',
      },
    },
    log:
      process.env['NODE_ENV'] === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
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

export default prisma;
export { prisma };
