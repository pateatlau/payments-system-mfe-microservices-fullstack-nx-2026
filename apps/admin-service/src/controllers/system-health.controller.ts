/**
 * System Health Controller
 *
 * Handles system-wide health monitoring (ADMIN only)
 */

import { Request, Response } from 'express';
import { prisma } from 'db';
import { logger } from '../utils/logger';

/**
 * Check health of a service
 */
async function checkServiceHealth(
  url: string
): Promise<'healthy' | 'unhealthy'> {
  try {
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    return response.ok ? 'healthy' : 'unhealthy';
  } catch (error) {
    logger.error(`Service health check failed for ${url}:`, error);
    return 'unhealthy';
  }
}

/**
 * Check database health
 */
async function checkDatabaseHealth(): Promise<'healthy' | 'unhealthy'> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return 'healthy';
  } catch (error) {
    logger.error('Database health check failed:', error);
    return 'unhealthy';
  }
}

/**
 * Check Redis health (placeholder - Redis not yet implemented in POC-2)
 */
async function checkRedisHealth(): Promise<'healthy' | 'unknown'> {
  // TODO: Implement Redis health check in POC-3
  // For now, return 'unknown' as Redis is not yet integrated
  return 'unknown';
}

/**
 * Get system health status
 *
 * GET /api/admin/health
 */
export async function getSystemHealth(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const startTime = Date.now();

    // Check all services in parallel
    const [database, redis, authService, paymentsService, profileService] =
      await Promise.all([
        checkDatabaseHealth(),
        checkRedisHealth(),
        checkServiceHealth('http://localhost:3001'), // Auth Service
        checkServiceHealth('http://localhost:3002'), // Payments Service
        checkServiceHealth('http://localhost:3004'), // Profile Service
      ]);

    // Admin service is healthy if we got here
    const adminService = 'healthy';

    // Determine overall status
    const services = {
      database,
      redis,
      authService,
      paymentsService,
      adminService,
      profileService,
    };

    const unhealthyServices = Object.values(services).filter(
      status => status === 'unhealthy'
    ).length;

    const unknownServices = Object.values(services).filter(
      status => status === 'unknown'
    ).length;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyServices > 0) {
      overallStatus = unhealthyServices >= 3 ? 'unhealthy' : 'degraded';
    } else if (unknownServices > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    const responseTime = Date.now() - startTime;

    logger.info(`System health check completed in ${responseTime}ms`, {
      status: overallStatus,
      services,
    });

    res.json({
      success: true,
      data: {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        services,
        version: '1.0.0',
        uptime: process.uptime(),
        responseTime,
      },
    });
  } catch (error) {
    logger.error('System health check failed:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Failed to check system health',
      },
    });
  }
}
