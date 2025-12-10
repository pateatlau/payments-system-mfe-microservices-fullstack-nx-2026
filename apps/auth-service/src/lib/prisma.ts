/**
 * Auth Service Prisma Client
 *
 * This module exports a Prisma client instance configured for the Auth Service database.
 * Uses the service-specific Prisma client generated from apps/auth-service/prisma/schema.prisma
 *
 * Usage:
 *   import { prisma } from './lib/prisma';
 *   const users = await prisma.user.findMany();
 */

import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client instance for Auth Service
 *
 * Connects to auth_db database (port 5432)
 * In development, the client will log queries to help with debugging.
 * In production, logging is disabled for performance.
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.AUTH_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/auth_db',
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
