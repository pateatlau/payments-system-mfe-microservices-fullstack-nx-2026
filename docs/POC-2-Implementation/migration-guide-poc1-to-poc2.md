# Migration Guide: POC-1 to POC-2

**Status:** ✅ Complete  
**Version:** 1.0  
**Date:** 2026-12-09

---

## Overview

This guide documents the migration from POC-1 to POC-2, including new features, architectural changes, backend integration, and breaking changes.

---

## What Changed

### New Features

1. **Real Backend Integration**
   - REST API with backend services (Auth, Payments, Admin, Profile)
   - API Gateway for routing and authentication
   - Real JWT authentication (replaces mock auth)
   - Token refresh mechanism
   - API client library with interceptors

2. **Event Bus for Inter-MFE Communication**
   - Event bus library (`shared-event-bus`)
   - Decoupled inter-MFE communication
   - Replaces shared Zustand stores across MFEs
   - Type-safe event emission and subscription

3. **Admin MFE**
   - New remote MFE (Port 4203)
   - ADMIN role functionality
   - User management, audit logs, system health
   - Role-based access control

4. **Design System**
   - shadcn/ui components library
   - Tailwind CSS v4 design tokens
   - Reusable components (Button, Card, Input, Alert, Badge, Loading, Skeleton)
   - Consistent styling across all MFEs

5. **Enhanced RBAC**
   - Three roles: ADMIN, CUSTOMER, VENDOR
   - Backend-enforced RBAC
   - Frontend UI-level enforcement
   - Route protection with role requirements

6. **Database Integration**
   - PostgreSQL database
   - Prisma ORM
   - User management
   - Payment records
   - Audit logs

7. **Event Hub (Backend)**
   - Redis Pub/Sub for inter-service communication
   - Event publishing and subscription
   - Correlation IDs for event tracking

8. **Enhanced Error Handling**
   - API error transformation
   - Error boundaries
   - Comprehensive error handling

9. **Basic Observability**
   - Error logging
   - API request/response logging
   - Health checks
   - Basic metrics

---

## Architecture Changes

### Frontend Architecture

**POC-1:**

- Mock authentication
- Stubbed frontend APIs
- Shared Zustand stores across MFEs
- Basic RBAC (VENDOR, CUSTOMER)

**POC-2:**

- Real JWT authentication with backend
- Real backend API integration
- Event bus for inter-MFE communication
- Enhanced RBAC (ADMIN, CUSTOMER, VENDOR)
- Design system components

### Backend Architecture (New)

**New Services:**

- API Gateway (Port 3000) - Routing, authentication, rate limiting
- Auth Service (Port 3001) - Authentication, user management
- Payments Service (Port 3002) - Payment operations
- Admin Service (Port 3003) - Admin functionality
- Profile Service (Port 3004) - User profiles
- Event Hub - Redis Pub/Sub communication

### State Management Changes

**POC-1:**

- Zustand for all state (including shared across MFEs)
- TanStack Query for server state (stubbed)

**POC-2:**

- Zustand for client-side state (within single MFEs only)
- TanStack Query for server state (real backend APIs)
- Event bus for inter-MFE communication
- Shared API client for all API calls

---

## Breaking Changes

### 1. Authentication

**POC-1:**

```typescript
// Mock authentication
const user = { id: '1', email: 'user@example.com', role: 'CUSTOMER' };
useAuthStore.getState().setUser(user);
```

**POC-2:**

```typescript
// Real JWT authentication
import { apiClient } from '@mfe/shared-api-client';

const response = await apiClient.post('/auth/login', { email, password });
const { accessToken, refreshToken, user } = response.data;
useAuthStore.getState().login(user, accessToken, refreshToken);
```

### 2. API Calls

**POC-1:**

```typescript
// Stubbed API calls
const payments = await fetch('/api/payments').then(r => r.json());
```

**POC-2:**

```typescript
// Real API calls with shared client
import { apiClient } from '@mfe/shared-api-client';

const response = await apiClient.get('/payments');
const payments = response.data.payments;
```

### 3. Inter-MFE Communication

**POC-1:**

```typescript
// Shared Zustand store
import { useAuthStore } from 'shared-auth-store';
const user = useAuthStore(state => state.user);
```

**POC-2:**

```typescript
// Event bus for inter-MFE communication
import { eventBus } from '@mfe/shared-event-bus';

// Emit event
eventBus.emit('auth:login', { user, accessToken, refreshToken }, 'auth-mfe');

// Subscribe to event
eventBus.on('auth:login', (payload, meta) => {
  // Handle login event
});
```

### 4. Component Usage

**POC-1:**

```typescript
// Custom components or inline styles
<button className="bg-blue-500 px-4 py-2 rounded">Click</button>
```

**POC-2:**

```typescript
// Design system components
import { Button } from '@mfe/shared-design-system';

<Button variant="default">Click</Button>
```

---

## Migration Steps

### Step 1: Update Dependencies

Install new dependencies:

```bash
pnpm add @mfe/shared-api-client @mfe/shared-event-bus @mfe/shared-design-system
```

### Step 2: Update Authentication

Replace mock authentication with real JWT:

1. Update `shared-auth-store` to use real tokens
2. Add token refresh logic
3. Update auth MFE to call backend API
4. Update API client interceptors

### Step 3: Replace Shared Zustand Stores

Replace shared Zustand stores with event bus:

1. Remove shared Zustand stores across MFEs
2. Implement event bus communication
3. Update components to use event bus
4. Keep Zustand for single-MFE state only

### Step 4: Update API Calls

Replace stubbed APIs with real backend calls:

1. Use shared API client for all API calls
2. Update API endpoints to match backend contracts
3. Handle API errors properly
4. Update TanStack Query hooks

