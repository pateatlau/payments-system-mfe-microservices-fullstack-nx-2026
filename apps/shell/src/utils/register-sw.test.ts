/**
 * Service Worker Registration Tests
 */

import {
  registerServiceWorker,
  unregisterServiceWorker,
  isServiceWorkerRegistered,
  getServiceWorkerRegistration,
} from './register-sw';

describe('Service Worker Registration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Reset environment
    process.env = { ...originalEnv };

    // Reset navigator mock
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).navigator;
  });

  afterEach(() => {
    // Restore original values
    process.env = originalEnv;
  });

  describe('registerServiceWorker', () => {
    it('should not register service worker in development', () => {
      process.env.NODE_ENV = 'development';

      // Mock navigator with serviceWorker
      Object.defineProperty(global, 'navigator', {
        value: {
          serviceWorker: {
            register: jest.fn(),
          },
        },
        writable: true,
        configurable: true,
      });

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      registerServiceWorker();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[SW] Service worker disabled in development mode'
      );

      consoleLogSpy.mockRestore();
    });

    it('should not register if service worker is not supported', () => {
      process.env.NODE_ENV = 'production';

      // Mock navigator without serviceWorker
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true,
        configurable: true,
      });

      registerServiceWorker();

      // Should not throw error
      expect(true).toBe(true);
    });

    it('should register service worker in production', async () => {
      process.env.NODE_ENV = 'production';

      const mockRegistration = {
        scope: '/',
        update: jest.fn(),
        addEventListener: jest.fn(),
      };

      const mockRegister = jest.fn().mockResolvedValue(mockRegistration);
      const mockAddEventListener = jest.fn();
      const mockWindowAddEventListener = jest.fn();

      // Mock navigator with serviceWorker
      Object.defineProperty(global, 'navigator', {
        value: {
          serviceWorker: {
            register: mockRegister,
            addEventListener: mockAddEventListener,
            controller: null,
          },
        },
        writable: true,
        configurable: true,
      });

      // Mock window.addEventListener
      const originalAddEventListener = window.addEventListener;
      window.addEventListener = jest.fn((event, handler) => {
        mockWindowAddEventListener(event, handler);
        if (event === 'load' && typeof handler === 'function') {
          handler(new Event('load'));
        }
      }) as typeof window.addEventListener;

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      registerServiceWorker();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockRegister).toHaveBeenCalledWith('/sw.js');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[SW] Registered:',
        mockRegistration.scope
      );

      // Restore
      window.addEventListener = originalAddEventListener;
      consoleLogSpy.mockRestore();
    });

    it('should handle registration failure', async () => {
      process.env.NODE_ENV = 'production';

      const mockError = new Error('Registration failed');
      const mockRegister = jest.fn().mockRejectedValue(mockError);
      const mockServiceWorkerAddEventListener = jest.fn();

      Object.defineProperty(global, 'navigator', {
        value: {
          serviceWorker: {
            register: mockRegister,
            addEventListener: mockServiceWorkerAddEventListener,
          },
        },
        writable: true,
        configurable: true,
      });

      // Mock window.addEventListener
      const originalAddEventListener = window.addEventListener;
      window.addEventListener = jest.fn((event, handler) => {
        if (event === 'load' && typeof handler === 'function') {
          handler(new Event('load'));
        }
      }) as typeof window.addEventListener;

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      registerServiceWorker();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[SW] Registration failed:',
        mockError
      );

      // Restore
      window.addEventListener = originalAddEventListener;
      consoleErrorSpy.mockRestore();
    });
  });

  describe('unregisterServiceWorker', () => {
    it('should unregister all service workers', async () => {
      const mockUnregister = jest.fn().mockResolvedValue(true);
      const mockRegistrations = [
        { unregister: mockUnregister },
        { unregister: mockUnregister },
      ];

      Object.defineProperty(global, 'navigator', {
        value: {
          serviceWorker: {
            getRegistrations: jest.fn().mockResolvedValue(mockRegistrations),
          },
        },
        writable: true,
        configurable: true,
      });

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await unregisterServiceWorker();

      expect(mockUnregister).toHaveBeenCalledTimes(2);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[SW] Unregistered all service workers'
      );

      consoleLogSpy.mockRestore();
    });

    it('should handle no service worker support', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true,
        configurable: true,
      });

      await unregisterServiceWorker();

      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('isServiceWorkerRegistered', () => {
    it('should return true if service worker is registered', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          serviceWorker: {
            getRegistration: jest.fn().mockResolvedValue({ scope: '/' }),
          },
        },
        writable: true,
        configurable: true,
      });

      const result = await isServiceWorkerRegistered();

      expect(result).toBe(true);
    });

    it('should return false if service worker is not registered', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          serviceWorker: {
            getRegistration: jest.fn().mockResolvedValue(undefined),
          },
        },
        writable: true,
        configurable: true,
      });

      const result = await isServiceWorkerRegistered();

      expect(result).toBe(false);
    });

    it('should return false if service worker is not supported', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true,
        configurable: true,
      });

      const result = await isServiceWorkerRegistered();

      expect(result).toBe(false);
    });
  });

  describe('getServiceWorkerRegistration', () => {
    it('should return registration if available', async () => {
      const mockRegistration = { scope: '/' };

      Object.defineProperty(global, 'navigator', {
        value: {
          serviceWorker: {
            getRegistration: jest.fn().mockResolvedValue(mockRegistration),
          },
        },
        writable: true,
        configurable: true,
      });

      const result = await getServiceWorkerRegistration();

      expect(result).toEqual(mockRegistration);
    });

    it('should return undefined if not registered', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          serviceWorker: {
            getRegistration: jest.fn().mockResolvedValue(undefined),
          },
        },
        writable: true,
        configurable: true,
      });

      const result = await getServiceWorkerRegistration();

      expect(result).toBeUndefined();
    });

    it('should return undefined if service worker is not supported', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true,
        configurable: true,
      });

      const result = await getServiceWorkerRegistration();

      expect(result).toBeUndefined();
    });
  });
});
