# POC-1 Implementation Plan

**Status:** Ready for Implementation  
**Version:** 1.0  
**Date:** 2026-01-XX  
**Phase:** POC-1 - Authentication & Payments

> **📊 Progress Tracking:** See [`task-list.md`](./task-list.md) to track completion status and overall progress.

---

## Executive Summary

This document provides a detailed, step-by-step implementation plan for POC-1, extending POC-0 with authentication, payments, routing, state management, and styling. Each task is designed to be:

- **Clear and actionable** - Specific steps that can be executed
- **Small and testable** - Easy to verify completion
- **Production-ready** - No throw-away code
- **Incremental** - Builds on previous steps

**Timeline:** 4-5 weeks  
**Goal:** Working authentication MFE + payments MFE with React Router 7, Zustand, TanStack Query, and Tailwind CSS v4

**Key Features:**

- Authentication system (mock)
- Payments system (stubbed - no actual PSP)
- React Router 7 routing
- Zustand state management
- TanStack Query for server state
- Tailwind CSS v4 styling
- Role-based access control (RBAC)
- Universal header component

---

## Phase 1: Foundation & Setup

### Task 1.1: Review and Fix POC-0 Issues

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-11-review-and-fix-poc-0-issues)

**Objective:** Review POC-0 codebase, fix any bugs, and refactor for maintainability

**Steps:**

1. Review POC-0 codebase for issues
2. Run all tests: `pnpm test`
3. Run type checking: `pnpm typecheck`
4. Run linting: `pnpm lint`
5. Fix any identified bugs
6. Refactor code for consistency
7. Update documentation as needed

**Verification:**

- [x] All POC-0 tests pass
- [x] No TypeScript errors
- [x] No linting errors
- [x] Code reviewed and refactored
- [x] Documentation updated

**Acceptance Criteria:**

- ✅ All POC-0 functionality still works
- ✅ No regressions introduced
- ✅ Code quality improved
- ✅ Documentation is current

**Status:** ✅ Complete  
**Completed Date:** 2026-01-XX  
**Notes:** Fixed TypeScript error in hello-remote/src/test/setup.ts (removed unused vi import). Fixed ESLint config paths in shared-types and shared-utils (corrected import paths from '../' to '../../'). Added '**mf**temp/\*\*' to ESLint ignores to exclude generated Module Federation files. Removed @nx/dependency-checks rule from shared libraries (plugin not installed). All tests pass, type checking passes, and linting passes.

**Cleanup:** Removed hello-remote app and hello-remote-e2e project as they are no longer needed for POC-1 (replaced by auth-mfe). Cleaned up shell app references: deleted RemoteComponent.tsx, **mocks**/HelloRemote.tsx, types/module-federation.d.ts, and removed helloRemote alias from vitest.config.ts. Updated package.json scripts to use auth-mfe instead of hello-remote. All references to hello-remote removed from codebase (documentation references remain for historical context).

---

### Task 1.2: Install POC-1 Dependencies

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-12-install-poc-1-dependencies)

**Objective:** Install all required dependencies for POC-1

**Steps:**

1. Install React Router 7: `pnpm add -w react-router@7.x`
2. Install Zustand: `pnpm add -w zustand@4.5.x`
3. Install TanStack Query: `pnpm add -w @tanstack/react-query@5.x`
4. Install React Hook Form: `pnpm add -w react-hook-form@7.52.x`
5. Install Zod: `pnpm add -w zod@3.23.x`
6. Install Axios: `pnpm add -w axios@1.7.x`
7. Install Tailwind CSS v4: `pnpm add -D -w tailwindcss@4.0`
8. Install React Error Boundary: `pnpm add -w react-error-boundary@4.0.13`
9. Install testing dependencies: `pnpm add -D -w @testing-library/user-event@14.6.1`
10. Verify all dependencies installed correctly

**Verification:**

- [x] React Router 7.x in `package.json`
- [x] Zustand 4.5.x in `package.json`
- [x] TanStack Query 5.x in `package.json`
- [x] React Hook Form 7.52.x in `package.json`
- [x] Zod 3.23.x in `package.json`
- [x] Axios 1.7.x in `package.json`
- [x] Tailwind CSS 4.0+ in `package.json`
- [x] React Error Boundary 4.0.13 in `package.json`
- [x] `pnpm-lock.yaml` updated

**Acceptance Criteria:**

- ✅ All dependencies installed without errors
- ✅ Version numbers match requirements
- ✅ `pnpm install` runs successfully
- ✅ No dependency conflicts

**Status:** ✅ Complete  
**Completed Date:** 2026-01-XX  
**Notes:** Installed all POC-1 dependencies: React Router 7.0.0 (upgraded from 6.29.0, react-router-dom 7.10.1), Zustand 4.5.0, TanStack Query 5.0.0, React Hook Form 7.52.0, Zod 3.23.0, Axios 1.7.0, React Error Boundary 4.0.13, Tailwind CSS 4.0.0, and @hookform/resolvers 3.9.0. All dependencies verified in package.json. pnpm install runs successfully.

---

### Task 1.3: Create Shared Auth Store Library

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-13-create-shared-auth-store-library)

**Objective:** Create Zustand auth store library for shared authentication state

**Steps:**

