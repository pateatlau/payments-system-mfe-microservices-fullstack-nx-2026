/**
 * Field Encryption Module Tests
 *
 * Tests for:
 * - AES-256-GCM encryption/decryption
 * - Blind indexing for searchable encrypted fields
 * - Prisma middleware integration
 * - Error handling and edge cases
 */

import {
  FieldEncryptionManager,
  createFieldEncryptionMiddleware,
  createFieldEncryptionManagerFromEnv,
  generateFieldEncryptionKey,
  FieldEncryptionConfig,
  EncryptedFieldConfig,
  FieldEncryptionAuditEvent,
} from './field-encryption';

describe('FieldEncryptionManager', () => {
  // Test key (32 bytes / 64 hex chars)
  const TEST_KEY_HEX = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const TEST_KEY_BASE64 = Buffer.from(TEST_KEY_HEX, 'hex').toString('base64');

  describe('constructor', () => {
    it('should accept hex-encoded master key', () => {
      const manager = new FieldEncryptionManager({
        masterKey: TEST_KEY_HEX,
        serviceName: 'test-service',
      });

      expect(manager.getKeyId()).toBe('default');
    });

    it('should accept base64-encoded master key', () => {
      const manager = new FieldEncryptionManager({
        masterKey: TEST_KEY_BASE64,
        serviceName: 'test-service',
      });

      expect(manager.getKeyId()).toBe('default');
    });

    it('should use custom key ID if provided', () => {
      const manager = new FieldEncryptionManager({
        masterKey: TEST_KEY_HEX,
        keyId: 'custom-key-v1',
        serviceName: 'test-service',
      });

      expect(manager.getKeyId()).toBe('custom-key-v1');
    });

    it('should throw error for invalid key length', () => {
      expect(() => {
        new FieldEncryptionManager({
          masterKey: '0123456789abcdef', // 16 chars - too short
          serviceName: 'test-service',
        });
      }).toThrow('Invalid master key length');
    });

    it('should enable blind indexing by default', () => {
      const manager = new FieldEncryptionManager({
        masterKey: TEST_KEY_HEX,
        serviceName: 'test-service',
      });

      expect(manager.isBlindIndexEnabled()).toBe(true);
    });

    it('should allow disabling blind indexing', () => {
      const manager = new FieldEncryptionManager({
        masterKey: TEST_KEY_HEX,
        serviceName: 'test-service',
        enableBlindIndex: false,
      });

      expect(manager.isBlindIndexEnabled()).toBe(false);
    });
  });

  describe('encrypt', () => {
    let manager: FieldEncryptionManager;

    beforeEach(() => {
      manager = new FieldEncryptionManager({
        masterKey: TEST_KEY_HEX,
        serviceName: 'test-service',
      });
    });

    it('should encrypt plaintext', () => {
      const plaintext = 'sensitive data';
      const encrypted = manager.encrypt(plaintext);

      expect(encrypted).toMatch(/^\$enc\$v1\$/);
      expect(encrypted).not.toContain(plaintext);
    });

    it('should produce different ciphertext for same plaintext (random IV)', () => {
      const plaintext = 'sensitive data';
      const encrypted1 = manager.encrypt(plaintext);
      const encrypted2 = manager.encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should encrypt empty string', () => {
      const encrypted = manager.encrypt('');
      expect(encrypted).toMatch(/^\$enc\$v1\$/);
    });

    it('should encrypt unicode characters', () => {
      const plaintext = '日本語テスト emoji: 🔐';
      const encrypted = manager.encrypt(plaintext);

      expect(encrypted).toMatch(/^\$enc\$v1\$/);
    });

    it('should include key ID in encrypted value', () => {
      const managerWithKeyId = new FieldEncryptionManager({
        masterKey: TEST_KEY_HEX,
        keyId: 'my-key-v2',
        serviceName: 'test-service',
      });

      const encrypted = managerWithKeyId.encrypt('test');
      expect(encrypted).toContain('$my-key-v2$');
    });
  });

  describe('decrypt', () => {
    let manager: FieldEncryptionManager;

    beforeEach(() => {
      manager = new FieldEncryptionManager({
        masterKey: TEST_KEY_HEX,
        serviceName: 'test-service',
      });
    });

    it('should decrypt encrypted value', () => {
      const plaintext = 'sensitive data';
      const encrypted = manager.encrypt(plaintext);
      const decrypted = manager.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should decrypt empty string', () => {
      const encrypted = manager.encrypt('');
      const decrypted = manager.decrypt(encrypted);

      expect(decrypted).toBe('');
    });

    it('should decrypt unicode characters', () => {
      const plaintext = '日本語テスト emoji: 🔐';
      const encrypted = manager.encrypt(plaintext);
      const decrypted = manager.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should return non-encrypted value as-is', () => {
      const plaintext = 'not encrypted';
      const result = manager.decrypt(plaintext);

      expect(result).toBe(plaintext);
    });

    it('should throw error for tampered ciphertext', () => {
      const encrypted = manager.encrypt('test');
      // Tamper with the ciphertext
      const tampered = encrypted.slice(0, -5) + 'XXXXX';

      expect(() => manager.decrypt(tampered)).toThrow();
    });

    it('should return invalid format as-is (not matching pattern)', () => {
      // This doesn't match the encrypted pattern, so it's treated as plaintext
      const invalid = '$enc$v1$invalid';
      const result = manager.decrypt(invalid);
      expect(result).toBe(invalid);
    });

    it('should throw error for unsupported version', () => {
      // Create a fake v99 encrypted value that matches pattern
      const invalid = '$enc$v99$keyid$YWJjZGVmZ2hpamtsbW5vcA==';

      expect(() => manager.decrypt(invalid)).toThrow('Unsupported encryption version');
    });

    it('should return invalid base64 pattern as-is (not matching pattern)', () => {
      // Special characters don't match the pattern, so treated as plaintext
      const invalid = '$enc$v1$default$not-valid-base64!@#$';
      const result = manager.decrypt(invalid);
      expect(result).toBe(invalid);
    });

    it('should throw error for valid pattern but corrupted ciphertext', () => {
      // This matches the pattern but has invalid/corrupted content
      const invalid = '$enc$v1$default$YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXo=';

      expect(() => manager.decrypt(invalid)).toThrow();
    });
  });

  describe('isEncrypted', () => {
    let manager: FieldEncryptionManager;

    beforeEach(() => {
      manager = new FieldEncryptionManager({
        masterKey: TEST_KEY_HEX,
        serviceName: 'test-service',
      });
    });

    it('should return true for encrypted value', () => {
      const encrypted = manager.encrypt('test');
      expect(manager.isEncrypted(encrypted)).toBe(true);
    });

    it('should return false for plain text', () => {
      expect(manager.isEncrypted('plain text')).toBe(false);
    });

    it('should return false for partial prefix', () => {
      expect(manager.isEncrypted('$enc$')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(manager.isEncrypted('')).toBe(false);
    });
  });

  describe('createBlindIndex', () => {
    let manager: FieldEncryptionManager;

    beforeEach(() => {
      manager = new FieldEncryptionManager({
        masterKey: TEST_KEY_HEX,
        serviceName: 'test-service',
      });
    });

    it('should create deterministic blind index', () => {
      const value = 'test@example.com';
      const index1 = manager.createBlindIndex(value);
      const index2 = manager.createBlindIndex(value);

      expect(index1).toBe(index2);
      expect(index1).toHaveLength(64); // SHA256 hex = 64 chars
    });

    it('should normalize input (case insensitive)', () => {
      const index1 = manager.createBlindIndex('Test@Example.COM');
      const index2 = manager.createBlindIndex('test@example.com');

      expect(index1).toBe(index2);
    });

    it('should normalize input (trim whitespace)', () => {
      const index1 = manager.createBlindIndex('  test  ');
      const index2 = manager.createBlindIndex('test');

      expect(index1).toBe(index2);
    });

    it('should produce different indexes for different values', () => {
      const index1 = manager.createBlindIndex('value1');
      const index2 = manager.createBlindIndex('value2');

      expect(index1).not.toBe(index2);
    });

    it('should throw error when blind indexing is disabled', () => {
      const managerNoBlind = new FieldEncryptionManager({
        masterKey: TEST_KEY_HEX,
        serviceName: 'test-service',
        enableBlindIndex: false,
      });

      expect(() => managerNoBlind.createBlindIndex('test')).toThrow('Blind indexing is not enabled');
    });

    it('should use separate blind index key if provided', () => {
      const blindIndexKey = 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';

      const manager1 = new FieldEncryptionManager({
        masterKey: TEST_KEY_HEX,
        blindIndexKey,
        serviceName: 'test-service',
      });

      const manager2 = new FieldEncryptionManager({
        masterKey: TEST_KEY_HEX,
        // Different blind index key derived from master key
        serviceName: 'test-service',
      });

      const index1 = manager1.createBlindIndex('test');
      const index2 = manager2.createBlindIndex('test');

      // Should be different because keys are different
      expect(index1).not.toBe(index2);
    });
  });

  describe('encryptFields', () => {
    let manager: FieldEncryptionManager;
    const config: EncryptedFieldConfig[] = [
      { fieldName: 'phone', searchable: true },
      { fieldName: 'address', searchable: false },
    ];

    beforeEach(() => {
      manager = new FieldEncryptionManager({
        masterKey: TEST_KEY_HEX,
        serviceName: 'test-service',
      });
    });

    it('should encrypt configured fields', () => {
      const data = {
        id: '123',
        phone: '555-1234',
        address: '123 Main St',
        name: 'John Doe',
      };

      const result = manager.encryptFields(data, config);

      expect(manager.isEncrypted(result.phone as string)).toBe(true);
      expect(manager.isEncrypted(result.address as string)).toBe(true);
      expect(result.name).toBe('John Doe'); // Not encrypted
      expect(result.id).toBe('123'); // Not encrypted
    });

    it('should create blind index for searchable fields', () => {
      const data = {
        phone: '555-1234',
        address: '123 Main St',
      };

      const result = manager.encryptFields(data, config);

      expect(result.phone_idx).toBeDefined();
      expect(result.phone_idx).toHaveLength(64);
      expect(result.address_idx).toBeUndefined(); // Not searchable
    });

    it('should use custom index field name', () => {
      const customConfig: EncryptedFieldConfig[] = [
        { fieldName: 'phone', searchable: true, indexFieldName: 'phoneHash' },
      ];

      const data = { phone: '555-1234' };
      const result = manager.encryptFields(data, customConfig);

      expect(result.phoneHash).toBeDefined();
      expect(result.phone_idx).toBeUndefined();
    });

    it('should skip null/undefined values', () => {
      const data = {
        phone: null,
        address: undefined,
      };

      const result = manager.encryptFields(data, config);

      expect(result.phone).toBeNull();
      expect(result.address).toBeUndefined();
    });

    it('should skip non-string values', () => {
      const data = {
        phone: 5551234, // number, not string
        address: { street: '123 Main St' }, // object, not string
      };

      const result = manager.encryptFields(data, config);

      expect(result.phone).toBe(5551234);
      expect(result.address).toEqual({ street: '123 Main St' });
    });

    it('should skip already encrypted values', () => {
      const encrypted = manager.encrypt('555-1234');
      const data = {
        phone: encrypted,
      };

      const result = manager.encryptFields(data, config);

      expect(result.phone).toBe(encrypted); // Unchanged
    });
  });

  describe('decryptFields', () => {
    let manager: FieldEncryptionManager;
    const config: EncryptedFieldConfig[] = [
      { fieldName: 'phone', searchable: true },
      { fieldName: 'address', searchable: false },
    ];

    beforeEach(() => {
      manager = new FieldEncryptionManager({
        masterKey: TEST_KEY_HEX,
        serviceName: 'test-service',
      });
    });

    it('should decrypt configured fields', () => {
      const original = {
        phone: '555-1234',
        address: '123 Main St',
        name: 'John Doe',
      };

      const encrypted = manager.encryptFields(original, config);
      const decrypted = manager.decryptFields(encrypted, config);

      expect(decrypted.phone).toBe('555-1234');
      expect(decrypted.address).toBe('123 Main St');
      expect(decrypted.name).toBe('John Doe');
    });

    it('should skip non-encrypted values', () => {
      const data = {
        phone: '555-1234', // Not encrypted
        address: '123 Main St', // Not encrypted
      };

      const result = manager.decryptFields(data, config);

      expect(result.phone).toBe('555-1234');
      expect(result.address).toBe('123 Main St');
    });

    it('should skip null/undefined values', () => {
      const data = {
        phone: null,
        address: undefined,
      };

      const result = manager.decryptFields(data, config);

      expect(result.phone).toBeNull();
      expect(result.address).toBeUndefined();
    });
  });

  describe('audit logging', () => {
    it('should call audit callback on encrypt', () => {
      const auditEvents: FieldEncryptionAuditEvent[] = [];
      const manager = new FieldEncryptionManager({
        masterKey: TEST_KEY_HEX,
        serviceName: 'test-service',
        onAudit: (event) => auditEvents.push(event),
      });

      manager.encrypt('test', 'phone', 'UserProfile');

      expect(auditEvents).toHaveLength(1);
      expect(auditEvents[0]).toMatchObject({
        action: 'encrypt',
        field: 'phone',
        model: 'UserProfile',
        serviceName: 'test-service',
        success: true,
      });
    });

    it('should call audit callback on decrypt', () => {
      const auditEvents: FieldEncryptionAuditEvent[] = [];
      const manager = new FieldEncryptionManager({
        masterKey: TEST_KEY_HEX,
        serviceName: 'test-service',
        onAudit: (event) => auditEvents.push(event),
      });

      const encrypted = manager.encrypt('test');
      auditEvents.length = 0; // Clear encrypt event

      manager.decrypt(encrypted, 'phone', 'UserProfile');

      expect(auditEvents).toHaveLength(1);
      expect(auditEvents[0]).toMatchObject({
        action: 'decrypt',
        field: 'phone',
        success: true,
      });
    });

    it('should call audit callback on blind index', () => {
      const auditEvents: FieldEncryptionAuditEvent[] = [];
      const manager = new FieldEncryptionManager({
        masterKey: TEST_KEY_HEX,
        serviceName: 'test-service',
        onAudit: (event) => auditEvents.push(event),
      });

      manager.createBlindIndex('test', 'phone', 'UserProfile');

      expect(auditEvents).toHaveLength(1);
      expect(auditEvents[0]).toMatchObject({
        action: 'blind_index',
        field: 'phone',
        success: true,
      });
    });

    it('should log failure on decrypt error', () => {
      const auditEvents: FieldEncryptionAuditEvent[] = [];
      const manager = new FieldEncryptionManager({
        masterKey: TEST_KEY_HEX,
        serviceName: 'test-service',
        onAudit: (event) => auditEvents.push(event),
      });

      try {
        manager.decrypt('$enc$v1$default$invalid');
      } catch {
        // Expected to throw
      }

      expect(auditEvents).toHaveLength(1);
      expect(auditEvents[0].success).toBe(false);
      expect(auditEvents[0].error).toBeDefined();
    });
  });
});

describe('generateFieldEncryptionKey', () => {
  it('should generate 64-character hex key', () => {
    const key = generateFieldEncryptionKey();

    expect(key).toHaveLength(64);
    expect(key).toMatch(/^[0-9a-f]+$/);
  });

  it('should generate unique keys', () => {
    const key1 = generateFieldEncryptionKey();
    const key2 = generateFieldEncryptionKey();

    expect(key1).not.toBe(key2);
  });

  it('should generate valid encryption key', () => {
    const key = generateFieldEncryptionKey();

    // Should be able to create manager with generated key
    const manager = new FieldEncryptionManager({
      masterKey: key,
      serviceName: 'test',
    });

    const encrypted = manager.encrypt('test');
    const decrypted = manager.decrypt(encrypted);

    expect(decrypted).toBe('test');
  });
});

describe('createFieldEncryptionManagerFromEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return null when FIELD_ENCRYPTION_KEY is not set', () => {
    delete process.env['FIELD_ENCRYPTION_KEY'];

    const manager = createFieldEncryptionManagerFromEnv('test-service');

    expect(manager).toBeNull();
  });

  it('should create manager when FIELD_ENCRYPTION_KEY is set', () => {
    process.env['FIELD_ENCRYPTION_KEY'] =
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

    const manager = createFieldEncryptionManagerFromEnv('test-service');

    expect(manager).not.toBeNull();
    expect(manager?.getKeyId()).toBe('default');
  });

  it('should use FIELD_ENCRYPTION_KEY_ID if set', () => {
    process.env['FIELD_ENCRYPTION_KEY'] =
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    process.env['FIELD_ENCRYPTION_KEY_ID'] = 'prod-key-v1';

    const manager = createFieldEncryptionManagerFromEnv('test-service');

    expect(manager?.getKeyId()).toBe('prod-key-v1');
  });

  it('should disable blind index if FIELD_ENCRYPTION_ENABLE_BLIND_INDEX is false', () => {
    process.env['FIELD_ENCRYPTION_KEY'] =
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    process.env['FIELD_ENCRYPTION_ENABLE_BLIND_INDEX'] = 'false';

    const manager = createFieldEncryptionManagerFromEnv('test-service');

    expect(manager?.isBlindIndexEnabled()).toBe(false);
  });
});

