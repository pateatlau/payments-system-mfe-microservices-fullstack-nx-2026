/**
 * Health Check Routes
 *
 * Provides health check endpoints for monitoring
 */

import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /health
 * Basic health check endpoint
 */
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'api-gateway',
      uptime: process.uptime(),
    },
  });
});

/**
 * GET /health/ready
 * Readiness check - indicates if service is ready to accept traffic
 */
router.get('/health/ready', (_req: Request, res: Response) => {
  // In a real implementation, check database connections, etc.
  res.status(200).json({
    success: true,
    data: {
      ready: true,
      timestamp: new Date().toISOString(),
    },
  });
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
