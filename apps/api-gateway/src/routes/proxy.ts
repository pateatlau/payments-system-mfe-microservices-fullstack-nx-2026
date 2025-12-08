/**
 * Service Proxy Routes
 *
 * Configures request proxying to backend services
 */

import express, { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from '../config';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';
import { authRateLimiter } from '../middleware/rateLimit';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Auth Service Routes
 * Public routes: /api/auth/login, /api/auth/register, /api/auth/refresh
 * Protected routes: /api/auth/me, /api/auth/logout, /api/auth/password
 */
router.use(
  '/api/auth/login',
  authRateLimiter as unknown as express.RequestHandler,
  createProxyMiddleware({
    target: config.services.auth,
    changeOrigin: true,
    pathRewrite: {
      '^/api/auth': '/auth',
    },
    on: {
      proxyReq: (_proxyReq, req) => {
        logger.debug('Proxying to Auth Service', {
          path: req.url,
          target: config.services.auth,
        });
      },
    },
  })
);

router.use(
  '/api/auth/register',
  authRateLimiter as unknown as express.RequestHandler,
  createProxyMiddleware({
    target: config.services.auth,
    changeOrigin: true,
    pathRewrite: {
      '^/api/auth': '/auth',
    },
  })
);

router.use(
  '/api/auth/refresh',
  authRateLimiter as unknown as express.RequestHandler,
  createProxyMiddleware({
    target: config.services.auth,
    changeOrigin: true,
    pathRewrite: {
      '^/api/auth': '/auth',
    },
  })
);

// Protected auth routes
router.use(
  '/api/auth',
  authenticate,
  createProxyMiddleware({
    target: config.services.auth,
    changeOrigin: true,
    pathRewrite: {
      '^/api/auth': '/auth',
    },
  })
);

/**
 * Payments Service Routes
 * All routes require authentication
 * CUSTOMER can create payments, VENDOR can initiate payments
 */
router.use(
  '/api/payments',
  authenticate,
  createProxyMiddleware({
    target: config.services.payments,
    changeOrigin: true,
    pathRewrite: {
      '^/api/payments': '/payments',
    },
    on: {
      proxyReq: (_proxyReq, req) => {
        logger.debug('Proxying to Payments Service', {
          path: req.url,
          target: config.services.payments,
        });
      },
    },
  })
);

/**
 * Admin Service Routes
 * All routes require ADMIN role
 */
router.use(
  '/api/admin',
  authenticate,
  requireAdmin,
  createProxyMiddleware({
    target: config.services.admin,
    changeOrigin: true,
    pathRewrite: {
      '^/api/admin': '/admin',
    },
    on: {
      proxyReq: (_proxyReq, req) => {
        logger.debug('Proxying to Admin Service', {
          path: req.url,
          target: config.services.admin,
        });
      },
    },
  })
);

/**
 * Profile Service Routes
 * All routes require authentication
 */
router.use(
  '/api/profile',
  authenticate,
  createProxyMiddleware({
    target: config.services.profile,
    changeOrigin: true,
    pathRewrite: {
      '^/api/profile': '/profile',
    },
    on: {
      proxyReq: (_proxyReq, req) => {
        logger.debug('Proxying to Profile Service', {
          path: req.url,
          target: config.services.profile,
        });
      },
    },
  })
);

export default router;
