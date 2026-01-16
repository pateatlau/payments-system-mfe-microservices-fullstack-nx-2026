/**
 * Admin Controller - Integration Tests
 *
 * Updated to test new UUID validation behavior via Zod schemas.
 * Invalid/missing UUIDs now trigger Zod validation errors passed to next().
 */

import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import {
  listUsers,
  getUserById,
  updateUser,
  updateUserRole,
  updateUserStatus,
} from './admin.controller';
import { adminService } from '../services/admin.service';

// Mock admin service
jest.mock('../services/admin.service');

// Mock audit service
jest.mock('../services/audit.service', () => ({
  createAuditLog: jest.fn().mockResolvedValue(null),
  getRequestMetadata: jest.fn().mockReturnValue({ ipAddress: '127.0.0.1', userAgent: 'jest' }),
  AuditAction: {
    USER_UPDATED: 'USER_UPDATED',
    USER_ROLE_CHANGED: 'USER_ROLE_CHANGED',
    USER_STATUS_CHANGED: 'USER_STATUS_CHANGED',
  },
  ResourceType: {
    USER: 'user',
  },
}));

// Use real Zod validators to test UUID validation
// The validators module is NOT mocked - we test real validation behavior

describe('AdminController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      user: {
        userId: 'admin-1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN',
      },
      query: {},
      params: {},
      body: {},
      ip: '127.0.0.1',
      headers: { 'user-agent': 'jest-test' },
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('listUsers', () => {
    it('should return paginated users', async () => {
      const mockResult = {
        users: [
          {
            id: 'user-1',
            email: 'user@example.com',
            name: 'User Name',
            role: 'CUSTOMER',
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      (adminService.listUsers as jest.Mock).mockResolvedValue(mockResult);

      mockRequest.query = {
        page: '1',
        limit: '10',
      };

      await listUsers(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      });
      expect(adminService.listUsers).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should handle service errors', async () => {
      const serviceError = new Error('Database error');
      (adminService.listUsers as jest.Mock).mockRejectedValue(serviceError);

      await listUsers(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('getUserById', () => {
    it('should return user by ID with valid UUID', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        name: 'User Name',
        role: 'CUSTOMER',
        _count: {
          sentPayments: 5,
          receivedPayments: 3,
        },
      };

      (adminService.getUserById as jest.Mock).mockResolvedValue(mockUser);

      mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };

      await getUserById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser,
      });
      expect(adminService.getUserById).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000'
      );
    });

    it('should pass ZodError to next for missing ID', async () => {
      mockRequest.params = {};

      await getUserById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Zod validation error is passed to next middleware
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ZodError);
    });

    it('should pass ZodError to next for invalid UUID format', async () => {
      mockRequest.params = { id: 'not-a-valid-uuid' };

      await getUserById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Zod validation error is passed to next middleware
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ZodError);
      expect(error.errors[0].message).toBe('Invalid ID format');
    });

    it('should handle service errors', async () => {
      const serviceError = new Error('User not found');
      (adminService.getUserById as jest.Mock).mockRejectedValue(serviceError);

      mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };

      await getUserById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('updateUser', () => {
    it('should update user with valid UUID', async () => {
      const mockUpdatedUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        name: 'Updated Name',
        role: 'CUSTOMER',
      };

      (adminService.updateUser as jest.Mock).mockResolvedValue(mockUpdatedUser);

      mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
      mockRequest.body = { name: 'Updated Name' };

      await updateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedUser,
      });
      expect(adminService.updateUser).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        expect.any(Object)
      );
    });

    it('should pass ZodError to next for missing ID', async () => {
      mockRequest.params = {};
      mockRequest.body = { name: 'Test' };

      await updateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ZodError);
    });

    it('should pass ZodError to next for invalid UUID format', async () => {
      mockRequest.params = { id: 'invalid-uuid' };
      mockRequest.body = { name: 'Test' };

      await updateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ZodError);
    });
  });

  describe('updateUserRole', () => {
    it('should update user role with valid UUID', async () => {
      const mockUpdatedUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        name: 'User Name',
        role: 'VENDOR',
      };

      (adminService.updateUserRole as jest.Mock).mockResolvedValue(
        mockUpdatedUser
      );

      mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
      mockRequest.body = { role: 'VENDOR' };

      await updateUserRole(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedUser,
      });
      expect(adminService.updateUserRole).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        expect.any(Object)
      );
    });

    it('should pass ZodError to next for missing ID', async () => {
      mockRequest.params = {};
      mockRequest.body = { role: 'VENDOR' };

      await updateUserRole(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ZodError);
    });

    it('should pass ZodError to next for invalid role', async () => {
      mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
      mockRequest.body = { role: 'INVALID_ROLE' };

      await updateUserRole(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ZodError);
    });
  });

  describe('updateUserStatus', () => {
    it('should update user status with valid UUID', async () => {
      const mockUpdatedUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        name: 'User Name',
        role: 'CUSTOMER',
      };

      (adminService.updateUserStatus as jest.Mock).mockResolvedValue(
        mockUpdatedUser
      );

      mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
      mockRequest.body = { isActive: false };

      await updateUserStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedUser,
      });
      expect(adminService.updateUserStatus).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        expect.any(Object)
      );
    });

    it('should pass ZodError to next for missing ID', async () => {
      mockRequest.params = {};
      mockRequest.body = { isActive: false };

      await updateUserStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ZodError);
    });

    it('should pass ZodError to next for invalid isActive type', async () => {
      mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
      mockRequest.body = { isActive: 'not-a-boolean' };

      await updateUserStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ZodError);
    });
  });
});
