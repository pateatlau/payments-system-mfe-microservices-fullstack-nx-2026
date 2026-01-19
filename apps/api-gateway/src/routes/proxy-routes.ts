/**
 * API Gateway Proxy Routes
 *
 * Purpose: Route definitions for proxying requests to backend microservices
 * Features:
 *   - Auth Service proxy (/api/auth -> http://localhost:3001)
 *   - Payments Service proxy (/api/payments -> http://localhost:3002)
 *   - Admin Service proxy (/api/admin -> http://localhost:3003)
 *   - Profile Service proxy (/api/profile -> http://localhost:3004)
 *   - Circuit breaker protection for all services (Phase 5.1)
 *
 * POC-3 Implementation: Production-ready streaming HTTP proxy with circuit breaker
 */

import { Router } from 'express';
import { createStreamingProxy, ProxyTarget, getAllProxyCircuitStats } from '../middleware/proxy';
import { logger } from '../utils/logger';

/**
 * Circuit breaker configuration (shared across services)
 */
const circuitBreakerConfig = {
  enabled: true,
  errorThresholdPercentage: 50,  // Open circuit after 50% errors
  resetTimeout: 30000,           // Try again after 30 seconds
  volumeThreshold: 5,            // Minimum 5 requests before calculating threshold
};

const router = Router();

/**
 * Service target configurations
 */
const services: Record<string, ProxyTarget> = {
  auth: {
    host: 'localhost',
    port: 3001,
    protocol: 'http',
  },
  payments: {
    host: 'localhost',
    port: 3002,
    protocol: 'http',
  },
  admin: {
    host: 'localhost',
    port: 3003,
    protocol: 'http',
  },
  profile: {
    host: 'localhost',
    port: 3004,
    protocol: 'http',
  },
};

/**
 * Auth Service Proxy
 *
 * Routes:
 *   POST /api/auth/login -> http://localhost:3001/auth/login
 *   POST /api/auth/register -> http://localhost:3001/auth/register
 *   POST /api/auth/refresh -> http://localhost:3001/auth/refresh
 *   POST /api/auth/logout -> http://localhost:3001/auth/logout
 *   GET /api/auth/me -> http://localhost:3001/auth/me
 *
 * Note: Express strips /api/auth when routing, so we use custom proxy with prepend
 */
router.use(
  '/api/auth',
  createStreamingProxy({
    target: services['auth']!,
    serviceName: 'auth-service',
    pathRewrite: {
      '^': '/auth', // Prepend /auth to the path
    },
    timeout: 30000,
    circuitBreaker: circuitBreakerConfig,
  })
);

/**
 * Payments Service Proxy
 *
 * Routes:
 *   GET /api/payments -> http://localhost:3002/payments
 *   POST /api/payments -> http://localhost:3002/payments
 *   GET /api/payments/:id -> http://localhost:3002/payments/:id
 *   PATCH /api/payments/:id/status -> http://localhost:3002/payments/:id/status
 *
 * Note: Express strips /api/payments when routing, so we prepend /payments
 */
router.use(
  '/api/payments',
  createStreamingProxy({
    target: services['payments']!,
    serviceName: 'payments-service',
    pathRewrite: {
      '^': '/payments', // Prepend /payments to the path
    },
    timeout: 30000,
    circuitBreaker: circuitBreakerConfig,
  })
);

/**
 * Admin Service Proxy
 *
 * Routes:
 *   GET /api/admin/users -> http://localhost:3003/api/admin/users
 *   GET /api/admin/users/:id -> http://localhost:3003/api/admin/users/:id
 *   PUT /api/admin/users/:id -> http://localhost:3003/api/admin/users/:id
 *   DELETE /api/admin/users/:id -> http://localhost:3003/api/admin/users/:id
 *   PATCH /api/admin/users/:id/role -> http://localhost:3003/api/admin/users/:id/role
 *   POST /api/admin/users/:id/suspend -> http://localhost:3003/api/admin/users/:id/suspend
 *   POST /api/admin/users/:id/unsuspend -> http://localhost:3003/api/admin/users/:id/unsuspend
 *
 * Note: Express strips /api/admin when routing, so we prepend /api/admin back
 */
router.use(
  '/api/admin',
  createStreamingProxy({
    target: services['admin']!,
    serviceName: 'admin-service',
    pathRewrite: {
      '^': '/api/admin', // Prepend /api/admin to the path
    },
    timeout: 30000,
    circuitBreaker: circuitBreakerConfig,
  })
);

/**
 * Profile Service Proxy
 *
 * Routes:
 *   GET /api/profile -> http://localhost:3004/api/profile
 *   PUT /api/profile -> http://localhost:3004/api/profile
 *   GET /api/profile/preferences -> http://localhost:3004/api/profile/preferences
 *   PUT /api/profile/preferences -> http://localhost:3004/api/profile/preferences
 *
 * Note: Express strips /api/profile when routing, so we prepend /api/profile back
 */
router.use(
  '/api/profile',
  createStreamingProxy({
    target: services['profile']!,
    serviceName: 'profile-service',
    pathRewrite: {
      '^': '/api/profile', // Prepend /api/profile to the path
    },
    timeout: 30000,
    circuitBreaker: circuitBreakerConfig,
  })
);

/**
 * Log proxy route initialization
 */
logger.info('API Gateway proxy routes initialized', {
  services: Object.keys(services),
  routes: ['/api/auth', '/api/payments', '/api/admin', '/api/profile'],
  circuitBreaker: {
    enabled: circuitBreakerConfig.enabled,
    errorThresholdPercentage: circuitBreakerConfig.errorThresholdPercentage,
    resetTimeout: circuitBreakerConfig.resetTimeout,
    volumeThreshold: circuitBreakerConfig.volumeThreshold,
  },
});

/**
 * Export circuit stats getter for health endpoint
 */
export { getAllProxyCircuitStats };

export default router;
