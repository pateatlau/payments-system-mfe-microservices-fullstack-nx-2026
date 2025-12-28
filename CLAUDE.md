# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MFE Payments System - A production-ready, full-stack microfrontend platform demonstrating enterprise-grade architecture patterns for payment processing applications. Built with React + Nx + Rspack + Module Federation v2 + Node.js + PostgreSQL + RabbitMQ + nginx.

**Tech Stack:**
- **Frontend:** React 18.3.1, Rspack 1.6.x (Module Federation v2), Tailwind CSS 4.0, Zustand, TanStack Query, shadcn/ui
- **Backend:** Node.js 24.11.x, Express 5.x, PostgreSQL 16, Prisma 5.x, Redis, RabbitMQ
- **Build:** Nx 22.1.x monorepo, pnpm 9.x
- **Infrastructure:** nginx (reverse proxy, SSL/TLS), Docker Compose, Prometheus, Grafana, Jaeger, Sentry

## Essential Commands

### Initial Setup
```bash
pnpm install                # Install dependencies
pnpm ssl:generate           # Generate self-signed SSL certificates (first time)
pnpm infra:start            # Start Docker infrastructure (nginx, PostgreSQL, RabbitMQ, Redis, observability)
pnpm backend:setup          # Run Prisma generate + migrations for all services
```

### Development
```bash
# Start full application
pnpm dev:backend            # Start all backend services (API Gateway + 4 microservices)
pnpm dev:all                # Start all frontend MFEs (HTTPS mode via nginx)
pnpm dev:mf                 # Start all frontend MFEs (HTTP mode, direct access)

# Start individual services
pnpm dev:api-gateway        # API Gateway (port 3000)
pnpm dev:auth-service       # Auth service (port 3001)
pnpm dev:payments-service   # Payments service (port 3002)
pnpm dev:admin-service      # Admin service (port 3003)
pnpm dev:profile-service    # Profile service (port 3004)

# Start individual MFEs
pnpm dev:shell              # Shell app (port 4200)
pnpm dev:auth-mfe           # Auth MFE (port 4201)
pnpm dev:payments-mfe       # Payments MFE (port 4202)
pnpm dev:admin-mfe          # Admin MFE (port 4203)
pnpm dev:profile-mfe        # Profile MFE (port 4204)
```

### Testing
```bash
# Frontend tests
pnpm test                   # Run all frontend tests
pnpm test:coverage          # Run with coverage report
pnpm test:shell             # Test specific MFE
pnpm test:payments-mfe      # Test specific MFE

# Backend tests
pnpm test:backend           # Run all backend tests
pnpm test:auth-service      # Test specific service
pnpm test:coverage:backend  # Backend tests with coverage

# E2E tests
pnpm test:e2e               # Run Playwright E2E tests (requires services running)
```

### Building
```bash
pnpm build                  # Build all projects
pnpm build:backend          # Build backend services only
pnpm build:remotes          # Build all remote MFEs (required before building shell)
pnpm build:shell            # Build shell app
```

### Database Operations
```bash
# Per-service Prisma operations (each service has separate DB)
pnpm db:auth:generate       # Generate Prisma client for auth service
pnpm db:auth:migrate        # Run migrations for auth service
pnpm db:auth:studio         # Open Prisma Studio for auth service

# Replace 'auth' with 'payments', 'admin', or 'profile' for other services
pnpm db:payments:generate
pnpm db:admin:migrate
pnpm db:profile:studio

# Bulk operations
pnpm db:all:generate        # Generate clients for all services
pnpm db:all:migrate         # Run migrations for all services
```

### Infrastructure
```bash
pnpm infra:start            # Start all Docker services
pnpm infra:stop             # Stop all Docker services
pnpm infra:restart          # Restart infrastructure
pnpm infra:logs             # View Docker logs

# Observability
pnpm observability:start    # Start Prometheus + Grafana + Jaeger
pnpm grafana:ui             # Open Grafana dashboard (http://localhost:3010, admin/admin)
pnpm prometheus:ui          # Open Prometheus (http://localhost:9090)
pnpm jaeger:ui              # Open Jaeger tracing (http://localhost:16686)
pnpm swagger:ui:https       # Open Swagger API docs (https://localhost/api-docs)

# Redis cache
pnpm redis:flush            # Clear Redis cache
pnpm redis:keys             # List all Redis keys
```

