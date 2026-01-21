/**
 * OAuth Controller
 *
 * HTTP handlers for OAuth/Social login endpoints
 *
 * Endpoints:
 * - GET  /oauth/:provider        - Initiate OAuth flow (redirect to Auth0)
 * - GET  /oauth/callback         - Handle Auth0 callback
 * - GET  /oauth/providers        - List supported providers
 * - GET  /oauth/accounts         - Get linked OAuth accounts (authenticated)
 * - POST /oauth/link/:provider   - Link OAuth account (authenticated)
 * - DELETE /oauth/:provider      - Unlink OAuth account (authenticated)
 */

import { Request, Response, NextFunction } from 'express';
import * as oauthService from '../services/oauth.service';
import {
  oauthInitiateSchema,
  oauthCallbackSchema,
  oauthLinkSchema,
  oauthUnlinkSchema,
} from '../validators/oauth.validators';

/**
 * Helper to extract request metadata for fingerprinting
 */
const getRequestMeta = (req: Request) => ({
  ip: req.ip || req.socket.remoteAddress || 'unknown',
  userAgent: req.get('user-agent') || 'unknown',
});

/**
 * @swagger
 * /oauth/{provider}:
 *   get:
 *     summary: Initiate OAuth login flow
 *     description: |
 *       Redirects the user to the social provider's login page via Auth0.
 *       After successful authentication, the user will be redirected back
 *       to /oauth/callback with an authorization code.
 *     tags:
 *       - OAuth
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [google, github, facebook, linkedin, twitter]
 *         description: Social login provider
 *       - in: query
 *         name: returnUrl
 *         schema:
 *           type: string
 *         description: URL to redirect after successful login (default '/')
 *     responses:
 *       302:
 *         description: Redirect to provider's OAuth page
 *       400:
 *         description: Invalid provider
 */
export const initiateOAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate provider from path and returnUrl from query
    const params = oauthInitiateSchema.parse({
      provider: req.params.provider,
      returnUrl: req.query.returnUrl || '/',
    });

    // Initiate OAuth flow
    const result = await oauthService.initiateOAuthFlow(
      params.provider,
      params.returnUrl
    );

    // Redirect to authorization URL
    res.redirect(302, result.authorizationUrl);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /oauth/callback:
 *   get:
 *     summary: Handle OAuth callback
 *     description: |
 *       Handles the callback from Auth0 after successful OAuth authentication.
 *       Exchanges the authorization code for tokens and creates/links user account.
 *
 *       On success:
 *       - New user: Creates account, returns tokens
 *       - Existing user: Returns tokens
 *       - MFA enabled: Returns mfaRequired flag and mfaToken
 *
 *       Redirects to frontend with tokens in URL fragment for security.
 *     tags:
 *       - OAuth
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Authorization code from Auth0
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *         description: State parameter for CSRF validation
 *       - in: query
 *         name: error
 *         schema:
 *           type: string
 *         description: Error code if OAuth failed
 *       - in: query
 *         name: error_description
 *         schema:
 *           type: string
 *         description: Error description if OAuth failed
 *     responses:
 *       302:
 *         description: Redirect to frontend with auth result
 *       400:
 *         description: Invalid state or OAuth error
 */
