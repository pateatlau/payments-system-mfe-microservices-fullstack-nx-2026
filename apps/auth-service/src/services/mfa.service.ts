/**
 * MFA Service
 *
 * Business logic for Multi-Factor Authentication operations
 *
 * POC-3 Backend Hardening - Priority 7.1: Multi-Factor Authentication
 * - TOTP-based MFA using speakeasy
 * - QR code generation for authenticator app setup
 * - Backup codes for account recovery
 * - Encrypted storage of MFA secrets
 */

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { prisma, Prisma } from '../lib/prisma';
import type { PrismaClient } from '.prisma/auth-client';
import { ApiError } from '../middleware/errorHandler';
import { config } from '../config';

// Type for Prisma transaction client
type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

// ============================================================================
// CONFIGURATION
// ============================================================================

const MFA_CONFIG = {
  // TOTP settings
  issuer: 'MFE Payments System',
  algorithm: 'sha1' as const,
  digits: 6,
  step: 30, // 30-second window
  window: 1, // Allow 1 step before/after for clock drift

  // Backup codes
  backupCodeCount: 10,
  backupCodeLength: 8,

  // Encryption for storing secrets
  encryptionAlgorithm: 'aes-256-gcm',
};

// ============================================================================
// ENCRYPTION UTILITIES
// ============================================================================

// Cached encryption key to avoid repeated derivation and console warnings
let cachedEncryptionKey: Buffer | null = null;
let encryptionKeyWarningShown = false;

/**
 * Check if running in production environment
 */
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Get encryption key from environment or generate one
 * In production, MFA_ENCRYPTION_KEY must be provided.
 * In development, falls back to deriving key from JWT secret with configurable salt.
 * The key is cached after first computation to avoid repeated derivation and warnings.
 */
function getEncryptionKey(): Buffer {
  // Return cached key if available
  if (cachedEncryptionKey) {
    return cachedEncryptionKey;
  }

  const keyEnv = process.env.MFA_ENCRYPTION_KEY;
  if (keyEnv) {
    // Key should be 32 bytes (256 bits) for AES-256
    const key = Buffer.from(keyEnv, 'hex');
    if (key.length !== 32) {
      throw new Error(
        'MFA_ENCRYPTION_KEY must be 32 bytes (64 hex characters) for AES-256'
      );
    }
    cachedEncryptionKey = key;
    return key;
  }

  // In production, require explicit key
  if (isProduction()) {
    throw new Error(
      'MFA_ENCRYPTION_KEY environment variable is required in production. ' +
        'Generate a 32-byte key: openssl rand -hex 32'
    );
  }

  // Development fallback - derive key from JWT secret with configurable salt
  const salt = process.env.MFA_ENCRYPTION_SALT || 'mfa-dev-salt';
  const jwtSecret = config.jwtSecret || 'development-secret';

  // Only show warning once per process
  if (!encryptionKeyWarningShown) {
    console.warn(
      '[MFA] Using derived encryption key for development. ' +
        'Set MFA_ENCRYPTION_KEY in production.'
    );
    encryptionKeyWarningShown = true;
  }

  cachedEncryptionKey = crypto.scryptSync(jwtSecret, salt, 32);
  return cachedEncryptionKey;
}

/**
 * Encrypt a string using AES-256-GCM
 */
function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    MFA_CONFIG.encryptionAlgorithm,
    key,
    iv
  ) as crypto.CipherGCM;

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Return iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a string using AES-256-GCM
 */
function decrypt(encryptedText: string): string {
  const key = getEncryptionKey();
  const parts = encryptedText.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format');
  }

  const ivHex = parts[0];
  const authTagHex = parts[1];
  const encrypted = parts[2];

  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error('Invalid encrypted format');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(
    MFA_CONFIG.encryptionAlgorithm,
    key,
    iv
  ) as crypto.DecipherGCM;
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// ============================================================================
// BACKUP CODE UTILITIES
// ============================================================================

/**
 * Generate a single backup code
 */
function generateBackupCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < MFA_CONFIG.backupCodeLength; i++) {
    code += chars.charAt(crypto.randomInt(chars.length));
  }
  return code;
}

/**
 * Generate a set of backup codes
 */
function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < MFA_CONFIG.backupCodeCount; i++) {
    codes.push(generateBackupCode());
  }
  return codes;
}

/**
 * Hash a backup code for storage
 */
function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code.toUpperCase()).digest('hex');
}

