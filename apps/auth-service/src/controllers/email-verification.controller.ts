/**
 * Email Verification Controller
 *
 * HTTP handlers for email verification endpoints
 *
 * POC-3: Email Verification Implementation (Priority 1.2)
 *
 * Endpoints:
 * - POST /auth/verify-email - Verify email with token (API call)
 * - GET /auth/verify-email/:token - Verify email (clickable link from email)
 * - POST /auth/resend-verification - Resend verification email
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { cache, CacheTags } from '../lib/cache';
import {
  verifyEmailSchema,
  verifyEmailParamSchema,
  resendVerificationSchema,
} from '../validators/email-verification.validators';
import {
  validateVerificationToken,
  consumeVerificationToken,
  generateVerificationToken,
} from '../services/email-verification.service';
import { publishUserUpdated } from '../events/publisher';
import { ApiError } from '../middleware/errorHandler';

/**
 * Helper to mask email for privacy-safe responses
 */
function maskEmailForResponse(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return '***@***';
  if (localPart.length <= 2) return `${localPart[0]}*@${domain}`;
  return `${localPart[0]}${'*'.repeat(Math.min(localPart.length - 2, 5))}${localPart[localPart.length - 1]}@${domain}`;
}

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Verify email address with token
 *     description: |
 *       Verifies the user's email address using a JWT verification token.
 *       The token is single-use and expires after 24 hours.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: JWT verification token from email link
 *     responses:
 *       200:
 *         description: Email verified successfully
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
 *                       example: Email verified successfully. You can now log in.
 *       400:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       enum: [TOKEN_EXPIRED, INVALID_TOKEN, TOKEN_ALREADY_USED, ALREADY_VERIFIED]
 *                     message:
 *                       type: string
 */
export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate request body
    const { token } = verifyEmailSchema.parse(req.body);

    // Validate the token
    const payload = await validateVerificationToken(token);

    // Check if user exists and is not already verified
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, emailVerified: true },
    });

    if (!user) {
      throw new ApiError(400, 'INVALID_TOKEN', 'Invalid verification link.');
    }

    // Check if already verified
    if (user.emailVerified) {
      // Consume the token anyway to prevent reuse
      await consumeVerificationToken(payload.userId);

      return res.status(200).json({
        success: true,
        data: {
          message: 'Your email is already verified. You can log in.',
          alreadyVerified: true,
        },
      });
    }

    // Verify email matches token
    if (user.email !== payload.email) {
      throw new ApiError(
        400,
        'INVALID_TOKEN',
        'Invalid verification link. Please request a new one.'
      );
    }

    // Update user's emailVerified status
    await prisma.user.update({
      where: { id: payload.userId },
      data: { emailVerified: true },
    });

    // Consume the token (single-use enforcement)
    await consumeVerificationToken(payload.userId);

    // Invalidate user cache
    await cache.invalidateByTag(CacheTags.user(payload.userId));

    // Publish user.updated event to sync emailVerified status to other services
    try {
      await publishUserUpdated({
        userId: payload.userId,
        emailVerified: true,
        updatedAt: new Date().toISOString(),
      });
    } catch (eventError) {
      // Log but don't fail - verification succeeded
      console.error('[Email Verification] Failed to publish user.updated event:', eventError);
    }

    console.log(`[Email Verification] Email verified for user ${payload.userId}`);

    return res.status(200).json({
      success: true,
      data: {
        message: 'Email verified successfully. You can now log in.',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/verify-email/{token}:
 *   get:
 *     summary: Verify email via clickable link
 *     description: |
 *       Verifies the user's email address using a token from a clickable email link.
 *       Can optionally redirect to frontend after verification.
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: JWT verification token
 *       - in: query
 *         name: redirect
 *         schema:
 *           type: boolean
 *           default: false
 *         description: If true, redirects to frontend login page after verification
 *     responses:
 *       200:
 *         description: Email verified successfully (when redirect=false)
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
 *       302:
 *         description: Redirect to frontend (when redirect=true)
 *       400:
 *         description: Invalid or expired token
 */
export const verifyEmailByLink = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate path parameter
    const { token } = verifyEmailParamSchema.parse(req.params);
    const shouldRedirect = req.query.redirect === 'true';

    // Validate the token
    const payload = await validateVerificationToken(token);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, emailVerified: true },
    });

    if (!user) {
      if (shouldRedirect) {
        return res.redirect('/login?error=invalid_token');
      }
      throw new ApiError(400, 'INVALID_TOKEN', 'Invalid verification link.');
    }

    // Check if already verified
    if (user.emailVerified) {
      await consumeVerificationToken(payload.userId);

      if (shouldRedirect) {
        return res.redirect('/login?verified=already');
      }

      return res.status(200).json({
        success: true,
        data: {
          message: 'Your email is already verified. You can log in.',
          alreadyVerified: true,
        },
      });
    }

    // Verify email matches
    if (user.email !== payload.email) {
      if (shouldRedirect) {
        return res.redirect('/login?error=invalid_token');
      }
      throw new ApiError(
        400,
        'INVALID_TOKEN',
        'Invalid verification link. Please request a new one.'
      );
    }

    // Update user's emailVerified status
    await prisma.user.update({
      where: { id: payload.userId },
      data: { emailVerified: true },
    });

    // Consume the token
    await consumeVerificationToken(payload.userId);

    // Invalidate user cache
    await cache.invalidateByTag(CacheTags.user(payload.userId));

    // Publish user.updated event to sync emailVerified status to other services
    try {
      await publishUserUpdated({
        userId: payload.userId,
        emailVerified: true,
        updatedAt: new Date().toISOString(),
      });
    } catch (eventError) {
      // Log but don't fail - verification succeeded
      console.error('[Email Verification] Failed to publish user.updated event:', eventError);
    }

    console.log(
      `[Email Verification] Email verified via link for user ${payload.userId}`
    );

    if (shouldRedirect) {
      return res.redirect('/login?verified=success');
    }

    return res.status(200).json({
      success: true,
      data: {
        message: 'Email verified successfully. You can now log in.',
      },
    });
  } catch (error) {
    // Handle redirect for errors
    if (req.query.redirect === 'true' && error instanceof ApiError) {
      const errorParam = error.code.toLowerCase().replace(/_/g, '-');
      return res.redirect(`/login?error=${errorParam}`);
    }
    next(error);
  }
};

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     description: |
 *       Requests a new verification email to be sent.
 *       For security, always returns success to prevent email enumeration.
 *       Rate limited to 3 requests per hour per email.
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
 *                 description: Email address to send verification link to
 *     responses:
 *       200:
 *         description: |
 *           Verification email request processed.
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
 *                       example: If an account exists with this email and is not yet verified, a verification link has been sent.
 *       429:
 *         description: Too many resend requests. Try again later.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: RATE_LIMITED
 *                     message:
 *                       type: string
 *                     data:
 *                       type: object
 *                       properties:
 *                         retryAfter:
 *                           type: integer
 *                           description: Seconds until next request allowed
 */
