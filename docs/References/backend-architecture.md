# Backend Architecture - High-Level Design

**Status:** Planning  
**Version:** 1.0  
**Date:** 2026-01-XX  
**Target Phase:** POC-2

---

## 1. Executive Summary

This document defines the high-level backend architecture for the microfrontend (MFE) platform. The backend will be implemented in POC-2 and will integrate seamlessly with the existing frontend microfrontend architecture.

**Core Principles:**

- Microservices architecture for scalability
- REST API (GraphQL in future)
- PostgreSQL for data persistence
- TypeScript-first approach
- Production-ready from day one
- Seamless integration with frontend MFEs

---

## 2. Architecture Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend MFEs                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Auth MFE   │  │ Payments MFE │  │  Admin MFE   │      │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                │                  │               │
└─────────┼────────────────┼──────────────────┼──────────────┘
          │                │                  │
          ▼                ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    nginx (POC-3)                            │
│              (Reverse Proxy, Load Balancing, SSL)            │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    API Gateway                               │
│              (Authentication, Routing, Rate Limiting)        │
└─────────┬────────────────┬──────────────────┬────────────┘
          │                │                  │
    ┌─────▼─────┐    ┌─────▼─────┐    ┌─────▼─────┐
    │  Auth     │    │ Payments  │    │  Admin    │
    │  Service  │    │  Service  │    │  Service  │
    └─────┬─────┘    └─────┬─────┘    └─────┬─────┘
          │                │                  │
          └────────────────┼──────────────────┘
                           │
                    ┌──────▼──────┐
                    │  PostgreSQL  │
                    │   Database   │
                    └─────────────┘
```

### 2.2 Microservices Architecture

**Services:**

1. **Auth Service** - Authentication, authorization, user management
2. **Payments Service** - Payment processing, transactions, reports
3. **Admin Service** - System administration, user management, configuration
4. **Profile Service** - User profiles, preferences, settings

**Shared Infrastructure:**

- API Gateway (routing, authentication, rate limiting)
- nginx (POC-3: reverse proxy, load balancing, SSL termination)
- PostgreSQL Database (shared database with service-specific schemas)
- Event Hub (POC-2: basic event-based communication, POC-3: production-ready)
  - See `docs/backend-event-hub-implementation-plan.md` for detailed implementation plan
- Service Discovery (future: dynamic service registration)

---

## 3. Technology Stack

### 3.1 Core Technologies

| Category            | Technology   | Version     | Rationale                           |
| ------------------- | ------------ | ----------- | ----------------------------------- |
| **Runtime**         | Node.js      | 24.11.x LTS | Latest LTS, aligns with frontend    |
| **Framework**       | Express      | 4.x         | Industry standard, production-ready |
| **Language**        | TypeScript   | 5.9.x       | Type safety, aligns with frontend   |
| **Package Manager** | pnpm         | 9.x         | Aligns with frontend monorepo (Nx)  |
| **Database**        | PostgreSQL   | 16.x        | Production-ready, ACID compliance   |
| **ORM**             | Prisma       | 5.x         | Type-safe, excellent DX, migrations |
| **Validation**      | Zod          | 3.23.x      | Aligns with frontend, type-safe     |
| **HTTP Client**     | Axios        | 1.7.x       | Aligns with frontend                |

### 3.2 Authentication & Security

| Category             | Technology         | Version | Rationale                |
| -------------------- | ------------------ | ------- | ------------------------ |
| **JWT**              | jsonwebtoken       | 9.x     | Stateless authentication |
| **Password Hashing** | bcrypt             | 5.x     | Industry standard        |
| **Rate Limiting**    | express-rate-limit | 7.x     | DDoS protection          |
| **CORS**             | cors               | 2.x     | Cross-origin support     |
| **Helmet**           | helmet             | 7.x     | Security headers         |

### 3.3 API & Communication

| Category               | Technology        | Version | Rationale           |
| ---------------------- | ----------------- | ------- | ------------------- |
| **REST API**           | Express Router    | Native  | Primary API (POC-2) |
| **GraphQL**            | Apollo Server     | Latest  | Future enhancement  |
| **API Documentation**  | Swagger/OpenAPI   | 3.x     | API documentation   |
| **Request Validation** | express-validator | 7.x     | Input validation    |

### 3.4 Database & Caching

| Category               | Technology     | Version | Rationale                      |
| ---------------------- | -------------- | ------- | ------------------------------ |
| **Database**           | PostgreSQL     | 16.x    | Primary database               |
| **Migrations**         | Prisma Migrate | 5.x     | Type-safe migrations           |
| **Caching**            | Redis          | 7.x     | Session storage, caching       |
| **Connection Pooling** | pg-pool        | Native  | Database connection management |

### 3.5 Monitoring & Observability

| Category           | Technology    | Version | Rationale           |
| ------------------ | ------------- | ------- | ------------------- |
| **Logging**        | Winston       | 3.x     | Structured logging  |
| **Error Tracking** | Sentry        | Latest  | Error monitoring    |
| **Metrics**        | Prometheus    | Latest  | Metrics collection  |
| **Tracing**        | OpenTelemetry | Latest  | Distributed tracing |

### 3.6 Testing

| Category           | Technology | Version | Rationale            |
| ------------------ | ---------- | ------- | -------------------- |
| **Test Framework** | Vitest     | 2.0.x   | Aligns with frontend, fast, modern |
| **API Testing**    | Supertest  | 7.x     | HTTP testing         |
| **E2E Testing**    | Playwright | Latest  | End-to-end testing   |

### 3.7 Development Tools

| Category            | Technology       | Version | Rationale            |
| ------------------- | ---------------- | ------- | -------------------- |
| **Package Manager** | pnpm             | 9.x     | Aligns with frontend (Nx) |
| **Code Quality**    | ESLint           | 9.x     | Aligns with frontend |
| **Formatting**      | Prettier         | 3.3.x   | Aligns with frontend |
| **Type Checking**   | TypeScript       | 5.9.x   | Type safety          |
| **API Client**      | Postman/Insomnia | Latest  | API testing          |

---

## 4. Microservices Design

### 4.1 Auth Service

**Purpose:** Handle authentication, authorization, and user management

**Responsibilities:**

- User registration and login
- JWT token generation and validation
- Password management
- Role-based access control (RBAC)
- Session management
- User CRUD operations

**Endpoints:**

```
POST   /api/auth/register     - User registration
POST   /api/auth/login         - User login
POST   /api/auth/logout        - User logout
POST   /api/auth/refresh       - Refresh JWT token
GET    /api/auth/me            - Get current user
PUT    /api/auth/password       - Change password
POST   /api/auth/forgot-password - Password reset request
POST   /api/auth/reset-password  - Password reset
```

**Database Schema:**

```sql
-- users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'CUSTOMER', 'VENDOR')),
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- refresh_tokens table
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Integration with Frontend:**

