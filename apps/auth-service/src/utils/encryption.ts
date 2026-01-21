/**
 * Encryption Utilities
 *
 * AES-256-GCM encryption for sensitive data storage.
 * Used for MFA secrets, OAuth tokens, and other sensitive fields.
 *
 * Security:
 * - AES-256-GCM provides authenticated encryption
 * - Random IV for each encryption operation
 * - Auth tag prevents tampering
 * - Key derived from environment or JWT secret in dev
 */

import crypto from 'crypto';
import { config } from '../config';

// ============================================================================
// CONFIGURATION
// ============================================================================

const ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm' as const,
  ivLength: 16,
  authTagLength: 16,
  keyLength: 32, // 256 bits
};

// Cached encryption key to avoid repeated derivation
let cachedEncryptionKey: Buffer | null = null;
let encryptionKeyWarningShown = false;

// ============================================================================
// KEY MANAGEMENT
// ============================================================================

/**
 * Check if running in production environment
 */
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Get encryption key from environment or derive one for development.
 *
 * In production, MFA_ENCRYPTION_KEY must be provided.
 * In development, falls back to deriving key from JWT secret.
 *
 * The key is cached after first computation.
 */
export function getEncryptionKey(): Buffer {
  // Return cached key if available
  if (cachedEncryptionKey) {
    return cachedEncryptionKey;
  }

  const keyEnv = process.env.MFA_ENCRYPTION_KEY;
  if (keyEnv) {
    // Key should be 32 bytes (256 bits) for AES-256
    const key = Buffer.from(keyEnv, 'hex');
    if (key.length !== ENCRYPTION_CONFIG.keyLength) {
      throw new Error(
        `MFA_ENCRYPTION_KEY must be ${ENCRYPTION_CONFIG.keyLength} bytes (${ENCRYPTION_CONFIG.keyLength * 2} hex characters) for AES-256`
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

  // Development fallback - derive key from JWT secret
  // IMPORTANT: Default salt MUST remain 'mfa-salt' for backwards compatibility
  const salt = process.env.MFA_ENCRYPTION_SALT || 'mfa-salt';
  const jwtSecret = config.jwtSecret || 'development-secret';

  // Only show warning once per process
  if (!encryptionKeyWarningShown) {
    console.warn(
      '[Encryption] Using derived encryption key for development. ' +
        'Set MFA_ENCRYPTION_KEY in production.'
    );
    encryptionKeyWarningShown = true;
  }

  cachedEncryptionKey = crypto.scryptSync(jwtSecret, salt, ENCRYPTION_CONFIG.keyLength);
  return cachedEncryptionKey;
}

// ============================================================================
// ENCRYPTION / DECRYPTION
// ============================================================================

/**
 * Encrypt a string using AES-256-GCM
 *
 * @param plaintext - The text to encrypt
 * @returns Encrypted string in format: iv:authTag:ciphertext (hex encoded)
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(ENCRYPTION_CONFIG.ivLength);
  const cipher = crypto.createCipheriv(
    ENCRYPTION_CONFIG.algorithm,
    key,
    iv
  ) as crypto.CipherGCM;

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Return iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a string using AES-256-GCM
 *
 * @param encryptedText - Encrypted string in format: iv:authTag:ciphertext
 * @returns Decrypted plaintext
 * @throws Error if decryption fails or format is invalid
 */
export function decrypt(encryptedText: string): string {
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
    ENCRYPTION_CONFIG.algorithm,
    key,
    iv
  ) as crypto.DecipherGCM;
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Encrypt a value if provided, return null otherwise
 * Useful for optional fields
 */
export function encryptOptional(value: string | undefined | null): string | null {
  if (!value) return null;
  return encrypt(value);
}

/**
 * Decrypt a value if provided, return null otherwise
 * Useful for optional fields
 */
export function decryptOptional(value: string | undefined | null): string | null {
  if (!value) return null;
  try {
    return decrypt(value);
  } catch {
    // If decryption fails, the value may not be encrypted (migration case)
    // Log warning but don't expose the error
    console.warn('[Encryption] Failed to decrypt value, may be unencrypted legacy data');
    return null;
  }
}

/**
 * Reset cached encryption key (for testing)
 */
export function resetEncryptionKey(): void {
  cachedEncryptionKey = null;
  encryptionKeyWarningShown = false;
}
