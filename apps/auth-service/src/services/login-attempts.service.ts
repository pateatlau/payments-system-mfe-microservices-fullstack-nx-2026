/**
 * Login Attempts Tracking Service
 *
 * Tracks failed login attempts and implements account lockout
 * to protect against brute force attacks.
 *
 * Features:
 * - Track failed attempts by email + IP combination
 * - Lockout after configurable number of failures
 * - Exponential backoff for repeated failures
 * - Auto-unlock after lockout period
 * - Suspicious activity logging
 */

import { cache } from '../lib/cache';
import crypto from 'crypto';

/**
 * Configuration constants
 */
const CONFIG = {
  // Maximum failed attempts before lockout
  MAX_FAILED_ATTEMPTS: 5,

  // Lockout duration in seconds (15 minutes)
  LOCKOUT_DURATION: 15 * 60,

  // Window for counting failed attempts (15 minutes)
  ATTEMPT_WINDOW: 15 * 60,

  // Enable exponential backoff
  EXPONENTIAL_BACKOFF: true,

  // Base delay for exponential backoff (in seconds)
  BACKOFF_BASE_DELAY: 1,

  // Maximum backoff delay (in seconds)
  BACKOFF_MAX_DELAY: 60,

  // Redis key prefixes
  ATTEMPTS_PREFIX: 'login_attempts:',
  LOCKOUT_PREFIX: 'account_lockout:',
} as const;

/**
 * Login attempt record stored in Redis
 */
interface LoginAttemptRecord {
  count: number;
  firstAttemptAt: string;
  lastAttemptAt: string;
  ips: string[];
}

/**
 * Lockout record stored in Redis
 */
interface LockoutRecord {
  lockedAt: string;
  unlockAt: string;
  reason: string;
  failedAttempts: number;
  lastIp: string;
}

/**
 * Result of checking login attempt
 */
export interface LoginAttemptCheckResult {
  allowed: boolean;
  remainingAttempts: number;
  lockedUntil?: Date;
  waitSeconds?: number;
  message?: string;
}

/**
 * Generate a key for tracking attempts by email
 */
function getAttemptsKey(email: string): string {
  const emailHash = crypto
    .createHash('sha256')
    .update(email.toLowerCase())
    .digest('hex')
    .substring(0, 16);
  return `${CONFIG.ATTEMPTS_PREFIX}${emailHash}`;
}

/**
 * Generate a key for account lockout by email
 */
function getLockoutKey(email: string): string {
  const emailHash = crypto
    .createHash('sha256')
    .update(email.toLowerCase())
    .digest('hex')
    .substring(0, 16);
  return `${CONFIG.LOCKOUT_PREFIX}${emailHash}`;
}

/**
 * Calculate exponential backoff delay based on attempt count
 */
function calculateBackoffDelay(attemptCount: number): number {
  if (!CONFIG.EXPONENTIAL_BACKOFF || attemptCount <= 1) {
    return 0;
  }

  // Exponential backoff: baseDelay * 2^(attempts - 2)
  const delay = CONFIG.BACKOFF_BASE_DELAY * Math.pow(2, attemptCount - 2);
  return Math.min(delay, CONFIG.BACKOFF_MAX_DELAY);
}

/**
 * Check if a login attempt is allowed
 *
 * @param email - The email attempting to login
 * @param _ip - The IP address of the request (reserved for future per-IP tracking)
 * @returns Result indicating if attempt is allowed and remaining attempts
 */
export async function checkLoginAttempt(
  email: string,
  _ip: string
): Promise<LoginAttemptCheckResult> {
  const lockoutKey = getLockoutKey(email);
  const attemptsKey = getAttemptsKey(email);

  // Check if account is locked out
  const lockout = await cache.get<LockoutRecord>(lockoutKey);

  if (lockout) {
    const unlockAt = new Date(lockout.unlockAt);
    const now = new Date();

    if (unlockAt > now) {
      // Account is still locked
      const waitSeconds = Math.ceil((unlockAt.getTime() - now.getTime()) / 1000);

      return {
        allowed: false,
        remainingAttempts: 0,
        lockedUntil: unlockAt,
        waitSeconds,
        message: `Account is temporarily locked. Please try again in ${Math.ceil(waitSeconds / 60)} minutes.`,
      };
    }

    // Lockout has expired, remove it
    await cache.delete(lockoutKey);
  }

  // Get current attempt count
  const record = await cache.get<LoginAttemptRecord>(attemptsKey);
  const currentAttempts = record?.count || 0;
  const remainingAttempts = Math.max(0, CONFIG.MAX_FAILED_ATTEMPTS - currentAttempts);

  // Check if exponential backoff applies
  if (currentAttempts > 0) {
    const backoffDelay = calculateBackoffDelay(currentAttempts);

    if (backoffDelay > 0 && record) {
      const lastAttempt = new Date(record.lastAttemptAt);
      const nextAllowedAttempt = new Date(lastAttempt.getTime() + backoffDelay * 1000);
      const now = new Date();

      if (nextAllowedAttempt > now) {
        const waitSeconds = Math.ceil((nextAllowedAttempt.getTime() - now.getTime()) / 1000);

        return {
          allowed: false,
          remainingAttempts,
          waitSeconds,
          message: `Please wait ${waitSeconds} seconds before trying again.`,
        };
      }
    }
  }

  return {
    allowed: true,
    remainingAttempts,
  };
}

