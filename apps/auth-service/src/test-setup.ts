/**
 * Test Setup for Auth Service
 *
 * Mocks RabbitMQ connections to prevent async cleanup issues in tests
 */

// Mock RabbitMQ modules globally for all tests
jest.mock('./events/connection');
jest.mock('./events/publisher');

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
    user: (id: string) => `user:${id}`,
    userByEmail: (email: string) => `user:email:${email}`,
    refreshToken: (token: string) => `refresh:${token}`,
  },
  CacheTags: {
    users: 'users',
    user: (id: string) => `user:${id}`,
    refreshTokens: 'refreshTokens',
  },
  AuthCacheTTL: {
    USER_BY_ID: 300,
    USER_BY_EMAIL: 300,
    REFRESH_TOKEN: 604800,
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
