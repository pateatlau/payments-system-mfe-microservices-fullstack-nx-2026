/**
 * Profile Service Prisma Client
 *
 * This module exports a Prisma client instance configured for the Profile Service database.
 * Uses the service-specific Prisma client generated from apps/profile-service/prisma/schema.prisma
 *
 * Usage:
 *   import { prisma } from './lib/prisma';
 *   const profiles = await prisma.userProfile.findMany();
 */

import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client instance for Profile Service
 *
 * Connects to profile_db database (port 5435)
 * In development, the client will log queries to help with debugging.
 * In production, logging is disabled for performance.
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url:
          process.env.PROFILE_DATABASE_URL ||
          'postgresql://postgres:postgres@localhost:5435/profile_db',
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
