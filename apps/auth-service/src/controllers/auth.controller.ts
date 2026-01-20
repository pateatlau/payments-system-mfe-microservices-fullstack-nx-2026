/**
 * Auth Controller
 *
 * HTTP handlers for authentication endpoints
 */

import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  uuidParamSchema,
  emailParamSchema,
} from '../validators/auth.validators';
import { mfaLoginCompleteSchema } from '../validators/mfa.validators';
import * as passwordResetService from '../services/password-reset.service';

// Import Prisma via dynamic require to avoid dist path issues
// eslint-disable-next-line @typescript-eslint/no-require-imports
const getPrisma = () => require('../lib/prisma').prisma;

/**
 * Helper to extract request metadata for fingerprinting
 */
const getRequestMeta = (req: Request) => ({
  ip: req.ip || req.socket.remoteAddress || 'unknown',
  userAgent: req.get('user-agent') || 'unknown',
});

/**
 * POST /auth/register
 * Register a new user
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate request body
    const data = registerSchema.parse(req.body);

    // Register user with request metadata for token fingerprinting
    const result = await authService.register(data, getRequestMeta(req));

    // Return response
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/login
 * Login a user
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate request body
    const data = loginSchema.parse(req.body);

    // Login user with request metadata for token fingerprinting
    const result = await authService.login(data, getRequestMeta(req));

    // Return response
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/mfa/complete:
 *   post:
 *     summary: Complete login after MFA verification
 *     description: Completes the two-factor authentication login flow by verifying the TOTP code or backup code. Called after initial login when MFA is required.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mfaToken
 *               - code
 *             properties:
 *               mfaToken:
 *                 type: string
 *                 description: Temporary MFA token received from initial login response
 *               code:
 *                 type: string
 *                 description: 6-digit TOTP code from authenticator app or 8-character backup code
 *                 minLength: 6
 *                 maxLength: 8
 *     responses:
 *       200:
 *         description: MFA verification successful, login complete
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *                       description: JWT access token
 *                     refreshToken:
 *                       type: string
 *                       description: JWT refresh token
 *                     expiresIn:
 *                       type: string
 *                       description: Access token expiry duration
 *       400:
 *         description: Invalid code format
 *       401:
 *         description: Invalid MFA token or code
 *       500:
 *         description: MFA verification error
 */
export const completeMfaLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate request body
    const data = mfaLoginCompleteSchema.parse(req.body);

    // Complete MFA login
    const result = await authService.completeMfaLogin(
      data.mfaToken,
      data.code,
      getRequestMeta(req)
    );

    // Return response
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/refresh
 * Refresh access token (with rotation - returns new refresh token too)
 */