/**
 * Record a failed login attempt
 *
 * @param email - The email that failed login
 * @param ip - The IP address of the request
 * @returns Updated attempt check result (may indicate lockout)
 */
export async function recordFailedAttempt(
  email: string,
  ip: string
): Promise<LoginAttemptCheckResult> {
  const lockoutKey = getLockoutKey(email);
  const attemptsKey = getAttemptsKey(email);

  // Get current record
  const record = await cache.get<LoginAttemptRecord>(attemptsKey);
  const now = new Date();

  // Create or update record
  const newRecord: LoginAttemptRecord = {
    count: (record?.count || 0) + 1,
    firstAttemptAt: record?.firstAttemptAt || now.toISOString(),
    lastAttemptAt: now.toISOString(),
    ips: record?.ips || [],
  };

  // Add IP if not already tracked (limit to 10 IPs)
  if (!newRecord.ips.includes(ip) && newRecord.ips.length < 10) {
    newRecord.ips.push(ip);
  }

  // Save updated record
  await cache.set(attemptsKey, newRecord, { ttl: CONFIG.ATTEMPT_WINDOW });

  // Check if lockout threshold reached
  if (newRecord.count >= CONFIG.MAX_FAILED_ATTEMPTS) {
    // Create lockout
    const unlockAt = new Date(now.getTime() + CONFIG.LOCKOUT_DURATION * 1000);

    const lockoutRecord: LockoutRecord = {
      lockedAt: now.toISOString(),
      unlockAt: unlockAt.toISOString(),
      reason: 'Too many failed login attempts',
      failedAttempts: newRecord.count,
      lastIp: ip,
    };

    await cache.set(lockoutKey, lockoutRecord, { ttl: CONFIG.LOCKOUT_DURATION });

    // Log suspicious activity
    console.warn(
      `[Security] Account locked: ${email} after ${newRecord.count} failed attempts. ` +
        `IPs: ${newRecord.ips.join(', ')}. Locked until: ${unlockAt.toISOString()}`
    );

    return {
      allowed: false,
      remainingAttempts: 0,
      lockedUntil: unlockAt,
      waitSeconds: CONFIG.LOCKOUT_DURATION,
      message: `Account is temporarily locked due to too many failed login attempts. Please try again in ${Math.ceil(CONFIG.LOCKOUT_DURATION / 60)} minutes.`,
    };
  }

  // Calculate backoff for next attempt
  const backoffDelay = calculateBackoffDelay(newRecord.count);
  const remainingAttempts = CONFIG.MAX_FAILED_ATTEMPTS - newRecord.count;

  // Log warning if approaching lockout
  if (remainingAttempts <= 2) {
    console.warn(
      `[Security] Login attempt warning: ${email} has ${remainingAttempts} attempts remaining. IP: ${ip}`
    );
  }

  return {
    allowed: true,
    remainingAttempts,
    waitSeconds: backoffDelay > 0 ? backoffDelay : undefined,
    message:
      remainingAttempts <= 2
        ? `Warning: ${remainingAttempts} login attempts remaining before account lockout.`
        : undefined,
  };
}

/**
 * Record a successful login (clears failed attempts)
 *
 * @param email - The email that successfully logged in
 */
export async function recordSuccessfulLogin(email: string): Promise<void> {
  const attemptsKey = getAttemptsKey(email);
  const lockoutKey = getLockoutKey(email);

  // Clear failed attempts and any lockout
  await Promise.all([cache.delete(attemptsKey), cache.delete(lockoutKey)]);
}

/**
 * Manually unlock an account (admin function)
 *
 * @param email - The email to unlock
 */
export async function unlockAccount(email: string): Promise<void> {
  const attemptsKey = getAttemptsKey(email);
  const lockoutKey = getLockoutKey(email);

  await Promise.all([cache.delete(attemptsKey), cache.delete(lockoutKey)]);

  console.log(`[Security] Account manually unlocked: ${email}`);
}

/**
 * Check if an account is currently locked
 *
 * @param email - The email to check
 * @returns Lockout information if locked, null otherwise
 */
export async function getAccountLockoutStatus(
  email: string
): Promise<LockoutRecord | null> {
  const lockoutKey = getLockoutKey(email);
  const lockout = await cache.get<LockoutRecord>(lockoutKey);

  if (lockout) {
    const unlockAt = new Date(lockout.unlockAt);
    if (unlockAt > new Date()) {
      return lockout;
    }
  }

  return null;
}

/**
 * Get current failed attempt count for an email
 *
 * @param email - The email to check
 * @returns Current failed attempt count
 */
export async function getFailedAttemptCount(email: string): Promise<number> {
  const attemptsKey = getAttemptsKey(email);
  const record = await cache.get<LoginAttemptRecord>(attemptsKey);
  return record?.count || 0;
}
