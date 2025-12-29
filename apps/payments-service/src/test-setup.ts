/**
 * Test Setup for Payments Service
 *
 * Mocks RabbitMQ and cache connections to prevent async cleanup issues in tests
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
    delete: jest.fn().mockResolvedValue(1),
    invalidateTag: jest.fn().mockResolvedValue(undefined),
    invalidateByTag: jest.fn().mockResolvedValue(undefined),
    flush: jest.fn().mockResolvedValue(undefined),
    isHealthy: jest.fn().mockResolvedValue(true),
  },
  CacheKeys: {
    payment: (id: string) => `payment:${id}`,
    paymentList: (userId: string, page: number) => `payments:list:${userId}:${page}`,
    userPayments: (userId: string) => `payments:user:${userId}`,
  },
  CacheTags: {
    payments: 'payments',
    user: (id: string) => `user:${id}`,
    userPayments: (userId: string) => `user:${userId}:payments`,
  },
  PaymentsCacheTTL: {
    PAYMENT_BY_ID: 60,
    PAYMENT_LIST: 60,
    PAYMENT_REPORTS: 300,
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
