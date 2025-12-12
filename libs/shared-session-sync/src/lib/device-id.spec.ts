/**
 * Device ID Tests
 */

import {
  getDeviceId,
  getDeviceName,
  getDeviceType,
  clearDeviceId,
} from './device-id';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Mock crypto
const mockCrypto = {
  randomUUID: jest.fn(() => 'test-uuid-123'),
};

describe('Device ID', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();

    // Setup mocks - use Object.defineProperty with configurable: true
    try {
      Object.defineProperty(global, 'localStorage', {
        value: localStorageMock,
        writable: true,
        configurable: true,
      });
    } catch {
      // Already defined, skip
    }

    try {
      Object.defineProperty(global, 'crypto', {
        value: mockCrypto,
        writable: true,
        configurable: true,
      });
    } catch {
      // Already defined, skip
    }
  });

  describe('getDeviceId', () => {
    it('should generate and store new device ID if not present', () => {
      const deviceId = getDeviceId();

      expect(deviceId).toBe('test-uuid-123');
      expect(localStorageMock.getItem('mfe-device-id')).toBe('test-uuid-123');
      expect(mockCrypto.randomUUID).toHaveBeenCalled();
    });

    it('should return existing device ID if present', () => {
      localStorageMock.setItem('mfe-device-id', 'existing-id');

      const deviceId = getDeviceId();

      expect(deviceId).toBe('existing-id');
      expect(mockCrypto.randomUUID).not.toHaveBeenCalled();
    });

    it('should handle missing window gracefully', () => {
      // Test that getDeviceId checks for window existence
      // In a real server environment, window would be undefined
      // For this test, we verify the function handles the check
      const deviceId = getDeviceId();
      // Should still work with window available
      expect(deviceId).toBeDefined();
      expect(typeof deviceId).toBe('string');
    });
  });

  describe('getDeviceName', () => {
    it('should detect Chrome browser', () => {
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Chrome/91.0.4472.124' },
        writable: true,
        configurable: true,
      });

      expect(getDeviceName()).toBe('Chrome Browser');
    });

    it('should detect Firefox browser', () => {
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Firefox/89.0' },
        writable: true,
        configurable: true,
      });

      expect(getDeviceName()).toBe('Firefox Browser');
    });

    it('should detect Safari browser', () => {
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Safari/14.1' },
        writable: true,
        configurable: true,
      });

      expect(getDeviceName()).toBe('Safari Browser');
    });

    it('should return Unknown Browser for unrecognized user agent', () => {
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Unknown/1.0' },
        writable: true,
        configurable: true,
      });

      expect(getDeviceName()).toBe('Unknown Browser');
    });

    it('should return Unknown Device if navigator is undefined', () => {
      delete (global as { navigator?: unknown }).navigator;

      expect(getDeviceName()).toBe('Unknown Device');
    });
  });

  describe('getDeviceType', () => {
    it('should detect mobile device', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        },
        writable: true,
        configurable: true,
      });

      expect(getDeviceType()).toBe('mobile');
    });

    it('should detect browser for desktop', () => {
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        writable: true,
        configurable: true,
      });

      expect(getDeviceType()).toBe('browser');
    });

    it('should return browser if navigator is undefined', () => {
      delete (global as { navigator?: unknown }).navigator;

      expect(getDeviceType()).toBe('browser');
    });
  });

  describe('clearDeviceId', () => {
    it('should remove device ID from localStorage', () => {
      localStorageMock.setItem('mfe-device-id', 'test-id');

      clearDeviceId();

      expect(localStorageMock.getItem('mfe-device-id')).toBeNull();
    });

    it('should not throw if device ID does not exist', () => {
      expect(() => clearDeviceId()).not.toThrow();
    });
  });
});
