/**
 * Security Headers Middleware - Unit Tests
 *
 * Tests that Helmet security headers are properly configured
 */

import request from 'supertest';
import express from 'express';
import helmet from 'helmet';

describe('Security Headers Middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();

    // Apply the same Helmet configuration as in main.ts
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
          },
        },
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        },
        frameguard: {
          action: 'deny',
        },
        noSniff: true,
        xssFilter: true,
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      })
    );

    // Add a test route
    app.get('/test', (_req, res) => {
      res.json({ message: 'ok' });
    });
  });

  describe('Content-Security-Policy', () => {
    it('should include Content-Security-Policy header', async () => {
      const response = await request(app).get('/test');

      expect(response.headers['content-security-policy']).toBeDefined();
    });

    it('should have correct CSP directives', async () => {
      const response = await request(app).get('/test');
      const csp = response.headers['content-security-policy'];

      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("style-src 'self' 'unsafe-inline'");
      expect(csp).toContain("script-src 'self'");
      expect(csp).toContain("img-src 'self' data: https:");
    });
  });

  describe('Strict-Transport-Security (HSTS)', () => {
    it('should include Strict-Transport-Security header', async () => {
      const response = await request(app).get('/test');

      expect(response.headers['strict-transport-security']).toBeDefined();
    });

    it('should have correct HSTS configuration', async () => {
      const response = await request(app).get('/test');
      const hsts = response.headers['strict-transport-security'];

      expect(hsts).toContain('max-age=31536000');
      expect(hsts).toContain('includeSubDomains');
      expect(hsts).toContain('preload');
    });
  });

  describe('X-Frame-Options', () => {
    it('should include X-Frame-Options header', async () => {
      const response = await request(app).get('/test');

      expect(response.headers['x-frame-options']).toBeDefined();
    });

    it('should deny framing', async () => {
      const response = await request(app).get('/test');

      expect(response.headers['x-frame-options']).toBe('DENY');
    });
  });

  describe('X-Content-Type-Options', () => {
    it('should include X-Content-Type-Options header', async () => {
      const response = await request(app).get('/test');

      expect(response.headers['x-content-type-options']).toBeDefined();
    });

    it('should prevent MIME type sniffing', async () => {
      const response = await request(app).get('/test');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });
  });

  describe('Cross-Origin-Resource-Policy', () => {
    it('should include Cross-Origin-Resource-Policy header', async () => {
      const response = await request(app).get('/test');

      expect(response.headers['cross-origin-resource-policy']).toBeDefined();
    });

    it('should allow cross-origin requests (for MFE frontend)', async () => {
      const response = await request(app).get('/test');

      expect(response.headers['cross-origin-resource-policy']).toBe(
        'cross-origin'
      );
    });
  });

  describe('Cross-Origin-Opener-Policy', () => {
    it('should include Cross-Origin-Opener-Policy header', async () => {
      const response = await request(app).get('/test');

      expect(response.headers['cross-origin-opener-policy']).toBeDefined();
    });

    it('should allow popups for OAuth flows', async () => {
      const response = await request(app).get('/test');

      expect(response.headers['cross-origin-opener-policy']).toBe(
        'same-origin-allow-popups'
      );
    });
  });

  describe('X-XSS-Protection', () => {
    it('should include X-XSS-Protection header (legacy)', async () => {
      const response = await request(app).get('/test');

      // Note: Helmet sets this to "0" by default as the feature is deprecated
      // in modern browsers and CSP is preferred
      expect(response.headers['x-xss-protection']).toBeDefined();
    });
  });

  describe('X-DNS-Prefetch-Control', () => {
    it('should include X-DNS-Prefetch-Control header', async () => {
      const response = await request(app).get('/test');

      expect(response.headers['x-dns-prefetch-control']).toBeDefined();
    });
  });

  describe('X-Download-Options', () => {
    it('should include X-Download-Options header', async () => {
      const response = await request(app).get('/test');

      expect(response.headers['x-download-options']).toBe('noopen');
    });
  });

  describe('X-Permitted-Cross-Domain-Policies', () => {
    it('should include X-Permitted-Cross-Domain-Policies header', async () => {
      const response = await request(app).get('/test');

      expect(response.headers['x-permitted-cross-domain-policies']).toBe(
        'none'
      );
    });
  });

  describe('Referrer-Policy', () => {
    it('should include Referrer-Policy header', async () => {
      const response = await request(app).get('/test');

      expect(response.headers['referrer-policy']).toBeDefined();
    });
  });

  describe('Missing dangerous headers', () => {
    it('should not include X-Powered-By header', async () => {
      const response = await request(app).get('/test');

      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });
});