1. Generate library: `nx generate @nx/js:library shared-auth-store --bundler=tsc --unitTestRunner=vitest`
2. Move library to `libs/shared-auth-store` if needed
3. Install Zustand in library: `pnpm add -w zustand@4.5.x`
4. Create auth store with:
   - User type with RBAC (ADMIN, CUSTOMER, VENDOR)
   - Auth state interface
   - Login/logout/signup actions
   - RBAC helpers (hasRole, hasAnyRole)
   - Persistence middleware (localStorage)
5. Export store and types
6. Write unit tests for auth store

**Verification:**

- [x] Library created at `libs/shared-auth-store`
- [x] Auth store implemented with all required features
- [x] Types exported correctly
- [x] Persistence middleware configured
- [x] Unit tests written and passing
- [x] Library builds successfully

**Acceptance Criteria:**

- ✅ Auth store library created
- ✅ Zustand store with all required actions
- ✅ RBAC helpers implemented
- ✅ Persistence working (localStorage)
- ✅ Unit tests passing (70%+ coverage)
- ✅ Types exported correctly

**Status:** ✅ Complete  
**Completed Date:** 2026-01-XX  
**Notes:** Generated library using Nx generator. Implemented Zustand auth store with: User type with RBAC (ADMIN, CUSTOMER, VENDOR), AuthState interface, login/logout/signup actions with mock authentication, RBAC helpers (hasRole, hasAnyRole), localStorage persistence middleware. Wrote comprehensive unit tests (18 tests covering all functionality, all passing). Library builds successfully. Types exported correctly from index.ts.

---

### Task 1.4: Create Shared Header UI Library

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-14-create-shared-header-ui-library)

**Objective:** Create universal header component library

**Steps:**

1. Generate library: `nx generate @nx/react:library shared-header-ui --bundler=vite --unitTestRunner=vitest`
2. Move library to `libs/shared-header-ui` if needed
3. Create Header component with:
   - Branding/logo
   - Navigation items
   - Logout button
   - User info display (optional)
   - Responsive design
4. Style with Tailwind CSS v4
5. Export Header component
6. Write unit tests

**Verification:**

- [x] Library created at `libs/shared-header-ui`
- [x] Header component implemented
- [x] Tailwind CSS v4 styling applied
- [x] Responsive design working
- [x] Unit tests written and passing
- [x] Library builds successfully

**Acceptance Criteria:**

- ✅ Header UI library created
- ✅ Header component with all required features
- ✅ Tailwind CSS v4 styling
- ✅ Responsive design
- ✅ Unit tests passing (70%+ coverage)
- ✅ Component exported correctly

**Status:** ✅ Complete  
**Completed Date:** 2026-01-XX  
**Notes:** Generated library using Nx React library generator. Created Header component with: branding/logo (customizable), navigation items (Payments, Reports for VENDOR), logout button with custom callback support, user info display (name and role), responsive design (mobile menu button, hidden navigation on mobile, hidden user info on small screens). Styled with Tailwind CSS v4. Wrote comprehensive unit tests (18 tests covering all functionality, 100% coverage, all passing). Component exported correctly from index.ts.

---

### Task 1.5: Configure Tailwind CSS v4

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-15-configure-tailwind-css-v4)

**Objective:** Setup Tailwind CSS v4 for all apps and libraries

**Steps:**

1. Install Tailwind CSS v4: `pnpm add -D -w tailwindcss@4.0`
2. Create Tailwind config file (if needed for v4)
3. Configure Tailwind for shell app
4. Configure Tailwind for auth-mfe app
5. Configure Tailwind for payments-mfe app
6. Configure Tailwind for shared-header-ui library
7. Test Tailwind classes work across all apps
8. Verify build performance

**Verification:**

- [x] Tailwind CSS v4 installed
- [x] Tailwind configured for shell app
- [x] Tailwind configured for auth-mfe app (completed in Task 2.1.6)
- [ ] Tailwind configured for payments-mfe app (when created)
- [x] Tailwind configured for shared-header-ui (via shell config)
- [x] Tailwind classes work in shell app
- [x] Tailwind classes work in auth-mfe app
- [x] Build performance acceptable

**Acceptance Criteria:**

- ✅ Tailwind CSS v4 configured for shell app
- ✅ Tailwind classes work correctly
- ✅ Build performance is good
- ✅ No styling conflicts
- ✅ Responsive utilities work

**Status:** ✅ Complete (shell app configured, remaining apps when created)  
**Completed Date:** 2026-12-06  
**Notes:**

- Used `@tailwindcss/postcss` plugin instead of `@tailwindcss/vite` for monorepo compatibility
- Created `tailwind.config.js` with absolute content paths using `resolve(__dirname, '...')`
- Used `@config "../tailwind.config.js"` directive in CSS to reference config
- Header component integrated into shell Layout for testing
- See `docs/POC-1-Implementation/tailwind-v4-setup-guide.md` for detailed setup guide

---

## Phase 2: Authentication MFE

### Task 2.1: Create Auth MFE Application

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-21-create-auth-mfe-application)

**Objective:** Create auth-mfe remote application

**Steps:**

1. Generate application: `nx generate @nx/react:application auth-mfe --bundler=vite --style=css --routing=false`
2. Move application to `apps/auth-mfe` if needed
3. Configure port 4201 in `vite.config.mts`
4. Update `project.json` paths if needed
5. Test application runs: `pnpm dev:auth-mfe`
6. Verify standalone mode works

**Verification:**

