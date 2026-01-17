/**
 * Secrets Encryption Tests
 */

import {
  LocalEncryptionProvider,
  SecretsEncryptionManager,
  generateMasterKey,
  isEncrypted,
  parseEncryptedValue,
  formatEncryptedValue,
  SecretAccessEvent,
} from './encryption';

describe('Encryption Utilities', () => {
  describe('generateMasterKey', () => {
    it('should generate a 64-character hex string', () => {
      const key = generateMasterKey();
      expect(key).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(key)).toBe(true);
    });

    it('should generate unique keys', () => {
      const key1 = generateMasterKey();
      const key2 = generateMasterKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe('isEncrypted', () => {
    it('should return true for encrypted values', () => {
      expect(isEncrypted('ENC[local:YWJjZGVm]')).toBe(true);
      expect(isEncrypted('ENC[aws-kms:base64data]')).toBe(true);
    });

    it('should return false for non-encrypted values', () => {
      expect(isEncrypted('plain-text')).toBe(false);
      expect(isEncrypted('ENC[broken')).toBe(false);
      expect(isEncrypted('')).toBe(false);
    });
  });

  describe('parseEncryptedValue', () => {
    it('should parse valid encrypted values', () => {
      const result = parseEncryptedValue('ENC[local:YWJjZGVm]');
      expect(result).toEqual({
        provider: 'local',
        ciphertext: 'YWJjZGVm',
      });
    });

    it('should return null for invalid values', () => {
      expect(parseEncryptedValue('plain-text')).toBeNull();
      expect(parseEncryptedValue('ENC[broken')).toBeNull();
    });
  });

  describe('formatEncryptedValue', () => {
    it('should format encrypted values correctly', () => {
      const result = formatEncryptedValue('local', 'YWJjZGVm');
      expect(result).toBe('ENC[local:YWJjZGVm]');
    });
  });
});

describe('LocalEncryptionProvider', () => {
  const testKeyHex = 'a'.repeat(64); // Valid 256-bit hex key
  const testKeyBase64 = Buffer.alloc(32).fill('a').toString('base64');

  describe('constructor', () => {
    it('should accept 64-character hex key', () => {
      const provider = new LocalEncryptionProvider(testKeyHex);
      expect(provider.isAvailable()).toBe(true);
    });

    it('should accept base64 key', () => {
      const provider = new LocalEncryptionProvider(testKeyBase64);
      expect(provider.isAvailable()).toBe(true);
    });

    it('should throw on invalid key length', () => {
      expect(() => new LocalEncryptionProvider('short')).toThrow(/Invalid master key length/);
    });

    it('should accept custom key ID', () => {
      const provider = new LocalEncryptionProvider(testKeyHex, 'my-key-v1');
      expect(provider.getKeyId()).toBe('my-key-v1');
    });
  });

  describe('encrypt/decrypt', () => {
    let provider: LocalEncryptionProvider;

    beforeEach(() => {
      provider = new LocalEncryptionProvider(testKeyHex);
    });

    it('should encrypt and decrypt a simple string', async () => {
      const plaintext = 'my-secret-password';
      const encrypted = await provider.encrypt(plaintext);
      const decrypted = await provider.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt unicode strings', async () => {
      const plaintext = '密码123🔐';
      const encrypted = await provider.encrypt(plaintext);
      const decrypted = await provider.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt long strings', async () => {
      const plaintext = 'x'.repeat(10000);
      const encrypted = await provider.encrypt(plaintext);
      const decrypted = await provider.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt empty string', async () => {
      const plaintext = '';
      const encrypted = await provider.encrypt(plaintext);
      const decrypted = await provider.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertexts for same plaintext', async () => {
      const plaintext = 'same-secret';
      const encrypted1 = await provider.encrypt(plaintext);
      const encrypted2 = await provider.encrypt(plaintext);
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should throw on invalid ciphertext', async () => {
      await expect(provider.decrypt('invalid-base64!')).rejects.toThrow();
    });

    it('should throw on tampered ciphertext', async () => {
      const encrypted = await provider.encrypt('secret');
      const tampered = Buffer.from(encrypted, 'base64');
      tampered[20] ^= 0xff; // Flip a byte
      await expect(provider.decrypt(tampered.toString('base64'))).rejects.toThrow();
    });

    it('should throw on too short ciphertext', async () => {
      await expect(provider.decrypt(Buffer.alloc(10).toString('base64'))).rejects.toThrow(
        /too short/
      );
    });
  });
});

describe('SecretsEncryptionManager', () => {
  const testKeyHex = generateMasterKey();
  let manager: SecretsEncryptionManager;
  let provider: LocalEncryptionProvider;
  const auditEvents: SecretAccessEvent[] = [];

  beforeEach(() => {
    auditEvents.length = 0;
    manager = new SecretsEncryptionManager({
      serviceName: 'test-service',
      enableCache: true,
      cacheTtlMs: 1000,
      auditCallback: (event) => auditEvents.push(event),
    });
    provider = new LocalEncryptionProvider(testKeyHex, 'test-key-v1');
    manager.registerProvider(provider, true);
  });

  describe('registerProvider', () => {
    it('should register providers', () => {
      expect(manager.getProviderNames()).toContain('local');
    });

    it('should set first provider as default', () => {
      const newManager = new SecretsEncryptionManager({});
      newManager.registerProvider(provider);
      expect(newManager.getProviderNames()).toContain('local');
    });
  });

  describe('encrypt', () => {
    it('should encrypt values with ENC[provider:] format', async () => {
      const encrypted = await manager.encrypt('my-secret');
      expect(encrypted).toMatch(/^ENC\[local:.+\]$/);
    });

    it('should audit encrypt operations', async () => {
      await manager.encrypt('my-secret', 'API_KEY');
      expect(auditEvents).toHaveLength(1);
      expect(auditEvents[0]).toMatchObject({
        action: 'encrypt',
        provider: 'local',
        secretName: 'API_KEY',
        success: true,
        serviceName: 'test-service',
      });
    });

    it('should throw if no provider registered', async () => {
      const emptyManager = new SecretsEncryptionManager({});
      await expect(emptyManager.encrypt('secret')).rejects.toThrow(/No encryption provider/);
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted values', async () => {
      const plaintext = 'my-secret-value';
      const encrypted = await manager.encrypt(plaintext);
      const decrypted = await manager.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should return non-encrypted values as-is', async () => {
      const plaintext = 'not-encrypted';
      const result = await manager.decrypt(plaintext);
      expect(result).toBe(plaintext);
    });

    it('should audit decrypt operations', async () => {
      const encrypted = await manager.encrypt('secret');
      auditEvents.length = 0;
      await manager.decrypt(encrypted, 'DB_PASSWORD');
      expect(auditEvents).toHaveLength(1);
      expect(auditEvents[0]).toMatchObject({
        action: 'decrypt',
        provider: 'local',
        secretName: 'DB_PASSWORD',
        success: true,
      });
    });

    it('should cache decrypted values', async () => {
      const encrypted = await manager.encrypt('cached-secret');
      auditEvents.length = 0;

      // First decrypt - should hit provider
      await manager.decrypt(encrypted, 'CACHED_KEY');
      expect(auditEvents).toHaveLength(1);
      expect(auditEvents[0].action).toBe('decrypt');

      // Second decrypt - should hit cache
      await manager.decrypt(encrypted, 'CACHED_KEY');
      expect(auditEvents).toHaveLength(2);
      expect(auditEvents[1].action).toBe('access');
      expect(auditEvents[1].provider).toBe('cache');
    });

    it('should throw on unknown provider', async () => {
      await expect(manager.decrypt('ENC[unknown:abc]')).rejects.toThrow(/Unknown encryption provider/);
    });

    it('should audit failed decryption', async () => {
      auditEvents.length = 0;
      await expect(manager.decrypt('ENC[local:invalid]')).rejects.toThrow();
      expect(auditEvents).toHaveLength(1);
      expect(auditEvents[0]).toMatchObject({
        action: 'decrypt',
        success: false,
      });
      expect(auditEvents[0].error).toBeDefined();
    });
  });

  describe('decryptObject', () => {
    it('should decrypt all encrypted values in object', async () => {
      const secret1 = await manager.encrypt('value1');
      const secret2 = await manager.encrypt('value2');

      const obj = {
        plainKey: 'plain-value',
        secretKey1: secret1,
        secretKey2: secret2,
        numberKey: 123,
      };

      const result = await manager.decryptObject(obj);
      expect(result).toEqual({
        plainKey: 'plain-value',
        secretKey1: 'value1',
        secretKey2: 'value2',
        numberKey: 123,
      });
    });
  });

  describe('decryptObjectDeep', () => {
    it('should decrypt nested encrypted values', async () => {
      const secret = await manager.encrypt('nested-secret');

      const obj = {
        level1: {
          level2: {
            secret: secret,
          },
          plain: 'value',
        },
      };

      const result = await manager.decryptObjectDeep(obj);
      expect(result.level1.level2.secret).toBe('nested-secret');
      expect(result.level1.plain).toBe('value');
    });
  });

  describe('clearCache', () => {
    it('should clear the decryption cache', async () => {
      const encrypted = await manager.encrypt('cached');
      await manager.decrypt(encrypted);
      auditEvents.length = 0;

      // Should be cached
      await manager.decrypt(encrypted);
      expect(auditEvents[0].provider).toBe('cache');

      // Clear cache
      manager.clearCache();
      auditEvents.length = 0;

      // Should decrypt again
      await manager.decrypt(encrypted);
      expect(auditEvents[0].action).toBe('decrypt');
      expect(auditEvents[0].provider).toBe('local');
    });
  });
});