export const resendVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate request body
    const { email } = resendVerificationSchema.parse(req.body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, emailVerified: true },
    });

    // SECURITY: Always return success to prevent email enumeration
    const successResponse = {
      success: true,
      data: {
        message:
          'If an account exists with this email and is not yet verified, a verification link has been sent.',
      },
    };

    // If user doesn't exist, return success (prevent enumeration)
    if (!user) {
      console.log(
        `[Email Verification] Resend requested for non-existent email ${maskEmailForResponse(email)}`
      );
      return res.status(200).json(successResponse);
    }

    // If already verified, return success (prevent enumeration)
    if (user.emailVerified) {
      console.log(
        `[Email Verification] Resend requested for already verified user ${user.id}`
      );
      return res.status(200).json(successResponse);
    }

    // Generate new verification token (will throw if rate limited)
    const result = await generateVerificationToken(user.id, user.email);

    // TODO (Phase 2): Publish email.verification.requested event to RabbitMQ
    // For now, return token in development mode for testing
    const isDevelopment =
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'local' ||
      process.env.ALLOW_DEV_TOKENS === 'true';

    if (isDevelopment && result.token) {
      console.log(
        `[Email Verification] Verification email resent for user ${user.id}`
      );

      return res.status(200).json({
        success: true,
        data: {
          message:
            'If an account exists with this email and is not yet verified, a verification link has been sent.',
          // DEV ONLY: Token info for testing
          _dev: {
            token: result.token,
            userId: user.id,
            expiresAt: result.expiresAt,
            verifyUrl: `https://localhost/verify-email?token=${result.token}`,
          },
        },
      });
    }

    console.log(
      `[Email Verification] Verification email resent for user ${user.id}`
    );

    return res.status(200).json(successResponse);
  } catch (error) {
    // Pass rate limit errors through
    if (error instanceof ApiError && error.code === 'RATE_LIMITED') {
      next(error);
      return;
    }

    // For other errors, log and return success (prevent enumeration)
    console.error('[Email Verification] Resend error:', error);
    return res.status(200).json({
      success: true,
      data: {
        message:
          'If an account exists with this email and is not yet verified, a verification link has been sent.',
      },
    });
  }
};
