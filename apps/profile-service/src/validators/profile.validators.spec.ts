/**
 * Profile Validators - Unit Tests
 *
 * Tests for:
 * - XSS sanitization
 * - Phone number validation
 * - Timezone validation
 * - Language code validation
 * - Currency code validation
 * - Length limits
 */

import { ZodError } from 'zod';
import {
  updateProfileSchema,
  getPreferencesSchema,
  updatePreferencesSchema,
  sanitizeString,
} from './profile.validators';

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
  });

  it('should remove event handlers', () => {
    expect(sanitizeString('onclick=alert(1)')).toBe('alert(1)');
  });

  it('should remove null bytes', () => {
    expect(sanitizeString('hello\0world')).toBe('helloworld');
  });
});

// ============================================================================
// SCHEMAS: Update Profile Tests
// ============================================================================

describe('updateProfileSchema', () => {
  describe('phoneNumber', () => {
    it('should accept valid phone numbers', () => {
      const validPhones = [
        '+1234567890',
        '(123) 456-7890',
        '123-456-7890',
        '+1 (555) 123-4567',
        '555.123.4567',
      ];

      for (const phone of validPhones) {
        const result = updateProfileSchema.parse({ phoneNumber: phone });
        expect(result.phoneNumber).toBe(phone);
      }
    });

    it('should reject phone numbers shorter than 10 characters', () => {
      expect(() =>
        updateProfileSchema.parse({ phoneNumber: '12345' })
      ).toThrow(ZodError);
    });

    it('should reject phone numbers longer than 20 characters', () => {
      expect(() =>
        updateProfileSchema.parse({ phoneNumber: '123456789012345678901' })
      ).toThrow(ZodError);
    });

    it('should reject invalid phone number formats', () => {
      const invalidPhones = [
        'abc-def-ghij',
        '<script>alert(1)</script>',
        'phone: 123',
      ];

      for (const phone of invalidPhones) {
        expect(() =>
          updateProfileSchema.parse({ phoneNumber: phone })
        ).toThrow(ZodError);
      }
    });
  });

  describe('address', () => {
    it('should accept valid addresses', () => {
      const result = updateProfileSchema.parse({
        address: '123 Main Street, City, State 12345',
      });
      expect(result.address).toBe('123 Main Street, City, State 12345');
    });

    it('should sanitize address field', () => {
      const result = updateProfileSchema.parse({
        address: '<script>alert("xss")</script>123 Main St',
      });
      expect(result.address).toBe('alert("xss")123 Main St');
    });

    it('should reject address longer than 500 characters', () => {
      expect(() =>
        updateProfileSchema.parse({ address: 'a'.repeat(501) })
      ).toThrow(ZodError);
    });

    it('should reject empty address', () => {
      expect(() => updateProfileSchema.parse({ address: '' })).toThrow(
        ZodError
      );
    });
  });

  describe('bio', () => {
    it('should accept valid bio', () => {
      const result = updateProfileSchema.parse({
        bio: 'This is my bio. I like coding.',
      });
      expect(result.bio).toBe('This is my bio. I like coding.');
    });

    it('should sanitize bio field', () => {
      const result = updateProfileSchema.parse({
        bio: '<b>Bold</b> text with <script>xss</script>',
      });
      expect(result.bio).toBe('Bold text with xss');
    });

    it('should reject bio longer than 1000 characters', () => {
      expect(() =>
        updateProfileSchema.parse({ bio: 'a'.repeat(1001) })
      ).toThrow(ZodError);
    });

    it('should accept empty bio', () => {
      const result = updateProfileSchema.parse({ bio: '' });
      expect(result.bio).toBe('');
    });
  });

  describe('avatarUrl', () => {
    it('should accept valid URLs', () => {
      const validUrls = [
        'https://example.com/avatar.jpg',
        'http://cdn.example.com/images/user.png',
      ];

      for (const url of validUrls) {
        const result = updateProfileSchema.parse({ avatarUrl: url });
        expect(result.avatarUrl).toBe(url);
      }
    });

    it('should accept base64 data URLs', () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const result = updateProfileSchema.parse({ avatarUrl: dataUrl });
      expect(result.avatarUrl).toBe(dataUrl);
    });

    it('should accept empty string to clear avatar', () => {
      const result = updateProfileSchema.parse({ avatarUrl: '' });
      expect(result.avatarUrl).toBe('');
    });

    it('should reject invalid URLs', () => {
      expect(() =>
        updateProfileSchema.parse({ avatarUrl: 'not-a-url' })
      ).toThrow(ZodError);
    });
  });
});

// ============================================================================
// SCHEMAS: Get Preferences Tests
// ============================================================================

