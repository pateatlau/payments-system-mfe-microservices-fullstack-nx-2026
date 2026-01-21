/**
 * Admin Service - Unit Tests
 */

import { adminService } from './admin.service';
import { prisma } from '../lib/prisma';

// Mock Prisma
jest.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('AdminService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listUsers', () => {
    const mockUsers = [
      {
        id: 'user-1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN',
        emailVerified: true,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      },
      {
        id: 'user-2',
        email: 'customer@example.com',
        name: 'Customer User',
        role: 'CUSTOMER',
        emailVerified: false,
        createdAt: new Date('2024-01-02T00:00:00.000Z'),
        updatedAt: new Date('2024-01-02T00:00:00.000Z'),
      },
    ];

    // Expected output with ISO string dates
    const expectedUsers = [
      {
        id: 'user-1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN',
        emailVerified: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'user-2',
        email: 'customer@example.com',
        name: 'Customer User',
        role: 'CUSTOMER',
        emailVerified: false,
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      },
    ];

    it('should list users with pagination', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (prisma.user.count as jest.Mock).mockResolvedValue(2);

      const result = await adminService.listUsers({
        page: 1,
        limit: 10,
        sort: 'createdAt',
        order: 'desc',
      });

      expect(result).toEqual({
        users: expectedUsers,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should filter users by role', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([mockUsers[0]]);
      (prisma.user.count as jest.Mock).mockResolvedValue(1);

      await adminService.listUsers({
        page: 1,
        limit: 10,
        sort: 'createdAt',
        order: 'desc',
        role: 'ADMIN',
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: 'ADMIN' },
        })
      );
    });

    it('should search users by email or name', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([mockUsers[0]]);
      (prisma.user.count as jest.Mock).mockResolvedValue(1);

      await adminService.listUsers({
        page: 1,
        limit: 10,
        sort: 'createdAt',
        order: 'desc',
        search: 'admin',
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { email: { contains: 'admin', mode: 'insensitive' } },
              { name: { contains: 'admin', mode: 'insensitive' } },
            ],
          },
        })
      );
    });

    it('should calculate pagination correctly', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (prisma.user.count as jest.Mock).mockResolvedValue(25);

      const result = await adminService.listUsers({
        page: 2,
        limit: 10,
        sort: 'createdAt',
        order: 'desc',
      });

      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (page 2 - 1) * 10
          take: 10,
        })
      );
    });
  });

  describe('getUserById', () => {
    const mockUser = {
      id: 'user-1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'ADMIN',
      emailVerified: true,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    };

    const expectedUser = {
      id: 'user-1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'ADMIN',
      emailVerified: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    it('should get user by ID', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await adminService.getUserById('user-1');

      expect(result).toEqual(expectedUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should throw 404 if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(adminService.getUserById('invalid-id')).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('updateUser', () => {
    const mockUser = {
      id: 'user-1',
      email: 'user@example.com',
      name: 'User Name',
      role: 'CUSTOMER',
      emailVerified: false,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    };

    it('should update user name', async () => {
      const updatedMockUser = {
        ...mockUser,
        name: 'Updated Name',
      };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(updatedMockUser);

      const result = await adminService.updateUser('user-1', {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
      // Dates should be converted to ISO strings
      expect(result.createdAt).toBe('2024-01-01T00:00:00.000Z');
      expect(result.updatedAt).toBe('2024-01-01T00:00:00.000Z');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: expect.objectContaining({
            name: 'Updated Name',
          }),
        })
      );
    });

    it('should update user email if unique', async () => {
      const updatedMockUser = {
        ...mockUser,
        email: 'newemail@example.com',
      };
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockUser) // First call - get user
        .mockResolvedValueOnce(null); // Second call - check email uniqueness
      (prisma.user.update as jest.Mock).mockResolvedValue(updatedMockUser);

      const result = await adminService.updateUser('user-1', {
        email: 'newemail@example.com',
      });

      expect(result.email).toBe('newemail@example.com');
    });

    it('should throw 404 if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        adminService.updateUser('invalid-id', { name: 'Test' })
      ).rejects.toThrow('User not found');
    });

    it('should throw 409 if email already exists', async () => {
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockUser) // First call - get user
        .mockResolvedValueOnce({ id: 'other-user' }); // Second call - email exists

      await expect(
        adminService.updateUser('user-1', { email: 'taken@example.com' })
      ).rejects.toThrow('Email is already in use');
    });
  });

  describe('updateUserRole', () => {
    const mockUser = {
      id: 'user-1',
      email: 'user@example.com',
      name: 'User Name',
      role: 'CUSTOMER',
      emailVerified: false,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    };

    it('should update user role', async () => {
      const updatedMockUser = {
        ...mockUser,
        role: 'VENDOR',
      };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(updatedMockUser);

      const result = await adminService.updateUserRole('user-1', {
        role: 'VENDOR',
      });

      expect(result.role).toBe('VENDOR');
      // Dates should be converted to ISO strings
      expect(result.createdAt).toBe('2024-01-01T00:00:00.000Z');
      expect(result.updatedAt).toBe('2024-01-01T00:00:00.000Z');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: expect.objectContaining({
            role: 'VENDOR',
          }),
        })
      );
    });

    it('should throw 404 if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        adminService.updateUserRole('invalid-id', { role: 'ADMIN' })
      ).rejects.toThrow('User not found');
    });
  });

  describe('updateUserStatus', () => {
    it('should throw NOT_IMPLEMENTED error', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        role: 'CUSTOMER',
      });

      await expect(
        adminService.updateUserStatus('user-1', {
          isActive: false,
          reason: 'Test',
        })
      ).rejects.toThrow(
        'User activation/deactivation will be available in a future update'
      );
    });

    it('should throw 404 if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        adminService.updateUserStatus('invalid-id', {
          isActive: false,
        })
      ).rejects.toThrow('User not found');
    });
  });
});
