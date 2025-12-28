/**
 * Auth Controller - Integration Tests
 */

import type { Request, Response, _NextFunction } from 'express';
import * as authController from './auth.controller';
import * as authService from '../services/auth.service';
import { ApiError as _ApiError } from '../middleware/errorHandler';
import { ZodError } from 'zod';

// Mock auth service
jest.mock('../services/auth.service');

// Mock validators
jest.mock('../validators/auth.validators', () => ({
  registerSchema: {
    parse: jest.fn(data => data),
  },
  loginSchema: {
    parse: jest.fn(data => data),
  },
  refreshTokenSchema: {
    parse: jest.fn(data => data),
  },
  changePasswordSchema: {
    parse: jest.fn(data => data),
  },
}));

describe('AuthController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      body: {},
      user: undefined,
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      const mockRegisterData = {
        email: 'test@example.com',
        password: 'SecurePassword123!@#',
        name: 'Test User',
      };
      const mockResult = {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: '15m',
      };

      mockRequest.body = mockRegisterData;
      (authService.register as jest.Mock).mockResolvedValue(mockResult);

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const { registerSchema } = require('../validators/auth.validators');
      (registerSchema.parse as jest.Mock).mockImplementation(() => {
        throw new ZodError([]);
      });

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'SecurePassword123!@#',
        name: 'Test User',
      };
      (authService.register as jest.Mock).mockRejectedValue(
        new ApiError(409, 'EMAIL_EXISTS', 'Email already exists')
      );

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const mockLoginData = {
        email: 'test@example.com',
        password: 'SecurePassword123!@#',
      };
      const mockResult = {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: '15m',
      };

      mockRequest.body = mockLoginData;
      (authService.login as jest.Mock).mockResolvedValue(mockResult);

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      });
    });

    it('should handle invalid credentials', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'wrong-password',
      };
      (authService.login as jest.Mock).mockRejectedValue(
        new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password')
      );

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should refresh access token successfully', async () => {
      const mockRefreshData = {
        refreshToken: 'refresh-token',
      };
      const mockResult = {
        accessToken: 'new-access-token',
        expiresIn: '15m',
      };

      mockRequest.body = mockRefreshData;
      (authService.refreshAccessToken as jest.Mock).mockResolvedValue(
        mockResult
      );

      await authController.refresh(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      });
    });

    it('should handle invalid refresh token', async () => {
      mockRequest.body = {
        refreshToken: 'invalid-token',
      };
      (authService.refreshAccessToken as jest.Mock).mockRejectedValue(
        new ApiError(401, 'INVALID_TOKEN', 'Invalid or expired refresh token')
      );

      await authController.refresh(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      mockRequest.user = {
        userId: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
      };
      mockRequest.body = {
        refreshToken: 'refresh-token',
      };
      (authService.logout as jest.Mock).mockResolvedValue(undefined);

      await authController.logout(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(authService.logout).toHaveBeenCalledWith(
        'user-1',
        'refresh-token'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'Logged out successfully',
        },
      });
    });

    it('should return 401 if user not authenticated', async () => {
      mockRequest.user = undefined;

      await authController.logout(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      expect(authService.logout).not.toHaveBeenCalled();
    });
  });

  describe('getMe', () => {
    it('should return current user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
      };

      mockRequest.user = {
        userId: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
      };
      (authService.getUserById as jest.Mock).mockResolvedValue(mockUser);

      await authController.getMe(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(authService.getUserById).toHaveBeenCalledWith('user-1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser,
      });
    });

    it('should return 401 if user not authenticated', async () => {
      mockRequest.user = undefined;

      await authController.getMe(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      mockRequest.user = {
        userId: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
      };
      mockRequest.body = {
        currentPassword: 'CurrentPassword123!@#',
        newPassword: 'NewPassword123!@#',
      };
      (authService.changePassword as jest.Mock).mockResolvedValue(undefined);

      await authController.changePassword(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(authService.changePassword).toHaveBeenCalledWith(
        'user-1',
        'CurrentPassword123!@#',
        'NewPassword123!@#'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'Password changed successfully',
        },
      });
    });

    it('should return 401 if user not authenticated', async () => {
      mockRequest.user = undefined;

      await authController.changePassword(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(authService.changePassword).not.toHaveBeenCalled();
    });

    it('should handle incorrect current password', async () => {
      mockRequest.user = {
        userId: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
      };
      mockRequest.body = {
        currentPassword: 'WrongPassword123!@#',
        newPassword: 'NewPassword123!@#',
      };
      (authService.changePassword as jest.Mock).mockRejectedValue(
        new ApiError(401, 'INVALID_PASSWORD', 'Current password is incorrect')
      );

      await authController.changePassword(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
