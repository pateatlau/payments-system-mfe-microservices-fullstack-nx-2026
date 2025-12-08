/**
 * Auth Middleware - Unit Tests (requireAdmin)
 */

import type { Request, Response, NextFunction } from 'express';
import { requireAdmin } from './auth';
import { ApiError } from './errorHandler';

describe('Auth Middleware - requireAdmin', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {};
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('should allow ADMIN role', () => {
    mockRequest.user = {
      userId: 'admin-1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'ADMIN',
    };

    requireAdmin(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should reject CUSTOMER role', () => {
    mockRequest.user = {
      userId: 'customer-1',
      email: 'customer@example.com',
      name: 'Customer User',
      role: 'CUSTOMER',
    };

    requireAdmin(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    const error = (mockNext as jest.Mock).mock.calls[0][0];
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('FORBIDDEN');
  });

  it('should reject VENDOR role', () => {
    mockRequest.user = {
      userId: 'vendor-1',
      email: 'vendor@example.com',
      name: 'Vendor User',
      role: 'VENDOR',
    };

    requireAdmin(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    const error = (mockNext as jest.Mock).mock.calls[0][0];
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('FORBIDDEN');
  });

  it('should reject when user is not authenticated', () => {
    mockRequest.user = undefined;

    requireAdmin(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    const error = (mockNext as jest.Mock).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('UNAUTHORIZED');
  });
});
