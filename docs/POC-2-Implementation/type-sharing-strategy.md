# Type Sharing Strategy - POC-2

**Status:** Authoritative  
**Version:** 1.0  
**Date:** 2026-01-XX

---

## 1. Overview

This document defines the strategy for sharing TypeScript types between frontend MFEs, between frontend and backend, and for Module Federation remote types in POC-2.

**Goals:**

- Type safety across the entire stack
- Single source of truth for shared types
- Minimal duplication
- Easy synchronization
- CI/CD validation

---

## 2. Recommended Approach

### 2.1 Strategy: Single Shared Types Library with Domain Separation

**Approach:** Use a single `shared-types` library with domain-specific modules that can be imported by both frontend and backend.

```
libs/
└── shared-types/
    ├── src/
    │   ├── index.ts           # Main exports
    │   ├── api/               # API contract types
    │   │   ├── index.ts
    │   │   ├── auth.ts
    │   │   ├── payments.ts
    │   │   ├── admin.ts
    │   │   └── profile.ts
    │   ├── events/            # Event bus types
    │   │   ├── index.ts
    │   │   └── ...
    │   ├── models/            # Domain models
    │   │   ├── index.ts
    │   │   ├── user.ts
    │   │   ├── payment.ts
    │   │   └── ...
    │   └── common/            # Common utilities
    │       ├── index.ts
    │       └── ...
    ├── package.json
    └── tsconfig.json
```

### 2.2 Why This Approach

**Pros:**

- Single source of truth for all shared types
- Easy to maintain and update
- Clear organization by domain
- Works with both frontend and backend
- Type changes are immediately visible across the stack

**Cons:**

- All changes affect both frontend and backend (but this ensures consistency)
- Requires careful versioning

**Alternatives Considered:**

- **Separate frontend/backend types:** More duplication, sync issues
- **Type generation from OpenAPI:** Good for external APIs, but adds build step

---

## 3. Type Organization Structure

### 3.1 Directory Structure

```
libs/shared-types/src/
├── index.ts                    # Re-exports all public types
│
├── api/                        # API request/response types
│   ├── index.ts
│   ├── common.ts               # Common API types (pagination, errors)
│   ├── auth.ts                 # Auth API types
│   ├── payments.ts             # Payments API types
│   ├── admin.ts                # Admin API types
│   └── profile.ts              # Profile API types
│
├── events/                     # Event bus types
│   ├── index.ts
│   ├── base.ts                 # Base event types
│   ├── auth.ts                 # Auth event types
│   ├── payments.ts             # Payment event types
│   ├── admin.ts                # Admin event types
│   └── system.ts               # System event types
│
├── models/                     # Domain models
│   ├── index.ts
│   ├── user.ts                 # User model
│   ├── payment.ts              # Payment model
│   ├── audit-log.ts            # Audit log model
│   └── config.ts               # System config model
│
├── enums/                      # Shared enums
│   ├── index.ts
│   ├── user-role.ts            # UserRole enum
│   ├── payment-status.ts       # PaymentStatus enum
│   └── payment-type.ts         # PaymentType enum
│
└── common/                     # Common utilities
    ├── index.ts
    ├── result.ts               # Result type for error handling
    └── pagination.ts           # Pagination types
```

### 3.2 Package Configuration

```json
// libs/shared-types/package.json
{
  "name": "@mfe/shared-types",
  "version": "1.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./api": "./src/api/index.ts",
    "./events": "./src/events/index.ts",
    "./models": "./src/models/index.ts",
    "./enums": "./src/enums/index.ts",
    "./common": "./src/common/index.ts"
  }
}
```

### 3.3 TypeScript Configuration

```json
// libs/shared-types/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 4. API Contract Types

### 4.1 Common API Types

```typescript
// libs/shared-types/src/api/common.ts

/**
 * Standard API success response
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * API response union type
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Pagination request parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

/**
 * Pagination response metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
}
```

### 4.2 Auth API Types

```typescript
// libs/shared-types/src/api/auth.ts

import { User, UserRole } from '../models/user';

/**
 * Login request
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login response data
 */
export interface LoginResponseData {
  user: User;
  accessToken: string;
  refreshToken: string;
}

