# Auth Service Implementation Guide

**Status:** Authoritative  
**Version:** 1.0  
**Date:** 2026-01-XX  
**Context:** Detailed implementation guide for Auth Service

---

## Executive Summary

This document provides a detailed implementation guide for the Auth Service, covering authentication, authorization, user management, JWT token handling, password management, and RBAC implementation.

**Target Audience:**

- Backend developers implementing Auth Service
- Developers integrating with Auth Service

---

## 1. Service Overview

### 1.1 Responsibilities

- User registration and login
- JWT token generation and validation
- Password management (hashing, reset)
- Role-based access control (RBAC)
- Session management (refresh tokens)
- User CRUD operations
- Email verification (basic)

### 1.2 Technology Stack

- **Framework:** Express.js 4.x
- **Language:** TypeScript 5.9.x
- **Database:** PostgreSQL 16.x (via Prisma)
- **ORM:** Prisma 5.x
- **Authentication:** JWT (jsonwebtoken 9.x)
- **Password Hashing:** bcrypt 5.x
- **Validation:** Zod 3.23.x
- **Event Hub:** Redis Pub/Sub (POC-2), RabbitMQ (POC-3)

---

## 2. Project Structure

```
packages/auth-service/
├── src/
│   ├── controllers/
│   │   ├── authController.ts      # Auth endpoints
│   │   └── userController.ts      # User management
│   ├── services/
│   │   ├── authService.ts          # Auth business logic
│   │   ├── userService.ts          # User business logic
│   │   └── tokenService.ts        # JWT token handling
│   ├── routes/
│   │   ├── authRoutes.ts          # Auth routes
│   │   └── userRoutes.ts          # User routes
│   ├── middleware/
│   │   ├── authMiddleware.ts       # JWT validation
│   │   └── rbacMiddleware.ts      # Role-based access
│   ├── validators/
│   │   ├── authValidators.ts      # Request validation
│   │   └── userValidators.ts      # User validation
│   ├── utils/
│   │   ├── passwordUtils.ts       # Password hashing
│   │   └── eventPublisher.ts     # Event publishing
│   └── index.ts                   # Entry point
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── package.json
└── tsconfig.json
```

---

## 3. Implementation Details

### 3.1 User Registration

**Controller:**

```typescript
// packages/auth-service/src/controllers/authController.ts
import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { registerSchema } from '../validators/authValidators';

export async function register(req: Request, res: Response) {
  try {
    // Validate request
    const validated = registerSchema.parse(req.body);

    // Register user
    const result = await authService.register(validated);

    // Return response
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
        },
        tokens: {
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
        },
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: error.errors,
        },
      });
    }

    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'Email already registered',
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Registration failed',
      },
    });
  }
}
```

**Service:**

```typescript
// packages/auth-service/src/services/authService.ts
import { prisma } from '@backend/shared-db';
import bcrypt from 'bcrypt';
import { tokenService } from './tokenService';
import { eventPublisher } from '../utils/eventPublisher';

export class AuthService {
  async register(data: {
    email: string;
    password: string;
    name: string;
    role?: 'ADMIN' | 'CUSTOMER' | 'VENDOR';
  }) {
    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        role: data.role || 'CUSTOMER',
      },
    });

    // Generate tokens
    const tokens = await tokenService.generateTokens(user.id, user.role);

    // Publish event
    await eventPublisher.publish('auth:user:registered', {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user,
      tokens,
    };
  }

  // ... (other methods)
}

export const authService = new AuthService();
```

**Validator:**

```typescript
// packages/auth-service/src/validators/authValidators.ts
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['ADMIN', 'CUSTOMER', 'VENDOR']).optional(),
});
```

---

### 3.2 User Login

**Controller:**

```typescript
export async function login(req: Request, res: Response) {
  try {
    const validated = loginSchema.parse(req.body);

    const result = await authService.login(validated.email, validated.password);

    res.json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
        },
        tokens: {
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
        },
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: error.errors,
        },
      });
    }

    if (error.code === 'INVALID_CREDENTIALS') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Login failed',
      },
    });
  }
}
```

