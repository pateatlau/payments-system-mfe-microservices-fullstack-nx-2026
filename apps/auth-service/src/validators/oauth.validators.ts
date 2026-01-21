/**
 * OAuth Validators
 *
 * Zod schemas for OAuth request validation
 */

import { z } from 'zod';
import { SUPPORTED_PROVIDERS } from '../lib/auth0';

// ============================================================================
// HELPERS: Return URL Validation (Open Redirect Prevention)
// ============================================================================

/**
 * Allowed origins for return URLs
 * In production, this should be loaded from environment variables
 */
const ALLOWED_ORIGINS = [
  'https://localhost',
  'http://localhost:4200',
  'http://localhost:4201',
  'http://localhost:4202',
  'http://localhost:4203',
  'http://localhost:4204',
];

// Add production origins from environment
if (process.env.FRONTEND_URL) {
  ALLOWED_ORIGINS.push(process.env.FRONTEND_URL);
}
if (process.env.ALLOWED_REDIRECT_ORIGINS) {
  ALLOWED_ORIGINS.push(...process.env.ALLOWED_REDIRECT_ORIGINS.split(',').map(s => s.trim()));
}

/**
 * Validate return URL to prevent open redirects
 *
 * Accepts:
 * - Relative paths starting with "/" (e.g., "/dashboard", "/profile")
 * - Full URLs from allowed origins
 *
 * Rejects:
 * - Protocol-relative URLs (//evil.com)
 * - URLs with different protocols (javascript:, data:, etc.)
 * - URLs to external domains
 */
function isValidReturnUrl(url: string): boolean {
  // Empty or default is safe
  if (!url || url === '/') return true;

  // Must be a string
  if (typeof url !== 'string') return false;

  // Trim whitespace
  const trimmed = url.trim();

  // Check for protocol-relative URLs (//evil.com)
  if (trimmed.startsWith('//')) return false;

  // Check for dangerous protocols
  const lowerUrl = trimmed.toLowerCase();
  if (lowerUrl.startsWith('javascript:') ||
      lowerUrl.startsWith('data:') ||
      lowerUrl.startsWith('vbscript:') ||
      lowerUrl.startsWith('file:')) {
    return false;
  }

  // Check for relative paths (safe)
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    // Additional check: no newlines or special characters that could break headers
    if (/[\r\n]/.test(trimmed)) return false;
    return true;
  }

  // Check for absolute URLs - must be from allowed origins
  try {
    const parsed = new URL(trimmed);
    const origin = `${parsed.protocol}//${parsed.host}`;
    return ALLOWED_ORIGINS.some(allowed =>
      origin.toLowerCase() === allowed.toLowerCase()
    );
  } catch {
    // Not a valid URL
    return false;
  }
}

// ============================================================================
// SCHEMAS: OAuth Flow Initiation
// ============================================================================

/**
 * OAuth initiation request schema (query params)
 */
export const oauthInitiateSchema = z.object({
  provider: z.string().refine(
    (val) => SUPPORTED_PROVIDERS.includes(val),
    (val) => ({ message: `Unsupported provider: ${val}. Supported: ${SUPPORTED_PROVIDERS.join(', ')}` })
  ),
  // SECURITY: Validate returnUrl to prevent open redirect attacks
  returnUrl: z.string()
    .optional()
    .default('/')
    .refine(
      (val) => isValidReturnUrl(val),
      { message: 'Invalid return URL. Must be a relative path or an allowed origin.' }
    ),
});

export type OAuthInitiateInput = z.infer<typeof oauthInitiateSchema>;

// ============================================================================
// SCHEMAS: OAuth Callback
// ============================================================================

/**
 * OAuth callback request schema (query params from Auth0)
 * Note: code/state are required for success, but error callbacks may only have error fields
 */
export const oauthCallbackSchema = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
  error: z.string().optional(),
  error_description: z.string().optional(),
}).refine(
  (data) => {
    // Either we have code+state (success) or error (failure)
    const hasCodeAndState = data.code && data.state;
    const hasError = data.error;
    return hasCodeAndState || hasError;
  },
  {
    message: 'Either code+state (success) or error (failure) must be present',
  }
);

export type OAuthCallbackInput = z.infer<typeof oauthCallbackSchema>;

// ============================================================================
// SCHEMAS: OAuth Account Management
// ============================================================================

/**
 * OAuth link initiation schema
 * (same as initiate, but requires authentication)
 */
export const oauthLinkSchema = z.object({
  provider: z.string().refine(
    (val) => SUPPORTED_PROVIDERS.includes(val),
    (val) => ({ message: `Unsupported provider: ${val}. Supported: ${SUPPORTED_PROVIDERS.join(', ')}` })
  ),
});

export type OAuthLinkInput = z.infer<typeof oauthLinkSchema>;

/**
 * OAuth unlink schema
 */
export const oauthUnlinkSchema = z.object({
  provider: z.string().refine(
    (val) => SUPPORTED_PROVIDERS.includes(val),
    (val) => ({ message: `Unsupported provider: ${val}. Supported: ${SUPPORTED_PROVIDERS.join(', ')}` })
  ),
});

export type OAuthUnlinkInput = z.infer<typeof oauthUnlinkSchema>;
