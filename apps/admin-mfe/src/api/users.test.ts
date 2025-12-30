/**
 * User Management API Tests
 */

import { adminApiClient } from './adminApiClient';
import { UserRole } from 'shared-types';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserRole,
  deleteUser,
} from './users';

// Mock the admin API client
jest.mock('./adminApiClient', () => ({
  adminApiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  initializeAdminApiClient: jest.fn(),
}));

describe('User Management API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    it('should fetch users list without filters', async () => {
      const mockResponse = {
        data: {
          data: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          },
        },
      };

      (adminApiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getUsers();

      expect(adminApiClient.get).toHaveBeenCalledWith('/admin/users?');
      expect(result).toEqual(mockResponse.data);
    });

    it('should fetch users list with filters', async () => {
      const mockResponse = {
        data: {
          data: [],
          pagination: {
            page: 2,
            limit: 20,
            total: 100,
            totalPages: 5,
          },
        },
      };

      (adminApiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getUsers({
        page: 2,
        limit: 20,
        role: UserRole.ADMIN,
        search: 'john',
      });

      expect(adminApiClient.get).toHaveBeenCalledWith(
        '/admin/users?page=2&limit=20&role=ADMIN&search=john'
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors', async () => {
      (adminApiClient.get as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await expect(getUsers()).rejects.toThrow('Network error');
    });
  });

  describe('getUserById', () => {
    it('should fetch user by ID', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'John Doe',
        role: UserRole.CUSTOMER,
        emailVerified: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      const mockResponse = {
        data: mockUser,
      };

      (adminApiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getUserById('user-123');

      expect(adminApiClient.get).toHaveBeenCalledWith('/admin/users/user-123');
      expect(result).toEqual(mockUser);
    });

    it('should handle API errors', async () => {
      (adminApiClient.get as jest.Mock).mockRejectedValue(
        new Error('User not found')
      );

      await expect(getUserById('invalid-id')).rejects.toThrow('User not found');
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        name: 'New User',
        role: UserRole.CUSTOMER,
      };

      const mockUser = {
        id: 'user-456',
        email: userData.email,
        name: userData.name,
        role: userData.role,
        emailVerified: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      const mockResponse = {
        data: mockUser,
      };

      (adminApiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await createUser(userData);

      expect(adminApiClient.post).toHaveBeenCalledWith(
        '/admin/users',
        userData
      );
      expect(result).toEqual(mockUser);
    });

    it('should handle API errors', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        name: 'New User',
        role: UserRole.CUSTOMER,
      };

      (adminApiClient.post as jest.Mock).mockRejectedValue(
        new Error('Email already exists')
      );

      await expect(createUser(userData)).rejects.toThrow(
        'Email already exists'
      );
    });
  });

  describe('updateUser', () => {
    it('should update user information', async () => {
      const userData = {
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      const mockUser = {
        id: 'user-123',
        email: userData.email,
        name: userData.name,
        role: UserRole.CUSTOMER,
        emailVerified: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      };

      const mockResponse = {
        data: mockUser,
      };

      (adminApiClient.put as jest.Mock).mockResolvedValue(mockResponse);

      const result = await updateUser('user-123', userData);

      expect(adminApiClient.put).toHaveBeenCalledWith(
        '/admin/users/user-123',
        userData
      );
      expect(result).toEqual(mockUser);
    });

    it('should handle API errors', async () => {
      const userData = {
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      (adminApiClient.put as jest.Mock).mockRejectedValue(
        new Error('Validation error')
      );

      await expect(updateUser('user-123', userData)).rejects.toThrow(
        'Validation error'
      );
    });
  });

  describe('updateUserRole', () => {
    it('should update user role', async () => {
      const mockData = {
        id: 'user-123',
        role: UserRole.ADMIN,
        updatedAt: '2026-01-02T00:00:00.000Z',
      };

      const mockResponse = {
        data: mockData,
      };

      (adminApiClient.put as jest.Mock).mockResolvedValue(mockResponse);

      const result = await updateUserRole('user-123', UserRole.ADMIN);

      expect(adminApiClient.put).toHaveBeenCalledWith(
        '/admin/users/user-123/role',
        {
          role: UserRole.ADMIN,
        }
      );
      expect(result).toEqual(mockData);
    });

    it('should handle API errors', async () => {
      (adminApiClient.put as jest.Mock).mockRejectedValue(
        new Error('Forbidden')
      );

      await expect(updateUserRole('user-123', UserRole.ADMIN)).rejects.toThrow(
        'Forbidden'
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      (adminApiClient.delete as jest.Mock).mockResolvedValue({});

      await deleteUser('user-123');

      expect(adminApiClient.delete).toHaveBeenCalledWith(
        '/admin/users/user-123'
      );
    });

    it('should handle API errors', async () => {
      (adminApiClient.delete as jest.Mock).mockRejectedValue(
        new Error('User not found')
      );

      await expect(deleteUser('invalid-id')).rejects.toThrow('User not found');
    });
  });
});
