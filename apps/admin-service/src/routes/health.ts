/**
 * Admin Service Health Check Routes
 */

import express from 'express';
import { prisma } from 'db';

const router = express.Router();

/**
 * Basic health check
 */
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      service: 'admin-service',
      timestamp: new Date().toISOString(),
    },
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
      success: true,
      data: {
        status: 'ready',
        service: 'admin-service',
        database: 'connected',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service not ready',
        details: {
          database: 'disconnected',
        },
      },
    });
  }
});

/**
 * Liveness check
 */
router.get('/health/live', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'alive',
      service: 'admin-service',
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
