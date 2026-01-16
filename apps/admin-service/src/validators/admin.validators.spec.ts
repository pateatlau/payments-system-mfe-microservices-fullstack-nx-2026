/**
 * Admin Validators - Unit Tests
 *
 * Tests for:
 * - XSS sanitization
 * - UUID validation
 * - Strict enum validation
 * - Input length limits
 * - Password requirements
 */

import { ZodError } from 'zod';
import {
  listUsersSchema,
  updateUserSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  createUserSchema,
  uuidParamSchema,
  auditLogsQuerySchema,
  sanitizeString,
  USER_ROLES,
  AUDIT_ACTIONS,
  RESOURCE_TYPES,
} from './admin.validators';

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
    expect(sanitizeString('<img src="x" onerror="alert(1)">')).toBe('');
  });

  it('should remove javascript: protocol', () => {
    expect(sanitizeString('javascript:alert(1)')).toBe('alert(1)');
    expect(sanitizeString('JAVASCRIPT:alert(1)')).toBe('alert(1)');
  });

  it('should remove event handlers', () => {
    expect(sanitizeString('onclick=alert(1)')).toBe('alert(1)');
    expect(sanitizeString('onerror=alert(1)')).toBe('alert(1)');
    expect(sanitizeString('onload=alert(1)')).toBe('alert(1)');
    expect(sanitizeString('ONCLICK=alert(1)')).toBe('alert(1)');
  });

  it('should remove null bytes', () => {
    expect(sanitizeString('hello\0world')).toBe('helloworld');
  });

  it('should normalize unicode', () => {
    // NFC normalization test
    const input = 'café'; // may have different unicode representations
    const result = sanitizeString(input);
    expect(result).toBe(input.normalize('NFC'));
  });

  it('should handle complex XSS attempts', () => {
    const xssAttempts = [
      '<script>document.cookie</script>',
      '<img src=x onerror=alert(1)>',
      '<svg onload=alert(1)>',
      'javascript:void(0)',
      '<a href="javascript:alert(1)">click</a>',
    ];

    for (const attempt of xssAttempts) {
      const result = sanitizeString(attempt);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('javascript:');
      expect(result).not.toMatch(/on\w+=/i);
    }
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
      '123e4567-e89b-12d3-a456', // incomplete
      '123e4567-e89b-12d3-a456-426614174000-extra', // too long
      'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', // invalid chars
      '<script>alert(1)</script>', // XSS attempt
      '../../../etc/passwd', // path traversal
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
// SCHEMAS: List Users Query Tests
// ============================================================================

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

  it('should validate role filter with strict enum', () => {
    for (const role of USER_ROLES) {
      const result = listUsersSchema.parse({ role });
      expect(result.role).toBe(role);
    }
  });

  it('should reject invalid role values', () => {
    expect(() => listUsersSchema.parse({ role: 'INVALID' })).toThrow(ZodError);
    expect(() => listUsersSchema.parse({ role: 'admin' })).toThrow(ZodError); // lowercase
    expect(() => listUsersSchema.parse({ role: 'SUPER_ADMIN' })).toThrow(
      ZodError
    );
  });

  it('should sanitize search parameter', () => {
    const result = listUsersSchema.parse({
      search: '<script>alert("xss")</script>test@example.com',
    });
    expect(result.search).toBe('alert("xss")test@example.com');
  });

  it('should reject search over 255 characters', () => {
    const longSearch = 'a'.repeat(256);
    expect(() => listUsersSchema.parse({ search: longSearch })).toThrow(
      ZodError
    );
  });

  it('should reject limit over 100', () => {
    expect(() => listUsersSchema.parse({ limit: '150' })).toThrow(ZodError);
  });

  it('should reject invalid sort field', () => {
    expect(() => listUsersSchema.parse({ sort: 'invalid' })).toThrow(ZodError);
  });

  it('should reject invalid order', () => {
    expect(() => listUsersSchema.parse({ order: 'invalid' })).toThrow(ZodError);
  });
});