## Architecture Overview

### Microfrontend Architecture (Module Federation v2)

**Shell App (Host)** - Orchestrates MFE loading, manages routing, provides shared context
- Port: 4200
- Location: `apps/shell/`
- Consumes: All remote MFEs
- rspack.config.js: Defines remotes and shared dependencies

**Remote MFEs** - Independent, deployable frontend modules
- **Auth MFE** (4201): SignIn, SignUp components - `apps/auth-mfe/`
- **Payments MFE** (4202): Payment processing UI - `apps/payments-mfe/`
- **Admin MFE** (4203): User administration - `apps/admin-mfe/`
- **Profile MFE** (4204): User profile management - `apps/profile-mfe/`

Each remote exposes components via Module Federation and must maintain identical `sharedDependencies` configuration to ensure singleton instances.

### Shared Libraries

**Frontend Libraries** (`libs/`):
- `shared-auth-store/` - Zustand authentication store (MUST be singleton across MFEs)
- `shared-api-client/` - HTTP client with JWT interceptors
- `shared-design-system/` - shadcn/ui components with Tailwind v4
- `shared-theme-store/` - Dark/light mode theme management
- `shared-session-sync/` - Cross-tab session synchronization
- `shared-websocket/` - WebSocket client for real-time features
- `shared-event-bus/` - Inter-MFE communication
- `shared-types/` - TypeScript interfaces
- `shared-utils/` - Common utilities

**Backend Libraries** (`libs/backend/`):
- `observability/` - Prometheus, Jaeger, Sentry integration
- `rabbitmq-event-hub/` - Event-driven messaging
- `cache/` - Redis caching utilities

### Microservices Architecture

**API Gateway** (Port 3000) - `apps/api-gateway/`
- Request routing to backend services
- JWT authentication validation
- Rate limiting (100 req/min API, 10 req/min auth)
- CORS handling
- GraphQL endpoint (Apollo Server)
- WebSocket server for real-time communication

**Backend Services** - Domain-driven decomposition with separate databases:
- **Auth Service** (3001) - `apps/auth-service/` - auth_db (users, sessions, tokens)
- **Payments Service** (3002) - `apps/payments-service/` - payments_db (payments, transactions)
- **Admin Service** (3003) - `apps/admin-service/` - admin_db (audit_logs, settings)
- **Profile Service** (3004) - `apps/profile-service/` - profile_db (profiles, preferences)

### Database Architecture

**Separate Database per Service** - Each service has its own PostgreSQL database:
- Connection strings defined in service `.env` files
- Prisma schema location: `apps/<service-name>/prisma/schema.prisma`
- Generated client: `apps/<service-name>/node_modules/.prisma/<service>-client`
- TypeScript path alias: `.prisma/<service>-client` (see `tsconfig.base.json`)

**Important:** When modifying database schemas:
1. Edit the Prisma schema in `apps/<service-name>/prisma/schema.prisma`
2. Run `pnpm db:<service>:generate` to update the client
3. Run `pnpm db:<service>:migrate` to apply migrations
4. Never modify the generated client directly

### Event-Driven Architecture (RabbitMQ)

**Exchange Topology:**
- `user.events` (topic) - User-related events
- `payment.events` (topic) - Payment processing events
- `admin.events` (topic) - Administrative events
- `system.events` (fanout) - System-wide notifications

**Usage:**
- Services publish events to exchanges
- Queues bind to exchanges with routing keys
- Persistent messages with DLQ (dead letter queue) for retries
- Event Hub library: `@payments-system/rabbitmq-event-hub`

## Critical Implementation Details

### Module Federation Shared Dependencies

