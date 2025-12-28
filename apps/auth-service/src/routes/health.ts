/**
 * Health Check Routes
 *
 * Provides health check endpoints for monitoring
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

/**
 * GET /health
 * Basic health check endpoint
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'auth-service',
        uptime: process.uptime(),
        database: 'connected',
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'auth-service',
        database: 'disconnected',
      },
    });
  }
});

/**
 * GET /health/ready
 * Readiness check - indicates if service is ready to accept traffic
 */
router.get('/health/ready', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      data: {
        ready: true,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      data: {
        ready: false,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /health/live
 * Liveness check - indicates if service is alive
 */
router.get('/health/live', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      alive: true,
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
