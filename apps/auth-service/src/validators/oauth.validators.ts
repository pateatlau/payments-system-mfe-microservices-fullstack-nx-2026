/**
 * OAuth Validators
 *
 * Zod schemas for OAuth request validation
 */

import { z } from 'zod';
import { SUPPORTED_PROVIDERS } from '../lib/auth0';

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
  // Allow relative paths (like '/') or full URLs
  returnUrl: z.string().optional().default('/'),
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
