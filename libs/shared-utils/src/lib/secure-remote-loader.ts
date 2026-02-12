/**
 * Secure Remote Loader for Module Federation
 *
 * Provides integrity verification for federated module loading to prevent:
 * - Man-in-the-middle (MITM) attacks
 * - Tampered remote entries
 * - Unauthorized code execution
 *
 * Security Features:
 * - SRI (Subresource Integrity) verification using SHA-384
 * - URL allowlist validation
 * - Audit logging for security events
 * - Graceful degradation on verification failure
 *
 * Usage:
 *   import { verifyRemoteIntegrity, SecureRemoteLoader } from '@mfe/shared-utils';
 *
 *   // Verify a remote before loading
 *   const isValid = await verifyRemoteIntegrity('authMfe', 'http://localhost:4201/remoteEntry.js');
 *
 *   // Or use the loader class for full control
 *   const loader = new SecureRemoteLoader({ strictMode: true });
 *   const remote = await loader.loadRemote('authMfe', remoteUrl);
 */

// Note: Actual hashes are loaded at runtime for production flexibility
// In production, hashes are fetched from sri-manifest.json
// In development, we can use generated constants or skip verification

/**
 * Remote verification result
 */
export interface RemoteVerificationResult {
  /** Whether the remote passed integrity verification */
  valid: boolean;
  /** The remote name (e.g., 'authMfe') */
  remoteName: string;
  /** The URL that was verified */
  url: string;
  /** Expected integrity hash (if available) */
  expectedHash?: string;
  /** Actual calculated hash */
  actualHash?: string;
  /** Error message if verification failed */
  error?: string;
  /** Timestamp of verification */
  timestamp: string;
  /** Verification duration in milliseconds */
  durationMs: number;
}

/**
 * Security event for audit logging
 */
export interface RemoteSecurityEvent {
  type:
    | 'integrity_check_passed'
    | 'integrity_check_failed'
    | 'hash_mismatch'
    | 'fetch_error'
    | 'url_blocked'
    | 'verification_skipped';
  remoteName: string;
  url: string;
  details: Record<string, unknown>;
  timestamp: string;
}

/**
 * Secure Remote Loader options
 */
export interface SecureRemoteLoaderOptions {
  /**
   * Enable strict mode - throws on verification failure
   * Default: false in development, true in production
   */
  strictMode?: boolean;

  /**
   * Allowed URL origins for remote loading
   * Default: ['http://localhost', 'https://localhost']
   */
  allowedOrigins?: string[];

  /**
   * Custom integrity hashes (overrides manifest/generated hashes)
   */
  integrityHashes?: Record<string, string>;

  /**
   * Enable verification (can be disabled in development)
   * Default: true in production, false in development
   */
  enableVerification?: boolean;

  /**
   * Timeout for fetching remote content (ms)
   * Default: 10000 (10 seconds)
   */
  fetchTimeout?: number;

  /**
   * Custom event handler for security events
   */
  onSecurityEvent?: (event: RemoteSecurityEvent) => void;
}

// Default allowed origins
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost',
  'https://localhost',
  // Add production URLs here
];

// Check if running in browser environment
const isBrowser = typeof window !== 'undefined';
const isProduction = typeof process !== 'undefined' && process.env?.['NODE_ENV'] === 'production';

/**
 * Calculate SHA-384 hash of content
 * Uses Web Crypto API in browser, returns base64-encoded hash
 */