export const handleOAuthCallback = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    // Validate callback params
    const params = oauthCallbackSchema.parse(req.query);

    // Check for OAuth errors from provider
    if (params.error) {
      const errorMessage = params.error_description || params.error;
      console.error(`[OAuth] Provider error: ${errorMessage}`);

      // Redirect to frontend with error
      const errorUrl = `/signin?error=oauth_failed&message=${encodeURIComponent(errorMessage)}`;
      return res.redirect(302, errorUrl);
    }

    // Handle callback - code and state are guaranteed by validation when no error
    const result = await oauthService.handleOAuthCallback(
      params.code!,
      params.state!,
      getRequestMeta(req)
    );

    // Build redirect URL based on result
    if (result.mfaRequired) {
      // MFA required - redirect to signin page with MFA token
      // SignIn component will detect the token and show MFA verification form
      const mfaUrl = `/signin?mfaToken=${result.mfaToken}`;
      return res.redirect(302, mfaUrl);
    }

    // Success - redirect to frontend with tokens in URL fragment
    // URL fragment (#) is not sent to server, providing security benefit
    const successParams = new URLSearchParams({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
    });

    if (result.isNewUser) {
      successParams.set('isNewUser', 'true');
    }

    // Redirect to callback handler page that will store tokens and redirect
    const callbackUrl = `/oauth/success#${successParams.toString()}`;
    return res.redirect(302, callbackUrl);
  } catch (error) {
    // Log error and redirect to signin with error
    console.error('[OAuth] Callback error:', error);
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('[OAuth] Error name:', error.name);
      console.error('[OAuth] Error message:', error.message);
      console.error('[OAuth] Error stack:', error.stack);
    }

    const errorMessage = error instanceof Error ? error.message : 'OAuth authentication failed';
    console.log('[OAuth] Redirecting to signin with error:', errorMessage);
    const errorUrl = `/signin?error=oauth_failed&message=${encodeURIComponent(errorMessage)}`;
    return res.redirect(302, errorUrl);
  }
};

/**
 * @swagger
 * /oauth/providers:
 *   get:
 *     summary: Get supported OAuth providers
 *     description: Returns list of supported social login providers
 *     tags:
 *       - OAuth
 *     responses:
 *       200:
 *         description: List of supported providers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     providers:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ['google', 'github', 'facebook', 'linkedin', 'twitter']
 */
export const getSupportedProviders = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const providers = oauthService.getSupportedProviders();

    return res.status(200).json({
      success: true,
      data: { providers },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /oauth/accounts:
 *   get:
 *     summary: Get linked OAuth accounts
 *     description: Returns list of OAuth accounts linked to the current user
 *     tags:
 *       - OAuth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of linked OAuth accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     accounts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           provider:
 *                             type: string
 *                           email:
 *                             type: string
 *                             nullable: true
 *                           name:
 *                             type: string
 *                             nullable: true
 *                           linkedAt:
 *                             type: string
 *                             format: date-time
 *       401:
 *         description: Authentication required
 */
export const getLinkedAccounts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const accounts = await oauthService.getLinkedOAuthAccounts(userId);

    return res.status(200).json({
      success: true,
      data: { accounts },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /oauth/link/{provider}:
 *   post:
 *     summary: Link OAuth account to current user
 *     description: |
 *       Initiates OAuth flow to link a social account to the current user.
 *       Redirects to provider's OAuth page, then back to callback.
 *     tags:
 *       - OAuth
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [google, github, facebook, linkedin, twitter]
 *         description: Social provider to link
 *     responses:
 *       302:
 *         description: Redirect to provider's OAuth page
 *       400:
 *         description: Invalid provider or already linked
 *       401:
 *         description: Authentication required
 */
export const linkOAuthAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    // Validate provider
    const params = oauthLinkSchema.parse({ provider: req.params.provider });

    // Initiate OAuth flow with userId for linking
    const result = await oauthService.initiateOAuthFlow(
      params.provider,
      '/profile/settings', // Return to profile settings after linking
      userId // Pass userId for account linking
    );

    // Redirect to authorization URL
    res.redirect(302, result.authorizationUrl);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /oauth/{provider}:
 *   delete:
 *     summary: Unlink OAuth account
 *     description: |
 *       Removes the link between a social account and the current user.
 *       User must have a password or another OAuth account to unlink.
 *     tags:
 *       - OAuth
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [google, github, facebook, linkedin, twitter]
 *         description: Social provider to unlink
 *     responses:
 *       200:
 *         description: OAuth account unlinked successfully
 *       400:
 *         description: Cannot unlink (no other login method)
 *       401:
 *         description: Authentication required
 *       404:
 *         description: OAuth account not linked
 */
export const unlinkOAuthAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    // Validate provider
    const params = oauthUnlinkSchema.parse({ provider: req.params.provider });

    // Unlink account
    await oauthService.unlinkOAuthAccount(userId, params.provider);

    return res.status(200).json({
      success: true,
      data: {
        message: `${params.provider} account unlinked successfully`,
      },
    });
  } catch (error) {
    next(error);
  }
};
