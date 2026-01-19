/**
 * API Versioning Middleware Tests
 *
 * POC-3 Phase 6.4: API Versioning
 */

import { Response, NextFunction } from 'express';
import {
  apiVersionMiddleware,
  setVersionConfig,
  getVersionConfig,
  requireVersion,
  versionedHandler,
  defaultVersionConfig,
  VersionedRequest,
} from './apiVersion';

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

describe('API Versioning Middleware', () => {
  let mockReq: Partial<VersionedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let responseHeaders: Record<string, string>;

  beforeEach(() => {
    // Reset version config to defaults
    setVersionConfig(defaultVersionConfig);

    responseHeaders = {};

    mockReq = {
      path: '/api/auth/login',
      url: '/api/auth/login',
      originalUrl: '/api/auth/login',
      method: 'POST',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue(undefined),
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn((name: string, value: string) => {
        responseHeaders[name] = value;
        return mockRes;
      }),
    };

    mockNext = jest.fn();
  });

  describe('setVersionConfig', () => {
    it('should update version configuration', () => {
      setVersionConfig({
        supportedVersions: [1, 2],
        latestVersion: 2,
      });

      const config = getVersionConfig();
      expect(config.supportedVersions).toEqual([1, 2]);
      expect(config.latestVersion).toBe(2);
    });

    it('should merge with existing config', () => {
      setVersionConfig({
        defaultVersion: 2,
      });

      const config = getVersionConfig();
      expect(config.defaultVersion).toBe(2);
      expect(config.supportedVersions).toEqual([1]); // Unchanged from default
    });
  });

  describe('URL-based versioning', () => {
    it('should extract version from URL path /api/v1/', () => {
      mockReq.path = '/api/v1/auth/login';
      mockReq.url = '/api/v1/auth/login';

      apiVersionMiddleware(
        mockReq as VersionedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockReq.apiVersion).toBe(1);
      expect(mockReq.apiVersionSource).toBe('url');
      expect(mockReq.url).toBe('/api/auth/login');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should extract version v2 from URL', () => {
      setVersionConfig({ supportedVersions: [1, 2] });
      mockReq.path = '/api/v2/payments';
      mockReq.url = '/api/v2/payments';

      apiVersionMiddleware(
        mockReq as VersionedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockReq.apiVersion).toBe(2);
      expect(mockReq.apiVersionSource).toBe('url');
      expect(mockReq.url).toBe('/api/payments');
    });

    it('should preserve query string when stripping version', () => {
      mockReq.path = '/api/v1/auth/login';
      mockReq.url = '/api/v1/auth/login?redirect=/dashboard';

      apiVersionMiddleware(
        mockReq as VersionedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockReq.url).toBe('/api/auth/login?redirect=/dashboard');
    });

    it('should handle root versioned path', () => {
      mockReq.path = '/api/v1';
      mockReq.url = '/api/v1';

      apiVersionMiddleware(
        mockReq as VersionedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockReq.apiVersion).toBe(1);
      expect(mockReq.url).toBe('/api');
    });
  });

  describe('Header-based versioning', () => {
    it('should extract version from Accept header (version=N format)', () => {
      mockReq.path = '/api/auth/login';
      mockReq.url = '/api/auth/login';
      (mockReq.get as jest.Mock).mockReturnValue(
        'application/vnd.api+json; version=1'
      );

      apiVersionMiddleware(
        mockReq as VersionedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockReq.apiVersion).toBe(1);
      expect(mockReq.apiVersionSource).toBe('header');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should extract version from Accept header (vnd.api.vN format)', () => {
      mockReq.path = '/api/auth/login';
      mockReq.url = '/api/auth/login';
      (mockReq.get as jest.Mock).mockReturnValue('application/vnd.api.v1+json');

      apiVersionMiddleware(
        mockReq as VersionedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockReq.apiVersion).toBe(1);
      expect(mockReq.apiVersionSource).toBe('header');
    });

    it('should prioritize URL version over header version', () => {
      setVersionConfig({ supportedVersions: [1, 2] });
      mockReq.path = '/api/v2/auth/login';
      mockReq.url = '/api/v2/auth/login';
      (mockReq.get as jest.Mock).mockReturnValue(
        'application/vnd.api+json; version=1'
      );

      apiVersionMiddleware(
        mockReq as VersionedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockReq.apiVersion).toBe(2); // URL takes precedence
      expect(mockReq.apiVersionSource).toBe('url');
    });
  });

  describe('Default version fallback', () => {
    it('should use default version when no version specified', () => {
      mockReq.path = '/api/auth/login';
      mockReq.url = '/api/auth/login';

      apiVersionMiddleware(
        mockReq as VersionedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockReq.apiVersion).toBe(1); // Default
      expect(mockReq.apiVersionSource).toBe('default');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject unversioned requests when allowUnversioned is false', () => {
      setVersionConfig({ allowUnversioned: false });
      mockReq.path = '/api/auth/login';
      mockReq.url = '/api/auth/login';

      apiVersionMiddleware(
        mockReq as VersionedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'API_VERSION_REQUIRED',
          }),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Version validation', () => {
    it('should reject unsupported version', () => {
      mockReq.path = '/api/v99/auth/login';
      mockReq.url = '/api/v99/auth/login';

      apiVersionMiddleware(
        mockReq as VersionedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'UNSUPPORTED_API_VERSION',
            message: 'API version 99 is not supported',
          }),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Response headers', () => {
    it('should add version headers to response', () => {
      apiVersionMiddleware(
        mockReq as VersionedRequest,
        mockRes as Response,
        mockNext
      );

      expect(responseHeaders['X-API-Version']).toBe('1');
      expect(responseHeaders['X-API-Version-Source']).toBe('default');
      expect(responseHeaders['X-API-Latest-Version']).toBe('1');
      expect(responseHeaders['X-API-Supported-Versions']).toBe('1');
    });

    it('should add multiple supported versions to header', () => {
      setVersionConfig({ supportedVersions: [1, 2, 3], latestVersion: 3 });

      apiVersionMiddleware(
        mockReq as VersionedRequest,
        mockRes as Response,
        mockNext
      );

      expect(responseHeaders['X-API-Supported-Versions']).toBe('1, 2, 3');
      expect(responseHeaders['X-API-Latest-Version']).toBe('3');
    });
  });

  describe('Deprecation warnings', () => {
    beforeEach(() => {
      setVersionConfig({
        supportedVersions: [1, 2],
        latestVersion: 2,
        deprecatedVersions: [
          {
            version: 1,
            sunsetDate: '2027-01-01',
            message: 'Please migrate to v2 for new features',
          },
        ],
      });
    });

    it('should add deprecation headers for deprecated version', () => {
      mockReq.path = '/api/v1/auth/login';
      mockReq.url = '/api/v1/auth/login';

      apiVersionMiddleware(
        mockReq as VersionedRequest,
        mockRes as Response,
        mockNext
      );

      expect(responseHeaders['Deprecation']).toBe('true');
      expect(responseHeaders['Sunset']).toBeDefined();
      expect(responseHeaders['X-API-Deprecation-Warning']).toContain(
        'Please migrate to v2'
      );
      expect(responseHeaders['Warning']).toContain('299');
      expect(mockNext).toHaveBeenCalled(); // Still allows request through
    });

    it('should not add deprecation headers for non-deprecated version', () => {
      setVersionConfig({ supportedVersions: [1, 2] });
      mockReq.path = '/api/v2/auth/login';
      mockReq.url = '/api/v2/auth/login';

      apiVersionMiddleware(
        mockReq as VersionedRequest,
        mockRes as Response,
        mockNext
      );

      expect(responseHeaders['Deprecation']).toBeUndefined();
      expect(responseHeaders['Sunset']).toBeUndefined();
    });

    it('should include Link header with successor version', () => {
      mockReq.path = '/api/v1/auth/login';
      mockReq.url = '/api/v1/auth/login';

      apiVersionMiddleware(
        mockReq as VersionedRequest,
        mockRes as Response,
        mockNext
      );

      expect(responseHeaders['Link']).toContain('rel="successor-version"');
      expect(responseHeaders['Link']).toContain('/api/v2');
    });
  });

  describe('requireVersion middleware', () => {
    it('should allow request with matching version', () => {
      mockReq.apiVersion = 1;

      const middleware = requireVersion(1);
      middleware(mockReq as VersionedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should allow request when version matches any allowed', () => {
      mockReq.apiVersion = 2;

      const middleware = requireVersion(1, 2, 3);
      middleware(mockReq as VersionedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject request with non-matching version', () => {
      mockReq.apiVersion = 1;

      const middleware = requireVersion(2, 3);
      middleware(mockReq as VersionedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'VERSION_NOT_SUPPORTED_FOR_ROUTE',
            requestedVersion: 1,
            supportedVersionsForRoute: [2, 3],
          }),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('versionedHandler middleware', () => {
    it('should route to correct handler based on version', () => {
      const v1Handler = jest.fn();
      const v2Handler = jest.fn();

      mockReq.apiVersion = 2;

      const middleware = versionedHandler({
        1: v1Handler,
        2: v2Handler,
      });
      middleware(mockReq as VersionedRequest, mockRes as Response, mockNext);

      expect(v2Handler).toHaveBeenCalled();
      expect(v1Handler).not.toHaveBeenCalled();
    });

    it('should use default handler when version has no specific handler', () => {
      const v1Handler = jest.fn();
      const defaultHandler = jest.fn();

      mockReq.apiVersion = 3;

      const middleware = versionedHandler({
        1: v1Handler,
        default: defaultHandler,
      });
      middleware(mockReq as VersionedRequest, mockRes as Response, mockNext);

      expect(defaultHandler).toHaveBeenCalled();
      expect(v1Handler).not.toHaveBeenCalled();
    });

    it('should return error when no handler available', () => {
      const v1Handler = jest.fn();

      mockReq.apiVersion = 3;

      const middleware = versionedHandler({
        1: v1Handler,
      });
      middleware(mockReq as VersionedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'NO_HANDLER_FOR_VERSION',
            requestedVersion: 3,
          }),
        })
      );
    });
  });
});