- [x] Application created at `apps/auth-mfe`
- [x] Port 4201 configured
- [x] Application runs successfully
- [x] Standalone mode works
- [x] No build errors

**Acceptance Criteria:**

- ✅ Auth MFE application created
- ✅ Runs on http://localhost:4201
- ✅ Standalone mode works
- ✅ No build errors

**Status:** ✅ Complete  
**Completed Date:** 2026-12-06  
**Notes:** Generated auth-mfe application using `nx generate @nx/react:application auth-mfe --bundler=vite --style=css --routing=false --directory=apps/auth-mfe --unitTestRunner=vitest --e2eTestRunner=none`. Configured port 4201 in vite.config.mts. Application builds successfully, passes type checking, and is ready for Module Federation configuration in Task 2.3.

**Sub-task 2.1.6: Configure Tailwind CSS v4 for auth-mfe** ✅ Complete

- Created `apps/auth-mfe/tailwind.config.js` with content paths for auth-mfe app and shared libraries
- Updated `apps/auth-mfe/src/styles.css` with `@import "tailwindcss"` and `@config "../tailwind.config.js"`
- Updated `apps/auth-mfe/vite.config.mts` to use `@tailwindcss/postcss` plugin with autoprefixer
- Updated `apps/auth-mfe/src/main.tsx` to import styles.css
- Verified Tailwind classes work correctly (tested with sample classes in app.tsx)
- All builds, type checking, and linting pass

---

### Task 2.2: Implement Sign-In Component

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-22-implement-sign-in-component)

**Objective:** Create sign-in page with form validation

**Steps:**

1. Create `SignIn.tsx` component
2. Setup React Hook Form with Zod validation
3. Create sign-in form schema (email, password)
4. Implement form fields (email, password)
5. Add form validation and error messages
6. Integrate with auth store (login action)
7. Add loading states
8. Add error handling
9. Style with Tailwind CSS v4
10. Write unit tests

**Verification:**

- [x] SignIn component created
- [x] React Hook Form integrated
- [x] Zod validation working
- [x] Form fields implemented
- [x] Validation errors displayed
- [x] Auth store integration working
- [x] Loading states working
- [x] Error handling implemented
- [x] Styled with Tailwind CSS v4
- [x] Unit tests written and passing

**Acceptance Criteria:**

- ✅ Sign-in form with validation
- ✅ Email and password fields
- ✅ Form validation working (Zod)
- ✅ Auth store integration
- ✅ Loading and error states
- ✅ Styled with Tailwind CSS v4
- ✅ Unit tests passing (70%+ coverage)

**Status:** ✅ Complete  
**Completed Date:** 2026-12-06  
**Notes:**

Created SignIn component at `apps/auth-mfe/src/components/SignIn.tsx` with the following features:

1. **Form Setup:**
   - React Hook Form with `zodResolver` for validation
   - Zod schema: `z.object({ email: z.string().email(), password: z.string().min(1) })`
   - Type-safe form data using `z.infer<typeof signInSchema>`

2. **Form Fields:**
   - Email input with validation (email format)
   - Password input with validation (required)
   - Proper labels, placeholders, and accessibility attributes
   - Auto-complete attributes for better UX

3. **Validation:**
   - Real-time validation errors displayed below each field
   - Error messages with `role="alert"` for accessibility
   - Form prevents submission with invalid data

4. **Auth Store Integration:**
   - Calls `login(email, password)` from `useAuthStore`
   - Handles loading states (`isLoading`, `isSubmitting`)
   - Displays auth store errors
   - Calls `onSuccess` callback after successful login
   - Clears errors on component mount

5. **Styling:**
   - Tailwind CSS v4 utility classes
   - Responsive design (centered layout, max-width container)
   - Focus states (ring-2, ring-blue-500)
   - Disabled states (bg-slate-100, cursor-not-allowed)
   - Error states (red text, red border)
   - Loading button state

6. **Testing:**
   - 16 comprehensive unit tests (all passing)
   - Tests cover: rendering, validation, form submission, loading states, error handling, accessibility, optional callbacks
   - Test setup file created with `@testing-library/jest-dom`
   - Mocked auth store for isolated testing

7. **Component Props:**
   - `onSuccess?: () => void` - Optional callback after successful login
   - `onNavigateToSignUp?: () => void` - Optional callback for navigation to sign-up

The component is ready for Module Federation exposure in Task 2.3.

---

### Task 2.3: Implement Sign-Up Component

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-23-implement-sign-up-component)

**Objective:** Create sign-up page with form validation

**Steps:**

1. Create `SignUp.tsx` component
2. Setup React Hook Form with Zod validation
3. Create sign-up form schema (email, password, confirmPassword, name)
4. Implement form fields
5. Add password strength validation
6. Add confirm password validation
7. Integrate with auth store (signup action)
8. Add loading states
9. Add error handling
10. Style with Tailwind CSS v4
11. Write unit tests

**Verification:**

- [x] SignUp component created
- [x] React Hook Form integrated
- [x] Zod validation working
- [x] Form fields implemented
- [x] Password strength validation
- [x] Confirm password validation
- [x] Auth store integration working
- [x] Loading states working
- [x] Error handling implemented
- [x] Styled with Tailwind CSS v4
- [x] Unit tests written and passing

**Acceptance Criteria:**

