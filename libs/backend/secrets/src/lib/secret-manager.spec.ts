/**
 * Secret Manager Tests
 */

import { SecretManager } from './secret-manager';
import type { JwtSecret, SecretManagerConfig } from './types';
import * as jwt from 'jsonwebtoken';

describe('SecretManager', () => {
  const createTestSecret = (
    kid: string,
    isActive = true,
    canVerify = true
  ): JwtSecret => ({
    kid,
    secret: `test-secret-${kid}`,
    createdAt: new Date(),
    expiresAt: null,
    isActive,
    canVerify,
  });

  const createTestConfig = (): SecretManagerConfig => ({
    jwtSecrets: [
      createTestSecret('v2', true, true),
      createTestSecret('v1', false, true),
    ],
    jwtRefreshSecrets: [
      createTestSecret('refresh-v2', true, true),
      createTestSecret('refresh-v1', false, true),
    ],
  });

  describe('constructor', () => {
    it('should create instance with valid config', () => {
      const config = createTestConfig();
      const manager = new SecretManager(config);
      expect(manager).toBeInstanceOf(SecretManager);
    });

    it('should throw if no active JWT secret', () => {
      const config = createTestConfig();
      config.jwtSecrets = [createTestSecret('v1', false, true)];

      expect(() => new SecretManager(config)).toThrow(
        'At least one active JWT secret is required'
      );
    });

    it('should throw if no active refresh secret', () => {
      const config = createTestConfig();
      config.jwtRefreshSecrets = [createTestSecret('v1', false, true)];

      expect(() => new SecretManager(config)).toThrow(
        'At least one active refresh token secret is required'
      );
    });
  });

  describe('getActiveJwtSecret', () => {
    it('should return the active JWT secret', () => {
      const manager = new SecretManager(createTestConfig());
      const active = manager.getActiveJwtSecret();

      expect(active.kid).toBe('v2');
      expect(active.isActive).toBe(true);
    });
  });

  describe('getVerifiableJwtSecrets', () => {
    it('should return all secrets that can verify', () => {
      const manager = new SecretManager(createTestConfig());
      const verifiable = manager.getVerifiableJwtSecrets();

      expect(verifiable).toHaveLength(2);
      expect(verifiable.map((s) => s.kid)).toEqual(['v2', 'v1']);
    });
  });

  describe('signAccessToken', () => {
    it('should sign token with active secret and include kid in header', () => {
      const manager = new SecretManager(createTestConfig());
      const payload = { userId: '123', role: 'CUSTOMER' };

      const token = manager.signAccessToken(payload, { expiresIn: '15m' });

      // Decode and check header
      const decoded = jwt.decode(token, { complete: true });
      expect(decoded?.header.kid).toBe('v2');
      expect(decoded?.header.alg).toBe('HS256');

      // Verify payload
      expect(decoded?.payload).toMatchObject(payload);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify token signed with active secret', () => {
      const manager = new SecretManager(createTestConfig());
      const payload = { userId: '123', role: 'CUSTOMER' };
      const token = manager.signAccessToken(payload);

      const result = manager.verifyAccessToken<typeof payload>(token);

      expect(result.success).toBe(true);
      expect(result.payload?.userId).toBe('123');
      expect(result.kid).toBe('v2');
    });

    it('should verify token signed with old secret (graceful rotation)', () => {
      const config = createTestConfig();
      const manager = new SecretManager(config);

      // Simulate token signed with old secret
      const oldSecret = config.jwtSecrets[1]; // v1
      const payload = { userId: '456', role: 'ADMIN' };
      const token = jwt.sign(payload, oldSecret.secret, {
        header: { alg: 'HS256', typ: 'JWT', kid: 'v1' } as jwt.JwtHeader,
      });

      const result = manager.verifyAccessToken<typeof payload>(token);

      expect(result.success).toBe(true);
      expect(result.payload?.userId).toBe('456');
      expect(result.kid).toBe('v1');
    });

    it('should fail for token with unknown kid', () => {
      const manager = new SecretManager(createTestConfig());
      const token = jwt.sign(
        { userId: '789' },
        'wrong-secret',
        { header: { alg: 'HS256', typ: 'JWT', kid: 'unknown' } as jwt.JwtHeader }
      );

      const result = manager.verifyAccessToken(token);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should fail for expired token', () => {
      const manager = new SecretManager(createTestConfig());
      const activeSecret = manager.getActiveJwtSecret();

      const token = jwt.sign(
        { userId: '123' },
        activeSecret.secret,
        {
          expiresIn: '-1s', // Already expired
          header: { alg: 'HS256', typ: 'JWT', kid: activeSecret.kid } as jwt.JwtHeader,
        }
      );

      const result = manager.verifyAccessToken(token);

      expect(result.success).toBe(false);
      expect(result.error).toContain('expired');
    });

    it('should try all secrets for legacy tokens without kid (backwards compatible)', () => {
      const config = createTestConfig();
      const manager = new SecretManager(config);

      // Legacy token without kid
      const payload = { userId: '123' };
      const token = jwt.sign(payload, config.jwtSecrets[0].secret);

      const result = manager.verifyAccessToken<typeof payload>(token);

      expect(result.success).toBe(true);
      expect(result.payload?.userId).toBe('123');
    });
  });

  describe('signRefreshToken / verifyRefreshToken', () => {
    it('should sign and verify refresh tokens separately', () => {
      const manager = new SecretManager(createTestConfig());
      const payload = { userId: '123' };

      const token = manager.signRefreshToken(payload, { expiresIn: '7d' });
      const result = manager.verifyRefreshToken<typeof payload>(token);

      expect(result.success).toBe(true);
      expect(result.payload?.userId).toBe('123');
      expect(result.kid).toBe('refresh-v2');
    });

    it('should not cross-verify access and refresh tokens', () => {
      const manager = new SecretManager(createTestConfig());
      const payload = { userId: '123' };

      const accessToken = manager.signAccessToken(payload);
      const refreshResult = manager.verifyRefreshToken(accessToken);

      // Should fail because access token uses different secret
      expect(refreshResult.success).toBe(false);
    });
  });

  describe('generateSecret', () => {
    it('should generate a cryptographically secure secret', () => {
      const secret1 = SecretManager.generateSecret();
      const secret2 = SecretManager.generateSecret();

      expect(secret1.secret).toHaveLength(88); // 64 bytes base64
      expect(secret2.secret).toHaveLength(88);
      expect(secret1.secret).not.toBe(secret2.secret); // Different each time
      expect(secret1.kid).toMatch(/^key-\d{4}-\d{2}-\d{2}-[a-f0-9]{8}$/);
    });

    it('should accept custom kid', () => {
      const secret = SecretManager.generateSecret({ kid: 'my-custom-key' });
      expect(secret.kid).toBe('my-custom-key');
    });

    it('should set expiry date when specified', () => {
      const secret = SecretManager.generateSecret({ expiresInDays: 90 });

      expect(secret.expiresAt).not.toBeNull();
      const expectedExpiry = Date.now() + 90 * 24 * 60 * 60 * 1000;
      const actualExpiry = secret.expiresAt!.getTime();
      expect(actualExpiry).toBeGreaterThan(expectedExpiry - 1000);
      expect(actualExpiry).toBeLessThan(expectedExpiry + 1000);
    });

    it('should generate active and verifiable secret by default', () => {
      const secret = SecretManager.generateSecret();

      expect(secret.isActive).toBe(true);
      expect(secret.canVerify).toBe(true);
    });
  });

  describe('rotateJwtSecret', () => {
    it('should add new secret and mark old as inactive', () => {
      const manager = new SecretManager(createTestConfig());
      const newSecret = SecretManager.generateSecret({ kid: 'v3' });

      manager.rotateJwtSecret(newSecret, 'admin', 'scheduled rotation');

      // New secret should be active
      const active = manager.getActiveJwtSecret();
      expect(active.kid).toBe('v3');

      // Old secrets should still be verifiable
      const verifiable = manager.getVerifiableJwtSecrets();
      expect(verifiable.map((s) => s.kid)).toContain('v2');
      expect(verifiable.map((s) => s.kid)).toContain('v1');
    });

    it('should record rotation in history', () => {
      const manager = new SecretManager(createTestConfig());
      const newSecret = SecretManager.generateSecret({ kid: 'v3' });

      manager.rotateJwtSecret(newSecret, 'system', 'test rotation');

      const history = manager.getRotationHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({
        oldKid: 'v2',
        newKid: 'v3',
        triggeredBy: 'system',
        reason: 'test rotation',
      });
    });

    it('should clean up old secrets beyond keep limit', () => {
      const config = createTestConfig();
      // Add more old secrets
      config.jwtSecrets.push(createTestSecret('v0', false, true));

      const manager = new SecretManager(config, {
        autoRotateDays: 90,
        warningDays: 14,
        keepOldSecrets: 1, // Only keep 1 old secret
      });

      const newSecret = SecretManager.generateSecret({ kid: 'v3' });
      manager.rotateJwtSecret(newSecret, 'admin', 'test');

      // After rotation: v3 (active), v2 (inactive, verifiable), v1 (disabled), v0 (disabled)
      const verifiable = manager.getVerifiableJwtSecrets();

      // Should have: v3 (active) + v2 (kept) = 2 verifiable
      // v1 and v0 should have canVerify = false now
      expect(verifiable.map((s) => s.kid)).toEqual(['v3', 'v2']);
    });
  });

  describe('getSecretsStatus', () => {
    it('should return status without exposing secret values', () => {
      const manager = new SecretManager(createTestConfig());
      const status = manager.getSecretsStatus();

      expect(status.jwtSecrets).toHaveLength(2);
      expect(status.jwtSecrets[0]).toHaveProperty('kid', 'v2');
      expect(status.jwtSecrets[0]).toHaveProperty('isActive', true);
      expect(status.jwtSecrets[0]).not.toHaveProperty('secret');

      expect(status.refreshSecrets).toHaveLength(2);
      expect(status.refreshSecrets[0]).not.toHaveProperty('secret');
    });
  });

  describe('checkExpiringSecrets', () => {
    it('should call callback for expiring secrets', () => {
      const onSecretExpiring = jest.fn();
      const expiringSecret: JwtSecret = {
        kid: 'expiring',
        secret: 'test',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
        isActive: true,
        canVerify: true,
      };

      const manager = new SecretManager(
        {
          jwtSecrets: [expiringSecret],
          jwtRefreshSecrets: [createTestSecret('refresh-v1', true, true)],
          onSecretExpiring,
        },
        {
          autoRotateDays: 90,
          warningDays: 14, // Warn when < 14 days
          keepOldSecrets: 2,
        }
      );

      manager.checkExpiringSecrets();

      expect(onSecretExpiring).toHaveBeenCalledWith(expiringSecret, 5);
    });

    it('should disable verification for expired secrets', () => {
      const expiredSecret: JwtSecret = {
        kid: 'expired',
        secret: 'test',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() - 1000), // Already expired
        isActive: true,
        canVerify: true,
      };

      const manager = new SecretManager({
        jwtSecrets: [
          createTestSecret('active', true, true),
          expiredSecret,
        ],
        jwtRefreshSecrets: [createTestSecret('refresh-v1', true, true)],
      });

      manager.checkExpiringSecrets();

      expect(expiredSecret.canVerify).toBe(false);
      expect(expiredSecret.isActive).toBe(false);
    });
  });
});
