# Developer Workflow - Frontend

**Status:** ✅ Complete  
**Date:** 2026-12-09  
**Task:** 5.5.1 - Technical Documentation

---

## Overview

This guide explains how to develop, build, and test the POC-2 frontend microfrontend application with real backend integration.

**Key Features:**

- Module Federation v2 with Rspack (HMR enabled)
- Real backend API integration
- Event bus for inter-MFE communication
- Design system components
- Real JWT authentication

---

## Prerequisites

1. **Node.js** 24.11.x LTS and **pnpm** 9.x installed
2. **Dependencies installed**: `pnpm install`
3. **Ports available**: 4200, 4201, 4202, 4203
4. **Backend services running** (see `developer-workflow-backend.md`)
5. **PostgreSQL and Redis running** (for backend)

---

## Architecture

- **Shell App** (Port 4200) - Host application that loads remotes
- **Auth MFE** (Port 4201) - Authentication microfrontend (SignIn, SignUp)
- **Payments MFE** (Port 4202) - Payments microfrontend (PaymentsPage)
- **Admin MFE** (Port 4203) - Admin microfrontend (AdminDashboard) - NEW in POC-2

---

## Development Workflow

### Initial Setup (First Time)

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.required .env
   # Edit .env with your configuration
   ```

3. **Start backend services** (see `developer-workflow-backend.md`):

   ```bash
   pnpm dev:backend
   ```

4. **Start frontend services:**
   ```bash
   pnpm dev:mf
   ```

### Standard Development Workflow

#### Option 1: Quick Start (Recommended)

**Single Terminal - Start All Frontend Dev Servers:**

```bash
pnpm dev:mf
```

This starts all four dev servers (shell, auth-mfe, payments-mfe, admin-mfe) in parallel with HMR enabled.

**Access the application:**

- Shell: http://localhost:4200
- Auth MFE (standalone): http://localhost:4201
- Payments MFE (standalone): http://localhost:4202
- Admin MFE (standalone): http://localhost:4203

#### Option 2: Individual Server Control

**Terminal 1 - Start Shell:**

```bash
pnpm dev:shell
```

**Terminal 2 - Start Auth MFE:**

```bash
pnpm dev:auth-mfe
```

**Terminal 3 - Start Payments MFE:**

```bash
pnpm dev:payments-mfe
```

**Terminal 4 - Start Admin MFE:**

```bash
pnpm dev:admin-mfe
```

### Making Changes

With HMR enabled, changes are reflected instantly:

1. **Edit any file** in shell, auth-mfe, payments-mfe, or admin-mfe
2. **Save the file** - HMR will automatically update the browser
3. **No rebuild or refresh needed** - Changes appear instantly

---

## Common Commands

### Development

```bash
# Start all frontend dev servers with HMR (recommended)
pnpm dev:mf

# Start individual dev servers
pnpm dev:shell
pnpm dev:auth-mfe
pnpm dev:payments-mfe
pnpm dev:admin-mfe

# Start backend services (required for full-stack development)
pnpm dev:backend

# Start all services (frontend + backend)
pnpm dev:all  # If available, or run in separate terminals
```

### Building

```bash
# Build all projects
pnpm build

# Build specific projects
pnpm build:shell
pnpm build:auth-mfe
pnpm build:payments-mfe
pnpm build:admin-mfe
pnpm build:remotes

# Build affected projects only
pnpm build:affected
```

### Testing

```bash
# Run all frontend tests
pnpm test

# Run tests for specific projects
pnpm test:shell
pnpm test:auth-mfe
pnpm test:payments-mfe
pnpm test:admin-mfe

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm e2e
```

### Linting & Type Checking

```bash
# Lint all projects
pnpm lint

# Type check all projects
pnpm typecheck

# Format code
pnpm format
```

---

## Working with Design System

### Using Design System Components

```typescript
import { Button, Card, Input, Alert, Badge } from '@mfe/shared-design-system';

// Use components
<Button variant="default">Click Me</Button>
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

### Using Design Tokens

```typescript
import { colors } from '@mfe/shared-design-system';

const primaryColor = colors.primary.DEFAULT; // '#084683'
```

### Tailwind Classes

```tsx
<div className="bg-primary text-white">Content</div>
<button className="bg-primary hover:bg-primary-600">Button</button>
```

