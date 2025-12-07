# Packages and Libraries Documentation

**POC-1 Implementation**  
**Status:** ✅ Complete

---

## Overview

This document lists all new packages and libraries added in POC-1, their purposes, versions, and usage patterns.

---

## Core Dependencies

### React Router 7

**Package:** `react-router@^7.0.0`, `react-router-dom@7.10.1`

**Purpose:** Client-side routing and navigation

**Usage:**
```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
```

**Key Features:**
- Declarative routing
- Route protection
- Navigation hooks (`useNavigate`, `useLocation`)
- Code splitting support

**Documentation:** [React Router 7 Docs](https://reactrouter.com/)

---

### Zustand

**Package:** `zustand@^4.5.0`

**Purpose:** Lightweight state management for client-side state

**Usage:**
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
```

**Key Features:**
- Simple API
- No boilerplate
- TypeScript support
- Middleware support (persist, devtools)
- Small bundle size

**Usage Pattern:**
```typescript
const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      login: async (email, password) => {
        // ... login logic
      },
    }),
    { name: 'auth-storage' }
  )
);
```

**Documentation:** [Zustand Docs](https://zustand-demo.pmnd.rs/)

---

### TanStack Query

**Package:** `@tanstack/react-query@^5.0.0`

**Purpose:** Server state management, data fetching, and caching

**Usage:**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
```

**Key Features:**
- Automatic caching
- Background refetching
- Optimistic updates
- Error handling
- Loading states

**Usage Pattern:**
```typescript
// Query
const { data, isLoading, error } = useQuery({
  queryKey: ['payments'],
  queryFn: fetchPayments,
});

// Mutation
const mutation = useMutation({
  mutationFn: createPayment,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['payments'] });
  },
});
```

**Documentation:** [TanStack Query Docs](https://tanstack.com/query/latest)

---

### React Hook Form

**Package:** `react-hook-form@^7.52.0`

**Purpose:** Performant form handling with minimal re-renders

**Usage:**
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
```

**Key Features:**
- Uncontrolled components
- Minimal re-renders
- Validation integration (Zod)
- TypeScript support

**Usage Pattern:**
```typescript
const {
  register,
  handleSubmit,
  formState: { errors, isSubmitting },
} = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: { email: '', password: '' },
});
```

**Documentation:** [React Hook Form Docs](https://react-hook-form.com/)

---

### Zod

**Package:** `zod@^3.23.0`

**Purpose:** TypeScript-first schema validation

**Usage:**
```typescript
import { z } from 'zod';
```

**Key Features:**
- Type-safe validation
- Runtime type checking
- Composable schemas
- Great TypeScript integration

**Usage Pattern:**
```typescript
const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(12, 'Password too short'),
});

type FormData = z.infer<typeof schema>;
```

**Documentation:** [Zod Docs](https://zod.dev/)

---

### Axios

**Package:** `axios@^1.7.0`

**Purpose:** HTTP client for API requests (prepared for POC-2)

**Usage:**
```typescript
import axios from 'axios';
```

**Key Features:**
- Promise-based API
- Request/response interceptors
- Automatic JSON parsing
- Request cancellation

**Note:** Not actively used in POC-1 (payments are stubbed), but included for POC-2 backend integration.

**Documentation:** [Axios Docs](https://axios-http.com/)

---

## Styling

### Tailwind CSS v4

**Package:** `tailwindcss@^4.0.0`, `@tailwindcss/postcss@^4.1.17`

**Purpose:** Utility-first CSS framework

**Usage:**
```css
@import "tailwindcss";
@config "../tailwind.config.js";
```

**Key Features:**
- Utility-first approach
- Responsive design
- Customizable design system
- Fast builds

**Configuration:**
- PostCSS plugin (not Vite plugin) for monorepo support
- Absolute content paths for shared libraries
- `@config` directive in CSS files

**Documentation:** [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)

---

## Error Handling

### React Error Boundary

**Package:** `react-error-boundary@4.0.13`

**Purpose:** Error boundary component for React 19 compatibility

**Usage:**
```typescript
import { ErrorBoundary } from 'react-error-boundary';
```

**Key Features:**
- React 19 compatible
- Fallback UI
- Error recovery
- Error reporting

**Usage Pattern:**
```typescript
<ErrorBoundary
  FallbackComponent={ErrorFallback}
  onError={(error, info) => console.error(error, info)}
>
  <RemoteComponent />
</ErrorBoundary>
```

**Documentation:** [react-error-boundary Docs](https://github.com/bvaughn/react-error-boundary)

---

## Testing

### Vitest

**Package:** `vitest@^4.0.0`, `@vitest/ui@^4.0.0`, `@vitest/coverage-v8@^4.0.0`

**Purpose:** Fast unit testing framework (Vite-native)

**Usage:**
```typescript
import { describe, it, expect, vi } from 'vitest';
```

**Key Features:**
- Vite-native (fast)
- Jest-compatible API
- TypeScript support
- UI mode for debugging
- Coverage support

**Documentation:** [Vitest Docs](https://vitest.dev/)

---

### React Testing Library

**Package:** `@testing-library/react@16.3.0`, `@testing-library/jest-dom@^6.9.1`, `@testing-library/user-event@^14.6.1`

**Purpose:** React component testing utilities

**Usage:**
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
```

