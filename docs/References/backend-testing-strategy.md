# Backend Testing Strategy

**Status:** Authoritative  
**Version:** 1.0  
**Date:** 2026-01-XX  
**Context:** Comprehensive testing strategy for backend microservices

**Note:** This document uses Vitest as the testing framework. See `docs/backend-testing-framework-decision.md` for the decision rationale (Vitest vs Jest).

---

## Executive Summary

This document defines a comprehensive testing strategy for the backend microservices architecture. The strategy covers unit testing, integration testing, E2E testing, performance testing, and security testing across all POC phases.

**Testing Principles:**

- ✅ **Testing Pyramid** - More unit tests, fewer E2E tests
- ✅ **Shift-Left Testing** - Test early and often
- ✅ **Test Coverage** - 70% coverage target for POC-2
- ✅ **Production-Ready** - All tests must be production-quality
- ✅ **No Throw-Away Tests** - All tests carry forward to MVP/Production

---

## Testing Tools

| Category           | Tool        | Version | Rationale                            |
| ------------------ | ----------- | ------- | ------------------------------------ |
| **Unit Testing**   | Vitest      | 2.0.x   | Aligns with frontend, fast, modern   |
| **API Testing**    | Supertest   | 7.x     | HTTP testing, works with Vitest       |
| **E2E Testing**    | Playwright  | Latest  | End-to-end testing                    |
| **Mocking**        | Vitest Mocks| Native  | Built into Vitest                    |
| **Coverage**        | Vitest Coverage| Native | Built into Vitest                  |
| **Test Database**   | PostgreSQL  | 16.x    | Same as production                    |
| **Test Redis**      | Redis       | 7.x     | Same as production                    |

---

## Testing Strategy by Phase

### POC-2: Foundation Testing

**Focus:** Backend integration, authentication, payment flows (stubbed), event hub

**Coverage Target:** 70%

**Testing Breakdown:**

- **Unit Tests:** 60% of tests
  - Service layer logic
  - Controller handlers
  - Middleware functions
  - Utility functions
  - Validation logic

- **Integration Tests:** 30% of tests
  - API endpoint testing
  - Database integration
  - Event hub integration
  - Authentication flows
  - Payment flows (stubbed)

- **E2E Tests:** 10% of tests
  - Full authentication flow
  - Payment flow (stubbed)
  - Admin operations

---

## 1. Unit Testing

### 1.1 Purpose

Unit tests verify individual functions, methods, and components in isolation. They are fast, reliable, and form the foundation of the testing pyramid.

### 1.2 What to Test

**Service Layer:**

- Business logic
- Data transformation
- Error handling
- Edge cases

**Controller Layer:**

- Request handling
- Response formatting
- Error responses
- Status codes

**Middleware:**

- Authentication middleware
- Rate limiting middleware
- Error handling middleware
- Request validation middleware

**Utilities:**

- Helper functions
- Validation functions
- Formatting functions
- Encryption/decryption functions

### 1.3 Tools

- **Vitest** - Test framework
- **Vitest Mocks** - Mocking dependencies
- **Vitest Coverage** - Code coverage

### 1.4 Example

```typescript
// packages/auth-service/src/services/authService.test.ts
import { describe, it, expect, vi } from 'vitest';
import { AuthService } from './authService';
import { prisma } from '@backend/shared-db';
import bcrypt from 'bcrypt';

vi.mock('@backend/shared-db');
vi.mock('bcrypt');

describe('AuthService', () => {
  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'user@example.com',
        passwordHash: 'hashed-password',
        role: 'CUSTOMER',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true);

      const authService = new AuthService();
      const result = await authService.login('user@example.com', 'password');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('user@example.com');
    });

    it('should throw error with invalid credentials', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const authService = new AuthService();

      await expect(
        authService.login('user@example.com', 'wrong-password')
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
```

### 1.5 Best Practices

- ✅ **Isolate tests** - Each test should be independent
- ✅ **Mock dependencies** - Mock external dependencies (database, Redis, etc.)
- ✅ **Test edge cases** - Test error cases, boundary conditions
- ✅ **Fast execution** - Unit tests should run quickly
- ✅ **Clear test names** - Descriptive test names

---

## 2. Integration Testing

### 2.1 Purpose

Integration tests verify that multiple components work together correctly. They test API endpoints, database interactions, and event hub communication.

### 2.2 What to Test

**API Endpoints:**