### Step 5: Migrate to Design System

Replace inline components with design system:

1. Import design system components
2. Replace custom buttons, inputs, cards
3. Use design tokens for colors
4. Update Tailwind configs

### Step 6: Add Admin MFE

Create new Admin MFE:

1. Generate Admin MFE with Nx
2. Configure Module Federation
3. Implement admin functionality
4. Add ADMIN role checks

### Step 7: Update Tests

Update tests for real backend:

1. Update unit tests for new APIs
2. Add integration tests
3. Update E2E tests for real backend
4. Add full-stack integration tests

---

## Configuration Changes

### Environment Variables

**New Environment Variables:**

```env
# Backend API URLs
VITE_API_BASE_URL=http://localhost:3000
VITE_AUTH_SERVICE_URL=http://localhost:3001
VITE_PAYMENTS_SERVICE_URL=http://localhost:3002
VITE_ADMIN_SERVICE_URL=http://localhost:3003
VITE_PROFILE_SERVICE_URL=http://localhost:3004

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/payments_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

### Module Federation Configuration

**New Remote (POC-2):**

```javascript
// rspack.config.js - Shell
remotes: {
  authMfe: 'authMfe@http://localhost:4201/remoteEntry.js',
  paymentsMfe: 'paymentsMfe@http://localhost:4202/remoteEntry.js',
  adminMfe: 'adminMfe@http://localhost:4203/remoteEntry.js', // NEW
},
```

### Tailwind Configuration

**Design System Colors (POC-2):**

```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: '#084683',
        50: '#e6f0f8',
        // ... full scale
        700: '#084683',
        hover: '#0a4a7a',
        active: '#06325a',
      },
    },
  },
}
```

---

## Code Examples

### Authentication Flow

**POC-1 (Mock):**

```typescript
// apps/auth-mfe/src/components/SignIn.tsx
const handleSubmit = async (data: SignInFormData) => {
  // Mock authentication
  const user = { id: '1', email: data.email, role: 'CUSTOMER' };
  useAuthStore.getState().setUser(user);
  onSuccess?.();
};
```

**POC-2 (Real JWT):**

```typescript
// apps/auth-mfe/src/components/SignIn.tsx
import { apiClient } from '@mfe/shared-api-client';
import { eventBus } from '@mfe/shared-event-bus';

const handleSubmit = async (data: SignInFormData) => {
  try {
    const response = await apiClient.post('/auth/login', {
      email: data.email,
      password: data.password,
    });

    const { user, accessToken, refreshToken } = response.data;
    useAuthStore.getState().login(user, accessToken, refreshToken);

    // Emit event for shell navigation
    eventBus.emit(
      'auth:login',
      { user, accessToken, refreshToken },
      'auth-mfe'
    );

    onSuccess?.();
  } catch (error) {
    // Handle error
  }
};
```

### API Calls

**POC-1 (Stubbed):**

```typescript
// apps/payments-mfe/src/hooks/usePayments.ts
const fetchPayments = async () => {
  // Stubbed response
  return [
    { id: '1', amount: 100, status: 'completed' },
    { id: '2', amount: 200, status: 'pending' },
  ];
};
```

**POC-2 (Real Backend):**

```typescript
// apps/payments-mfe/src/hooks/usePayments.ts
import { apiClient } from '@mfe/shared-api-client';

const fetchPayments = async () => {
  const response = await apiClient.get('/payments');
  return response.data.payments;
};
```

### Component Migration

**POC-1 (Custom):**

```tsx
<button className="bg-blue-500 px-4 py-2 rounded text-white">Submit</button>
```

**POC-2 (Design System):**

```tsx
import { Button } from '@mfe/shared-design-system';

<Button variant="default">Submit</Button>;
```

---

## Testing Updates

### Unit Tests

**POC-1:**

- Mock API responses
- Test components with mock data

**POC-2:**

- Mock API client
- Test with real API contracts
- Test event bus integration

### Integration Tests

**POC-1:**

- Frontend integration only
- Mock backend

**POC-2:**

- Full-stack integration tests
- Real backend API verification
- Event bus verification

### E2E Tests

**POC-1:**

- UI-level tests
- Mock authentication

**POC-2:**

- Full-stack E2E tests
- Real backend integration
- Backend API verification

---

## Database Migration

### Initial Setup

1. Install PostgreSQL
2. Create database
3. Run Prisma migrations
4. Seed initial data

```bash
# Database setup
cd backend
npx prisma migrate dev
npx prisma db seed
```

### Schema Changes

See `libs/backend/db/prisma/schema.prisma` for complete schema.

---

## Deployment Considerations

### Development

- All services run locally
- PostgreSQL and Redis required
- Environment variables configured

### Production (Future)

- Containerized services
- Database migrations
- Environment-specific configs
- Health checks and monitoring

---

## Rollback Plan

If issues occur during migration:

1. **Keep POC-1 branch** - Maintain working POC-1 codebase
2. **Feature flags** - Use feature flags for gradual rollout
3. **Database backup** - Backup database before migrations
4. **API versioning** - Maintain API compatibility

---

## Related Documentation

- [`implementation-plan.md`](./implementation-plan.md) - Complete POC-2 implementation plan
- [`project-rules.md`](./project-rules.md) - POC-2 project rules
- [`api-contracts.md`](./api-contracts.md) - Backend API contracts
- [`event-bus-contract.md`](./event-bus-contract.md) - Event bus contract
- [`design-system-guide.md`](./design-system-guide.md) - Design system usage

---

## Support

For questions or issues during migration:

1. Review this guide
2. Check implementation plan
3. Review API contracts
4. Check test examples