- ✅ Sign-up form with validation
- ✅ All required fields
- ✅ Password strength validation
- ✅ Confirm password validation
- ✅ Auth store integration
- ✅ Loading and error states
- ✅ Styled with Tailwind CSS v4
- ✅ Unit tests passing (70%+ coverage)

**Status:** ✅ Complete  
**Completed Date:** 2026-12-06  
**Notes:**

Created SignUp component at `apps/auth-mfe/src/components/SignUp.tsx` with the following features:

1. **Form Setup:**
   - React Hook Form with `zodResolver` for validation
   - Zod schema with banking-grade password requirements
   - Type-safe form data using `z.infer<typeof signUpSchema>`

2. **Form Fields:**
   - Name field (minimum 2 characters)
   - Email field with validation (email format)
   - Password field with strength validation
   - Confirm password field with matching validation
   - Proper labels, placeholders, and accessibility attributes
   - Auto-complete attributes for better UX

3. **Password Validation:**
   - Banking-grade requirements: minimum 12 characters
   - Complexity requirements: uppercase, lowercase, numbers, symbols
   - Real-time password strength indicator (Weak/Medium/Strong)
   - Visual feedback with color coding (red/yellow/green)
   - Password requirements hint displayed below field

4. **Confirm Password Validation:**
   - Zod `.refine()` method to ensure passwords match
   - Error message displayed when passwords don't match
   - Validation prevents form submission with mismatched passwords

5. **Auth Store Integration:**
   - Calls `signup(data)` from `useAuthStore` with SignUpData
   - Handles loading states (`isLoading`, `isSubmitting`)
   - Displays auth store errors
   - Calls `onSuccess` callback after successful signup
   - Clears errors on component mount

6. **Styling:**
   - Tailwind CSS v4 utility classes
   - Responsive design (centered layout, max-width container)
   - Focus states (ring-2, ring-blue-500)
   - Disabled states (bg-slate-100, cursor-not-allowed)
   - Error states (red text, red border)
   - Loading button state
   - Password strength color coding

7. **Testing:**
   - 19 comprehensive unit tests (all passing)
   - Tests cover: rendering, validation (name, email, password, confirm password), password strength indicator, form submission, loading states, error handling, accessibility, optional callbacks
   - Mocked auth store for isolated testing

8. **Component Props:**
   - `onSuccess?: () => void` - Optional callback after successful signup
   - `onNavigateToSignIn?: () => void` - Optional callback for navigation to sign-in

The component is ready for Module Federation exposure in Task 2.4.

---

### Task 2.4: Configure Module Federation v2 for Auth MFE

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-24-configure-module-federation-v2-for-auth-mfe)

**Objective:** Configure Module Federation v2 to expose SignIn and SignUp components

**Steps:**

1. Install Module Federation plugin: `pnpm add -D -w @module-federation/vite@1.9.2`
2. Update `vite.config.mts` with Module Federation config
3. Configure as remote
4. Expose `./SignIn` component
5. Expose `./SignUp` component
6. Configure shared dependencies (React, React DOM)
7. Test remote entry generation
8. Verify remote loads in shell (after shell integration)

**Verification:**

- [x] Module Federation plugin installed
- [x] `vite.config.mts` updated
- [x] Remote configuration correct
- [x] `./SignIn` exposed
- [x] `./SignUp` exposed
- [x] Shared dependencies configured
- [x] Remote entry generated
- [x] Shell configured to load auth-mfe remote
- [x] Type declarations created

**Acceptance Criteria:**

- ✅ Module Federation v2 configured
- ✅ SignIn component exposed
- ✅ SignUp component exposed
- ✅ Shared dependencies configured
- ✅ Remote entry generated correctly
- ✅ Remote loads dynamically in shell

**Status:** ✅ Complete  
**Completed Date:** 2026-12-06  
**Notes:**

Configured Module Federation v2 for auth-mfe with the following steps:

1. **Auth MFE Configuration (`apps/auth-mfe/vite.config.mts`):**
   - Added `@module-federation/vite` plugin import (already installed in package.json)
   - Configured `federation` plugin with:
     - `name: 'authMfe'` - Remote name for Module Federation
     - `exposes` object:
       - `'./SignIn': './src/components/SignIn.tsx'` - Exposes SignIn component
       - `'./SignUp': './src/components/SignUp.tsx'` - Exposes SignUp component
     - `shared` dependencies:
       - `react: { singleton: true, requiredVersion: '19.2.0' }`
       - `'react-dom': { singleton: true, requiredVersion: '19.2.0' }`

2. **Shell Configuration (`apps/shell/vite.config.mts`):**
   - Updated `remotes` object to include:
     - `authMfe: 'http://localhost:4201/remoteEntry.js'` - Points to auth-mfe remote entry

3. **Type Declarations (`apps/shell/src/types/module-federation.d.ts`):**
   - Created type declarations for `authMfe/SignIn` and `authMfe/SignUp` modules
   - Defined component props interfaces for TypeScript support

4. **Verification:**
   - Build succeeds: `remoteEntry-CWk-KY2k.js` generated in `dist/apps/auth-mfe/assets/`
   - Type checking passes for both auth-mfe and shell
   - Remote entry accessible at `http://localhost:4201/remoteEntry.js` in dev mode
   - Shell configured to dynamically load auth-mfe components

The auth-mfe remote is now ready to be consumed by the shell application. Components can be loaded using `React.lazy()` and `Suspense` in the shell (to be implemented in Phase 4, Task 4.5: Integrate Auth MFE Components).

