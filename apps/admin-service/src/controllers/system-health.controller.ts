/**
 * System Health Controller
 *
 * Handles system-wide health monitoring (ADMIN only)
 */

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import Redis from 'ioredis';

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
 * Check Redis health
 */
async function checkRedisHealth(): Promise<'healthy' | 'unhealthy'> {
  let redis: Redis | null = null;
  try {
    // Create Redis connection
    redis = new Redis({
      host: process.env['REDIS_HOST'] ?? 'localhost',
      port: parseInt(process.env['REDIS_PORT'] ?? '6379', 10),
      password: process.env['REDIS_PASSWORD'],
      lazyConnect: true, // Don't connect immediately
      retryStrategy: () => null, // Don't retry on failure for health check
    });

    // Test connection with PING command (5 second timeout)
    await redis.connect();
    const result = await redis.ping();
    await redis.quit();

    return result === 'PONG' ? 'healthy' : 'unhealthy';
  } catch (error) {
    logger.error('Redis health check failed:', error);
    if (redis) {
      try {
        await redis.quit();
      } catch {
        // Ignore errors when closing failed connection
      }
    }
    return 'unhealthy';
  }
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