- Auth MFE calls `/api/auth/login` and `/api/auth/register`
- JWT tokens stored in Zustand store (frontend)
- Token sent in `Authorization` header for protected routes
- Refresh token mechanism for long-lived sessions

---

### 4.2 Payments Service

**Purpose:** Handle payment processing, transactions, and reports

**Responsibilities:**

- Payment initiation (VENDOR)
- Payment processing (CUSTOMER)
- Transaction management
- Payment history
- Reports generation
- Payment status tracking

**Endpoints:**

```
GET    /api/payments           - List payments (role-based filtering)
GET    /api/payments/:id        - Get payment details
POST   /api/payments            - Create payment (initiate or make)
PUT    /api/payments/:id        - Update payment
DELETE /api/payments/:id       - Cancel payment
GET    /api/payments/reports   - Get payment reports (VENDOR/ADMIN)
GET    /api/payments/history   - Get payment history
POST   /api/payments/:id/status - Update payment status
```

**Database Schema:**

```sql
-- payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'initiated', 'processing', 'completed', 'failed', 'cancelled')),
  type VARCHAR(50) NOT NULL CHECK (type IN ('initiate', 'payment')),
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- payment_transactions table
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Integration with Frontend:**

- Payments MFE uses TanStack Query to fetch payments
- VENDOR role can initiate payments via `POST /api/payments` with `type: 'initiate'`
- CUSTOMER role can make payments via `POST /api/payments` with `type: 'payment'`
- Real-time updates via WebSocket (future) or polling

---

### 4.3 Admin Service

**Purpose:** System administration and user management

**Responsibilities:**

- User management (CRUD)
- Role assignment
- System configuration
- Audit logs
- Analytics and reporting
- System health monitoring

**Endpoints:**

```
GET    /api/admin/users         - List all users
GET    /api/admin/users/:id     - Get user details
POST   /api/admin/users         - Create user
PUT    /api/admin/users/:id     - Update user
DELETE /api/admin/users/:id     - Delete user
PUT    /api/admin/users/:id/role - Update user role
GET    /api/admin/audit-logs    - Get audit logs
GET    /api/admin/analytics     - Get system analytics
GET    /api/admin/config        - Get system configuration
PUT    /api/admin/config         - Update system configuration
```

**Database Schema:**

```sql
-- audit_logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- system_config table
CREATE TABLE system_config (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);
```

**Integration with Frontend:**

- Admin MFE (POC-2) will consume admin endpoints
- Role-based access: Only ADMIN role can access admin endpoints
- Real-time dashboard updates

---

### 4.4 Profile Service

**Purpose:** User profile management and preferences

**Responsibilities:**

- User profile CRUD
- User preferences
- Avatar/image management
- Notification settings
- Account settings

**Endpoints:**

```
GET    /api/profile             - Get current user profile
PUT    /api/profile             - Update profile
POST   /api/profile/avatar      - Upload avatar
DELETE /api/profile/avatar      - Delete avatar
GET    /api/profile/preferences - Get preferences
PUT    /api/profile/preferences - Update preferences
```

**Database Schema:**

```sql
-- user_profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  avatar_url VARCHAR(500),
  phone VARCHAR(20),
  address TEXT,
  bio TEXT,
  preferences JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Integration with Frontend:**

