# Profile Service Implementation Guide

**Status:** Authoritative  
**Version:** 1.0  
**Date:** 2026-01-XX  
**Context:** Detailed implementation guide for Profile Service

---

## Executive Summary

This document provides a detailed implementation guide for the Profile Service, covering user profile management, preferences, and profile CRUD operations.

---

## 1. Service Overview

### 1.1 Responsibilities

- User profile management (CRUD)
- Profile preferences
- Avatar management
- Profile updates

### 1.2 Technology Stack

- **Framework:** Express.js 4.x
- **Language:** TypeScript 5.9.x
- **Database:** PostgreSQL 16.x (via Prisma)
- **ORM:** Prisma 5.x
- **Validation:** Zod 3.23.x

---

## 2. Implementation Details

### 2.1 Profile Management

**Controller:**

```typescript
// packages/profile-service/src/controllers/profileController.ts
import { AuthRequest } from '@backend/shared-middleware';
import { profileService } from '../services/profileService';

export async function getProfile(req: AuthRequest, res: Response) {
  const profile = await profileService.getProfile(req.user!.userId);

  res.json({
    success: true,
    data: { profile },
  });
}

export async function updateProfile(req: AuthRequest, res: Response) {
  const profile = await profileService.updateProfile(
    req.user!.userId,
    req.body
  );

  res.json({
    success: true,
    data: { profile },
  });
}
```

**Service:**

```typescript
// packages/profile-service/src/services/profileService.ts
import { prisma } from '@backend/shared-db';

export class ProfileService {
  async getProfile(userId: string) {
    return prisma.userProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });
  }

  async updateProfile(userId: string, data: {
    avatarUrl?: string;
    phone?: string;
    address?: string;
    bio?: string;
    preferences?: any;
  }) {
    return prisma.userProfile.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    });
  }
}

export const profileService = new ProfileService();
```

---

## 3. Related Documents

- `docs/backend-architecture.md` - High-level backend architecture
- `docs/backend-poc2-architecture.md` - POC-2 architecture

---

**Last Updated:** 2026-01-XX  
**Status:** Authoritative - Ready for Implementation

