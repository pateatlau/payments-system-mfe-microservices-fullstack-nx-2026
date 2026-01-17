/**
 * Auth Routes
 *
 * Authentication and user management endpoints
 */

import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * Public routes (no authentication required)
 */

// POST /auth/register - Register new user
router.post('/auth/register', authController.register);

// POST /auth/login - Login user
router.post('/auth/login', authController.login);

// POST /auth/refresh - Refresh access token
router.post('/auth/refresh', authController.refresh);

/**
 * Protected routes (authentication required)
 */

// GET /auth/me - Get current user
router.get('/auth/me', authenticate, authController.getMe);

// POST /auth/logout - Logout user
router.post('/auth/logout', authenticate, authController.logout);

// POST /auth/password - Change password
router.post('/auth/password', authenticate, authController.changePassword);

/**
 * Internal user lookup routes (for service-to-service validation)
 * Note: In production, protect with network policies or service tokens.
 */
router.get('/auth/internal/users', authController.listUsersInternal);
router.get(
  '/auth/internal/users/by-email',
  authController.getUserByEmailInternal
);
router.get('/auth/internal/users/:id', authController.getUserByIdInternal);

/**
 * Admin routes for account lockout management
 * Note: These should be protected by admin role check in production
 * Currently requires authentication but should also check for ADMIN role
 */

// GET /auth/admin/lockout/:email - Get account lockout status
router.get(
  '/auth/admin/lockout/:email',
  authenticate,
  authController.getAccountLockout
);

// POST /auth/admin/unlock/:email - Unlock a locked account
router.post(
  '/auth/admin/unlock/:email',
  authenticate,
  authController.unlockAccount
);

/**
 * Secret rotation admin routes (POC-3 Phase 3.1)
 * Note: These should be protected by admin role check in production
 */

// GET /auth/admin/secrets/status - Get secrets status (without exposing actual secrets)
router.get(
  '/auth/admin/secrets/status',
  authenticate,
  authController.getSecretsStatus
);

// POST /auth/admin/secrets/rotate - Rotate JWT secrets
router.post(
  '/auth/admin/secrets/rotate',
  authenticate,
  authController.rotateSecrets
);

// GET /auth/admin/secrets/rotation-history - Get rotation history
router.get(
  '/auth/admin/secrets/rotation-history',
  authenticate,
  authController.getRotationHistory
);

// POST /auth/admin/secrets/check-expiring - Check for expiring secrets
router.post(
  '/auth/admin/secrets/check-expiring',
  authenticate,
  authController.checkExpiringSecrets
);

export default router;