---

## Phase 3: Payments MFE

### Task 3.1: Create Payments MFE Application

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-31-create-payments-mfe-application)

**Objective:** Create payments-mfe remote application

**Steps:**

1. Generate application: `nx generate @nx/react:application payments-mfe --bundler=vite --style=css --routing=false`
2. Move application to `apps/payments-mfe` if needed
3. Configure port 4202 in `vite.config.mts`
4. Update `project.json` paths if needed
5. Test application runs: `pnpm dev:payments-mfe`
6. Verify standalone mode works

**Verification:**

- [ ] Application created at `apps/payments-mfe`
- [ ] Port 4202 configured
- [ ] Application runs successfully
- [ ] Standalone mode works
- [ ] No build errors

**Acceptance Criteria:**

- ✅ Payments MFE application created
- ✅ Runs on http://localhost:4202
- ✅ Standalone mode works
- ✅ No build errors

**Status:** ⬜ Not Started  
**Completed Date:** _TBD_  
**Notes:** _Add notes here after completion_

---

### Task 3.2: Implement Stubbed Payment APIs

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-32-implement-stubbed-payment-apis)

**Objective:** Create stubbed payment APIs (no actual PSP integration)

**Steps:**

1. Create `api/stubbedPayments.ts` file
2. Define Payment type interface
3. Create `getPayments` function (returns mock data)
4. Create `createPayment` function (returns mock data)
5. Create `updatePayment` function (returns mock data)
6. Create `deletePayment` function (returns mock data)
7. Add simulated delays for realism
8. Document that these are stubbed (no actual PSP)
9. Write unit tests

**Verification:**

- [ ] Stubbed payment APIs created
- [ ] Payment types defined
- [ ] `getPayments` implemented
- [ ] `createPayment` implemented
- [ ] `updatePayment` implemented
- [ ] `deletePayment` implemented
- [ ] Simulated delays added
- [ ] Unit tests written and passing

**Acceptance Criteria:**

- ✅ Stubbed payment APIs implemented
- ✅ All CRUD operations available
- ✅ Simulated delays for realism
- ✅ Types defined correctly
- ✅ Unit tests passing (70%+ coverage)
- ✅ Clearly documented as stubbed (no PSP)

**Status:** ⬜ Not Started  
**Completed Date:** _TBD_  
**Notes:** _Add notes here after completion_

---

### Task 3.3: Setup TanStack Query Hooks

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-33-setup-tanstack-query-hooks)

**Objective:** Create TanStack Query hooks for payment operations

**Steps:**

1. Setup TanStack Query provider in app
2. Create `hooks/usePayments.ts`
3. Implement `usePayments` query hook
4. Implement `useCreatePayment` mutation hook
5. Implement `useUpdatePayment` mutation hook
6. Implement `useDeletePayment` mutation hook
7. Configure query options (staleTime, cacheTime)
8. Write unit tests

**Verification:**

- [ ] TanStack Query provider setup
- [ ] `usePayments` hook created
- [ ] `useCreatePayment` hook created
- [ ] `useUpdatePayment` hook created
- [ ] `useDeletePayment` hook created
- [ ] Query options configured
- [ ] Unit tests written and passing

**Acceptance Criteria:**

- ✅ TanStack Query provider configured
- ✅ All payment hooks implemented
- ✅ Query options configured correctly
- ✅ Hooks work with stubbed APIs
- ✅ Unit tests passing (70%+ coverage)

**Status:** ⬜ Not Started  
**Completed Date:** _TBD_  
**Notes:** _Add notes here after completion_

---

### Task 3.4: Implement Payments Page Component

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-34-implement-payments-page-component)

**Objective:** Create payments dashboard page with role-based access

**Steps:**

1. Create `PaymentsPage.tsx` component
2. Use `usePayments` hook to fetch data
3. Display payments list/table
4. Implement role-based UI:
   - VENDOR: Can initiate payments, view reports
   - CUSTOMER: Can make payments, view own history
5. Add payment creation form (for VENDOR)
6. Add payment operations (create, update, delete)
7. Add loading states
8. Add error handling
9. Style with Tailwind CSS v4
10. Write unit tests

**Verification:**

- [ ] PaymentsPage component created
- [ ] Payments list displayed
- [ ] Role-based UI implemented
- [ ] VENDOR features working
- [ ] CUSTOMER features working
- [ ] Payment operations working
- [ ] Loading states working
- [ ] Error handling implemented
- [ ] Styled with Tailwind CSS v4
- [ ] Unit tests written and passing

**Acceptance Criteria:**

- ✅ Payments page implemented
- ✅ Payments list displayed
- [ ] Role-based access control working
- [ ] Payment operations working (stubbed)
- [ ] Loading and error states
- [ ] Styled with Tailwind CSS v4
- [ ] Unit tests passing (70%+ coverage)

**Status:** ⬜ Not Started  
**Completed Date:** _TBD_  
**Notes:** _Add notes here after completion_

---

### Task 3.5: Configure Module Federation v2 for Payments MFE

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-35-configure-module-federation-v2-for-payments-mfe)

**Objective:** Configure Module Federation v2 to expose PaymentsPage component

**Steps:**