See [`design-system-guide.md`](./design-system-guide.md) for complete documentation.

---

## Working with API Client

### Making API Calls

```typescript
import { apiClient } from '@mfe/shared-api-client';

// GET request
const response = await apiClient.get('/payments');
const payments = response.data.payments;

// POST request
const response = await apiClient.post('/payments', {
  amount: 100,
  currency: 'USD',
  description: 'Payment',
});
```

### Error Handling

```typescript
try {
  const response = await apiClient.get('/payments');
} catch (error) {
  if (error.response?.status === 401) {
    // Handle unauthorized
  } else if (error.response?.status === 403) {
    // Handle forbidden
  }
}
```

---

## Working with Event Bus

### Emitting Events

```typescript
import { eventBus } from '@mfe/shared-event-bus';

// Emit auth event
eventBus.emit(
  'auth:login',
  {
    user,
    accessToken,
    refreshToken,
  },
  'auth-mfe'
);
```

### Subscribing to Events

```typescript
import { eventBus } from '@mfe/shared-event-bus';

useEffect(() => {
  const unsubscribe = eventBus.on('auth:login', (payload, meta) => {
    // Handle login event
  });

  return () => unsubscribe();
}, []);
```

### Using React Hooks

```typescript
import { useEventSubscription } from '@mfe/shared-event-bus';

useEventSubscription('auth:login', (payload, meta) => {
  // Handle login event
});
```

---

## Working with Authentication

### Sign In

```typescript
import { apiClient } from '@mfe/shared-api-client';
import { useAuthStore } from 'shared-auth-store';
import { eventBus } from '@mfe/shared-event-bus';

const response = await apiClient.post('/auth/login', {
  email,
  password,
});

const { user, accessToken, refreshToken } = response.data;
useAuthStore.getState().login(user, accessToken, refreshToken);

// Emit event for shell navigation
eventBus.emit('auth:login', { user, accessToken, refreshToken }, 'auth-mfe');
```

### Sign Up

```typescript
const response = await apiClient.post('/auth/register', {
  email,
  password,
  name,
});

const { user, accessToken, refreshToken } = response.data;
useAuthStore.getState().signup(user, accessToken, refreshToken);
```

### Logout

```typescript
await apiClient.post('/auth/logout');
useAuthStore.getState().logout();

// Emit event for shell navigation
eventBus.emit('auth:logout', { userId: user.id }, 'auth-mfe');
```

---

## Troubleshooting

### Module Federation Issues

**Problem:** Remotes not loading

**Solution:**

1. Verify remotes are built: `pnpm build:remotes`
2. Check remote URLs in shell's rspack.config.js
3. Check browser console for errors
4. Verify ports are available

### HMR Not Working

**Problem:** Changes not reflecting

**Solution:**

1. Check if HMR is enabled in rspack.config.js
2. Verify file is saved
3. Check browser console for HMR errors
4. Try manual refresh (Cmd+Shift+R / Ctrl+Shift+R)

### API Errors

**Problem:** API calls failing

**Solution:**

1. Verify backend services are running: `pnpm dev:backend`
2. Check API base URL in environment variables
3. Verify JWT token is valid
4. Check network tab in browser DevTools

### Design System Components Not Rendering

**Problem:** Components not styled correctly

**Solution:**

1. Verify Tailwind config includes design system colors
2. Check CSS imports in styles.css
3. Verify design system library is built
4. Check browser console for CSS errors

---

## Best Practices

1. **Use Design System Components** - Don't create custom components when design system exists
2. **Use API Client** - Always use shared API client for API calls
3. **Use Event Bus** - Use event bus for inter-MFE communication, not shared Zustand
4. **Write Tests** - Write tests alongside code (70% coverage minimum)
5. **Follow TypeScript** - No `any` types, fix errors immediately
6. **Use Tailwind v4** - Always use Tailwind v4 syntax, never v3

---

## Related Documentation

- [`developer-workflow-backend.md`](./developer-workflow-backend.md) - Backend development workflow
- [`developer-workflow-fullstack.md`](./developer-workflow-fullstack.md) - Full-stack development workflow
- [`design-system-guide.md`](./design-system-guide.md) - Design system usage
- [`testing-guide.md`](./testing-guide.md) - Testing guide
