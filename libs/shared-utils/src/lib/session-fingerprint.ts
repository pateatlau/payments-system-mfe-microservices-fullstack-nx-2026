/**
 * Session Fingerprint Utility
 *
 * POC-3 Phase 7.3: Generates a client-side session fingerprint for enhanced security.
 *
 * The fingerprint captures browser and device characteristics to help detect
 * session hijacking attempts. It's sent with each API request and validated
 * on the server against the fingerprint stored with the session.
 *
 * IMPORTANT: This fingerprint is NOT a privacy tracking mechanism.
 * It's designed to detect malicious session theft by identifying when
 * a session is being used from a significantly different environment.
 *
 * Fingerprint components (in order of stability):
 * 1. User-Agent string (browser + OS info)
 * 2. Screen resolution
 * 3. Timezone
 * 4. Language preferences
 * 5. Color depth
 * 6. Platform
 *
 * Note: IP address is NOT included client-side as the server already has this.
 */

/**
 * Fingerprint data structure
 */
export interface SessionFingerprintData {
  /** User-Agent string */
  userAgent: string;
  /** Screen width x height */
  screenResolution: string;
  /** Timezone offset in minutes (e.g., -330 for IST) */
  timezoneOffset: number;
  /** Browser timezone name (e.g., "Asia/Kolkata") */
  timezone: string;
  /** Browser language (e.g., "en-IN") */
  language: string;
  /** All browser languages */
  languages: string[];
  /** Screen color depth (e.g., 24) */
  colorDepth: number;
  /** Platform (e.g., "Win32", "MacIntel") */
  platform: string;
  /** Hardware concurrency (CPU cores) */
  hardwareConcurrency: number;
  /** Device memory in GB (if available) */
  deviceMemory: number | null;
  /** Touch support */
  touchSupport: boolean;
  /** WebGL renderer (GPU info) */
  webglRenderer: string | null;
}

/**
 * Compact fingerprint for transmission (hash + key attributes)
 */
export interface SessionFingerprint {
  /** SHA-256 hash of the fingerprint data */
  hash: string;
  /** Fingerprint version for forward compatibility */
  version: number;
  /** User-Agent (sent separately for logging) */
  userAgent: string;
  /** Screen resolution (sent separately for logging) */
  screenResolution: string;
  /** Timezone name (sent separately for logging) */
  timezone: string;
}

/**
 * Current fingerprint version
 * Increment when fingerprint algorithm changes
 */
const FINGERPRINT_VERSION = 1;

/**
 * Storage key for cached fingerprint
 */
const FINGERPRINT_STORAGE_KEY = 'mfe-session-fingerprint';

/**
 * Cached fingerprint to avoid recalculating on every request
 */
let cachedFingerprint: SessionFingerprint | null = null;

/**
 * Get WebGL renderer info (GPU identification)
 * This helps detect VMs and unusual environments
 */
function getWebGLRenderer(): string | null {
  if (typeof document === 'undefined') return null;

  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) return null;

    const debugInfo = (gl as WebGLRenderingContext).getExtension(
      'WEBGL_debug_renderer_info'
    );
    if (!debugInfo) return null;

    const renderer = (gl as WebGLRenderingContext).getParameter(
      debugInfo.UNMASKED_RENDERER_WEBGL
    );
    return renderer || null;
  } catch {
    return null;
  }
}

/**
 * Collect raw fingerprint data from the browser
 */
function collectFingerprintData(): SessionFingerprintData {
  // Handle SSR/Node environment
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      userAgent: 'server',
      screenResolution: '0x0',
      timezoneOffset: 0,
      timezone: 'UTC',
      language: 'en',
      languages: ['en'],
      colorDepth: 0,
      platform: 'server',
      hardwareConcurrency: 0,
      deviceMemory: null,
      touchSupport: false,
      webglRenderer: null,
    };
  }

  // Get timezone name using Intl API
  let timezone = 'Unknown';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    // Fallback to offset-based timezone
    timezone = `UTC${new Date().getTimezoneOffset() > 0 ? '-' : '+'}${Math.abs(new Date().getTimezoneOffset() / 60)}`;
  }

  return {
    userAgent: navigator.userAgent || 'unknown',
    screenResolution: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
    timezoneOffset: new Date().getTimezoneOffset(),
    timezone,
    language: navigator.language || 'en',
    languages: Array.from(navigator.languages || [navigator.language || 'en']),
    colorDepth: window.screen?.colorDepth || 0,
    platform: navigator.platform || 'unknown',
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    deviceMemory:
      (navigator as Navigator & { deviceMemory?: number }).deviceMemory || null,
    touchSupport:
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (
        navigator as Navigator & {
          msMaxTouchPoints?: number;
        }
      ).msMaxTouchPoints! > 0,
    webglRenderer: getWebGLRenderer(),
  };
}