1. Install Module Federation plugin: `pnpm add -D -w @module-federation/vite@1.9.2`
2. Update `vite.config.mts` with Module Federation config
3. Configure as remote
4. Expose `./PaymentsPage` component
5. Configure shared dependencies (React, React DOM, TanStack Query)
6. Test remote entry generation
7. Verify remote loads in shell (after shell integration)

**Verification:**

- [ ] Module Federation plugin installed
- [ ] `vite.config.mts` updated
- [ ] Remote configuration correct
- [ ] `./PaymentsPage` exposed
- [ ] Shared dependencies configured
- [ ] Remote entry generated
- [ ] Remote loads in shell (after integration)

**Acceptance Criteria:**

- ✅ Module Federation v2 configured
- ✅ PaymentsPage component exposed
- ✅ Shared dependencies configured
- ✅ Remote entry generated correctly
- ✅ Remote loads dynamically in shell

**Status:** ⬜ Not Started  
**Completed Date:** _TBD_  
**Notes:** _Add notes here after completion_

---

## Phase 4: Shell Integration

### Task 4.1: Integrate React Router 7

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-41-integrate-react-router-7)

**Objective:** Setup React Router 7 in shell application

**Steps:**

1. Install React Router 7: `pnpm add -w react-router@7.x`
2. Create router configuration
3. Define routes:
   - `/` - Redirect based on auth state
   - `/signin` - Sign-in page (unauthenticated)
   - `/signup` - Sign-up page (unauthenticated)
   - `/payments` - Payments page (authenticated, protected)
4. Setup BrowserRouter
5. Test routing works
6. Write unit tests

**Verification:**

- [ ] React Router 7 installed
- [ ] Router configuration created
- [ ] All routes defined
- [ ] BrowserRouter setup
- [ ] Routing works correctly
- [ ] Unit tests written and passing

**Acceptance Criteria:**

- ✅ React Router 7 integrated
- ✅ All routes defined
- ✅ Routing works correctly
- ✅ Unit tests passing (70%+ coverage)

**Status:** ⬜ Not Started  
**Completed Date:** _TBD_  
**Notes:** _Add notes here after completion_

---

### Task 4.2: Implement Route Protection

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-42-implement-route-protection)

**Objective:** Create protected routes that require authentication

**Steps:**

1. Create `ProtectedRoute.tsx` component
2. Check auth state from Zustand store
3. Redirect to `/signin` if not authenticated
4. Render children if authenticated
5. Add loading state while checking auth
6. Integrate with router configuration
7. Test route protection
8. Write unit tests

**Verification:**

- [ ] ProtectedRoute component created
- [ ] Auth state checking implemented
- [ ] Redirect logic working
- [ ] Loading state implemented
- [ ] Integrated with router
- [ ] Route protection tested
- [ ] Unit tests written and passing

**Acceptance Criteria:**

- ✅ ProtectedRoute component implemented
- ✅ Redirects unauthenticated users
- ✅ Allows authenticated users
- ✅ Loading state handled
- ✅ Unit tests passing (70%+ coverage)

**Status:** ⬜ Not Started  
**Completed Date:** _TBD_  
**Notes:** _Add notes here after completion_

---

### Task 4.3: Integrate Universal Header

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-43-integrate-universal-header)

**Objective:** Add universal header to shell application

> **⚠️ NOTE:** The Header component was already integrated into the shell Layout during Task 1.5 (Configure Tailwind CSS v4) for early testing. This task should verify the integration is complete and working correctly with routing and authentication flows.

**Steps:**

1. ~~Import Header component from `shared-header-ui`~~ ✅ Already done in Task 1.5
2. ~~Add Header to shell layout~~ ✅ Already done in Task 1.5
3. Verify auth store integration (Header uses useAuthStore hook directly)
4. Verify logout functionality works with routing
5. Test header displays correctly
6. Test logout redirects to signin (after routing is set up)
7. Write/update unit tests for Layout component with Header

**Verification:**

- [ ] Header imported from shared library
- [ ] Header added to layout
- [ ] Auth store integrated
- [ ] Logout functionality working
- [ ] Header displays correctly
- [ ] Logout redirects correctly
- [ ] Unit tests written and passing

**Acceptance Criteria:**

- ✅ Universal header integrated
- ✅ Header displays correctly
- [ ] Logout functionality working
- [ ] Redirects after logout
- [ ] Unit tests passing (70%+ coverage)

**Status:** ⬜ Not Started  
**Completed Date:** _TBD_  
**Notes:** _Add notes here after completion_

---

### Task 4.4: Configure Module Federation v2 for Shell

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-44-configure-module-federation-v2-for-shell)

**Objective:** Configure shell to load auth-mfe and payments-mfe remotes

**Steps:**

1. Update `vite.config.mts` with Module Federation config
2. Configure as host
3. Add `authMfe` remote: `http://localhost:4201/assets/remoteEntry.js`
4. Add `paymentsMfe` remote: `http://localhost:4202/assets/remoteEntry.js`
5. Configure shared dependencies
6. Create remote component loaders
7. Test remote loading
8. Verify dynamic imports work

**Verification:**

- [ ] `vite.config.mts` updated
- [ ] Host configuration correct
- [ ] authMfe remote configured
- [ ] paymentsMfe remote configured
- [ ] Shared dependencies configured
- [ ] Remote component loaders created
- [ ] Remotes load dynamically
- [ ] No build errors

**Acceptance Criteria:**

