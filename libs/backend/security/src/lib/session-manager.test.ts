/**
 * Session Manager Service Tests
 */

import { SessionManager, createSessionManager } from './session-manager';
import type { SessionRequestContext } from './session-types';
import type Redis from 'ioredis';

// Mock Redis type - partial implementation for testing
type MockRedis = Pick<Redis, 'get' | 'set' | 'del' | 'sadd' | 'smembers' | 'srem' | 'expire' | 'lpush' | 'ltrim' | 'lrange'> & {
  _storage: Map<string, string>;
  _sets: Map<string, Set<string>>;
  _clear: () => void;
};

// Mock Redis
const createMockRedis = (): MockRedis => {
  const storage = new Map<string, string>();
  const sets = new Map<string, Set<string>>();
  const expires = new Map<string, number>();

  return {
    get: jest.fn(async (key: string) => storage.get(key) || null),
    set: jest.fn(async (key: string, value: string, _ex?: string, _ttl?: number) => {
      storage.set(key, value);
      return 'OK';
    }),
    del: jest.fn(async (key: string) => {
      storage.delete(key);
      return 1;
    }),
    sadd: jest.fn(async (key: string, member: string) => {
      if (!sets.has(key)) {
        sets.set(key, new Set());
      }
      sets.get(key)!.add(member);
      return 1;
    }),
    smembers: jest.fn(async (key: string) => {
      const set = sets.get(key);
      return set ? Array.from(set) : [];
    }),
    srem: jest.fn(async (key: string, member: string) => {
      const set = sets.get(key);
      if (set) {
        set.delete(member);
      }
      return 1;
    }),
    expire: jest.fn(async (key: string, ttl: number) => {
      expires.set(key, Date.now() + ttl * 1000);
      return 1;
    }),
    lpush: jest.fn(async () => 1),
    ltrim: jest.fn(async () => 'OK'),
    lrange: jest.fn(async () => []),
    // Helpers for testing
    _storage: storage,
    _sets: sets,
    _clear: () => {
      storage.clear();
      sets.clear();
      expires.clear();
    },
  };
};

