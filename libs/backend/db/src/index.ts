/**
 * Backend Database Library
 *
 * This library provides:
 * - Prisma client singleton instance
 * - Database models and types
 * - Database utilities
 */

export { prisma, default as prismaClient } from './lib/prisma';
export * from './lib/db';
export * from '@prisma/client';
