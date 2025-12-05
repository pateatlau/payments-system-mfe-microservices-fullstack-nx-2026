# API Gateway Implementation Guide

**Status:** Authoritative  
**Version:** 1.0  
**Date:** 2026-01-XX  
**Context:** Detailed implementation guide for API Gateway

---

## Executive Summary

This document provides a detailed implementation guide for the API Gateway, covering routing, authentication, rate limiting, CORS, error handling, and request/response transformation.

---

## 1. Service Overview

### 1.1 Responsibilities

- Request routing to microservices
- Authentication and authorization
- Rate limiting
- CORS handling
- Request/response transformation
- Error handling
- Logging

### 1.2 Technology Stack

- **Framework:** Express.js 4.x
- **Language:** TypeScript 5.9.x
- **Authentication:** JWT (jsonwebtoken 9.x)
- **Rate Limiting:** express-rate-limit 7.x
- **CORS:** cors 2.x
- **Security:** Helmet 7.x

---

## 2. Implementation Details

### 2.1 Main Application

```typescript
// packages/api-gateway/src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import routes from './routes';

const app = express();

// Security
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(requestLogger);

// Routes
app.use(routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Error handling
app.use(errorHandler);

const PORT = process.env.API_PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
```

---

### 2.2 Routing

```typescript
// packages/api-gateway/src/routes/index.ts
import express from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { apiRateLimit, authRateLimit } from '../middleware/rateLimit';

// Service routes
import authRoutes from './auth';
import paymentsRoutes from './payments';
import adminRoutes from './admin';
import profileRoutes from './profile';

const router = express.Router();

// Public routes
router.use('/api/auth', authRateLimit, authRoutes);

// Protected routes
router.use('/api/payments', authenticate, apiRateLimit, paymentsRoutes);
router.use('/api/profile', authenticate, apiRateLimit, profileRoutes);

// Admin routes
router.use('/api/admin', authenticate, requireRole('ADMIN'), apiRateLimit, adminRoutes);

export default router;
```

---

### 2.3 Rate Limiting

```typescript
// packages/api-gateway/src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later.',
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Stricter for auth
  message: 'Too many authentication attempts, please try again later.',
});
```

---

### 2.4 Error Handling

```typescript
// packages/api-gateway/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}
```

---

## 3. Related Documents

- `docs/backend-architecture.md` - High-level backend architecture
- `docs/backend-poc2-architecture.md` - POC-2 architecture
- `docs/backend-poc3-architecture.md` - POC-3 architecture (includes nginx)

---

**Last Updated:** 2026-01-XX  
**Status:** Authoritative - Ready for Implementation