// ============================================================================
// SERVICE TYPES
// ============================================================================

export interface MfaSetupResponse {
  secret: string; // Base32 encoded secret (shown once)
  qrCodeDataUrl: string; // Data URL for QR code
  backupCodes: string[]; // Plain text backup codes (shown once)
  manualEntryKey: string; // For manual entry in authenticator app
}

export interface MfaStatusResponse {
  enabled: boolean;
  verified: boolean;
  backupCodesRemaining: number;
}

// ============================================================================
// MFA SERVICE FUNCTIONS
// ============================================================================

/**
 * Generate MFA setup data (secret + QR code + backup codes)
 *
 * This creates a new MFA secret and stores it in the database (encrypted).
 * The user must verify with a TOTP code before MFA is fully enabled.
 *
 * @param userId - User ID
 * @returns MFA setup data including QR code and backup codes
 * @throws ApiError if user not found or MFA already enabled
 */
export async function generateMfaSetup(userId: string): Promise<MfaSetupResponse> {
  // Get user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
  }

  // Check if MFA is already enabled and verified
  if (user.mfaEnabled && user.mfaVerified) {
    throw new ApiError(
      409,
      'MFA_ALREADY_ENABLED',
      'MFA is already enabled. Disable it first to regenerate.'
    );
  }

  // Generate TOTP secret
  const secret = speakeasy.generateSecret({
    name: `${MFA_CONFIG.issuer}:${user.email}`,
    issuer: MFA_CONFIG.issuer,
    length: 32,
  });

  // Generate QR code as data URL
  const otpauthUrl = secret.otpauth_url || '';
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  // Generate backup codes
  const backupCodes = generateBackupCodes();

  // Hash backup codes for storage
  const hashedBackupCodes = backupCodes.map((code) => ({
    hash: hashBackupCode(code),
    used: false,
  }));

  // Encrypt the secret for storage
  const encryptedSecret = encrypt(secret.base32);
  const encryptedBackupCodes = encrypt(JSON.stringify(hashedBackupCodes));

  // Store in database (not yet verified/enabled)
  await prisma.user.update({
    where: { id: userId },
    data: {
      mfaSecret: encryptedSecret,
      mfaBackupCodes: encryptedBackupCodes,
      mfaEnabled: false,
      mfaVerified: false,
    },
  });

  console.log(`[MFA] Setup initiated for user ${userId}`);

  return {
    secret: secret.base32,
    qrCodeDataUrl,
    backupCodes,
    manualEntryKey: secret.base32,
  };
}

/**
 * Verify MFA setup with a TOTP code
 *
 * This completes the MFA setup process by verifying the user can generate
 * valid TOTP codes. After verification, MFA is fully enabled.
 *
 * @param userId - User ID
 * @param totpCode - 6-digit TOTP code from authenticator app
 * @returns Success status
 * @throws ApiError if code is invalid or MFA not set up
 */
export async function verifyMfaSetup(
  userId: string,
  totpCode: string
): Promise<{ success: boolean; message: string }> {
  // Get user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
  }

  if (!user.mfaSecret) {
    throw new ApiError(
      400,
      'MFA_NOT_SETUP',
      'MFA has not been set up. Call setup endpoint first.'
    );
  }

  if (user.mfaVerified) {
    throw new ApiError(
      409,
      'MFA_ALREADY_VERIFIED',
      'MFA is already verified and enabled.'
    );
  }

  // Decrypt secret
  const secret = decrypt(user.mfaSecret);

  // Verify TOTP code
  const verified = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: totpCode,
    window: MFA_CONFIG.window,
    algorithm: MFA_CONFIG.algorithm,
    digits: MFA_CONFIG.digits,
    step: MFA_CONFIG.step,
  });

  if (!verified) {
    throw new ApiError(
      401,
      'INVALID_TOTP_CODE',
      'Invalid verification code. Please try again.'
    );
  }

  // Enable MFA
  await prisma.user.update({
    where: { id: userId },
    data: {
      mfaEnabled: true,
      mfaVerified: true,
    },
  });

  console.log(`[MFA] Successfully enabled for user ${userId}`);

  return {
    success: true,
    message: 'MFA has been enabled successfully.',
  };
}

/**
 * Verify a TOTP code during login
 *
 * @param userId - User ID
 * @param totpCode - 6-digit TOTP code from authenticator app
 * @returns Whether the code is valid
 * @throws ApiError if MFA not enabled or code is invalid
 */