- Profile MFE (future) will consume profile endpoints
- Shared with Auth MFE for profile updates
- Image uploads handled via multipart/form-data

---

## 5. Database Design

### 5.1 Database Architecture

**Approach:** Shared database with service-specific schemas

**Rationale:**

- Simpler for POC-2/MVP
- Easier transactions across services
- Can migrate to separate databases later if needed

**Schema Organization:**

```sql
-- Service-specific schemas
CREATE SCHEMA auth;
CREATE SCHEMA payments;
CREATE SCHEMA admin;
CREATE SCHEMA profile;
```

### 5.2 Entity Relationship Diagram

```
┌─────────────┐
│   users     │
│─────────────│
│ id (PK)     │
│ email       │
│ password    │
│ name        │
│ role        │
└──────┬──────┘
       │
       ├─────────────────┬──────────────────┐
       │                 │                  │
┌──────▼──────┐  ┌──────▼──────┐  ┌────────▼──────┐
│user_profiles│  │  payments   │  │ refresh_tokens│
│─────────────│  │─────────────│  │───────────────│
│ user_id (FK)│  │ user_id (FK)│  │ user_id (FK)  │
│ avatar_url  │  │ amount      │  │ token         │
│ preferences │  │ status      │  │ expires_at    │
└─────────────┘  └──────┬──────┘  └───────────────┘
                        │
                 ┌──────▼──────────┐
                 │payment_transactions│
                 │──────────────────│
                 │ payment_id (FK)  │
                 │ transaction_type │
                 │ amount           │
                 └──────────────────┘
```

### 5.3 Indexes

```sql
-- Performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

## 6. API Design

### 6.1 REST API Standards

**Base URL:** `https://api.example.com/api`

**Versioning:** URL-based (`/api/v1/...`)

**Authentication:** JWT Bearer token

```
Authorization: Bearer <token>
```

**Response Format:**

```typescript
// Success response
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}

// Error response
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": { ... }
  }
}
```

**HTTP Status Codes:**

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

### 6.2 API Endpoints Summary

| Service      | Endpoint                    | Method | Auth | Role            |
| ------------ | --------------------------- | ------ | ---- | --------------- |
| **Auth**     |
|              | `/api/auth/register`        | POST   | ❌   | -               |
|              | `/api/auth/login`           | POST   | ❌   | -               |
|              | `/api/auth/logout`          | POST   | ✅   | All             |
|              | `/api/auth/refresh`         | POST   | ✅   | All             |
|              | `/api/auth/me`              | GET    | ✅   | All             |
| **Payments** |
|              | `/api/payments`             | GET    | ✅   | All             |
|              | `/api/payments`             | POST   | ✅   | VENDOR/CUSTOMER |
|              | `/api/payments/:id`         | GET    | ✅   | All             |
|              | `/api/payments/:id`         | PUT    | ✅   | VENDOR/ADMIN    |
|              | `/api/payments/reports`     | GET    | ✅   | VENDOR/ADMIN    |
| **Admin**    |
|              | `/api/admin/users`          | GET    | ✅   | ADMIN           |
|              | `/api/admin/users/:id`      | PUT    | ✅   | ADMIN           |
|              | `/api/admin/users/:id/role` | PUT    | ✅   | ADMIN           |
| **Profile**  |
|              | `/api/profile`              | GET    | ✅   | All             |
|              | `/api/profile`              | PUT    | ✅   | All             |

