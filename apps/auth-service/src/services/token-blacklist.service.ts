/**
 * Token Blacklist Service
 *
 * Redis-based blacklist for revoked tokens
 * Used to invalidate tokens before their natural expiration
 */

import { cache } from '../lib/cache';
import crypto from 'crypto';

/**
 * Blacklist key prefix
 */
const BLACKLIST_PREFIX = 'blacklist:';
const TOKEN_FAMILY_PREFIX = 'token_family:';

/**
 * Default TTL for blacklisted tokens (7 days = max refresh token lifetime)
 */
const BLACKLIST_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Add a token to the blacklist
 *
 * @param token - The token to blacklist (or token ID)
 * @param ttlSeconds - Optional TTL (defaults to 7 days)
 */
export async function blacklistToken(
  token: string,
  ttlSeconds: number = BLACKLIST_TTL
): Promise<void> {
  const key = `${BLACKLIST_PREFIX}${hashToken(token)}`;
  await cache.set(key, { blacklistedAt: new Date().toISOString() }, { ttl: ttlSeconds });
}

/**
 * Check if a token is blacklisted
 *
 * @param token - The token to check
 * @returns true if blacklisted, false otherwise
 */
export async function isTokenBlacklisted(token: string): Promise<boolean> {
  const key = `${BLACKLIST_PREFIX}${hashToken(token)}`;
  return await cache.exists(key);
}

/**
 * Blacklist all tokens in a token family (used when token reuse is detected)
 *
 * @param tokenFamily - The token family ID to blacklist
 * @param ttlSeconds - Optional TTL
 */
export async function blacklistTokenFamily(
  tokenFamily: string,
  ttlSeconds: number = BLACKLIST_TTL
): Promise<void> {
  const key = `${TOKEN_FAMILY_PREFIX}${tokenFamily}`;
  await cache.set(key, { blacklistedAt: new Date().toISOString() }, { ttl: ttlSeconds });
}

/**
 * Check if a token family is blacklisted
 *
 * @param tokenFamily - The token family ID to check
 * @returns true if blacklisted, false otherwise
 */
export async function isTokenFamilyBlacklisted(tokenFamily: string): Promise<boolean> {
  const key = `${TOKEN_FAMILY_PREFIX}${tokenFamily}`;
  return await cache.exists(key);
}

/**
 * Blacklist all tokens for a user (used on password change, logout all)
 *
 * @param userId - The user ID
 * @param ttlSeconds - Optional TTL
 */
export async function blacklistUserTokens(
  userId: string,
  ttlSeconds: number = BLACKLIST_TTL
): Promise<void> {
  const key = `${BLACKLIST_PREFIX}user:${userId}`;
  await cache.set(
    key,
    { blacklistedAt: new Date().toISOString(), allTokens: true },
    { ttl: ttlSeconds }
  );
}

/**
 * Check if all tokens for a user are blacklisted
 *
 * @param userId - The user ID to check
 * @returns true if all user tokens are blacklisted, false otherwise
 */
export async function areUserTokensBlacklisted(userId: string): Promise<boolean> {
  const key = `${BLACKLIST_PREFIX}user:${userId}`;
  return await cache.exists(key);
}

/**
 * Generate a fingerprint from request metadata
 *
 * POC-3 Phase 7.3: Enhanced to optionally include client fingerprint hash
 *
 * @param ip - Client IP address
 * @param userAgent - Client User-Agent header
 * @param clientFingerprint - Optional client-side fingerprint hash from X-Client-Fingerprint header
 * @returns Hash of the fingerprint data
 */
export function generateFingerprint(
  ip: string,
  userAgent: string,
  clientFingerprint?: string
): string {
  // Include client fingerprint if provided (more granular than just IP+UA)
  const data = clientFingerprint
    ? `${ip}:${userAgent}:${clientFingerprint}`
    : `${ip}:${userAgent}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
}

/**
 * POC-3 Phase 7.3: Fingerprint validation result
 */
export interface FingerprintValidationResult {
  isValid: boolean;
  mismatchType?: 'exact' | 'ip_changed' | 'ua_changed' | 'client_changed' | 'all_changed';
  details?: string;
}

/**
 * Validate a fingerprint against current request
 *
 * POC-3 Phase 7.3: Enhanced with detailed mismatch information for logging
 *
 * @param storedFingerprint - The fingerprint stored with the token
 * @param ip - Current request IP
 * @param userAgent - Current request User-Agent
 * @param clientFingerprint - Optional client-side fingerprint from header
 * @param options - Validation options
 * @returns Validation result with details
 */
export function validateFingerprintDetailed(
  storedFingerprint: string | null,
  ip: string,
  userAgent: string,
  clientFingerprint?: string,
  options?: { strictMode?: boolean }
): FingerprintValidationResult {
  // If no fingerprint stored and not in strict mode, allow (backwards compatibility)
  if (!storedFingerprint) {
    if (options?.strictMode) {
      return {
        isValid: false,
        mismatchType: 'all_changed',
        details: 'No stored fingerprint (strict mode enabled)',
      };
    }
    return { isValid: true };
  }

  // Generate current fingerprint
  const currentFingerprint = generateFingerprint(ip, userAgent, clientFingerprint);

  if (storedFingerprint === currentFingerprint) {
    return { isValid: true };
  }

  // Fingerprint mismatch - log details for diagnostics (PII anonymized)
  // IP is omitted to protect user privacy, only UA prefix is included
  return {
    isValid: false,
    mismatchType: 'exact',
    details: `Fingerprint mismatch. UA: ${userAgent.substring(0, 30)}...`,
  };
}

/**
 * Validate a fingerprint against current request (simple boolean version)
 *
 * @param storedFingerprint - The fingerprint stored with the token
 * @param ip - Current request IP
 * @param userAgent - Current request User-Agent
 * @param clientFingerprint - Optional client-side fingerprint from header
 * @returns true if fingerprint matches, false otherwise
 */
export function validateFingerprint(
  storedFingerprint: string | null,
  ip: string,
  userAgent: string,
  clientFingerprint?: string
): boolean {
  const result = validateFingerprintDetailed(
    storedFingerprint,
    ip,
    userAgent,
    clientFingerprint
  );
  return result.isValid;
}

/**
 * Generate a new token family ID
 *
 * @returns A new UUID for the token family
 */
export function generateTokenFamily(): string {
  return crypto.randomUUID();
}

/**
 * Hash a token for safe storage in blacklist keys
 *
 * @param token - The token to hash
 * @returns SHA-256 hash of the token (first 32 chars)
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex').substring(0, 32);
}
