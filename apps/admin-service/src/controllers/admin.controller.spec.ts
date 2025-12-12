/**
 * Admin Controller - Integration Tests
 */

import type { Request, Response } from 'express';
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

// Mock Zod validators
jest.mock('../validators/admin.validators', () => ({
  listUsersSchema: {
    parse: jest.fn(data => data),
  },
  updateUserSchema: {
    parse: jest.fn(data => data),
  },
  updateUserRoleSchema: {
    parse: jest.fn(data => data),
  },
  updateUserStatusSchema: {
    parse: jest.fn(data => data),
  },
}));

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
    it('should return user by ID', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'User Name',
        role: 'CUSTOMER',
        _count: {
          sentPayments: 5,
          receivedPayments: 3,
        },
      };

      (adminService.getUserById as jest.Mock).mockResolvedValue(mockUser);

      mockRequest.params = { id: 'user-1' };

      await getUserById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser,
      });
      expect(adminService.getUserById).toHaveBeenCalledWith('user-1');
    });

    it('should return 400 for missing ID', async () => {
      mockRequest.params = {};

      await getUserById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'User ID is required',
        },
      });
    });

    it('should handle service errors', async () => {
      const serviceError = new Error('User not found');
      (adminService.getUserById as jest.Mock).mockRejectedValue(serviceError);

      mockRequest.params = { id: 'user-1' };

      await getUserById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('updateUser', () => {
    it('should update user', async () => {
      const mockUpdatedUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Updated Name',
        role: 'CUSTOMER',
      };

      (adminService.updateUser as jest.Mock).mockResolvedValue(mockUpdatedUser);

      mockRequest.params = { id: 'user-1' };
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
        'user-1',
        expect.any(Object)
      );
    });

    it('should return 400 for missing ID', async () => {
      mockRequest.params = {};
      mockRequest.body = { name: 'Test' };

      await updateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'User ID is required',
        },
      });
    });
  });

  describe('updateUserRole', () => {
    it('should update user role', async () => {
      const mockUpdatedUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'User Name',
        role: 'VENDOR',
      };

      (adminService.updateUserRole as jest.Mock).mockResolvedValue(
        mockUpdatedUser
      );

      mockRequest.params = { id: 'user-1' };
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
        'user-1',
        expect.any(Object)
      );
    });

    it('should return 400 for missing ID', async () => {
      mockRequest.params = {};
      mockRequest.body = { role: 'VENDOR' };

      await updateUserRole(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateUserStatus', () => {
    it('should update user status', async () => {
      const mockUpdatedUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'User Name',
        role: 'CUSTOMER',
      };

      (adminService.updateUserStatus as jest.Mock).mockResolvedValue(
        mockUpdatedUser
      );

      mockRequest.params = { id: 'user-1' };
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
        'user-1',
        expect.any(Object)
      );
    });

    it('should return 400 for missing ID', async () => {
      mockRequest.params = {};
      mockRequest.body = { isActive: false };

      await updateUserStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });
});
