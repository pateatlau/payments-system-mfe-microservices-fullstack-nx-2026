/**
 * Request Size Limits Middleware Tests
 */

import {
  parseSize,
  formatBytes,
  createUrlLengthMiddleware,
  createHeaderSizeMiddleware,
  createParameterCountMiddleware,
  createRequestLimitsMiddleware,
  getBodyParserOptions,
  bodyParserErrorHandler,
  trackLimitViolation,
  getRequestLimitsStats,
  resetRequestLimitsStats,
  DEFAULT_LIMITS,
} from './request-limits';
import type { Request, Response } from 'express';

// Mock Request, Response, and NextFunction
function createMockRequest(
  overrides: Partial<Request> = {}
): Request {
  return {
    originalUrl: '/api/test',
    path: '/api/test',
    headers: {},
    query: {},
    body: {},
    ...overrides,
  } as Request;
}

function createMockResponse(): Response & {
  statusCode: number;
  body: unknown;
  status: jest.Mock;
  json: jest.Mock;
} {
  const res = {
    statusCode: 200,
    body: null as unknown,
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockImplementation(function (this: Response & { body: unknown }, data: unknown) {
      this.body = data;
      return this;
    }),
  } as Response & {
    statusCode: number;
    body: unknown;
    status: jest.Mock;
    json: jest.Mock;
  };
  res.status.mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });
  return res;
}