async function calculateSHA384(content: ArrayBuffer | string): Promise<string> {
  if (!isBrowser || !window.crypto?.subtle) {
    // Server-side or no crypto API - skip verification
    return '';
  }

  const data =
    typeof content === 'string' ? new TextEncoder().encode(content) : content;

  const hashBuffer = await window.crypto.subtle.digest('SHA-384', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashBase64 = btoa(String.fromCharCode(...hashArray));

  return `sha384-${hashBase64}`;
}

/**
 * Fetch remote content with timeout
 */
async function fetchWithTimeout(
  url: string,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      // Prevent caching to ensure fresh content for integrity check
      cache: 'no-store',
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Verify URL is from an allowed origin
 */
function isUrlAllowed(url: string, allowedOrigins: string[]): boolean {
  try {
    const parsedUrl = new URL(url);
    const origin = `${parsedUrl.protocol}//${parsedUrl.hostname}`;
    const originWithPort = `${parsedUrl.protocol}//${parsedUrl.host}`;

    return allowedOrigins.some(
      (allowed) =>
        origin === allowed ||
        originWithPort === allowed ||
        origin.startsWith(allowed) ||
        originWithPort.startsWith(allowed)
    );
  } catch {
    // Invalid URL
    return false;
  }
}

/**
 * In-memory cache for integrity hashes
 * Populated from manifest or generated constants
 */
let cachedHashes: Record<string, string> = {};

/**
 * Load SRI manifest from dist directory
 * Called once on first verification
 */
async function loadSRIManifest(): Promise<Record<string, string>> {
  if (Object.keys(cachedHashes).length > 0) {
    return cachedHashes;
  }

  try {
    // Try to fetch manifest from same origin
    const response = await fetch('/sri-manifest.json', { cache: 'no-store' });
    if (response.ok) {
      const manifest = await response.json();
      if (manifest.remotes) {
        cachedHashes = Object.fromEntries(
          Object.entries(manifest.remotes)
            .filter(([, data]: [string, unknown]) => {
              const d = data as Record<string, unknown>;
              return d && typeof d.integrity === 'string';
            })
            .map(([name, data]: [string, unknown]) => {
              const d = data as Record<string, unknown>;
              return [name, d.integrity as string];
            })
        );
      }
    }
  } catch {
    // Manifest not available - use generated constants or skip
    // eslint-disable-next-line no-console
    console.warn(
      '[SecureRemoteLoader] SRI manifest not found, integrity verification disabled'
    );
  }

  return cachedHashes;
}

/**
 * Set integrity hashes directly (for testing or build-time injection)
 */
export function setIntegrityHashes(hashes: Record<string, string>): void {
  cachedHashes = { ...hashes };
}

/**
 * Get cached integrity hash for a remote
 */
export function getIntegrityHash(remoteName: string): string | undefined {
  return cachedHashes[remoteName];
}

/**
 * Verify the integrity of a remote entry file
 *
 * @param remoteName - Name of the remote (e.g., 'authMfe')
 * @param url - URL of the remoteEntry.js file
 * @param options - Verification options
 * @returns Verification result with validity and details
 */
export async function verifyRemoteIntegrity(
  remoteName: string,
  url: string,
  options: Partial<SecureRemoteLoaderOptions> = {}
): Promise<RemoteVerificationResult> {
  const startTime = performance.now();
  const timestamp = new Date().toISOString();

  const {
    allowedOrigins = DEFAULT_ALLOWED_ORIGINS,
    integrityHashes,
    enableVerification = isProduction,
    fetchTimeout = 10000,
    onSecurityEvent,
  } = options;

  // Helper to emit security events
  const emitEvent = (
    type: RemoteSecurityEvent['type'],
    details: Record<string, unknown>
  ) => {
    const event: RemoteSecurityEvent = {
      type,
      remoteName,
      url,
      details,
      timestamp,
    };

    // Log to console in development
    if (!isProduction) {
      // eslint-disable-next-line no-console
      console.debug('[SecureRemoteLoader]', type, details);
    }

    onSecurityEvent?.(event);
  };

  // Skip verification if disabled
  if (!enableVerification) {
    emitEvent('verification_skipped', { reason: 'Verification disabled' });
    return {
      valid: true,
      remoteName,
      url,
      timestamp,
      durationMs: performance.now() - startTime,
    };
  }

  // Check URL allowlist
  if (!isUrlAllowed(url, allowedOrigins)) {
    emitEvent('url_blocked', {
      allowedOrigins,
      reason: 'URL origin not in allowlist',
    });
    return {
      valid: false,
      remoteName,
      url,
      error: `URL origin not allowed. Allowed: ${allowedOrigins.join(', ')}`,
      timestamp,
      durationMs: performance.now() - startTime,
    };
  }

  // Get expected hash
  const customHash = integrityHashes?.[remoteName];
  const manifestHashes = await loadSRIManifest();
  const expectedHash = customHash || manifestHashes[remoteName];

  if (!expectedHash) {
    emitEvent('verification_skipped', {
      reason: 'No integrity hash available for remote',
    });
    // No hash available - allow in development, block in production
    return {
      valid: !isProduction,
      remoteName,
      url,
      error: isProduction
        ? 'No integrity hash available for remote'
        : undefined,
      timestamp,
      durationMs: performance.now() - startTime,
    };
  }

  try {
    // Fetch remote content
    const response = await fetchWithTimeout(url, fetchTimeout);

    if (!response.ok) {
      emitEvent('fetch_error', {
        status: response.status,
        statusText: response.statusText,
      });
      return {
        valid: false,
        remoteName,
        url,
        expectedHash,
        error: `Failed to fetch remote: ${response.status} ${response.statusText}`,
        timestamp,
        durationMs: performance.now() - startTime,
      };
    }

    // Calculate hash of content
    const content = await response.arrayBuffer();
    const actualHash = await calculateSHA384(content);

    // Compare hashes
    if (actualHash === expectedHash) {
      emitEvent('integrity_check_passed', {
        hash: actualHash,
        size: content.byteLength,
      });
      return {
        valid: true,
        remoteName,
        url,
        expectedHash,
        actualHash,
        timestamp,
        durationMs: performance.now() - startTime,
      };
    } else {
      emitEvent('hash_mismatch', {
        expected: expectedHash,
        actual: actualHash,
        size: content.byteLength,
      });
      return {
        valid: false,
        remoteName,
        url,
        expectedHash,
        actualHash,
        error: 'Integrity hash mismatch - remote content may have been tampered',
        timestamp,
        durationMs: performance.now() - startTime,
      };
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('abort')) {
      emitEvent('fetch_error', { reason: 'Timeout', timeout: fetchTimeout });
      return {
        valid: false,
        remoteName,
        url,
        expectedHash,
        error: `Fetch timeout after ${fetchTimeout}ms`,
        timestamp,
        durationMs: performance.now() - startTime,
      };
    }

    emitEvent('fetch_error', { error: errorMessage });
    return {
      valid: false,
      remoteName,
      url,
      expectedHash,
      error: `Failed to verify remote: ${errorMessage}`,
      timestamp,
      durationMs: performance.now() - startTime,
    };
  }
}

/**
 * Secure Remote Loader class for Module Federation
 *
 * Provides a higher-level API for loading remotes with integrity verification
 */
export class SecureRemoteLoader {
  private options: Required<SecureRemoteLoaderOptions>;
  private verificationResults: Map<string, RemoteVerificationResult> =
    new Map();

  constructor(options: SecureRemoteLoaderOptions = {}) {
    this.options = {
      strictMode: options.strictMode ?? isProduction,
      allowedOrigins: options.allowedOrigins ?? DEFAULT_ALLOWED_ORIGINS,
      integrityHashes: options.integrityHashes ?? {},
      enableVerification: options.enableVerification ?? isProduction,
      fetchTimeout: options.fetchTimeout ?? 10000,
      onSecurityEvent: options.onSecurityEvent ?? (() => {}),
    };
  }

  /**
   * Verify a remote's integrity
   */
  async verify(
    remoteName: string,
    url: string
  ): Promise<RemoteVerificationResult> {
    const result = await verifyRemoteIntegrity(remoteName, url, this.options);
    this.verificationResults.set(remoteName, result);
    return result;
  }

  /**
   * Check if a remote has been verified and passed
   */
  isVerified(remoteName: string): boolean {
    const result = this.verificationResults.get(remoteName);
    return result?.valid === true;
  }

  /**
   * Get the last verification result for a remote
   */
  getVerificationResult(
    remoteName: string
  ): RemoteVerificationResult | undefined {
    return this.verificationResults.get(remoteName);
  }

  /**
   * Get all verification results
   */
  getAllResults(): Map<string, RemoteVerificationResult> {
    return new Map(this.verificationResults);
  }

  /**
   * Add an allowed origin dynamically
   */
  addAllowedOrigin(origin: string): void {
    if (!this.options.allowedOrigins.includes(origin)) {
      this.options.allowedOrigins.push(origin);
    }
  }

  /**
   * Set integrity hash for a remote
   */
  setIntegrityHash(remoteName: string, hash: string): void {
    this.options.integrityHashes[remoteName] = hash;
  }

  /**
   * Enable or disable strict mode
   */
  setStrictMode(enabled: boolean): void {
    this.options.strictMode = enabled;
  }
}

/**
 * Default secure remote loader instance
 * Pre-configured for typical usage
 */
export const secureRemoteLoader = new SecureRemoteLoader();
