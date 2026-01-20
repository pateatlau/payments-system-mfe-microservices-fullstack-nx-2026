/**
 * Device Fingerprint Service Tests
 */

import { DeviceFingerprintService, getDeviceFingerprintService } from './device-fingerprint';
import type { SessionRequestContext, DeviceFingerprint } from './session-types';

describe('DeviceFingerprintService', () => {
  let service: DeviceFingerprintService;

  beforeEach(() => {
    service = new DeviceFingerprintService();
  });

  describe('createFingerprint', () => {
    it('should create a fingerprint from Chrome on Windows', () => {
      const context: SessionRequestContext = {
        ip: '192.168.1.100',
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        acceptLanguage: 'en-US,en;q=0.9',
        timezone: 'America/New_York',
      };

      const fingerprint = service.createFingerprint(context);

      expect(fingerprint.browser.name).toBe('Chrome');
      expect(fingerprint.browser.version).toBe('120.0.0.0');
      expect(fingerprint.os.name).toBe('Windows');
      expect(fingerprint.os.version).toBe('10.0');
      expect(fingerprint.deviceType).toBe('desktop');
      expect(fingerprint.ip).toBe('192.168.1.100');
      expect(fingerprint.acceptLanguage).toBe('en-US,en;q=0.9');
      expect(fingerprint.timezone).toBe('America/New_York');
      expect(fingerprint.fingerprintHash).toBeDefined();
      expect(fingerprint.fingerprintHash).toHaveLength(64); // SHA-256 hex
    });

    it('should create a fingerprint from Safari on macOS', () => {
      const context: SessionRequestContext = {
        ip: '10.0.0.1',
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
        acceptLanguage: 'en-GB,en;q=0.8',
      };

      const fingerprint = service.createFingerprint(context);

      expect(fingerprint.browser.name).toBe('Safari');
      expect(fingerprint.browser.version).toBe('17.2');
      expect(fingerprint.os.name).toBe('macOS');
      expect(fingerprint.os.version).toBe('10.15.7');
      expect(fingerprint.deviceType).toBe('desktop');
    });

    it('should create a fingerprint from Firefox on Linux', () => {
      const context: SessionRequestContext = {
        ip: '172.16.0.1',
        userAgent:
          'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
      };

      const fingerprint = service.createFingerprint(context);

      expect(fingerprint.browser.name).toBe('Firefox');
      expect(fingerprint.browser.version).toBe('121.0');
      expect(fingerprint.os.name).toBe('Linux');
      expect(fingerprint.deviceType).toBe('desktop');
    });

    it('should create a fingerprint from Chrome on Android mobile', () => {
      const context: SessionRequestContext = {
        ip: '203.0.113.1',
        userAgent:
          'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.43 Mobile Safari/537.36',
      };

      const fingerprint = service.createFingerprint(context);

      expect(fingerprint.browser.name).toBe('Chrome');
      expect(fingerprint.os.name).toBe('Android');
      expect(fingerprint.os.version).toBe('14');
      expect(fingerprint.deviceType).toBe('mobile');
    });

    it('should create a fingerprint from Safari on iOS', () => {
      const context: SessionRequestContext = {
        ip: '198.51.100.1',
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
      };

      const fingerprint = service.createFingerprint(context);

      expect(fingerprint.browser.name).toBe('Safari');
      expect(fingerprint.os.name).toBe('iOS');
      expect(fingerprint.os.version).toBe('17.2');
      expect(fingerprint.deviceType).toBe('mobile');
    });

    it('should create a fingerprint from iPad (tablet)', () => {
      const context: SessionRequestContext = {
        ip: '192.0.2.1',
        userAgent:
          'Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
      };

      const fingerprint = service.createFingerprint(context);

      expect(fingerprint.os.name).toBe('iOS');
      expect(fingerprint.deviceType).toBe('tablet');
    });

    it('should detect bot user agents', () => {
      const botAgents = [
        'Googlebot/2.1 (+http://www.google.com/bot.html)',
        'Mozilla/5.0 (compatible; Bingbot/2.0; +http://www.bing.com/bingbot.htm)',
        'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)',
      ];

      for (const userAgent of botAgents) {
        const fingerprint = service.createFingerprint({
          ip: '1.2.3.4',
          userAgent,
        });
        expect(fingerprint.deviceType).toBe('bot');
      }
    });

    it('should detect Edge browser', () => {
      const context: SessionRequestContext = {
        ip: '1.2.3.4',
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
      };

      const fingerprint = service.createFingerprint(context);
      expect(fingerprint.browser.name).toBe('Edge');
    });

    it('should detect Opera browser', () => {
      const context: SessionRequestContext = {
        ip: '1.2.3.4',
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0',
      };

      const fingerprint = service.createFingerprint(context);
      expect(fingerprint.browser.name).toBe('Opera');
    });

    it('should handle empty user agent', () => {
      const context: SessionRequestContext = {
        ip: '1.2.3.4',
        userAgent: '',
      };

      const fingerprint = service.createFingerprint(context);

      expect(fingerprint.browser.name).toBe('unknown');
      expect(fingerprint.os.name).toBe('unknown');
      expect(fingerprint.deviceType).toBe('unknown');
      expect(fingerprint.fingerprintHash).toBeDefined();
    });

    it('should include client fingerprint when provided', () => {
      const context: SessionRequestContext = {
        ip: '1.2.3.4',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0.0.0',
        clientFingerprint: 'client-fp-abc123',
      };

      const fingerprint = service.createFingerprint(context);
      expect(fingerprint.clientFingerprint).toBe('client-fp-abc123');
    });
  });

  describe('generateFingerprintHash', () => {
    it('should generate consistent hashes for same input', () => {
      const fingerprint: DeviceFingerprint = {
        fingerprintHash: '',
        userAgent: 'test-agent',
        browser: { name: 'Chrome', version: '120.0.0.0' },
        os: { name: 'Windows', version: '10.0' },
        deviceType: 'desktop',
        ip: '1.2.3.4',
        acceptLanguage: 'en-US',
        screenResolution: null,
        timezone: 'UTC',
        clientFingerprint: null,
      };

      const hash1 = service.generateFingerprintHash(fingerprint);
      const hash2 = service.generateFingerprintHash(fingerprint);

      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different browsers', () => {
      const fp1: DeviceFingerprint = {
        fingerprintHash: '',
        userAgent: 'test',
        browser: { name: 'Chrome', version: '120.0.0.0' },
        os: { name: 'Windows', version: '10.0' },
        deviceType: 'desktop',
        ip: '1.2.3.4',
        acceptLanguage: 'en-US',
        screenResolution: null,
        timezone: 'UTC',
        clientFingerprint: null,
      };

      const fp2: DeviceFingerprint = {
        ...fp1,
        browser: { name: 'Firefox', version: '121.0' },
      };

      const hash1 = service.generateFingerprintHash(fp1);
      const hash2 = service.generateFingerprintHash(fp2);

      expect(hash1).not.toBe(hash2);
    });

    it('should use only major version in hash', () => {
      const fp1: DeviceFingerprint = {
        fingerprintHash: '',
        userAgent: 'test',
        browser: { name: 'Chrome', version: '120.0.0.0' },
        os: { name: 'Windows', version: '10.0' },
        deviceType: 'desktop',
        ip: '1.2.3.4',
        acceptLanguage: 'en-US',
        screenResolution: null,
        timezone: 'UTC',
        clientFingerprint: null,
      };

      const fp2: DeviceFingerprint = {
        ...fp1,
        browser: { name: 'Chrome', version: '120.1.2.3' }, // Minor version change
      };

      const hash1 = service.generateFingerprintHash(fp1);
      const hash2 = service.generateFingerprintHash(fp2);

      expect(hash1).toBe(hash2); // Same major version = same hash
    });
  });

  describe('compareFingerprints', () => {
    it('should return 1.0 for identical fingerprints', () => {
      const fp: DeviceFingerprint = {
        fingerprintHash: 'abc',
        userAgent: 'test',
        browser: { name: 'Chrome', version: '120.0.0.0' },
        os: { name: 'Windows', version: '10.0' },
        deviceType: 'desktop',
        ip: '1.2.3.4',
        acceptLanguage: 'en-US',
        screenResolution: '1920x1080',
        timezone: 'America/New_York',
        clientFingerprint: 'fp123',
      };

      const similarity = service.compareFingerprints(fp, fp);
      expect(similarity).toBe(1);
    });

    it('should return partial similarity for partially matching fingerprints', () => {
      const fp1: DeviceFingerprint = {
        fingerprintHash: 'abc',
        userAgent: 'test',
        browser: { name: 'Chrome', version: '120.0.0.0' },
        os: { name: 'Windows', version: '10.0' },
        deviceType: 'desktop',
        ip: '1.2.3.4',
        acceptLanguage: 'en-US',
        screenResolution: null,
        timezone: 'America/New_York',
        clientFingerprint: 'fp123',
      };

      const fp2: DeviceFingerprint = {
        ...fp1,
        browser: { name: 'Firefox', version: '121.0' }, // Different browser
      };

      const similarity = service.compareFingerprints(fp1, fp2);
      expect(similarity).toBeGreaterThan(0.5); // Still mostly similar
      expect(similarity).toBeLessThan(1); // But not identical
    });

    it('should return low similarity for very different fingerprints', () => {
      const fp1: DeviceFingerprint = {
        fingerprintHash: 'abc',
        userAgent: 'test',
        browser: { name: 'Chrome', version: '120.0.0.0' },
        os: { name: 'Windows', version: '10.0' },
        deviceType: 'desktop',
        ip: '1.2.3.4',
        acceptLanguage: 'en-US',
        screenResolution: null,
        timezone: 'America/New_York',
        clientFingerprint: 'fp123',
      };

      const fp2: DeviceFingerprint = {
        fingerprintHash: 'xyz',
        userAgent: 'other',
        browser: { name: 'Safari', version: '17.0' },
        os: { name: 'macOS', version: '14.0' },
        deviceType: 'mobile', // Different device type
        ip: '5.6.7.8',
        acceptLanguage: 'de-DE',
        screenResolution: null,
        timezone: 'Europe/Berlin',
        clientFingerprint: 'different',
      };

      const similarity = service.compareFingerprints(fp1, fp2);
      expect(similarity).toBeLessThan(0.3);
    });

    it('should weight device type heavily', () => {
      const fp1: DeviceFingerprint = {
        fingerprintHash: 'abc',
        userAgent: 'test',
        browser: { name: 'Chrome', version: '120.0.0.0' },
        os: { name: 'Windows', version: '10.0' },
        deviceType: 'desktop',
        ip: '1.2.3.4',
        acceptLanguage: null,
        screenResolution: null,
        timezone: null,
        clientFingerprint: null,
      };

      const fp2: DeviceFingerprint = {
        ...fp1,
        deviceType: 'mobile', // Only difference
      };

      const similarity = service.compareFingerprints(fp1, fp2);
      expect(similarity).toBeLessThan(0.85); // Device type change is significant
    });
  });

  describe('isMatch', () => {
    it('should return true for fingerprints within tolerance', () => {
      const fp1: DeviceFingerprint = {
        fingerprintHash: 'abc',
        userAgent: 'test',
        browser: { name: 'Chrome', version: '120.0.0.0' },
        os: { name: 'Windows', version: '10.0' },
        deviceType: 'desktop',
        ip: '1.2.3.4',
        acceptLanguage: 'en-US',
        screenResolution: null,
        timezone: 'America/New_York',
        clientFingerprint: 'fp123',
      };

      const fp2: DeviceFingerprint = {
        ...fp1,
        browser: { name: 'Chrome', version: '121.0.0.0' }, // Minor version bump
      };

      expect(service.isMatch(fp1, fp2, 0.3)).toBe(true);
    });

    it('should return false for fingerprints outside tolerance', () => {
      const fp1: DeviceFingerprint = {
        fingerprintHash: 'abc',
        userAgent: 'test',
        browser: { name: 'Chrome', version: '120.0.0.0' },
        os: { name: 'Windows', version: '10.0' },
        deviceType: 'desktop',
        ip: '1.2.3.4',
        acceptLanguage: 'en-US',
        screenResolution: null,
        timezone: 'America/New_York',
        clientFingerprint: 'fp123',
      };

      const fp2: DeviceFingerprint = {
        fingerprintHash: 'xyz',
        userAgent: 'other',
        browser: { name: 'Safari', version: '17.0' },
        os: { name: 'iOS', version: '17.0' },
        deviceType: 'mobile',
        ip: '5.6.7.8',
        acceptLanguage: 'de-DE',
        screenResolution: null,
        timezone: 'Europe/Berlin',
        clientFingerprint: 'other-fp',
      };

      expect(service.isMatch(fp1, fp2, 0.3)).toBe(false);
    });
  });

  describe('getDeviceDescription', () => {
    it('should return a human-readable description', () => {
      const fingerprint: DeviceFingerprint = {
        fingerprintHash: 'abc',
        userAgent: 'test',
        browser: { name: 'Chrome', version: '120.0.0.0' },
        os: { name: 'Windows', version: '10.0' },
        deviceType: 'desktop',
        ip: '1.2.3.4',
        acceptLanguage: null,
        screenResolution: null,
        timezone: null,
        clientFingerprint: null,
      };

      const description = service.getDeviceDescription(fingerprint);
      expect(description).toBe('Chrome 120.0.0.0 on Windows 10.0 (Desktop)');
    });

    it('should handle unknown browser/OS', () => {
      const fingerprint: DeviceFingerprint = {
        fingerprintHash: 'abc',
        userAgent: '',
        browser: { name: 'unknown', version: 'unknown' },
        os: { name: 'unknown', version: 'unknown' },
        deviceType: 'unknown',
        ip: '1.2.3.4',
        acceptLanguage: null,
        screenResolution: null,
        timezone: null,
        clientFingerprint: null,
      };

      const description = service.getDeviceDescription(fingerprint);
      expect(description).toBe('Unknown browser on Unknown OS (Unknown)');
    });
  });

  describe('createSimpleHash', () => {
    it('should create a consistent hash from IP and user agent', () => {
      const hash1 = service.createSimpleHash(
        '1.2.3.4',
        'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0.0.0'
      );
      const hash2 = service.createSimpleHash(
        '1.2.3.4',
        'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0.0.0'
      );

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });

    it('should create different hashes for different IPs', () => {
      const hash1 = service.createSimpleHash(
        '1.2.3.4',
        'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0.0.0'
      );
      const hash2 = service.createSimpleHash(
        '5.6.7.8',
        'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0.0.0'
      );

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('getDeviceFingerprintService', () => {
    it('should return a singleton instance', () => {
      const service1 = getDeviceFingerprintService();
      const service2 = getDeviceFingerprintService();

      expect(service1).toBe(service2);
    });
  });
});
