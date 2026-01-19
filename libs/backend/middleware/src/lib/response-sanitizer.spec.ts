/**
 * Response Sanitizer Middleware - Unit Tests
 *
 * Tests for the core sanitization functions.
 * Integration tests with Express/supertest are in the service-level tests.
 */

import {
  sanitizeObject,
  redactPiiFromString,
  sanitizePathsFromString,
  sanitizeErrorResponse,
  PII_PATTERNS,
  SENSITIVE_FIELDS,
  trackSanitizationEvent,
  getSanitizationStats,
  resetSanitizationStats,
  ResponseSanitizerConfig,
} from './response-sanitizer';

describe('Response Sanitizer', () => {
  // Standard test config
  const createConfig = (
    overrides: Partial<ResponseSanitizerConfig> = {}
  ): Required<ResponseSanitizerConfig> => ({
    removeStackTraces: true,
    redactPii: true,
    sanitizePaths: true,
    customPiiPatterns: [],
    redactFields: [],
    environment: 'production',
    onSanitize: jest.fn(),
    ...overrides,
  });

  describe('PII Pattern Detection', () => {
    let config: Required<ResponseSanitizerConfig>;

    beforeEach(() => {
      config = createConfig();
    });

    it('should detect and redact email addresses', () => {
      const input = 'Contact user at john.doe@example.com for support';
      const result = redactPiiFromString(input, config);
      expect(result).not.toContain('john.doe@example.com');
      expect(result).toContain('[REDACTED]');
    });

    it('should detect and redact phone numbers', () => {
      const testCases = [
        'Call me at 555-123-4567',
        'Phone: (555) 123-4567',
        'Contact: +1 555 123 4567',
        'Fax: 555.123.4567',
      ];

      for (const input of testCases) {
        const result = redactPiiFromString(input, config);
        expect(result).toContain('[REDACTED]');
      }
    });

    it('should detect and redact SSN patterns', () => {
      const input = 'SSN: 123-45-6789';
      const result = redactPiiFromString(input, config);
      expect(result).not.toContain('123-45-6789');
      expect(result).toContain('[REDACTED]');
    });

    it('should detect and redact credit card numbers', () => {
      const testCases = [
        'Card: 4111-1111-1111-1111',
        'CC: 4111 1111 1111 1111',
        'Number: 4111111111111111',
      ];

      for (const input of testCases) {
        const result = redactPiiFromString(input, config);
        expect(result).toContain('[REDACTED]');
      }
    });

    it('should detect and redact JWT tokens', () => {
      const jwt =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      const input = `Authorization: Bearer ${jwt}`;
      const result = redactPiiFromString(input, config);
      expect(result).not.toContain(jwt);
      expect(result).toContain('[REDACTED]');
    });

    it('should detect and redact API keys in common formats', () => {
      const testCases = [
        'api_key: "sk_live_abcdefghij1234567890"',
        'apiKey="pk_test_1234567890abcdefghij"',
        'access_token: "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"',
      ];

      for (const input of testCases) {
        const result = redactPiiFromString(input, config);
        expect(result).toContain('[REDACTED]');
      }
    });

    it('should detect and redact IPv4 addresses', () => {
      const input = 'Client IP: 192.168.1.100';
      const result = redactPiiFromString(input, config);
      expect(result).not.toContain('192.168.1.100');
      expect(result).toContain('[REDACTED]');
    });

    it('should handle multiple PII in one string', () => {
      const input =
        'User john@example.com called from 555-123-4567 with card 4111-1111-1111-1111';
      const result = redactPiiFromString(input, config);
      expect(result).not.toContain('john@example.com');
      expect(result).not.toContain('555-123-4567');
      expect(result).not.toContain('4111-1111-1111-1111');
      expect(result.match(/\[REDACTED\]/g)?.length).toBeGreaterThanOrEqual(3);
    });

    it('should support custom PII patterns', () => {
      const customConfig = createConfig({
        customPiiPatterns: [/CUSTOM-[A-Z]{3}-\d{4}/g],
      });
      const input = 'Reference: CUSTOM-ABC-1234';
      const result = redactPiiFromString(input, customConfig);
      expect(result).not.toContain('CUSTOM-ABC-1234');
      expect(result).toContain('[REDACTED]');
    });

    it('should call onSanitize callback when PII is detected', () => {
      const onSanitize = jest.fn();
      const callbackConfig = createConfig({ onSanitize });
      redactPiiFromString('email: test@example.com', callbackConfig);
      expect(onSanitize).toHaveBeenCalled();
    });
  });

  describe('Path Sanitization', () => {
    let config: Required<ResponseSanitizerConfig>;

    beforeEach(() => {
      config = createConfig();
    });

    it('should sanitize Unix file paths', () => {
      const input = 'Error at /Users/developer/project/src/app.ts:42';
      const result = sanitizePathsFromString(input, config);
      expect(result).not.toContain('/Users/developer');
      expect(result).toContain('[internal-path]');
    });

    it('should sanitize node_modules paths', () => {
      const input =
        'Error in node_modules/express/lib/router/index.js line 45';
      const result = sanitizePathsFromString(input, config);
      expect(result).not.toContain('node_modules/express');
      expect(result).toContain('[internal-path]');
    });

    it('should sanitize Windows paths', () => {
      const input = 'Error at C:\\Users\\Dev\\project\\src\\app.ts:42';
      const result = sanitizePathsFromString(input, config);
      expect(result).not.toContain('C:\\Users\\Dev');
      expect(result).toContain('[internal-path]');
    });

    it('should sanitize project structure paths', () => {
      const input = 'Error in apps/auth-service/src/main.ts line 100';
      const result = sanitizePathsFromString(input, config);
      expect(result).toContain('[internal-path]');
    });
  });

  describe('Object Sanitization', () => {
    let config: Required<ResponseSanitizerConfig>;

    beforeEach(() => {
      config = createConfig();
    });

    it('should redact sensitive field names', () => {
      const obj = {
        username: 'john',
        password: 'secret123',
        email: 'john@example.com',
      };
      const result = sanitizeObject(obj, config) as Record<string, unknown>;
      expect(result['password']).toBe('[REDACTED]');
    });

    it('should redact all sensitive fields from SENSITIVE_FIELDS list', () => {
      const obj: Record<string, string> = {};
      SENSITIVE_FIELDS.forEach((field) => {
        obj[field] = 'sensitive-value';
      });

      const result = sanitizeObject(obj, config) as Record<string, string>;
      SENSITIVE_FIELDS.forEach((field) => {
        expect(result[field]).toBe('[REDACTED]');
      });
    });

    it('should remove stack traces in production', () => {
      const obj = {
        error: 'Something went wrong',
        stack: 'Error: Something went wrong\n    at Object.<anonymous>...',
      };
      const result = sanitizeObject(obj, config) as Record<string, unknown>;
      expect(result['stack']).toBeUndefined();
    });

    it('should keep stack traces in development', () => {
      const devConfig = createConfig({ environment: 'development' });
      const obj = {
        error: 'Something went wrong',
        stack: 'Error: Something went wrong\n    at Object.<anonymous>...',
      };
      const result = sanitizeObject(obj, devConfig) as Record<string, unknown>;
      expect(result['stack']).toBeDefined();
    });

    it('should handle nested objects', () => {
      const obj = {
        user: {
          name: 'John',
          credentials: {
            password: 'secret',
            apiKey: 'key123',
          },
        },
      };
      const result = sanitizeObject(obj, config) as {
        user: { credentials: Record<string, unknown> };
      };
      expect(result.user.credentials['password']).toBe('[REDACTED]');
      expect(result.user.credentials['apiKey']).toBe('[REDACTED]');
    });

    it('should handle arrays', () => {
      const obj = {
        users: [
          { email: 'user1@example.com', password: 'pass1' },
          { email: 'user2@example.com', password: 'pass2' },
        ],
      };
      const result = sanitizeObject(obj, config) as {
        users: Array<{ password: string }>;
      };
      expect(result.users[0]['password']).toBe('[REDACTED]');
      expect(result.users[1]['password']).toBe('[REDACTED]');
    });

    it('should handle custom redact fields', () => {
      const customConfig = createConfig({ redactFields: ['customSecret'] });
      const obj = { customSecret: 'my-secret-value' };
      const result = sanitizeObject(obj, customConfig) as Record<
        string,
        unknown
      >;
      expect(result['customSecret']).toBe('[REDACTED]');
    });

    it('should handle null and undefined values', () => {
      const obj = { name: null, value: undefined };
      const result = sanitizeObject(obj, config) as Record<string, unknown>;
      expect(result['name']).toBeNull();
      expect(result['value']).toBeUndefined();
    });

    it('should prevent infinite recursion with deep nesting', () => {
      // Create deeply nested object
      let deep: Record<string, unknown> = { value: 'test' };
      for (let i = 0; i < 25; i++) {
        deep = { nested: deep };
      }

      // Should not throw and should return something
      expect(() => sanitizeObject(deep, config)).not.toThrow();
    });
  });

  describe('Error Response Sanitization', () => {
    let config: Required<ResponseSanitizerConfig>;

    beforeEach(() => {
      config = createConfig();
    });

    it('should sanitize internal error details in production', () => {
      const errorBody = {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: 'ECONNREFUSED - database connection failed',
        },
      };

      const result = sanitizeErrorResponse(errorBody, config) as {
        error: { details: string };
      };
      expect(result.error.details).toBe('An internal error occurred');
    });

    it('should sanitize prisma error details', () => {
      const errorBody = {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: 'prisma client error: unique constraint failed',
        },
      };

      const result = sanitizeErrorResponse(errorBody, config) as {
        error: { details: string };
      };
      expect(result.error.details).toBe('An internal error occurred');
    });

    it('should sanitize database error details', () => {
      const errorBody = {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: 'database connection timeout',
        },
      };

      const result = sanitizeErrorResponse(errorBody, config) as {
        error: { details: string };
      };
      expect(result.error.details).toBe('An internal error occurred');
    });

    it('should keep non-internal error details', () => {
      const errorBody = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: 'Email is required',
        },
      };

      const result = sanitizeErrorResponse(errorBody, config) as {
        error: { details: string };
      };
      expect(result.error.details).toBe('Email is required');
    });
  });

  describe('Statistics Tracking', () => {
    beforeEach(() => {
      resetSanitizationStats('test-service');
    });

    it('should track sanitization events', () => {
      trackSanitizationEvent('test-service', {
        type: 'pii',
        timestamp: new Date(),
      });
      trackSanitizationEvent('test-service', {
        type: 'stack_trace',
        timestamp: new Date(),
      });
      trackSanitizationEvent('test-service', {
        type: 'field',
        field: 'password',
        timestamp: new Date(),
      });

      const stats = getSanitizationStats('test-service');
      expect(stats?.piiRedacted).toBe(1);
      expect(stats?.stackTracesRemoved).toBe(1);
      expect(stats?.fieldsRedacted).toBe(1);
    });

    it('should track path sanitization', () => {
      trackSanitizationEvent('test-service', {
        type: 'path',
        timestamp: new Date(),
      });

      const stats = getSanitizationStats('test-service');
      expect(stats?.pathsSanitized).toBe(1);
    });

    it('should reset stats correctly', () => {
      trackSanitizationEvent('test-service', {
        type: 'pii',
        timestamp: new Date(),
      });
      resetSanitizationStats('test-service');

      const stats = getSanitizationStats('test-service');
      expect(stats).toBeUndefined();
    });

    it('should track stats for multiple services separately', () => {
      trackSanitizationEvent('service-a', {
        type: 'pii',
        timestamp: new Date(),
      });
      trackSanitizationEvent('service-a', {
        type: 'pii',
        timestamp: new Date(),
      });
      trackSanitizationEvent('service-b', {
        type: 'pii',
        timestamp: new Date(),
      });

      expect(getSanitizationStats('service-a')?.piiRedacted).toBe(2);
      expect(getSanitizationStats('service-b')?.piiRedacted).toBe(1);

      resetSanitizationStats('service-a');
      resetSanitizationStats('service-b');
    });
  });

  describe('Edge Cases', () => {
    let config: Required<ResponseSanitizerConfig>;

    beforeEach(() => {
      config = createConfig();
    });

    it('should handle empty objects', () => {
      const result = sanitizeObject({}, config);
      expect(result).toEqual({});
    });

    it('should handle empty strings', () => {
      const result = redactPiiFromString('', config);
      expect(result).toBe('');
    });

    it('should handle strings with no PII', () => {
      const input = 'This is a normal message without any sensitive data';
      const result = redactPiiFromString(input, config);
      expect(result).toBe(input);
    });

    it('should handle primitive values', () => {
      expect(sanitizeObject(42, config)).toBe(42);
      expect(sanitizeObject(true, config)).toBe(true);
      expect(sanitizeObject(null, config)).toBe(null);
    });

    it('should handle non-object error responses', () => {
      expect(sanitizeErrorResponse(null, config)).toBe(null);
      expect(sanitizeErrorResponse('string error', config)).toBe(
        'string error'
      );
      expect(sanitizeErrorResponse(123, config)).toBe(123);
    });
  });

  describe('PII Patterns Validation', () => {
    it('should have all expected PII patterns defined', () => {
      const expectedPatterns = [
        'email',
        'phone',
        'ssn',
        'creditCard',
        'ipv4',
        'jwt',
        'apiKey',
        'passwordInUrl',
        'bankAccount',
        'dob',
      ];

      for (const pattern of expectedPatterns) {
        expect(PII_PATTERNS).toHaveProperty(pattern);
        expect(
          PII_PATTERNS[pattern as keyof typeof PII_PATTERNS]
        ).toBeInstanceOf(RegExp);
      }
    });
  });

  describe('Sensitive Fields Validation', () => {
    it('should have all expected sensitive fields defined', () => {
      const expectedFields = [
        'password',
        'token',
        'accessToken',
        'refreshToken',
        'apiKey',
        'secret',
        'creditCard',
        'ssn',
      ];

      for (const field of expectedFields) {
        expect(SENSITIVE_FIELDS).toContain(field);
      }
    });
  });
});
