/**
 * OAuth Service
 *
 * Business logic for OAuth/Social login operations.
 *
 * Features:
 * - OAuth flow initiation (redirect to Auth0)
 * - OAuth callback handling (exchange code for tokens)
 * - User creation/linking from OAuth profiles
 * - Account linking/unlinking
 *
 * Uses Auth0 as a federation layer for social providers:
 * - Google, GitHub, Facebook, LinkedIn, Twitter
 *
 * Security:
 * - CSRF protection via state parameter (stored in Redis)
 * - State expires after 10 minutes
 * - Automatic email verification for OAuth users
 */

import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import type { User } from '.prisma/auth-client';
import { ApiError } from '../middleware/errorHandler';
import { UserRole } from 'shared-types';
import { cache, CacheTags } from '../lib/cache';
import {
  auth0Client,
  Auth0UserProfile,
  SUPPORTED_PROVIDERS,
} from '../lib/auth0';
import {
  generateTokenPair,
  JwtPayload,
} from '../utils/token';
import {
  generateFingerprint,
  generateTokenFamily,
} from './token-blacklist.service';
import {
  publishUserCreated,
  publishUserLogin,
  publishOAuthLinked,
  publishOAuthUnlinked,
} from '../events/publisher';
import { isMfaRequired } from './mfa.service';
import { config } from '../config';
import { encryptOptional } from '../utils/encryption';

/**
 * OAuth State TTL (10 minutes)
 */
const OAUTH_STATE_TTL = 600;

/**
 * Redis key prefix for OAuth state
 */
const OAUTH_STATE_PREFIX = 'oauth:state:';

/**
 * OAuth state data stored in Redis
 */
interface OAuthStateData {
  provider: string;
  returnUrl: string;
  createdAt: string;
  userId?: string; // Set when linking to existing account
}

/**
 * OAuth flow initiation response
 */
export interface OAuthInitiateResponse {
  authorizationUrl: string;
  state: string;
}

/**
 * OAuth callback response (similar to login response)
 */
export interface OAuthCallbackResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  isNewUser?: boolean;
  linkedProvider?: string;
  mfaRequired?: boolean;
  mfaToken?: string;
}

/**
 * Linked OAuth account info
 */
export interface LinkedOAuthAccount {
  id: string;
  provider: string;
  email: string | null;
  name: string | null;
  linkedAt: Date;
}

/**
 * Generate secure state parameter for CSRF protection
 */
function generateState(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Initiate OAuth flow
 *
 * Generates authorization URL and stores state in Redis for CSRF protection.
 *
 * @param provider - Social provider (google, github, etc.)
 * @param returnUrl - URL to redirect after successful login
 * @param userId - Optional user ID for account linking
 * @returns Authorization URL and state
 */
export async function initiateOAuthFlow(
  provider: string,
  returnUrl: string = '/',
  userId?: string
): Promise<OAuthInitiateResponse> {
  // Validate provider
  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    throw new ApiError(
      400,
      'INVALID_PROVIDER',
      `Unsupported OAuth provider: ${provider}. Supported providers: ${SUPPORTED_PROVIDERS.join(', ')}`
    );
  }

  // Initialize Auth0 client if needed
  await auth0Client.initialize();

  // Generate CSRF state
  const state = generateState();

  // Store state in Redis
  const stateData: OAuthStateData = {
    provider,
    returnUrl,
    createdAt: new Date().toISOString(),
    userId, // For account linking
  };

  await cache.set(`${OAUTH_STATE_PREFIX}${state}`, stateData, {
    ttl: OAUTH_STATE_TTL,
  });

  // Generate authorization URL
  const authorizationUrl = await auth0Client.getAuthorizationUrl(
    provider,
    state,
    returnUrl
  );

  console.log(`[OAuth] Initiated ${provider} flow`);

  return {
    authorizationUrl,
    state,
  };
}

/**
 * Handle OAuth callback
 *
 * Validates state, exchanges code for tokens, and creates/links user account.
 *
 * @param code - Authorization code from provider
 * @param state - State parameter for CSRF validation
 * @param requestMeta - Request metadata for fingerprinting
 * @returns Auth response with user and tokens
 */
