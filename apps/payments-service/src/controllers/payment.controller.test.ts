/**
 * Payment Controller - Test Suite
 *
 * Tests for PUT /api/payments/:id endpoint (updatePayment handler)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import { updatePayment } from './payment.controller';
import * as paymentService from '../services/payment.service';
import { ApiError } from '../middleware/errorHandler';
import type { UserRole } from 'shared-types';

// Mock dependencies
jest.mock('../services/payment.service');
jest.mock('../validators/payment.validators');

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    name: string;
    role: UserRole;
  };
}

describe('PaymentController - updatePayment', () => {
  let req: Partial<AuthenticatedRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup request mock
    req = {
      params: { id: 'payment-123' },
      body: { amount: 150 },
      user: {
        userId: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        role: 'VENDOR' as UserRole,
      },
    };

    // Setup response mock with proper typing
    res = {
      json: jest.fn().mockReturnThis() as unknown as Response['json'],
      status: jest.fn().mockReturnThis() as unknown as Response['status'],
    };

    // Setup next function
    next = jest.fn();
  });

  describe('Authentication & Authorization', () => {
    it('should return 401 if user is not authenticated', async () => {
      req.user = undefined;

      await updatePayment(
        req as AuthenticatedRequest,
        res as Response,
        next
      );

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });

      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Validation & Input Errors', () => {
    it('should return 400 if payment ID is missing', async () => {
      req.params = {};

      await updatePayment(
        req as AuthenticatedRequest,
        res as Response,
        next
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Payment ID is required',
        },
      });

      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Response format', () => {
    it('should not call status() on successful update', async () => {
      const updateData = { amount: 150 };
      req.body = updateData;

      const mockPayment = {
        id: 'payment-123',
        senderId: 'user-1',
        recipientId: 'user-2',
        amount: 150,
        currency: 'USD',
        description: 'Test',
        status: 'pending',
        type: 'payment',
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest
        .spyOn(paymentService.paymentService, 'updatePayment')
        .mockResolvedValue(mockPayment as never);

      await updatePayment(
        req as AuthenticatedRequest,
        res as Response,
        next
      );

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('Service Error Handling', () => {
    it('should handle 404 - Payment not found', async () => {
      const updateData = { amount: 150 };
      req.body = updateData;

      jest
        .spyOn(paymentService.paymentService, 'updatePayment')
        .mockRejectedValue(
          new ApiError(404, 'PAYMENT_NOT_FOUND', 'Payment not found')
        );

      await updatePayment(
        req as AuthenticatedRequest,
        res as Response,
        next
      );

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 404,
          code: 'PAYMENT_NOT_FOUND',
        })
      );
    });

    it('should handle 403 - Forbidden', async () => {
      const updateData = { amount: 150 };
      req.user = {
        userId: 'user-99',
        email: 'other@example.com',
        name: 'Other User',
        role: 'CUSTOMER' as UserRole,
      };
      req.body = updateData;

      jest
        .spyOn(paymentService.paymentService, 'updatePayment')
        .mockRejectedValue(
          new ApiError(403, 'FORBIDDEN', 'No permission')
        );

      await updatePayment(
        req as AuthenticatedRequest,
        res as Response,
        next
      );

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 403,
          code: 'FORBIDDEN',
        })
      );
    });

    it('should handle 400 - Cannot update completed payment', async () => {
      const updateData = { amount: 150 };
      req.body = updateData;

      jest
        .spyOn(paymentService.paymentService, 'updatePayment')
        .mockRejectedValue(
          new ApiError(400, 'INVALID_STATUS', 'Cannot update completed or failed payments')
        );

      await updatePayment(
        req as AuthenticatedRequest,
        res as Response,
        next
      );

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 400,
          code: 'INVALID_STATUS',
        })
      );
    });

    it('should handle generic service errors', async () => {
      const updateData = { amount: 150 };
      req.body = updateData;

      const genericError = new Error('Database error');

      jest
        .spyOn(paymentService.paymentService, 'updatePayment')
        .mockRejectedValue(genericError);

      await updatePayment(
        req as AuthenticatedRequest,
        res as Response,
        next
      );

      expect(next).toHaveBeenCalledWith(genericError);
    });
  });
});