All MFEs **MUST** have identical `sharedDependencies` configuration in their `rspack.config.js`:
```javascript
const sharedDependencies = {
  react: { singleton: true, requiredVersion: '18.3.1', eager: false },
  'react-dom': { singleton: true, requiredVersion: '18.3.1', eager: false },
  'shared-auth-store': { singleton: true, eager: false }, // CRITICAL for auth state
  // ... other shared dependencies
};
```

Without singleton configuration, MFEs will have separate instances of stores, breaking state synchronization.

### Rspack Configuration (Module Federation)

**Shell App** (`apps/shell/rspack.config.js`):
- Acts as HOST consuming remotes
- Defines `remotes` object with MFE URLs
- Does NOT use `NxAppRspackPlugin` (conflicts with Tailwind v4)
- Uses custom PostCSS loader chain for Tailwind CSS v4
- HMR WebSocket config varies by HTTPS/HTTP mode (see `client.webSocketURL`)

**Remote MFEs** (`apps/*-mfe/rspack.config.js`):
- Acts as REMOTE exposing components
- Defines `exposes` object with component paths
- Must use same `sharedDependencies` as shell
- Output includes `remoteEntry.js` (Module Federation manifest)

### Theme System (Dark/Light Mode)

Implemented via `shared-theme-store` with:
- System preference detection (follows OS theme)
- User preference override (localStorage persistence)
- Cross-tab synchronization (BroadcastChannel)
- CSS variables for theme colors (`--background`, `--foreground`, etc.)
- Tailwind v4 integration with design tokens

**When adding new components:** Use CSS variables or Tailwind classes that respect theme (e.g., `bg-background`, `text-foreground`).

### API Client & Authentication

**HTTP Client** (`@mfe/shared-api-client`):
- Axios instance with JWT interceptors
- Automatic token refresh on 401
- Base URL: `process.env.NX_API_BASE_URL` (default: `https://localhost/api`)

**Auth Flow:**
1. Login returns `accessToken` (15 min) + `refreshToken` (7 days, HTTP-only cookie)
2. Access token stored in Zustand store (memory only)
3. Refresh token automatically used to renew access token
4. On logout, both tokens cleared

**RBAC Roles:** ADMIN, CUSTOMER, VENDOR (see `libs/shared-types/` for permissions)

### nginx Reverse Proxy

**Configuration:** `nginx/nginx.conf`
- SSL/TLS termination (certs in `nginx/ssl/`)
- Rate limiting (API, auth endpoints)
- Request routing:
  - `/` → Shell app (4200)
  - `/api/*` → API Gateway (3000)
  - `/ws` → WebSocket server
  - `/hmr/*` → HMR WebSocket for MFEs (HTTPS mode)
- Static asset caching (1 year for immutable assets)

**Certificates:**
- Self-signed for local dev (`pnpm ssl:generate`)
- Trust cert in OS keychain to avoid browser warnings
- Production deployment requires valid SSL certs

### State Management Strategy

| State Type | Solution | Use Case |
|------------|----------|----------|
| Client State | Zustand | Authentication, theme, UI preferences |
| Server State | TanStack Query | API data, caching, background sync |
| Form State | React Hook Form + Zod | Form inputs, validation |
| Cross-MFE | Event Bus | Inter-module communication |

### WebSocket Integration

**Server:** API Gateway exposes WebSocket endpoint at `/ws`
- Client library: `shared-websocket`
- Auto-reconnect with exponential backoff
- Event-based API (subscribe/publish)
- Used for real-time notifications, live updates

### Testing Strategy

**Unit Tests:** Jest + React Testing Library
- Co-located with components (`*.spec.tsx`)
- Coverage target: 70%+
- Run single test: `pnpm test:<project-name> --testPathPattern=<file>`

**E2E Tests:** Playwright
- Location: `apps/shell-e2e/`
- Requires all services running
- Critical user journeys (login, payment flow, admin operations)

### Performance & Observability

**Metrics Collection:**
- All backend services expose `/metrics` endpoint (Prometheus format)
- Grafana dashboards: Service overview + API Gateway details
- Access: `http://localhost:3010` (admin/admin)