/**
 * Register request
 */
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

/**
 * Register response data
 */
export interface RegisterResponseData {
  user: User;
  accessToken: string;
  refreshToken: string;
}

/**
 * Refresh token request
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Refresh token response data
 */
export interface RefreshTokenResponseData {
  accessToken: string;
}

/**
 * Change password request
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
```

### 4.3 Payments API Types

```typescript
// libs/shared-types/src/api/payments.ts

import { Payment, PaymentStatus, PaymentType } from '../models/payment';
import { PaginationParams, PaginatedResponse } from './common';

/**
 * Create payment request
 */
export interface CreatePaymentRequest {
  amount: number;
  currency?: string;
  description?: string;
  type: PaymentType;
  metadata?: Record<string, unknown>;
}

/**
 * Update payment request
 */
export interface UpdatePaymentRequest {
  status?: PaymentStatus;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Get payments query params
 */
export interface GetPaymentsParams extends PaginationParams {
  status?: PaymentStatus;
  type?: PaymentType;
  startDate?: string;
  endDate?: string;
}

/**
 * Get payments response
 */
export type GetPaymentsResponse = PaginatedResponse<Payment>;

/**
 * Payment reports response
 */
export interface PaymentReportsData {
  totalPayments: number;
  totalAmount: number;
  byStatus: Record<PaymentStatus, number>;
  byType: Record<PaymentType, number>;
  period: {
    start: string;
    end: string;
  };
}
```

### 4.4 Admin API Types

```typescript
// libs/shared-types/src/api/admin.ts

import { User, UserRole } from '../models/user';
import { AuditLog } from '../models/audit-log';
import { PaginationParams, PaginatedResponse } from './common';

/**
 * Create user request (admin)
 */
export interface AdminCreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

/**
 * Update user request (admin)
 */
export interface AdminUpdateUserRequest {
  email?: string;
  name?: string;
  role?: UserRole;
}

/**
 * Get users query params
 */
export interface GetUsersParams extends PaginationParams {
  role?: UserRole;
  search?: string;
}

/**
 * Get users response
 */
export type GetUsersResponse = PaginatedResponse<User>;

/**
 * Get audit logs query params
 */
export interface GetAuditLogsParams extends PaginationParams {
  userId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Get audit logs response
 */
export type GetAuditLogsResponse = PaginatedResponse<AuditLog>;

/**
 * System analytics data
 */
export interface SystemAnalyticsData {
  users: {
    total: number;
    byRole: Record<UserRole, number>;
    activeLastDay: number;
    activeLastWeek: number;
  };
  payments: {
    total: number;
    totalAmount: number;
    completedLastDay: number;
  };
}
```

---

## 5. Domain Model Types

### 5.1 User Model

```typescript
// libs/shared-types/src/models/user.ts

import { UserRole } from '../enums/user-role';

/**
 * User model
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * User with profile
 */
export interface UserWithProfile extends User {
  profile?: UserProfile;
}

/**
 * User profile
 */
export interface UserProfile {
  id: string;
  userId: string;
  avatarUrl?: string;
  phone?: string;
  address?: string;
  bio?: string;
  preferences?: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

/**
 * User preferences
 */
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  notifications?: {
    email: boolean;
    push: boolean;
  };
  language?: string;
}

// Re-export UserRole for convenience
export { UserRole } from '../enums/user-role';
```

### 5.2 Payment Model

```typescript
// libs/shared-types/src/models/payment.ts

import { PaymentStatus, PaymentType } from '../enums';

/**
 * Payment model
 */
export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  type: PaymentType;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Payment with user info
 */
export interface PaymentWithUser extends Payment {
  user: {
    id: string;
    email: string;
    name: string;
  };
}

/**
 * Payment transaction
 */
export interface PaymentTransaction {
  id: string;
  paymentId: string;
  transactionType: string;
  amount: number;
  status: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// Re-export for convenience
export { PaymentStatus, PaymentType } from '../enums';
```

### 5.3 Enums

```typescript
// libs/shared-types/src/enums/user-role.ts

/**
 * User roles
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
  VENDOR = 'VENDOR',
}

// libs/shared-types/src/enums/payment-status.ts

/**
 * Payment status
 */
export enum PaymentStatus {
  PENDING = 'pending',
  INITIATED = 'initiated',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// libs/shared-types/src/enums/payment-type.ts

/**
 * Payment type
 */
export enum PaymentType {
  INITIATE = 'initiate',
  PAYMENT = 'payment',
}
```

---

## 6. Event Bus Types

Event bus types are documented in detail in `event-bus-contract.md`. The types are exported from `@mfe/shared-types/events`:

```typescript
// libs/shared-types/src/events/index.ts

export * from './base';
export * from './auth';
export * from './payments';
export * from './admin';
export * from './system';
```

**Usage:**

```typescript
import {
  AuthLoginPayload,
  PaymentCreatedPayload,
} from '@mfe/shared-types/events';
```

---

## 7. Module Federation Remote Types

### 7.1 Remote Component Types

Define types for components exposed via Module Federation:

```typescript
// libs/shared-types/src/remotes/index.ts

/**
 * Auth MFE exposed components
 */
export interface AuthMfeExports {
  SignIn: React.ComponentType<SignInProps>;
  SignUp: React.ComponentType<SignUpProps>;
}

export interface SignInProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  redirectTo?: string;
}

export interface SignUpProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  redirectTo?: string;
}

/**
 * Payments MFE exposed components
 */
export interface PaymentsMfeExports {
  PaymentsPage: React.ComponentType<PaymentsPageProps>;
}

export interface PaymentsPageProps {
  userId?: string;
}

/**
 * Admin MFE exposed components
 */
export interface AdminMfeExports {
  AdminDashboard: React.ComponentType<AdminDashboardProps>;
  UserManagement: React.ComponentType<UserManagementProps>;
  SystemConfig: React.ComponentType<SystemConfigProps>;
}

export interface AdminDashboardProps {
  className?: string;
}

export interface UserManagementProps {
  className?: string;
}

export interface SystemConfigProps {
  className?: string;
}
```

### 7.2 Type Declaration for Remotes

Create type declarations for Module Federation remotes:

```typescript
// apps/shell/src/remotes.d.ts

declare module 'authMfe/SignIn' {
  import { SignInProps } from '@mfe/shared-types/remotes';
  const SignIn: React.ComponentType<SignInProps>;
  export default SignIn;
}

declare module 'authMfe/SignUp' {
  import { SignUpProps } from '@mfe/shared-types/remotes';
  const SignUp: React.ComponentType<SignUpProps>;
  export default SignUp;
}

declare module 'paymentsMfe/PaymentsPage' {
  import { PaymentsPageProps } from '@mfe/shared-types/remotes';
  const PaymentsPage: React.ComponentType<PaymentsPageProps>;
  export default PaymentsPage;
}

declare module 'adminMfe/AdminDashboard' {
  import { AdminDashboardProps } from '@mfe/shared-types/remotes';
  const AdminDashboard: React.ComponentType<AdminDashboardProps>;
  export default AdminDashboard;
}
```

---

## 8. Type Synchronization Process

### 8.1 Workflow

1. **Type Definition:**
   - All shared types are defined in `libs/shared-types`
   - Changes are made in one place

2. **Type Consumption:**
   - Frontend MFEs import from `@mfe/shared-types`
   - Backend services import from `@mfe/shared-types`
   - Both get the same types

3. **Type Validation:**
   - TypeScript compiler validates types at build time
   - CI/CD runs type checking on all projects
   - Breaking changes are caught early

### 8.2 Change Process

When changing shared types:

1. Update the type in `libs/shared-types`
2. Run `nx affected:build` to see what's affected
3. Update affected code
4. Run `nx affected:test` to verify
5. Commit all changes together

### 8.3 Breaking Change Guidelines

**Non-Breaking Changes (safe):**

- Adding optional fields
- Adding new types
- Adding new enum values (if consumers use exhaustive checks, may need updates)

**Breaking Changes (require coordination):**

- Removing fields
- Renaming fields
- Changing field types
- Removing types

**Process for Breaking Changes:**

1. Announce the change
2. Create migration plan
3. Update all consumers
4. Update the type
5. Verify all builds pass

---

## 9. CI/CD Type Validation

### 9.1 Type Checking in CI

```yaml
# .github/workflows/ci.yml
jobs:
  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: '24.11'
          cache: 'pnpm'

