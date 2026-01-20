/**
 * Device Fingerprinting Service
 *
 * Creates and validates device fingerprints from request data.
 * Used for session tracking and security monitoring.
 *
 * Fingerprint components:
 * - User agent (browser, OS, device type)
 * - IP address
 * - Accept-Language header
 * - Screen resolution (if provided by client)
 * - Timezone (if provided by client)
 * - Client-side fingerprint (optional, from libraries like FingerprintJS)
 */

import * as crypto from 'crypto';
import type {
  DeviceFingerprint,
  SessionRequestContext,
} from './session-types';

/**
 * Browser patterns for user agent parsing
 */
const BROWSER_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: 'Edge', pattern: /Edg(?:e|A|iOS)?\/(\d+[\d.]*)/ },
  { name: 'Opera', pattern: /(?:OPR|Opera)\/(\d+[\d.]*)/ },
  { name: 'Chrome', pattern: /Chrome\/(\d+[\d.]*)/ },
  { name: 'Firefox', pattern: /Firefox\/(\d+[\d.]*)/ },
  { name: 'Safari', pattern: /Version\/(\d+[\d.]*).*Safari/ },
  { name: 'IE', pattern: /(?:MSIE |rv:)(\d+[\d.]*)/ },
];

/**
 * OS patterns for user agent parsing
 */
const OS_PATTERNS: Array<{ name: string; pattern: RegExp; versionPattern?: RegExp }> = [
  { name: 'Windows', pattern: /Windows NT (\d+\.\d+)/ },
  { name: 'macOS', pattern: /Mac OS X (\d+[._]\d+[._]?\d*)/ },
  { name: 'iOS', pattern: /(?:iPhone|iPad|iPod).*OS (\d+[._]\d+)/ },
  { name: 'Android', pattern: /Android (\d+[\d.]*)/ },
  { name: 'Linux', pattern: /Linux/ },
  { name: 'Chrome OS', pattern: /CrOS/ },
];

/**
 * Device Fingerprint Service
 *
 * Creates, validates, and compares device fingerprints.
 */
export class DeviceFingerprintService {
  /**
   * Create a device fingerprint from request context
   *
   * @param context - Request context with headers and client data
   * @returns Device fingerprint object
   */
  createFingerprint(context: SessionRequestContext): DeviceFingerprint {
    const userAgent = context.userAgent || '';
    const browser = this.parseBrowser(userAgent);
    const os = this.parseOS(userAgent);
    const deviceType = this.detectDeviceType(userAgent);

    const fingerprint: DeviceFingerprint = {
      fingerprintHash: '', // Will be set below
      userAgent,
      browser,
      os,
      deviceType,
      ip: context.ip,
      acceptLanguage: context.acceptLanguage || null,
      screenResolution: context.screenResolution || null,
      timezone: context.timezone || null,
      clientFingerprint: context.clientFingerprint || null,
    };

    // Generate hash from stable components
    fingerprint.fingerprintHash = this.generateFingerprintHash(fingerprint);

    return fingerprint;
  }

