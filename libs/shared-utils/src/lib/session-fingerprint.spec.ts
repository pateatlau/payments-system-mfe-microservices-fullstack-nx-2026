/**
 * Session Fingerprint Tests
 *
 * POC-3 Phase 7.3: Tests for the session fingerprint utility
 */

import {
  generateSessionFingerprint,
  getSessionFingerprintHash,
  getSessionFingerprintHeader,
  clearSessionFingerprint,
  parseSessionFingerprintHeader,
} from './session-fingerprint';

describe('session-fingerprint', () => {
  // Mock storage
  let mockStorage: Record<string, string>;
  let mockGetItem: jest.Mock;
  let mockSetItem: jest.Mock;
  let mockRemoveItem: jest.Mock;

  // Store original sessionStorage descriptor
  const originalSessionStorageDescriptor = Object.getOwnPropertyDescriptor(
    window,
    'sessionStorage'
  );

  beforeEach(() => {
    // Clear cached fingerprint before each test
    clearSessionFingerprint();

    // Reset mock storage
    mockStorage = {};

    // Create mock functions
    mockGetItem = jest.fn((key: string) => mockStorage[key] || null);
    mockSetItem = jest.fn((key: string, value: string) => {
      mockStorage[key] = value;
    });
    mockRemoveItem = jest.fn((key: string) => {
      delete mockStorage[key];
    });

    // Override sessionStorage with mock
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: mockGetItem,
        setItem: mockSetItem,
        removeItem: mockRemoveItem,
        clear: jest.fn(() => {
          mockStorage = {};
        }),
        length: 0,
        key: jest.fn(),
      },
      writable: true,
      configurable: true,
    });

    // Mock Date.prototype.getTimezoneOffset for IST
    jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-330);
  });

  afterEach(() => {
    // Restore original sessionStorage
    if (originalSessionStorageDescriptor) {
      Object.defineProperty(
        window,
        'sessionStorage',
        originalSessionStorageDescriptor
      );
    }
    jest.restoreAllMocks();
    clearSessionFingerprint();
  });

  describe('generateSessionFingerprint', () => {
    it('should generate a fingerprint with required fields', async () => {
      const fingerprint = await generateSessionFingerprint();

      expect(fingerprint).toBeDefined();
      expect(fingerprint.hash).toBeDefined();
      expect(typeof fingerprint.hash).toBe('string');
      expect(fingerprint.hash.length).toBeGreaterThan(0);
      expect(fingerprint.version).toBe(1);
      expect(typeof fingerprint.userAgent).toBe('string');
      expect(fingerprint.screenResolution).toMatch(/^\d+x\d+$/);
      expect(typeof fingerprint.timezone).toBe('string');
    });

    it('should cache the fingerprint', async () => {
      const fingerprint1 = await generateSessionFingerprint();
      const fingerprint2 = await generateSessionFingerprint();

      expect(fingerprint1).toBe(fingerprint2); // Same reference (cached)
    });

    it('should store fingerprint in sessionStorage', async () => {
      await generateSessionFingerprint();

      expect(mockSetItem).toHaveBeenCalledWith(
        'mfe-session-fingerprint',
        expect.any(String)
      );
    });

    it('should load fingerprint from sessionStorage if available', async () => {
      const storedFingerprint = {
        hash: 'cached-hash-123',
        version: 1,
        userAgent: 'cached-ua',
        screenResolution: '1920x1080',
        timezone: 'Asia/Kolkata',
      };

      mockStorage['mfe-session-fingerprint'] = JSON.stringify(storedFingerprint);

      const fingerprint = await generateSessionFingerprint();

      expect(fingerprint.hash).toBe('cached-hash-123');
      expect(fingerprint.userAgent).toBe('cached-ua');
    });

    it('should regenerate fingerprint if version mismatch', async () => {
      const oldVersionFingerprint = {
        hash: 'old-hash',
        version: 0, // Old version
        userAgent: 'old-ua',
        screenResolution: '800x600',
        timezone: 'UTC',
      };

      mockStorage['mfe-session-fingerprint'] = JSON.stringify(oldVersionFingerprint);

      const fingerprint = await generateSessionFingerprint();

      // Should generate new fingerprint, not use old one
      expect(fingerprint.hash).not.toBe('old-hash');
      expect(fingerprint.version).toBe(1);
      expect(mockRemoveItem).toHaveBeenCalled();
    });

    it('should generate consistent hashes for same environment', async () => {
      // First fingerprint with current environment
      const fingerprint1 = await generateSessionFingerprint();
      clearSessionFingerprint();

      // Clear storage to force regeneration
      mockStorage = {};

      // The same environment should produce the same hash
      const fingerprint2 = await generateSessionFingerprint();

      // Since we're in the same environment, hashes should match
      expect(fingerprint1.hash).toBe(fingerprint2.hash);
    });
  });

  describe('getSessionFingerprintHash', () => {
    it('should return just the hash string', async () => {
      const hash = await getSessionFingerprintHash();

      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should return consistent hash on multiple calls', async () => {
      const hash1 = await getSessionFingerprintHash();
      const hash2 = await getSessionFingerprintHash();

      expect(hash1).toBe(hash2);
    });
  });

  describe('getSessionFingerprintHeader', () => {
    it('should return base64-encoded header value', async () => {
      const header = await getSessionFingerprintHeader();

      expect(typeof header).toBe('string');

      // Should be valid base64
      const decoded = atob(header);
      const parsed = JSON.parse(decoded);

      expect(parsed.h).toBeDefined(); // hash
      expect(parsed.v).toBe(1); // version
      expect(parsed.sr).toMatch(/^\d+x\d+$/); // screenResolution
      expect(typeof parsed.tz).toBe('string'); // timezone
    });

    it('should produce consistent headers on multiple calls', async () => {
      const header1 = await getSessionFingerprintHeader();
      const header2 = await getSessionFingerprintHeader();

      expect(header1).toBe(header2);
    });
  });

  describe('clearSessionFingerprint', () => {
    it('should clear cached fingerprint', async () => {
      // Generate fingerprint first
      const fingerprint1 = await generateSessionFingerprint();

      // Clear it
      clearSessionFingerprint();
      mockStorage = {}; // Clear mock storage too

      // Next call should generate new fingerprint
      const fingerprint2 = await generateSessionFingerprint();

      // They should be different references (regenerated)
      expect(fingerprint1).not.toBe(fingerprint2);
    });

    it('should remove from sessionStorage', () => {
      clearSessionFingerprint();

      expect(mockRemoveItem).toHaveBeenCalledWith('mfe-session-fingerprint');
    });
  });

  describe('parseSessionFingerprintHeader', () => {
    it('should parse valid header', () => {
      const headerData = {
        h: 'test-hash-123',
        v: 1,
        sr: '1920x1080',
        tz: 'Asia/Kolkata',
      };

      const encoded = btoa(JSON.stringify(headerData));
      const parsed = parseSessionFingerprintHeader(encoded);

      expect(parsed).not.toBeNull();
      expect(parsed?.hash).toBe('test-hash-123');
      expect(parsed?.version).toBe(1);
      expect(parsed?.screenResolution).toBe('1920x1080');
      expect(parsed?.timezone).toBe('Asia/Kolkata');
    });

    it('should return null for invalid base64', () => {
      const parsed = parseSessionFingerprintHeader('not-valid-base64!!!');

      expect(parsed).toBeNull();
    });

    it('should return null for missing required fields', () => {
      const headerData = {
        sr: '1920x1080',
        tz: 'Asia/Kolkata',
        // Missing h (hash) and v (version)
      };

      const encoded = btoa(JSON.stringify(headerData));
      const parsed = parseSessionFingerprintHeader(encoded);

      expect(parsed).toBeNull();
    });

    it('should provide defaults for optional fields', () => {
      const headerData = {
        h: 'test-hash',
        v: 1,
        // Missing sr and tz
      };

      const encoded = btoa(JSON.stringify(headerData));
      const parsed = parseSessionFingerprintHeader(encoded);

      expect(parsed).not.toBeNull();
      expect(parsed?.screenResolution).toBe('unknown');
      expect(parsed?.timezone).toBe('unknown');
    });

    it('should handle empty object gracefully', () => {
      const encoded = btoa(JSON.stringify({}));
      const parsed = parseSessionFingerprintHeader(encoded);

      expect(parsed).toBeNull();
    });

    it('should handle malformed JSON gracefully', () => {
      const encoded = btoa('not-json');
      const parsed = parseSessionFingerprintHeader(encoded);

      expect(parsed).toBeNull();
    });
  });

  describe('fingerprint stability', () => {
    it('should produce identical hash for cached fingerprint', async () => {
      const hash1 = await getSessionFingerprintHash();

      // Multiple calls should return identical hash
      for (let i = 0; i < 5; i++) {
        const hash = await getSessionFingerprintHash();
        expect(hash).toBe(hash1);
      }
    });

    it('should include version in fingerprint for compatibility', async () => {
      const fingerprint = await generateSessionFingerprint();

      // Version should be present and match current version
      expect(fingerprint.version).toBeDefined();
      expect(typeof fingerprint.version).toBe('number');
      expect(fingerprint.version).toBe(1);
    });
  });

  describe('header encoding/decoding roundtrip', () => {
    it('should roundtrip fingerprint through header encoding', async () => {
      // Generate header
      const header = await getSessionFingerprintHeader();

      // Parse it back
      const parsed = parseSessionFingerprintHeader(header);

      // Get original fingerprint for comparison
      const fingerprint = await generateSessionFingerprint();

      expect(parsed).not.toBeNull();
      expect(parsed?.hash).toBe(fingerprint.hash);
      expect(parsed?.version).toBe(fingerprint.version);
      expect(parsed?.screenResolution).toBe(fingerprint.screenResolution);
      expect(parsed?.timezone).toBe(fingerprint.timezone);
    });
  });
});