export async function handleOAuthCallback(
  code: string,
  state: string,
  requestMeta?: { ip: string; userAgent: string }
): Promise<OAuthCallbackResponse> {
  // Validate state
  const stateKey = `${OAUTH_STATE_PREFIX}${state}`;
  const stateData = await cache.get<OAuthStateData>(stateKey);

  if (!stateData) {
    throw new ApiError(
      400,
      'INVALID_STATE',
      'OAuth state is invalid or expired. Please try again.'
    );
  }

  // Delete state (one-time use)
  await cache.delete(stateKey);

  // Exchange code for tokens and get profile
  const { profile, accessToken: providerAccessToken, refreshToken: providerRefreshToken, expiresAt } =
    await auth0Client.handleCallback(code, state);

  // SECURITY: Log without PII (no email addresses)
  console.log(`[OAuth] Callback received from ${profile.provider}`);

  // Check if this is account linking or login/registration
  if (stateData.userId) {
    return handleAccountLinking(
      stateData.userId,
      profile,
      providerAccessToken,
      providerRefreshToken,
      expiresAt,
      requestMeta
    );
  }

  // Find or create user based on OAuth profile
  return findOrCreateOAuthUser(
    profile,
    providerAccessToken,
    providerRefreshToken,
    expiresAt,
    requestMeta
  );
}

/**
 * Find or create user from OAuth profile
 */
async function findOrCreateOAuthUser(
  profile: Auth0UserProfile,
  providerAccessToken: string | undefined,
  providerRefreshToken: string | undefined,
  tokenExpiresAt: Date | undefined,
  requestMeta?: { ip: string; userAgent: string }
): Promise<OAuthCallbackResponse> {
  // Check if OAuth account already exists
  let oauthAccount = await prisma.oAuthAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
      },
    },
    include: { user: true },
  });

  let user: User;
  let isNewUser = false;

  if (oauthAccount) {
    // Existing OAuth account - return linked user
    user = oauthAccount.user;

    // Update OAuth account with fresh tokens (encrypted)
    await prisma.oAuthAccount.update({
      where: { id: oauthAccount.id },
      data: {
        accessToken: encryptOptional(providerAccessToken),
        refreshToken: encryptOptional(providerRefreshToken),
        tokenExpiresAt,
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.picture,
      },
    });

    console.log(`[OAuth] Existing user login: ${user.id} via ${profile.provider}`);
  } else {
    // New OAuth account - check if email exists
    if (profile.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (existingUser) {
        // Email exists - check if we can safely auto-link
        // SECURITY: Only auto-link if BOTH emails are verified to prevent account takeover
        console.log(`[OAuth] Existing user found for email. Checking verification status:`, {
          oauthEmailVerified: profile.emailVerified,
          dbEmailVerified: existingUser.emailVerified,
          userId: existingUser.id,
        });
        if (profile.emailVerified && existingUser.emailVerified) {
          // Both emails verified - safe to auto-link
          oauthAccount = await prisma.oAuthAccount.create({
            data: {
              userId: existingUser.id,
              provider: profile.provider,
              providerAccountId: profile.providerAccountId,
              email: profile.email,
              name: profile.name,
              avatarUrl: profile.picture,
              accessToken: encryptOptional(providerAccessToken),
              refreshToken: encryptOptional(providerRefreshToken),
              tokenExpiresAt,
            },
          });

          user = existingUser;
          console.log(`[OAuth] Auto-linked ${profile.provider} to existing user: ${user.id} (both emails verified)`);

          // Publish OAuth linked event
          try {
            await publishOAuthLinked({
              userId: user.id,
              provider: profile.provider,
              providerAccountId: profile.providerAccountId,
              linkedAt: new Date().toISOString(),
            });
          } catch (_error) {
            console.error('Failed to publish oauth.linked event:', _error);
          }
        } else {
          // SECURITY: Email not verified on one or both sides - require manual linking
          // This prevents account takeover via unverified email addresses
          throw new ApiError(
            409,
            'EMAIL_EXISTS_UNVERIFIED',
            'An account with this email already exists. Please sign in with your password and link your social account from your profile settings.'
          );
        }
      } else {
        // Create new user
        user = await createOAuthUser(profile, providerAccessToken, providerRefreshToken, tokenExpiresAt);
        isNewUser = true;
      }
    } else {
      // No email from provider - create user without email
      // This is a special case, user will need to add email later
      throw new ApiError(
        400,
        'EMAIL_REQUIRED',
        'Email address is required for registration. Please allow email access in your social provider settings.'
      );
    }
  }

  // Check if MFA is required
  const mfaEnabled = await isMfaRequired(user.id);

  if (mfaEnabled) {
    return handleMfaRequired(user, requestMeta);
  }

  // Generate tokens
  return generateAuthResponse(user, isNewUser, profile.provider, requestMeta);
}

