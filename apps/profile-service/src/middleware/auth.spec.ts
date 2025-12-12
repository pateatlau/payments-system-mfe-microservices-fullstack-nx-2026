/**
 * Auth Middleware - Unit Tests
 */

import type { Request, Response, NextFunction } from 'express';
import { authenticate } from './auth';
import jwt from 'jsonwebtoken';
import config from '../config';

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

// Mock config
jest.mock('../config', () => ({
  default: {
    jwtSecret: 'test-secret',
  },
}));

describe('Auth Middleware - authenticate', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('should authenticate valid token', () => {
    const mockPayload = {
      userId: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'CUSTOMER',
    };

    mockRequest.headers = {
      authorization: 'Bearer valid-token',
    };

    (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

    authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockRequest.user).toEqual(mockPayload);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should reject missing authorization header', () => {
    authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    const error = (mockNext as jest.Mock).mock.calls[0][0];
    expect(error.message).toContain('Authorization header is required');
  });

  it('should reject invalid authorization format', () => {
    mockRequest.headers = {
      authorization: 'InvalidFormat token',
    };

    authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    const error = (mockNext as jest.Mock).mock.calls[0][0];
    expect(error.message).toContain('Bearer');
  });

  it('should reject invalid token', () => {
    mockRequest.headers = {
      authorization: 'Bearer invalid-token',
    };

    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new jwt.JsonWebTokenError('invalid token');
    });

    authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    const error = (mockNext as jest.Mock).mock.calls[0][0];
    expect(error.message).toBe('Invalid token');
  });

  it('should reject expired token', () => {
    mockRequest.headers = {
      authorization: 'Bearer expired-token',
    };

    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new jwt.TokenExpiredError('jwt expired', new Date());
    });

    authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    const error = (mockNext as jest.Mock).mock.calls[0][0];
    expect(error.message).toBe('Token has expired');
  });
});
