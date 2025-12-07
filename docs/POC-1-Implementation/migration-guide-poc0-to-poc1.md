# Migration Guide: POC-0 to POC-1

**Status:** ✅ Complete  
**Version:** 1.0  
**Date:** 2026-01-XX

---

## Overview

This guide documents the migration from POC-0 to POC-1, including new features, package additions, architectural changes, and breaking changes (if any).

---

## What Changed

### New Features

1. **Authentication System**
   - Sign-in and sign-up flows
   - Mock authentication
   - Zustand auth store
   - Route protection

2. **Payments System**
   - Payments dashboard
   - CRUD operations (stubbed)
   - Role-based access control
   - TanStack Query integration

3. **Routing**
   - React Router 7 implementation
   - Route protection
   - Automatic redirects

4. **State Management**
   - Zustand for client state
   - TanStack Query for server state

5. **Styling**
   - Tailwind CSS v4 upgrade
   - PostCSS configuration
   - Monorepo support

6. **Role-Based Access Control**
   - VENDOR and CUSTOMER roles
   - UI-level enforcement
   - Helper functions

---

## Package Changes

### New Packages Added

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.0.0",
    "axios": "^1.7.0",
    "react-hook-form": "^7.52.0",
    "react-router": "^7.0.0",
    "react-router-dom": "7.10.1",
    "zod": "^3.23.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@hookform/resolvers": "^3.9.0",
    "@tailwindcss/postcss": "^4.1.17",
    "react-error-boundary": "4.0.13"
  }
}
```

### Package Upgrades

- **Tailwind CSS:** v3 → v4.0+
- **React Error Boundary:** Added (4.0.13)

### Packages Removed

None (all POC-0 packages remain)

---

## Project Structure Changes

### New Applications

```
apps/
├── auth-mfe/          # NEW - Authentication MFE
└── payments-mfe/      # NEW - Payments MFE
```

### New Libraries

```
libs/
├── shared-auth-store/  # NEW - Zustand auth store
└── shared-header-ui/   # NEW - Universal header component
```

### Removed Applications

```
apps/
└── hello-remote/      # REMOVED - Replaced by auth-mfe
```

---

## Architecture Changes

### Module Federation Configuration

**POC-0:**
```typescript
remotes: {
  helloRemote: 'http://localhost:4201/assets/remoteEntry.js',
}
```

**POC-1:**
```typescript
remotes: {
  authMfe: 'http://localhost:4201/assets/remoteEntry.js',
  paymentsMfe: 'http://localhost:4202/assets/remoteEntry.js',
}
```

### Routing

**POC-0:**
- No routing (single page)

**POC-1:**
- React Router 7
- Multiple routes (`/signin`, `/signup`, `/payments`)
- Route protection

### State Management

**POC-0:**
- No state management

**POC-1:**
- Zustand for client state (auth)
- TanStack Query for server state (payments)

---

## Code Migration Steps

### Step 1: Install New Packages

```bash
pnpm add react-router@^7.0.0 react-router-dom@7.10.1
pnpm add zustand@^4.5.0
pnpm add @tanstack/react-query@^5.0.0
pnpm add react-hook-form@^7.52.0 zod@^3.23.0
pnpm add axios@^1.7.0
pnpm add -D @hookform/resolvers@^3.9.0
pnpm add -D @tailwindcss/postcss@^4.1.17
pnpm add react-error-boundary@4.0.13
```

### Step 2: Upgrade Tailwind CSS

```bash
pnpm remove tailwindcss
pnpm add -D tailwindcss@^4.0.0 @tailwindcss/postcss@^4.1.17
```

**Configuration Changes:**
- Switch from Vite plugin to PostCSS plugin
- Use `@config` directive in CSS files
- Update `tailwind.config.js` with absolute paths

### Step 3: Create New Applications

```bash
# Create auth-mfe
nx generate @nx/react:application auth-mfe --bundler=vite

# Create payments-mfe
nx generate @nx/react:application payments-mfe --bundler=vite
```

### Step 4: Create New Libraries

```bash
# Create shared-auth-store
nx generate @nx/js:library shared-auth-store --bundler=tsc

# Create shared-header-ui
nx generate @nx/react:library shared-header-ui --bundler=vite
```

### Step 5: Configure Module Federation

**Update `apps/shell/vite.config.mts`:**
```typescript
remotes: {
  authMfe: 'http://localhost:4201/assets/remoteEntry.js',
  paymentsMfe: 'http://localhost:4202/assets/remoteEntry.js',
}
```

**Update `apps/auth-mfe/vite.config.mts`:**
```typescript
exposes: {
  './SignIn': './src/components/SignIn.tsx',
  './SignUp': './src/components/SignUp.tsx',
}
```

**Update `apps/payments-mfe/vite.config.mts`:**
```typescript
exposes: {
  './PaymentsPage': './src/components/PaymentsPage.tsx',
}
```

### Step 6: Implement Routing

**Create `apps/shell/src/routes/AppRoutes.tsx`:**
```typescript
import { Routes, Route, Navigate } from 'react-router-dom';
import { BrowserRouter } from 'react-router-dom';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/payments" element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
```

### Step 7: Implement State Management

**Create `libs/shared-auth-store/src/lib/shared-auth-store.ts`:**
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create<AuthState>()(
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

### Step 8: Update Tailwind Configuration

**Create `apps/shell/tailwind.config.js`:**
```javascript
const path = require('path');

