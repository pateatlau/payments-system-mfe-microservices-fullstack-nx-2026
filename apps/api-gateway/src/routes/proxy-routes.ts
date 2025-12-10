/**
 * API Gateway Proxy Routes
 *
 * Purpose: Route definitions for proxying requests to backend microservices
 * Features:
 *   - Auth Service proxy (/api/auth -> http://localhost:3001)
 *   - Payments Service proxy (/api/payments -> http://localhost:3002)
 *   - Admin Service proxy (/api/admin -> http://localhost:3003)
 *   - Profile Service proxy (/api/profile -> http://localhost:3004)
 *
 * POC-3 Implementation: Production-ready streaming HTTP proxy
 */

import { Router } from 'express';
import { createServiceProxy, ProxyTarget } from '../middleware/proxy';
import { logger } from '../utils/logger';

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
 *   POST /api/auth/register -> http://localhost:3001/auth/register
 *   POST /api/auth/login -> http://localhost:3001/auth/login
 *   POST /api/auth/logout -> http://localhost:3001/auth/logout
 *   POST /api/auth/refresh -> http://localhost:3001/auth/refresh
 *   GET /api/auth/me -> http://localhost:3001/auth/me
 */
router.use('/api/auth', createServiceProxy('auth', services['auth']!, '/api/auth'));

/**
 * Payments Service Proxy
 *
 * Routes:
 *   GET /api/payments -> http://localhost:3002/api/payments
 *   POST /api/payments -> http://localhost:3002/api/payments
 *   GET /api/payments/:id -> http://localhost:3002/api/payments/:id
 *   PATCH /api/payments/:id/status -> http://localhost:3002/api/payments/:id/status
 */
router.use(
  '/api/payments',
  createServiceProxy('payments', services['payments']!, '/api/payments')
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
 */
router.use(
  '/api/admin',
  createServiceProxy('admin', services['admin']!, '/api/admin')
);

/**
 * Profile Service Proxy
 *
 * Routes:
 *   GET /api/profile -> http://localhost:3004/api/profile
 *   PUT /api/profile -> http://localhost:3004/api/profile
 *   GET /api/profile/preferences -> http://localhost:3004/api/profile/preferences
 *   PUT /api/profile/preferences -> http://localhost:3004/api/profile/preferences
 */
router.use(
  '/api/profile',
  createServiceProxy('profile', services['profile']!, '/api/profile')
);

/**
 * Log proxy route initialization
 */
logger.info('API Gateway proxy routes initialized', {
  services: Object.keys(services),
  routes: ['/api/auth', '/api/payments', '/api/admin', '/api/profile'],
});

export default router;
