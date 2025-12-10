/**
 * Payment Service - Business Logic
 */

import { prisma as db } from '../lib/prisma';
import type { PaymentStatus, PaymentType, UserRole } from 'shared-types';
import { ApiError } from '../middleware/errorHandler';
import type {
  ListPaymentsQuery,
  CreatePaymentRequest,
  UpdatePaymentStatusRequest,
} from '../validators/payment.validators';

/**
 * Payment reports data structure
 */
export interface PaymentReportsData {
  totalPayments: number;
  totalAmount: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  period: {
    start: string;
    end: string;
  };
}

export const paymentService = {
  /**
   * List payments with pagination, filtering, and role-based access
   */
  async listPayments(
    userId: string,
    userRole: UserRole,
    query: ListPaymentsQuery
  ) {
    const { page, limit, sort, order, status, type, startDate, endDate } =
      query;

    const skip = (page - 1) * limit;

    // Build where clause based on role
    const where: Record<string, unknown> = {};

    // Role-based filtering
    if (userRole === 'CUSTOMER') {
      // Customers see only their own payments (as sender or recipient)
      where.OR = [{ senderId: userId }, { recipientId: userId }];
    } else if (userRole === 'VENDOR') {
      // Vendors see payments they initiated
      where.senderId = userId;
    }
    // ADMIN sees all payments (no filter)

    // Additional filters
    if (status) {
      where.status = status as PaymentStatus;
    }
    if (type) {
      where.type = type as PaymentType;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, unknown>).gte = startDate;
      }
      if (endDate) {
        (where.createdAt as Record<string, unknown>).lte = endDate;
      }
    }

    // Get total count
    const total = await db.payment.count({ where });

    // Get payments
    const payments = await db.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sort]: order },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        recipient: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get payment by ID with role-based access check
   */
  async getPaymentById(paymentId: string, userId: string, userRole: UserRole) {
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        recipient: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        transactions: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!payment) {
      throw new ApiError(404, 'PAYMENT_NOT_FOUND', 'Payment not found');
    }

    // Role-based access check
    if (userRole !== 'ADMIN') {
      const hasAccess =
        payment.senderId === userId || payment.recipientId === userId;

      if (!hasAccess) {
        throw new ApiError(
          403,
          'FORBIDDEN',
          'You do not have access to this payment'
        );
      }
    }

    return payment;
  },

  /**
   * Create new payment (stubbed processing)
   */
  async createPayment(userId: string, data: CreatePaymentRequest) {
    // Find recipient
    let recipientId: string;

    if (data.recipientId) {
      recipientId = data.recipientId;
    } else if (data.recipientEmail) {
      // ZERO COUPLING: Lookup recipient in local denormalized User table
      // This table is synchronized via RabbitMQ events from Auth Service (Phase 4)
      // No API calls to Auth Service - maintains zero coupling
      const recipient = await db.user.findUnique({
        where: { email: data.recipientEmail },
        select: { id: true },
      });

      if (!recipient) {
        throw new ApiError(
          404,
          'RECIPIENT_NOT_FOUND',
          'Recipient user not found'
        );
      }

      recipientId = recipient.id;
    } else {
      throw new ApiError(
        400,
        'INVALID_RECIPIENT',
        'Either recipientId or recipientEmail must be provided'
      );
    }

    // Create payment
    const paymentData: {
      senderId: string;
      recipientId: string;
      type: string;
      amount: number;
      currency: string;
      description: string;
      status: string;
      metadata?: Record<string, unknown>;
    } = {
      senderId: userId,
      recipientId,
      type: data.type,
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      status: 'pending',
    };

    if (data.metadata) {
      paymentData.metadata = data.metadata;
    }

    const payment = await db.payment.create({
      data: paymentData as never,
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        recipient: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // Create initial transaction
    await db.paymentTransaction.create({
      data: {
        paymentId: payment.id,
        status: 'pending',
        statusMessage: 'Payment created',
      },
    });

    // TODO: Publish event: payment:created

    return payment;
  },

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    paymentId: string,
    userId: string,
    userRole: UserRole,
    data: UpdatePaymentStatusRequest
  ) {
    // Get existing payment
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new ApiError(404, 'PAYMENT_NOT_FOUND', 'Payment not found');
    }

    // Role-based access check
    if (userRole !== 'ADMIN') {
      // Only sender can update their own payments
      if (payment.senderId !== userId) {
        throw new ApiError(
          403,
          'FORBIDDEN',
          'You do not have permission to update this payment'
        );
      }

      // Non-admins can only cancel pending payments
      if (data.status !== 'cancelled' || payment.status !== 'pending') {
        throw new ApiError(
          403,
          'FORBIDDEN',
          'You can only cancel pending payments'
        );
      }
    }

    // Update payment
    // Note: sender/recipient relations removed - users are in auth-service (POC-3)
    // User details should be fetched from Auth Service API if needed
    const updatedPayment = await db.payment.update({
      where: { id: paymentId },
      data: {
        status: data.status,
        completedAt:
          data.status === 'completed' ? new Date() : payment.completedAt,
      },
    });

    // Create transaction record
    await db.paymentTransaction.create({
      data: {
        paymentId,
        status: data.status,
        statusMessage: data.reason || `Payment ${data.status.toLowerCase()}`,
      },
    });

    // TODO: Publish event: payment:status:updated

    return updatedPayment;
  },

  /**
   * Get payment reports with aggregated statistics
   * Available to VENDOR and ADMIN roles
   */
  async getPaymentReports(
    userId: string,
    userRole: UserRole,
    startDate?: Date,
    endDate?: Date
  ): Promise<PaymentReportsData> {
    // Default to last 30 days if not provided
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    // Build where clause based on role
    const where: Record<string, unknown> = {
      createdAt: {
        gte: start,
        lte: end,
      },
    };

    // Role-based filtering
    if (userRole === 'VENDOR') {
      // Vendors see only their own payments
      where.senderId = userId;
    }
    // ADMIN sees all payments (no filter)

    // Get all payments in the period
    const payments = await db.payment.findMany({
      where,
      select: {
        amount: true,
        status: true,
        type: true,
      },
    });

    // Calculate aggregated statistics
    const totalPayments = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Group by status
    const byStatus: Record<string, number> = {};
    payments.forEach(p => {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    });

    // Group by type
    const byType: Record<string, number> = {};
    payments.forEach(p => {
      byType[p.type] = (byType[p.type] || 0) + 1;
    });

    return {
      totalPayments,
      totalAmount,
      byStatus,
      byType,
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    };
  },
};
