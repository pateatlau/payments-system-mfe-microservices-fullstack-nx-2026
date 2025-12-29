/**
 * Test Setup for Profile Service
 *
 * Mocks cache to prevent Redis connection issues in tests
 */

// Mock cache to prevent Redis connection attempts
jest.mock('./lib/cache', () => ({
  cache: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    invalidateTag: jest.fn().mockResolvedValue(undefined),
    invalidateByTag: jest.fn().mockResolvedValue(undefined),
    flush: jest.fn().mockResolvedValue(undefined),
    isHealthy: jest.fn().mockResolvedValue(true),
  },
  CacheKeys: {
    profile: (userId: string) => `profile:${userId}`,
    profilePreferences: (userId: string) => `profile:preferences:${userId}`,
  },
  CacheTags: {
    profiles: 'profiles',
    user: (userId: string) => `user:${userId}`,
  },
  ProfileCacheTTL: {
    PROFILE: 300,
    PREFERENCES: 300,
  },
}));

// Suppress console logs during tests unless there's an error
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = originalConsoleError;
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

// Global cleanup - close any open handles
afterAll(async () => {
  // Give async operations time to complete
  await new Promise(resolve => setTimeout(resolve, 100));
});