### 6.3 Request/Response Examples

**Login:**

```typescript
// POST /api/auth/login
Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "role": "CUSTOMER"
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

**Create Payment (VENDOR):**

```typescript
// POST /api/payments
Request:
{
  "amount": 100.00,
  "currency": "USD",
  "description": "Payment for invoice #123",
  "type": "initiate"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "amount": 100.00,
    "status": "initiated",
    "created_at": "2026-01-XX"
  }
}
```

---

## 7. Authentication & Authorization

### 7.1 Authentication Flow

```
1. User logs in via Auth MFE
   ↓
2. Frontend calls POST /api/auth/login
   ↓
3. Auth Service validates credentials
   ↓
4. Returns JWT access token + refresh token
   ↓
5. Frontend stores tokens in Zustand store
   ↓
6. Frontend includes token in Authorization header
   ↓
7. API Gateway validates token
   ↓
8. Request forwarded to appropriate service
```

### 7.2 JWT Token Structure

```typescript
interface JWTPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'CUSTOMER' | 'VENDOR';
  iat: number;
  exp: number;
}
```

### 7.3 Role-Based Access Control (RBAC)

**Middleware:**

```typescript
// Role-based middleware
function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
      });
    }
    next();
  };
}

// Usage
router.post(
  '/payments',
  authenticate,
  requireRole('VENDOR', 'CUSTOMER'),
  createPayment
);
router.get(
  '/payments/reports',
  authenticate,
  requireRole('VENDOR', 'ADMIN'),
  getReports
);
```

---

## 8. Integration with Frontend

### 8.1 Frontend-Backend Communication

**Architecture:**

```
Frontend MFE → Axios Client → API Gateway → Microservice → PostgreSQL
```

**Axios Configuration:**

```typescript
// packages/shared-api-client/src/index.ts
import axios from 'axios';
import { useAuthStore } from '@web-mfe/shared-auth-store';