- Request/response handling
- Authentication
- Authorization (RBAC)
- Error handling
- Status codes

**Database Integration:**

- CRUD operations
- Transactions
- Relationships
- Migrations

**Event Hub Integration:**

- Event publishing
- Event subscribing
- Event validation

**Service Integration:**

- Service-to-service communication
- Event-based communication
- Error propagation

### 2.3 Tools

- **Vitest** - Test framework
- **Supertest** - HTTP testing
- **Test Database** - Separate test database
- **Test Redis** - Separate test Redis instance

### 2.4 Example

```typescript
// packages/auth-service/src/routes/auth.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../index';
import { prisma } from '@backend/shared-db';

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    // Clean test database
    await prisma.user.deleteMany();
  });

  it('should login user with valid credentials', async () => {
    // Create test user
    await prisma.user.create({
      data: {
        email: 'user@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'Test User',
        role: 'CUSTOMER',
      },
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@example.com',
        password: 'password123',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('accessToken');
    expect(response.body.data).toHaveProperty('refreshToken');
  });

  it('should return 401 with invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@example.com',
        password: 'wrong-password',
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });
});
```

### 2.5 Best Practices

- ✅ **Test database** - Use separate test database
- ✅ **Cleanup** - Clean test data after each test
- ✅ **Real dependencies** - Use real database, Redis (test instances)
- ✅ **Test full flows** - Test complete request/response cycles
- ✅ **Isolate tests** - Each test should be independent

---

## 3. E2E Testing

### 3.1 Purpose

E2E tests verify complete user flows from frontend to backend. They test the entire system working together.

### 3.2 What to Test

**Authentication Flow:**

- User registration
- User login
- Token refresh
- User logout
- Password reset

**Payment Flow (Stubbed):**

- VENDOR initiates payment
- CUSTOMER makes payment
- Payment status updates
- Payment history

**Admin Flow:**

- Admin user management
- Admin audit logs
- Admin analytics

### 3.3 Tools

- **Playwright** - E2E testing framework
- **Test Database** - Separate test database
- **Test Redis** - Separate test Redis instance

### 3.4 Example

```typescript
// e2e/auth-flow.test.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should complete full authentication flow', async ({ page }) => {
    // Navigate to sign-in page
    await page.goto('http://localhost:4200/signin');

    // Fill login form
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect to payments page
    await page.waitForURL('http://localhost:4200/payments');

    // Verify user is logged in
    const userMenu = await page.locator('[data-testid="user-menu"]');
    await expect(userMenu).toBeVisible();

    // Verify API calls
    const apiCalls = page.waitForResponse(
      (response) => response.url().includes('/api/auth/login')
    );
    const response = await apiCalls;
    expect(response.status()).toBe(200);
  });
});
```

### 3.5 Best Practices

- ✅ **Test critical flows** - Focus on critical user journeys
- ✅ **Real environment** - Use test environment similar to production
- ✅ **Cleanup** - Clean test data after tests
- ✅ **Isolate tests** - Each test should be independent
- ✅ **Fast execution** - E2E tests should run reasonably fast

---

## 4. Performance Testing

### 4.1 Purpose

Performance tests verify that the backend can handle expected load and meets performance requirements.

### 4.2 What to Test

**API Performance:**

- Response time (p95 < 200ms)
- Throughput (requests per second)
- Concurrent requests
- Database query performance

**Load Testing:**

- Normal load
- Peak load
- Stress testing

### 4.3 Tools

- **Artillery** - Load testing
- **k6** - Performance testing
- **Apache Bench (ab)** - Simple load testing

### 4.4 Example

```typescript
// performance/api-load.test.ts
import { check, sleep } from 'k6';
import http from 'k6/http';

export const options = {
  stages: [
    { duration: '30s', target: 100 }, // Ramp up to 100 users
    { duration: '1m', target: 100 },   // Stay at 100 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
};

export default function () {
  const response = http.get('http://localhost:3000/api/payments', {
    headers: {
      Authorization: 'Bearer test-token',
    },
  });

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);
}
```

---

## 5. Security Testing

### 5.1 Purpose

Security tests verify that the backend is secure and protected against common vulnerabilities.

### 5.2 What to Test

**Authentication:**

- Invalid credentials
- Expired tokens
- Invalid tokens
- Token tampering

**Authorization:**

- Unauthorized access
- Role-based access
- Permission checks

**Input Validation:**

- SQL injection
- XSS attacks
- Command injection
- Path traversal