describe('createFieldEncryptionMiddleware', () => {
  const TEST_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  it('should encrypt on create', async () => {
    const manager = new FieldEncryptionManager({
      masterKey: TEST_KEY,
      serviceName: 'test-service',
    });

    const middleware = createFieldEncryptionMiddleware(manager, {
      UserProfile: [{ fieldName: 'phone', searchable: true }],
    });

    const params = {
      model: 'UserProfile',
      action: 'create',
      args: {
        data: { phone: '555-1234', name: 'John' },
      },
      dataPath: [],
      runInTransaction: false,
    };

    let capturedParams: typeof params | null = null;
    const next = jest.fn(async (p: typeof params) => {
      capturedParams = p;
      return { id: '1', ...p.args?.data };
    });

    await middleware(params, next);

    expect(capturedParams?.args?.data.phone).not.toBe('555-1234');
    expect(manager.isEncrypted(capturedParams?.args?.data.phone as string)).toBe(true);
    expect(capturedParams?.args?.data.phone_idx).toHaveLength(64);
    expect(capturedParams?.args?.data.name).toBe('John');
  });

  it('should decrypt on findUnique', async () => {
    const manager = new FieldEncryptionManager({
      masterKey: TEST_KEY,
      serviceName: 'test-service',
    });

    const encryptedPhone = manager.encrypt('555-1234');

    const middleware = createFieldEncryptionMiddleware(manager, {
      UserProfile: [{ fieldName: 'phone', searchable: true }],
    });

    const params = {
      model: 'UserProfile',
      action: 'findUnique',
      args: { where: { id: '1' } },
      dataPath: [],
      runInTransaction: false,
    };

    const next = jest.fn(async () => ({
      id: '1',
      phone: encryptedPhone,
      name: 'John',
    }));

    const result = (await middleware(params, next)) as Record<string, unknown>;

    expect(result.phone).toBe('555-1234');
    expect(result.name).toBe('John');
  });

  it('should decrypt array results on findMany', async () => {
    const manager = new FieldEncryptionManager({
      masterKey: TEST_KEY,
      serviceName: 'test-service',
    });

    const middleware = createFieldEncryptionMiddleware(manager, {
      UserProfile: [{ fieldName: 'phone', searchable: true }],
    });

    const params = {
      model: 'UserProfile',
      action: 'findMany',
      args: {},
      dataPath: [],
      runInTransaction: false,
    };

    const next = jest.fn(async () => [
      { id: '1', phone: manager.encrypt('555-1234') },
      { id: '2', phone: manager.encrypt('555-5678') },
    ]);

    const result = (await middleware(params, next)) as Record<string, unknown>[];

    expect(result[0].phone).toBe('555-1234');
    expect(result[1].phone).toBe('555-5678');
  });

  it('should transform where clause for searchable fields', async () => {
    const manager = new FieldEncryptionManager({
      masterKey: TEST_KEY,
      serviceName: 'test-service',
    });

    const middleware = createFieldEncryptionMiddleware(manager, {
      UserProfile: [{ fieldName: 'phone', searchable: true }],
    });

    const params = {
      model: 'UserProfile',
      action: 'findFirst',
      args: {
        where: { phone: '555-1234' },
      },
      dataPath: [],
      runInTransaction: false,
    };

    let capturedParams: typeof params | null = null;
    const next = jest.fn(async (p: typeof params) => {
      capturedParams = p;
      return null;
    });

    await middleware(params, next);

    // Should have transformed phone to phone_idx
    expect(capturedParams?.args?.where.phone).toBeUndefined();
    expect(capturedParams?.args?.where.phone_idx).toBeDefined();
    expect(capturedParams?.args?.where.phone_idx).toHaveLength(64);
  });

  it('should skip models not in config', async () => {
    const manager = new FieldEncryptionManager({
      masterKey: TEST_KEY,
      serviceName: 'test-service',
    });

    const middleware = createFieldEncryptionMiddleware(manager, {
      UserProfile: [{ fieldName: 'phone', searchable: true }],
    });

    const params = {
      model: 'OtherModel',
      action: 'create',
      args: {
        data: { phone: '555-1234' },
      },
      dataPath: [],
      runInTransaction: false,
    };

    let capturedParams: typeof params | null = null;
    const next = jest.fn(async (p: typeof params) => {
      capturedParams = p;
      return { id: '1', ...p.args?.data };
    });

    await middleware(params, next);

    // Phone should not be encrypted
    expect(capturedParams?.args?.data.phone).toBe('555-1234');
  });

  it('should handle upsert', async () => {
    const manager = new FieldEncryptionManager({
      masterKey: TEST_KEY,
      serviceName: 'test-service',
    });

    const middleware = createFieldEncryptionMiddleware(manager, {
      UserProfile: [{ fieldName: 'phone', searchable: false }],
    });

    const params = {
      model: 'UserProfile',
      action: 'upsert',
      args: {
        where: { id: '1' },
        create: { phone: '555-1234' },
        update: { phone: '555-5678' },
      },
      dataPath: [],
      runInTransaction: false,
    };

    let capturedParams: typeof params | null = null;
    const next = jest.fn(async (p: typeof params) => {
      capturedParams = p;
      return { id: '1', phone: p.args?.create?.phone };
    });

    await middleware(params, next);

    expect(manager.isEncrypted(capturedParams?.args?.create?.phone as string)).toBe(true);
    expect(manager.isEncrypted(capturedParams?.args?.update?.phone as string)).toBe(true);
  });

  it('should handle createMany', async () => {
    const manager = new FieldEncryptionManager({
      masterKey: TEST_KEY,
      serviceName: 'test-service',
    });

    const middleware = createFieldEncryptionMiddleware(manager, {
      UserProfile: [{ fieldName: 'phone', searchable: false }],
    });

    const params = {
      model: 'UserProfile',
      action: 'createMany',
      args: {
        data: [{ phone: '555-1234' }, { phone: '555-5678' }],
      },
      dataPath: [],
      runInTransaction: false,
    };

    let capturedParams: typeof params | null = null;
    const next = jest.fn(async (p: typeof params) => {
      capturedParams = p;
      return { count: 2 };
    });

    await middleware(params, next);

    const data = capturedParams?.args?.data as Array<{ phone: string }>;
    expect(manager.isEncrypted(data[0].phone)).toBe(true);
    expect(manager.isEncrypted(data[1].phone)).toBe(true);
  });
});
