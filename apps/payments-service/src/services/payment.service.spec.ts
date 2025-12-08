/**
 * Payment Service - Unit Tests
 */

import { paymentService } from './payment.service';
import { prisma } from 'db';

// Mock Prisma
jest.mock('db', () => ({
  prisma: {
    payment: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    paymentTransaction: {
      create: jest.fn(),
    },
  },
}));

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listPayments', () => {
    const mockPayments = [
      {
        id: 'payment-1',
        senderId: 'user-1',
        recipientId: 'user-2',
        type: 'instant',
        amount: 100.0,
        currency: 'USD',
        description: 'Test payment',
        status: 'completed',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        completedAt: new Date('2024-01-01'),
        sender: {
          id: 'user-1',
          email: 'sender@example.com',
          name: 'Sender Name',
          role: 'CUSTOMER',
        },
        recipient: {
          id: 'user-2',
          email: 'recipient@example.com',
          name: 'Recipient Name',
          role: 'CUSTOMER',
        },
      },
    ];

    it('should list payments for ADMIN with pagination', async () => {
      (prisma.payment.findMany as jest.Mock).mockResolvedValue(mockPayments);
      (prisma.payment.count as jest.Mock).mockResolvedValue(1);

      const result = await paymentService.listPayments('admin-id', 'ADMIN', {
        page: 1,
        limit: 10,
        sort: 'createdAt',
        order: 'desc',
      });

      expect(result).toEqual({
        payments: mockPayments,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });

      expect(prisma.payment.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { id: true, email: true, name: true, role: true } },
          recipient: {
            select: { id: true, email: true, name: true, role: true },
          },
        },
      });
    });

    it('should list payments for CUSTOMER (own payments only)', async () => {
      (prisma.payment.findMany as jest.Mock).mockResolvedValue(mockPayments);
      (prisma.payment.count as jest.Mock).mockResolvedValue(1);

      await paymentService.listPayments('user-1', 'CUSTOMER', {
        page: 1,
        limit: 10,
        sort: 'createdAt',
        order: 'desc',
      });

      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [{ senderId: 'user-1' }, { recipientId: 'user-1' }],
          },
        })
      );
    });

    it('should list payments for VENDOR (initiated payments only)', async () => {
      (prisma.payment.findMany as jest.Mock).mockResolvedValue(mockPayments);
      (prisma.payment.count as jest.Mock).mockResolvedValue(1);

      await paymentService.listPayments('vendor-1', 'VENDOR', {
        page: 1,
        limit: 10,
        sort: 'createdAt',
        order: 'desc',
      });

      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { senderId: 'vendor-1' },
        })
      );
    });

    it('should filter by status', async () => {
      (prisma.payment.findMany as jest.Mock).mockResolvedValue(mockPayments);
      (prisma.payment.count as jest.Mock).mockResolvedValue(1);

      await paymentService.listPayments('admin-id', 'ADMIN', {
        page: 1,
        limit: 10,
        sort: 'createdAt',
        order: 'desc',
        status: 'completed',
      });

      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'completed' },
        })
      );
    });

    it('should filter by date range', async () => {
      (prisma.payment.findMany as jest.Mock).mockResolvedValue(mockPayments);
      (prisma.payment.count as jest.Mock).mockResolvedValue(1);

      const startDate = '2024-01-01';
      const endDate = '2024-12-31';

      await paymentService.listPayments('admin-id', 'ADMIN', {
        page: 1,
        limit: 10,
        sort: 'createdAt',
        order: 'desc',
        startDate,
        endDate,
      });

      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        })
      );
    });
  });

  describe('getPaymentById', () => {
    const mockPayment = {
      id: 'payment-1',
      senderId: 'user-1',
      recipientId: 'user-2',
      type: 'instant',
      amount: 100.0,
      currency: 'USD',
      description: 'Test payment',
      status: 'completed',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      completedAt: new Date('2024-01-01'),
      sender: {
        id: 'user-1',
        email: 'sender@example.com',
        name: 'Sender Name',
        role: 'CUSTOMER',
      },
      recipient: {
        id: 'user-2',
        email: 'recipient@example.com',
        name: 'Recipient Name',
        role: 'CUSTOMER',
      },
      transactions: [],
    };

    it('should get payment by ID for ADMIN', async () => {
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment);

      const result = await paymentService.getPaymentById(
        'payment-1',
        'admin-id',
        'ADMIN'
      );

      expect(result).toEqual(mockPayment);
      expect(prisma.payment.findUnique).toHaveBeenCalledWith({
        where: { id: 'payment-1' },
        include: {
          sender: { select: { id: true, email: true, name: true, role: true } },
          recipient: {
            select: { id: true, email: true, name: true, role: true },
          },
          transactions: { orderBy: { createdAt: 'asc' } },
        },
      });
    });

    it('should get payment by ID for owner (sender)', async () => {
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment);

      const result = await paymentService.getPaymentById(
        'payment-1',
        'user-1',
        'CUSTOMER'
      );

      expect(result).toEqual(mockPayment);
    });

    it('should get payment by ID for owner (recipient)', async () => {
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment);

      const result = await paymentService.getPaymentById(
        'payment-1',
        'user-2',
        'CUSTOMER'
      );

      expect(result).toEqual(mockPayment);
    });

    it('should throw 404 if payment not found', async () => {
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        paymentService.getPaymentById('invalid-id', 'user-1', 'CUSTOMER')
      ).rejects.toThrow('Payment not found');
    });

    it('should throw 403 if user is not authorized', async () => {
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment);

      await expect(
        paymentService.getPaymentById('payment-1', 'other-user', 'CUSTOMER')
      ).rejects.toThrow('You do not have access to this payment');
    });
  });

  describe('createPayment', () => {
    const createPaymentData = {
      type: 'instant' as const,
      amount: 100.0,
      currency: 'USD',
      description: 'Test payment',
      recipientEmail: 'recipient@example.com',
    };

    const mockRecipient = {
      id: 'recipient-id',
      email: 'recipient@example.com',
      name: 'Recipient Name',
      role: 'CUSTOMER',
    };

    const mockCreatedPayment = {
      id: 'payment-1',
      senderId: 'sender-id',
      recipientId: 'recipient-id',
      type: 'instant',
      amount: 100.0,
      currency: 'USD',
      description: 'Test payment',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      sender: {
        id: 'sender-id',
        email: 'sender@example.com',
        name: 'Sender Name',
        role: 'CUSTOMER',
      },
      recipient: mockRecipient,
      transactions: [
        {
          id: 'tx-1',
          paymentId: 'payment-1',
          status: 'pending',
          createdAt: new Date(),
        },
      ],
    };

    it('should create payment with recipient email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockRecipient);
      (prisma.payment.create as jest.Mock).mockResolvedValue(
        mockCreatedPayment
      );

      const result = await paymentService.createPayment(
        'sender-id',
        createPaymentData
      );

      expect(result).toEqual(mockCreatedPayment);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'recipient@example.com' },
        select: { id: true },
      });
    });

    it('should create payment with recipient ID without lookup', async () => {
      (prisma.payment.create as jest.Mock).mockResolvedValue(
        mockCreatedPayment
      );

      const data = {
        ...createPaymentData,
        recipientId: 'recipient-id',
        recipientEmail: undefined,
      };

      const result = await paymentService.createPayment('sender-id', data);

      // Should not query user table when recipientId is provided
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(result).toEqual(mockCreatedPayment);
    });

    it('should throw 404 if recipient not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        paymentService.createPayment('sender-id', createPaymentData)
      ).rejects.toThrow('Recipient user not found');
    });

    it('should create payment even if sender and recipient IDs match', async () => {
      // The service does not check if sender and recipient are the same
      // This is a business decision - could be valid for internal transfers
      const senderAsRecipient = {
        id: 'sender-id',
        email: 'sender@example.com',
      };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(
        senderAsRecipient
      );
      (prisma.payment.create as jest.Mock).mockResolvedValue(
        mockCreatedPayment
      );

      const result = await paymentService.createPayment(
        'sender-id',
        createPaymentData
      );

      expect(result).toBeDefined();
    });
  });

  describe('updatePaymentStatus', () => {
    const mockPayment = {
      id: 'payment-1',
      senderId: 'user-1',
      recipientId: 'user-2',
      status: 'pending',
      sender: { id: 'user-1' },
      recipient: { id: 'user-2' },
      transactions: [],
    };

    const updateData = {
      status: 'completed' as const,
      reason: 'Payment processed',
    };

    it('should update payment status as ADMIN', async () => {
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment);
      (prisma.payment.update as jest.Mock).mockResolvedValue({
        ...mockPayment,
        status: 'completed',
        completedAt: new Date(),
      });

      const result = await paymentService.updatePaymentStatus(
        'payment-1',
        'admin-id',
        'ADMIN',
        updateData
      );

      expect(result.status).toBe('completed');
      expect(result.completedAt).toBeDefined();
    });

    it('should allow non-admin to cancel own pending payment', async () => {
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment);
      (prisma.payment.update as jest.Mock).mockResolvedValue({
        ...mockPayment,
        status: 'cancelled',
      });

      const cancelData = { status: 'cancelled' as const };

      const result = await paymentService.updatePaymentStatus(
        'payment-1',
        'user-1',
        'CUSTOMER',
        cancelData
      );

      expect(result.status).toBe('cancelled');
    });

    it('should throw 404 if payment not found', async () => {
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        paymentService.updatePaymentStatus(
          'invalid-id',
          'admin-id',
          'ADMIN',
          updateData
        )
      ).rejects.toThrow('Payment not found');
    });

    it('should throw 403 if non-admin tries to update other user payment', async () => {
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment);

      await expect(
        paymentService.updatePaymentStatus(
          'payment-1',
          'other-user',
          'CUSTOMER',
          updateData
        )
      ).rejects.toThrow('You do not have permission to update this payment');
    });

    it('should throw 403 if non-admin tries to update to non-cancelled status', async () => {
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment);

      await expect(
        paymentService.updatePaymentStatus(
          'payment-1',
          'user-1',
          'CUSTOMER',
          updateData
        )
      ).rejects.toThrow('You can only cancel pending payments');
    });

    it('should throw 403 if trying to cancel non-pending payment', async () => {
      const completedPayment = { ...mockPayment, status: 'completed' };
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(
        completedPayment
      );

      const cancelData = { status: 'cancelled' as const };

      await expect(
        paymentService.updatePaymentStatus(
          'payment-1',
          'user-1',
          'CUSTOMER',
          cancelData
        )
      ).rejects.toThrow('You can only cancel pending payments');
    });
  });
});
