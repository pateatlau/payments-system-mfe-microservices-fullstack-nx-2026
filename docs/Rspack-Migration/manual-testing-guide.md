# Rspack Migration - Manual Testing Guide

**Status:** 🟡 Partial Testing Available  
**Last Updated:** 2026-01-XX  
**Current Phase:** Phase 2 - Core Bundler Migration

---

## Overview

This guide provides instructions for manual testing during the Rspack migration. Testing capabilities vary by phase, as different features are migrated incrementally.

---

## Current Testing Status

### ✅ What Can Be Tested Now (Phase 2 - Partial)

**As of Task 2.2 completion:**

- ✅ **Shell App Build:** Basic build works without Module Federation
- ⚠️ **Shell App Dev Server:** Can start, but limited functionality
- ❌ **Module Federation:** Not configured yet (Phase 3)
- ❌ **Tailwind CSS:** Not configured yet (Phase 4)
- ❌ **Full App Functionality:** Cannot test until Phase 3+4 complete

**Current Limitations:**

- Remote components (SignIn, SignUp, PaymentsPage) are stubbed and won't render properly
- CSS/Tailwind styles may not work (PostCSS loader not configured)
- Module Federation remotes cannot be loaded

**Known Issues:**

- ⚠️ **payments-mfe Vite Error:** `pnpm dev:payments-mfe` fails with Module Federation error (Vite issue, will be resolved in Phase 2 Task 2.4)
  - Workaround: Use `pnpm preview:payments-mfe` or wait for Rspack migration

---

## Testing Instructions by Phase

### Phase 2: Core Bundler Migration (Current)

#### What to Test

**1. Shell App Build Test**

```bash
# Build the shell app
pnpm build:shell
# or: ./nx build shell

# Expected Result:
# - Build completes successfully
# - Output in dist/apps/shell/
# - No build errors
# - JavaScript bundles generated
```

**2. Shell App Dev Server Test (Limited)**

```bash
# Start dev server
pnpm dev:shell
# or: ./nx serve shell

# Expected Result:
# - Server starts on http://localhost:4200
# - HMR is enabled (check console)
# - Basic React app loads
# - ⚠️ Remote components show error/stub (expected)
# - ⚠️ Styling may be broken (expected - Phase 4)
```

**3. Verify Build Output**

```bash
# Check build output structure
ls -la dist/apps/shell/

# Expected Files:
# - index.html
# - main.[hash].js
# - runtime.[hash].js
# - main.[hash].css (if CSS works)
```

**What NOT to Test Yet:**

- ❌ Module Federation remote loading
- ❌ Full application functionality
- ❌ Styling/Tailwind CSS
- ❌ Authentication flows
- ❌ Payments flows

---

### Phase 3: Module Federation Setup

**Status:** ⬜ Not Started  
**When Ready:** After Phase 3 Task 3.4 completion

#### What to Test

**1. Remote Loading Test**

```bash
# Build all remotes
pnpm build:remotes
# or: ./nx build auth-mfe && ./nx build payments-mfe

# Start all dev servers (for Module Federation)
pnpm dev:mf
# or: ./nx run-many --target=serve --projects=shell,auth-mfe,payments-mfe --parallel

# Open http://localhost:4200
# Expected Result:
# - Shell loads successfully
# - Remote components (SignIn, SignUp, PaymentsPage) load from remotes
# - No console errors about remote loading
```

**2. HMR Test (PRIMARY GOAL)**

```bash
# With all servers running:
# 1. Make a change in apps/auth-mfe/src/components/SignIn.tsx
# 2. Save the file
# 3. Check browser at http://localhost:4200
# Expected Result:
# - Change appears in shell WITHOUT page refresh
# - HMR update time < 100ms
# - No full page reload
```

**3. Cross-MFE State Test**

```bash
# Test that shared state (auth store) works across MFEs
# 1. Sign in via SignIn component (from auth-mfe)
# 2. Verify header updates in shell
# 3. Navigate to payments page
# 4. Verify auth state persists
```

**What to Verify:**

- ✅ All remotes load correctly
- ✅ HMR works for remote components
- ✅ HMR works for host components
- ✅ Shared dependencies work (React, Zustand, etc.)
- ✅ No CORS errors
- ✅ No asset loading errors

---

### Phase 4: Styling Configuration

**Status:** ⬜ Not Started  
**When Ready:** After Phase 4 Task 4.3 completion

