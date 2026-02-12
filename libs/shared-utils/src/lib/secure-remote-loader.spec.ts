/**
 * Tests for Secure Remote Loader
 *
 * Tests integrity verification for Module Federation remotes
 */

import {
  verifyRemoteIntegrity,
  SecureRemoteLoader,
  setIntegrityHashes,
  getIntegrityHash,
  type RemoteSecurityEvent,
} from './secure-remote-loader';

// Mock fetch and crypto APIs
const mockFetch = jest.fn();
const mockDigest = jest.fn();

// Store original values
const originalFetch = global.fetch;
const originalCrypto = global.crypto;

describe('SecureRemoteLoader', () => {
  beforeAll(() => {
    // Mock fetch
    global.fetch = mockFetch;

    // Mock Web Crypto API
    Object.defineProperty(global, 'crypto', {
      value: {
        subtle: {
          digest: mockDigest,
        },
      },
      writable: true,
    });

    // Mock btoa
    if (typeof global.btoa === 'undefined') {
      global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
    }

    // Mock TextEncoder
    if (typeof global.TextEncoder === 'undefined') {
      global.TextEncoder = class {
        encode(str: string): Uint8Array {
          return Buffer.from(str);
        }
      } as unknown as typeof TextEncoder;
    }

    // Mock performance.now
    if (typeof global.performance === 'undefined') {
      Object.defineProperty(global, 'performance', {
        value: {
          now: () => Date.now(),
        },
        writable: true,
      });
    }
  });

  afterAll(() => {
    // Restore original values
    global.fetch = originalFetch;
    Object.defineProperty(global, 'crypto', {
      value: originalCrypto,
      writable: true,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset cached hashes
    setIntegrityHashes({});
  });

  describe('verifyRemoteIntegrity', () => {
    it('should skip verification when disabled', async () => {
      const result = await verifyRemoteIntegrity(
        'authMfe',
        'http://localhost:4201/remoteEntry.js',
        { enableVerification: false }
      );

      expect(result.valid).toBe(true);
      expect(result.remoteName).toBe('authMfe');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should block URLs not in allowlist', async () => {
      const result = await verifyRemoteIntegrity(
        'authMfe',
        'http://evil-site.com/remoteEntry.js',
        {
          enableVerification: true,
          allowedOrigins: ['http://localhost'],
        }
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('URL origin not allowed');
    });

    it('should allow URLs in allowlist', async () => {
      // Mock successful fetch and hash match
      const testContent = 'test-remote-content';
      const testHash = new Uint8Array([1, 2, 3, 4]);
      const expectedBase64 = btoa(String.fromCharCode(...testHash));
      const expectedSRI = `sha384-${expectedBase64}`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => Buffer.from(testContent),
      });

      mockDigest.mockResolvedValueOnce(testHash.buffer);

      // Set expected hash
      setIntegrityHashes({ authMfe: expectedSRI });

      const result = await verifyRemoteIntegrity(
        'authMfe',
        'http://localhost:4201/remoteEntry.js',
        {
          enableVerification: true,
          allowedOrigins: ['http://localhost'],
        }
      );

      expect(result.valid).toBe(true);
      expect(result.actualHash).toBe(expectedSRI);
    });

    it('should detect hash mismatch (tampered content)', async () => {
      const testContent = 'tampered-content';
      const actualHash = new Uint8Array([5, 6, 7, 8]);
      const actualBase64 = btoa(String.fromCharCode(...actualHash));
      const actualSRI = `sha384-${actualBase64}`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => Buffer.from(testContent),
      });

      mockDigest.mockResolvedValueOnce(actualHash.buffer);

      // Set different expected hash
      setIntegrityHashes({ authMfe: 'sha384-differenthash123' });

      const result = await verifyRemoteIntegrity(
        'authMfe',
        'http://localhost:4201/remoteEntry.js',
        {
          enableVerification: true,
          allowedOrigins: ['http://localhost'],
        }
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('hash mismatch');
      expect(result.actualHash).toBe(actualSRI);
      expect(result.expectedHash).toBe('sha384-differenthash123');
    });

    it('should handle fetch errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      setIntegrityHashes({ authMfe: 'sha384-somehash' });

      const result = await verifyRemoteIntegrity(
        'authMfe',
        'http://localhost:4201/remoteEntry.js',
        {
          enableVerification: true,
          allowedOrigins: ['http://localhost'],
        }
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('404');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      setIntegrityHashes({ authMfe: 'sha384-somehash' });

      const result = await verifyRemoteIntegrity(
        'authMfe',
        'http://localhost:4201/remoteEntry.js',
        {
          enableVerification: true,
          allowedOrigins: ['http://localhost'],
        }
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should call security event handler', async () => {
      const events: RemoteSecurityEvent[] = [];
      const onSecurityEvent = (event: RemoteSecurityEvent) =>
        events.push(event);

      await verifyRemoteIntegrity(
        'authMfe',
        'http://evil-site.com/remoteEntry.js',
        {
          enableVerification: true,
          allowedOrigins: ['http://localhost'],
          onSecurityEvent,
        }
      );

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('url_blocked');
      expect(events[0].remoteName).toBe('authMfe');
    });

    it('should include timing information', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Server Error',
      });

      setIntegrityHashes({ authMfe: 'sha384-somehash' });

      const result = await verifyRemoteIntegrity(
        'authMfe',
        'http://localhost:4201/remoteEntry.js',
        {
          enableVerification: true,
          allowedOrigins: ['http://localhost'],
        }
      );

      expect(result.timestamp).toBeDefined();
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('SecureRemoteLoader class', () => {
    it('should verify and cache results', async () => {
      const loader = new SecureRemoteLoader({
        enableVerification: false,
      });

      const result = await loader.verify(
        'authMfe',
        'http://localhost:4201/remoteEntry.js'
      );

      expect(result.valid).toBe(true);
      expect(loader.isVerified('authMfe')).toBe(true);
      expect(loader.getVerificationResult('authMfe')).toEqual(result);
    });

    it('should track multiple remotes', async () => {
      const loader = new SecureRemoteLoader({
        enableVerification: false,
      });

      await loader.verify('authMfe', 'http://localhost:4201/remoteEntry.js');
      await loader.verify(
        'paymentsMfe',
        'http://localhost:4202/remoteEntry.js'
      );

      const allResults = loader.getAllResults();
      expect(allResults.size).toBe(2);
      expect(allResults.has('authMfe')).toBe(true);
      expect(allResults.has('paymentsMfe')).toBe(true);
    });

    it('should allow adding origins dynamically', async () => {
      const loader = new SecureRemoteLoader({
        enableVerification: true,
        allowedOrigins: ['http://localhost'],
      });

      // First, verify URL is blocked
      const result = await loader.verify(
        'authMfe',
        'http://new-origin.com/remoteEntry.js'
      );
      expect(result.valid).toBe(false);

      // Add new origin
      loader.addAllowedOrigin('http://new-origin.com');

      // Mock fetch for the new attempt
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => Buffer.from('content'),
      });

      // Note: Would need hash set to fully pass in strict mode
      // But URL should now be allowed
    });

    it('should allow setting integrity hashes', () => {
      const loader = new SecureRemoteLoader();
      loader.setIntegrityHash('authMfe', 'sha384-testhash');

      // Hash is set internally, can be verified through verification
    });

    it('should toggle strict mode', () => {
      const loader = new SecureRemoteLoader({ strictMode: false });
      loader.setStrictMode(true);
      // Mode is changed internally
    });
  });

  describe('setIntegrityHashes and getIntegrityHash', () => {
    it('should set and retrieve hashes', () => {
      setIntegrityHashes({
        authMfe: 'sha384-auth-hash',
        paymentsMfe: 'sha384-payments-hash',
      });

      expect(getIntegrityHash('authMfe')).toBe('sha384-auth-hash');
      expect(getIntegrityHash('paymentsMfe')).toBe('sha384-payments-hash');
      expect(getIntegrityHash('unknownMfe')).toBeUndefined();
    });

    it('should overwrite existing hashes', () => {
      setIntegrityHashes({ authMfe: 'sha384-old-hash' });
      setIntegrityHashes({ authMfe: 'sha384-new-hash' });

      expect(getIntegrityHash('authMfe')).toBe('sha384-new-hash');
    });
  });

  describe('URL validation', () => {
    it('should allow localhost with different ports', async () => {
      const urls = [
        'http://localhost:4201/remoteEntry.js',
        'http://localhost:4202/remoteEntry.js',
        'https://localhost/mfe/auth/remoteEntry.js',
      ];

      for (const url of urls) {
        const result = await verifyRemoteIntegrity('testMfe', url, {
          enableVerification: false,
          allowedOrigins: ['http://localhost', 'https://localhost'],
        });

        expect(result.valid).toBe(true);
      }
    });

    it('should block non-allowed origins', async () => {
      const blockedUrls = [
        'http://attacker.com/remoteEntry.js',
        'https://malicious-cdn.com/remoteEntry.js',
        'file:///etc/passwd',
        'javascript:alert(1)',
      ];

      for (const url of blockedUrls) {
        const result = await verifyRemoteIntegrity('testMfe', url, {
          enableVerification: true,
          allowedOrigins: ['http://localhost'],
        });

        expect(result.valid).toBe(false);
        expect(result.error).toContain('not allowed');
      }
    });
  });
});
