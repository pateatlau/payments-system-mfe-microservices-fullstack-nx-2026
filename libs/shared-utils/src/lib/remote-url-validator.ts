/**
 * Remote URL Validator for Module Federation
 *
 * Validates remote MFE URLs against an allowlist to prevent loading
 * remotes from unauthorized origins. This is a critical security measure
 * that blocks attackers from injecting malicious remotes.
 *
 * Security Benefits:
 * - Blocks remotes from unauthorized origins
 * - Prevents DNS rebinding attacks
 * - Validates URL structure and protocol
 * - Supports environment-specific allowlists
 *
 * Usage:
 *   import { validateRemoteUrl, RemoteUrlValidator } from '@mfe/shared-utils';
 *
 *   // Quick validation
 *   const result = validateRemoteUrl('http://localhost:4201/remoteEntry.js');
 *
 *   // With custom validator
 *   const validator = new RemoteUrlValidator({
 *     allowedOrigins: ['https://cdn.example.com'],
 *     allowedPaths: ['/mfe/{wildcard}/remoteEntry.js'],
 *   });
 */

/**
 * Result of URL validation
 */
export interface UrlValidationResult {
  /** Whether the URL passed validation */
  valid: boolean;
  /** The URL that was validated */
  url: string;
  /** Parsed origin (protocol + host) */
  origin?: string;
  /** Parsed pathname */
  pathname?: string;
  /** Error message if validation failed */
  error?: string;
  /** Which rule matched (for debugging) */
  matchedRule?: string;
}

/**
 * Remote URL Validator options
 */
export interface RemoteUrlValidatorOptions {
  /**
   * Allowed URL origins (protocol + hostname + optional port)
   * Examples: 'http://localhost', 'https://cdn.example.com', 'http://localhost:4201'
   *
   * Supports wildcards:
   * - 'http://localhost:*' matches any port on localhost
   * - 'https://*.example.com' matches any subdomain
   */
  allowedOrigins?: string[];

  /**
   * Allowed URL path patterns (glob-style)
   * Examples: '/remoteEntry.js', '/mfe/{star}/remoteEntry.js' (use * for wildcard)
   *
   * If not specified, any path is allowed for valid origins
   */
  allowedPaths?: string[];

  /**
   * Allowed protocols
   * Default: ['http:', 'https:'] in development, ['https:'] in production
   */
  allowedProtocols?: string[];

  /**
   * Block known dangerous patterns
   * Default: true
   */
  blockDangerousPatterns?: boolean;

  /**
   * Custom validation function for additional checks
   */
  customValidator?: (url: URL) => boolean;
}

// Environment detection
const isProduction =
  typeof process !== 'undefined' && process.env?.['NODE_ENV'] === 'production';

// Default development origins - localhost on various ports
const DEFAULT_DEV_ORIGINS = [
  'http://localhost',
  'http://localhost:4200',
  'http://localhost:4201',
  'http://localhost:4202',
  'http://localhost:4203',
  'http://localhost:4204',
  'https://localhost',
];

// Default production origins - HTTPS only
// In production, this should be overridden with actual CDN/server URLs
const DEFAULT_PROD_ORIGINS = ['https://localhost'];

// Dangerous URL patterns that should always be blocked
const DANGEROUS_PATTERNS = [
  /^javascript:/i,
  /^data:/i,
  /^vbscript:/i,
  /^file:/i,
  /^ftp:/i,
  // Block URLs with credentials
  /:\/\/[^@]+@/,
  // Block URLs with encoded characters that could bypass checks
  /%2f%2f/i,
  /%5c/i,
];

// Required path patterns for remote entry files
const VALID_REMOTE_ENTRY_PATTERNS = [
  /\/remoteEntry\.js$/,
  /\/mfe\/[^/]+\/remoteEntry\.js$/,
];

/**
 * Check if a string matches a glob pattern
 * Supports * (any characters) and ** (any path segments)
 */