#### What to Test

**1. Tailwind CSS Test**

```bash
# Start dev server
./nx serve shell

# Open http://localhost:4200
# Expected Result:
# - All Tailwind classes apply correctly
# - Responsive design works
# - Colors, spacing, typography render properly
```

**2. CSS HMR Test**

```bash
# With dev server running:
# 1. Make a CSS change in any component
# 2. Save the file
# 3. Check browser
# Expected Result:
# - CSS updates without page refresh
# - HMR works for styles
```

**3. Cross-MFE Styling Test**

```bash
# Verify styling works across all MFEs
# 1. Check shell styling
# 2. Check auth-mfe components (loaded in shell)
# 3. Check payments-mfe components (loaded in shell)
# Expected Result:
# - Consistent styling across all MFEs
# - No style conflicts
# - Responsive design works everywhere
```

---

### Phase 5: Testing Framework Migration

**Status:** ⬜ Not Started  
**When Ready:** After Phase 5 Task 5.8 completion

#### What to Test

**1. Unit Tests**

```bash
# Run all tests
./nx test shell
./nx test auth-mfe
./nx test payments-mfe

# Expected Result:
# - All tests pass
# - Test coverage maintained (70%+)
# - No test failures
```

**2. Integration Tests**

```bash
# Run integration tests
./nx test shell --testPathPattern=integration

# Expected Result:
# - Integration tests pass
# - Module Federation mocking works
```

**3. Test Coverage**

```bash
# Check coverage
./nx test shell --coverage

# Expected Result:
# - Coverage report generated
# - Coverage threshold met (70%+)
```

---

### Phase 6: Verification & Documentation

**Status:** ⬜ Not Started  
**When Ready:** After Phase 6 completion

#### Full Feature Testing

**1. Authentication Flow**

```bash
# Test complete authentication flow
# 1. Navigate to /signin
# 2. Enter credentials
# 3. Submit form
# 4. Verify redirect
# 5. Check auth state in header
# 6. Test logout
```

**2. Payments Flow**

```bash
# Test complete payments flow
# 1. Navigate to /payments (requires auth)
# 2. View payments list
# 3. Create new payment
# 4. Edit payment
# 5. Delete payment
```

**3. Routing & Navigation**

```bash
# Test all routes
# - / (redirect)
# - /signin
# - /signup
# - /payments (protected)
# Expected Result:
# - All routes work
# - Route protection works
# - Navigation smooth
```

**4. Role-Based Access Control**

```bash
# Test RBAC
# 1. Sign in as VENDOR
# 2. Verify VENDOR-specific features
# 3. Sign out
# 4. Sign in as CUSTOMER
# 5. Verify CUSTOMER-specific features
```

**5. Performance Verification**

```bash
# Measure build times
time ./nx build shell
time ./nx build auth-mfe
time ./nx build payments-mfe

# Measure HMR times
# - Make change in component
# - Measure time until update appears
# - Target: < 100ms
```

---

## When to Start Full Manual Testing

### ✅ Ready for Full Testing

**After Phase 3 + Phase 4 completion:**

- Module Federation configured
- Tailwind CSS working
- All apps can run together
- Basic functionality testable

**Recommended Testing Start:** After Task 3.5 (HMR Test) and Task 4.3 (Styling Test)

### ⚠️ Partial Testing Available Now

**Current Status (Phase 2):**

- ✅ Build verification
- ⚠️ Dev server (limited - no remotes, no styling)
- ❌ Full functionality

**Recommendation:** Wait until Phase 3+4 complete for meaningful testing

---

## Testing Checklist

### Build Verification (Phase 2)

- [ ] Shell app builds successfully
- [ ] Auth MFE builds successfully
- [ ] Payments MFE builds successfully
- [ ] All libraries build successfully
- [ ] Build output structure correct
- [ ] No build errors or warnings

### Module Federation (Phase 3)

- [ ] All remotes load in shell
- [ ] Remote components render correctly
- [ ] HMR works for remote components
- [ ] HMR works for host components
- [ ] HMR update time < 100ms
- [ ] No CORS errors
- [ ] Shared dependencies work

### Styling (Phase 4)

- [ ] Tailwind CSS classes apply
- [ ] Responsive design works
- [ ] CSS HMR works
- [ ] Styling consistent across MFEs
- [ ] No style conflicts

### Testing Framework (Phase 5)

- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Test coverage maintained
- [ ] Jest configuration works

