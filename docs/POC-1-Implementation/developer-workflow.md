# Developer Workflow Guide

> **POC-1 Development Workflow** - Module Federation v2 with Rspack (HMR Enabled)

This guide explains how to develop, build, and test the POC-1 microfrontend application.

---

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Development Workflow](#development-workflow)
- [Common Commands](#common-commands)
- [Server Management](#server-management)
- [Troubleshooting](#troubleshooting)

---

## Overview

POC-1 uses **Module Federation v2** with **Rspack** for serving the microfrontends. This means:

- ✅ **Module Federation works correctly** - All remotes load successfully
- ✅ **Styling works correctly** - Tailwind CSS classes are properly applied
- ✅ **HMR (Hot Module Replacement) is available** - Changes update instantly without page refresh

> **Note:** The project was migrated from Vite to Rspack to enable HMR with Module Federation v2. See `docs/Rspack-Migration/` for migration details.

### Architecture

- **Shell App** (Port 4200) - Host application that loads remotes
- **Auth MFE** (Port 4201) - Authentication microfrontend (SignIn, SignUp)
- **Payments MFE** (Port 4202) - Payments microfrontend (PaymentsPage)

---

## Prerequisites

1. **Node.js** 18+ and **pnpm** 9.x installed
2. **Dependencies installed**: `pnpm install`
3. **Ports available**: 4200, 4201, 4202

---

## Development Workflow

### Initial Setup (First Time)

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Build all projects:**
   ```bash
   pnpm build
   ```

### Standard Development Workflow

With Rspack and HMR enabled, follow this simplified workflow:

#### Option 1: Quick Start (Recommended)

**Single Terminal - Start All Dev Servers:**

```bash
pnpm dev:mf
```

This will start all three dev servers (shell, auth-mfe, payments-mfe) in parallel with HMR enabled.

> **Note:** `pnpm dev` builds remotes and starts preview servers. For development with HMR, use `pnpm dev:mf`.

**Access the application:**

- Shell: http://localhost:4200
- Auth MFE (standalone): http://localhost:4201
- Payments MFE (standalone): http://localhost:4202

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

### Making Changes

With HMR enabled, changes are reflected instantly:

1. **Edit any file** in shell, auth-mfe, or payments-mfe
2. **Save the file** - HMR will automatically update the browser
3. **No rebuild or refresh needed** - Changes appear instantly

### Workflow Tips

- **HMR is automatic** - Just save your file and see changes instantly
- **Use browser DevTools** - Check the Network tab to verify remote assets are loading correctly
- **Check console** - Look for any Module Federation errors or HMR update logs
- **Full page reload only needed for certain changes** - Config changes, dependency updates, or errors may require manual refresh

---

## Common Commands

### Development

```bash
# Start all dev servers with HMR (recommended for development)
pnpm dev:mf

# Start individual dev servers
pnpm dev:shell
pnpm dev:auth-mfe
pnpm dev:payments-mfe

# Build remotes only (required before starting dev servers)
pnpm build:remotes

# Start all servers in preview mode (production-like)
pnpm preview:all
pnpm preview:shell
pnpm preview:auth-mfe
pnpm preview:payments-mfe
```

### Building

```bash
# Build all projects
pnpm build

# Build specific projects
pnpm build:shell
pnpm build:auth-mfe
pnpm build:payments-mfe
pnpm build:remotes
```

### Testing

```bash
# Run all tests (includes libraries)
pnpm test

# Run tests for specific projects
pnpm test:shell
pnpm test:auth-mfe
pnpm test:payments-mfe

# Run library tests
pnpm test:libraries
pnpm test:shared-auth-store
pnpm test:shared-utils
pnpm test:shared-types

# Run tests with coverage
pnpm test:coverage
pnpm test:coverage:shell
pnpm test:coverage:payments-mfe

# Run all tests (all projects)
pnpm test:all
```

> **Note:** Tests use Jest (migrated from Vitest in Phase 5). See `docs/POC-1-Implementation/testing-guide.md` for detailed testing documentation.
>
> **Test Status:** 48 tests verified passing. Test discovery issues exist for shell, auth-mfe, and shared-header-ui (test files exist but not being discovered - needs investigation).

#### Testing Architecture Notes

The shell app page components (`SignInPage`, `SignUpPage`, `PaymentsPage`) use a **Dependency Injection (DI) pattern** for testability. This pattern was implemented to solve Module Federation testing challenges.

**The Problem:**

- Module Federation remote imports (e.g., `import('authMfe/SignIn')`) cannot be resolved during Jest test runs
- Static analysis fails to resolve dynamic imports for remotes
- Mocking Module Federation at the bundler level proved unreliable

**The Solution:**

- Page components accept an optional component prop (e.g., `SignInComponent`)
- When provided, the injected component is used instead of the lazy-loaded remote
- Tests inject mock components directly, bypassing Module Federation entirely

**Example:**

```typescript
// SignInPage.tsx - Accepts optional component for DI
export function SignInPage({ SignInComponent }: SignInPageProps = {}) {
  const SignIn = SignInComponent || DefaultSignInComponent;
  // ...
}

// SignInPage.test.tsx - Injects mock component
function MockSignIn(props: SignInComponentProps) {
  return <div data-testid="mock-signin">Mock SignIn</div>;
}

render(<SignInPage SignInComponent={MockSignIn} />);
```

This pattern:

- ✅ Makes tests fast and reliable (no network calls)
- ✅ Isolates component logic from Module Federation concerns
- ✅ Allows testing without running remote MFE servers
- ✅ Follows the "design for testability" principle

### Linting & Formatting

```bash
# Lint all projects
pnpm lint
pnpm lint:shell
pnpm lint:auth-mfe
pnpm lint:affected

# Format code
pnpm format
pnpm format:check
```

> **Note:** Typecheck targets are not configured in project.json. TypeScript checking is available via IDE or manually with `tsc --noEmit`.

---

## Server Management

### Starting Servers

**Start all servers:**

```bash
pnpm preview:all
```

**Start individual servers:**

```bash
pnpm preview:shell
pnpm preview:auth-mfe
pnpm preview:payments-mfe
```

### Stopping Servers

#### Stop All Servers

```bash
pnpm kill:all
```

This will kill all processes running on ports 4200, 4201, and 4202.

#### Stop Individual Servers

```bash
# Stop shell (port 4200)
pnpm kill:shell

# Stop auth-mfe (port 4201)
pnpm kill:auth-mfe

# Stop payments-mfe (port 4202)
pnpm kill:payments-mfe
```

#### Manual Kill (Alternative)

If the kill commands don't work, you can manually kill processes:

```bash
# Find processes on specific ports
lsof -i :4200  # Shell
lsof -i :4201  # Auth MFE
lsof -i :4202  # Payments MFE

# Kill a specific process (replace PID with actual process ID)
kill -9 <PID>

# Or kill all processes on a port
lsof -ti :4200 | xargs kill -9
```

### Restarting Servers

**Restart all servers:**

```bash
pnpm kill:all
pnpm preview:all
```

**Restart a specific server:**

```bash
# Example: Restart auth-mfe
pnpm kill:auth-mfe
pnpm preview:auth-mfe
```

---

## Related Documentation

### New Documentation (Task 5.4)

- [`poc-1-completion-summary.md`](./poc-1-completion-summary.md) - POC-1 completion summary
- [`authentication-flow.md`](./authentication-flow.md) - Authentication flow details
- [`payments-flow.md`](./payments-flow.md) - Payments flow details
- [`rbac-implementation.md`](./rbac-implementation.md) - RBAC implementation
- [`packages-and-libraries.md`](./packages-and-libraries.md) - Package documentation
- [`testing-guide.md`](./testing-guide.md) - Comprehensive testing guide
- [`migration-guide-poc0-to-poc1.md`](./migration-guide-poc0-to-poc1.md) - Migration guide

---

## Troubleshooting

### Port Already in Use

**Error:** `Port 4200 is already in use`

**Solution:**

```bash
# Kill the process on that port
pnpm kill:shell      # For port 4200
pnpm kill:auth-mfe   # For port 4201
pnpm kill:payments-mfe # For port 4202

# Or kill all
pnpm kill:all
```

### Module Federation 404 Errors

**Error:** `GET http://localhost:4201/remoteEntry.js net::ERR_ABORTED 404`

**Solution:**

1. Ensure remotes are built: `pnpm build:remotes`
2. Ensure remotes are running: `pnpm preview:remotes`
3. Check that remote servers are accessible: Visit http://localhost:4201 and http://localhost:4202 directly

### Styling Not Applied

**Issue:** Tailwind CSS classes not working

**Solution:**

1. Rebuild the shell (it includes remote MFE source files in Tailwind config): `pnpm build:shell`
2. Restart the shell server: `pnpm kill:shell && pnpm preview:shell`
3. Hard refresh the browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows/Linux)

### Changes Not Reflecting

**Issue:** Made changes but don't see them in the browser

**Solution:**

1. Rebuild the project you changed:
   ```bash
   pnpm build:shell        # For shell changes
   pnpm build:auth-mfe     # For auth-mfe changes
   pnpm build:payments-mfe # For payments-mfe changes
   ```
2. Restart the server if needed
3. Hard refresh the browser

### QueryClient Error

**Error:** `No QueryClient set, use QueryClientProvider to set one`

**Solution:**

- This should already be fixed. If you see this error, ensure the shell has been rebuilt with the latest changes: `pnpm build:shell`

---

## Development Tips

### Faster Iteration

1. **Work on one MFE at a time** - Focus on auth-mfe or payments-mfe, rebuild only what you need
2. **Use standalone mode for testing** - Test auth-mfe at http://localhost:4201 or payments-mfe at http://localhost:4202 before testing in the shell
3. **Keep servers running** - Don't kill servers unless necessary; just rebuild and refresh

### Testing Module Federation

1. **Test in shell** - Always test remote components in the shell context (http://localhost:4200)
2. **Check Network tab** - Verify that remote assets are loading from the correct origins
3. **Check console** - Look for any Module Federation runtime errors

### Debugging

1. **Browser DevTools** - Use Network tab to see asset loading, Console for errors
2. **Server logs** - Check terminal output for build errors or server issues
3. **Type checking** - Run `pnpm typecheck` to catch TypeScript errors early

---

## Quick Reference

### Most Common Workflow

```bash
# Terminal 1: Build remotes
pnpm build:remotes

# Terminal 2: Start all servers
pnpm preview:all

# Make changes, then rebuild:
pnpm build:auth-mfe      # or build:payments-mfe or build:shell

# Refresh browser to see changes
```

### Emergency Reset

```bash
# Kill all servers
pnpm kill:all

# Clean build
pnpm build

# Restart all servers
pnpm preview:all
```

---

## Known Issues and Solutions

### Module Federation Testing

**Issue:** Jest cannot resolve Module Federation remote imports during test runs.

**Solution:** Page components use Dependency Injection (DI) pattern. See [Testing Architecture Notes](#testing-architecture-notes) above.

**Files affected:**

- `apps/shell/src/pages/SignInPage.tsx`
- `apps/shell/src/pages/SignUpPage.tsx`
- `apps/shell/src/pages/PaymentsPage.tsx`

### Tailwind CSS in Monorepo

**Issue:** Tailwind classes from shared libraries not being generated.

**Solution:** Use `@tailwindcss/postcss` with `@config` directive and absolute content paths. See [`tailwind-v4-setup-guide.md`](./tailwind-v4-setup-guide.md).

---

## Next Steps

- See [`implementation-plan.md`](./implementation-plan.md) for detailed task instructions
- See [`task-list.md`](./task-list.md) for progress tracking
- See [`project-rules-cursor.md`](./project-rules-cursor.md) for coding standards
- See [`tailwind-v4-setup-guide.md`](./tailwind-v4-setup-guide.md) for Tailwind CSS configuration

---

**Last Updated:** 2026-01-XX  
**POC-1 Phase:** Complete (Rspack Migration)  
**Rspack Migration:** Phase 5 Complete - Jest testing framework migrated
