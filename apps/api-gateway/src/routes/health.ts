/**
 * Health Check Routes
 *
 * Provides health check endpoints for monitoring
 * Includes circuit breaker status (Phase 5.1)
 */

import { Router, Request, Response } from 'express';
import { getAllProxyCircuitStats } from '../middleware/proxy';
import { getAllCircuitStats, hasOpenCircuits, getOpenCircuits } from '@payments-system/resilience';

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

/**
 * GET /health/circuits
 * Circuit breaker status endpoint
 * Returns status of all circuit breakers for monitoring
 */
router.get('/health/circuits', (_req: Request, res: Response) => {
  const proxyStats = getAllProxyCircuitStats();
  const allStats = getAllCircuitStats();
  const openCircuits = getOpenCircuits();
  const hasDegraded = hasOpenCircuits();

  res.status(hasDegraded ? 503 : 200).json({
    success: true,
    data: {
      healthy: !hasDegraded,
      degraded: hasDegraded,
      openCircuits,
      timestamp: new Date().toISOString(),
      services: proxyStats,
      circuits: allStats.map(stat => ({
        name: stat.name,
        state: stat.state,
        successes: stat.successes,
        failures: stat.failures,
        timeouts: stat.timeouts,
        rejects: stat.rejects,
        lastStateChange: stat.lastStateChange,
      })),
    },
  });
});

export default router;