describe('Request Limits Middleware', () => {
  describe('parseSize', () => {
    it('should parse bytes', () => {
      expect(parseSize('1024b')).toBe(1024);
      expect(parseSize('100')).toBe(100);
      expect(parseSize(500)).toBe(500);
    });

    it('should parse kilobytes', () => {
      expect(parseSize('1kb')).toBe(1024);
      expect(parseSize('10kb')).toBe(10240);
      expect(parseSize('1.5kb')).toBe(1536);
    });

    it('should parse megabytes', () => {
      expect(parseSize('1mb')).toBe(1048576);
      expect(parseSize('10mb')).toBe(10485760);
      expect(parseSize('0.5mb')).toBe(524288);
    });

    it('should parse gigabytes', () => {
      expect(parseSize('1gb')).toBe(1073741824);
    });

    it('should handle case insensitivity', () => {
      expect(parseSize('1KB')).toBe(1024);
      expect(parseSize('1MB')).toBe(1048576);
      expect(parseSize('1Mb')).toBe(1048576);
    });

    it('should throw on invalid format', () => {
      expect(() => parseSize('invalid')).toThrow('Invalid size format');
      expect(() => parseSize('abc')).toThrow('Invalid size format');
    });
  });

  describe('formatBytes', () => {
    it('should format bytes', () => {
      expect(formatBytes(100)).toBe('100B');
      expect(formatBytes(1023)).toBe('1023B');
    });

    it('should format kilobytes', () => {
      expect(formatBytes(1024)).toBe('1.0KB');
      expect(formatBytes(1536)).toBe('1.5KB');
      expect(formatBytes(10240)).toBe('10.0KB');
    });

    it('should format megabytes', () => {
      expect(formatBytes(1048576)).toBe('1.0MB');
      expect(formatBytes(5242880)).toBe('5.0MB');
    });

    it('should format gigabytes', () => {
      expect(formatBytes(1073741824)).toBe('1.0GB');
    });
  });

  describe('createUrlLengthMiddleware', () => {
    it('should allow URLs within limit', () => {
      const middleware = createUrlLengthMiddleware({ maxUrlLength: 100 });
      const req = createMockRequest({ originalUrl: '/api/test' });
      const res = createMockResponse();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject URLs exceeding limit', () => {
      const middleware = createUrlLengthMiddleware({ maxUrlLength: 10 });
      const req = createMockRequest({ originalUrl: '/api/test/very/long/path' });
      const res = createMockResponse();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(414);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'URL_TOO_LONG',
          message: expect.stringContaining('URL too long'),
        },
      });
    });

    it('should skip paths in skipPaths', () => {
      const middleware = createUrlLengthMiddleware({
        maxUrlLength: 10,
        skipPaths: ['/health'],
      });
      const req = createMockRequest({
        originalUrl: '/health/very/long/path/that/exceeds/limit',
        path: '/health/very/long/path/that/exceeds/limit',
      });
      const res = createMockResponse();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should use default limit if not specified', () => {
      const middleware = createUrlLengthMiddleware({});
      const req = createMockRequest({ originalUrl: '/api/test' });
      const res = createMockResponse();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('createHeaderSizeMiddleware', () => {
    it('should allow headers within limits', () => {
      const middleware = createHeaderSizeMiddleware({
        maxHeaderSize: 1000,
        maxHeaderCount: 10,
      });
      const req = createMockRequest({
        headers: {
          'content-type': 'application/json',
          'authorization': 'Bearer token',
        },
      });
      const res = createMockResponse();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject too many headers', () => {
      const middleware = createHeaderSizeMiddleware({
        maxHeaderCount: 2,
      });
      const req = createMockRequest({
        headers: {
          'header1': 'value1',
          'header2': 'value2',
          'header3': 'value3',
        },
      });
      const res = createMockResponse();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(431);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'TOO_MANY_HEADERS',
          message: expect.stringContaining('Too many headers'),
        },
      });
    });

    it('should reject headers that are too large', () => {
      const middleware = createHeaderSizeMiddleware({
        maxHeaderSize: 50,
      });
      const req = createMockRequest({
        headers: {
          'authorization': 'Bearer ' + 'x'.repeat(100),
        },
      });
      const res = createMockResponse();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(431);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'HEADERS_TOO_LARGE',
          message: expect.stringContaining('Request headers too large'),
        },
      });
    });

    it('should handle array header values', () => {
      const middleware = createHeaderSizeMiddleware({
        maxHeaderSize: 1000,
      });
      const req = createMockRequest({
        headers: {
          'accept': ['application/json', 'text/plain'] as unknown as string,
        },
      });
      const res = createMockResponse();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('createParameterCountMiddleware', () => {
    it('should allow parameters within limit', () => {
      const middleware = createParameterCountMiddleware({
        maxParameterCount: 10,
      });
      const req = createMockRequest({
        query: { a: '1', b: '2' },
        body: { c: '3', d: '4' },
      });
      const res = createMockResponse();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject too many query parameters', () => {
      const middleware = createParameterCountMiddleware({
        maxParameterCount: 2,
      });
      const req = createMockRequest({
        query: { a: '1', b: '2', c: '3' },
      });
      const res = createMockResponse();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'TOO_MANY_PARAMETERS',
          message: expect.stringContaining('Too many parameters'),
        },
      });
    });

    it('should reject too many body parameters', () => {
      const middleware = createParameterCountMiddleware({
        maxParameterCount: 2,
      });
      const req = createMockRequest({
        query: {},
        body: { a: '1', b: '2', c: '3' },
      });
      const res = createMockResponse();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle non-object body', () => {
      const middleware = createParameterCountMiddleware({
        maxParameterCount: 2,
      });
      const req = createMockRequest({
        body: null,
      });
      const res = createMockResponse();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('createRequestLimitsMiddleware', () => {
    it('should return an array of middleware', () => {
      const middleware = createRequestLimitsMiddleware({
        serviceName: 'test-service',
      });

      expect(Array.isArray(middleware)).toBe(true);
      expect(middleware.length).toBe(3);
    });

    it('should track stats when enabled', () => {
      resetRequestLimitsStats('stats-test-service');

      const middleware = createRequestLimitsMiddleware({
        serviceName: 'stats-test-service',
        maxUrlLength: 10,
        trackStats: true,
      });

      const req = createMockRequest({ originalUrl: '/api/test/very/long/path' });
      const res = createMockResponse();
      const next = jest.fn();

      // Run first middleware (URL length check)
      middleware[0](req, res, next);

      const stats = getRequestLimitsStats('stats-test-service');
      expect(stats).toBeDefined();
      expect(stats?.urlTooLong).toBe(1);
      expect(stats?.totalChecks).toBe(1);
    });

    it('should not track stats when disabled', () => {
      resetRequestLimitsStats('no-stats-service');

      const middleware = createRequestLimitsMiddleware({
        serviceName: 'no-stats-service',
        maxUrlLength: 10,
        trackStats: false,
      });

      const req = createMockRequest({ originalUrl: '/api/test/very/long/path' });
      const res = createMockResponse();
      const next = jest.fn();

      middleware[0](req, res, next);

      const stats = getRequestLimitsStats('no-stats-service');
      expect(stats).toBeUndefined();
    });
  });

  describe('getBodyParserOptions', () => {
    it('should return default options', () => {
      const options = getBodyParserOptions();

      expect(options.jsonOptions.limit).toBe(DEFAULT_LIMITS.jsonLimit);
      expect(options.urlEncodedOptions.limit).toBe(DEFAULT_LIMITS.urlEncodedLimit);
      expect(options.urlEncodedOptions.extended).toBe(true);
    });

    it('should use custom limits', () => {
      const options = getBodyParserOptions({
        jsonLimit: '5mb',
        urlEncodedLimit: '2mb',
      });

      expect(options.jsonOptions.limit).toBe('5mb');
      expect(options.urlEncodedOptions.limit).toBe('2mb');
    });
  });

  describe('bodyParserErrorHandler', () => {
    it('should handle entity.too.large errors', () => {
      resetRequestLimitsStats('body-error-service');
      const handler = bodyParserErrorHandler('body-error-service');
      const err = new Error('body too large') as Error & { type: string };
      err.type = 'entity.too.large';
      const req = createMockRequest();
      const res = createMockResponse();
      const next = jest.fn();

      handler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(413);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'BODY_TOO_LARGE',
          message: 'Request body too large',
        },
      });
      expect(next).not.toHaveBeenCalled();

      const stats = getRequestLimitsStats('body-error-service');
      expect(stats?.bodyTooLarge).toBe(1);
    });

    it('should handle charset.unsupported errors', () => {
      const handler = bodyParserErrorHandler();
      const err = new Error('charset unsupported') as Error & { type: string };
      err.type = 'charset.unsupported';
      const req = createMockRequest();
      const res = createMockResponse();
      const next = jest.fn();

      handler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(415);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_CONTENT_TYPE',
          message: 'Unsupported charset',
        },
      });
    });

    it('should handle encoding.unsupported errors', () => {
      const handler = bodyParserErrorHandler();
      const err = new Error('encoding unsupported') as Error & { type: string };
      err.type = 'encoding.unsupported';
      const req = createMockRequest();
      const res = createMockResponse();
      const next = jest.fn();

      handler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(415);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_CONTENT_TYPE',
          message: 'Unsupported content encoding',
        },
      });
    });

    it('should pass non-body-parser errors to next', () => {
      const handler = bodyParserErrorHandler();
      const err = new Error('some other error');
      const req = createMockRequest();
      const res = createMockResponse();
      const next = jest.fn();

      handler(err, req, res, next);

      expect(next).toHaveBeenCalledWith(err);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Statistics tracking', () => {
    beforeEach(() => {
      resetRequestLimitsStats('test-stats-service');
    });

    it('should track violations', () => {
      trackLimitViolation('test-stats-service', 'URL_TOO_LONG', '/api/test');
      trackLimitViolation('test-stats-service', 'HEADERS_TOO_LARGE', '/api/test');
      trackLimitViolation('test-stats-service', 'TOO_MANY_HEADERS', '/api/test');
      trackLimitViolation('test-stats-service', 'TOO_MANY_PARAMETERS', '/api/test');
      trackLimitViolation('test-stats-service', 'BODY_TOO_LARGE', '/api/test');

      const stats = getRequestLimitsStats('test-stats-service');

      expect(stats?.totalChecks).toBe(5);
      expect(stats?.urlTooLong).toBe(1);
      expect(stats?.headersTooLarge).toBe(1);
      expect(stats?.tooManyHeaders).toBe(1);
      expect(stats?.tooManyParameters).toBe(1);
      expect(stats?.bodyTooLarge).toBe(1);
    });

    it('should track last violation', () => {
      trackLimitViolation('test-stats-service', 'URL_TOO_LONG', '/api/test/long');

      const stats = getRequestLimitsStats('test-stats-service');

      expect(stats?.lastViolation).toBeDefined();
      expect(stats?.lastViolation?.type).toBe('URL_TOO_LONG');
      expect(stats?.lastViolation?.path).toBe('/api/test/long');
      expect(stats?.lastViolation?.timestamp).toBeInstanceOf(Date);
    });

    it('should reset stats', () => {
      trackLimitViolation('test-stats-service', 'URL_TOO_LONG', '/api/test');
      resetRequestLimitsStats('test-stats-service');

      const stats = getRequestLimitsStats('test-stats-service');
      expect(stats).toBeUndefined();
    });
  });

  describe('Custom error handler', () => {
    it('should call custom error handler', () => {
      const customHandler = jest.fn();
      const middleware = createUrlLengthMiddleware({
        maxUrlLength: 10,
        onError: customHandler,
      });

      const req = createMockRequest({ originalUrl: '/api/test/very/long/path' });
      const res = createMockResponse();
      const next = jest.fn();

      middleware(req, res, next);

      expect(customHandler).toHaveBeenCalled();
      expect(customHandler.mock.calls[0][0]).toMatchObject({
        type: 'URL_TOO_LONG',
        statusCode: 414,
      });
    });
  });

  describe('DEFAULT_LIMITS', () => {
    it('should have sensible defaults', () => {
      expect(DEFAULT_LIMITS.jsonLimit).toBe('1mb');
      expect(DEFAULT_LIMITS.urlEncodedLimit).toBe('1mb');
      expect(DEFAULT_LIMITS.maxUrlLength).toBe(2048);
      expect(DEFAULT_LIMITS.maxHeaderSize).toBe(8192);
      expect(DEFAULT_LIMITS.maxHeaderCount).toBe(100);
      expect(DEFAULT_LIMITS.maxParameterCount).toBe(100);
    });
  });
});