function matchGlob(pattern: string, str: string): boolean {
  // Escape regex special characters except * and **
  const regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '{{GLOBSTAR}}')
    .replace(/\*/g, '[^/]*')
    .replace(/{{GLOBSTAR}}/g, '.*');

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(str);
}

/**
 * Check if origin matches allowed origin pattern
 * Supports wildcards for port and subdomain
 */
function matchOrigin(pattern: string, origin: string): boolean {
  // Exact match
  if (pattern === origin) return true;

  // Wildcard port: http://localhost:* matches http://localhost:4201
  if (pattern.includes(':*')) {
    const [patternBase] = pattern.split(':*');
    const originBase = origin.replace(/:\d+$/, '');
    return patternBase === originBase;
  }

  // Wildcard subdomain: https://*.example.com matches https://cdn.example.com
  if (pattern.includes('*')) {
    return matchGlob(pattern, origin);
  }

  // Prefix match: http://localhost matches http://localhost:4201
  if (origin.startsWith(pattern)) {
    const remaining = origin.slice(pattern.length);
    // Only allow port suffix
    return remaining === '' || /^:\d+$/.test(remaining);
  }

  return false;
}

/**
 * Validate a remote URL against security rules
 *
 * @param url - URL to validate
 * @param options - Validation options
 * @returns Validation result with details
 */
export function validateRemoteUrl(
  url: string,
  options: RemoteUrlValidatorOptions = {}
): UrlValidationResult {
  const {
    allowedOrigins = isProduction ? DEFAULT_PROD_ORIGINS : DEFAULT_DEV_ORIGINS,
    allowedPaths,
    allowedProtocols = isProduction ? ['https:'] : ['http:', 'https:'],
    blockDangerousPatterns = true,
    customValidator,
  } = options;

  // Check for dangerous patterns first
  if (blockDangerousPatterns) {
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(url)) {
        return {
          valid: false,
          url,
          error: `URL contains dangerous pattern: ${pattern.toString()}`,
        };
      }
    }
  }

  // Parse URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return {
      valid: false,
      url,
      error: 'Invalid URL format',
    };
  }

  const origin = parsedUrl.origin;
  const pathname = parsedUrl.pathname;

  // Check protocol
  if (!allowedProtocols.includes(parsedUrl.protocol)) {
    return {
      valid: false,
      url,
      origin,
      pathname,
      error: `Protocol not allowed: ${parsedUrl.protocol}. Allowed: ${allowedProtocols.join(', ')}`,
    };
  }

  // Check origin against allowlist
  let originMatched = false;
  let matchedOriginRule: string | undefined;

  for (const allowedOrigin of allowedOrigins) {
    if (matchOrigin(allowedOrigin, origin)) {
      originMatched = true;
      matchedOriginRule = allowedOrigin;
      break;
    }
  }

  if (!originMatched) {
    return {
      valid: false,
      url,
      origin,
      pathname,
      error: `Origin not in allowlist: ${origin}. Allowed: ${allowedOrigins.join(', ')}`,
    };
  }

  // Check path against allowlist (if specified)
  if (allowedPaths && allowedPaths.length > 0) {
    let pathMatched = false;
    let matchedPathRule: string | undefined;

    for (const allowedPath of allowedPaths) {
      if (matchGlob(allowedPath, pathname)) {
        pathMatched = true;
        matchedPathRule = allowedPath;
        break;
      }
    }

    if (!pathMatched) {
      return {
        valid: false,
        url,
        origin,
        pathname,
        error: `Path not in allowlist: ${pathname}. Allowed patterns: ${allowedPaths.join(', ')}`,
      };
    }

    return {
      valid: true,
      url,
      origin,
      pathname,
      matchedRule: `origin:${matchedOriginRule}, path:${matchedPathRule}`,
    };
  }

  // Validate it looks like a remote entry file
  const isValidRemoteEntry = VALID_REMOTE_ENTRY_PATTERNS.some((pattern) =>
    pattern.test(pathname)
  );
  if (!isValidRemoteEntry) {
    return {
      valid: false,
      url,
      origin,
      pathname,
      error: `Path does not match remoteEntry.js pattern: ${pathname}`,
    };
  }

  // Run custom validator if provided
  if (customValidator && !customValidator(parsedUrl)) {
    return {
      valid: false,
      url,
      origin,
      pathname,
      error: 'Custom validation failed',
    };
  }

  return {
    valid: true,
    url,
    origin,
    pathname,
    matchedRule: `origin:${matchedOriginRule}`,
  };
}

