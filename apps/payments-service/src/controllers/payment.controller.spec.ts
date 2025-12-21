/**
 * Payment Controller - Integration Tests
 */

import type { Request, Response } from 'express';
import {
  listPayments,
  getPaymentById,
  createPayment,
  updatePaymentStatus,
  handleWebhook,
} from './payment.controller';
import { paymentService } from '../services/payment.service';

// Mock payment service
jest.mock('../services/payment.service');

// Mock Prisma
jest.mock('db', () => ({
  prisma: {
    payment: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    paymentTransaction: {
      create: jest.fn(),
    },
  },
}));

// Mock Zod validators
jest.mock('../validators/payment.validators', () => ({
  listPaymentsSchema: {
    parse: jest.fn(data => data),
  },
  createPaymentSchema: {
    parse: jest.fn(data => data),
  },
  updatePaymentStatusSchema: {
    parse: jest.fn(data => data),
  },
  webhookPayloadSchema: {
    parse: jest.fn(data => data),
  },
}));

describe('PaymentController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      user: {
        userId: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
      },
      query: {},
      params: {},
      body: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('listPayments', () => {
    it('should return paginated payments', async () => {
      const mockResult = {
        data: [
          {
            id: 'payment-1',
            amount: 100,
            status: 'completed',
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      (paymentService.listPayments as jest.Mock).mockResolvedValue(mockResult);

      mockRequest.query = {
        page: '1',
        limit: '10',
      };

      await listPayments(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      });
      expect(paymentService.listPayments).toHaveBeenCalledWith(
        'user-1',
        'CUSTOMER',
        expect.any(Object)
      );
    });

    it('should handle validation errors', async () => {
      const validationError = new Error('Validation failed');
      const {
        listPaymentsSchema,
        // eslint-disable-next-line @typescript-eslint/no-require-imports
      } = require('../validators/payment.validators');
      listPaymentsSchema.parse.mockImplementationOnce(() => {
        throw validationError;
      });

      await listPayments(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it('should handle service errors', async () => {
      const serviceError = new Error('Database error');
      (paymentService.listPayments as jest.Mock).mockRejectedValue(
        serviceError
      );

      await listPayments(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('getPaymentById', () => {
    it('should return payment by ID', async () => {
      const mockPayment = {
        id: 'payment-1',
        amount: 100,
        status: 'completed',
        sender: { id: 'user-1', email: 'sender@example.com' },
        recipient: { id: 'user-2', email: 'recipient@example.com' },
        transactions: [],
      };

      (paymentService.getPaymentById as jest.Mock).mockResolvedValue(
        mockPayment
      );

      mockRequest.params = { id: 'payment-1' };

      await getPaymentById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockPayment,
      });
      expect(paymentService.getPaymentById).toHaveBeenCalledWith(
        'payment-1',
        'user-1',
        'CUSTOMER'
      );
    });

    it('should return 400 for invalid ID', async () => {
      mockRequest.params = {};

      await getPaymentById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Payment ID is required',
        },
      });
    });

    it('should handle service errors', async () => {
      const serviceError = new Error('Payment not found');
      (paymentService.getPaymentById as jest.Mock).mockRejectedValue(
        serviceError
      );

      mockRequest.params = { id: 'payment-1' };

      await getPaymentById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('createPayment', () => {
    it('should create a new payment', async () => {
      const mockPaymentData = {
        type: 'instant',
        amount: 100,
        currency: 'USD',
        description: 'Test payment',
        recipientEmail: 'recipient@example.com',
      };

      const mockCreatedPayment = {
        id: 'payment-1',
        ...mockPaymentData,
        status: 'pending',
        senderId: 'user-1',
        recipientId: 'recipient-id',
      };

      (paymentService.createPayment as jest.Mock).mockResolvedValue(
        mockCreatedPayment
      );

      mockRequest.body = mockPaymentData;

      await createPayment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCreatedPayment,
      });
      expect(paymentService.createPayment).toHaveBeenCalledWith(
        'user-1',
        mockPaymentData
      );
    });

    it('should handle validation errors', async () => {
      const validationError = new Error('Invalid payment data');
      const {
        createPaymentSchema,
        // eslint-disable-next-line @typescript-eslint/no-require-imports
      } = require('../validators/payment.validators');
      createPaymentSchema.parse.mockImplementationOnce(() => {
        throw validationError;
      });

      mockRequest.body = { amount: -100 };

      await createPayment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it('should handle service errors', async () => {
      const serviceError = new Error('Recipient not found');
      (paymentService.createPayment as jest.Mock).mockRejectedValue(
        serviceError
      );

      mockRequest.body = {
        type: 'instant',
        amount: 100,
        currency: 'USD',
        description: 'Test',
        recipientEmail: 'invalid@example.com',
      };

      await createPayment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status', async () => {
      const mockUpdatedPayment = {
        id: 'payment-1',
        status: 'completed',
        completedAt: new Date(),
      };

      (paymentService.updatePaymentStatus as jest.Mock).mockResolvedValue(
        mockUpdatedPayment
      );

      mockRequest.params = { id: 'payment-1' };
      mockRequest.body = {
        status: 'completed',
        reason: 'Payment processed',
      };

      await updatePaymentStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedPayment,
      });
      expect(paymentService.updatePaymentStatus).toHaveBeenCalledWith(
        'payment-1',
        'user-1',
        'CUSTOMER',
        expect.any(Object)
      );
    });

    it('should return 400 for invalid ID', async () => {
      mockRequest.params = {};
      mockRequest.body = { status: 'completed' };

      await updatePaymentStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Payment ID is required',
        },
      });
    });

    it('should handle service errors', async () => {
      const serviceError = new Error('Unauthorized');
      (paymentService.updatePaymentStatus as jest.Mock).mockRejectedValue(
        serviceError
      );

      mockRequest.params = { id: 'payment-1' };
      mockRequest.body = { status: 'completed' };

      await updatePaymentStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('handleWebhook', () => {
    it('should process webhook successfully', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('../lib/prisma');

      const webhookPayload = {
        paymentId: 'payment-1',
        status: 'completed',
        pspTransactionId: 'psp-tx-123',
        pspStatus: 'success',
      };

      const mockPayment = {
        id: 'payment-1',
        status: 'pending',
        completedAt: null,
      };

      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment);
      (prisma.payment.update as jest.Mock).mockResolvedValue({
        ...mockPayment,
        status: 'completed',
      });
      (prisma.paymentTransaction.create as jest.Mock).mockResolvedValue({});

      mockRequest.body = webhookPayload;

      await handleWebhook(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'Webhook processed successfully',
        },
      });
    });

    it('should handle validation errors', async () => {
      const validationError = new Error('Invalid webhook payload');
      const {
        webhookPayloadSchema,
        // eslint-disable-next-line @typescript-eslint/no-require-imports
      } = require('../validators/payment.validators');
      webhookPayloadSchema.parse.mockImplementationOnce(() => {
        throw validationError;
      });

      mockRequest.body = { invalid: 'data' };

      await handleWebhook(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it('should return 404 when payment not found', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('../lib/prisma');

      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(null);

      mockRequest.body = {
        paymentId: 'invalid-id',
        status: 'completed',
      };

      await handleWebhook(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: 'Payment not found',
        },
      });
    });
  });
});
