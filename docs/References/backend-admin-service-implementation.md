# Admin Service Implementation Guide

**Status:** Authoritative  
**Version:** 1.0  
**Date:** 2026-01-XX  
**Context:** Detailed implementation guide for Admin Service

---

## Executive Summary

This document provides a detailed implementation guide for the Admin Service, covering user management, system configuration, audit logging, and analytics.

---

## 1. Service Overview

### 1.1 Responsibilities

- User management (CRUD)
- Role assignment
- System configuration
- Audit logs
- Analytics and reporting
- System health monitoring

### 1.2 Technology Stack

- **Framework:** Express.js 4.x
- **Language:** TypeScript 5.9.x
- **Database:** PostgreSQL 16.x (via Prisma)
- **ORM:** Prisma 5.x
- **Validation:** Zod 3.23.x
- **Event Hub:** Redis Pub/Sub (POC-2), RabbitMQ (POC-3)

---

## 2. Implementation Details

### 2.1 User Management

**Controller:**

```typescript
// packages/admin-service/src/controllers/userController.ts
import { AuthRequest } from '@backend/shared-middleware';
import { userService } from '../services/userService';

export async function listUsers(req: AuthRequest, res: Response) {
  const users = await userService.listUsers({
    limit: parseInt(req.query.limit as string) || 20,
    offset: parseInt(req.query.offset as string) || 0,
  });

  res.json({
    success: true,
    data: { users },
  });
}

export async function updateUserRole(
  req: AuthRequest,
  res: Response
) {
  const { id } = req.params;
  const { role } = req.body;

  const user = await userService.updateUserRole(id, role);

  res.json({
    success: true,
    data: { user },
  });
}
```

**Service:**

```typescript
// packages/admin-service/src/services/userService.ts
import { prisma } from '@backend/shared-db';
import { auditLogger } from '../utils/auditLogger';

export class UserService {
  async listUsers(filters?: { limit?: number; offset?: number }) {
    return prisma.user.findMany({
      take: filters?.limit || 20,
      skip: filters?.offset || 0,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        // Don't return passwordHash
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUserRole(userId: string, role: string, adminUserId: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
    });

    // Log audit
    await auditLogger.log({
      userId: adminUserId,
      action: 'user.role.updated',
      resourceType: 'user',
      resourceId: userId,
      details: { role },
    });

    return user;
  }
}
```

---

### 2.2 Audit Logging

```typescript
// packages/admin-service/src/utils/auditLogger.ts
import { prisma } from '@backend/shared-db';

export class AuditLogger {
  async log(data: {
    userId?: string;
    action: string;
    resourceType?: string;
    resourceId?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        details: data.details,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }
}

export const auditLogger = new AuditLogger();
```

---

## 3. Related Documents

- `docs/backend-architecture.md` - High-level backend architecture
- `docs/backend-poc2-architecture.md` - POC-2 architecture

---

**Last Updated:** 2026-01-XX  
**Status:** Authoritative - Ready for Implementation

