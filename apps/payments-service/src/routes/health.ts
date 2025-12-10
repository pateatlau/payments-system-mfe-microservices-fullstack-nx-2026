/**
 * Payments Service Health Check Routes
 */

import express from 'express';
import { prisma as db } from '../lib/prisma';

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

    res.json({
      success: true,
      data: {
        status: 'ready',
        timestamp: new Date().toISOString(),
        service: 'payments-service',
        database: 'connected',
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service not ready',
        details:
          error instanceof Error ? error.message : 'Database connection failed',
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

export default router;
