/**
 * Auth Middleware - Unit Tests
 */

import type { Request, Response, NextFunction as _NextFunction } from 'express';
import { authenticate } from './auth';
import { verifyAccessToken } from '../utils/token';
import { ApiError as _ApiError } from './errorHandler';

// Mock token utilities
jest.mock('../utils/token', () => ({
  verifyAccessToken: jest.fn(),
}));

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      headers: {},
    };
    mockResponse = {};
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('should authenticate request with valid token', () => {
    const mockPayload = {
      userId: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'CUSTOMER',
    };

    mockRequest.headers = {
      authorization: 'Bearer valid-token',
    };
    (verifyAccessToken as jest.Mock).mockReturnValue(mockPayload);

    authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    expect(verifyAccessToken).toHaveBeenCalledWith('valid-token');
    expect(mockRequest.user).toEqual(mockPayload);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should skip authentication for OPTIONS requests', () => {
    mockRequest.method = 'OPTIONS';

    authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    expect(verifyAccessToken).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should return 401 if Authorization header is missing', () => {
    mockRequest.headers = {};

    authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    expect(verifyAccessToken).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        code: 'UNAUTHORIZED',
      })
    );
  });

  it('should return 401 if Authorization header does not start with Bearer', () => {
    mockRequest.headers = {
      authorization: 'Invalid token',
    };

    authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    expect(verifyAccessToken).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        code: 'UNAUTHORIZED',
      })
    );
  });

  it('should return 401 if token is expired', () => {
    mockRequest.headers = {
      authorization: 'Bearer expired-token',
    };

    const expiredError = new Error('Token expired');
    expiredError.name = 'TokenExpiredError';
    (verifyAccessToken as jest.Mock).mockImplementation(() => {
      throw expiredError;
    });

    authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        code: 'TOKEN_EXPIRED',
      })
    );
  });

  it('should return 401 if token is invalid', () => {
    mockRequest.headers = {
      authorization: 'Bearer invalid-token',
    };

    const invalidError = new Error('Invalid token');
    invalidError.name = 'JsonWebTokenError';
    (verifyAccessToken as jest.Mock).mockImplementation(() => {
      throw invalidError;
    });

    authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        code: 'TOKEN_INVALID',
      })
    );
  });

  it('should handle other errors', () => {
    mockRequest.headers = {
      authorization: 'Bearer token',
    };

    const otherError = new Error('Other error');
    (verifyAccessToken as jest.Mock).mockImplementation(() => {
      throw otherError;
    });

    authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(otherError);
  });
});
