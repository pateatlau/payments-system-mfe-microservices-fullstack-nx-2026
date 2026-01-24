/**
 * OAuth Service - Unit Tests
 *
 * Tests for OAuth/Social login operations including:
 * - OAuth flow initiation (redirect to Auth0)
 * - OAuth callback handling
 * - User creation/linking from OAuth profiles
 * - Account linking/unlinking
 */

import * as oauthService from './oauth.service';
import { prisma } from '../lib/prisma';
import { auth0Client, Auth0UserProfile, SUPPORTED_PROVIDERS } from '../lib/auth0';
import { cache } from '../lib/cache';
import { ApiError } from '../middleware/errorHandler';
import { UserRole } from 'shared-types';
import * as tokenUtils from '../utils/token';

// Mock dependencies
jest.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    oAuthAccount: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    refreshToken: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('../lib/auth0', () => ({
  auth0Client: {
    initialize: jest.fn(),
    getAuthorizationUrl: jest.fn(),
    handleCallback: jest.fn(),
  },
  SUPPORTED_PROVIDERS: ['google', 'github', 'facebook', 'linkedin', 'twitter'],
  PROVIDER_CONNECTION_MAP: {
    google: 'google-oauth2',
    github: 'github',
    facebook: 'facebook',
    linkedin: 'linkedin',
    twitter: 'twitter',
  },
}));

jest.mock('../lib/cache', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    invalidateByTag: jest.fn(),
  },
  CacheTags: {
    user: (id: string) => `user:${id}`,
  },
}));

jest.mock('../utils/token', () => ({
  generateTokenPair: jest.fn(),
  verifyRefreshToken: jest.fn(),
  JwtPayload: {},
}));

jest.mock('./token-blacklist.service', () => ({
  generateFingerprint: jest.fn().mockReturnValue('mock-fingerprint'),
  generateTokenFamily: jest.fn().mockReturnValue('mock-token-family'),
}));

jest.mock('./mfa.service', () => ({
  isMfaRequired: jest.fn(),
}));

jest.mock('../events/publisher', () => ({
  publishUserCreated: jest.fn().mockResolvedValue(undefined),
  publishUserLogin: jest.fn().mockResolvedValue(undefined),
  publishOAuthLinked: jest.fn().mockResolvedValue(undefined),
  publishOAuthUnlinked: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../config', () => ({
  config: {
    jwtSecret: 'test-jwt-secret',
  },
}));

jest.mock('../utils/encryption', () => ({
  encryptOptional: jest.fn((value) => value ? `encrypted:${value}` : null),
  decryptOptional: jest.fn((value) => value ? value.replace('encrypted:', '') : null),
}));

import { isMfaRequired } from './mfa.service';
import {
  publishUserCreated,
  publishUserLogin,
  publishOAuthLinked,
  publishOAuthUnlinked,
} from '../events/publisher';