### Full Features (Phase 6)

- [ ] Authentication flow works
- [ ] Payments flow works
- [ ] Routing works
- [ ] RBAC works
- [ ] State management works
- [ ] Form validation works
- [ ] Error boundaries work
- [ ] No regressions

---

## Troubleshooting

### Build Fails

```bash
# Clear Nx cache and build output
pnpm clean:all
# or: ./nx reset && rm -rf dist

# Clear node_modules and reinstall
rm -rf node_modules
pnpm install

# Try building again
pnpm build:shell
# or: ./nx build shell
```

### Dev Server Won't Start

```bash
# Check if ports are in use
lsof -i :4200
lsof -i :4201
lsof -i :4202

# Kill processes if needed
pnpm kill:all
# or: ./nx run-many --target=kill --all
```

### Module Federation Errors

```bash
# Verify remotes are built and remote entry files exist
pnpm build:verify:remotes
# or: ./nx build auth-mfe && ./nx build payments-mfe && ls -la dist/apps/*/remoteEntry.js

# Verify all servers are running
pnpm dev:mf
# Shell: http://localhost:4200
# Auth MFE: http://localhost:4201
# Payments MFE: http://localhost:4202
```

### Styling Not Working

```bash
# Verify PostCSS loader is configured
# Check rspack.config.js for PostCSS loader rule

# Verify Tailwind config
cat apps/shell/tailwind.config.js

# Check CSS imports
grep -r "@import.*tailwindcss" apps/shell/src
```

---

## Testing Commands Reference

> **Note:** All commands can be run via `pnpm <command>` or `./nx <command>`. The package.json scripts provide convenient shortcuts.

### Build Commands

```bash
# Build all apps
pnpm build
# or: ./nx run-many --target=build --all

# Build specific app
pnpm build:shell
pnpm build:auth-mfe
pnpm build:payments-mfe
# or: ./nx build shell

# Build remotes only
pnpm build:remotes
# or: ./nx run-many --target=build --projects=auth-mfe,payments-mfe

# Verify all builds (Rspack migration testing)
pnpm build:verify

# Verify remote entry files exist
pnpm build:verify:remotes
```

### Dev Server Commands

```bash
# Start all servers (for Module Federation testing)
pnpm dev:mf
# or: ./nx run-many --target=serve --projects=shell,auth-mfe,payments-mfe --parallel

# Start specific server
pnpm dev:shell
pnpm dev:auth-mfe
pnpm dev:payments-mfe
# or: ./nx serve shell

# Start only remotes
pnpm dev:mf:remotes
# or: ./nx run-many --target=serve --projects=auth-mfe,payments-mfe --parallel
```

### Test Commands

```bash
# Run all tests
pnpm test
# or: ./nx run-many --target=test --projects=shell,auth-mfe,payments-mfe --parallel

# Run specific app tests
pnpm test:shell
pnpm test:auth-mfe
pnpm test:payments-mfe
# or: ./nx test shell

# Run with coverage
pnpm test:coverage
pnpm test:coverage:shell
# or: ./nx test shell --coverage

# Run all tests
pnpm test:all
# or: ./nx run-many --target=test --all
```

### Rspack Migration Testing Commands

```bash
# Test Rspack build
pnpm test:rspack:build

# Test Rspack dev servers (all apps)
pnpm test:rspack:serve

# Verify remote entry files
pnpm test:rspack:remotes

# HMR testing instructions
pnpm test:rspack:hmr
```

### Cleanup Commands

```bash
# Clean build output
pnpm clean:build

# Clear Nx cache
pnpm clean:cache

# Clean everything
pnpm clean:all
```

### Utility Commands

```bash
# Kill all dev servers
pnpm kill:all

# Kill specific server
pnpm kill:shell
pnpm kill:auth-mfe
pnpm kill:payments-mfe

# View dependency graph
pnpm graph

# Reset Nx
pnpm reset
```

---

## Next Steps

1. **Current Phase (2):** Continue with build verification only
2. **Phase 3:** Begin Module Federation testing after Task 3.4
3. **Phase 4:** Begin styling testing after Task 4.3
4. **Phase 5:** Verify test migration after Task 5.8
5. **Phase 6:** Full feature testing

---

**Last Updated:** 2026-01-XX  
**Status:** 🟡 Partial Testing Available  
**Next Testing Milestone:** After Phase 3 + Phase 4 completion
