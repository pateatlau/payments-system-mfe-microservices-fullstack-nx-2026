/**
 * Auth Middleware - Unit Tests
 */

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate } from './auth';

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('should authenticate valid token', () => {
    const mockPayload = {
      userId: 'user-123',
      email: 'user@example.com',
      name: 'Test User',
      role: 'CUSTOMER',
    };

    mockRequest.headers = {
      authorization: 'Bearer valid-token',
    };

    (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

    authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockRequest.user).toEqual({
      userId: 'user-123',
      email: 'user@example.com',
      name: 'Test User',
      role: 'CUSTOMER',
    });
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should reject request without authorization header', () => {
    authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'No token provided',
      },
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should reject request with invalid authorization format', () => {
    mockRequest.headers = {
      authorization: 'InvalidFormat token',
    };

    authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'No token provided',
      },
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should reject expired token', () => {
    mockRequest.headers = {
      authorization: 'Bearer expired-token',
    };

    const expiredError = new jwt.TokenExpiredError('Token expired', new Date());
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw expiredError;
    });

    authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Token has expired',
      },
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should reject invalid token', () => {
    mockRequest.headers = {
      authorization: 'Bearer invalid-token',
    };

    const invalidError = new jwt.JsonWebTokenError('Invalid token');
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw invalidError;
    });

    authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid token',
      },
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle missing userId in token payload', () => {
    const mockPayload = {
      email: 'user@example.com',
      name: 'Test User',
      role: 'CUSTOMER',
    };

    mockRequest.headers = {
      authorization: 'Bearer valid-token',
    };

    (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

    authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    // Missing userId will be undefined in request.user
    expect(mockRequest.user?.userId).toBeUndefined();
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should handle missing role in token payload', () => {
    const mockPayload = {
      userId: 'user-123',
      email: 'user@example.com',
      name: 'Test User',
    };

    mockRequest.headers = {
      authorization: 'Bearer valid-token',
    };

    (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

    authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    // Missing role will be undefined in request.user
    expect(mockRequest.user?.role).toBeUndefined();
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should handle all user roles', () => {
    const roles = ['ADMIN', 'CUSTOMER', 'VENDOR'];

    roles.forEach(role => {
      jest.clearAllMocks();
      const mockPayload = {
        userId: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
        role,
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user?.role).toBe(role);
    });
  });

  it('should handle other errors', () => {
    mockRequest.headers = {
      authorization: 'Bearer valid-token',
    };

    const genericError = new Error('Database connection failed');
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw genericError;
    });

    authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(genericError);
  });
});
