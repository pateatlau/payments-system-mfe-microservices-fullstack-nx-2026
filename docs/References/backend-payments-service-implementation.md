# Payments Service Implementation Guide

**Status:** Authoritative  
**Version:** 1.0  
**Date:** 2026-01-XX  
**Context:** Detailed implementation guide for Payments Service

---

## Executive Summary

This document provides a detailed implementation guide for the Payments Service, covering payment processing (stubbed), transaction management, role-based access, and event publishing.

**Important Note:** All payment operations are **stubbed** - the backend simulates payment processing but does not integrate with actual Payment Service Providers (PSPs). Real PSP integration will be implemented in MVP/Production phases.

---

## 1. Service Overview

### 1.1 Responsibilities

- Payment initiation (VENDOR role)
- Payment processing (CUSTOMER role) - stubbed
- Transaction management
- Payment history
- Reports generation (VENDOR/ADMIN)
- Payment status tracking

### 1.2 Technology Stack

- **Framework:** Express.js 4.x
- **Language:** TypeScript 5.9.x
- **Database:** PostgreSQL 16.x (via Prisma)
- **ORM:** Prisma 5.x
- **Validation:** Zod 3.23.x
- **Event Hub:** Redis Pub/Sub (POC-2), RabbitMQ (POC-3)

---

## 2. Project Structure

```
packages/payments-service/
├── src/
│   ├── controllers/
│   │   └── paymentController.ts   # Payment endpoints
│   ├── services/
│   │   ├── paymentService.ts      # Payment business logic
│   │   └── transactionService.ts  # Transaction management
│   ├── routes/
│   │   └── paymentRoutes.ts       # Payment routes
│   ├── middleware/
│   │   └── roleMiddleware.ts      # Role-based access
│   ├── validators/
│   │   └── paymentValidators.ts   # Request validation
│   ├── utils/
│   │   └── eventPublisher.ts     # Event publishing
│   └── index.ts                   # Entry point
├── tests/
└── package.json
```

---

## 3. Implementation Details

### 3.1 Create Payment

**Controller:**

```typescript
// packages/payments-service/src/controllers/paymentController.ts
import { Request, Response } from 'express';
import { paymentService } from '../services/paymentService';
import { createPaymentSchema } from '../validators/paymentValidators';
import { AuthRequest } from '@backend/shared-middleware';

export async function createPayment(req: AuthRequest, res: Response) {
  try {
    const validated = createPaymentSchema.parse(req.body);
    const userId = req.user!.userId;

    // Check role-based access
    if (validated.type === 'initiate' && req.user!.role !== 'VENDOR') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only VENDOR can initiate payments',
        },
      });
    }

    if (validated.type === 'payment' && req.user!.role !== 'CUSTOMER') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only CUSTOMER can make payments',
        },
      });
    }

    const payment = await paymentService.createPayment({
      ...validated,
      userId,
    });

    res.status(201).json({
      success: true,
      data: { payment },
    });
  } catch (error) {
    // Error handling
  }
}
```

**Service:**

```typescript
// packages/payments-service/src/services/paymentService.ts
import { prisma } from '@backend/shared-db';
import { eventPublisher } from '../utils/eventPublisher';

export class PaymentService {
  async createPayment(data: {
    userId: string;
    amount: number;
    currency?: string;
    type: 'initiate' | 'payment';
    description?: string;
    metadata?: any;
  }) {
    // Create payment
    const payment = await prisma.payment.create({
      data: {
        userId: data.userId,
        amount: data.amount,
        currency: data.currency || 'USD',
        status: 'pending',
        type: data.type,
        description: data.description,
        metadata: data.metadata,
      },
    });

    // Process payment (stubbed)
    await this.processPayment(payment.id);

    // Publish event
    await eventPublisher.publishPaymentCreated({
      paymentId: payment.id,
      userId: payment.userId,
      amount: payment.amount,
      type: payment.type,
    });

    return payment;
  }

  async processPayment(paymentId: string) {
    // Stubbed payment processing
    // In MVP/Production, this would integrate with actual PSP

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw { code: 'PAYMENT_NOT_FOUND' };
    }

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Update status
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: payment.type === 'initiate' ? 'initiated' : 'processing',
      },
    });

    // Create transaction record
    await prisma.paymentTransaction.create({
      data: {
        paymentId: payment.id,
        transactionType: payment.type,
        amount: payment.amount,
        status: 'processing',
      },
    });

    // Simulate completion (stubbed)
    setTimeout(async () => {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'completed' },
      });

      await eventPublisher.publishPaymentCompleted({
        paymentId: payment.id,
      });
    }, 5000);

    return updatedPayment;
  }

  async getPayments(userId: string, filters?: {
    status?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = { userId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    return prisma.payment.findMany({
      where,
      take: filters?.limit || 20,
      skip: filters?.offset || 0,
      orderBy: { createdAt: 'desc' },
      include: {
        transactions: true,
      },
    });
  }
}

export const paymentService = new PaymentService();
```

---

### 3.2 Event Publishing

```typescript
// packages/payments-service/src/utils/eventPublisher.ts
import { eventPublisher as sharedEventPublisher } from '@backend/shared-event-hub';

export class EventPublisher {
  async publishPaymentCreated(data: {
    paymentId: string;
    userId: string;
    amount: number;
    type: string;
  }) {
    await sharedEventPublisher.publish('payments:payment:created', data);
  }

  async publishPaymentUpdated(data: {
    paymentId: string;
    status: string;
  }) {
    await sharedEventPublisher.publish('payments:payment:updated', data);
  }

  async publishPaymentCompleted(data: { paymentId: string }) {
    await sharedEventPublisher.publish('payments:payment:completed', data);
  }

  async publishPaymentFailed(data: { paymentId: string; reason: string }) {
    await sharedEventPublisher.publish('payments:payment:failed', data);
  }
}

export const eventPublisher = new EventPublisher();
```

---

## 4. Related Documents

- `docs/backend-architecture.md` - High-level backend architecture
- `docs/backend-poc2-architecture.md` - POC-2 architecture (includes Payments Service details)
- `docs/backend-database-implementation.md` - Database implementation

---

**Last Updated:** 2026-01-XX  
**Status:** Authoritative - Ready for Implementation

