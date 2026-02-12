/**
 * OAuth Controller - Unit Tests
 *
 * Tests for OAuth controller HTTP handlers including:
 * - Initiate OAuth flow (redirect to Auth0)
 * - Handle OAuth callback
 * - Get supported providers
 * - Get linked accounts
 * - Link OAuth account
 * - Unlink OAuth account
 */

import { Request, Response, NextFunction } from 'express';
import { Socket } from 'net';
import * as oauthController from './oauth.controller';
import * as oauthService from '../services/oauth.service';
import { ApiError } from '../middleware/errorHandler';
import { UserRole } from 'shared-types';

/**
 * Type for authenticated user in request
 */
interface RequestUser {
  userId: string;
}

/**
 * Mock request interface for testing Express handlers
 * Provides type-safe mock properties matching Express Request
 */
interface MockRequest {
  params: Record<string, string>;
  query: Record<string, string | undefined>;
  body: Record<string, unknown>;
  user: RequestUser | undefined;
  ip: string;
  socket: Socket;
  get: jest.Mock;
}

// Mock the OAuth service
jest.mock('../services/oauth.service', () => ({
  initiateOAuthFlow: jest.fn(),
  handleOAuthCallback: jest.fn(),
  getSupportedProviders: jest.fn(),
  getLinkedOAuthAccounts: jest.fn(),
  unlinkOAuthAccount: jest.fn(),
}));

// Mock validators
jest.mock('../validators/oauth.validators', () => ({
  oauthInitiateSchema: {
    parse: jest.fn((data) => data),
  },
  oauthCallbackSchema: {
    parse: jest.fn((data) => data),
  },
  oauthLinkSchema: {
    parse: jest.fn((data) => data),
  },
  oauthUnlinkSchema: {
    parse: jest.fn((data) => data),
  },
}));

