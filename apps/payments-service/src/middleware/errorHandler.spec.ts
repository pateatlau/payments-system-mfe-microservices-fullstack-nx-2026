/**
 * Error Handler Middleware - Unit Tests
 */

import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiError, errorHandler, notFoundHandler } from './errorHandler';
import { logger } from '../utils/logger';

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('ErrorHandler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      path: '/test',
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('ApiError', () => {
    it('should create ApiError with all parameters', () => {
      const error = new ApiError(500, 'INTERNAL_SERVER_ERROR', 'Test error');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_SERVER_ERROR');
      expect(error.name).toBe('ApiError');
    });

    it('should create ApiError with custom values', () => {
      const error = new ApiError(404, 'NOT_FOUND', 'Not found');

      expect(error.message).toBe('Not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });

    it('should be an instance of Error', () => {
      const error = new ApiError(500, 'TEST_ERROR', 'Test');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
    });
  });

  describe('errorHandler', () => {
    it('should handle ApiError', () => {
      const error = new ApiError(404, 'NOT_FOUND', 'Not found');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Not found',
        },
      });
    });

    it('should handle ZodError', () => {
      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['email'],
          message: 'Expected string, received number',
        },
      ]);

      errorHandler(
        zodError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: expect.arrayContaining([
            expect.objectContaining({
              code: 'invalid_type',
              path: ['email'],
              message: 'Expected string, received number',
            }),
          ]),
        },
      });
    });

    it('should handle generic Error', () => {
      const error = new Error('Something went wrong');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      });
    });

    it('should log all errors', () => {
      const error = new ApiError(400, 'BAD_REQUEST', 'Test error');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(logger.error).toHaveBeenCalledWith('Request error', {
        error: 'Test error',
        stack: expect.any(String),
        url: undefined,
        method: 'GET',
      });
    });

    it('should handle ZodError with multiple issues', () => {
      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['email'],
          message: 'Invalid email',
        },
        {
          code: 'too_small',
          minimum: 1,
          type: 'string',
          inclusive: true,
          exact: false,
          path: ['password'],
          message: 'Password too short',
        },
      ]);

      errorHandler(
        zodError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: expect.arrayContaining([
            expect.objectContaining({ path: ['email'], message: 'Invalid email' }),
            expect.objectContaining({ path: ['password'], message: 'Password too short' }),
          ]),
        },
      });
    });

    it('should handle ZodError with nested paths', () => {
      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['user', 'address', 'street'],
          message: 'Invalid street',
        },
      ]);

      errorHandler(
        zodError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: [
            expect.objectContaining({
              path: ['user', 'address', 'street'],
              message: 'Invalid street',
            }),
          ],
        },
      });
    });
  });

  describe('notFoundHandler', () => {
    it('should call next with ApiError', () => {
      mockRequest.method = 'GET';
      mockRequest.path = '/unknown-route';

      notFoundHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });

    it('should handle different HTTP methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

      methods.forEach(method => {
        jest.clearAllMocks();
        mockRequest.method = method;
        mockRequest.path = '/test';

        notFoundHandler(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      });
    });
  });
});