export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate request body
    const data = refreshTokenSchema.parse(req.body);

    // Refresh token with rotation (returns new access AND refresh token)
    const result = await authService.refreshAccessToken(
      data.refreshToken,
      getRequestMeta(req)
    );

    // Return response with both tokens
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/logout
 * Logout a user (requires authentication)
 */
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get user ID from request (set by auth middleware)
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

    // Get refresh token from body
    const refreshToken = req.body.refreshToken;

    // Logout user
    await authService.logout(userId, refreshToken);

    // Return response
    res.status(200).json({
      success: true,
      data: {
        message: 'Logged out successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /auth/me
 * Get current user (requires authentication)
 */
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get user ID from request (set by auth middleware)
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

    // Get user
    const user = await authService.getUserById(userId);

    // Return response
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/password
 * Change user password (requires authentication)
 */
export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get user ID from request (set by auth middleware)
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

    // Validate request body
    const data = changePasswordSchema.parse(req.body);

    // Change password
    await authService.changePassword(
      userId,
      data.currentPassword,
      data.newPassword
    );

    // Return response
    res.status(200).json({
      success: true,
      data: {
        message: 'Password changed successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /auth/internal/users/by-email
 * Internal: Get minimal user info by email (id, email)
 */
export const getUserByEmailInternal = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const email = (req.query.email as string) || '';
    if (!email) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'email is required' },
      });
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /auth/internal/users/:id
 * Internal: Get minimal user info by id (id, email)
 */
export const getUserByIdInternal = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate UUID path parameter
    const { id: userId } = uuidParamSchema.parse(req.params);

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /auth/internal/users
 * Internal: Get all users (id, email, name) for recipient selection
 */
export const listUsersInternal = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const prisma = getPrisma();
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

// Import login attempts service for admin functions
import {
  unlockAccount as unlockAccountService,
  getAccountLockoutStatus,
  getFailedAttemptCount,
} from '../services/login-attempts.service';

/**
 * GET /auth/admin/lockout/:email
 * Admin: Get account lockout status
 */
export const getAccountLockout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate email path parameter
    const { email } = emailParamSchema.parse(req.params);

    const lockout = await getAccountLockoutStatus(email);
    const failedAttempts = await getFailedAttemptCount(email);

    return res.status(200).json({
      success: true,
      data: {
        email,
        isLocked: !!lockout,
        failedAttempts,
        lockout: lockout
          ? {
              lockedAt: lockout.lockedAt,
              unlockAt: lockout.unlockAt,
              reason: lockout.reason,
              failedAttempts: lockout.failedAttempts,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/admin/unlock/:email
 * Admin: Unlock a locked account
 */
export const unlockAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate email path parameter
    const { email } = emailParamSchema.parse(req.params);

    await unlockAccountService(email);

    return res.status(200).json({
      success: true,
      data: {
        message: `Account ${email} has been unlocked`,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Import SecretManager for admin secret management
import { getSecretManager } from '../config';
import { SecretManager } from '@payments-system/secrets';
import { z } from 'zod';

// Validation schema for secret rotation request
const rotateSecretsSchema = z.object({
  type: z.enum(['jwt', 'refresh', 'both']).default('both'),
  reason: z.string().min(1).max(500),
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

/**
 * Helper to check admin role
 * Returns 403 response if not admin, null if authorized
 */
const requireAdmin = (req: Request, res: Response): Response | null => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required',
      },
    });
  }
  return null;
};

/**
 * @swagger
 * /auth/admin/secrets/status:
 *   get:
 *     summary: Get status of all JWT secrets
 *     description: Returns the status of all JWT and refresh secrets without exposing actual secret values. Requires ADMIN role.
 *     tags:
 *       - Admin - Secrets
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Secrets status retrieved successfully
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
 *                     jwtSecrets:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           kid:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           expiresAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                           isActive:
 *                             type: boolean
 *                           canVerify:
 *                             type: boolean
 *                     refreshSecrets:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
export const getSecretsStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check admin role
    const forbidden = requireAdmin(req, res);
    if (forbidden) return forbidden;

    const secretManager = getSecretManager();
    const status = secretManager.getSecretsStatus();

    return res.status(200).json({
      success: true,
      data: {
        jwtSecrets: status.jwtSecrets.map((s) => ({
          kid: s.kid,
          createdAt: s.createdAt,
          expiresAt: s.expiresAt,
          isActive: s.isActive,
          canVerify: s.canVerify,
        })),
        refreshSecrets: status.refreshSecrets.map((s) => ({
          kid: s.kid,
          createdAt: s.createdAt,
          expiresAt: s.expiresAt,
          isActive: s.isActive,
          canVerify: s.canVerify,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/admin/secrets/rotate:
 *   post:
 *     summary: Rotate JWT secrets
 *     description: Generates new JWT and/or refresh secrets. Requires ADMIN role. Note that this affects the current service instance only; for production use, update environment variables and restart services.
 *     tags:
 *       - Admin - Secrets
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [jwt, refresh, both]
 *                 default: both
 *                 description: Which secrets to rotate
 *               reason:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 500
 *                 description: Reason for rotation (for audit)
 *               expiresInDays:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 365
 *                 description: Days until the new secret expires
 *     responses:
 *       200:
 *         description: Secrets rotated successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
export const rotateSecrets = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check admin role
    const forbidden = requireAdmin(req, res);
    if (forbidden) return forbidden;

    // Validate request body
    const data = rotateSecretsSchema.parse(req.body);

    const secretManager = getSecretManager();
    const triggeredBy = req.user?.email || 'unknown';
    const results: {
      jwt?: { kid: string; envValue: string };
      refresh?: { kid: string; envValue: string };
    } = {};

    // Generate new secrets
    if (data.type === 'jwt' || data.type === 'both') {
      const newJwtSecret = SecretManager.generateSecret({
        expiresInDays: data.expiresInDays,
      });

      // Rotate the secret in memory (affects current instance only)
      secretManager.rotateJwtSecret(newJwtSecret, triggeredBy, data.reason);

      results.jwt = {
        kid: newJwtSecret.kid,
        // Generate the env value (includes actual secret for admin to set)
        envValue: `Set JWT_SECRETS env var to include new secret with kid "${newJwtSecret.kid}". ` +
          `See rotation history for details.`,
      };

      console.log(
        `[Auth Admin] JWT secret rotated by ${triggeredBy}: ${newJwtSecret.kid}`
      );
    }

    if (data.type === 'refresh' || data.type === 'both') {
      const newRefreshSecret = SecretManager.generateSecret({
        expiresInDays: data.expiresInDays,
      });

      // Rotate the secret in memory
      secretManager.rotateRefreshSecret(newRefreshSecret, triggeredBy, data.reason);

      results.refresh = {
        kid: newRefreshSecret.kid,
        envValue: `Set JWT_REFRESH_SECRETS env var to include new secret with kid "${newRefreshSecret.kid}". ` +
          `See rotation history for details.`,
      };

      console.log(
        `[Auth Admin] Refresh secret rotated by ${triggeredBy}: ${newRefreshSecret.kid}`
      );
    }

    return res.status(200).json({
      success: true,
      data: {
        message: 'Secrets rotated successfully for current instance. ' +
          'Note: To persist rotation, update environment variables and restart all services.',
        rotated: results,
        warning: 'This rotation affects the current service instance only. ' +
          'For production, implement proper secret distribution via secrets manager (e.g., Vault, AWS KMS).',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/admin/secrets/rotation-history:
 *   get:
 *     summary: Get secret rotation history
 *     description: Returns the history of all secret rotations performed. Requires ADMIN role.
 *     tags:
 *       - Admin - Secrets
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rotation history retrieved successfully
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
 *                     rotations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           rotatedAt:
 *                             type: string
 *                             format: date-time
 *                           oldKid:
 *                             type: string
 *                           newKid:
 *                             type: string
 *                           triggeredBy:
 *                             type: string
 *                           reason:
 *                             type: string
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
export const getRotationHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check admin role
    const forbidden = requireAdmin(req, res);
    if (forbidden) return forbidden;

    const secretManager = getSecretManager();
    const history = secretManager.getRotationHistory();

    return res.status(200).json({
      success: true,
      data: {
        rotations: history.map((r) => ({
          rotatedAt: r.rotatedAt,
          oldKid: r.oldKid,
          newKid: r.newKid,
          triggeredBy: r.triggeredBy,
          reason: r.reason,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/admin/secrets/check-expiring:
 *   post:
 *     summary: Check for expiring secrets
 *     description: Checks for secrets that are expiring soon (within 30 days) and triggers warnings. Requires ADMIN role.
 *     tags:
 *       - Admin - Secrets
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expiry check completed
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
 *                     message:
 *                       type: string
 *                     expiringSecrets:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           kid:
 *                             type: string
 *                           expiresAt:
 *                             type: string
 *                             format: date-time
 *                           daysUntilExpiry:
 *                             type: integer
 *                             nullable: true
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
export const checkExpiringSecrets = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check admin role
    const forbidden = requireAdmin(req, res);
    if (forbidden) return forbidden;

    const secretManager = getSecretManager();

    // This will log warnings and disable expired secrets
    secretManager.checkExpiringSecrets();

    const status = secretManager.getSecretsStatus();

    // Find secrets that are expiring soon (within 30 days)
    const now = new Date();
    const warningThreshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const expiringSecrets = [
      ...status.jwtSecrets,
      ...status.refreshSecrets,
    ].filter((s) => s.expiresAt && new Date(s.expiresAt) <= warningThreshold);

    return res.status(200).json({
      success: true,
      data: {
        message: 'Secret expiry check complete',
        expiringSecrets: expiringSecrets.map((s) => ({
          kid: s.kid,
          expiresAt: s.expiresAt,
          daysUntilExpiry: s.expiresAt
            ? Math.ceil(
                (new Date(s.expiresAt).getTime() - now.getTime()) /
                  (24 * 60 * 60 * 1000)
              )
            : null,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// PASSWORD RESET ENDPOINTS
// ============================================================================

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: |
 *       Initiates a password reset flow by generating a reset token.
 *       For security, always returns success to prevent email enumeration.
 *       In production, the token would be sent via email.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address to send reset link to
 *     responses:
 *       200:
 *         description: |
 *           Password reset request processed. Check email for reset link.
 *           Note: Always returns success to prevent email enumeration.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: If an account exists with this email, you will receive a password reset link shortly.
 *       429:
 *         description: Too many reset requests. Try again later.
 */
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate request body
    const data = forgotPasswordSchema.parse(req.body);

    // Request password reset
    const result = await passwordResetService.requestPasswordReset(data.email);

    // In development/POC, return the token for testing
    // In production, this would be sent via email only
    // SECURITY: Use explicit whitelist to prevent accidental token exposure
    // when NODE_ENV is undefined or set to an unexpected value
    const isDevelopment =
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'local' ||
      process.env.ALLOW_DEV_TOKENS === 'true';

    if (isDevelopment && result.token) {
      // DEV ONLY: Return token for testing
      // In production, remove this and send email instead
      return res.status(200).json({
        success: true,
        data: {
          message:
            'If an account exists with this email, you will receive a password reset link shortly.',
          // DEV ONLY: Token info for testing
          _dev: {
            token: result.token,
            userId: result.userId,
            expiresAt: result.expiresAt,
            resetUrl: `https://localhost/reset-password?userId=${result.userId}&token=${result.token}`,
          },
        },
      });
    }

    // Production response - never reveals if email exists
    return res.status(200).json({
      success: true,
      data: {
        message:
          'If an account exists with this email, you will receive a password reset link shortly.',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     description: |
 *       Resets the user's password using a valid reset token.
 *       The token is single-use and expires after 15 minutes.
 *       All existing sessions are invalidated after password reset.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - token
 *               - newPassword
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 description: User ID from reset link
 *               token:
 *                 type: string
 *                 minLength: 64
 *                 maxLength: 64
 *                 description: Reset token from reset link (64 hex characters)
 *               newPassword:
 *                 type: string
 *                 minLength: 12
 *                 description: |
 *                   New password. Must be at least 12 characters with:
 *                   - At least one uppercase letter
 *                   - At least one lowercase letter
 *                   - At least one number
 *                   - At least one special character
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Password has been reset successfully. Please log in with your new password.
 *       400:
 *         description: Invalid or expired reset token
 *       422:
 *         description: Password does not meet requirements
 */
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate request body
    const data = resetPasswordSchema.parse(req.body);

    // Reset password
    const result = await passwordResetService.resetPassword(
      data.userId,
      data.token,
      data.newPassword
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