describe('getPreferencesSchema', () => {
  it('should accept valid category', () => {
    const result = getPreferencesSchema.parse({ category: 'notifications' });
    expect(result.category).toBe('notifications');
  });

  it('should sanitize category field', () => {
    const result = getPreferencesSchema.parse({
      category: '<script>xss</script>notifications',
    });
    expect(result.category).toBe('xssnotifications');
  });

  it('should reject category longer than 100 characters', () => {
    expect(() =>
      getPreferencesSchema.parse({ category: 'a'.repeat(101) })
    ).toThrow(ZodError);
  });

  it('should accept empty object', () => {
    const result = getPreferencesSchema.parse({});
    expect(result.category).toBeUndefined();
  });
});

// ============================================================================
// SCHEMAS: Update Preferences Tests
// ============================================================================

describe('updatePreferencesSchema', () => {
  describe('theme', () => {
    it('should accept valid theme values', () => {
      const validThemes = ['light', 'dark', 'system'] as const;

      for (const theme of validThemes) {
        const result = updatePreferencesSchema.parse({ theme });
        expect(result.theme).toBe(theme);
      }
    });

    it('should reject invalid theme values', () => {
      expect(() =>
        updatePreferencesSchema.parse({ theme: 'invalid' })
      ).toThrow(ZodError);
    });
  });

  describe('language', () => {
    it('should accept valid language codes', () => {
      const validLanguages = ['en', 'es', 'en-US', 'zh-CN'];

      for (const language of validLanguages) {
        const result = updatePreferencesSchema.parse({ language });
        expect(result.language).toBe(language);
      }
    });

    it('should reject invalid language codes', () => {
      const invalidLanguages = ['english', 'e', 'en-us', 'EN-US', 'en_US'];

      for (const language of invalidLanguages) {
        expect(() =>
          updatePreferencesSchema.parse({ language })
        ).toThrow(ZodError);
      }
    });
  });

  describe('currency', () => {
    it('should accept valid currency codes', () => {
      const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY'];

      for (const currency of validCurrencies) {
        const result = updatePreferencesSchema.parse({ currency });
        expect(result.currency).toBe(currency);
      }
    });

    it('should transform lowercase to uppercase', () => {
      const result = updatePreferencesSchema.parse({ currency: 'usd' });
      expect(result.currency).toBe('USD');
    });

    it('should reject invalid currency codes', () => {
      const invalidCurrencies = ['US', 'USDD', '123', 'U$D'];

      for (const currency of invalidCurrencies) {
        expect(() =>
          updatePreferencesSchema.parse({ currency })
        ).toThrow(ZodError);
      }
    });
  });

  describe('timezone', () => {
    it('should accept valid timezone formats', () => {
      const validTimezones = ['America/New_York', 'Europe/London', 'UTC'];

      for (const timezone of validTimezones) {
        const result = updatePreferencesSchema.parse({ timezone });
        expect(result.timezone).toBe(timezone);
      }
    });

    it('should accept multi-part IANA timezone formats', () => {
      const multiPartTimezones = [
        'America/Indiana/Indianapolis',
        'America/Argentina/Buenos_Aires',
        'America/Kentucky/Louisville',
      ];

      for (const timezone of multiPartTimezones) {
        const result = updatePreferencesSchema.parse({ timezone });
        expect(result.timezone).toBe(timezone);
      }
    });

    it('should reject invalid timezone formats', () => {
      const invalidTimezones = [
        'EST',
        'Eastern',
        'America',
        '<script>xss</script>',
      ];

      for (const timezone of invalidTimezones) {
        expect(() =>
          updatePreferencesSchema.parse({ timezone })
        ).toThrow(ZodError);
      }
    });

    it('should reject timezone longer than 50 characters', () => {
      expect(() =>
        updatePreferencesSchema.parse({ timezone: 'a'.repeat(51) + '/b' })
      ).toThrow(ZodError);
    });
  });

  describe('notifications', () => {
    it('should accept valid notification preferences', () => {
      const result = updatePreferencesSchema.parse({
        notifications: {
          email: true,
          push: false,
          sms: true,
        },
      });

      expect(result.notifications).toEqual({
        email: true,
        push: false,
        sms: true,
      });
    });

    it('should accept partial notification preferences', () => {
      const result = updatePreferencesSchema.parse({
        notifications: {
          email: true,
        },
      });

      expect(result.notifications?.email).toBe(true);
      expect(result.notifications?.push).toBeUndefined();
    });

    it('should reject non-boolean notification values', () => {
      expect(() =>
        updatePreferencesSchema.parse({
          notifications: {
            email: 'yes',
          },
        })
      ).toThrow(ZodError);
    });
  });

  it('should accept empty object for partial updates', () => {
    const result = updatePreferencesSchema.parse({});
    expect(result).toEqual({});
  });

  it('should accept multiple valid fields', () => {
    const result = updatePreferencesSchema.parse({
      theme: 'dark',
      language: 'en-US',
      currency: 'eur',
      timezone: 'America/New_York',
      notifications: {
        email: true,
      },
    });

    expect(result.theme).toBe('dark');
    expect(result.language).toBe('en-US');
    expect(result.currency).toBe('EUR');
    expect(result.timezone).toBe('America/New_York');
    expect(result.notifications?.email).toBe(true);
  });
});
