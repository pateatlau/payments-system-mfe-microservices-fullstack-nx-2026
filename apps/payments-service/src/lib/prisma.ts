/**
 * Payments Service Prisma Client
 *
 * This module exports a Prisma client instance configured for the Payments Service database.
 * Uses the service-specific Prisma client generated from apps/payments-service/prisma/schema.prisma
 *
 * Usage:
 *   import { prisma } from './lib/prisma';
 *   const payments = await prisma.payment.findMany();
 */

// Dynamic require with absolute path to work from dist
import path from 'path';
const clientPath = path.join(
  process.cwd(),
  'apps/payments-service/node_modules/.prisma/payments-client'
);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require(clientPath);

/**
 * Prisma Client instance for Payments Service
 *
 * Connects to payments_db database (port 5433)
 * In development, the client will log queries to help with debugging.
 * In production, logging is disabled for performance.
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url:
          process.env.PAYMENTS_DATABASE_URL ||
          'postgresql://postgres:postgres@localhost:5433/payments_db',
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