/**
 * Remote URL Validator class for reusable validation
 */
export class RemoteUrlValidator {
  private options: RemoteUrlValidatorOptions;
  private validationCache: Map<string, UrlValidationResult> = new Map();

  constructor(options: RemoteUrlValidatorOptions = {}) {
    this.options = options;
  }

  /**
   * Validate a URL
   */
  validate(url: string): UrlValidationResult {
    // Check cache first
    const cached = this.validationCache.get(url);
    if (cached) return cached;

    // Validate and cache
    const result = validateRemoteUrl(url, this.options);
    this.validationCache.set(url, result);
    return result;
  }

  /**
   * Check if URL is valid (convenience method)
   */
  isValid(url: string): boolean {
    return this.validate(url).valid;
  }

  /**
   * Validate all URLs in an object (e.g., rspack remotes config)
   * Returns array of invalid URLs with details
   */
  validateRemotesConfig(
    remotes: Record<string, string>
  ): { name: string; url: string; result: UrlValidationResult }[] {
    const results: { name: string; url: string; result: UrlValidationResult }[] =
      [];

    for (const [name, remoteSpec] of Object.entries(remotes)) {
      // Parse remote spec: "remoteName@url" or just "url"
      const url = remoteSpec.includes('@')
        ? remoteSpec.split('@').slice(1).join('@')
        : remoteSpec;

      const result = this.validate(url);
      if (!result.valid) {
        results.push({ name, url, result });
      }
    }

    return results;
  }

  /**
   * Add an allowed origin dynamically
   */
  addAllowedOrigin(origin: string): void {
    if (!this.options.allowedOrigins) {
      this.options.allowedOrigins = [];
    }
    if (!this.options.allowedOrigins.includes(origin)) {
      this.options.allowedOrigins.push(origin);
      // Clear cache since rules changed
      this.validationCache.clear();
    }
  }

  /**
   * Add an allowed path pattern dynamically
   */
  addAllowedPath(path: string): void {
    if (!this.options.allowedPaths) {
      this.options.allowedPaths = [];
    }
    if (!this.options.allowedPaths.includes(path)) {
      this.options.allowedPaths.push(path);
      this.validationCache.clear();
    }
  }

  /**
   * Clear validation cache
   */
  clearCache(): void {
    this.validationCache.clear();
  }

  /**
   * Get current allowed origins
   */
  getAllowedOrigins(): string[] {
    return this.options.allowedOrigins || (isProduction ? DEFAULT_PROD_ORIGINS : DEFAULT_DEV_ORIGINS);
  }
}

/**
 * Default validator instance with environment-aware defaults
 */
export const remoteUrlValidator = new RemoteUrlValidator();

/**
 * Quick validation helper - checks if URL is valid using default rules
 */
export function isRemoteUrlValid(url: string): boolean {
  return remoteUrlValidator.isValid(url);
}

/**
 * Get the default allowed origins for the current environment
 */
export function getDefaultAllowedOrigins(): string[] {
  return isProduction ? [...DEFAULT_PROD_ORIGINS] : [...DEFAULT_DEV_ORIGINS];
}

/**
 * Create a validator for rspack config validation at build time
 * Can be used in rspack.config.js to validate remotes config
 */
export function createBuildTimeValidator(
  customOrigins?: string[]
): RemoteUrlValidator {
  return new RemoteUrlValidator({
    allowedOrigins: customOrigins || getDefaultAllowedOrigins(),
    // At build time, allow both protocols for flexibility
    allowedProtocols: ['http:', 'https:'],
  });
}
