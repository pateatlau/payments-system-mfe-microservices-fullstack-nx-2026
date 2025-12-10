/**
 * Health Check Routes
 */

import express from 'express';
import { prisma } from '../lib/prisma';
import logger from '../utils/logger';

const router = express.Router();

/**
 * Basic health check
 */
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'profile-service',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Readiness check (includes database connectivity)
 */
router.get('/health/ready', async (_req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'ready',
      service: 'profile-service',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'connected',
      },
    });
  } catch (error) {
    logger.error('Readiness check failed', { error });
    res.status(503).json({
      status: 'not ready',
      service: 'profile-service',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'disconnected',
      },
    });
  }
});

/**
 * Liveness check
 */
router.get('/health/live', (_req, res) => {
  res.json({
    status: 'alive',
    service: 'profile-service',
    timestamp: new Date().toISOString(),
  });
});

export default router;