**Key Features:**
- User-centric testing
- Accessible queries
- Async utilities
- DOM matchers

**Documentation:** [React Testing Library Docs](https://testing-library.com/react)

---

### Playwright

**Package:** `@playwright/test@^1.36.0`, `@nx/playwright@22.1.3`

**Purpose:** End-to-end testing framework

**Usage:**
```typescript
import { test, expect } from '@playwright/test';
```

**Key Features:**
- Cross-browser testing
- Auto-waiting
- Network interception
- Screenshot support

**Documentation:** [Playwright Docs](https://playwright.dev/)

---

## Form Validation

### @hookform/resolvers

**Package:** `@hookform/resolvers@^3.9.0`

**Purpose:** Validation resolver adapters for React Hook Form

**Usage:**
```typescript
import { zodResolver } from '@hookform/resolvers/zod';
```

**Key Features:**
- Zod integration
- Yup integration
- Custom resolver support

**Documentation:** [@hookform/resolvers Docs](https://github.com/react-hook-form/resolvers)

---

## Module Federation

### @module-federation/enhanced

**Package:** `@module-federation/enhanced@0.21.6`

**Purpose:** Module Federation v2 (BIMF) runtime

**Usage:**
```typescript
// Configured in vite.config.mts
import { federation } from '@module-federation/vite';
```

**Key Features:**
- Module Federation v2
- Shared dependencies
- Remote loading
- Runtime integration

**Documentation:** [Module Federation Docs](https://module-federation.io/)

---

### @module-federation/vite

**Package:** `@module-federation/vite@^1.9.2`

**Purpose:** Vite plugin for Module Federation v2

**Usage:**
```typescript
import { federation } from '@module-federation/vite';
```

**Key Features:**
- Vite integration
- Build-time configuration
- Dev mode support (limited)
- Preview mode support

**Documentation:** [Module Federation Vite Plugin](https://module-federation.io/)

---

## Development Tools

### TypeScript

**Package:** `typescript@^5.9.0`

**Purpose:** Type-safe JavaScript

**Key Features:**
- Static type checking
- Modern JavaScript features
- Strict mode support

---

### ESLint

**Package:** `eslint@^9.0.0`, `@typescript-eslint/eslint-plugin@^8.0.0`, `@typescript-eslint/parser@^8.0.0`

**Purpose:** Code linting and quality

**Key Features:**
- Flat config (ESLint 9)
- TypeScript support
- Custom rules

---

### Prettier

**Package:** `prettier@^3.3.0`

**Purpose:** Code formatting

**Key Features:**
- Consistent formatting
- Configurable rules
- Editor integration

---

## Package Versions Summary

| Package | Version | Purpose |
|---------|---------|---------|
| `react-router` | `^7.0.0` | Routing |
| `react-router-dom` | `7.10.1` | Routing (DOM) |
| `zustand` | `^4.5.0` | State management |
| `@tanstack/react-query` | `^5.0.0` | Server state |
| `react-hook-form` | `^7.52.0` | Form handling |
| `zod` | `^3.23.0` | Validation |
| `axios` | `^1.7.0` | HTTP client |
| `tailwindcss` | `^4.0.0` | Styling |
| `react-error-boundary` | `4.0.13` | Error handling |
| `vitest` | `^4.0.0` | Testing |
| `@testing-library/react` | `16.3.0` | Component testing |
| `@playwright/test` | `^1.36.0` | E2E testing |
| `@module-federation/enhanced` | `0.21.6` | Module Federation runtime |
| `@module-federation/vite` | `^1.9.2` | Module Federation plugin |

---

## Installation

All packages are installed via pnpm:

```bash
pnpm install
```

**Package Manager:** pnpm 9.x (recommended for Nx monorepos)

---

## Version Compatibility

### React 18.3.1

All packages are compatible with React 18.3.1:
- React Router 7 ✅
- Zustand 4.5.0 ✅
- TanStack Query 5.0.0 ✅
- React Hook Form 7.52.0 ✅
- React Error Boundary 4.0.13 ✅

### TypeScript 5.9.0

All packages support TypeScript 5.9.0:
- Full type definitions available
- Strict mode compatible
- No `any` types used

---

## Migration Notes

### From POC-0

**New Packages Added:**
- React Router 7 (new)
- Zustand (new)
- TanStack Query (new)
- React Hook Form (new)
- Zod (new)
- Axios (new)
- Tailwind CSS v4 (upgraded from v3)
- React Error Boundary (new)

**No Breaking Changes:**
- All POC-0 packages remain compatible
- Module Federation v2 unchanged
- Vite 6.x unchanged
- Nx unchanged

---

## Related Documentation

- [`poc-1-completion-summary.md`](./poc-1-completion-summary.md) - Overall summary
- [`developer-workflow.md`](./developer-workflow.md) - Development guide
- [`../References/mfe-poc1-tech-stack.md`](../References/mfe-poc1-tech-stack.md) - Tech stack overview

---

**Status:** ✅ Complete  
**Last Updated:** 2026-01-XX