// ============================================================================
// SCHEMAS: Audit Logs Query Tests
// ============================================================================

describe('auditLogsQuerySchema', () => {
  it('should use default values for missing parameters', () => {
    const result = auditLogsQuerySchema.parse({});

    expect(result).toEqual({
      page: 1,
      limit: 20,
    });
  });

  it('should validate action filter with strict enum', () => {
    for (const action of AUDIT_ACTIONS) {
      const result = auditLogsQuerySchema.parse({ action });
      expect(result.action).toBe(action);
    }
  });

  it('should reject invalid action values', () => {
    expect(() =>
      auditLogsQuerySchema.parse({ action: 'INVALID_ACTION' })
    ).toThrow(ZodError);
    expect(() =>
      auditLogsQuerySchema.parse({ action: 'user_login' })
    ).toThrow(ZodError); // lowercase
  });

  it('should validate resourceType filter with strict enum', () => {
    for (const resourceType of RESOURCE_TYPES) {
      const result = auditLogsQuerySchema.parse({ resourceType });
      expect(result.resourceType).toBe(resourceType);
    }
  });

  it('should reject invalid resourceType values', () => {
    expect(() =>
      auditLogsQuerySchema.parse({ resourceType: 'invalid' })
    ).toThrow(ZodError);
    expect(() =>
      auditLogsQuerySchema.parse({ resourceType: 'USER' })
    ).toThrow(ZodError); // uppercase
  });

  it('should validate userId as UUID', () => {
    const result = auditLogsQuerySchema.parse({
      userId: '123e4567-e89b-12d3-a456-426614174000',
    });
    expect(result.userId).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('should reject invalid userId format', () => {
    expect(() =>
      auditLogsQuerySchema.parse({ userId: 'not-a-uuid' })
    ).toThrow(ZodError);
    expect(() =>
      auditLogsQuerySchema.parse({ userId: '<script>alert(1)</script>' })
    ).toThrow(ZodError);
  });

  it('should coerce date strings to Date objects', () => {
    const result = auditLogsQuerySchema.parse({
      startDate: '2025-01-01',
      endDate: '2025-12-31',
    });

    expect(result.startDate).toBeInstanceOf(Date);
    expect(result.endDate).toBeInstanceOf(Date);
  });

  it('should reject invalid date formats', () => {
    expect(() =>
      auditLogsQuerySchema.parse({ startDate: 'not-a-date' })
    ).toThrow(ZodError);
  });

  it('should reject limit over 100', () => {
    expect(() => auditLogsQuerySchema.parse({ limit: '150' })).toThrow(
      ZodError
    );
  });
});

// ============================================================================
// SCHEMAS: Update User Tests
// ============================================================================

describe('updateUserSchema', () => {
  it('should validate valid update data', () => {
    const validData = {
      name: 'Updated Name',
      email: 'updated@example.com',
    };

    const result = updateUserSchema.parse(validData);

    expect(result.name).toBe('Updated Name');
    expect(result.email).toBe('updated@example.com');
  });

  it('should accept partial updates', () => {
    const result = updateUserSchema.parse({ name: 'New Name' });

    expect(result.name).toBe('New Name');
    expect(result.email).toBeUndefined();
  });

  it('should sanitize name field', () => {
    const result = updateUserSchema.parse({
      name: '<script>alert("xss")</script>John',
    });
    expect(result.name).toBe('alert("xss")John');
  });

  it('should reject empty name', () => {
    expect(() => updateUserSchema.parse({ name: '' })).toThrow(ZodError);
  });

  it('should reject invalid email format', () => {
    expect(() => updateUserSchema.parse({ email: 'invalid-email' })).toThrow(
      ZodError
    );
  });

  it('should reject name longer than 255 characters', () => {
    const longName = 'a'.repeat(256);
    expect(() => updateUserSchema.parse({ name: longName })).toThrow(ZodError);
  });

  it('should reject email longer than 255 characters', () => {
    const longEmail = 'a'.repeat(250) + '@example.com';
    expect(() => updateUserSchema.parse({ email: longEmail })).toThrow(
      ZodError
    );
  });
});

// ============================================================================
// SCHEMAS: Update User Role Tests
// ============================================================================

describe('updateUserRoleSchema', () => {
  it('should validate valid role', () => {
    const validData = { role: 'ADMIN' as const };
    const result = updateUserRoleSchema.parse(validData);

    expect(result.role).toBe('ADMIN');
  });

  it('should accept all valid roles', () => {
    for (const role of USER_ROLES) {
      expect(updateUserRoleSchema.parse({ role }).role).toBe(role);
    }
  });

  it('should reject invalid role', () => {
    expect(() => updateUserRoleSchema.parse({ role: 'INVALID' })).toThrow(
      ZodError
    );
    expect(() => updateUserRoleSchema.parse({ role: 'admin' })).toThrow(
      ZodError
    ); // lowercase
    expect(() => updateUserRoleSchema.parse({ role: '' })).toThrow(ZodError);
  });
});

// ============================================================================
// SCHEMAS: Update User Status Tests
// ============================================================================

describe('updateUserStatusSchema', () => {
  it('should validate valid status data', () => {
    const validData = {
      isActive: true,
      reason: 'User activated',
    };

    const result = updateUserStatusSchema.parse(validData);

    expect(result.isActive).toBe(true);
    expect(result.reason).toBe('User activated');
  });

  it('should accept status without reason', () => {
    const result = updateUserStatusSchema.parse({ isActive: false });

    expect(result.isActive).toBe(false);
    expect(result.reason).toBeUndefined();
  });

  it('should sanitize reason field', () => {
    const result = updateUserStatusSchema.parse({
      isActive: true,
      reason: '<script>alert("xss")</script>Account suspended',
    });
    expect(result.reason).toBe('alert("xss")Account suspended');
  });

  it('should reject reason longer than 500 characters', () => {
    const longReason = 'a'.repeat(501);
    expect(() =>
      updateUserStatusSchema.parse({ isActive: true, reason: longReason })
    ).toThrow(ZodError);
  });

  it('should reject non-boolean isActive', () => {
    expect(() =>
      updateUserStatusSchema.parse({ isActive: 'true' })
    ).toThrow(ZodError);
    expect(() =>
      updateUserStatusSchema.parse({ isActive: 1 })
    ).toThrow(ZodError);
  });
});

// ============================================================================
// SCHEMAS: Create User Tests
// ============================================================================

describe('createUserSchema', () => {
  const validPassword = 'SecurePassword123!@#';

  it('should validate valid create user data', () => {
    const validData = {
      email: 'newuser@example.com',
      password: validPassword,
      name: 'New User',
      role: 'CUSTOMER' as const,
    };

    const result = createUserSchema.parse(validData);

    expect(result.email).toBe('newuser@example.com');
    expect(result.password).toBe(validPassword);
    expect(result.name).toBe('New User');
    expect(result.role).toBe('CUSTOMER');
  });

  it('should sanitize name field', () => {
    const result = createUserSchema.parse({
      email: 'user@example.com',
      password: validPassword,
      name: '<script>alert(1)</script>John Doe',
      role: 'CUSTOMER' as const,
    });
    expect(result.name).toBe('alert(1)John Doe');
  });

  it('should reject invalid email format', () => {
    expect(() =>
      createUserSchema.parse({
        email: 'invalid-email',
        password: validPassword,
        name: 'User',
        role: 'CUSTOMER',
      })
    ).toThrow(ZodError);
  });

  it('should reject password shorter than 12 characters', () => {
    expect(() =>
      createUserSchema.parse({
        email: 'user@example.com',
        password: 'Short1!',
        name: 'User',
        role: 'CUSTOMER',
      })
    ).toThrow(ZodError);
  });

  it('should reject password without uppercase letter', () => {
    expect(() =>
      createUserSchema.parse({
        email: 'user@example.com',
        password: 'securepassword123!',
        name: 'User',
        role: 'CUSTOMER',
      })
    ).toThrow(ZodError);
  });

  it('should reject password without lowercase letter', () => {
    expect(() =>
      createUserSchema.parse({
        email: 'user@example.com',
        password: 'SECUREPASSWORD123!',
        name: 'User',
        role: 'CUSTOMER',
      })
    ).toThrow(ZodError);
  });

  it('should reject password without number', () => {
    expect(() =>
      createUserSchema.parse({
        email: 'user@example.com',
        password: 'SecurePassword!!!',
        name: 'User',
        role: 'CUSTOMER',
      })
    ).toThrow(ZodError);
  });

  it('should reject password without special character', () => {
    expect(() =>
      createUserSchema.parse({
        email: 'user@example.com',
        password: 'SecurePassword123',
        name: 'User',
        role: 'CUSTOMER',
      })
    ).toThrow(ZodError);
  });

  it('should reject empty name', () => {
    expect(() =>
      createUserSchema.parse({
        email: 'user@example.com',
        password: validPassword,
        name: '',
        role: 'CUSTOMER',
      })
    ).toThrow(ZodError);
  });

  it('should reject invalid role', () => {
    expect(() =>
      createUserSchema.parse({
        email: 'user@example.com',
        password: validPassword,
        name: 'User',
        role: 'INVALID',
      })
    ).toThrow(ZodError);
  });

  it('should reject name longer than 255 characters', () => {
    expect(() =>
      createUserSchema.parse({
        email: 'user@example.com',
        password: validPassword,
        name: 'a'.repeat(256),
        role: 'CUSTOMER',
      })
    ).toThrow(ZodError);
  });
});

// ============================================================================
// CONSTANTS: Validation Tests
// ============================================================================

describe('Constants', () => {
  describe('USER_ROLES', () => {
    it('should contain expected roles', () => {
      expect(USER_ROLES).toContain('ADMIN');
      expect(USER_ROLES).toContain('CUSTOMER');
      expect(USER_ROLES).toContain('VENDOR');
      expect(USER_ROLES).toHaveLength(3);
    });
  });

  describe('AUDIT_ACTIONS', () => {
    it('should contain user management actions', () => {
      expect(AUDIT_ACTIONS).toContain('USER_CREATED');
      expect(AUDIT_ACTIONS).toContain('USER_UPDATED');
      expect(AUDIT_ACTIONS).toContain('USER_DELETED');
      expect(AUDIT_ACTIONS).toContain('USER_ROLE_CHANGED');
      expect(AUDIT_ACTIONS).toContain('USER_STATUS_CHANGED');
    });

    it('should contain authentication actions', () => {
      expect(AUDIT_ACTIONS).toContain('USER_REGISTERED');
      expect(AUDIT_ACTIONS).toContain('USER_LOGIN');
      expect(AUDIT_ACTIONS).toContain('USER_LOGOUT');
      expect(AUDIT_ACTIONS).toContain('USER_PASSWORD_CHANGED');
    });

    it('should contain payment actions', () => {
      expect(AUDIT_ACTIONS).toContain('PAYMENT_CREATED');
      expect(AUDIT_ACTIONS).toContain('PAYMENT_UPDATED');
      expect(AUDIT_ACTIONS).toContain('PAYMENT_COMPLETED');
      expect(AUDIT_ACTIONS).toContain('PAYMENT_FAILED');
      expect(AUDIT_ACTIONS).toContain('PAYMENT_CANCELLED');
    });

    it('should contain system actions', () => {
      expect(AUDIT_ACTIONS).toContain('SYSTEM_CONFIG_CHANGED');
    });
  });

  describe('RESOURCE_TYPES', () => {
    it('should contain expected resource types', () => {
      expect(RESOURCE_TYPES).toContain('user');
      expect(RESOURCE_TYPES).toContain('payment');
      expect(RESOURCE_TYPES).toContain('system_config');
      expect(RESOURCE_TYPES).toContain('session');
      expect(RESOURCE_TYPES).toHaveLength(4);
    });
  });
});