/**
 * Create new user from OAuth profile
 */
async function createOAuthUser(
  profile: Auth0UserProfile,
  providerAccessToken: string | undefined,
  providerRefreshToken: string | undefined,
  tokenExpiresAt: Date | undefined
): Promise<User> {
  // Create user and OAuth account in transaction
  const result = await prisma.$transaction(async (tx: typeof prisma) => {
    // Create user (social-only: no password, emailVerified from provider)
    const user = await tx.user.create({
      data: {
        email: profile.email!,
        passwordHash: null, // Social-only user
        name: profile.name || profile.nickname || profile.email!.split('@')[0],
        role: UserRole.CUSTOMER,
        emailVerified: profile.emailVerified || false, // Trust provider's verification
        hasPassword: false, // Social-only user
      },
    });

    // Create OAuth account (with encrypted tokens)
    await tx.oAuthAccount.create({
      data: {
        userId: user.id,
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.picture,
        accessToken: encryptOptional(providerAccessToken),
        refreshToken: encryptOptional(providerRefreshToken),
        tokenExpiresAt,
      },
    });

    return user;
  });

  console.log(`[OAuth] Created new user: ${result.id} via ${profile.provider}`);

  // Publish user.created event
  try {
    await publishUserCreated({
      userId: result.id,
      email: result.email,
      name: result.name,
      role: result.role,
      emailVerified: result.emailVerified,
      createdAt: result.createdAt.toISOString(),
    });
  } catch (_error) {
    console.error('Failed to publish user.created event:', _error);
  }

  return result;
}

/**
 * Handle account linking (add OAuth to existing user)
 */
async function handleAccountLinking(
  userId: string,
  profile: Auth0UserProfile,
  providerAccessToken: string | undefined,
  providerRefreshToken: string | undefined,
  tokenExpiresAt: Date | undefined,
  requestMeta?: { ip: string; userAgent: string }
): Promise<OAuthCallbackResponse> {
  // Get existing user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
  }

  // Check if this provider is already linked
  const existingOAuth = await prisma.oAuthAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
      },
    },
  });

  if (existingOAuth) {
    if (existingOAuth.userId === userId) {
      throw new ApiError(
        400,
        'ALREADY_LINKED',
        `${profile.provider} account is already linked to your account.`
      );
    } else {
      throw new ApiError(
        400,
        'ACCOUNT_LINKED_TO_ANOTHER_USER',
        `This ${profile.provider} account is already linked to a different user.`
      );
    }
  }

  // Check if user already has this provider linked (different account)
  const existingProviderLink = await prisma.oAuthAccount.findFirst({
    where: {
      userId,
      provider: profile.provider,
    },
  });

  if (existingProviderLink) {
    throw new ApiError(
      400,
      'PROVIDER_ALREADY_LINKED',
      `You already have a ${profile.provider} account linked. Unlink it first to link a different account.`
    );
  }

  // Create OAuth account link (with encrypted tokens)
  await prisma.oAuthAccount.create({
    data: {
      userId,
      provider: profile.provider,
      providerAccountId: profile.providerAccountId,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.picture,
      accessToken: encryptOptional(providerAccessToken),
      refreshToken: encryptOptional(providerRefreshToken),
      tokenExpiresAt,
    },
  });

  console.log(`[OAuth] Linked ${profile.provider} to user: ${userId}`);

  // Publish OAuth linked event
  try {
    await publishOAuthLinked({
      userId,
      provider: profile.provider,
      providerAccountId: profile.providerAccountId,
      linkedAt: new Date().toISOString(),
    });
  } catch (_error) {
    console.error('Failed to publish oauth.linked event:', _error);
  }

  // Invalidate user cache
  await cache.invalidateByTag(CacheTags.user(userId));

  // Generate tokens
  return generateAuthResponse(user, false, profile.provider, requestMeta);
}

/**
 * Handle MFA required for OAuth user
 */
async function handleMfaRequired(
  user: User,
  _requestMeta?: { ip: string; userAgent: string }
): Promise<OAuthCallbackResponse> {
  // Generate short-lived MFA token
  const jwt = await import('jsonwebtoken');
  const mfaPayload: JwtPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
  };

  const mfaToken = jwt.default.sign(
    { ...mfaPayload, purpose: 'mfa_verification' },
    config.jwtSecret,
    { expiresIn: '5m' }
  );

  console.log(`[OAuth] MFA required for user: ${user.id}`);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    accessToken: '',
    refreshToken: '',
    expiresIn: '',
    mfaRequired: true,
    mfaToken,
  };
}