**Distributed Tracing:**
- OpenTelemetry instrumentation on all services
- Jaeger UI: `http://localhost:16686`
- Automatic span creation for HTTP requests and DB queries

**Error Tracking:**
- Sentry integration (frontend + backend)
- DSN configured via `NX_SENTRY_DSN` env var
- Release tracking with `NX_SENTRY_RELEASE`

## Common Workflows

### Adding a New MFE Component

1. Create component in appropriate MFE (`apps/<mfe-name>/src/`)
2. Export from MFE's `rspack.config.js` `exposes` section
3. Add to shell's `remotes` configuration
4. Import in shell using `import(<mfe-name>/<component>)`
5. Ensure identical `sharedDependencies` across all configs

### Modifying Database Schema

1. Edit `apps/<service-name>/prisma/schema.prisma`
2. Run `pnpm db:<service>:generate` to update Prisma client
3. Run `pnpm db:<service>:migrate` to create and apply migration
4. Update service code to use new schema
5. Test migration with `pnpm db:<service>:studio`

### Adding a New Backend Endpoint

1. Add route handler in service (`apps/<service-name>/src/routes/`)
2. Add service logic (`apps/<service-name>/src/services/`)
3. Update API Gateway proxy routes if needed (`apps/api-gateway/src/routes/`)
4. Add Swagger JSDoc comments for documentation
5. Add integration test
6. Verify in Swagger UI: `https://localhost/api-docs`

### Adding Event-Driven Communication

1. Define event type in `libs/shared-types/`
2. Publish event using `@payments-system/rabbitmq-event-hub`
3. Subscribe in consuming service with queue binding
4. Handle event with retry logic and DLQ fallback
5. Test with `pnpm rabbitmq:test`

### Debugging Tips

**Frontend:**
- Check browser console for Module Federation errors
- Verify `remoteEntry.js` is accessible (e.g., `http://localhost:4201/remoteEntry.js`)
- Check shared dependencies singleton status in Redux DevTools
- Use React DevTools to inspect component tree

**Backend:**
- Check service logs: `pnpm backend:status` to verify services running
- Test endpoints: `pnpm test:api:health`, `pnpm test:api:login`
- Check database: `pnpm db:<service>:studio`
- View metrics: `pnpm prometheus:ui`
- View traces: `pnpm jaeger:ui`

