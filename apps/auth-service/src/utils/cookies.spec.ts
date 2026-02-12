/**
 * Cookie Utilities Tests
 *
 * Tests for HttpOnly cookie-based token management
 *
 * POC-3 Phase 7.1: Migrate Tokens to HttpOnly Cookies
 */

import { Response } from 'express';
import {
  COOKIE_NAMES,
  REFRESH_TOKEN_COOKIE_OPTIONS,
  SESSION_COOKIE_OPTIONS,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  getRefreshTokenFromCookie,
  getSessionIdFromCookie,
} from './cookies';

// Mock response type for testing
type MockResponse = Pick<Response, 'cookie' | 'clearCookie'>;

describe('Cookie Utilities', () => {
  describe('COOKIE_NAMES', () => {
    it('should have correct cookie names', () => {
      expect(COOKIE_NAMES.REFRESH_TOKEN).toBe('mfe_refresh_token');
      expect(COOKIE_NAMES.SESSION_ID).toBe('mfe_session_id');
    });
  });

  describe('REFRESH_TOKEN_COOKIE_OPTIONS', () => {
    it('should have httpOnly enabled', () => {
      expect(REFRESH_TOKEN_COOKIE_OPTIONS.httpOnly).toBe(true);
    });

    it('should have sameSite strict', () => {
      expect(REFRESH_TOKEN_COOKIE_OPTIONS.sameSite).toBe('strict');
    });

    it('should have path set to root', () => {
      expect(REFRESH_TOKEN_COOKIE_OPTIONS.path).toBe('/');
    });

    it('should have maxAge set (derived from JWT_REFRESH_EXPIRES_IN or default 7 days)', () => {
      expect(REFRESH_TOKEN_COOKIE_OPTIONS.maxAge).toBeGreaterThan(0);
      // maxAge is computed from JWT_REFRESH_EXPIRES_IN env var or defaults to 7 days
      // In test environment without env var, expect default 7 days (604800000ms)
      // If REFRESH_TOKEN_EXPIRY is set, the value will differ
      // Just verify it's a reasonable value (between 1 hour and 30 days)
      expect(REFRESH_TOKEN_COOKIE_OPTIONS.maxAge).toBeGreaterThanOrEqual(60 * 60 * 1000); // >= 1 hour
      expect(REFRESH_TOKEN_COOKIE_OPTIONS.maxAge).toBeLessThanOrEqual(30 * 24 * 60 * 60 * 1000); // <= 30 days
    });
  });

  describe('SESSION_COOKIE_OPTIONS', () => {
    it('should have httpOnly enabled', () => {
      expect(SESSION_COOKIE_OPTIONS.httpOnly).toBe(true);
    });

    it('should have sameSite strict', () => {
      expect(SESSION_COOKIE_OPTIONS.sameSite).toBe('strict');
    });
  });

  describe('setRefreshTokenCookie', () => {
    it('should set refresh token cookie', () => {
      const mockRes: MockResponse = {
        cookie: jest.fn(),
        clearCookie: jest.fn(),
      };

      setRefreshTokenCookie(mockRes as Response, 'test-refresh-token');

      expect(mockRes.cookie).toHaveBeenCalledWith(
        COOKIE_NAMES.REFRESH_TOKEN,
        'test-refresh-token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
        })
      );
    });

    it('should set session ID cookie when provided', () => {
      const mockRes: MockResponse = {
        cookie: jest.fn(),
        clearCookie: jest.fn(),
      };

      setRefreshTokenCookie(mockRes as Response, 'test-refresh-token', 'test-session-id');

      expect(mockRes.cookie).toHaveBeenCalledTimes(2);
      expect(mockRes.cookie).toHaveBeenNthCalledWith(
        1,
        COOKIE_NAMES.REFRESH_TOKEN,
        'test-refresh-token',
        expect.any(Object)
      );
      expect(mockRes.cookie).toHaveBeenNthCalledWith(
        2,
        COOKIE_NAMES.SESSION_ID,
        'test-session-id',
        expect.any(Object)
      );
    });
  });

  describe('clearRefreshTokenCookie', () => {
    it('should clear both refresh token and session cookies', () => {
      const mockRes: MockResponse = {
        cookie: jest.fn(),
        clearCookie: jest.fn(),
      };

      clearRefreshTokenCookie(mockRes as Response);

      expect(mockRes.clearCookie).toHaveBeenCalledTimes(2);
      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        COOKIE_NAMES.REFRESH_TOKEN,
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
        })
      );
      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        COOKIE_NAMES.SESSION_ID,
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
        })
      );
    });
  });

  describe('getRefreshTokenFromCookie', () => {
    it('should return refresh token from cookies', () => {
      const cookies = {
        [COOKIE_NAMES.REFRESH_TOKEN]: 'test-refresh-token',
      };

      expect(getRefreshTokenFromCookie(cookies)).toBe('test-refresh-token');
    });

    it('should return null if no cookies provided', () => {
      expect(getRefreshTokenFromCookie(undefined)).toBeNull();
    });

    it('should return null if refresh token cookie not present', () => {
      const cookies = {
        other_cookie: 'value',
      };

      expect(getRefreshTokenFromCookie(cookies)).toBeNull();
    });
  });

  describe('getSessionIdFromCookie', () => {
    it('should return session ID from cookies', () => {
      const cookies = {
        [COOKIE_NAMES.SESSION_ID]: 'test-session-id',
      };

      expect(getSessionIdFromCookie(cookies)).toBe('test-session-id');
    });

    it('should return null if no cookies provided', () => {
      expect(getSessionIdFromCookie(undefined)).toBeNull();
    });

    it('should return null if session ID cookie not present', () => {
      const cookies = {
        other_cookie: 'value',
      };

      expect(getSessionIdFromCookie(cookies)).toBeNull();
    });
  });
});