  /**
   * Generate a hash from fingerprint components
   *
   * Uses stable components that are unlikely to change between requests
   * from the same device.
   *
   * @param fingerprint - Device fingerprint
   * @returns SHA-256 hash of fingerprint components
   */
  generateFingerprintHash(fingerprint: DeviceFingerprint): string {
    const components = [
      fingerprint.browser.name,
      fingerprint.browser.version.split('.')[0], // Major version only
      fingerprint.os.name,
      fingerprint.os.version.split('.')[0], // Major version only
      fingerprint.deviceType,
      fingerprint.acceptLanguage?.split(',')[0] || '', // Primary language
      fingerprint.timezone || '',
      fingerprint.clientFingerprint || '',
    ];

    const input = components.join('|');
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  /**
   * Compare two fingerprints and return a similarity score
   *
   * @param fp1 - First fingerprint
   * @param fp2 - Second fingerprint
   * @returns Similarity score from 0 (completely different) to 1 (identical)
   */
  compareFingerprints(fp1: DeviceFingerprint, fp2: DeviceFingerprint): number {
    const weights = {
      browser: 0.15,
      browserVersion: 0.05,
      os: 0.15,
      osVersion: 0.05,
      deviceType: 0.20,
      acceptLanguage: 0.10,
      timezone: 0.10,
      clientFingerprint: 0.20,
    };

    let score = 0;
    let totalWeight = 0;

    // Browser name (exact match)
    if (fp1.browser.name && fp2.browser.name) {
      totalWeight += weights.browser;
      if (fp1.browser.name === fp2.browser.name) {
        score += weights.browser;
      }
    }

    // Browser version (major version match)
    if (fp1.browser.version && fp2.browser.version) {
      totalWeight += weights.browserVersion;
      const v1 = fp1.browser.version.split('.')[0];
      const v2 = fp2.browser.version.split('.')[0];
      if (v1 === v2) {
        score += weights.browserVersion;
      }
    }

    // OS name (exact match)
    if (fp1.os.name && fp2.os.name) {
      totalWeight += weights.os;
      if (fp1.os.name === fp2.os.name) {
        score += weights.os;
      }
    }

    // OS version (major version match)
    if (fp1.os.version && fp2.os.version) {
      totalWeight += weights.osVersion;
      const v1 = fp1.os.version.split('.')[0];
      const v2 = fp2.os.version.split('.')[0];
      if (v1 === v2) {
        score += weights.osVersion;
      }
    }

    // Device type (exact match)
    totalWeight += weights.deviceType;
    if (fp1.deviceType === fp2.deviceType) {
      score += weights.deviceType;
    }

    // Accept-Language (primary language match)
    if (fp1.acceptLanguage && fp2.acceptLanguage) {
      totalWeight += weights.acceptLanguage;
      const lang1 = fp1.acceptLanguage.split(',')[0]?.split('-')[0] ?? '';
      const lang2 = fp2.acceptLanguage.split(',')[0]?.split('-')[0] ?? '';
      if (lang1 === lang2) {
        score += weights.acceptLanguage;
      }
    }

    // Timezone (exact match)
    if (fp1.timezone && fp2.timezone) {
      totalWeight += weights.timezone;
      if (fp1.timezone === fp2.timezone) {
        score += weights.timezone;
      }
    }

    // Client fingerprint (exact match - highest confidence)
    if (fp1.clientFingerprint && fp2.clientFingerprint) {
      totalWeight += weights.clientFingerprint;
      if (fp1.clientFingerprint === fp2.clientFingerprint) {
        score += weights.clientFingerprint;
      }
    }

    // Return normalized score
    return totalWeight > 0 ? score / totalWeight : 0;
  }

  /**
   * Check if a new fingerprint matches an existing one within tolerance
   *
   * @param existingFp - Existing fingerprint to compare against
   * @param newFp - New fingerprint from current request
   * @param tolerance - Maximum acceptable difference (0-1)
   * @returns Whether the fingerprints match within tolerance
   */
  isMatch(
    existingFp: DeviceFingerprint,
    newFp: DeviceFingerprint,
    tolerance: number = 0.3
  ): boolean {
    const similarity = this.compareFingerprints(existingFp, newFp);
    return similarity >= (1 - tolerance);
  }

  /**
   * Parse browser name and version from user agent
   */
  private parseBrowser(userAgent: string): { name: string; version: string } {
    for (const { name, pattern } of BROWSER_PATTERNS) {
      const match = userAgent.match(pattern);
      if (match) {
        return { name, version: match[1] || 'unknown' };
      }
    }
    return { name: 'unknown', version: 'unknown' };
  }

  /**
   * Parse OS name and version from user agent
   */
  private parseOS(userAgent: string): { name: string; version: string } {
    for (const { name, pattern } of OS_PATTERNS) {
      const match = userAgent.match(pattern);
      if (match) {
        let version = match[1] || 'unknown';
        // Normalize macOS version format (10_15_7 -> 10.15.7)
        version = version.replace(/_/g, '.');
        return { name, version };
      }
    }
    return { name: 'unknown', version: 'unknown' };
  }

  /**
   * Detect device type from user agent
   */
  private detectDeviceType(
    userAgent: string
  ): 'desktop' | 'mobile' | 'tablet' | 'bot' | 'unknown' {
    const ua = userAgent.toLowerCase();

    // Check for bots first
    if (
      /bot|crawler|spider|scraper|crawling/i.test(ua) ||
      /googlebot|bingbot|yandex|baidu|duckduck/i.test(ua)
    ) {
      return 'bot';
    }

    // Check for tablets (before mobile, as tablets often contain mobile keywords)
    if (/ipad|android(?!.*mobile)|tablet|playbook|silk/i.test(ua)) {
      return 'tablet';
    }

    // Check for mobile
    if (
      /mobile|iphone|ipod|android.*mobile|blackberry|opera mini|opera mobi|iemobile|windows phone/i.test(
        ua
      )
    ) {
      return 'mobile';
    }

    // Check for desktop indicators
    if (
      /windows nt|macintosh|linux(?!.*android)|cros/i.test(ua)
    ) {
      return 'desktop';
    }

    return 'unknown';
  }

  /**
   * Get a human-readable description of the device
   *
   * @param fingerprint - Device fingerprint
   * @returns Human-readable device description
   */
  getDeviceDescription(fingerprint: DeviceFingerprint): string {
    const browser = fingerprint.browser.name !== 'unknown'
      ? `${fingerprint.browser.name} ${fingerprint.browser.version}`
      : 'Unknown browser';

    const os = fingerprint.os.name !== 'unknown'
      ? `${fingerprint.os.name} ${fingerprint.os.version}`
      : 'Unknown OS';

    const deviceType = fingerprint.deviceType.charAt(0).toUpperCase() +
      fingerprint.deviceType.slice(1);

    return `${browser} on ${os} (${deviceType})`;
  }

  /**
   * Create a minimal fingerprint hash from IP and User-Agent only
   *
   * This is a simpler fingerprint for basic session binding.
   *
   * @param ip - IP address
   * @param userAgent - User agent string
   * @returns SHA-256 hash
   */
  createSimpleHash(ip: string, userAgent: string): string {
    const browser = this.parseBrowser(userAgent);
    const os = this.parseOS(userAgent);

    const components = [
      ip,
      browser.name,
      os.name,
    ];

    return crypto.createHash('sha256').update(components.join('|')).digest('hex');
  }

  /**
   * Validate a fingerprint hash matches expected components
   *
   * @param hash - Expected hash
   * @param context - Current request context
   * @returns Whether the hash matches
   */
  validateHash(hash: string, context: SessionRequestContext): boolean {
    const currentFingerprint = this.createFingerprint(context);
    return currentFingerprint.fingerprintHash === hash;
  }
}

/**
 * Singleton instance
 */
let fingerprintService: DeviceFingerprintService | null = null;

/**
 * Get or create the device fingerprint service instance
 */
export function getDeviceFingerprintService(): DeviceFingerprintService {
  if (!fingerprintService) {
    fingerprintService = new DeviceFingerprintService();
  }
  return fingerprintService;
}
