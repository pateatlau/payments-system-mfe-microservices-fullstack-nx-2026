/**
 * Auth Validators - Unit Tests
 *
 * Tests for:
 * - XSS sanitization
 * - UUID validation
 * - Email validation for path params
 * - Length limits
 * - Password requirements
 */

import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  uuidParamSchema,
  emailParamSchema,
  sanitizeString,
} from './auth.validators';
import { ZodError } from 'zod';
import { UserRole } from 'shared-types';

// ============================================================================
// SECURITY: XSS Sanitization Tests
// ============================================================================

describe('sanitizeString', () => {
  it('should trim whitespace', () => {
    expect(sanitizeString('  hello world  ')).toBe('hello world');
  });

  it('should remove HTML tags', () => {
    expect(sanitizeString('<script>alert("xss")</script>')).toBe(
      'alert("xss")'
    );
    expect(sanitizeString('<b>bold</b>')).toBe('bold');
  });

  it('should remove javascript: protocol', () => {
    expect(sanitizeString('javascript:alert(1)')).toBe('alert(1)');
    expect(sanitizeString('JAVASCRIPT:alert(1)')).toBe('alert(1)');
  });

  it('should remove event handlers', () => {
    expect(sanitizeString('onclick=alert(1)')).toBe('alert(1)');
    expect(sanitizeString('onerror=alert(1)')).toBe('alert(1)');
  });

  it('should remove null bytes', () => {
    expect(sanitizeString('hello\0world')).toBe('helloworld');
  });
});

// ============================================================================
// SECURITY: UUID Validation Tests
// ============================================================================

describe('uuidParamSchema', () => {
  it('should accept valid UUIDs', () => {
    const validUuids = [
      '123e4567-e89b-12d3-a456-426614174000',
      '00000000-0000-0000-0000-000000000000',
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    ];

    for (const uuid of validUuids) {
      const result = uuidParamSchema.parse({ id: uuid });
      expect(result.id).toBe(uuid);
    }
  });

  it('should reject invalid UUIDs', () => {
    const invalidUuids = [
      'not-a-uuid',
      '123',
      '<script>alert(1)</script>',
      '../../../etc/passwd',
    ];

    for (const uuid of invalidUuids) {
      expect(() => uuidParamSchema.parse({ id: uuid })).toThrow(ZodError);
    }
  });

  it('should provide meaningful error message', () => {
    try {
      uuidParamSchema.parse({ id: 'invalid' });
      fail('Should have thrown ZodError');
    } catch (error) {
      expect(error).toBeInstanceOf(ZodError);
      const zodError = error as ZodError;
      expect(zodError.errors[0].message).toBe('Invalid ID format');
    }
  });
});

// ============================================================================
// SECURITY: Email Param Validation Tests
// ============================================================================

describe('emailParamSchema', () => {
  it('should accept valid emails', () => {
    const validEmails = [
      'user@example.com',
      'test.user@domain.org',
      'admin@company.co.uk',
    ];

    for (const email of validEmails) {
      const result = emailParamSchema.parse({ email });
      expect(result.email).toBe(email);
    }
  });

  it('should reject invalid emails', () => {
    const invalidEmails = [
      'not-an-email',
      'missing@',
      '@nodomain.com',
      '<script>alert(1)</script>',
    ];

    for (const email of invalidEmails) {
      expect(() => emailParamSchema.parse({ email })).toThrow(ZodError);
    }
  });
});

// ============================================================================
// SCHEMAS: Registration Tests
// ============================================================================

describe('registerSchema', () => {
  it('should validate valid registration data', () => {
    const validData = {
      email: 'test@example.com',
      password: 'SecurePassword123!@#',
      name: 'Test User',
      role: UserRole.CUSTOMER,
    };

    const result = registerSchema.parse(validData);

    expect(result.email).toBe(validData.email);
    expect(result.password).toBe(validData.password);
    expect(result.name).toBe(validData.name);
    expect(result.role).toBe(validData.role);
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

  it('should sanitize name field', () => {
    const data = {
      email: 'test@example.com',
      password: 'SecurePassword123!@#',
      name: '<script>alert("xss")</script>John Doe',
      role: UserRole.CUSTOMER,
    };

    const result = registerSchema.parse(data);
    expect(result.name).toBe('alert("xss")John Doe');
  });

  it('should reject name longer than 255 characters', () => {
    const data = {
      email: 'test@example.com',
      password: 'SecurePassword123!@#',
      name: 'a'.repeat(256),
      role: UserRole.CUSTOMER,
    };

    expect(() => registerSchema.parse(data)).toThrow(ZodError);
  });

  it('should reject invalid email format', () => {
    const invalidData = {
      email: 'invalid-email',
      password: 'SecurePassword123!@#',
      name: 'Test User',
    };

    expect(() => registerSchema.parse(invalidData)).toThrow(ZodError);
  });

  it('should reject email longer than 255 characters', () => {
    const invalidData = {
      email: 'a'.repeat(250) + '@example.com',
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

// ============================================================================
// SCHEMAS: Login Tests
// ============================================================================

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

  it('should reject password longer than 255 characters', () => {
    const invalidData = {
      email: 'test@example.com',
      password: 'a'.repeat(256),
    };

    expect(() => loginSchema.parse(invalidData)).toThrow(ZodError);
  });
});

// ============================================================================
// SCHEMAS: Refresh Token Tests
// ============================================================================

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

  it('should reject refresh token longer than 2048 characters', () => {
    const invalidData = {
      refreshToken: 'a'.repeat(2049),
    };

    expect(() => refreshTokenSchema.parse(invalidData)).toThrow(ZodError);
  });
});

// ============================================================================
// SCHEMAS: Change Password Tests
// ============================================================================

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

  it('should reject current password longer than 255 characters', () => {
    const invalidData = {
      currentPassword: 'a'.repeat(256),
      newPassword: 'NewPassword123!@#',
    };

    expect(() => changePasswordSchema.parse(invalidData)).toThrow(ZodError);
  });
});
