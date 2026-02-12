/**
 * Tests for Remote URL Validator
 *
 * Tests URL validation for Module Federation remotes
 */

import {
  validateRemoteUrl,
  RemoteUrlValidator,
  isRemoteUrlValid,
  getDefaultAllowedOrigins,
  createBuildTimeValidator,
} from './remote-url-validator';

describe('Remote URL Validator', () => {
  describe('validateRemoteUrl', () => {
    describe('valid URLs', () => {
      it('should accept localhost URLs in development', () => {
        const result = validateRemoteUrl(
          'http://localhost:4201/remoteEntry.js'
        );
        expect(result.valid).toBe(true);
        expect(result.origin).toBe('http://localhost:4201');
        expect(result.pathname).toBe('/remoteEntry.js');
      });

      it('should accept HTTPS localhost URLs', () => {
        const result = validateRemoteUrl(
          'https://localhost/remoteEntry.js'
        );
        expect(result.valid).toBe(true);
      });

      it('should accept MFE proxy paths', () => {
        const result = validateRemoteUrl(
          'https://localhost/mfe/auth/remoteEntry.js'
        );
        expect(result.valid).toBe(true);
      });

      it('should accept custom allowed origins', () => {
        const result = validateRemoteUrl(
          'https://cdn.example.com/remoteEntry.js',
          { allowedOrigins: ['https://cdn.example.com'] }
        );
        expect(result.valid).toBe(true);
      });

      it('should accept wildcard port patterns', () => {
        const result = validateRemoteUrl(
          'http://localhost:9999/remoteEntry.js',
          { allowedOrigins: ['http://localhost:*'] }
        );
        expect(result.valid).toBe(true);
      });

      it('should accept wildcard subdomain patterns', () => {
        const result = validateRemoteUrl(
          'https://mfe.cdn.example.com/remoteEntry.js',
          { allowedOrigins: ['https://*.example.com'] }
        );
        expect(result.valid).toBe(true);
      });

      it('should include matched rule in result', () => {
        const result = validateRemoteUrl(
          'http://localhost:4201/remoteEntry.js',
          { allowedOrigins: ['http://localhost'] }
        );
        expect(result.valid).toBe(true);
        expect(result.matchedRule).toContain('http://localhost');
      });
    });

    describe('invalid URLs', () => {
      it('should reject URLs from unknown origins', () => {
        const result = validateRemoteUrl(
          'http://evil-site.com/remoteEntry.js',
          { allowedOrigins: ['http://localhost'] }
        );
        expect(result.valid).toBe(false);
        expect(result.error).toContain('not in allowlist');
      });

      it('should reject malformed URLs', () => {
        const result = validateRemoteUrl('not-a-valid-url');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Invalid URL format');
      });

      it('should reject javascript: URLs', () => {
        const result = validateRemoteUrl('javascript:alert(1)');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('dangerous pattern');
      });

      it('should reject data: URLs', () => {
        const result = validateRemoteUrl(
          'data:text/javascript,alert(1)'
        );
        expect(result.valid).toBe(false);
        expect(result.error).toContain('dangerous pattern');
      });

      it('should reject file: URLs', () => {
        const result = validateRemoteUrl('file:///etc/passwd');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('dangerous pattern');
      });

      it('should reject URLs with credentials', () => {
        const result = validateRemoteUrl(
          'http://user:pass@localhost:4201/remoteEntry.js'
        );
        expect(result.valid).toBe(false);
        expect(result.error).toContain('dangerous pattern');
      });

      it('should reject non-remoteEntry.js paths', () => {
        const result = validateRemoteUrl(
          'http://localhost:4201/malicious.js',
          { allowedOrigins: ['http://localhost'] }
        );
        expect(result.valid).toBe(false);
        expect(result.error).toContain('does not match remoteEntry.js pattern');
      });

      it('should reject disallowed protocols in production mode', () => {
        const result = validateRemoteUrl(
          'http://localhost:4201/remoteEntry.js',
          { allowedProtocols: ['https:'] }
        );
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Protocol not allowed');
      });

      it('should reject paths not in allowlist when paths are specified', () => {
        const result = validateRemoteUrl(
          'http://localhost:4201/other/remoteEntry.js',
          {
            allowedOrigins: ['http://localhost'],
            allowedPaths: ['/remoteEntry.js'],
          }
        );
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Path not in allowlist');
      });
    });

    describe('path pattern matching', () => {
      it('should match exact paths', () => {
        const result = validateRemoteUrl(
          'http://localhost:4201/remoteEntry.js',
          {
            allowedOrigins: ['http://localhost'],
            allowedPaths: ['/remoteEntry.js'],
          }
        );
        expect(result.valid).toBe(true);
      });

      it('should match wildcard paths', () => {
        const result = validateRemoteUrl(
          'http://localhost:4201/mfe/auth/remoteEntry.js',
          {
            allowedOrigins: ['http://localhost'],
            allowedPaths: ['/mfe/*/remoteEntry.js'],
          }
        );
        expect(result.valid).toBe(true);
      });

      it('should match double wildcard paths', () => {
        const result = validateRemoteUrl(
          'http://localhost:4201/cdn/v1/mfe/auth/remoteEntry.js',
          {
            allowedOrigins: ['http://localhost'],
            allowedPaths: ['/**/remoteEntry.js'],
          }
        );
        expect(result.valid).toBe(true);
      });
    });

    describe('custom validator', () => {
      it('should run custom validator when provided', () => {
        const customValidator = jest.fn().mockReturnValue(true);
        const result = validateRemoteUrl(
          'http://localhost:4201/remoteEntry.js',
          {
            allowedOrigins: ['http://localhost'],
            customValidator,
          }
        );
        expect(result.valid).toBe(true);
        expect(customValidator).toHaveBeenCalled();
      });

      it('should reject when custom validator returns false', () => {
        const result = validateRemoteUrl(
          'http://localhost:4201/remoteEntry.js',
          {
            allowedOrigins: ['http://localhost'],
            customValidator: () => false,
          }
        );
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Custom validation failed');
      });
    });

    describe('dangerous pattern blocking', () => {
      it('should block encoded path traversal', () => {
        const result = validateRemoteUrl(
          'http://localhost:4201/%2f%2f../remoteEntry.js'
        );
        expect(result.valid).toBe(false);
      });

      it('should block encoded backslash', () => {
        const result = validateRemoteUrl(
          'http://localhost:4201/%5cremoteEntry.js'
        );
        expect(result.valid).toBe(false);
      });

      it('should allow disabling dangerous pattern blocking', () => {
        // Note: This is for edge cases only - not recommended
        const result = validateRemoteUrl(
          'http://localhost:4201/remoteEntry.js',
          {
            allowedOrigins: ['http://localhost'],
            blockDangerousPatterns: false,
          }
        );
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('RemoteUrlValidator class', () => {
    it('should cache validation results', () => {
      const validator = new RemoteUrlValidator({
        allowedOrigins: ['http://localhost'],
      });

      const url = 'http://localhost:4201/remoteEntry.js';
      const result1 = validator.validate(url);
      const result2 = validator.validate(url);

      // Should return same cached result
      expect(result1).toBe(result2);
    });

    it('should clear cache when rules change', () => {
      const validator = new RemoteUrlValidator({
        allowedOrigins: ['http://localhost'],
      });

      const url = 'http://localhost:4201/remoteEntry.js';
      validator.validate(url);

      // Add new origin - should clear cache
      validator.addAllowedOrigin('https://cdn.example.com');

      // Cache should be cleared
      expect(validator['validationCache'].size).toBe(0);
    });

    it('should provide isValid convenience method', () => {
      const validator = new RemoteUrlValidator({
        allowedOrigins: ['http://localhost'],
      });

      expect(validator.isValid('http://localhost:4201/remoteEntry.js')).toBe(
        true
      );
      expect(validator.isValid('http://evil.com/remoteEntry.js')).toBe(false);
    });

    it('should validate rspack remotes config', () => {
      const validator = new RemoteUrlValidator({
        allowedOrigins: ['http://localhost'],
      });

      const remotes = {
        authMfe: 'authMfe@http://localhost:4201/remoteEntry.js',
        paymentsMfe: 'paymentsMfe@http://localhost:4202/remoteEntry.js',
        evilMfe: 'evilMfe@http://evil.com/remoteEntry.js',
      };

      const invalidRemotes = validator.validateRemotesConfig(remotes);

      expect(invalidRemotes).toHaveLength(1);
      expect(invalidRemotes[0].name).toBe('evilMfe');
    });

    it('should allow adding origins dynamically', () => {
      const validator = new RemoteUrlValidator({
        allowedOrigins: ['http://localhost'],
      });

      expect(validator.isValid('https://cdn.example.com/remoteEntry.js')).toBe(
        false
      );

      validator.addAllowedOrigin('https://cdn.example.com');

      expect(validator.isValid('https://cdn.example.com/remoteEntry.js')).toBe(
        true
      );
    });

    it('should allow adding paths dynamically', () => {
      const validator = new RemoteUrlValidator({
        allowedOrigins: ['http://localhost'],
        allowedPaths: ['/remoteEntry.js'],
      });

      expect(
        validator.isValid('http://localhost:4201/v2/remoteEntry.js')
      ).toBe(false);

      validator.addAllowedPath('/v2/remoteEntry.js');

      expect(
        validator.isValid('http://localhost:4201/v2/remoteEntry.js')
      ).toBe(true);
    });

    it('should return allowed origins', () => {
      const validator = new RemoteUrlValidator({
        allowedOrigins: ['http://localhost', 'https://cdn.example.com'],
      });

      expect(validator.getAllowedOrigins()).toEqual([
        'http://localhost',
        'https://cdn.example.com',
      ]);
    });
  });

  describe('helper functions', () => {
    it('isRemoteUrlValid should use default validator', () => {
      expect(
        isRemoteUrlValid('http://localhost:4201/remoteEntry.js')
      ).toBe(true);
      expect(isRemoteUrlValid('http://evil.com/remoteEntry.js')).toBe(false);
    });

    it('getDefaultAllowedOrigins should return array', () => {
      const origins = getDefaultAllowedOrigins();
      expect(Array.isArray(origins)).toBe(true);
      expect(origins.length).toBeGreaterThan(0);
      expect(origins).toContain('http://localhost');
    });

    it('createBuildTimeValidator should create validator with custom origins', () => {
      const validator = createBuildTimeValidator([
        'https://cdn.example.com',
        'http://cdn.example.com',
      ]);

      expect(
        validator.isValid('https://cdn.example.com/remoteEntry.js')
      ).toBe(true);
      // Build time validator allows both http and https protocols
      expect(
        validator.isValid('http://cdn.example.com/remoteEntry.js')
      ).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle URLs with query strings', () => {
      const result = validateRemoteUrl(
        'http://localhost:4201/remoteEntry.js?v=123',
        { allowedOrigins: ['http://localhost'] }
      );
      expect(result.valid).toBe(true);
    });

    it('should handle URLs with fragments', () => {
      const result = validateRemoteUrl(
        'http://localhost:4201/remoteEntry.js#section',
        { allowedOrigins: ['http://localhost'] }
      );
      expect(result.valid).toBe(true);
    });

    it('should handle IPv4 addresses', () => {
      const result = validateRemoteUrl(
        'http://127.0.0.1:4201/remoteEntry.js',
        { allowedOrigins: ['http://127.0.0.1'] }
      );
      expect(result.valid).toBe(true);
    });

    it('should handle IPv6 addresses', () => {
      const result = validateRemoteUrl(
        'http://[::1]:4201/remoteEntry.js',
        { allowedOrigins: ['http://[::1]'] }
      );
      expect(result.valid).toBe(true);
    });

    it('should handle empty options gracefully', () => {
      const result = validateRemoteUrl(
        'http://localhost:4201/remoteEntry.js',
        {}
      );
      // Should use defaults
      expect(result.valid).toBe(true);
    });
  });
});
