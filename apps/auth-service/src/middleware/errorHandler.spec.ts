/**
 * Error Handler Middleware - Unit Tests
 */

import type { Request, Response, _NextFunction } from 'express';
import { errorHandler, notFoundHandler, ApiError } from './errorHandler';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      url: '/test',
      method: 'GET',
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('errorHandler', () => {
    it('should handle ApiError correctly', () => {
      const apiError = new ApiError(404, 'NOT_FOUND', 'Resource not found');

      errorHandler(
        apiError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found',
          details: undefined,
        },
      });
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle ApiError with details', () => {
      const apiError = new ApiError(400, 'VALIDATION_ERROR', 'Invalid data', {
        field: 'email',
      });

      errorHandler(
        apiError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid data',
          details: { field: 'email' },
        },
      });
    });

    it('should handle ZodError correctly', () => {
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
          details: zodError.errors,
        },
      });
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle generic errors', () => {
      const originalEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'production';

      const genericError = new Error('Unexpected error');

      errorHandler(
        genericError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      });

      process.env['NODE_ENV'] = originalEnv;
    });

    it('should include error details in development mode', () => {
      const originalEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'development';

      const genericError = new Error('Unexpected error');
      genericError.stack = 'Error stack trace';

      errorHandler(
        genericError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: 'Unexpected error',
          stack: 'Error stack trace',
        },
      });

      process.env['NODE_ENV'] = originalEnv;
    });

    it('should log error details', () => {
      const error = new Error('Test error');
      error.stack = 'Error stack';

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(logger.error).toHaveBeenCalledWith('Request error', {
        error: 'Test error',
        stack: 'Error stack',
        url: '/test',
        method: 'GET',
      });
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 for non-existent routes', () => {
      mockRequest.url = '/nonexistent';
      mockRequest.method = 'POST';

      notFoundHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Route POST /nonexistent not found',
        },
      });
    });
  });

  describe('ApiError class', () => {
    it('should create ApiError with all properties', () => {
      const error = new ApiError(400, 'BAD_REQUEST', 'Invalid request', {
        field: 'email',
      });

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.message).toBe('Invalid request');
      expect(error.details).toEqual({ field: 'email' });
      expect(error.name).toBe('ApiError');
    });

    it('should create ApiError without details', () => {
      const error = new ApiError(404, 'NOT_FOUND', 'Resource not found');

      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('Resource not found');
      expect(error.details).toBeUndefined();
    });
  });
});
