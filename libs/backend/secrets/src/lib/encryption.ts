/**
 * Secrets Encryption Module
 *
 * POC-3 Phase 3.3: Secrets Encryption at Rest
 *
 * Provides AES-256-GCM encryption for sensitive configuration values.
 * Supports:
 * - Local master key encryption (for development/standalone)
 * - Extensible provider interface for AWS KMS, Azure Key Vault, HashiCorp Vault
 * - Transparent decryption on startup
 * - Audit logging for secret access
 *
 * Encrypted values use the format: ENC[provider:base64_ciphertext]
 * Example: ENC[local:YWJjZGVmZ2hpamtsbW5vcA==...]
 */

import * as crypto from 'crypto';

/**
 * Encryption provider interface
 * Implement this interface to add support for different key management systems
 */
export interface EncryptionProvider {
  name: string;
  encrypt(plaintext: string): Promise<string>;
  decrypt(ciphertext: string): Promise<string>;
  isAvailable(): boolean;
}

/**
 * Encryption result with metadata
 */
export interface EncryptionResult {
  ciphertext: string;
  provider: string;
  keyId?: string;
  timestamp: Date;
}

/**
 * Decryption result with audit info
 */
export interface DecryptionResult {
  plaintext: string;
  provider: string;
  keyId?: string;
  timestamp: Date;
  cached: boolean;
}

/**
 * Secret access audit event
 */
export interface SecretAccessEvent {
  action: 'encrypt' | 'decrypt' | 'access';
  provider: string;
  keyId?: string;
  secretName?: string;
  timestamp: Date;
  success: boolean;
  error?: string;
  serviceName?: string;
}

/**
 * Audit callback type
 */
export type AuditCallback = (event: SecretAccessEvent) => void;

/**
 * Encrypted value pattern: ENC[provider:base64_ciphertext]
 */
const ENCRYPTED_PATTERN = /^ENC\[([a-z-]+):(.+)\]$/;

/**
 * Check if a value is encrypted
 */
export function isEncrypted(value: string): boolean {
  return ENCRYPTED_PATTERN.test(value);
}

/**
 * Parse encrypted value
 */
export function parseEncryptedValue(value: string): { provider: string; ciphertext: string } | null {
  const match = value.match(ENCRYPTED_PATTERN);
  if (!match || !match[1] || !match[2]) return null;
  return {
    provider: match[1],
    ciphertext: match[2],
  };
}

/**
 * Format encrypted value
 */
export function formatEncryptedValue(provider: string, ciphertext: string): string {
  return `ENC[${provider}:${ciphertext}]`;
}

/**
 * Local AES-256-GCM Encryption Provider
 *
 * Uses a master key from environment variable for encryption.
 * Suitable for development and standalone deployments.
 * For production, consider using AWS KMS, Azure Key Vault, or HashiCorp Vault.
 */
export class LocalEncryptionProvider implements EncryptionProvider {
  readonly name = 'local';
  private masterKey: Buffer;
  private keyId: string;

  /**
   * Create a local encryption provider
   *
   * @param masterKey - 32-byte (256-bit) master key in hex or base64 format
   * @param keyId - Optional key identifier for audit/rotation
   */
  constructor(masterKey: string, keyId?: string) {
    // Parse master key (supports hex or base64)
    if (masterKey.length === 64 && /^[0-9a-fA-F]+$/.test(masterKey)) {
      this.masterKey = Buffer.from(masterKey, 'hex');
    } else {
      this.masterKey = Buffer.from(masterKey, 'base64');
    }

    if (this.masterKey.length !== 32) {
      throw new Error(
        `Invalid master key length: expected 32 bytes (256 bits), got ${this.masterKey.length} bytes. ` +
          'Provide a 64-character hex string or 44-character base64 string.'
      );
    }

    this.keyId = keyId || 'default';
  }

  isAvailable(): boolean {
    return this.masterKey.length === 32;
  }

