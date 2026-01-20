/**
 * MFA Controller
 *
 * HTTP handlers for Multi-Factor Authentication endpoints
 *
 * POC-3 Backend Hardening - Priority 7.1: Multi-Factor Authentication
 */

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import * as mfaService from '../services/mfa.service';
import { prisma } from '../lib/prisma';
import {
  mfaSetupVerifySchema,
  mfaVerifySchema,
  mfaDisableSchema,
  mfaRegenerateBackupCodesSchema,
} from '../validators/mfa.validators';

/**
 * POST /auth/mfa/setup
 * Generate MFA setup (secret + QR code + backup codes)
 *
 * @swagger
 * /auth/mfa/setup:
 *   post:
 *     summary: Generate MFA setup
 *     description: Generates TOTP secret, QR code, and backup codes for MFA setup. Requires authentication.
 *     tags:
 *       - MFA
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: MFA setup data generated successfully
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
 *                     secret:
 *                       type: string
 *                       description: Base32 encoded secret (show to user once)
 *                     qrCodeDataUrl:
 *                       type: string
 *                       description: Data URL for QR code image
 *                     backupCodes:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: One-time backup codes (show to user once)
 *                     manualEntryKey:
 *                       type: string
 *                       description: Key for manual entry in authenticator app
 *       401:
 *         description: Authentication required
 *       409:
 *         description: MFA already enabled
 */
export const setupMfa = async (
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

    const result = await mfaService.generateMfaSetup(userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/mfa/verify-setup
 * Verify MFA setup with TOTP code
 *
 * @swagger
 * /auth/mfa/verify-setup:
 *   post:
 *     summary: Verify MFA setup
 *     description: Completes MFA setup by verifying a TOTP code from the authenticator app.
 *     tags:
 *       - MFA
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - totpCode
 *             properties:
 *               totpCode:
 *                 type: string
 *                 description: 6-digit TOTP code from authenticator app
 *     responses:
 *       200:
 *         description: MFA enabled successfully
 *       400:
 *         description: MFA not set up
 *       401:
 *         description: Invalid TOTP code or authentication required
 *       409:
 *         description: MFA already verified
 */
export const verifyMfaSetup = async (
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

    const data = mfaSetupVerifySchema.parse(req.body);
    const result = await mfaService.verifyMfaSetup(userId, data.totpCode);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/mfa/verify
 * Verify MFA code (TOTP or backup code) during login
 *
 * @swagger
 * /auth/mfa/verify:
 *   post:
 *     summary: Verify MFA code
 *     description: Verifies a TOTP code or backup code during login. Called after initial password verification when MFA is enabled.
 *     tags:
 *       - MFA
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - code
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 description: User ID from initial login response
 *               code:
 *                 type: string
 *                 description: 6-digit TOTP code or 8-character backup code
 *     responses:
 *       200:
 *         description: MFA code verified successfully
 *       400:
 *         description: Invalid code format
 *       401:
 *         description: Invalid MFA code
 */
export const verifyMfaCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = mfaVerifySchema.parse(req.body);
    const verified = await mfaService.verifyMfaCode(data.userId, data.code);

    if (!verified) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_MFA_CODE',
          message: 'Invalid MFA code. Please try again.',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        verified: true,
        message: 'MFA verification successful.',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /auth/mfa/status
 * Get MFA status for current user
 *
 * @swagger
 * /auth/mfa/status:
 *   get:
 *     summary: Get MFA status
 *     description: Returns MFA enabled status and remaining backup codes for the authenticated user.
 *     tags:
 *       - MFA
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: MFA status retrieved successfully
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
 *                     enabled:
 *                       type: boolean
 *                     verified:
 *                       type: boolean
 *                     backupCodesRemaining:
 *                       type: integer
 *       401:
 *         description: Authentication required
 */
export const getMfaStatus = async (
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

    const status = await mfaService.getMfaStatus(userId);

    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/mfa/disable
 * Disable MFA for current user
 *
 * @swagger
 * /auth/mfa/disable:
 *   post:
 *     summary: Disable MFA
 *     description: Disables MFA for the authenticated user. Requires current password and TOTP code for verification.
 *     tags:
 *       - MFA
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - totpCode
 *             properties:
 *               password:
 *                 type: string
 *                 description: Current password for verification
 *               totpCode:
 *                 type: string
 *                 description: Current TOTP code for verification
 *     responses:
 *       200:
 *         description: MFA disabled successfully
 *       400:
 *         description: MFA not enabled
 *       401:
 *         description: Invalid password or TOTP code
 */
export const disableMfa = async (
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

    const data = mfaDisableSchema.parse(req.body);

    // Verify password first
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    const passwordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Invalid password',
        },
      });
    }

    // Verify TOTP code
    const totpValid = await mfaService.verifyTotpCode(userId, data.totpCode);
    if (!totpValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOTP_CODE',
          message: 'Invalid TOTP code',
        },
      });
    }

    // Disable MFA
    const result = await mfaService.disableMfa(userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/mfa/backup-codes/regenerate
 * Regenerate backup codes
 *
 * @swagger
 * /auth/mfa/backup-codes/regenerate:
 *   post:
 *     summary: Regenerate backup codes
 *     description: Generates new backup codes, invalidating all existing ones. Requires TOTP verification.
 *     tags:
 *       - MFA
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - totpCode
 *             properties:
 *               totpCode:
 *                 type: string
 *                 description: Current TOTP code for verification
 *     responses:
 *       200:
 *         description: Backup codes regenerated successfully
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
 *                     backupCodes:
 *                       type: array
 *                       items:
 *                         type: string
 *       401:
 *         description: Invalid TOTP code or authentication required
 */
export const regenerateBackupCodes = async (
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

    const data = mfaRegenerateBackupCodesSchema.parse(req.body);
    const result = await mfaService.regenerateBackupCodes(userId, data.totpCode);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