export async function verifyTotpCode(
  userId: string,
  totpCode: string
): Promise<boolean> {
  // Get user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
  }

  if (!user.mfaEnabled || !user.mfaVerified || !user.mfaSecret) {
    throw new ApiError(
      400,
      'MFA_NOT_ENABLED',
      'MFA is not enabled for this account.'
    );
  }

  // Decrypt secret
  let secret: string;
  try {
    secret = decrypt(user.mfaSecret);
  } catch (error) {
    console.error('[MFA] Failed to decrypt secret for user:', userId, error);
    throw new ApiError(
      500,
      'MFA_DECRYPT_ERROR',
      'Failed to verify MFA. Please try again or contact support.'
    );
  }

  // Verify TOTP code
  console.log('[MFA] Verifying TOTP code for user:', userId, 'code length:', totpCode.length);
  const verified = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: totpCode,
    window: MFA_CONFIG.window,
    algorithm: MFA_CONFIG.algorithm,
    digits: MFA_CONFIG.digits,
    step: MFA_CONFIG.step,
  });

  // speakeasy.totp.verify returns boolean | undefined, ensure we return strict boolean
  return verified === true;
}

/**
 * Verify a backup code during login
 *
 * Backup codes are single-use. Once used, they cannot be used again.
 * Uses atomic conditional update to prevent TOCTOU race conditions.
 *
 * @param userId - User ID
 * @param backupCode - 8-character backup code
 * @returns Whether the code is valid
 * @throws ApiError if MFA not enabled or code is invalid/already used
 */
export async function verifyBackupCode(
  userId: string,
  backupCode: string
): Promise<boolean> {
  // Get user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
  }

  if (!user.mfaEnabled || !user.mfaVerified || !user.mfaBackupCodes) {
    throw new ApiError(
      400,
      'MFA_NOT_ENABLED',
      'MFA is not enabled for this account.'
    );
  }

  // Capture original encrypted value for atomic comparison
  const originalEncrypted = user.mfaBackupCodes as string;

  // Decrypt backup codes
  const backupCodesJson = decrypt(originalEncrypted);
  const backupCodes: Array<{ hash: string; used: boolean }> =
    JSON.parse(backupCodesJson);

  // Hash the provided code
  const codeHash = hashBackupCode(backupCode);

  // Find matching code
  const codeIndex = backupCodes.findIndex(
    (c) => c.hash === codeHash && !c.used
  );

  if (codeIndex === -1) {
    return false;
  }

  // Mark code as used
  const matchedCode = backupCodes[codeIndex];
  if (!matchedCode) {
    return false;
  }
  matchedCode.used = true;

  // Atomic conditional update - only succeeds if mfaBackupCodes hasn't changed
  // This prevents TOCTOU race where two requests could both use the same backup code
  const encryptedBackupCodes = encrypt(JSON.stringify(backupCodes));
  const updateResult = await prisma.user.updateMany({
    where: {
      id: userId,
      mfaBackupCodes: originalEncrypted,
    },
    data: {
      mfaBackupCodes: encryptedBackupCodes,
    },
  });

  // If no rows were updated, another request already modified the backup codes
  if (updateResult.count === 0) {
    console.log(`[MFA] Backup code race detected for user ${userId}, retrying`);
    // Retry the verification (recursive call will re-read fresh data)
    return verifyBackupCode(userId, backupCode);
  }

  console.log(`[MFA] Backup code used for user ${userId}`);

  return true;
}

/**
 * Verify MFA during login (TOTP or backup code)
 *
 * @param userId - User ID
 * @param code - TOTP code (6 digits) or backup code (8 chars)
 * @returns Whether the code is valid
 */
export async function verifyMfaCode(
  userId: string,
  code: string
): Promise<boolean> {
  // Determine if it's a TOTP code (6 digits) or backup code (8 alphanumeric)
  const normalizedCode = code.replace(/\s/g, '').toUpperCase();

  if (/^\d{6}$/.test(normalizedCode)) {
    // It's a TOTP code
    return await verifyTotpCode(userId, normalizedCode);
  } else if (/^[A-Z0-9]{8}$/.test(normalizedCode)) {
    // It's a backup code
    return await verifyBackupCode(userId, normalizedCode);
  }

  throw new ApiError(
    400,
    'INVALID_CODE_FORMAT',
    'Invalid code format. Enter a 6-digit TOTP code or 8-character backup code.'
  );
}

