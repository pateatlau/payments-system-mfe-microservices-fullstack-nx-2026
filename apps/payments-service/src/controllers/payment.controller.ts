/**
 * Payment Controller - HTTP Request Handlers
 */

import type { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/payment.service';
import {
  listPaymentsSchema,
  createPaymentSchema,
  updatePaymentStatusSchema,
  webhookPayloadSchema,
} from '../validators/payment.validators';
import type { UserRole } from 'shared-types';

// Extend Express Request to include user
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    name: string;
    role: UserRole;
  };
}

/**
 * List payments with pagination, filtering, and role-based access
 */
export async function listPayments(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    const query = listPaymentsSchema.parse(req.query);
    const result = await paymentService.listPayments(
      req.user.userId,
      req.user.role,
      query
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get payment by ID
 */
export async function getPaymentById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Payment ID is required',
        },
      });
      return;
    }
    const payment = await paymentService.getPaymentById(
      id,
      req.user.userId,
      req.user.role
    );

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create new payment
 */
export async function createPayment(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    const data = createPaymentSchema.parse(req.body);
    const payment = await paymentService.createPayment(req.user.userId, data);

    res.status(201).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Payment ID is required',
        },
      });
      return;
    }
    const data = updatePaymentStatusSchema.parse(req.body);
    const payment = await paymentService.updatePaymentStatus(
      id,
      req.user.userId,
      req.user.role,
      data
    );

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle payment webhook (stubbed PSP callback)
 */
export async function handleWebhook(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const payload = webhookPayloadSchema.parse(req.body);

    // Find payment
    const payment = await db.payment.findUnique({
      where: { id: payload.paymentId },
    });

    if (!payment) {
      res.status(404).json({
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: 'Payment not found',
        },
      });
      return;
    }

    // Update payment status
    await db.payment.update({
      where: { id: payload.paymentId },
      data: {
        status: payload.status,
        pspTransactionId: payload.pspTransactionId,
        pspStatus: payload.pspStatus,
        failureReason: payload.failureReason,
        completedAt:
          payload.status === 'completed' ? new Date() : payment.completedAt,
      },
    });

    // Create transaction record
    await db.paymentTransaction.create({
      data: {
        paymentId: payload.paymentId,
        status: payload.status,
        statusMessage:
          payload.failureReason || `PSP webhook: ${payload.status}`,
        pspTransactionId: payload.pspTransactionId,
      },
    });

    // TODO: Publish event: payment:webhook:received

    res.json({
      success: true,
      data: {
        message: 'Webhook processed successfully',
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get payment reports
 * Available to VENDOR and ADMIN roles
 */
export async function getPaymentReports(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    // Only VENDOR and ADMIN can access reports
    if (req.user.role !== 'VENDOR' && req.user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only VENDOR and ADMIN roles can access reports',
        },
      });
      return;
    }

    // Parse query parameters
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : undefined;
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : undefined;

    const reports = await paymentService.getPaymentReports(
      req.user.userId,
      req.user.role,
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
}

// Import prisma for webhook handler
import { prisma as db } from '../lib/prisma';
