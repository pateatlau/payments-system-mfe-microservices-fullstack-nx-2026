/**
 * OAuth Routes
 *
 * Social login endpoints using Auth0 as federation layer
 *
 * Public routes:
 * - GET  /auth/oauth/providers         - List supported providers
 * - GET  /auth/oauth/:provider         - Initiate OAuth flow
 * - GET  /auth/oauth/callback          - Handle OAuth callback
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
 * Public routes (no authentication required)
 */

// GET /auth/oauth/providers - Get list of supported OAuth providers
router.get('/auth/oauth/providers', oauthController.getSupportedProviders);

// GET /auth/oauth/callback - Handle OAuth callback from Auth0
// Must come before :provider to avoid matching 'callback' as provider
router.get('/auth/oauth/callback', oauthController.handleOAuthCallback);

// GET /auth/oauth/:provider - Initiate OAuth flow (redirect to provider)
router.get('/auth/oauth/:provider', oauthController.initiateOAuth);

/**
 * Protected routes (authentication required)
 */

// GET /auth/oauth/accounts - Get linked OAuth accounts for current user
router.get('/auth/oauth/accounts', authenticate, oauthController.getLinkedAccounts);

// POST /auth/oauth/link/:provider - Link OAuth account to current user
router.post('/auth/oauth/link/:provider', authenticate, oauthController.linkOAuthAccount);

// DELETE /auth/oauth/:provider - Unlink OAuth account from current user
router.delete('/auth/oauth/:provider', authenticate, oauthController.unlinkOAuthAccount);

export default router;
