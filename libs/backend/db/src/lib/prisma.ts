/**
 * Prisma Client Singleton
 *
 * This module exports a singleton Prisma client instance to be used across
 * all backend services. The client is initialized once and reused to avoid
 * connection pool exhaustion.
 *
 * Usage:
 *   import { prisma } from 'db';
 *   const users = await prisma.user.findMany();
 */

import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client instance
 *
 * In development, the client will log queries to help with debugging.
 * In production, logging is disabled for performance.
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
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
