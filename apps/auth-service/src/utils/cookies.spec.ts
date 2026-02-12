/**
 * Cookie Utilities Tests
 *
 * Tests for HttpOnly cookie-based token management
 *
 * POC-3 Phase 7.1: Migrate Tokens to HttpOnly Cookies
 */

import {
  COOKIE_NAMES,
  REFRESH_TOKEN_COOKIE_OPTIONS,
  SESSION_COOKIE_OPTIONS,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  getRefreshTokenFromCookie,
  getSessionIdFromCookie,
} from './cookies';

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

    it('should have maxAge set (7 days by default)', () => {
      expect(REFRESH_TOKEN_COOKIE_OPTIONS.maxAge).toBeGreaterThan(0);
      // 7 days in milliseconds
      expect(REFRESH_TOKEN_COOKIE_OPTIONS.maxAge).toBe(7 * 24 * 60 * 60 * 1000);
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
      const mockRes = {
        cookie: jest.fn(),
      };

      setRefreshTokenCookie(mockRes as any, 'test-refresh-token');

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
      const mockRes = {
        cookie: jest.fn(),
      };

      setRefreshTokenCookie(mockRes as any, 'test-refresh-token', 'test-session-id');

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
      const mockRes = {
        clearCookie: jest.fn(),
      };

      clearRefreshTokenCookie(mockRes as any);

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