/**
 * Get MFA status for a user
 *
 * @param userId - User ID
 * @returns MFA status including enabled state and remaining backup codes
 */
export async function getMfaStatus(userId: string): Promise<MfaStatusResponse> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
  }

  let backupCodesRemaining = 0;

  if (user.mfaBackupCodes) {
    try {
      const backupCodesJson = decrypt(user.mfaBackupCodes as string);
      const backupCodes: Array<{ hash: string; used: boolean }> =
        JSON.parse(backupCodesJson);
      backupCodesRemaining = backupCodes.filter((c) => !c.used).length;
    } catch {
      // If decryption fails, assume 0 remaining
      backupCodesRemaining = 0;
    }
  }

  return {
    enabled: user.mfaEnabled,
    verified: user.mfaVerified,
    backupCodesRemaining,
  };
}

/**
 * Disable MFA for a user
 *
 * Performs password and TOTP verification atomically with the disable operation
 * to prevent TOCTOU race conditions.
 *
 * @param userId - User ID
 * @param password - Current password for verification
 * @param totpCode - Current TOTP code for verification
 * @returns Success status
 */
export async function disableMfa(
  userId: string,
  password: string,
  totpCode: string
): Promise<{ success: boolean; message: string }> {
  // Use a transaction to ensure atomic verification and disable
  return await prisma.$transaction(async (tx: TransactionClient) => {
    // Get user with lock (SELECT FOR UPDATE behavior in transaction)
    const user = await tx.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
    }

    if (!user.mfaEnabled) {
      throw new ApiError(400, 'MFA_NOT_ENABLED', 'MFA is not enabled.');
    }

    // Verify password
    const bcrypt = await import('bcrypt');
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new ApiError(401, 'INVALID_PASSWORD', 'Invalid password');
    }

    // Verify TOTP code
    if (!user.mfaSecret) {
      throw new ApiError(400, 'MFA_NOT_CONFIGURED', 'MFA secret not found.');
    }

    let secret: string;
    try {
      secret = decrypt(user.mfaSecret);
    } catch (error) {
      console.error('[MFA] Failed to decrypt secret for user:', userId, error);
      throw new ApiError(
        500,
        'MFA_DECRYPT_ERROR',
        'Failed to verify MFA. Please try again or contact support.'
      );
    }

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: totpCode,
      window: MFA_CONFIG.window,
      algorithm: MFA_CONFIG.algorithm,
      digits: MFA_CONFIG.digits,
      step: MFA_CONFIG.step,
    });

    if (verified !== true) {
      throw new ApiError(401, 'INVALID_TOTP_CODE', 'Invalid TOTP code');
    }

    // Disable MFA and clear secrets atomically
    await tx.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaVerified: false,
        mfaSecret: null,
        mfaBackupCodes: Prisma.DbNull,
      },
    });

    console.log(`[MFA] Disabled for user ${userId}`);

    return {
      success: true,
      message: 'MFA has been disabled.',
    };
  });
}

/**
 * Regenerate backup codes for a user
 *
 * This invalidates all existing backup codes and generates new ones.
 *
 * @param userId - User ID
 * @param totpCode - Current TOTP code for verification
 * @returns New backup codes
 */
export async function regenerateBackupCodes(
  userId: string,
  totpCode: string
): Promise<{ backupCodes: string[] }> {
  // Verify TOTP first
  const verified = await verifyTotpCode(userId, totpCode);

  if (!verified) {
    throw new ApiError(
      401,
      'INVALID_TOTP_CODE',
      'Invalid verification code. Please try again.'
    );
  }

  // Generate new backup codes
  const backupCodes = generateBackupCodes();
  const hashedBackupCodes = backupCodes.map((code) => ({
    hash: hashBackupCode(code),
    used: false,
  }));

  // Encrypt and store
  const encryptedBackupCodes = encrypt(JSON.stringify(hashedBackupCodes));
  await prisma.user.update({
    where: { id: userId },
    data: {
      mfaBackupCodes: encryptedBackupCodes,
    },
  });

  console.log(`[MFA] Backup codes regenerated for user ${userId}`);

  return { backupCodes };
}

/**
 * Check if MFA is required for a user
 *
 * @param userId - User ID
 * @returns Whether MFA verification is required
 */
export async function isMfaRequired(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaEnabled: true, mfaVerified: true },
  });

  if (!user) {
    return false;
  }

  return user.mfaEnabled && user.mfaVerified;
}