**Infrastructure:**
- Check Docker status: `pnpm infra:status`
- View logs: `pnpm infra:logs`
- Test nginx proxy: `curl -k https://localhost/health`
- Check RabbitMQ: `pnpm rabbitmq:ui` (http://localhost:15672, admin/admin)

## Access Points

| Service | URL | Credentials | Notes |
|---------|-----|-------------|-------|
| Application | https://localhost | - | Accept self-signed cert warning |
| Swagger API Docs | https://localhost/api-docs | - | Interactive API testing |
| GraphQL | https://localhost/graphql | - | Apollo Server |
| Grafana | http://localhost:3010 | admin/admin | Metrics dashboards |
| Prometheus | http://localhost:9090 | - | Raw metrics |
| Jaeger | http://localhost:16686 | - | Distributed tracing |
| RabbitMQ | http://localhost:15672 | admin/admin | Queue management |
| Shell (direct) | http://localhost:4200 | - | Bypass nginx (HTTP mode) |

## Project Structure Highlights

```
apps/
├── shell/                    # Shell app (Module Federation host)
├── *-mfe/                    # Remote MFEs (auth, payments, admin, profile)
├── api-gateway/              # API Gateway + WebSocket server
└── *-service/                # Backend microservices
    ├── prisma/
    │   └── schema.prisma     # Database schema (per service)
    └── src/
        ├── routes/           # Express routes
        └── services/         # Business logic

libs/
├── shared-*/                 # Frontend shared libraries
└── backend/                  # Backend shared libraries
    ├── observability/        # Prometheus + Jaeger + Sentry
    ├── rabbitmq-event-hub/   # Event-driven messaging
    └── cache/                # Redis caching

nginx/
├── nginx.conf                # Main nginx configuration
└── ssl/                      # SSL certificates (self-signed for dev)

docs/
├── EXECUTIVE_SUMMARY.md      # High-level overview
├── IMPLEMENTATION-JOURNEY.md # POC evolution
└── POC-3-Implementation/     # Current phase documentation
```

## Important Notes

- **Module Federation HMR:** When running HTTPS mode (`pnpm dev:all`), HMR WebSocket paths are proxied through nginx (`/hmr/*`). HTTP mode uses direct connections.
- **Environment Variables:** Frontend env vars use `NX_` prefix and are injected at build time via `rspack.DefinePlugin`.
- **Port Allocation:** 3000-3004 (backend), 4200-4204 (frontend), 5432-5435 (PostgreSQL), 9090 (Prometheus), 3010 (Grafana), 16686 (Jaeger).
- **Tailwind v4:** Uses `@import "tailwindcss"` in CSS files (not `@tailwind` directives). PostCSS config required.
- **Nx Caching:** Enabled for build, test, lint targets. Clear with `pnpm nx reset`.
- **CORS:** API Gateway configured for frontend origins. Update `CORS_ORIGINS` env var if needed.

## Implementation Examples

### Example 1: Using Auth Store in a Component

```typescript
// apps/payments-mfe/src/components/PaymentsList.tsx
import { useAuthStore } from 'shared-auth-store';

export function PaymentsList() {
  const { user, isAuthenticated, hasRole } = useAuthStore();

  // Check authentication
  if (!isAuthenticated) {
    return <div>Please log in to view payments</div>;
  }

  // Role-based rendering
  const isAdmin = hasRole('ADMIN');

  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      {isAdmin && <button>Admin Actions</button>}
      {/* Payment list component */}
    </div>
  );
}
```

### Example 2: Creating and Exposing a New MFE Component

**Step 1:** Create component in MFE
```typescript
// apps/payments-mfe/src/components/PaymentDetails.tsx
export function PaymentDetails({ paymentId }: { paymentId: string }) {
  return <div>Payment Details for {paymentId}</div>;
}
```

**Step 2:** Export in rspack.config.js
```javascript
// apps/payments-mfe/rspack.config.js
new rspack.container.ModuleFederationPlugin({
  name: 'paymentsMfe',
  filename: 'remoteEntry.js',
  exposes: {
    './PaymentsPage': './src/components/PaymentsPage.tsx',
    './PaymentDetails': './src/components/PaymentDetails.tsx', // NEW
  },
  shared: sharedDependencies,
})
```

**Step 3:** Import in Shell
```typescript
// apps/shell/src/app/app.tsx
import { lazy } from 'react';

const PaymentDetails = lazy(() => import('paymentsMfe/PaymentDetails'));

// Use in route
<Route path="/payments/:id" element={<PaymentDetails />} />
```

### Example 3: Adding a Backend Endpoint

**Step 1:** Create route handler
```typescript
// apps/payments-service/src/routes/payment.ts
import express from 'express';
import { authenticate } from '../middleware/auth';
import * as paymentController from '../controllers/payment.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// CRUD operations
router.get('/payments', paymentController.listPayments);
router.post('/payments', paymentController.createPayment);
router.get('/payments/:id', paymentController.getPaymentById);

export { router as paymentRoutes };
```

**Step 2:** Add controller with Swagger docs
```typescript
// apps/payments-service/src/controllers/payment.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: List all payments
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *     responses:
 *       200:
 *         description: List of payments
 */
export async function listPayments(req: Request, res: Response) {
  const userId = req.user?.id; // From auth middleware
  const page = parseInt(req.query.page as string) || 1;
  const limit = 10;

  const payments = await prisma.payment.findMany({
    where: { userId },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: payments });
}
```

**Step 3:** Register in main.ts
```typescript
// apps/payments-service/src/main.ts
import { paymentRoutes } from './routes/payment';

app.use('/api', paymentRoutes); // Routes available at /api/payments
```

### Example 4: Using TanStack Query for API Calls

```typescript
// apps/payments-mfe/src/hooks/usePayments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '@mfe/shared-api-client';

const apiClient = getApiClient();

export function usePayments() {
  return useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const response = await apiClient.get('/payments');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: CreatePaymentDto) => {
      const response = await apiClient.post('/payments', payment);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch payments list
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}

// Usage in component
function PaymentsList() {
  const { data: payments, isLoading, error } = usePayments();
  const createPayment = useCreatePayment();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {payments?.map(payment => <PaymentCard key={payment.id} {...payment} />)}
      <button onClick={() => createPayment.mutate({ amount: 100 })}>
        Create Payment
      </button>
    </div>
  );
}
```

### Example 5: RabbitMQ Event Publishing and Subscribing

**Publishing Events:**
```typescript
// apps/auth-service/src/controllers/auth.controller.ts
import { getEventHub } from '@payments-system/rabbitmq-event-hub';

export async function registerUser(req: Request, res: Response) {
  // Create user in database
  const user = await prisma.user.create({ data: { ... } });

  // Publish event to RabbitMQ
  const eventHub = getEventHub();
  await eventHub.publish('user.events', 'user.created', {
    userId: user.id,
    email: user.email,
    role: user.role,
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, data: user });
}
```

**Subscribing to Events:**
```typescript
// apps/payments-service/src/events/subscriber.ts
import { getEventHub } from '@payments-system/rabbitmq-event-hub';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

export async function startUserEventSubscriber() {
  const eventHub = getEventHub();

  // Subscribe to user created events
  await eventHub.subscribe(
    'user.events',
    'user.created',
    'payments-service-user-sync',
    async (message) => {
      try {
        const { userId, email, role } = message;

        // Sync user to payments service database
        await prisma.user.upsert({
          where: { id: userId },
          create: { id: userId, email, role },
          update: { email, role },
        });

        logger.info('User synced from auth service', { userId });
      } catch (error) {
        logger.error('Failed to sync user', { error, message });
        throw error; // Will trigger retry via DLQ
      }
    }
  );

  logger.info('User event subscriber started');
}
```

### Example 6: Theme-Aware Component with shadcn/ui

```typescript
// apps/profile-mfe/src/components/ProfileCard.tsx
import { Card, CardHeader, CardTitle, CardContent } from '@mfe/shared-design-system';
import { useThemeStore } from '@mfe/shared-theme-store';

export function ProfileCard() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <Card className="bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="text-foreground">User Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Current theme: {theme}
        </p>
        <button
          onClick={toggleTheme}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Toggle Theme
        </button>
      </CardContent>
    </Card>
  );
}
```

**CSS Variables (automatically applied by theme store):**
```css
/* Theme variables in app.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  /* ... more theme variables */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  /* ... dark mode overrides */
}
```

### Example 7: Database Operations with Prisma

**Define Schema:**
```prisma
// apps/payments-service/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/payments-client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Payment {
  id          String   @id @default(uuid())
  userId      String
  amount      Decimal  @db.Decimal(10, 2)
  currency    String   @default("USD")
  status      PaymentStatus @default(PENDING)
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([status])
}

enum PaymentStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}
```

**Use in Service:**
```typescript
// apps/payments-service/src/services/payment.service.ts
import { PrismaClient } from '.prisma/payments-client';

const prisma = new PrismaClient();

export async function createPayment(data: CreatePaymentDto) {
  // Transaction example
  return await prisma.$transaction(async (tx) => {
    // Create payment
    const payment = await tx.payment.create({
      data: {
        userId: data.userId,
        amount: data.amount,
        currency: data.currency,
        description: data.description,
        status: 'PENDING',
      },
    });

    // Create audit log
    await tx.auditLog.create({
      data: {
        action: 'PAYMENT_CREATED',
        userId: data.userId,
        paymentId: payment.id,
        metadata: { amount: data.amount },
      },
    });

    return payment;
  });
}

export async function listPayments(userId: string, filters: PaymentFilters) {
  return await prisma.payment.findMany({
    where: {
      userId,
      status: filters.status,
      createdAt: {
        gte: filters.startDate,
        lte: filters.endDate,
      },
    },
    include: {
      user: { select: { email: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: filters.limit,
    skip: (filters.page - 1) * filters.limit,
  });
}
```

### Example 8: Form Validation with React Hook Form + Zod

```typescript
// apps/payments-mfe/src/components/CreatePaymentForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Define validation schema
const paymentSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  currency: z.enum(['USD', 'EUR', 'GBP']),
  description: z.string().min(3, 'Description must be at least 3 characters'),
  recipientEmail: z.string().email('Invalid email address'),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export function CreatePaymentForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      currency: 'USD',
    },
  });

  const createPayment = useCreatePayment();

  const onSubmit = async (data: PaymentFormData) => {
    await createPayment.mutateAsync(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input {...register('amount', { valueAsNumber: true })} type="number" step="0.01" />
        {errors.amount && <span>{errors.amount.message}</span>}
      </div>

      <div>
        <select {...register('currency')}>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
        </select>
        {errors.currency && <span>{errors.currency.message}</span>}
      </div>

      <div>
        <input {...register('description')} placeholder="Payment description" />
        {errors.description && <span>{errors.description.message}</span>}
      </div>

      <button type="submit" disabled={createPayment.isPending}>
        {createPayment.isPending ? 'Creating...' : 'Create Payment'}
      </button>
    </form>
  );
}
```

### Example 9: WebSocket Real-Time Updates

```typescript
// apps/payments-mfe/src/hooks/usePaymentUpdates.ts
import { useEffect } from 'react';
import { useWebSocket } from 'shared-websocket';
import { useQueryClient } from '@tanstack/react-query';

export function usePaymentUpdates() {
  const { subscribe, unsubscribe } = useWebSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to payment updates
    const handlePaymentUpdate = (data: any) => {
      console.log('Payment updated:', data);

      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payments', data.paymentId] });
    };

    subscribe('payment.updated', handlePaymentUpdate);

    return () => {
      unsubscribe('payment.updated', handlePaymentUpdate);
    };
  }, [subscribe, unsubscribe, queryClient]);
}

// Usage in component
function PaymentsList() {
  usePaymentUpdates(); // Auto-refreshes when payments change
  const { data: payments } = usePayments();

  return <div>{/* Render payments */}</div>;
}
```

### Example 10: Inter-MFE Communication with Event Bus

```typescript
// apps/payments-mfe/src/components/PaymentSuccess.tsx
import { eventBus } from '@mfe/shared-event-bus';

export function PaymentSuccess({ paymentId }: { paymentId: string }) {
  const handlePaymentComplete = () => {
    // Emit event that other MFEs can listen to
    eventBus.emit(
      'payment:completed',
      { paymentId, timestamp: Date.now() },
      'payments-mfe'
    );
  };

  return <button onClick={handlePaymentComplete}>Mark Complete</button>;
}

// apps/admin-mfe/src/hooks/usePaymentEvents.ts
import { useEffect } from 'react';
import { eventBus } from '@mfe/shared-event-bus';

export function usePaymentEvents() {
  useEffect(() => {
    const handlePaymentCompleted = (data: any) => {
      console.log('Payment completed in another MFE:', data.paymentId);
      // Update admin dashboard, show notification, etc.
    };

    eventBus.on('payment:completed', handlePaymentCompleted);

    return () => {
      eventBus.off('payment:completed', handlePaymentCompleted);
    };
  }, []);
}
```

## Documentation

Key resources in `docs/`:
- `EXECUTIVE_SUMMARY.md` - Architecture overview for stakeholders
- `IMPLEMENTATION-JOURNEY.md` - Evolution from POC-0 to POC-3
- `POC-3-Implementation/implementation-plan.md` - Current phase plan
- `POC-3-Implementation/DARK-MODE-FULL-IMPLEMENTATION-PLAN.md` - Theme system details
- `POC-3-Implementation/ssl-tls-setup-guide.md` - HTTPS setup and troubleshooting
- `POC-3-Implementation/OBSERVABILITY_LIVE_SETUP.md` - Metrics/tracing setup
- `adr/` - Architecture Decision Records
