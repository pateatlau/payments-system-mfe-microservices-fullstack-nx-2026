/**
 * Field-Level Encryption Module
 *
 * POC-3 Phase 4.3: Data Encryption
 *
 * Provides AES-256-GCM encryption for sensitive database fields with:
 * - Transparent encryption/decryption via Prisma middleware
 * - Blind indexing for searchable encrypted fields (HMAC-SHA256)
 * - Key rotation support
 * - Audit logging for encryption operations
 *
 * Target fields:
 * - Profile: phone, address (PII)
 * - Payments: card numbers, bank account details
 */

import * as crypto from 'crypto';

/**
 * Configuration for the field encryption manager
 */
export interface FieldEncryptionConfig {
  /** 32-byte (256-bit) master key in hex or base64 format */
  masterKey: string;
  /** Key identifier for rotation tracking */
  keyId?: string;
  /** Optional key for blind indexing (separate from encryption key for security) */
  blindIndexKey?: string;
  /** Enable blind indexing (default: true) */
  enableBlindIndex?: boolean;
  /** Service name for logging/metrics */
  serviceName?: string;
  /** Audit callback for encryption operations */
  onAudit?: (event: FieldEncryptionAuditEvent) => void;
}

/**
 * Audit event for field encryption operations
 */
export interface FieldEncryptionAuditEvent {
  action: 'encrypt' | 'decrypt' | 'blind_index';
  field: string;
  model?: string;
  serviceName?: string;
  success: boolean;
  error?: string;
  timestamp: Date;
}

/**
 * Field configuration for encryption
 */
export interface EncryptedFieldConfig {
  /** Field name in the model */
  fieldName: string;
  /** Whether to create a blind index for searching */
  searchable?: boolean;
  /** Name of the blind index field (default: fieldName + '_idx') */
  indexFieldName?: string;
}

/**
 * Model configuration mapping model names to encrypted fields
 */
export interface ModelEncryptionConfig {
  [modelName: string]: EncryptedFieldConfig[];
}

/**
 * Encrypted value with metadata
 */
export interface EncryptedValue {
  /** Base64-encoded ciphertext (iv + authTag + encrypted data) */
  ciphertext: string;
  /** Key ID used for encryption (for rotation support) */
  keyId: string;
  /** Version of the encryption format */
  version: number;
}

/**
 * Encrypted field format string: $enc$v1$keyId$base64Ciphertext
 */
const ENCRYPTED_FIELD_PREFIX = '$enc$';
const ENCRYPTED_FIELD_PATTERN = /^\$enc\$v\d+\$[^$]+\$[A-Za-z0-9+/=]+$/;
const CURRENT_VERSION = 1;

/**
 * Field Encryption Manager
 *
 * Handles encryption/decryption of sensitive database fields using AES-256-GCM.
 * Provides blind indexing for searchable encrypted fields.
 */
export class FieldEncryptionManager {
  private masterKey: Buffer;
  private keyId: string;
  private blindIndexKey: Buffer | null;
  private enableBlindIndex: boolean;
  private serviceName: string;
  private onAudit: ((event: FieldEncryptionAuditEvent) => void) | null;

  constructor(config: FieldEncryptionConfig) {
    // Parse master key (supports hex or base64)
    if (config.masterKey.length === 64 && /^[0-9a-fA-F]+$/.test(config.masterKey)) {
      this.masterKey = Buffer.from(config.masterKey, 'hex');
    } else {
      this.masterKey = Buffer.from(config.masterKey, 'base64');
    }

    if (this.masterKey.length !== 32) {
      throw new Error(
        `Invalid master key length: expected 32 bytes (256 bits), got ${this.masterKey.length} bytes. ` +
          'Provide a 64-character hex string or 44-character base64 string.'
      );
    }

    this.keyId = config.keyId || 'default';
    this.enableBlindIndex = config.enableBlindIndex ?? true;
    this.serviceName = config.serviceName || 'unknown';
    this.onAudit = config.onAudit || null;

    // Parse blind index key (use separate key or derive from master key)
    if (config.blindIndexKey) {
      if (config.blindIndexKey.length === 64 && /^[0-9a-fA-F]+$/.test(config.blindIndexKey)) {
        this.blindIndexKey = Buffer.from(config.blindIndexKey, 'hex');
      } else {
        this.blindIndexKey = Buffer.from(config.blindIndexKey, 'base64');
      }
    } else if (this.enableBlindIndex) {
      // Derive blind index key from master key using HKDF
      this.blindIndexKey = this.deriveKey(this.masterKey, 'blind-index');
    } else {
      this.blindIndexKey = null;
    }
  }