const apiClient = axios.create({
  baseURL: process.env.API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().user?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Refresh token or logout
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 8.2 TanStack Query Integration

```typescript
// packages/web-remote-payments/src/hooks/usePayments.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '@web-mfe/shared-api-client';

export const usePayments = () => {
  return useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const response = await apiClient.get('/payments');
      return response.data.data;
    },
  });
};

export const useCreatePayment = () => {
  return useMutation({
    mutationFn: async (payment: CreatePaymentDto) => {
      const response = await apiClient.post('/payments', payment);
      return response.data.data;
    },
  });
};
```

### 8.3 Error Handling

**Frontend Error Handling:**

```typescript
// Unified error handling
try {
  await createPayment.mutateAsync(data);
} catch (error) {
  if (error.response?.status === 403) {
    // Show "Insufficient permissions" message
  } else if (error.response?.status === 400) {
    // Show validation errors
  } else {
    // Show generic error
  }
}
```

---

## 9. Project Structure

### 9.1 Monorepo Structure

```
backend/
├── packages/
│   ├── api-gateway/          # API Gateway service
│   ├── auth-service/         # Auth microservice
│   ├── payments-service/     # Payments microservice
│   ├── admin-service/        # Admin microservice
│   ├── profile-service/      # Profile microservice
│   ├── shared-types/         # Shared TypeScript types
│   ├── shared-utils/         # Shared utilities
│   └── shared-db/            # Shared database schema
├── docker-compose.yml        # Local development
├── package.json              # Root workspace config
├── pnpm-lock.yaml            # pnpm lockfile
└── tsconfig.json
```

**Package Management:**

- ✅ **pnpm (v9.x)** - **Same as frontend** - Unified package management across full stack
- ✅ **pnpm workspaces** - Monorepo management for backend services (via pnpm-workspace.yaml)
- ✅ **Consistent tooling** - Same package manager for frontend and backend simplifies development
- ✅ **Shared dependencies** - Consistent versions across services

### 9.2 Service Structure

```
auth-service/
├── src/
│   ├── controllers/         # Request handlers
│   ├── services/            # Business logic
│   ├── models/              # Prisma models
│   ├── routes/              # Express routes
│   ├── middleware/          # Auth middleware
│   ├── validators/          # Request validation
│   ├── utils/               # Utilities
│   └── index.ts             # Entry point
├── prisma/
│   └── schema.prisma        # Database schema
├── tests/                   # Tests
├── package.json
└── tsconfig.json
```

---

## 10. Development & Deployment

### 10.1 Local Development

**Docker Compose Setup:**

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: universal_mfe
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - '5432:5432'

  redis:
    image: redis:7
    ports:
      - '6379:6379'

  api-gateway:
    build: ./packages/api-gateway
    ports:
      - '3000:3000'
    depends_on:
      - postgres
      - redis

  auth-service:
    build: ./packages/auth-service
    ports:
      - '3001:3001'
    depends_on:
      - postgres

  payments-service:
    build: ./packages/payments-service
    ports:
      - '3002:3002'
    depends_on:
      - postgres

  # nginx will be added in POC-3
  # nginx:
  #   image: nginx:alpine
  #   ports:
  #     - "80:80"
  #   volumes:
  #     - ./nginx/nginx.conf:/etc/nginx/nginx.conf
  #   depends_on:
  #     - api-gateway
```

**Package Management:**

- ✅ **pnpm (v9.x)** - **Same as frontend** - Unified package management across full stack
- ✅ **pnpm workspaces** - Monorepo management for backend services (via pnpm-workspace.yaml)
- ✅ **Consistent tooling** - Same package manager for frontend and backend simplifies development
- ✅ **Consistent commands** - `pnpm install`, `pnpm --filter <service> <command>`

### 10.2 Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/universal_mfe

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://localhost:6379

# API
API_PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:9001
```

### 10.3 CI/CD Pipeline

**GitHub Actions:**

```yaml
# .github/workflows/backend-ci.yml
name: Backend CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '24.11.x'
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9
      - run: pnpm install
      - run: pnpm test
      - run: pnpm lint
      - run: pnpm type-check
      # Note: pnpm is used consistently across frontend and backend
```

---

## 11. Security Considerations

### 11.1 Security Measures

- **JWT Tokens:** Secure token generation and validation
- **Password Hashing:** bcrypt with salt rounds
- **Rate Limiting:** Prevent DDoS attacks
- **CORS:** Configured for frontend origins only
- **Helmet:** Security headers
- **Input Validation:** Zod validation on all inputs
- **SQL Injection:** Prisma ORM prevents SQL injection
- **XSS Protection:** Input sanitization

### 11.2 Best Practices

- Environment variables for secrets
- HTTPS in production
- Regular security audits
- Dependency updates
- Logging and monitoring

---

## 12. Future Enhancements

### 12.1 nginx Reverse Proxy (POC-3)

**Timeline:** POC-3

**Reference:** See `docs/adr/poc-3/0001-nginx-reverse-proxy.md` for decision rationale, alternatives considered, and trade-offs.

**Purpose:**

- Reverse proxy for API Gateway
- Load balancing across service instances
- SSL/TLS termination
- Static file serving
- Rate limiting at infrastructure level
- Request routing and path rewriting

**Configuration:**

```nginx
# Example nginx configuration (POC-3)
upstream api_gateway {
    server api-gateway:3000;
}

server {
    listen 80;
    server_name api.example.com;

    location /api {
        proxy_pass http://api_gateway;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Benefits:**

- Production-ready reverse proxy
- Better performance and caching
- SSL/TLS handling
- Load balancing
- Request routing

### 12.2 GraphQL (Future)

**Timeline:** Post-POC-2

**Implementation:**

- Apollo Server for GraphQL
- GraphQL schema definition
- Resolvers for each service
- GraphQL Federation for microservices

### 12.3 Message Queue (Future)

**Timeline:** MVP Phase

**Technology:** RabbitMQ or Apache Kafka

**Use Cases:**

- Inter-service communication
- Event-driven architecture
- Async processing
- Payment webhooks

### 12.4 Service Discovery (Future)

**Timeline:** Production Phase

**Technology:** Consul or Kubernetes Service Discovery

**Benefits:**

- Dynamic service registration
- Load balancing
- Health checks
- Service mesh integration

### 12.5 Caching Layer (Future)

**Timeline:** MVP Phase

**Technology:** Redis

**Use Cases:**

- Session storage
- API response caching
- Rate limiting
- Real-time data

---

## 13. Migration from Mock APIs

### 13.1 POC-1 → POC-2 Migration

**Step 1: Replace Mock APIs**

```typescript
// Before (POC-1)
import { stubbedPaymentsApi } from '../api/stubbedPayments';

// After (POC-2)
import apiClient from '@web-mfe/shared-api-client';
const response = await apiClient.get('/payments');
```

**Step 2: Update Auth Store**

```typescript
// Replace mockLogin with real API call
login: async (email, password) => {
  const response = await apiClient.post('/auth/login', { email, password });
  const { user, accessToken } = response.data.data;
  set({ user, isAuthenticated: true });
  // Store token
};
```

**Step 3: Update TanStack Query Hooks**

```typescript
// Replace mock functions with real API calls
export const usePayments = () => {
  return useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const response = await apiClient.get('/payments');
      return response.data.data;
    },
  });
};
```

---

## 14. Summary

### 14.1 Architecture Highlights

- ✅ **Microservices:** Auth, Payments, Admin, Profile
- ✅ **REST API:** Primary API (GraphQL future)
- ✅ **PostgreSQL:** Shared database with service schemas
- ✅ **TypeScript:** Type-safe across stack
- ✅ **JWT Authentication:** Stateless auth
- ✅ **RBAC:** Role-based access control
- ✅ **pnpm:** Unified package management (frontend + backend)
- ✅ **nginx:** Reverse proxy (POC-3)
- ✅ **Production-Ready:** From day one

### 14.2 Integration Points

- ✅ **Frontend MFEs** → API Gateway → Microservices
- ✅ **TanStack Query** for data fetching
- ✅ **Axios** for HTTP requests
- ✅ **Zustand** for auth state
- ✅ **Seamless migration** from mock APIs
- ✅ **Event Hub** for inter-microservices communication (POC-2)

### 14.3 Next Steps (POC-2)

1. Setup backend monorepo structure
2. Implement Auth Service
3. Implement Payments Service
4. Setup API Gateway
5. Database schema and migrations
6. Integration with frontend
7. **Event Hub implementation** (see `docs/backend-event-hub-implementation-plan.md`)
8. Testing and documentation

### 14.4 Related Documents

- `docs/adr/README.md` - Architecture Decision Records (ADRs) index
- `docs/backend-poc2-architecture.md` - **POC-2 backend architecture and implementation plan** (detailed)
- `docs/backend-poc2-tech-stack.md` - **POC-2 backend tech stack** (detailed)
- `docs/backend-poc3-architecture.md` - **POC-3 backend architecture and implementation plan** (detailed)
- `docs/backend-poc3-tech-stack.md` - **POC-3 backend tech stack** (detailed)
- `docs/backend-testing-strategy.md` - **Backend testing strategy** (comprehensive)
- `docs/backend-api-documentation-standards.md` - **API documentation standards** (OpenAPI, Swagger)
- `docs/backend-development-setup.md` - **Developer onboarding and setup guide**
- `docs/mfe-poc1-architecture.md` - POC-1 architecture and implementation plan
- `docs/mfe-poc2-architecture.md` - POC-2 architecture (backend integration, design system, basic observability)
- `docs/mfe-poc3-architecture.md` - POC-3 architecture (infrastructure, enhanced observability, basic analytics)
- `docs/mfe-poc1-tech-stack.md` - POC-1 tech stack
- `docs/mfe-poc2-tech-stack.md` - POC-2 tech stack
- `docs/mfe-poc3-tech-stack.md` - POC-3 tech stack
- `docs/backend-event-hub-implementation-plan.md` - Event hub implementation plan for inter-microservices communication
- `docs/security-strategy-banking.md` - Comprehensive security strategy for banking environment
- `docs/session-management-strategy.md` - Session management strategy (cross-tab, cross-device sync)
- `docs/testing-strategy-poc-phases.md` - Comprehensive testing strategy for all POC phases
- `docs/sast-implementation-plan.md` - SAST implementation plan (Git hooks & CI/CD)

---

**Last Updated:** 2026-01-XX  
**Status:** Planning - Ready for POC-2 Implementation