/**
 * Generate auth response with tokens
 */
async function generateAuthResponse(
  user: User,
  isNewUser: boolean,
  linkedProvider: string,
  requestMeta?: { ip: string; userAgent: string }
): Promise<OAuthCallbackResponse> {
  // Generate JWT payload
  const jwtPayload: JwtPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
  };

  // Generate tokens
  const tokens = generateTokenPair(jwtPayload);

  // Generate token family and fingerprint
  const tokenFamily = generateTokenFamily();
  const fingerprint = requestMeta
    ? generateFingerprint(requestMeta.ip, requestMeta.userAgent)
    : null;

  // SECURITY POLICY: Delete all existing refresh tokens on OAuth login
  // This invalidates all other sessions for this user, ensuring:
  // 1. Only the current OAuth session is active
  // 2. Any compromised sessions are terminated
  // 3. Consistent with security best practice for sensitive operations
  // Note: If concurrent sessions are needed, implement per-client token tracking instead
  //
  // Use transaction to ensure atomic delete+create (both succeed or both fail)
  await prisma.$transaction(async (tx: typeof prisma) => {
    await tx.refreshToken.deleteMany({
      where: { userId: user.id },
    });

    // Store new refresh token
    await tx.refreshToken.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        tokenFamily,
        fingerprint,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });
  });

  // Publish login event
  try {
    await publishUserLogin({
      userId: user.id,
      email: user.email,
      loginAt: new Date().toISOString(),
      ipAddress: requestMeta?.ip || 'unknown',
    });
  } catch (_error) {
    console.error('Failed to publish user.login event:', _error);
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
    isNewUser,
    linkedProvider,
  };
}

/**
 * Unlink OAuth account from user
 *
 * @param userId - User ID
 * @param provider - Provider to unlink
 * @returns Updated user
 */
export async function unlinkOAuthAccount(
  userId: string,
  provider: string
): Promise<void> {
  // Get user with OAuth accounts
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { oauthAccounts: true },
  });

  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
  }

  // Find the OAuth account to unlink
  const oauthAccount = user.oauthAccounts.find((a: { provider: string }) => a.provider === provider);

  if (!oauthAccount) {
    throw new ApiError(
      404,
      'OAUTH_NOT_LINKED',
      `No ${provider} account linked to your account.`
    );
  }

  // Check if user can unlink (must have password OR other OAuth accounts)
  const otherOAuthAccounts = user.oauthAccounts.filter((a: { provider: string }) => a.provider !== provider);
  const canUnlink = user.hasPassword || otherOAuthAccounts.length > 0;

  if (!canUnlink) {
    throw new ApiError(
      400,
      'CANNOT_UNLINK',
      'Cannot unlink this account. You must have a password or another linked social account to sign in.'
    );
  }

  // Delete OAuth account
  await prisma.oAuthAccount.delete({
    where: { id: oauthAccount.id },
  });

  console.log(`[OAuth] Unlinked ${provider} from user: ${userId}`);

  // Publish OAuth unlinked event
  try {
    await publishOAuthUnlinked({
      userId,
      provider,
      unlinkedAt: new Date().toISOString(),
    });
  } catch (_error) {
    console.error('Failed to publish oauth.unlinked event:', _error);
  }

  // Invalidate user cache
  await cache.invalidateByTag(CacheTags.user(userId));
}

/**
 * Get linked OAuth accounts for a user
 *
 * @param userId - User ID
 * @returns List of linked OAuth accounts
 */
export async function getLinkedOAuthAccounts(
  userId: string
): Promise<LinkedOAuthAccount[]> {
  const accounts = await prisma.oAuthAccount.findMany({
    where: { userId },
    select: {
      id: true,
      provider: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });

  return accounts.map((a: { id: string; provider: string; email: string | null; name: string | null; createdAt: Date }) => ({
    id: a.id,
    provider: a.provider,
    email: a.email,
    name: a.name,
    linkedAt: a.createdAt,
  }));
}

/**
 * Get supported OAuth providers
 */
export function getSupportedProviders(): string[] {
  return [...SUPPORTED_PROVIDERS];
}