  /**
   * Encrypt a plaintext value using AES-256-GCM
   *
   * Format: base64(iv + authTag + ciphertext)
   * - IV: 12 bytes (96 bits) - random per encryption
   * - Auth Tag: 16 bytes (128 bits)
   * - Ciphertext: variable length
   */
  async encrypt(plaintext: string): Promise<string> {
    // Generate random IV (12 bytes for GCM)
    const iv = crypto.randomBytes(12);

    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);

    // Encrypt
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    // Get auth tag
    const authTag = cipher.getAuthTag();

    // Combine: iv (12) + authTag (16) + ciphertext
    const combined = Buffer.concat([iv, authTag, encrypted]);

    return combined.toString('base64');
  }

  /**
   * Decrypt a ciphertext value using AES-256-GCM
   */
  async decrypt(ciphertext: string): Promise<string> {
    // Decode base64
    const combined = Buffer.from(ciphertext, 'base64');

    if (combined.length < 28) {
      throw new Error('Invalid ciphertext: too short');
    }

    // Extract components
    const iv = combined.subarray(0, 12);
    const authTag = combined.subarray(12, 28);
    const encrypted = combined.subarray(28);

    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.masterKey, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  getKeyId(): string {
    return this.keyId;
  }
}

/**
 * Secrets Encryption Manager
 *
 * Manages multiple encryption providers and provides a unified interface
 * for encrypting/decrypting secrets with audit logging.
 */
export class SecretsEncryptionManager {
  private providers: Map<string, EncryptionProvider> = new Map();
  private defaultProvider: string | null = null;
  private auditCallback: AuditCallback | null = null;
  private serviceName: string;
  private decryptionCache: Map<string, { value: string; timestamp: Date }> = new Map();
  private cacheEnabled: boolean;
  private cacheTtlMs: number;

  constructor(options: {
    serviceName?: string;
    enableCache?: boolean;
    cacheTtlMs?: number;
    auditCallback?: AuditCallback;
  } = {}) {
    this.serviceName = options.serviceName || 'unknown';
    this.cacheEnabled = options.enableCache ?? false;
    this.cacheTtlMs = options.cacheTtlMs ?? 5 * 60 * 1000; // 5 minutes default
    this.auditCallback = options.auditCallback || null;
  }

  /**
   * Register an encryption provider
   */
  registerProvider(provider: EncryptionProvider, setAsDefault = false): void {
    this.providers.set(provider.name, provider);
    if (setAsDefault || !this.defaultProvider) {
      this.defaultProvider = provider.name;
    }
  }