**Service:**

```typescript
async login(email: string, password: string) {
  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw { code: 'INVALID_CREDENTIALS' };
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    throw { code: 'INVALID_CREDENTIALS' };
  }

  // Generate tokens
  const tokens = await tokenService.generateTokens(user.id, user.role);

  // Publish event
  await eventPublisher.publish('auth:user:logged_in', {
    userId: user.id,
    email: user.email,
  });

  return {
    user,
    tokens,
  };
}
```

---

### 3.3 JWT Token Service

**Token Generation:**

```typescript
// packages/auth-service/src/services/tokenService.ts
import jwt from 'jsonwebtoken';
import { prisma } from '@backend/shared-db';
import crypto from 'crypto';

export class TokenService {
  async generateTokens(userId: string, role: string) {
    // Generate access token
    const accessToken = jwt.sign(
      { userId, role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    // Generate refresh token
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshAccessToken(refreshToken: string) {
    // Find refresh token
    const token = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!token || token.expiresAt < new Date()) {
      throw { code: 'INVALID_REFRESH_TOKEN' };
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: token.userId, role: token.user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    return { accessToken };
  }

  async revokeRefreshToken(refreshToken: string) {
    await prisma.refreshToken.delete({
      where: { token: refreshToken },
    });
  }
}

export const tokenService = new TokenService();
```

---

### 3.4 Authentication Middleware

```typescript
// packages/auth-service/src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@backend/shared-db';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided',
        },
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      role: string;
    };

    // Attach user to request
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      },
    });
  }
}
```

---

### 3.5 RBAC Middleware

```typescript
// packages/auth-service/src/middleware/rbacMiddleware.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      });
    }

    next();
  };
}
```

---

### 3.6 Routes

```typescript
// packages/auth-service/src/routes/authRoutes.ts
import express from 'express';
import { register, login, logout, refresh, me } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';
import { apiRateLimit, authRateLimit } from '../middleware/rateLimit';

const router = express.Router();

// Public routes
router.post('/register', authRateLimit, register);
router.post('/login', authRateLimit, login);
router.post('/refresh', refresh);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);

export default router;
```

---

### 3.7 Event Publishing

```typescript
// packages/auth-service/src/utils/eventPublisher.ts
import { eventPublisher as sharedEventPublisher } from '@backend/shared-event-hub';

export class EventPublisher {
  async publishUserRegistered(data: { userId: string; email: string; role: string }) {
    await sharedEventPublisher.publish('auth:user:registered', data);
  }

  async publishUserLoggedIn(data: { userId: string; email: string }) {
    await sharedEventPublisher.publish('auth:user:logged_in', data);
  }

  async publishUserLoggedOut(data: { userId: string }) {
    await sharedEventPublisher.publish('auth:user:logged_out', data);
  }

  async publishPasswordChanged(data: { userId: string }) {
    await sharedEventPublisher.publish('auth:password:changed', data);
  }
}

export const eventPublisher = new EventPublisher();
```

---

## 4. Testing

### 4.1 Unit Tests

```typescript
// packages/auth-service/tests/unit/authService.test.ts
import { authService } from '../../src/services/authService';
import { prisma } from '@backend/shared-db';

describe('AuthService', () => {
  describe('register', () => {
    it('should register a new user', async () => {
      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

      expect(result.user).toBeDefined();
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });
  });
});
```

### 4.2 Integration Tests

```typescript
// packages/auth-service/tests/integration/auth.test.ts
import request from 'supertest';
import app from '../../src/index';

describe('Auth API', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user).toBeDefined();
    expect(response.body.data.tokens).toBeDefined();
  });
});
```

---

## 5. Related Documents

- `docs/backend-architecture.md` - High-level backend architecture
- `docs/backend-poc2-architecture.md` - POC-2 architecture (includes Auth Service details)
- `docs/backend-database-implementation.md` - Database implementation
- `docs/backend-testing-strategy.md` - Testing strategy

---

**Last Updated:** 2026-01-XX  
**Status:** Authoritative - Ready for Implementation