describe('SessionManager', () => {
  let redis: MockRedis;
  let sessionManager: SessionManager;

  const defaultContext: SessionRequestContext = {
    ip: '192.168.1.100',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    acceptLanguage: 'en-US,en;q=0.9',
    timezone: 'America/New_York',
  };

  beforeEach(() => {
    redis = createMockRedis();
    sessionManager = new SessionManager(redis as unknown as Redis, {
      maxConcurrentSessions: 5,
      sessionTimeoutSeconds: 1800, // 30 minutes
      absoluteSessionLifetimeSeconds: 86400, // 24 hours
      enableFingerprinting: true,
      enableActivityTracking: true,
      validateFingerprintOnRequest: false, // Disable for easier testing
    });
  });

  afterEach(() => {
    redis._clear();
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create a new session', async () => {
      const result = await sessionManager.createSession(
        'user-123',
        'refresh-token-hash',
        defaultContext
      );

      expect(result.session).toBeDefined();
      expect(result.session.sessionId).toBeDefined();
      expect(result.session.userId).toBe('user-123');
      expect(result.session.isActive).toBe(true);
      expect(result.session.fingerprint.browser.name).toBe('Chrome');
      expect(result.session.fingerprint.deviceType).toBe('desktop');
      expect(result.evictedSession).toBeNull();
    });

    it('should store session in Redis', async () => {
      await sessionManager.createSession(
        'user-123',
        'refresh-token-hash',
        defaultContext
      );

      expect(redis.set).toHaveBeenCalled();
      expect(redis.sadd).toHaveBeenCalled();
    });

    it('should evict oldest session when limit reached', async () => {
      // Create manager with limit of 2 sessions
      const limitedManager = new SessionManager(redis as unknown as Redis, {
        maxConcurrentSessions: 2,
        evictionStrategy: 'oldest',
        enableActivityTracking: false,
      });

      // Create first session
      const result1 = await limitedManager.createSession(
        'user-123',
        'token-1',
        defaultContext
      );
      expect(result1.evictedSession).toBeNull();

      // Create second session
      const result2 = await limitedManager.createSession(
        'user-123',
        'token-2',
        { ...defaultContext, ip: '192.168.1.101' }
      );
      expect(result2.evictedSession).toBeNull();

      // Create third session - should evict first
      const result3 = await limitedManager.createSession(
        'user-123',
        'token-3',
        { ...defaultContext, ip: '192.168.1.102' }
      );
      expect(result3.evictedSession).not.toBeNull();
      expect(result3.evictedSession?.sessionId).toBe(result1.session.sessionId);
    });

    it('should warn when approaching session limit', async () => {
      const limitedManager = new SessionManager(redis as unknown as Redis, {
        maxConcurrentSessions: 2,
        enableActivityTracking: false,
      });

      // Create first session (1 of 2)
      const result1 = await limitedManager.createSession(
        'user-123',
        'token-1',
        defaultContext
      );
      expect(result1.warning).toBeNull();

      // Create second session (2 of 2 = at limit)
      const result2 = await limitedManager.createSession(
        'user-123',
        'token-2',
        { ...defaultContext, ip: '192.168.1.101' }
      );
      expect(result2.warning).toContain('2 active sessions');
    });

    it('should throw when limit reached with no eviction strategy', async () => {
      const strictManager = new SessionManager(redis as unknown as Redis, {
        maxConcurrentSessions: 1,
        evictionStrategy: 'none',
        enableActivityTracking: false,
      });

      // Create first session
      await strictManager.createSession('user-123', 'token-1', defaultContext);

      // Second session should throw
      await expect(
        strictManager.createSession('user-123', 'token-2', defaultContext)
      ).rejects.toThrow('Maximum concurrent sessions');
    });
  });

  describe('validateSession', () => {
    it('should validate an active session', async () => {
      const { session } = await sessionManager.createSession(
        'user-123',
        'token-hash',
        defaultContext
      );

      const result = await sessionManager.validateSession(
        session.sessionId,
        defaultContext
      );

      expect(result.isValid).toBe(true);
      expect(result.session).toBeDefined();
      expect(result.reason).toBeNull();
    });

    it('should reject non-existent session', async () => {
      const result = await sessionManager.validateSession(
        'non-existent-id',
        defaultContext
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('SESSION_NOT_FOUND');
    });

    it('should reject inactive session', async () => {
      const { session } = await sessionManager.createSession(
        'user-123',
        'token-hash',
        defaultContext
      );

      // Manually deactivate
      await sessionManager.logout(session.sessionId, defaultContext);

      const result = await sessionManager.validateSession(
        session.sessionId,
        defaultContext
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('SESSION_INACTIVE');
    });

    it('should reject force-logged-out session', async () => {
      const { session } = await sessionManager.createSession(
        'user-123',
        'token-hash',
        defaultContext
      );

      // Force logout
      await sessionManager.terminateSession(session.sessionId, {
        reason: 'Admin action',
        initiatedBy: 'admin',
      });

      const result = await sessionManager.validateSession(
        session.sessionId,
        defaultContext
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('SESSION_FORCE_LOGOUT');
    });

    it('should detect fingerprint mismatch when validation enabled', async () => {
      const strictManager = new SessionManager(redis as unknown as Redis, {
        enableFingerprinting: true,
        validateFingerprintOnRequest: true,
        fingerprintMismatchTolerance: 0.1, // Very strict
        enableActivityTracking: false,
      });

      const { session } = await strictManager.createSession(
        'user-123',
        'token-hash',
        defaultContext
      );

      // Validate with completely different fingerprint
      const differentContext: SessionRequestContext = {
        ip: '10.0.0.1',
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) Safari/604.1',
        acceptLanguage: 'de-DE',
        timezone: 'Europe/Berlin',
      };

      const result = await strictManager.validateSession(
        session.sessionId,
        differentContext
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('FINGERPRINT_MISMATCH');
      expect(result.fingerprintMatch).toBe(false);
    });
  });

  describe('refreshSession', () => {
    it('should refresh an active session', async () => {
      const { session } = await sessionManager.createSession(
        'user-123',
        'old-token-hash',
        defaultContext
      );

      const oldActivity = session.lastActivityAt;

      // Small delay to ensure timestamp changes
      await new Promise((r) => setTimeout(r, 10));

      const refreshed = await sessionManager.refreshSession(
        session.sessionId,
        'new-token-hash',
        defaultContext
      );

      expect(refreshed).not.toBeNull();
      expect(refreshed!.refreshTokenHash).toBe('new-token-hash');
      expect(new Date(refreshed!.lastActivityAt).getTime()).toBeGreaterThan(
        new Date(oldActivity).getTime()
      );
    });

    it('should return null for non-existent session', async () => {
      const result = await sessionManager.refreshSession(
        'non-existent',
        'token',
        defaultContext
      );

      expect(result).toBeNull();
    });

    it('should return null for inactive session', async () => {
      const { session } = await sessionManager.createSession(
        'user-123',
        'token-hash',
        defaultContext
      );

      await sessionManager.logout(session.sessionId, defaultContext);

      const result = await sessionManager.refreshSession(
        session.sessionId,
        'new-token',
        defaultContext
      );

      expect(result).toBeNull();
    });
  });

  describe('getUserSessions', () => {
    it('should return all sessions for a user', async () => {
      await sessionManager.createSession('user-123', 'token-1', defaultContext);
      await sessionManager.createSession('user-123', 'token-2', {
        ...defaultContext,
        ip: '192.168.1.101',
      });
      await sessionManager.createSession('user-456', 'token-3', defaultContext);

      const sessions = await sessionManager.getUserSessions('user-123');

      expect(sessions).toHaveLength(2);
      expect(sessions.every((s) => s.userId === 'user-123')).toBe(true);
    });

    it('should return sessions sorted by last activity', async () => {
      const result1 = await sessionManager.createSession(
        'user-123',
        'token-1',
        defaultContext
      );

      await new Promise((r) => setTimeout(r, 10));

      const result2 = await sessionManager.createSession(
        'user-123',
        'token-2',
        { ...defaultContext, ip: '192.168.1.101' }
      );

      const sessions = await sessionManager.getUserSessions('user-123');

      expect(sessions[0].sessionId).toBe(result2.session.sessionId); // Most recent first
      expect(sessions[1].sessionId).toBe(result1.session.sessionId);
    });

    it('should return empty array for user with no sessions', async () => {
      const sessions = await sessionManager.getUserSessions('unknown-user');
      expect(sessions).toHaveLength(0);
    });
  });

  describe('getSessionList', () => {
    it('should return formatted session list for user', async () => {
      const { session } = await sessionManager.createSession(
        'user-123',
        'token-1',
        defaultContext
      );

      const list = await sessionManager.getSessionList(
        'user-123',
        session.sessionId
      );

      expect(list.sessions).toHaveLength(1);
      expect(list.totalCount).toBe(1);
      expect(list.maxSessions).toBe(5);
      expect(list.sessions[0].isCurrent).toBe(true);
      expect(list.sessions[0].browser).toContain('Chrome');
      expect(list.sessions[0].deviceType).toBe('desktop');
    });

    it('should mark correct session as current', async () => {
      const result1 = await sessionManager.createSession(
        'user-123',
        'token-1',
        defaultContext
      );
      const result2 = await sessionManager.createSession(
        'user-123',
        'token-2',
        { ...defaultContext, ip: '192.168.1.101' }
      );

      const list = await sessionManager.getSessionList(
        'user-123',
        result1.session.sessionId
      );

      const currentSession = list.sessions.find((s) => s.isCurrent);
      const otherSession = list.sessions.find((s) => !s.isCurrent);

      expect(currentSession?.sessionId).toBe(result1.session.sessionId);
      expect(otherSession?.sessionId).toBe(result2.session.sessionId);
    });
  });

  describe('terminateSession', () => {
    it('should terminate a session', async () => {
      const { session } = await sessionManager.createSession(
        'user-123',
        'token-hash',
        defaultContext
      );

      const result = await sessionManager.terminateSession(session.sessionId, {
        reason: 'Test termination',
        initiatedBy: 'test',
      });

      expect(result).toBe(true);

      const terminated = await sessionManager.getSession(session.sessionId);
      expect(terminated?.isActive).toBe(false);
      expect(terminated?.forcedLogout).toBe(true);
      expect(terminated?.forcedLogoutReason).toBe('Test termination');
      expect(terminated?.forcedLogoutBy).toBe('test');
    });

    it('should return false for non-existent session', async () => {
      const result = await sessionManager.terminateSession('non-existent', {
        reason: 'Test',
        initiatedBy: 'test',
      });

      expect(result).toBe(false);
    });
  });

  describe('forceLogout', () => {
    it('should terminate all sessions for a user', async () => {
      await sessionManager.createSession('user-123', 'token-1', defaultContext);
      await sessionManager.createSession('user-123', 'token-2', {
        ...defaultContext,
        ip: '192.168.1.101',
      });

      const result = await sessionManager.forceLogout({
        userId: 'user-123',
        reason: 'Security breach',
        initiatedBy: 'admin',
        notify: true,
      });

      expect(result.terminatedCount).toBe(2);
      expect(result.terminatedSessionIds).toHaveLength(2);

      const sessions = await sessionManager.getUserSessions('user-123');
      expect(sessions.every((s) => !s.isActive)).toBe(true);
    });

    it('should exclude specified session from termination', async () => {
      const result1 = await sessionManager.createSession(
        'user-123',
        'token-1',
        defaultContext
      );
      await sessionManager.createSession('user-123', 'token-2', {
        ...defaultContext,
        ip: '192.168.1.101',
      });

      const result = await sessionManager.forceLogout({
        userId: 'user-123',
        excludeSessionId: result1.session.sessionId,
        reason: 'Logout others',
        initiatedBy: 'user',
        notify: false,
      });

      expect(result.terminatedCount).toBe(1);

      const keptSession = await sessionManager.getSession(
        result1.session.sessionId
      );
      expect(keptSession?.isActive).toBe(true);
    });

    it('should terminate only specified sessions', async () => {
      const result1 = await sessionManager.createSession(
        'user-123',
        'token-1',
        defaultContext
      );
      const result2 = await sessionManager.createSession(
        'user-123',
        'token-2',
        { ...defaultContext, ip: '192.168.1.101' }
      );
      await sessionManager.createSession('user-123', 'token-3', {
        ...defaultContext,
        ip: '192.168.1.102',
      });

      const result = await sessionManager.forceLogout({
        userId: 'user-123',
        sessionIds: [result1.session.sessionId, result2.session.sessionId],
        reason: 'Selective logout',
        initiatedBy: 'admin',
        notify: false,
      });

      expect(result.terminatedCount).toBe(2);
      expect(result.terminatedSessionIds).toContain(result1.session.sessionId);
      expect(result.terminatedSessionIds).toContain(result2.session.sessionId);
    });
  });

  describe('logout', () => {
    it('should logout a session (user-initiated)', async () => {
      const { session } = await sessionManager.createSession(
        'user-123',
        'token-hash',
        defaultContext
      );

      const result = await sessionManager.logout(session.sessionId, defaultContext);

      expect(result).toBe(true);

      const loggedOut = await sessionManager.getSession(session.sessionId);
      expect(loggedOut?.isActive).toBe(false);
      expect(loggedOut?.forcedLogout).toBe(false); // Not forced, user-initiated
    });

    it('should return false for non-existent session', async () => {
      const result = await sessionManager.logout('non-existent', defaultContext);
      expect(result).toBe(false);
    });
  });

  describe('logoutOtherSessions', () => {
    it('should logout all sessions except current', async () => {
      const result1 = await sessionManager.createSession(
        'user-123',
        'token-1',
        defaultContext
      );
      await sessionManager.createSession('user-123', 'token-2', {
        ...defaultContext,
        ip: '192.168.1.101',
      });
      await sessionManager.createSession('user-123', 'token-3', {
        ...defaultContext,
        ip: '192.168.1.102',
      });

      const count = await sessionManager.logoutOtherSessions(
        'user-123',
        result1.session.sessionId
      );

      expect(count).toBe(2);

      const sessions = await sessionManager.getUserSessions('user-123');
      const activeSessions = sessions.filter((s) => s.isActive);

      expect(activeSessions).toHaveLength(1);
      expect(activeSessions[0].sessionId).toBe(result1.session.sessionId);
    });
  });

  describe('isForceLoggedOut', () => {
    it('should return true after force logout', async () => {
      await sessionManager.createSession('user-123', 'token-1', defaultContext);

      await sessionManager.forceLogout({
        userId: 'user-123',
        reason: 'Test',
        initiatedBy: 'admin',
        notify: false,
      });

      const isForced = await sessionManager.isForceLoggedOut('user-123');
      expect(isForced).toBe(true);
    });

    it('should return false for user not force logged out', async () => {
      const isForced = await sessionManager.isForceLoggedOut('user-456');
      expect(isForced).toBe(false);
    });
  });

  describe('trackActivity', () => {
    it('should track session activity', async () => {
      const { session } = await sessionManager.createSession(
        'user-123',
        'token-hash',
        defaultContext
      );

      await sessionManager.trackActivity(
        session,
        'SESSION_ACTIVITY',
        '192.168.1.100',
        '/api/users',
        'GET',
        { extra: 'data' }
      );

      expect(redis.lpush).toHaveBeenCalled();
    });
  });

  describe('createSessionManager factory', () => {
    it('should create manager with environment config', () => {
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        SESSION_MAX_CONCURRENT: '10',
        SESSION_TIMEOUT_SECONDS: '3600',
        SESSION_FINGERPRINTING: 'true',
      };

      const manager = createSessionManager(redis as unknown as Redis);
      expect(manager).toBeInstanceOf(SessionManager);

      process.env = originalEnv;
    });

    it('should allow config override', () => {
      const manager = createSessionManager(redis as unknown as Redis, {
        maxConcurrentSessions: 3,
        evictionStrategy: 'least_active',
      });

      expect(manager).toBeInstanceOf(SessionManager);
    });
  });

  describe('null Redis handling', () => {
    it('should handle null Redis gracefully', async () => {
      const noRedisManager = new SessionManager(null);

      const result = await noRedisManager.createSession(
        'user-123',
        'token',
        defaultContext
      );

      expect(result.session).toBeDefined();
      expect(result.evictedSession).toBeNull();

      const sessions = await noRedisManager.getUserSessions('user-123');
      expect(sessions).toHaveLength(0);
    });
  });
});
