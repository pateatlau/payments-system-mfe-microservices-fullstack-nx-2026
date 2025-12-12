/**
 * Admin Validators - Unit Tests
 */

import {
  listUsersSchema,
  updateUserSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  createUserSchema,
} from './admin.validators';
import { ZodError } from 'zod';

describe('Admin Validators', () => {
  describe('listUsersSchema', () => {
    it('should validate valid query parameters', () => {
      const validQuery = {
        page: '1',
        limit: '10',
        sort: 'createdAt',
        order: 'desc',
      };

      const result = listUsersSchema.parse(validQuery);

      expect(result).toEqual({
        page: 1,
        limit: 10,
        sort: 'createdAt',
        order: 'desc',
      });
    });

    it('should use default values for missing parameters', () => {
      const result = listUsersSchema.parse({});

      expect(result).toEqual({
        page: 1,
        limit: 10,
        sort: 'createdAt',
        order: 'desc',
      });
    });

    it('should validate role filter', () => {
      const result = listUsersSchema.parse({ role: 'ADMIN' });

      expect(result.role).toBe('ADMIN');
    });

    it('should validate search parameter', () => {
      const result = listUsersSchema.parse({ search: 'test@example.com' });

      expect(result.search).toBe('test@example.com');
    });

    it('should reject limit over 100', () => {
      expect(() => {
        listUsersSchema.parse({ limit: '150' });
      }).toThrow(ZodError);
    });

    it('should reject invalid sort field', () => {
      expect(() => {
        listUsersSchema.parse({ sort: 'invalid' });
      }).toThrow(ZodError);
    });

    it('should reject invalid order', () => {
      expect(() => {
        listUsersSchema.parse({ order: 'invalid' });
      }).toThrow(ZodError);
    });
  });

  describe('updateUserSchema', () => {
    it('should validate valid update data', () => {
      const validData = {
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      const result = updateUserSchema.parse(validData);

      expect(result).toEqual(validData);
    });

    it('should accept partial updates', () => {
      const result = updateUserSchema.parse({ name: 'New Name' });

      expect(result.name).toBe('New Name');
      expect(result.email).toBeUndefined();
    });

    it('should reject empty name', () => {
      expect(() => {
        updateUserSchema.parse({ name: '' });
      }).toThrow(ZodError);
    });

    it('should reject invalid email format', () => {
      expect(() => {
        updateUserSchema.parse({ email: 'invalid-email' });
      }).toThrow(ZodError);
    });

    it('should reject name longer than 255 characters', () => {
      const longName = 'a'.repeat(256);
      expect(() => {
        updateUserSchema.parse({ name: longName });
      }).toThrow(ZodError);
    });
  });

  describe('updateUserRoleSchema', () => {
    it('should validate valid role', () => {
      const validData = { role: 'ADMIN' };
      const result = updateUserRoleSchema.parse(validData);

      expect(result.role).toBe('ADMIN');
    });

    it('should accept all valid roles', () => {
      expect(updateUserRoleSchema.parse({ role: 'ADMIN' }).role).toBe('ADMIN');
      expect(updateUserRoleSchema.parse({ role: 'CUSTOMER' }).role).toBe(
        'CUSTOMER'
      );
      expect(updateUserRoleSchema.parse({ role: 'VENDOR' }).role).toBe(
        'VENDOR'
      );
    });

    it('should reject invalid role', () => {
      expect(() => {
        updateUserRoleSchema.parse({ role: 'INVALID' });
      }).toThrow(ZodError);
    });
  });

  describe('updateUserStatusSchema', () => {
    it('should validate valid status data', () => {
      const validData = {
        isActive: true,
        reason: 'User activated',
      };

      const result = updateUserStatusSchema.parse(validData);

      expect(result).toEqual(validData);
    });

    it('should accept status without reason', () => {
      const result = updateUserStatusSchema.parse({ isActive: false });

      expect(result.isActive).toBe(false);
      expect(result.reason).toBeUndefined();
    });

    it('should reject reason longer than 500 characters', () => {
      const longReason = 'a'.repeat(501);
      expect(() => {
        updateUserStatusSchema.parse({ isActive: true, reason: longReason });
      }).toThrow(ZodError);
    });
  });

  describe('createUserSchema', () => {
    it('should validate valid create user data', () => {
      const validData = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!@#',
        name: 'New User',
        role: 'CUSTOMER',
      };

      const result = createUserSchema.parse(validData);

      expect(result).toEqual(validData);
    });

    it('should reject invalid email format', () => {
      expect(() => {
        createUserSchema.parse({
          email: 'invalid-email',
          password: 'SecurePassword123!@#',
          name: 'User',
          role: 'CUSTOMER',
        });
      }).toThrow(ZodError);
    });

    it('should reject password shorter than 12 characters', () => {
      expect(() => {
        createUserSchema.parse({
          email: 'user@example.com',
          password: 'Short1!',
          name: 'User',
          role: 'CUSTOMER',
        });
      }).toThrow(ZodError);
    });

    it('should reject empty name', () => {
      expect(() => {
        createUserSchema.parse({
          email: 'user@example.com',
          password: 'SecurePassword123!@#',
          name: '',
          role: 'CUSTOMER',
        });
      }).toThrow(ZodError);
    });

    it('should reject invalid role', () => {
      expect(() => {
        createUserSchema.parse({
          email: 'user@example.com',
          password: 'SecurePassword123!@#',
          name: 'User',
          role: 'INVALID',
        });
      }).toThrow(ZodError);
    });
  });
});
