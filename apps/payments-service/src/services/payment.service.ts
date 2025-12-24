/**
 * Payment Service - Business Logic
 *
 * POC-3 Phase 5.2: Redis Caching Integration
 * - Cache payment lookups (by ID)
 * - Cache payment lists (by user, paginated)
 * - Cache payment reports
 * - Invalidate cache on payment creation/updates
 * - 1 minute TTL for payment data (frequently changing)
 */

import { randomUUID } from 'crypto';
import { prisma as db } from '../lib/prisma';
import type { PaymentStatus, PaymentType, UserRole } from 'shared-types';
import { ApiError } from '../middleware/errorHandler';
import type {
  ListPaymentsQuery,
  CreatePaymentRequest,
  UpdatePaymentRequest,
  UpdatePaymentStatusRequest,
} from '../validators/payment.validators';
import { cache, CacheKeys, CacheTags, PaymentsCacheTTL } from '../lib/cache';

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

    // Generate cache key based on query parameters
    const cacheKey =
      CacheKeys.paymentList(userId, page) +
      `:${sort}:${order}:${status || 'all'}:${type || 'all'}:${startDate || 'none'}:${endDate || 'none'}`;

    // Try cache first
    const cached = await cache.get<{
      payments: typeof payments;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(cacheKey);

    if (cached) {
      return cached;
    }

    const skip = (page - 1) * limit;

    // Build where clause based on role
    const where: Record<string, unknown> = {};

    // Role-based filtering
    if (userRole === 'CUSTOMER') {
      // Customers see only their own payments (as sender or recipient)
      where.OR = [{ senderId: userId }, { recipientId: userId }];
    } else if (userRole === 'VENDOR') {
      // Vendors see payments they sent AND payments received
      where.OR = [{ senderId: userId }, { recipientId: userId }];
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
            // Note: name and role not in denormalized users table
          },
        },
        recipient: {
          select: {
            id: true,
            email: true,
            // Note: name and role not in denormalized users table
          },
        },
      },
    });

    const result = {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Cache the result
    await cache.set(cacheKey, result, {
      ttl: PaymentsCacheTTL.PAYMENT_LIST,
      tags: [CacheTags.payments, CacheTags.user(userId)],
    });

    return result;
  },

  /**
   * Get payment by ID with role-based access check
   */
  async getPaymentById(paymentId: string, userId: string, userRole: UserRole) {
    // Try cache first
    const cacheKey = CacheKeys.payment(paymentId);
    const cached =
      await cache.get<Awaited<ReturnType<typeof db.payment.findUnique>>>(
        cacheKey
      );

    if (cached) {
      // Still need to check access even with cached data
      if (userRole !== 'ADMIN') {
        const hasAccess =
          cached.senderId === userId || cached.recipientId === userId;

        if (!hasAccess) {
          throw new ApiError(
            403,
            'FORBIDDEN',
            'You do not have access to this payment'
          );
        }
      }
      return cached;
    }

    // Cache miss - fetch from database
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            // Note: name and role not in denormalized users table
          },
        },
        recipient: {
          select: {
            id: true,
            email: true,
            // Note: name and role not in denormalized users table
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

    // Cache the payment
    await cache.set(cacheKey, payment, {
      ttl: PaymentsCacheTTL.PAYMENT_BY_ID,
      tags: [
        CacheTags.payments,
        CacheTags.user(payment.senderId),
        CacheTags.user(payment.recipientId),
      ],
    });

    return payment;
  },

  /**
   * Create new payment (stubbed processing)
   */
  async createPayment(userId: string, data: CreatePaymentRequest) {
    // Ensure sender exists in local User table (upsert for safety)
    // This handles the case where RabbitMQ event synchronization isn't set up yet
    await db.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, email: `user-${userId}@temp.local` },
    });

    // Find recipient
    let recipientId: string;

    if (data.recipientId) {
      recipientId = data.recipientId;
      // Ensure recipient exists in local User table
      await db.user.upsert({
        where: { id: recipientId },
        update: {},
        create: { id: recipientId, email: `user-${recipientId}@temp.local` },
      });
    } else if (data.recipientEmail) {
      // ZERO COUPLING: Lookup recipient in local denormalized User table
      // This table is synchronized via RabbitMQ events from Auth Service (Phase 4)
      // FALLBACK: If user not synced yet, create placeholder (upsert)
      // This is a temporary workaround until RabbitMQ subscriber is fully operational
      const recipient = await db.user.upsert({
        where: { email: data.recipientEmail },
        update: { email: data.recipientEmail },
        create: { id: randomUUID(), email: data.recipientEmail },
        select: { id: true },
      });

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
            // Note: name and role not in denormalized users table
          },
        },
        recipient: {
          select: {
            id: true,
            email: true,
            // Note: name and role not in denormalized users table
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

    // Invalidate payment lists for both sender and recipient
    await Promise.all([
      cache.invalidateByTag(CacheTags.user(userId)),
      cache.invalidateByTag(CacheTags.user(recipientId)),
    ]);

    // TODO: Publish event: payment:created

    return payment;
  },

  /**
   * Update payment details
   */
  async updatePayment(
    paymentId: string,
    userId: string,
    userRole: UserRole,
    data: UpdatePaymentRequest
  ) {
    const payment = await db.payment.findUnique({ where: { id: paymentId } });

    if (!payment) {
      throw new ApiError(404, 'PAYMENT_NOT_FOUND', 'Payment not found');
    }

    // Role-based access: only ADMIN or sender can update
    if (userRole !== 'ADMIN' && payment.senderId !== userId) {
      throw new ApiError(
        403,
        'FORBIDDEN',
        'You do not have permission to update this payment'
      );
    }

    // Status restriction: cannot update completed or failed payments
    if (payment.status === 'completed' || payment.status === 'failed') {
      throw new ApiError(
        400,
        'INVALID_STATUS',
        'Cannot update completed or failed payments'
      );
    }

    // Resolve recipient update, maintaining consistency (either id or email)
    let nextRecipientId: string | null | undefined = payment.recipientId;
    if (data.recipientId !== undefined && data.recipientEmail !== undefined) {
      throw new ApiError(
        400,
        'INVALID_RECIPIENT',
        'Provide only one of recipientId or recipientEmail'
      );
    }

    if (data.recipientId) {
      const recipient = await db.user.findUnique({
        where: { id: data.recipientId },
        select: { id: true },
      });

      if (!recipient) {
        throw new ApiError(
          404,
          'RECIPIENT_NOT_FOUND',
          'Recipient user not found'
        );
      }

      nextRecipientId = recipient.id;
    } else if (data.recipientEmail) {
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

      nextRecipientId = recipient.id;
    }

    const updatedPayment = await db.payment.update({
      where: { id: paymentId },
      data: {
        amount: data.amount ?? payment.amount,
        description: data.description ?? payment.description,
        recipientId: nextRecipientId ?? payment.recipientId,
        metadata: data.metadata ?? payment.metadata,
        type: (data.type as PaymentType | undefined) ?? payment.type,
        updatedAt: new Date(),
      },
      include: {
        sender: { select: { id: true, email: true } },
        recipient: { select: { id: true, email: true } },
        transactions: { orderBy: { createdAt: 'asc' } },
      },
    });

    // Create audit transaction
    await db.paymentTransaction.create({
      data: {
        paymentId,
        status: payment.status,
        statusMessage: 'Payment updated',
      },
    });

    // Invalidate caches for sender and both old/new recipients
    await Promise.all([
      cache.delete(CacheKeys.payment(paymentId)),
      cache.invalidateByTag(CacheTags.user(payment.senderId)),
      cache.invalidateByTag(CacheTags.user(payment.recipientId)),
      cache.invalidateByTag(
        CacheTags.user(nextRecipientId ?? payment.recipientId)
      ),
    ]);

    return updatedPayment;
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

    // Invalidate payment cache
    await Promise.all([
      cache.delete(CacheKeys.payment(paymentId)),
      cache.invalidateByTag(CacheTags.user(payment.senderId)),
      cache.invalidateByTag(CacheTags.user(payment.recipientId)),
    ]);

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

    // Generate cache key based on user, role, and date range
    const cacheKey = `reports:${userId}:${userRole}:${start.getTime()}:${end.getTime()}`;

    // Try cache first
    const cached = await cache.get<PaymentReportsData>(cacheKey);
    if (cached) {
      return cached;
    }

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
    const totalAmount = payments.reduce(
      (sum: number, p: { amount: string | number }) => sum + Number(p.amount),
      0
    );

    // Group by status
    const byStatus: Record<string, number> = {};
    payments.forEach((p: { status: string }) => {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    });

    // Group by type
    const byType: Record<string, number> = {};
    payments.forEach((p: { type: string }) => {
      byType[p.type] = (byType[p.type] || 0) + 1;
    });

    const result = {
      totalPayments,
      totalAmount,
      byStatus,
      byType,
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    };

    // Cache the report (longer TTL since it's aggregated data)
    await cache.set(cacheKey, result, {
      ttl: PaymentsCacheTTL.PAYMENT_REPORTS,
      tags: [CacheTags.payments, CacheTags.user(userId)],
    });

    return result;
  },
};