/**
 * Generate SHA-256 hash of fingerprint data
 * Uses the Web Crypto API for secure hashing
 */
async function hashFingerprintData(data: SessionFingerprintData): Promise<string> {
  // Create a stable string representation
  const dataString = JSON.stringify({
    ua: data.userAgent,
    sr: data.screenResolution,
    tz: data.timezone,
    to: data.timezoneOffset,
    lang: data.language,
    langs: data.languages.join(','),
    cd: data.colorDepth,
    plt: data.platform,
    hc: data.hardwareConcurrency,
    dm: data.deviceMemory,
    ts: data.touchSupport,
    gl: data.webglRenderer,
  });

  // Use Web Crypto API if available
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(dataString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback: Simple hash for environments without crypto.subtle
  // This is less secure but provides compatibility
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `fallback-${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

/**
 * Generate a session fingerprint
 *
 * @returns Promise resolving to the session fingerprint
 */
export async function generateSessionFingerprint(): Promise<SessionFingerprint> {
  // Return cached fingerprint if available
  if (cachedFingerprint) {
    return cachedFingerprint;
  }

  // Try to load from sessionStorage (persists for browser session only)
  if (typeof sessionStorage !== 'undefined') {
    try {
      const stored = sessionStorage.getItem(FINGERPRINT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SessionFingerprint;
        // Verify version matches
        if (parsed.version === FINGERPRINT_VERSION) {
          cachedFingerprint = parsed;
          return parsed;
        }
        // Version mismatch - regenerate
        sessionStorage.removeItem(FINGERPRINT_STORAGE_KEY);
      }
    } catch {
      // Invalid stored data - will regenerate
    }
  }

  // Collect and hash fingerprint data
  const data = collectFingerprintData();
  const hash = await hashFingerprintData(data);

  const fingerprint: SessionFingerprint = {
    hash,
    version: FINGERPRINT_VERSION,
    userAgent: data.userAgent,
    screenResolution: data.screenResolution,
    timezone: data.timezone,
  };

  // Cache in memory
  cachedFingerprint = fingerprint;

  // Store in sessionStorage for faster subsequent loads
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.setItem(FINGERPRINT_STORAGE_KEY, JSON.stringify(fingerprint));
    } catch {
      // Storage quota exceeded or unavailable - continue without caching
    }
  }

  return fingerprint;
}

/**
 * Get the fingerprint hash for API requests
 * This is the primary function used by the API client
 *
 * @returns Promise resolving to the fingerprint hash string
 */
export async function getSessionFingerprintHash(): Promise<string> {
  const fingerprint = await generateSessionFingerprint();
  return fingerprint.hash;
}

/**
 * Get the full fingerprint for the X-Client-Fingerprint header
 * The header value is a base64-encoded JSON object
 *
 * @returns Promise resolving to the header value
 */
export async function getSessionFingerprintHeader(): Promise<string> {
  const fingerprint = await generateSessionFingerprint();

  // Create a compact header value
  const headerData = {
    h: fingerprint.hash,
    v: fingerprint.version,
    sr: fingerprint.screenResolution,
    tz: fingerprint.timezone,
  };

  // Base64 encode for safe transmission
  if (typeof btoa !== 'undefined') {
    return btoa(JSON.stringify(headerData));
  }

  // Fallback for Node.js environment
  return Buffer.from(JSON.stringify(headerData)).toString('base64');
}

/**
 * Clear the cached fingerprint
 * Called when user logs out to ensure fresh fingerprint on next login
 */
export function clearSessionFingerprint(): void {
  cachedFingerprint = null;
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.removeItem(FINGERPRINT_STORAGE_KEY);
    } catch {
      // Ignore errors
    }
  }
}

/**
 * Parse a fingerprint header value
 * Used by the server to extract fingerprint data
 *
 * @param headerValue - The X-Client-Fingerprint header value
 * @returns Parsed fingerprint data or null if invalid
 */
export function parseSessionFingerprintHeader(
  headerValue: string
): { hash: string; version: number; screenResolution: string; timezone: string } | null {
  try {
    let decoded: string;

    // Handle both btoa and Buffer encoding
    if (typeof atob !== 'undefined') {
      decoded = atob(headerValue);
    } else if (typeof Buffer !== 'undefined') {
      decoded = Buffer.from(headerValue, 'base64').toString('utf-8');
    } else {
      return null;
    }

    const data = JSON.parse(decoded);

    // Validate required fields
    if (!data.h || typeof data.v !== 'number') {
      return null;
    }

    return {
      hash: data.h,
      version: data.v,
      screenResolution: data.sr || 'unknown',
      timezone: data.tz || 'unknown',
    };
  } catch {
    return null;
  }
}