**Rate Limiting:**

- Rate limit enforcement
- DDoS protection

### 5.3 Tools

- **Vitest** - Test framework
- **Supertest** - HTTP testing
- **OWASP ZAP** - Security scanning (future)

### 5.4 Example

```typescript
// security/auth-security.test.ts
import request from 'supertest';
import { app } from '../index';

describe('Authentication Security', () => {
  it('should reject SQL injection in email', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: "admin' OR '1'='1",
        password: 'password',
      });

    expect(response.status).toBe(401);
  });

  it('should reject requests without token', async () => {
    const response = await request(app)
      .get('/api/payments');

    expect(response.status).toBe(401);
  });

  it('should reject requests with invalid token', async () => {
    const response = await request(app)
      .get('/api/payments')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
  });
});
```

---

## 6. Test Data Management

### 6.1 Test Fixtures

**Create reusable test data:**

```typescript
// packages/shared-test-utils/src/fixtures.ts
export const testUsers = {
  admin: {
    email: 'admin@test.com',
    password: 'password123',
    role: 'ADMIN',
  },
  customer: {
    email: 'customer@test.com',
    password: 'password123',
    role: 'CUSTOMER',
  },
  vendor: {
    email: 'vendor@test.com',
    password: 'password123',
    role: 'VENDOR',
  },
};
```

### 6.2 Database Seeding

**Seed test database:**

```typescript
// packages/shared-test-utils/src/seed.ts
import { prisma } from '@backend/shared-db';

export async function seedTestData() {
  await prisma.user.createMany({
    data: [
      {
        email: 'admin@test.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'Admin User',
        role: 'ADMIN',
      },
      // ... more test users
    ],
  });
}
```

### 6.3 Test Isolation

**Clean test data:**

```typescript
// packages/shared-test-utils/src/cleanup.ts
import { prisma } from '@backend/shared-db';

export async function cleanupTestData() {
  await prisma.paymentTransaction.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.auditLog.deleteMany();
}
```

---

## 7. Test Coverage

### 7.1 Coverage Targets

- **POC-2:** 70% coverage
- **POC-3:** 75% coverage
- **MVP:** 80% coverage
- **Production:** 85%+ coverage

### 7.2 Coverage Metrics

- **Statements:** 70%
- **Branches:** 70%
- **Functions:** 70%
- **Lines:** 70%

### 7.3 Coverage Reports

**Generate coverage reports:**

```bash
# Run tests with coverage
pnpm test --coverage

# View coverage report
open coverage/lcov-report/index.html
```

---

## 8. CI/CD Integration

### 8.1 GitHub Actions

**Test workflow:**

```yaml
# .github/workflows/backend-test.yml
name: Backend Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

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
      - run: pnpm test:coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## 9. Testing Best Practices

### 9.1 General Principles

- ✅ **Test early and often** - Write tests as you write code
- ✅ **Test isolation** - Each test should be independent
- ✅ **Fast tests** - Unit tests should run quickly
- ✅ **Clear test names** - Descriptive test names
- ✅ **Test edge cases** - Test error cases, boundary conditions
- ✅ **Mock external dependencies** - Mock database, Redis, external APIs
- ✅ **Clean test data** - Clean up test data after tests

### 9.2 Test Organization

```
packages/
├── auth-service/
│   ├── src/
│   │   ├── services/
│   │   │   ├── authService.ts
│   │   │   └── authService.test.ts
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   └── authController.test.ts
│   │   └── routes/
│   │       ├── auth.ts
│   │       └── auth.test.ts
│   └── tests/
│       ├── integration/
│       └── e2e/
```

---

## 10. Testing Deliverables

### 10.1 POC-2 Deliverables

- ✅ Unit tests for all services (70% coverage)
- ✅ Integration tests for all API endpoints
- ✅ E2E tests for critical flows
- ✅ Test coverage reports
- ✅ CI/CD test integration
- ✅ Test documentation

---

## 11. Related Documents

- `docs/testing-strategy-poc-phases.md` - General testing strategy for all POC phases
- `docs/backend-poc2-architecture.md` - POC-2 architecture
- `docs/backend-poc2-tech-stack.md` - POC-2 tech stack
- `docs/security-strategy-banking.md` - Security strategy (includes security testing)
- `docs/sast-implementation-plan.md` - SAST implementation plan

---

**Last Updated:** 2026-01-XX  
**Status:** Authoritative - Ready for POC-2 Implementation