- ✅ Module Federation v2 configured as host
- ✅ Both remotes configured
- ✅ Shared dependencies configured
- ✅ Remotes load dynamically
- ✅ No build errors

**Status:** ⬜ Not Started  
**Completed Date:** _TBD_  
**Notes:** _Add notes here after completion_

---

### Task 4.5: Integrate Auth MFE Components

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-45-integrate-auth-mfe-components)

**Objective:** Load SignIn and SignUp components from auth-mfe remote

**Steps:**

1. Create remote component loader for SignIn
2. Create remote component loader for SignUp
3. Add Suspense boundaries
4. Add error boundaries
5. Integrate with router (signin and signup routes)
6. Test components load correctly
7. Test authentication flow
8. Write unit tests

**Verification:**

- [ ] SignIn remote loader created
- [ ] SignUp remote loader created
- [ ] Suspense boundaries added
- [ ] Error boundaries added
- [ ] Integrated with router
- [ ] Components load correctly
- [ ] Authentication flow works
- [ ] Unit tests written and passing

**Acceptance Criteria:**

- ✅ SignIn component loads from remote
- ✅ SignUp component loads from remote
- ✅ Suspense and error boundaries working
- ✅ Authentication flow works
- ✅ Unit tests passing (70%+ coverage)

**Status:** ⬜ Not Started  
**Completed Date:** _TBD_  
**Notes:** _Add notes here after completion_

---

### Task 4.6: Integrate Payments MFE Component

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-46-integrate-payments-mfe-component)

**Objective:** Load PaymentsPage component from payments-mfe remote

**Steps:**

1. Create remote component loader for PaymentsPage
2. Add Suspense boundary
3. Add error boundary
4. Integrate with router (payments route)
5. Wrap with ProtectedRoute
6. Test component loads correctly
7. Test payments flow
8. Write unit tests

**Verification:**

- [ ] PaymentsPage remote loader created
- [ ] Suspense boundary added
- [ ] Error boundary added
- [ ] Integrated with router
- [ ] ProtectedRoute wrapper added
- [ ] Component loads correctly
- [ ] Payments flow works
- [ ] Unit tests written and passing

**Acceptance Criteria:**

- ✅ PaymentsPage component loads from remote
- ✅ Suspense and error boundaries working
- ✅ Route protection working
- ✅ Payments flow works
- ✅ Unit tests passing (70%+ coverage)

**Status:** ⬜ Not Started  
**Completed Date:** _TBD_  
**Notes:** _Add notes here after completion_

---

### Task 4.7: Integration Testing

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-47-integration-testing)

**Objective:** Test complete authentication and payments flow

**Steps:**

1. Test unauthenticated user flow:
   - Visit `/` → redirects to `/signin`
   - Sign in → redirects to `/payments`
2. Test authenticated user flow:
   - Visit `/payments` → shows payments page
   - Logout → redirects to `/signin`
3. Test route protection:
   - Unauthenticated user tries `/payments` → redirects to `/signin`
   - Authenticated user tries `/signin` → redirects to `/payments`
4. Test state synchronization:
   - Login in auth-mfe → state updates in shell
   - Logout in shell → state updates everywhere
5. Test remote loading:
   - All remotes load correctly
   - No 404 errors
   - Dynamic imports work
6. Document any issues found

**Verification:**

- [ ] Unauthenticated flow tested
- [ ] Authenticated flow tested
- [ ] Route protection tested
- [ ] State synchronization tested
- [ ] Remote loading tested
- [ ] All flows work correctly
- [ ] Issues documented

**Acceptance Criteria:**

- ✅ Complete authentication flow works
- ✅ Route protection works correctly
- ✅ State synchronization works
- ✅ All remotes load correctly
- ✅ No integration issues

**Status:** ⬜ Not Started  
**Completed Date:** _TBD_  
**Notes:** _Add notes here after completion_

---

## Phase 5: Testing & Refinement

### Task 5.1: Unit Testing

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-51-unit-testing)

**Objective:** Write comprehensive unit tests for all components and stores

**Steps:**

1. Test auth store:
   - Login action
   - Logout action
   - Signup action
   - RBAC helpers
   - Persistence
2. Test auth components:
   - SignIn component
   - SignUp component
   - Form validation
3. Test payments components:
   - PaymentsPage component
   - Payment operations
   - Role-based UI
4. Test TanStack Query hooks:
   - usePayments hook
   - useCreatePayment hook
   - useUpdatePayment hook
   - useDeletePayment hook
5. Test shell components:
   - ProtectedRoute component
   - Header component
   - Router configuration
6. Achieve 70%+ test coverage
7. Fix any failing tests

**Verification:**

- [ ] Auth store tests written
- [ ] Auth component tests written
- [ ] Payments component tests written
- [ ] TanStack Query hook tests written
- [ ] Shell component tests written
- [ ] 70%+ test coverage achieved
- [ ] All tests passing

**Acceptance Criteria:**

- ✅ All components have unit tests
- ✅ All stores have unit tests
- ✅ All hooks have unit tests
- ✅ 70%+ test coverage
- ✅ All tests passing

**Status:** ⬜ Not Started  
**Completed Date:** _TBD_  
**Notes:** _Add notes here after completion_

---

### Task 5.2: Integration Testing

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-52-integration-testing)

**Objective:** Write integration tests for complete user flows

**Steps:**