  /**
   * Derive a key using HKDF (HMAC-based Key Derivation Function)
   */
  private deriveKey(masterKey: Buffer, info: string): Buffer {
    const hmac = crypto.createHmac('sha256', masterKey);
    hmac.update(info);
    return hmac.digest();
  }

  /**
   * Emit audit event
   */
  private audit(event: Omit<FieldEncryptionAuditEvent, 'timestamp' | 'serviceName'>): void {
    if (this.onAudit) {
      this.onAudit({
        ...event,
        serviceName: this.serviceName,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Check if a value is encrypted
   */
  isEncrypted(value: string): boolean {
    return ENCRYPTED_FIELD_PATTERN.test(value);
  }

  /**
   * Encrypt a plaintext value using AES-256-GCM
   *
   * Format: $enc$v{version}${keyId}${base64(iv + authTag + ciphertext)}
   *
   * @param plaintext - The value to encrypt
   * @param fieldName - Field name for audit logging
   * @param modelName - Model name for audit logging
   * @returns Encrypted value string
   */
  encrypt(plaintext: string, fieldName?: string, modelName?: string): string {
    try {
      // Generate random IV (12 bytes for GCM)
      const iv = crypto.randomBytes(12);

      // Create cipher
      const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);

      // Encrypt
      const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);

      // Get auth tag
      const authTag = cipher.getAuthTag();

      // Combine: iv (12) + authTag (16) + ciphertext
      const combined = Buffer.concat([iv, authTag, encrypted]);
      const base64Ciphertext = combined.toString('base64');

      // Format: $enc$v1$keyId$base64Ciphertext
      const result = `${ENCRYPTED_FIELD_PREFIX}v${CURRENT_VERSION}$${this.keyId}$${base64Ciphertext}`;

      this.audit({
        action: 'encrypt',
        field: fieldName || 'unknown',
        model: modelName,
        success: true,
      });

      return result;
    } catch (error) {
      this.audit({
        action: 'encrypt',
        field: fieldName || 'unknown',
        model: modelName,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Decrypt an encrypted value
   *
   * @param encryptedValue - The encrypted value string
   * @param fieldName - Field name for audit logging
   * @param modelName - Model name for audit logging
   * @returns Decrypted plaintext
   */
  decrypt(encryptedValue: string, fieldName?: string, modelName?: string): string {
    try {
      // Check format
      if (!this.isEncrypted(encryptedValue)) {
        // Return as-is if not encrypted (backwards compatibility)
        return encryptedValue;
      }

      // Parse: $enc$v{version}${keyId}${base64Ciphertext}
      const parts = encryptedValue.split('$');
      if (parts.length !== 5 || parts[0] !== '' || parts[1] !== 'enc') {
        throw new Error('Invalid encrypted value format');
      }

      const versionStr = parts[2] as string;
      // const keyId = parts[3]; // Can be used for key rotation
      const base64Ciphertext = parts[4] as string;

      // Check version
      const version = parseInt(versionStr.replace('v', ''), 10);
      if (version !== CURRENT_VERSION) {
        throw new Error(`Unsupported encryption version: ${version}`);
      }

      // Decode base64
      const combined = Buffer.from(base64Ciphertext, 'base64');

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
      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

      this.audit({
        action: 'decrypt',
        field: fieldName || 'unknown',
        model: modelName,
        success: true,
      });

      return decrypted.toString('utf8');
    } catch (error) {
      this.audit({
        action: 'decrypt',
        field: fieldName || 'unknown',
        model: modelName,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Generate a blind index for a value
   *
   * Uses HMAC-SHA256 for deterministic hashing, allowing searches on encrypted fields
   * without exposing the plaintext. The blind index key should be different from
   * the encryption key for defense in depth.
   *
   * @param value - The plaintext value to index
   * @param fieldName - Field name for audit logging
   * @param modelName - Model name for audit logging
   * @returns 64-character hex hash suitable for database indexing
   */
  createBlindIndex(value: string, fieldName?: string, modelName?: string): string {
    if (!this.blindIndexKey) {
      throw new Error('Blind indexing is not enabled');
    }

    try {
      // Normalize the value (lowercase, trim) for consistent indexing
      const normalized = value.toLowerCase().trim();

      // Create HMAC-SHA256 hash
      const hmac = crypto.createHmac('sha256', this.blindIndexKey);
      hmac.update(normalized);
      const hash = hmac.digest('hex');

      this.audit({
        action: 'blind_index',
        field: fieldName || 'unknown',
        model: modelName,
        success: true,
      });

      return hash;
    } catch (error) {
      this.audit({
        action: 'blind_index',
        field: fieldName || 'unknown',
        model: modelName,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Encrypt an object's fields based on configuration
   *
   * @param data - The object containing fields to encrypt
   * @param config - Array of field configurations
   * @param modelName - Model name for audit logging
   * @returns Object with encrypted fields (and blind indexes if configured)
   */
  encryptFields<T extends Record<string, unknown>>(
    data: T,
    config: EncryptedFieldConfig[],
    modelName?: string
  ): T {
    const result = { ...data };

    for (const fieldConfig of config) {
      const { fieldName, searchable, indexFieldName } = fieldConfig;
      const value = data[fieldName];

      // Skip null/undefined values
      if (value == null) {
        continue;
      }

      // Only encrypt strings
      if (typeof value !== 'string') {
        continue;
      }

      // Skip already encrypted values
      if (this.isEncrypted(value)) {
        continue;
      }

      // Encrypt the field
      (result as Record<string, unknown>)[fieldName] = this.encrypt(value, fieldName, modelName);

      // Create blind index if searchable
      if (searchable && this.enableBlindIndex) {
        const idxFieldName = indexFieldName || `${fieldName}_idx`;
        (result as Record<string, unknown>)[idxFieldName] = this.createBlindIndex(
          value,
          fieldName,
          modelName
        );
      }
    }

    return result;
  }

  /**
   * Decrypt an object's fields based on configuration
   *
   * @param data - The object containing fields to decrypt
   * @param config - Array of field configurations
   * @param modelName - Model name for audit logging
   * @returns Object with decrypted fields
   */
  decryptFields<T extends Record<string, unknown>>(
    data: T,
    config: EncryptedFieldConfig[],
    modelName?: string
  ): T {
    const result = { ...data };

    for (const fieldConfig of config) {
      const { fieldName } = fieldConfig;
      const value = data[fieldName];

      // Skip null/undefined values
      if (value == null) {
        continue;
      }

      // Only decrypt strings
      if (typeof value !== 'string') {
        continue;
      }

      // Skip non-encrypted values
      if (!this.isEncrypted(value)) {
        continue;
      }

      // Decrypt the field
      (result as Record<string, unknown>)[fieldName] = this.decrypt(value, fieldName, modelName);
    }

    return result;
  }

  /**
   * Get key ID
   */
  getKeyId(): string {
    return this.keyId;
  }

  /**
   * Check if blind indexing is enabled
   */
  isBlindIndexEnabled(): boolean {
    return this.enableBlindIndex && this.blindIndexKey !== null;
  }
}

/**
 * Prisma middleware params type
 */
interface PrismaMiddlewareParams {
  model?: string;
  action: string;
  args?: Record<string, unknown>;
  dataPath: string[];
  runInTransaction: boolean;
}

/**
 * Create a Prisma middleware for automatic field encryption/decryption
 *
 * @param manager - FieldEncryptionManager instance
 * @param modelConfig - Configuration mapping models to encrypted fields
 * @returns Prisma middleware function
 *
 * @example
 * ```typescript
 * const encryptionManager = new FieldEncryptionManager({
 *   masterKey: process.env.FIELD_ENCRYPTION_KEY!,
 *   serviceName: 'profile-service',
 * });
 *
 * const middleware = createFieldEncryptionMiddleware(encryptionManager, {
 *   UserProfile: [
 *     { fieldName: 'phone', searchable: true },
 *     { fieldName: 'address', searchable: false },
 *   ],
 * });
 *
 * prisma.$use(middleware);
 * ```
 */
export function createFieldEncryptionMiddleware(
  manager: FieldEncryptionManager,
  modelConfig: ModelEncryptionConfig
) {
  return async function fieldEncryptionMiddleware(
    params: PrismaMiddlewareParams,
    next: (params: PrismaMiddlewareParams) => Promise<unknown>
  ): Promise<unknown> {
    const { model, action, args } = params;

    // Skip if no model or model not configured for encryption
    if (!model || !modelConfig[model]) {
      return next(params);
    }

    const config = modelConfig[model];

    // Handle write operations (encrypt before storing)
    if (['create', 'update', 'upsert', 'createMany', 'updateMany'].includes(action)) {
      // Handle createMany (array of records) - check this first
      if (action === 'createMany' && args?.data && Array.isArray(args.data)) {
        args.data = (args.data as Record<string, unknown>[]).map((record) =>
          manager.encryptFields(record, config, model)
        );
      } else if (args?.data && typeof args.data === 'object' && !Array.isArray(args.data)) {
        // Handle single record
        args.data = manager.encryptFields(args.data as Record<string, unknown>, config, model);
      }

      // Handle upsert
      if (action === 'upsert' && args) {
        if (args.create && typeof args.create === 'object') {
          args.create = manager.encryptFields(
            args.create as Record<string, unknown>,
            config,
            model
          );
        }
        if (args.update && typeof args.update === 'object') {
          args.update = manager.encryptFields(
            args.update as Record<string, unknown>,
            config,
            model
          );
        }
      }
    }

    // Handle search by encrypted field (create blind index for where clause)
    if (['findFirst', 'findMany', 'findUnique', 'count', 'deleteMany', 'updateMany'].includes(action)) {
      if (args?.where && typeof args.where === 'object') {
        args.where = transformWhereClause(manager, args.where as Record<string, unknown>, config, model);
      }
    }

    // Execute the query
    const result = await next(params);

    // Handle read operations (decrypt after retrieval)
    if (['findFirst', 'findMany', 'findUnique', 'create', 'update', 'upsert'].includes(action)) {
      if (result && typeof result === 'object') {
        if (Array.isArray(result)) {
          // Handle array results (findMany)
          return result.map((record) =>
            manager.decryptFields(record as Record<string, unknown>, config, model)
          );
        } else {
          // Handle single record
          return manager.decryptFields(result as Record<string, unknown>, config, model);
        }
      }
    }

    return result;
  };
}

/**
 * Transform WHERE clause to use blind indexes for encrypted fields
 */
function transformWhereClause(
  manager: FieldEncryptionManager,
  where: Record<string, unknown>,
  config: EncryptedFieldConfig[],
  model?: string
): Record<string, unknown> {
  const result = { ...where };

  for (const fieldConfig of config) {
    const { fieldName, searchable, indexFieldName } = fieldConfig;

    // Only transform searchable fields with values
    if (!searchable || !manager.isBlindIndexEnabled()) {
      continue;
    }

    const value = where[fieldName];
    if (value == null) {
      continue;
    }

    const idxFieldName = indexFieldName || `${fieldName}_idx`;

    // Handle direct equality search
    if (typeof value === 'string') {
      // Remove the original field from where (it's encrypted, can't search directly)
      delete result[fieldName];
      // Add blind index search
      result[idxFieldName] = manager.createBlindIndex(value, fieldName, model);
    }

    // Handle equals operator
    if (typeof value === 'object' && value !== null && 'equals' in value) {
      const equalsValue = (value as Record<string, unknown>).equals;
      if (typeof equalsValue === 'string') {
        delete result[fieldName];
        result[idxFieldName] = manager.createBlindIndex(equalsValue, fieldName, model);
      }
    }
  }

  return result;
}

/**
 * Generate a random 256-bit key for field encryption
 * @returns 64-character hex string
 */
export function generateFieldEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create field encryption manager from environment variables
 *
 * Environment variables:
 * - FIELD_ENCRYPTION_KEY: 64-char hex or 44-char base64 encryption key (required)
 * - FIELD_ENCRYPTION_KEY_ID: Key identifier for rotation tracking (optional)
 * - FIELD_ENCRYPTION_BLIND_INDEX_KEY: Separate key for blind indexing (optional)
 * - FIELD_ENCRYPTION_ENABLE_BLIND_INDEX: Enable blind indexing (default: true)
 *
 * @param serviceName - Service name for logging/metrics
 * @param onAudit - Optional audit callback
 * @returns FieldEncryptionManager or null if not configured
 */
export function createFieldEncryptionManagerFromEnv(
  serviceName: string,
  onAudit?: (event: FieldEncryptionAuditEvent) => void
): FieldEncryptionManager | null {
  const masterKey = process.env['FIELD_ENCRYPTION_KEY'];

  if (!masterKey) {
    // Field encryption not configured
    return null;
  }

  return new FieldEncryptionManager({
    masterKey,
    keyId: process.env['FIELD_ENCRYPTION_KEY_ID'] || 'default',
    blindIndexKey: process.env['FIELD_ENCRYPTION_BLIND_INDEX_KEY'],
    enableBlindIndex: process.env['FIELD_ENCRYPTION_ENABLE_BLIND_INDEX'] !== 'false',
    serviceName,
    onAudit,
  });
}

/**
 * Default export for convenience
 */
export default {
  FieldEncryptionManager,
  createFieldEncryptionMiddleware,
  createFieldEncryptionManagerFromEnv,
  generateFieldEncryptionKey,
};
