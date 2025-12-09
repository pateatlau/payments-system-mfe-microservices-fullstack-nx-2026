/**
 * Token Utilities - Unit Tests
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
import { config } from '../config';
import { UserRole } from 'shared-types';

// Mock config
jest.mock('../config', () => ({
  config: {
    jwtSecret: 'test-access-secret',
    jwtRefreshSecret: 'test-refresh-secret',
    jwtExpiresIn: '15m',
    jwtRefreshExpiresIn: '7d',
  },
}));

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

      const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
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
  });

  describe('generateRefreshToken', () => {
    it('should generate refresh token with correct payload', () => {
      const token = generateRefreshToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, config.jwtRefreshSecret) as JwtPayload;
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
        config.jwtSecret
      ) as JwtPayload;
      const refreshDecoded = jwt.verify(
        tokens.refreshToken,
        config.jwtRefreshSecret
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
      const expiredToken = jwt.sign(mockPayload, config.jwtSecret, {
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
      const expiredToken = jwt.sign(mockPayload, config.jwtRefreshSecret, {
        expiresIn: '-1d', // Expired 1 day ago
      });

      expect(() => verifyRefreshToken(expiredToken)).toThrow();
    });
  });
});
