/**
 * OAuth Routes
 *
 * Social login endpoints using Auth0 as federation layer
 *
 * IMPORTANT: Route order matters! Specific routes must come before parameterized routes.
 *
 * Public routes:
 * - GET  /auth/oauth/providers         - List supported providers
 * - GET  /auth/oauth/callback          - Handle OAuth callback
 * - GET  /auth/oauth/:provider         - Initiate OAuth flow
 *
 * Protected routes (require authentication):
 * - GET    /auth/oauth/accounts        - Get linked OAuth accounts
 * - POST   /auth/oauth/link/:provider  - Link OAuth account
 * - DELETE /auth/oauth/:provider       - Unlink OAuth account
 */

import { Router } from 'express';
import * as oauthController from '../controllers/oauth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * Specific routes MUST come before parameterized routes (:provider)
 * Otherwise Express will match 'accounts', 'providers', 'callback' as provider names
 */

// GET /auth/oauth/providers - Get list of supported OAuth providers
router.get('/auth/oauth/providers', oauthController.getSupportedProviders);

// GET /auth/oauth/callback - Handle OAuth callback from Auth0
router.get('/auth/oauth/callback', oauthController.handleOAuthCallback);

// GET /auth/oauth/accounts - Get linked OAuth accounts for current user (MUST be before :provider)
router.get('/auth/oauth/accounts', authenticate, oauthController.getLinkedAccounts);

// GET /auth/oauth/:provider - Initiate OAuth flow (redirect to provider)
// This catches all other GET requests, so it must be LAST among GET routes
router.get('/auth/oauth/:provider', oauthController.initiateOAuth);

/**
 * POST and DELETE routes (parameterized routes are fine here as they don't conflict)
 */

// POST /auth/oauth/link/:provider - Link OAuth account to current user
router.post('/auth/oauth/link/:provider', authenticate, oauthController.linkOAuthAccount);

// DELETE /auth/oauth/:provider - Unlink OAuth account from current user
router.delete('/auth/oauth/:provider', authenticate, oauthController.unlinkOAuthAccount);

export default router;
