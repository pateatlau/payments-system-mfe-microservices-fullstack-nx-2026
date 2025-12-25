/**
 * Payments Service Health Check Routes
 */

import express from 'express';
import { prisma as db } from '../lib/prisma';
import { cache } from '../lib/cache';

const router = express.Router();

// Basic health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'payments-service',
      uptime: process.uptime(),
    },
  });
});

// Readiness check (includes database)
router.get('/health/ready', async (_req, res) => {
  try {
    // Check database connection
    await db.$queryRaw`SELECT 1`;
    // Check Redis cache connection
    const cacheHealthy = await cache.isHealthy();
    if (!cacheHealthy) {
      throw new Error('Redis cache not reachable');
    }

    res.json({
      success: true,
      data: {
        status: 'ready',
        timestamp: new Date().toISOString(),
        service: 'payments-service',
        database: 'connected',
        cache: 'connected',
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service not ready',
        details:
          error instanceof Error ? error.message : 'Dependency check failed',
      },
    });
  }
});

// Liveness check
router.get('/health/live', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'alive',
      timestamp: new Date().toISOString(),
      service: 'payments-service',
    },
  });
});

// Dependencies status (database, cache)
router.get('/health/deps', async (_req, res) => {
  const now = () => new Date().toISOString();

  // Check DB
  const dbStart = Date.now();
  let dbStatus: 'connected' | 'disconnected' = 'connected';
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'disconnected';
  }
  const dbLatencyMs = Date.now() - dbStart;

  // Check Cache
  const cacheStart = Date.now();
  let cacheStatus: 'connected' | 'disconnected' = 'connected';
  try {
    const healthy = await cache.isHealthy();
    if (!healthy) cacheStatus = 'disconnected';
  } catch {
    cacheStatus = 'disconnected';
  }
  const cacheLatencyMs = Date.now() - cacheStart;

  res.json({
    success: true,
    data: {
      timestamp: now(),
      service: 'payments-service',
      dependencies: {
        database: { status: dbStatus, latencyMs: dbLatencyMs },
        cache: { status: cacheStatus, latencyMs: cacheLatencyMs },
      },
    },
  });
});

export default router;