  /**
   * Get registered provider names
   */
  getProviderNames(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Set audit callback
   */
  setAuditCallback(callback: AuditCallback): void {
    this.auditCallback = callback;
  }

  /**
   * Emit audit event
   */
  private audit(event: Omit<SecretAccessEvent, 'timestamp' | 'serviceName'>): void {
    if (this.auditCallback) {
      this.auditCallback({
        ...event,
        timestamp: new Date(),
        serviceName: this.serviceName,
      });
    }
  }

  /**
   * Encrypt a value using the default provider
   */
  async encrypt(plaintext: string, secretName?: string): Promise<string> {
    if (!this.defaultProvider) {
      throw new Error('No encryption provider registered');
    }

    const provider = this.providers.get(this.defaultProvider);
    if (!provider) {
      throw new Error(`Provider not found: ${this.defaultProvider}`);
    }

    try {
      const ciphertext = await provider.encrypt(plaintext);
      const result = formatEncryptedValue(provider.name, ciphertext);

      this.audit({
        action: 'encrypt',
        provider: provider.name,
        secretName,
        success: true,
      });

      return result;
    } catch (error) {
      this.audit({
        action: 'encrypt',
        provider: provider.name,
        secretName,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Decrypt an encrypted value
   *
   * Automatically detects the provider from the encrypted value format.
   * Returns the original value if not encrypted.
   */
  async decrypt(value: string, secretName?: string): Promise<string> {
    // Return as-is if not encrypted
    if (!isEncrypted(value)) {
      return value;
    }

    // Check cache
    if (this.cacheEnabled) {
      const cached = this.decryptionCache.get(value);
      if (cached && Date.now() - cached.timestamp.getTime() < this.cacheTtlMs) {
        this.audit({
          action: 'access',
          provider: 'cache',
          secretName,
          success: true,
        });
        return cached.value;
      }
    }

    // Parse encrypted value
    const parsed = parseEncryptedValue(value);
    if (!parsed) {
      throw new Error(`Invalid encrypted value format: ${value.substring(0, 20)}...`);
    }

    const provider = this.providers.get(parsed.provider);
    if (!provider) {
      throw new Error(`Unknown encryption provider: ${parsed.provider}`);
    }

    try {
      const plaintext = await provider.decrypt(parsed.ciphertext);

      // Cache result
      if (this.cacheEnabled) {
        this.decryptionCache.set(value, { value: plaintext, timestamp: new Date() });
      }

      this.audit({
        action: 'decrypt',
        provider: parsed.provider,
        secretName,
        success: true,
      });

      return plaintext;
    } catch (error) {
      this.audit({
        action: 'decrypt',
        provider: parsed.provider,
        secretName,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Decrypt all encrypted values in an object (shallow)
   */
  async decryptObject<T extends Record<string, unknown>>(obj: T): Promise<T> {
    const result = { ...obj } as T;

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && isEncrypted(value)) {
        (result as Record<string, unknown>)[key] = await this.decrypt(value, key);
      }
    }

    return result;
  }

  /**
   * Decrypt all encrypted values in an object (deep)
   */
  async decryptObjectDeep<T extends Record<string, unknown>>(obj: T): Promise<T> {
    const result = { ...obj } as T;

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && isEncrypted(value)) {
        (result as Record<string, unknown>)[key] = await this.decrypt(value, key);
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        (result as Record<string, unknown>)[key] = await this.decryptObjectDeep(
          value as Record<string, unknown>
        );
      }
    }

    return result;
  }

  /**
   * Clear decryption cache
   */
  clearCache(): void {
    this.decryptionCache.clear();
  }
}

/**
 * Generate a new random master key
 *
 * @returns 256-bit key in hex format
 */
export function generateMasterKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create encryption manager from environment variables
 *
 * Environment variables:
 * - ENCRYPTION_MASTER_KEY: 64-char hex or 44-char base64 master key
 * - ENCRYPTION_KEY_ID: Optional key identifier
 * - ENCRYPTION_CACHE_ENABLED: 'true' to enable decryption cache
 * - ENCRYPTION_CACHE_TTL_MS: Cache TTL in milliseconds
 */
export function createEncryptionManagerFromEnv(
  serviceName: string,
  auditCallback?: AuditCallback
): SecretsEncryptionManager | null {
  const masterKey = process.env['ENCRYPTION_MASTER_KEY'];

  if (!masterKey) {
    // Encryption not configured - return null
    return null;
  }

  const keyId = process.env['ENCRYPTION_KEY_ID'] || 'default';
  const cacheEnabled = process.env['ENCRYPTION_CACHE_ENABLED'] === 'true';
  const cacheTtlMs = parseInt(process.env['ENCRYPTION_CACHE_TTL_MS'] || '300000', 10);

  const manager = new SecretsEncryptionManager({
    serviceName,
    enableCache: cacheEnabled,
    cacheTtlMs,
    auditCallback,
  });

  // Register local provider
  const localProvider = new LocalEncryptionProvider(masterKey, keyId);
  manager.registerProvider(localProvider, true);

  return manager;
}

/**
 * Default export for convenience
 */
export default {
  LocalEncryptionProvider,
  SecretsEncryptionManager,
  generateMasterKey,
  createEncryptionManagerFromEnv,
  isEncrypted,
  parseEncryptedValue,
  formatEncryptedValue,
};
