/**
 * Auth Service - Unit Tests
 */

import * as authService from './auth.service';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';
import { generateTokenPair, verifyRefreshToken } from '../utils/token';
import { ApiError as _ApiError } from '../middleware/errorHandler';
import { UserRole } from 'shared-types';

// Mock dependencies
jest.mock('db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    // userProfile removed - now in profile service (POC-3)
    // userProfile: {
      create: jest.fn(),
    },
    refreshToken: {
      deleteMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('../utils/token', () => ({
  generateTokenPair: jest.fn(),
  verifyRefreshToken: jest.fn(),
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const mockRegisterData = {
      email: 'test@example.com',
      password: 'SecurePassword123!@#',
      name: 'Test User',
      role: UserRole.CUSTOMER,
    };

    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: UserRole.CUSTOMER,
      passwordHash: 'hashed-password',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    const mockTokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: '15m',
    };

    it('should register a new user successfully', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      // userProfile.create removed - now in profile service (POC-3)
      // (prisma.userProfile.create as jest.Mock).mockResolvedValue({});
      (generateTokenPair as jest.Mock).mockReturnValue(mockTokens);
      (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({});
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

      const result = await authService.register(mockRegisterData);

      expect(result).toMatchObject({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
        },
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
        expiresIn: mockTokens.expiresIn,
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockRegisterData.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(
        mockRegisterData.password,
        expect.any(Number)
      );
      expect(prisma.user.create).toHaveBeenCalled();
      // userProfile.create removed - now in profile service (POC-3)
      // expect(prisma.userProfile.create).toHaveBeenCalled();
      expect(generateTokenPair).toHaveBeenCalled();
    });

    it('should throw error if email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(authService.register(mockRegisterData)).rejects.toThrow(
        ApiError
      );
      await expect(authService.register(mockRegisterData)).rejects.toThrow(
        'Email address already in use'
      );

      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should delete old refresh tokens before creating new one', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      // userProfile.create removed - now in profile service (POC-3)
      // (prisma.userProfile.create as jest.Mock).mockResolvedValue({});
      (generateTokenPair as jest.Mock).mockReturnValue(mockTokens);
      (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({});
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

      await authService.register(mockRegisterData);

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
      });
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const mockLoginData = {
      email: 'test@example.com',
      password: 'SecurePassword123!@#',
    };

    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: UserRole.CUSTOMER,
      passwordHash: 'hashed-password',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    const mockTokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: '15m',
    };

    it('should login user with valid credentials', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (generateTokenPair as jest.Mock).mockReturnValue(mockTokens);
      (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({});
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

      const result = await authService.login(mockLoginData);

      expect(result).toMatchObject({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
        },
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockLoginData.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        mockLoginData.password,
        mockUser.passwordHash
      );
    });

    it('should throw error if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(authService.login(mockLoginData)).rejects.toThrow(ApiError);
      await expect(authService.login(mockLoginData)).rejects.toThrow(
        'Invalid email or password'
      );

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw error if password is incorrect', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(mockLoginData)).rejects.toThrow(ApiError);
      await expect(authService.login(mockLoginData)).rejects.toThrow(
        'Invalid email or password'
      );

      expect(generateTokenPair).not.toHaveBeenCalled();
    });
  });

  describe('refreshAccessToken', () => {
    const mockRefreshToken = 'refresh-token';
    const mockPayload = {
      userId: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: UserRole.CUSTOMER,
    };

    const mockStoredToken = {
      id: 'token-1',
      userId: 'user-1',
      token: mockRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    };

    const mockTokens = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresIn: '15m',
    };

    it('should refresh access token with valid refresh token', async () => {
      (verifyRefreshToken as jest.Mock).mockReturnValue(mockPayload);
      (prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue(
        mockStoredToken
      );
      (generateTokenPair as jest.Mock).mockReturnValue(mockTokens);

      const result = await authService.refreshAccessToken(mockRefreshToken);

      expect(result).toEqual({
        accessToken: mockTokens.accessToken,
        expiresIn: mockTokens.expiresIn,
      });

      expect(verifyRefreshToken).toHaveBeenCalledWith(mockRefreshToken);
      expect(prisma.refreshToken.findFirst).toHaveBeenCalledWith({
        where: {
          token: mockRefreshToken,
          userId: mockPayload.userId,
        },
      });
    });

    it('should throw error if refresh token is invalid', async () => {
      (verifyRefreshToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(
        authService.refreshAccessToken(mockRefreshToken)
      ).rejects.toThrow(ApiError);
      await expect(
        authService.refreshAccessToken(mockRefreshToken)
      ).rejects.toThrow('Invalid or expired refresh token');
    });

    it('should throw error if refresh token not found in database', async () => {
      (verifyRefreshToken as jest.Mock).mockReturnValue(mockPayload);
      (prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.refreshAccessToken(mockRefreshToken)
      ).rejects.toThrow(ApiError);
      await expect(
        authService.refreshAccessToken(mockRefreshToken)
      ).rejects.toThrow('Refresh token not found');
    });

    it('should throw error if refresh token is expired', async () => {
      const expiredToken = {
        ...mockStoredToken,
        expiresAt: new Date(Date.now() - 1000), // Expired
      };

      (verifyRefreshToken as jest.Mock).mockReturnValue(mockPayload);
      (prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue(
        expiredToken
      );
      (prisma.refreshToken.delete as jest.Mock).mockResolvedValue({});

      await expect(
        authService.refreshAccessToken(mockRefreshToken)
      ).rejects.toThrow(ApiError);
      await expect(
        authService.refreshAccessToken(mockRefreshToken)
      ).rejects.toThrow('Refresh token expired');

      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({
        where: { id: expiredToken.id },
      });
    });
  });

  describe('logout', () => {
    const mockUserId = 'user-1';
    const mockRefreshToken = 'refresh-token';

    it('should delete specific refresh token when provided', async () => {
      (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({});

      await authService.logout(mockUserId, mockRefreshToken);

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          token: mockRefreshToken,
        },
      });
    });

    it('should delete all refresh tokens when token not provided', async () => {
      (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({});

      await authService.logout(mockUserId);

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
    });
  });

  describe('getUserById', () => {
    const mockUserId = 'user-1';
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: UserRole.CUSTOMER,
      passwordHash: 'hashed-password',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    it('should return user by ID', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.getUserById(mockUserId);

      expect(result).toMatchObject({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
      });
    });

    it('should throw error if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(authService.getUserById(mockUserId)).rejects.toThrow(
        ApiError
      );
      await expect(authService.getUserById(mockUserId)).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('changePassword', () => {
    const mockUserId = 'user-1';
    const mockCurrentPassword = 'CurrentPassword123!@#';
    const mockNewPassword = 'NewPassword123!@#';
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: UserRole.CUSTOMER,
      passwordHash: 'hashed-current-password',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    it('should change password successfully', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-new-password');
      (prisma.user.update as jest.Mock).mockResolvedValue({});
      (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({});

      await authService.changePassword(
        mockUserId,
        mockCurrentPassword,
        mockNewPassword
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        mockCurrentPassword,
        mockUser.passwordHash
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(
        mockNewPassword,
        expect.any(Number)
      );
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { passwordHash: 'hashed-new-password' },
      });
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
    });

    it('should throw error if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.changePassword(
          mockUserId,
          mockCurrentPassword,
          mockNewPassword
        )
      ).rejects.toThrow(ApiError);
      await expect(
        authService.changePassword(
          mockUserId,
          mockCurrentPassword,
          mockNewPassword
        )
      ).rejects.toThrow('User not found');
    });

    it('should throw error if current password is incorrect', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.changePassword(
          mockUserId,
          mockCurrentPassword,
          mockNewPassword
        )
      ).rejects.toThrow(ApiError);
      await expect(
        authService.changePassword(
          mockUserId,
          mockCurrentPassword,
          mockNewPassword
        )
      ).rejects.toThrow('Current password is incorrect');

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should invalidate all refresh tokens after password change', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-new-password');
      (prisma.user.update as jest.Mock).mockResolvedValue({});
      (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({});

      await authService.changePassword(
        mockUserId,
        mockCurrentPassword,
        mockNewPassword
      );

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
    });
  });
});