module.exports = {
  content: [
    path.resolve(__dirname, './src/**/*.{js,jsx,ts,tsx}'),
    path.resolve(__dirname, '../../libs/shared-*/src/**/*.{js,jsx,ts,tsx}'),
  ],
};
```

**Update `apps/shell/src/styles.css`:**
```css
@import "tailwindcss";
@config "../tailwind.config.js";
```

**Update `apps/shell/vite.config.mts`:**
```typescript
import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';

export default defineConfig({
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
  },
});
```

### Step 9: Remove Old Code

**Remove:**
- `apps/hello-remote/` (replaced by auth-mfe)
- `apps/hello-remote-e2e/` (no longer needed)
- Old Module Federation remotes configuration

---

## Breaking Changes

### None

✅ **No breaking changes** - All POC-0 functionality remains intact.

**Compatibility:**
- Module Federation v2 unchanged
- Vite 6.x unchanged
- Nx unchanged
- All POC-0 packages remain compatible

---

## Configuration Changes

### Vite Configuration

**New:**
- Module Federation remotes updated
- PostCSS configuration for Tailwind
- React Router support

### TypeScript Configuration

**New:**
- Type definitions for new packages
- Shared types library

### ESLint Configuration

**Updated:**
- New rules for React Router
- New rules for Zustand
- New rules for TanStack Query

---

## Testing Changes

### New Test Suites

- Unit tests for auth components
- Unit tests for payments components
- Integration tests for user flows
- E2E tests for complete journeys

### Test Configuration

**New:**
- Vitest configuration for new apps
- Playwright configuration for E2E tests
- Test setup files for new libraries

---

## Development Workflow Changes

### New Commands

```bash
# Build remotes
pnpm build:remotes

# Preview all apps
pnpm preview:all

# Test specific apps
pnpm test:auth-mfe
pnpm test:payments-mfe

# E2E tests
pnpm e2e
```

### Workflow Changes

**POC-0:**
- Single app development
- Simple dev server

**POC-1:**
- Multiple apps (shell + remotes)
- Preview mode required (Module Federation v2)
- Build remotes before preview

---

## Migration Checklist

- [ ] Install new packages
- [ ] Upgrade Tailwind CSS to v4
- [ ] Create auth-mfe application
- [ ] Create payments-mfe application
- [ ] Create shared-auth-store library
- [ ] Create shared-header-ui library
- [ ] Update Module Federation configuration
- [ ] Implement routing (React Router 7)
- [ ] Implement state management (Zustand + TanStack Query)
- [ ] Update Tailwind configuration
- [ ] Remove hello-remote application
- [ ] Update tests
- [ ] Update documentation
- [ ] Verify all functionality works

---

## Rollback Plan

If migration fails:

1. **Git Revert:**
   ```bash
   git revert <commit-hash>
   ```

2. **Package Rollback:**
   ```bash
   pnpm install
   ```

3. **Configuration Restore:**
   - Restore `vite.config.mts` files
   - Restore `tailwind.config.js` files
   - Restore `package.json`

---

## Post-Migration Verification

### Functional Verification

- [ ] Shell app loads correctly
- [ ] Auth MFE loads correctly
- [ ] Payments MFE loads correctly
- [ ] Sign-in flow works
- [ ] Sign-up flow works
- [ ] Payments page loads
- [ ] Route protection works
- [ ] Role-based access works

### Testing Verification

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Coverage meets 70% target

### Build Verification

- [ ] All apps build successfully
- [ ] Module Federation works in preview mode
- [ ] No TypeScript errors
- [ ] No linting errors

---

## Related Documentation

- [`poc-1-completion-summary.md`](./poc-1-completion-summary.md) - POC-1 summary
- [`packages-and-libraries.md`](./packages-and-libraries.md) - Package details
- [`developer-workflow.md`](./developer-workflow.md) - Development guide
- [`../POC-0-Implementation/`](../POC-0-Implementation/) - POC-0 documentation

---

## Support

If you encounter issues during migration:

1. Check this guide for common issues
2. Review POC-1 implementation documentation
3. Check GitHub issues (if applicable)
4. Review test files for examples

---

**Status:** ✅ Complete  
**Last Updated:** 2026-01-XX