describe('OAuthController', () => {
  let mockReq: MockRequest;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a minimal mock socket that satisfies the Socket type
    const mockSocket = { remoteAddress: '127.0.0.1' } as Socket;

    mockReq = {
      params: {},
      query: {},
      body: {},
      user: undefined,
      ip: '127.0.0.1',
      socket: mockSocket,
      get: jest.fn().mockReturnValue('Test Browser/1.0'),
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      redirect: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(), // POC-3 Phase 7.1: HttpOnly cookie support
    };

    mockNext = jest.fn();
  });

  describe('initiateOAuth', () => {
    const mockAuthResult = {
      authorizationUrl: 'https://auth0.com/authorize?...',
      state: 'mock-state-123',
    };

    beforeEach(() => {
      (oauthService.initiateOAuthFlow as jest.Mock).mockResolvedValue(mockAuthResult);
    });

    it('should redirect to authorization URL for valid provider', async () => {
      mockReq.params = { provider: 'google' };
      mockReq.query = { returnUrl: '/dashboard' };

      await oauthController.initiateOAuth(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(oauthService.initiateOAuthFlow).toHaveBeenCalledWith('google', '/dashboard');
      expect(mockRes.redirect).toHaveBeenCalledWith(302, mockAuthResult.authorizationUrl);
    });

    it('should use default returnUrl when not provided', async () => {
      mockReq.params = { provider: 'github' };
      mockReq.query = {};

      await oauthController.initiateOAuth(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(oauthService.initiateOAuthFlow).toHaveBeenCalledWith('github', '/');
    });

    it('should call next with error on failure', async () => {
      mockReq.params = { provider: 'invalid' };
      const error = new ApiError(400, 'INVALID_PROVIDER', 'Unsupported provider');
      (oauthService.initiateOAuthFlow as jest.Mock).mockRejectedValue(error);

      await oauthController.initiateOAuth(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('handleOAuthCallback', () => {
    const mockCallbackResult = {
      user: {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.CUSTOMER,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: '15m',
      isNewUser: false,
      linkedProvider: 'google',
    };

    beforeEach(() => {
      (oauthService.handleOAuthCallback as jest.Mock).mockResolvedValue(mockCallbackResult);
    });

    it('should redirect to success page with tokens on successful callback', async () => {
      mockReq.query = {
        code: 'auth-code',
        state: 'state-123',
      };

      await oauthController.handleOAuthCallback(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(oauthService.handleOAuthCallback).toHaveBeenCalledWith(
        'auth-code',
        'state-123',
        expect.objectContaining({
          ip: '127.0.0.1',
          userAgent: 'Test Browser/1.0',
        })
      );
      expect(mockRes.redirect).toHaveBeenCalledWith(
        302,
        expect.stringContaining('/oauth/success#')
      );
    });

    it('should include isNewUser in redirect URL for new users', async () => {
      const newUserResult = { ...mockCallbackResult, isNewUser: true };
      (oauthService.handleOAuthCallback as jest.Mock).mockResolvedValue(newUserResult);
      mockReq.query = { code: 'auth-code', state: 'state-123' };

      await oauthController.handleOAuthCallback(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.redirect).toHaveBeenCalledWith(
        302,
        expect.stringContaining('isNewUser=true')
      );
    });

    it('should redirect to MFA page when MFA is required', async () => {
      const mfaResult = {
        ...mockCallbackResult,
        mfaRequired: true,
        mfaToken: 'mfa-token-123',
        accessToken: '',
        refreshToken: '',
      };
      (oauthService.handleOAuthCallback as jest.Mock).mockResolvedValue(mfaResult);
      mockReq.query = { code: 'auth-code', state: 'state-123' };

      await oauthController.handleOAuthCallback(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.redirect).toHaveBeenCalledWith(
        302,
        expect.stringContaining('/signin?mfaToken=mfa-token-123')
      );
    });

    it('should redirect to signin with error when OAuth provider returns error', async () => {
      mockReq.query = {
        error: 'access_denied',
        error_description: 'User cancelled the OAuth flow',
      };

      await oauthController.handleOAuthCallback(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(oauthService.handleOAuthCallback).not.toHaveBeenCalled();
      expect(mockRes.redirect).toHaveBeenCalledWith(
        302,
        expect.stringContaining('/signin?error=oauth_failed')
      );
    });

    it('should redirect to signin with error on callback failure', async () => {
      mockReq.query = { code: 'auth-code', state: 'state-123' };
      const error = new Error('Token exchange failed');
      (oauthService.handleOAuthCallback as jest.Mock).mockRejectedValue(error);

      await oauthController.handleOAuthCallback(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.redirect).toHaveBeenCalledWith(
        302,
        expect.stringContaining('/signin?error=oauth_failed')
      );
    });
  });

  describe('getSupportedProviders', () => {
    it('should return list of supported providers', async () => {
      const mockProviders = ['google', 'github', 'facebook', 'linkedin', 'twitter'];
      (oauthService.getSupportedProviders as jest.Mock).mockReturnValue(mockProviders);

      await oauthController.getSupportedProviders(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { providers: mockProviders },
      });
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Failed to get providers');
      (oauthService.getSupportedProviders as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await oauthController.getSupportedProviders(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getLinkedAccounts', () => {
    const mockAccounts = [
      {
        id: 'oauth-1',
        provider: 'google',
        email: 'test@gmail.com',
        name: 'Test User',
        linkedAt: new Date('2024-01-01'),
      },
      {
        id: 'oauth-2',
        provider: 'github',
        email: 'test@github.com',
        name: 'Test User',
        linkedAt: new Date('2024-01-15'),
      },
    ];

    beforeEach(() => {
      (oauthService.getLinkedOAuthAccounts as jest.Mock).mockResolvedValue(mockAccounts);
    });

    it('should return linked accounts for authenticated user', async () => {
      mockReq.user = { userId: 'user-123' };

      await oauthController.getLinkedAccounts(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(oauthService.getLinkedOAuthAccounts).toHaveBeenCalledWith('user-123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { accounts: mockAccounts },
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockReq.user = undefined;

      await oauthController.getLinkedAccounts(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    });

    it('should call next with error on failure', async () => {
      mockReq.user = { userId: 'user-123' };
      const error = new Error('Database error');
      (oauthService.getLinkedOAuthAccounts as jest.Mock).mockRejectedValue(error);

      await oauthController.getLinkedAccounts(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('linkOAuthAccount', () => {
    const mockAuthResult = {
      authorizationUrl: 'https://auth0.com/authorize?...',
      state: 'mock-state-123',
    };

    beforeEach(() => {
      (oauthService.initiateOAuthFlow as jest.Mock).mockResolvedValue(mockAuthResult);
    });

    it('should redirect to OAuth provider for authenticated user', async () => {
      mockReq.user = { userId: 'user-123' };
      mockReq.params = { provider: 'github' };

      await oauthController.linkOAuthAccount(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(oauthService.initiateOAuthFlow).toHaveBeenCalledWith(
        'github',
        '/profile/settings',
        'user-123'
      );
      expect(mockRes.redirect).toHaveBeenCalledWith(302, mockAuthResult.authorizationUrl);
    });

    it('should return 401 when user is not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.params = { provider: 'github' };

      await oauthController.linkOAuthAccount(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    });

    it('should call next with error on failure', async () => {
      mockReq.user = { userId: 'user-123' };
      mockReq.params = { provider: 'invalid' };
      const error = new ApiError(400, 'INVALID_PROVIDER', 'Unsupported provider');
      (oauthService.initiateOAuthFlow as jest.Mock).mockRejectedValue(error);

      await oauthController.linkOAuthAccount(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('unlinkOAuthAccount', () => {
    beforeEach(() => {
      (oauthService.unlinkOAuthAccount as jest.Mock).mockResolvedValue(undefined);
    });

    it('should unlink OAuth account for authenticated user', async () => {
      mockReq.user = { userId: 'user-123' };
      mockReq.params = { provider: 'google' };

      await oauthController.unlinkOAuthAccount(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(oauthService.unlinkOAuthAccount).toHaveBeenCalledWith('user-123', 'google');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'google account unlinked successfully',
        },
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.params = { provider: 'google' };

      await oauthController.unlinkOAuthAccount(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(oauthService.unlinkOAuthAccount).not.toHaveBeenCalled();
    });

    it('should call next with error when unlinking fails', async () => {
      mockReq.user = { userId: 'user-123' };
      mockReq.params = { provider: 'google' };
      const error = new ApiError(400, 'CANNOT_UNLINK', 'Cannot unlink last auth method');
      (oauthService.unlinkOAuthAccount as jest.Mock).mockRejectedValue(error);

      await oauthController.unlinkOAuthAccount(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
