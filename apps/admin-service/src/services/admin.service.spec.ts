/**
 * Admin Service - Unit Tests
 */

import { adminService } from './admin.service';
import { prisma } from 'db';

// Mock Prisma
jest.mock('db', () => ({
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
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: 'user-2',
        email: 'customer@example.com',
        name: 'Customer User',
        role: 'CUSTOMER',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
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
        users: mockUsers,
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
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      _count: {
        sentPayments: 5,
        receivedPayments: 3,
      },
    };

    it('should get user by ID with payment counts', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await adminService.getUserById('user-1');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              sentPayments: true,
              receivedPayments: true,
            },
          },
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should update user name', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        name: 'Updated Name',
      });

      const result = await adminService.updateUser('user-1', {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
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
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockUser) // First call - get user
        .mockResolvedValueOnce(null); // Second call - check email uniqueness
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        email: 'newemail@example.com',
      });

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
      role: 'CUSTOMER',
    };

    it('should update user role', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        role: 'VENDOR',
      });

      const result = await adminService.updateUserRole('user-1', {
        role: 'VENDOR',
      });

      expect(result.role).toBe('VENDOR');
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
