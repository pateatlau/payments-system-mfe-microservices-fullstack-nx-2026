/**
 * Auth Validators - Unit Tests
 */

import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from './auth.validators';
import { ZodError } from 'zod';
import { UserRole } from 'shared-types';

describe('Auth Validators', () => {
  describe('registerSchema', () => {
    it('should validate valid registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'SecurePassword123!@#',
        name: 'Test User',
        role: UserRole.CUSTOMER,
      };

      const result = registerSchema.parse(validData);

      expect(result).toEqual(validData);
    });

    it('should use default role if not provided', () => {
      const data = {
        email: 'test@example.com',
        password: 'SecurePassword123!@#',
        name: 'Test User',
      };

      const result = registerSchema.parse(data);

      expect(result.role).toBe(UserRole.CUSTOMER);
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'SecurePassword123!@#',
        name: 'Test User',
      };

      expect(() => registerSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should reject password shorter than 12 characters', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Short1!',
        name: 'Test User',
      };

      expect(() => registerSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should reject password without uppercase letter', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'lowercase123!@#',
        name: 'Test User',
      };

      expect(() => registerSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should reject password without lowercase letter', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'UPPERCASE123!@#',
        name: 'Test User',
      };

      expect(() => registerSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should reject password without number', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'NoNumbers!@#',
        name: 'Test User',
      };

      expect(() => registerSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should reject password without special character', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'NoSpecial123',
        name: 'Test User',
      };

      expect(() => registerSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should reject empty name', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'SecurePassword123!@#',
        name: '',
      };

      expect(() => registerSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should accept valid role enum values', () => {
      const dataWithAdmin = {
        email: 'admin@example.com',
        password: 'SecurePassword123!@#',
        name: 'Admin User',
        role: UserRole.ADMIN,
      };

      const result = registerSchema.parse(dataWithAdmin);
      expect(result.role).toBe(UserRole.ADMIN);
    });
  });

  describe('loginSchema', () => {
    it('should validate valid login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'any-password',
      };

      const result = loginSchema.parse(validData);

      expect(result).toEqual(validData);
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password',
      };

      expect(() => loginSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should reject empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '',
      };

      expect(() => loginSchema.parse(invalidData)).toThrow(ZodError);
    });
  });

  describe('refreshTokenSchema', () => {
    it('should validate valid refresh token data', () => {
      const validData = {
        refreshToken: 'valid-refresh-token',
      };

      const result = refreshTokenSchema.parse(validData);

      expect(result).toEqual(validData);
    });

    it('should reject empty refresh token', () => {
      const invalidData = {
        refreshToken: '',
      };

      expect(() => refreshTokenSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should reject missing refresh token', () => {
      const invalidData = {};

      expect(() => refreshTokenSchema.parse(invalidData)).toThrow(ZodError);
    });
  });

  describe('changePasswordSchema', () => {
    it('should validate valid change password data', () => {
      const validData = {
        currentPassword: 'CurrentPassword123!@#',
        newPassword: 'NewPassword123!@#',
      };

      const result = changePasswordSchema.parse(validData);

      expect(result).toEqual(validData);
    });

    it('should reject empty current password', () => {
      const invalidData = {
        currentPassword: '',
        newPassword: 'NewPassword123!@#',
      };

      expect(() => changePasswordSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should reject new password shorter than 12 characters', () => {
      const invalidData = {
        currentPassword: 'CurrentPassword123!@#',
        newPassword: 'Short1!',
      };

      expect(() => changePasswordSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should reject new password without required complexity', () => {
      const invalidData = {
        currentPassword: 'CurrentPassword123!@#',
        newPassword: 'lowercaseonly123',
      };

      expect(() => changePasswordSchema.parse(invalidData)).toThrow(ZodError);
    });
  });
});