describe('OAuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initiateOAuthFlow', () => {
    const mockAuthUrl = 'https://auth0.com/authorize?client_id=test&redirect_uri=test&state=mock-state';

    beforeEach(() => {
      (auth0Client.initialize as jest.Mock).mockResolvedValue(undefined);
      (auth0Client.getAuthorizationUrl as jest.Mock).mockResolvedValue(mockAuthUrl);
      (cache.set as jest.Mock).mockResolvedValue(undefined);
    });

    it('should generate authorization URL for valid provider', async () => {
      const result = await oauthService.initiateOAuthFlow('google', '/dashboard');

      expect(auth0Client.initialize).toHaveBeenCalled();
      expect(auth0Client.getAuthorizationUrl).toHaveBeenCalledWith(
        'google',
        expect.any(String),
        '/dashboard'
      );
      expect(cache.set).toHaveBeenCalledWith(
        expect.stringContaining('oauth:state:'),
        expect.objectContaining({
          provider: 'google',
          returnUrl: '/dashboard',
        }),
        { ttl: 600 }
      );
      expect(result.authorizationUrl).toBe(mockAuthUrl);
      expect(result.state).toBeTruthy();
    });

    it('should generate authorization URL for all supported providers', async () => {
      for (const provider of SUPPORTED_PROVIDERS) {
        const result = await oauthService.initiateOAuthFlow(provider, '/');
        expect(result.authorizationUrl).toBe(mockAuthUrl);
      }
    });

    it('should throw error for unsupported provider', async () => {
      await expect(oauthService.initiateOAuthFlow('invalid-provider', '/')).rejects.toThrow(
        ApiError
      );
      await expect(oauthService.initiateOAuthFlow('invalid-provider', '/')).rejects.toThrow(
        'Unsupported OAuth provider: invalid-provider'
      );
    });

    it('should store user ID in state for account linking', async () => {
      await oauthService.initiateOAuthFlow('google', '/profile', 'user-123');

      expect(cache.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          userId: 'user-123',
        }),
        expect.any(Object)
      );
    });

    it('should use default return URL when not provided', async () => {
      await oauthService.initiateOAuthFlow('google');

      expect(cache.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          returnUrl: '/',
        }),
        expect.any(Object)
      );
    });
  });

  describe('handleOAuthCallback', () => {
    const mockState = 'mock-state-123';
    const mockCode = 'mock-auth-code';
    const mockRequestMeta = { ip: '127.0.0.1', userAgent: 'Test Browser' };

    const mockProfile: Auth0UserProfile = {
      sub: 'google-oauth2|123456789',
      email: 'test@gmail.com',
      emailVerified: true,
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg',
      nickname: 'testuser',
      provider: 'google',
      providerAccountId: '123456789',
    };

    const mockUser = {
      id: 'user-1',
      email: 'test@gmail.com',
      name: 'Test User',
      role: UserRole.CUSTOMER,
      passwordHash: null,
      hasPassword: false,
      emailVerified: true,
      mfaEnabled: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    const mockTokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: '15m',
    };

    beforeEach(() => {
      (cache.get as jest.Mock).mockResolvedValue({
        provider: 'google',
        returnUrl: '/dashboard',
        createdAt: new Date().toISOString(),
      });
      (cache.delete as jest.Mock).mockResolvedValue(undefined);
      (auth0Client.handleCallback as jest.Mock).mockResolvedValue({
        profile: mockProfile,
        accessToken: 'provider-access-token',
        refreshToken: 'provider-refresh-token',
        expiresAt: new Date(Date.now() + 3600000),
      });
      (tokenUtils.generateTokenPair as jest.Mock).mockReturnValue(mockTokens);
      (isMfaRequired as jest.Mock).mockResolvedValue(false);
    });

    it('should throw error if state is invalid or expired', async () => {
      (cache.get as jest.Mock).mockResolvedValue(null);

      await expect(
        oauthService.handleOAuthCallback(mockCode, 'invalid-state', mockRequestMeta)
      ).rejects.toThrow(ApiError);
      await expect(
        oauthService.handleOAuthCallback(mockCode, 'invalid-state', mockRequestMeta)
      ).rejects.toThrow('OAuth state is invalid or expired');
    });

    it('should delete state after use (one-time use)', async () => {
      (prisma.oAuthAccount.findUnique as jest.Mock).mockResolvedValue({
        id: 'oauth-1',
        userId: 'user-1',
        user: mockUser,
      });
      (prisma.oAuthAccount.update as jest.Mock).mockResolvedValue({});
      (prisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(prisma));

      await oauthService.handleOAuthCallback(mockCode, mockState, mockRequestMeta);

      expect(cache.delete).toHaveBeenCalledWith(`oauth:state:${mockState}`);
    });

    describe('existing OAuth user', () => {
      it('should return tokens for existing OAuth user', async () => {
        (prisma.oAuthAccount.findUnique as jest.Mock).mockResolvedValue({
          id: 'oauth-1',
          userId: mockUser.id,
          user: mockUser,
        });
        (prisma.oAuthAccount.update as jest.Mock).mockResolvedValue({});
        (prisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(prisma));

        const result = await oauthService.handleOAuthCallback(
          mockCode,
          mockState,
          mockRequestMeta
        );

        expect(result.user.id).toBe(mockUser.id);
        expect(result.accessToken).toBe(mockTokens.accessToken);
        expect(result.refreshToken).toBe(mockTokens.refreshToken);
        expect(result.isNewUser).toBe(false);
        expect(result.linkedProvider).toBe('google');
      });

      it('should update OAuth account with fresh tokens', async () => {
        (prisma.oAuthAccount.findUnique as jest.Mock).mockResolvedValue({
          id: 'oauth-1',
          userId: mockUser.id,
          user: mockUser,
        });
        (prisma.oAuthAccount.update as jest.Mock).mockResolvedValue({});
        (prisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(prisma));

        await oauthService.handleOAuthCallback(mockCode, mockState, mockRequestMeta);

        expect(prisma.oAuthAccount.update).toHaveBeenCalledWith({
          where: { id: 'oauth-1' },
          data: expect.objectContaining({
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
            email: mockProfile.email,
            name: mockProfile.name,
          }),
        });
      });
    });

    describe('new OAuth user', () => {
      beforeEach(() => {
        (prisma.oAuthAccount.findUnique as jest.Mock).mockResolvedValue(null);
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      });

      it('should create new user for first-time OAuth login', async () => {
        (prisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
          const tx = {
            user: {
              create: jest.fn().mockResolvedValue(mockUser),
            },
            oAuthAccount: {
              create: jest.fn().mockResolvedValue({}),
            },
            refreshToken: {
              deleteMany: jest.fn().mockResolvedValue({}),
              create: jest.fn().mockResolvedValue({}),
            },
          };
          return fn(tx);
        });

        const result = await oauthService.handleOAuthCallback(
          mockCode,
          mockState,
          mockRequestMeta
        );

        expect(result.isNewUser).toBe(true);
        expect(result.user.email).toBe(mockProfile.email);
        expect(publishUserCreated).toHaveBeenCalled();
      });

      it('should set emailVerified from OAuth provider', async () => {
        (prisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
          const createdUser = { ...mockUser, emailVerified: mockProfile.emailVerified };
          const tx = {
            user: {
              create: jest.fn().mockResolvedValue(createdUser),
            },
            oAuthAccount: {
              create: jest.fn().mockResolvedValue({}),
            },
            refreshToken: {
              deleteMany: jest.fn().mockResolvedValue({}),
              create: jest.fn().mockResolvedValue({}),
            },
          };
          return fn(tx);
        });

        const result = await oauthService.handleOAuthCallback(
          mockCode,
          mockState,
          mockRequestMeta
        );

        expect(result.user.emailVerified).toBe(true);
      });

      it('should throw error if email is required but not provided', async () => {
        const profileWithoutEmail = { ...mockProfile, email: undefined };
        (auth0Client.handleCallback as jest.Mock).mockResolvedValue({
          profile: profileWithoutEmail,
        });

        await expect(
          oauthService.handleOAuthCallback(mockCode, mockState, mockRequestMeta)
        ).rejects.toThrow('Email address is required');
      });
    });

    describe('auto-linking existing email', () => {
      const existingUser = {
        ...mockUser,
        id: 'existing-user-id',
        emailVerified: true,
      };

      beforeEach(() => {
        (prisma.oAuthAccount.findUnique as jest.Mock).mockResolvedValue(null);
      });

      it('should auto-link OAuth when both emails are verified', async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);
        (prisma.oAuthAccount.create as jest.Mock).mockResolvedValue({});
        (prisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(prisma));

        const result = await oauthService.handleOAuthCallback(
          mockCode,
          mockState,
          mockRequestMeta
        );

        expect(result.user.id).toBe(existingUser.id);
        expect(result.isNewUser).toBe(false);
        expect(prisma.oAuthAccount.create).toHaveBeenCalled();
        expect(publishOAuthLinked).toHaveBeenCalled();
      });

      it('should throw error when existing email is not verified', async () => {
        const unverifiedUser = { ...existingUser, emailVerified: false };
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(unverifiedUser);

        await expect(
          oauthService.handleOAuthCallback(mockCode, mockState, mockRequestMeta)
        ).rejects.toThrow(ApiError);
        await expect(
          oauthService.handleOAuthCallback(mockCode, mockState, mockRequestMeta)
        ).rejects.toThrow('An account with this email already exists');
      });

      it('should throw error when OAuth email is not verified', async () => {
        const unverifiedProfile = { ...mockProfile, emailVerified: false };
        (auth0Client.handleCallback as jest.Mock).mockResolvedValue({
          profile: unverifiedProfile,
          accessToken: 'token',
        });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

        await expect(
          oauthService.handleOAuthCallback(mockCode, mockState, mockRequestMeta)
        ).rejects.toThrow(ApiError);
      });
    });

    describe('MFA handling', () => {
      beforeEach(() => {
        (prisma.oAuthAccount.findUnique as jest.Mock).mockResolvedValue({
          id: 'oauth-1',
          userId: mockUser.id,
          user: { ...mockUser, mfaEnabled: true },
        });
        (prisma.oAuthAccount.update as jest.Mock).mockResolvedValue({});
      });

      it('should return mfaRequired flag when user has MFA enabled', async () => {
        (isMfaRequired as jest.Mock).mockResolvedValue(true);

        const result = await oauthService.handleOAuthCallback(
          mockCode,
          mockState,
          mockRequestMeta
        );

        expect(result.mfaRequired).toBe(true);
        expect(result.mfaToken).toBeTruthy();
        expect(result.accessToken).toBe('');
        expect(result.refreshToken).toBe('');
      });

      it('should not require MFA when user has MFA disabled', async () => {
        (isMfaRequired as jest.Mock).mockResolvedValue(false);
        (prisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(prisma));

        const result = await oauthService.handleOAuthCallback(
          mockCode,
          mockState,
          mockRequestMeta
        );

        expect(result.mfaRequired).toBeFalsy();
        expect(result.accessToken).toBe(mockTokens.accessToken);
      });
    });

    describe('account linking flow', () => {
      const existingUser = {
        ...mockUser,
        id: 'linking-user-id',
        hasPassword: true,
      };

      beforeEach(() => {
        (cache.get as jest.Mock).mockResolvedValue({
          provider: 'github',
          returnUrl: '/profile',
          createdAt: new Date().toISOString(),
          userId: existingUser.id, // This triggers account linking
        });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);
      });

      it('should link OAuth account to existing user', async () => {
        (prisma.oAuthAccount.findUnique as jest.Mock).mockResolvedValue(null);
        (prisma.oAuthAccount.findFirst as jest.Mock).mockResolvedValue(null);
        (prisma.oAuthAccount.create as jest.Mock).mockResolvedValue({});
        (cache.invalidateByTag as jest.Mock).mockResolvedValue(undefined);
        (prisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(prisma));

        const result = await oauthService.handleOAuthCallback(
          mockCode,
          mockState,
          mockRequestMeta
        );

        expect(result.user.id).toBe(existingUser.id);
        expect(prisma.oAuthAccount.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            userId: existingUser.id,
            provider: mockProfile.provider,
          }),
        });
        expect(publishOAuthLinked).toHaveBeenCalled();
        expect(cache.invalidateByTag).toHaveBeenCalled();
      });

      it('should throw error if account is already linked to same user', async () => {
        (prisma.oAuthAccount.findUnique as jest.Mock).mockResolvedValue({
          id: 'existing-oauth',
          userId: existingUser.id,
        });

        await expect(
          oauthService.handleOAuthCallback(mockCode, mockState, mockRequestMeta)
        ).rejects.toThrow('account is already linked');
      });

      it('should throw error if account is linked to another user', async () => {
        (prisma.oAuthAccount.findUnique as jest.Mock).mockResolvedValue({
          id: 'existing-oauth',
          userId: 'different-user-id',
        });

        await expect(
          oauthService.handleOAuthCallback(mockCode, mockState, mockRequestMeta)
        ).rejects.toThrow('already linked to a different user');
      });

      it('should throw error if user already has this provider linked', async () => {
        (prisma.oAuthAccount.findUnique as jest.Mock).mockResolvedValue(null);
        (prisma.oAuthAccount.findFirst as jest.Mock).mockResolvedValue({
          id: 'different-account',
          provider: mockProfile.provider,
        });

        await expect(
          oauthService.handleOAuthCallback(mockCode, mockState, mockRequestMeta)
        ).rejects.toThrow('already have a');
      });

      it('should throw error if user not found for linking', async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

        await expect(
          oauthService.handleOAuthCallback(mockCode, mockState, mockRequestMeta)
        ).rejects.toThrow('User not found');
      });
    });

    it('should publish login event on successful OAuth login', async () => {
      (prisma.oAuthAccount.findUnique as jest.Mock).mockResolvedValue({
        id: 'oauth-1',
        userId: mockUser.id,
        user: mockUser,
      });
      (prisma.oAuthAccount.update as jest.Mock).mockResolvedValue({});
      (prisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(prisma));

      await oauthService.handleOAuthCallback(mockCode, mockState, mockRequestMeta);

      expect(publishUserLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          ipAddress: mockRequestMeta.ip,
        })
      );
    });
  });

  describe('unlinkOAuthAccount', () => {
    const mockUserId = 'user-123';
    const mockUserWithPassword = {
      id: mockUserId,
      email: 'test@example.com',
      hasPassword: true,
      oauthAccounts: [
        { id: 'oauth-1', provider: 'google' },
        { id: 'oauth-2', provider: 'github' },
      ],
    };

    const mockUserWithoutPassword = {
      ...mockUserWithPassword,
      hasPassword: false,
    };

    it('should unlink OAuth account when user has password', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUserWithPassword);
      (prisma.oAuthAccount.delete as jest.Mock).mockResolvedValue({});
      (cache.invalidateByTag as jest.Mock).mockResolvedValue(undefined);

      await oauthService.unlinkOAuthAccount(mockUserId, 'google');

      expect(prisma.oAuthAccount.delete).toHaveBeenCalledWith({
        where: { id: 'oauth-1' },
      });
      expect(publishOAuthUnlinked).toHaveBeenCalled();
      expect(cache.invalidateByTag).toHaveBeenCalled();
    });

    it('should unlink OAuth account when user has other OAuth accounts', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUserWithoutPassword);
      (prisma.oAuthAccount.delete as jest.Mock).mockResolvedValue({});
      (cache.invalidateByTag as jest.Mock).mockResolvedValue(undefined);

      await oauthService.unlinkOAuthAccount(mockUserId, 'google');

      expect(prisma.oAuthAccount.delete).toHaveBeenCalledWith({
        where: { id: 'oauth-1' },
      });
    });

    it('should throw error when unlinking last auth method', async () => {
      const userWithOneOAuth = {
        ...mockUserWithoutPassword,
        oauthAccounts: [{ id: 'oauth-1', provider: 'google' }],
      };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithOneOAuth);

      await expect(oauthService.unlinkOAuthAccount(mockUserId, 'google')).rejects.toThrow(
        ApiError
      );
      await expect(oauthService.unlinkOAuthAccount(mockUserId, 'google')).rejects.toThrow(
        'Cannot unlink this account'
      );
    });

    it('should throw error if OAuth account not linked', async () => {
      const userNoOAuth = {
        ...mockUserWithPassword,
        oauthAccounts: [],
      };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userNoOAuth);

      await expect(oauthService.unlinkOAuthAccount(mockUserId, 'google')).rejects.toThrow(
        'No google account linked'
      );
    });

    it('should throw error if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(oauthService.unlinkOAuthAccount(mockUserId, 'google')).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('getLinkedOAuthAccounts', () => {
    const mockUserId = 'user-123';
    const mockAccounts = [
      {
        id: 'oauth-1',
        provider: 'google',
        email: 'test@gmail.com',
        name: 'Test User',
        createdAt: new Date('2024-01-01'),
      },
      {
        id: 'oauth-2',
        provider: 'github',
        email: 'test@github.com',
        name: 'Test User GitHub',
        createdAt: new Date('2024-01-15'),
      },
    ];

    it('should return list of linked OAuth accounts', async () => {
      (prisma.oAuthAccount.findMany as jest.Mock).mockResolvedValue(mockAccounts);

      const result = await oauthService.getLinkedOAuthAccounts(mockUserId);

      expect(prisma.oAuthAccount.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        select: {
          id: true,
          provider: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });
      expect(result).toHaveLength(2);
      expect(result[0].provider).toBe('google');
      expect(result[1].provider).toBe('github');
      expect(result[0]).toHaveProperty('linkedAt');
    });

    it('should return empty array when no accounts linked', async () => {
      (prisma.oAuthAccount.findMany as jest.Mock).mockResolvedValue([]);

      const result = await oauthService.getLinkedOAuthAccounts(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('getSupportedProviders', () => {
    it('should return list of supported providers', () => {
      const providers = oauthService.getSupportedProviders();

      expect(providers).toEqual(SUPPORTED_PROVIDERS);
      expect(providers).toContain('google');
      expect(providers).toContain('github');
    });

    it('should return a copy of the providers array', () => {
      const providers1 = oauthService.getSupportedProviders();
      const providers2 = oauthService.getSupportedProviders();

      expect(providers1).not.toBe(providers2);
    });
  });
});
