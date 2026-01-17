/**
 * Token Utilities - Unit Tests
 *
 * POC-3 Phase 3.1: Updated to work with SecretManager
 */

import jwt from 'jsonwebtoken';
import {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  JwtPayload,
} from './token';
import { UserRole } from 'shared-types';

// Mock secrets for testing
const mockJwtSecret = 'test-access-secret';
const mockRefreshSecret = 'test-refresh-secret';

// Mock SecretManager
const mockSecretManager = {
  signAccessToken: jest.fn((payload: object, options: { expiresIn?: string }) => {
    return jwt.sign(payload, mockJwtSecret, {
      expiresIn: options.expiresIn || '15m',
      header: { alg: 'HS256', typ: 'JWT', kid: 'test-v1' } as jwt.JwtHeader,
    });
  }),
  signRefreshToken: jest.fn((payload: object, options: { expiresIn?: string }) => {
    return jwt.sign(payload, mockRefreshSecret, {
      expiresIn: options.expiresIn || '7d',
      header: { alg: 'HS256', typ: 'JWT', kid: 'test-refresh-v1' } as jwt.JwtHeader,
    });
  }),
  verifyAccessToken: jest.fn((token: string) => {
    try {
      const payload = jwt.verify(token, mockJwtSecret) as JwtPayload;
      return { success: true, payload, kid: 'test-v1' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }),
  verifyRefreshToken: jest.fn((token: string) => {
    try {
      const payload = jwt.verify(token, mockRefreshSecret) as JwtPayload;
      return { success: true, payload, kid: 'test-refresh-v1' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }),
};

// Mock config module
jest.mock('../config', () => ({
  config: {
    jwtSecret: 'test-access-secret',
    jwtRefreshSecret: 'test-refresh-secret',
    jwtExpiresIn: '15m',
    jwtRefreshExpiresIn: '7d',
  },
  getSecretManager: () => mockSecretManager,
}));

// Import config after mock
import { config } from '../config';

describe('Token Utilities', () => {
  const mockPayload: JwtPayload = {
    userId: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.CUSTOMER,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAccessToken', () => {
    it('should generate access token with correct payload', () => {
      const token = generateAccessToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, mockJwtSecret) as JwtPayload;
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.name).toBe(mockPayload.name);
      expect(decoded.role).toBe(mockPayload.role);
    });

    it('should generate token with correct expiration', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = jwt.decode(token) as { exp?: number; iat?: number };

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });

    it('should include kid in token header (POC-3 Phase 3.1)', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = jwt.decode(token, { complete: true });

      expect(decoded?.header.kid).toBe('test-v1');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate refresh token with correct payload', () => {
      const token = generateRefreshToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, mockRefreshSecret) as JwtPayload;
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.name).toBe(mockPayload.name);
      expect(decoded.role).toBe(mockPayload.role);
    });

    it('should generate token with longer expiration', () => {
      const token = generateRefreshToken(mockPayload);
      const decoded = jwt.decode(token) as { exp?: number; iat?: number };

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });

    it('should include kid in token header (POC-3 Phase 3.1)', () => {
      const token = generateRefreshToken(mockPayload);
      const decoded = jwt.decode(token, { complete: true });

      expect(decoded?.header.kid).toBe('test-refresh-v1');
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const tokens = generateTokenPair(mockPayload);

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.expiresIn).toBe(config.jwtExpiresIn);

      // Verify both tokens are valid
      const accessDecoded = jwt.verify(
        tokens.accessToken,
        mockJwtSecret
      ) as JwtPayload;
      const refreshDecoded = jwt.verify(
        tokens.refreshToken,
        mockRefreshSecret
      ) as JwtPayload;

      expect(accessDecoded.userId).toBe(mockPayload.userId);
      expect(refreshDecoded.userId).toBe(mockPayload.userId);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = verifyAccessToken(token);

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.name).toBe(mockPayload.name);
      expect(decoded.role).toBe(mockPayload.role);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid-token';

      expect(() => verifyAccessToken(invalidToken)).toThrow();
    });

    it('should throw error for token signed with wrong secret', () => {
      const wrongToken = jwt.sign(mockPayload, 'wrong-secret');

      expect(() => verifyAccessToken(wrongToken)).toThrow();
    });

    it('should throw error for expired token', () => {
      // Create an expired token directly (not through SecretManager mock)
      mockSecretManager.verifyAccessToken.mockReturnValueOnce({
        success: false,
        error: 'jwt expired',
      });

      const expiredToken = jwt.sign(mockPayload, mockJwtSecret, {
        expiresIn: '-1h', // Expired 1 hour ago
      });

      expect(() => verifyAccessToken(expiredToken)).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', () => {
      const token = generateRefreshToken(mockPayload);
      const decoded = verifyRefreshToken(token);

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.name).toBe(mockPayload.name);
      expect(decoded.role).toBe(mockPayload.role);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid-token';

      expect(() => verifyRefreshToken(invalidToken)).toThrow();
    });

    it('should throw error for token signed with wrong secret', () => {
      const wrongToken = jwt.sign(mockPayload, 'wrong-secret');

      expect(() => verifyRefreshToken(wrongToken)).toThrow();
    });

    it('should throw error for expired token', () => {
      // Create an expired token directly
      mockSecretManager.verifyRefreshToken.mockReturnValueOnce({
        success: false,
        error: 'jwt expired',
      });

      const expiredToken = jwt.sign(mockPayload, mockRefreshSecret, {
        expiresIn: '-1d', // Expired 1 day ago
      });

      expect(() => verifyRefreshToken(expiredToken)).toThrow();
    });
  });
});