1. Test authentication flow:
   - Sign in → redirect → payments page
   - Sign up → redirect → payments page
2. Test payments flow:
   - View payments list
   - Create payment (VENDOR)
   - Update payment
   - Delete payment
3. Test route protection:
   - Protected routes redirect correctly
   - Auth routes redirect correctly
4. Test state synchronization:
   - Auth state syncs across MFEs
   - Logout syncs everywhere
5. Test role-based access:
   - VENDOR sees vendor features
   - CUSTOMER sees customer features
6. Fix any failing tests

**Verification:**

- [ ] Authentication flow tests written
- [ ] Payments flow tests written
- [ ] Route protection tests written
- [ ] State synchronization tests written
- [ ] Role-based access tests written
- [ ] All integration tests passing

**Acceptance Criteria:**

- ✅ All user flows tested
- ✅ Route protection tested
- ✅ State synchronization tested
- ✅ Role-based access tested
- ✅ All integration tests passing

**Status:** ⬜ Not Started  
**Completed Date:** _TBD_  
**Notes:** _Add notes here after completion_

---

### Task 5.3: E2E Testing

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-53-e2e-testing)

**Objective:** Write E2E tests using Playwright

**Steps:**

1. Setup Playwright for shell app
2. Setup Playwright for auth-mfe app
3. Setup Playwright for payments-mfe app
4. Write E2E test for sign-in flow
5. Write E2E test for sign-up flow
6. Write E2E test for payments flow
7. Write E2E test for logout flow
8. Write E2E test for role-based access
9. Run all E2E tests
10. Fix any failing tests

**Verification:**

- [ ] Playwright configured for all apps
- [ ] Sign-in E2E test written
- [ ] Sign-up E2E test written
- [ ] Payments E2E test written
- [ ] Logout E2E test written
- [ ] Role-based access E2E test written
- [ ] All E2E tests passing

**Acceptance Criteria:**

- ✅ Playwright configured
- ✅ Critical user journeys tested
- ✅ All E2E tests passing
- ✅ Tests run reliably

**Status:** ⬜ Not Started  
**Completed Date:** _TBD_  
**Notes:** _Add notes here after completion_

---

### Task 5.4: Documentation

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-54-documentation)

**Objective:** Update and create documentation for POC-1

**Steps:**

1. Update architecture documentation
2. Create POC-1 completion summary
3. Document new packages and libraries
4. Update development guide
5. Update testing guide
6. Document authentication flow
7. Document payments flow
8. Document RBAC implementation
9. Create migration guide from POC-0 to POC-1

**Verification:**

- [ ] Architecture docs updated
- [ ] POC-1 completion summary created
- [ ] New packages documented
- [ ] Development guide updated
- [ ] Testing guide updated
- [ ] Authentication flow documented
- [ ] Payments flow documented
- [ ] RBAC documented
- [ ] Migration guide created

**Acceptance Criteria:**

- ✅ All documentation updated
- ✅ POC-1 completion summary created
- ✅ All new features documented
- ✅ Migration guide created

**Status:** ⬜ Not Started  
**Completed Date:** _TBD_  
**Notes:** _Add notes here after completion_

---

### Task 5.5: Code Refinement

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-55-code-refinement)

**Objective:** Refine code quality, fix issues, and optimize

**Steps:**

1. Run full test suite
2. Fix any failing tests
3. Run type checking
4. Fix any TypeScript errors
5. Run linting
6. Fix any linting errors
7. Review code for improvements
8. Optimize performance if needed
9. Review security considerations
10. Final code review

**Verification:**

- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Code reviewed
- [ ] Performance optimized
- [ ] Security reviewed
- [ ] Final review completed

**Acceptance Criteria:**

- ✅ All tests passing
- ✅ No TypeScript errors
- ✅ No linting errors
- ✅ Code quality high
- ✅ Performance acceptable
- ✅ Security considerations addressed

**Status:** ⬜ Not Started  
**Completed Date:** _TBD_  
**Notes:** _Add notes here after completion_

---

## Success Criteria

All POC-1 success criteria must be validated. See [`success-criteria-validation.md`](./success-criteria-validation.md) for detailed validation checklist.

**Functional Requirements:**

- ✅ User can sign in/sign up (mock)
- ✅ Authenticated users see payments page
- ✅ Unauthenticated users see signin/signup
- ✅ Logout redirects to signin
- ✅ Routes are protected
- ✅ Universal header displays correctly
- ✅ Role-based access control works (VENDOR vs CUSTOMER)
- ✅ Payment operations work (stubbed - no actual PSP integration)
- ✅ Works in all modern browsers

**Technical Requirements:**

- ✅ React Router 7 integrated and working
- ✅ Zustand stores shared between MFEs
- ✅ TanStack Query working with stubbed payment APIs
- ✅ Tailwind CSS v4 working
- ✅ Maximum code sharing achieved
- ✅ All remotes load dynamically
- ✅ No static imports of remotes
- ✅ Module Federation v2 configured correctly

**Quality Requirements:**

- ✅ Code follows architectural constraints
- ✅ TypeScript types are correct
- ✅ No bundler-specific code in shared packages
- ✅ Documentation is updated
- ✅ Unit tests pass (70%+ coverage)
- ✅ Integration tests pass
- ✅ E2E tests pass

---

**Last Updated:** 2026-01-XX  
**Status:** Ready for Implementation