      - run: pnpm install

      # Type check all projects
      - run: nx run-many --target=type-check --all

      # Verify shared-types builds
      - run: nx build shared-types
```

### 9.2 Type Check Target

Add type-check target to projects:

```json
// project.json
{
  "targets": {
    "type-check": {
      "executor": "nx:run-commands",
      "options": {
        "command": "tsc --noEmit -p tsconfig.json",
        "cwd": "{projectRoot}"
      }
    }
  }
}
```

### 9.3 Pre-Commit Hook

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run type check on changed files
nx affected --target=type-check --uncommitted
```

---

## 10. Usage Examples

### 10.1 Frontend Usage

```typescript
// apps/auth-mfe/src/api/auth.ts
import {
  LoginRequest,
  LoginResponseData,
  ApiSuccessResponse,
} from '@mfe/shared-types/api';
import { User } from '@mfe/shared-types/models';

export async function login(credentials: LoginRequest): Promise<User> {
  const response = await apiClient.post<ApiSuccessResponse<LoginResponseData>>(
    '/api/auth/login',
    credentials
  );
  return response.data.data.user;
}
```

### 10.2 Backend Usage

```typescript
// apps/backend/auth-service/src/controllers/auth.controller.ts
import { LoginRequest, LoginResponseData } from '@mfe/shared-types/api';
import { User } from '@mfe/shared-types/models';

export async function login(
  req: Request<unknown, unknown, LoginRequest>,
  res: Response
): Promise<void> {
  const { email, password } = req.body;

  // Validate and authenticate...
  const user: User = await authService.validateCredentials(email, password);
  const tokens = await authService.generateTokens(user);

  const responseData: LoginResponseData = {
    user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };

  res.json({ success: true, data: responseData });
}
```

### 10.3 Event Bus Usage

```typescript
// apps/auth-mfe/src/hooks/useAuth.ts
import { AuthLoginPayload } from '@mfe/shared-types/events';
import { eventBus } from '@mfe/shared-event-bus';

const payload: AuthLoginPayload = {
  user: { id: '1', email: 'test@example.com', name: 'Test', role: 'CUSTOMER' },
  accessToken: 'token',
  refreshToken: 'refresh',
};

eventBus.emit('auth:login', payload, 'auth-mfe');
```

---

## 11. Import Path Aliases

### 11.1 tsconfig.base.json

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "paths": {
      "@mfe/shared-types": ["libs/shared-types/src/index.ts"],
      "@mfe/shared-types/*": ["libs/shared-types/src/*"],
      "@mfe/shared-event-bus": ["libs/shared-event-bus/src/index.ts"],
      "@mfe/shared-api-client": ["libs/shared-api-client/src/index.ts"],
      "@mfe/shared-auth-store": ["libs/shared-auth-store/src/index.ts"],
      "@mfe/shared-design-system": ["libs/shared-design-system/src/index.ts"]
    }
  }
}
```

### 11.2 Import Examples

```typescript
// Import all types
import { User, Payment, LoginRequest } from '@mfe/shared-types';

// Import from specific module
import { LoginRequest, LoginResponseData } from '@mfe/shared-types/api';
import { User, UserRole } from '@mfe/shared-types/models';
import { AuthLoginPayload } from '@mfe/shared-types/events';
import { PaymentStatus } from '@mfe/shared-types/enums';
```

---

## 12. Summary

**Key Points:**

1. **Single shared-types library** with domain separation
2. **Both frontend and backend** import from the same source
3. **TypeScript path aliases** for clean imports
4. **CI/CD validation** ensures type safety
5. **Breaking changes** require coordinated updates

**Benefits:**

- Type safety across the entire stack
- Single source of truth
- Immediate visibility of type changes
- Early detection of breaking changes
- Clean, organized type structure

---

## 13. Related Documents

- `docs/POC-2-Implementation/event-bus-contract.md` - Event bus types
- `docs/POC-2-Implementation/api-contracts.md` - API contract documentation
- `docs/References/mfe-poc2-architecture.md` - POC-2 architecture

---

**Last Updated:** 2026-01-XX  
**Status:** Authoritative
