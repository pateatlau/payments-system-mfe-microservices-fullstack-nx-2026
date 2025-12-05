# POC-0 Development Guide

**Status:** Complete  
**Version:** 1.0  
**Date:** 2026-01-XX

---

## Overview

This guide provides instructions for running and developing the POC-0 microfrontend platform. The platform consists of:

- **Shell App** (Host) - Port 4200
- **Hello Remote App** (Remote) - Port 4201
- **Shared Libraries** - shared-utils, shared-ui, shared-types

---

## Prerequisites

- **Node.js:** 20.x or later
- **pnpm:** 9.x
- **Nx:** 22.1.3 (installed as dev dependency)

---

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Development Servers

#### Option A: Start Both Apps Together (Recommended)

```bash
pnpm dev
```

This starts both shell (port 4200) and hello-remote (port 4201) in parallel.

#### Option B: Start Apps Individually

```bash
# Start shell app (port 4200)
pnpm dev:shell

# Start hello-remote app (port 4201)
pnpm dev:remote
```

### 3. Access Applications

- **Shell App:** http://localhost:4200
- **Hello Remote App:** http://localhost:4201

---

## Development Commands

### Running Applications

```bash
# Development mode (both apps)
pnpm dev

# Individual apps
pnpm dev:shell      # Shell app only
pnpm dev:remote     # Hello remote app only
```

### Building

```bash
# Build all projects
pnpm build

# Build individual projects
pnpm build:shell    # Build shell app
pnpm build:remote   # Build hello remote app

# Build affected projects only
pnpm build:affected
```

### Preview Production Builds

```bash
# Preview both production builds
pnpm preview

# Preview individual builds
pnpm preview:shell  # Preview shell (port 4200)
pnpm preview:remote # Preview hello-remote (port 4201)
```

**Note:** Production builds must be created first using `pnpm build`.

### Testing

```bash
# Run all tests (shell + hello-remote)
pnpm test

# Run all tests including shared libraries
pnpm test:all

# Run individual tests
pnpm test:shell     # Test shell app
pnpm test:remote    # Test hello remote app

# Run affected tests only
pnpm test:affected

# Open Vitest UI
pnpm test:ui
```

### Type Checking

```bash
# Type check all projects
pnpm typecheck

# Type check individual projects
pnpm typecheck:shell
pnpm typecheck:remote

# Type check affected projects
pnpm typecheck:affected
```

### Linting

```bash
# Lint all projects
pnpm lint

# Lint individual projects
pnpm lint:shell
pnpm lint:remote

# Lint affected projects
pnpm lint:affected
```

### Formatting

```bash
# Format all files
pnpm format

# Check formatting without writing
pnpm format:check
```

### E2E Testing

```bash
# Run all E2E tests
pnpm e2e

# Run individual E2E tests
pnpm e2e:shell      # Shell E2E tests
pnpm e2e:remote     # Hello remote E2E tests
```

### Utilities

```bash
# View dependency graph
pnpm graph

# Reset Nx cache
pnpm reset
```

---

## Project Structure

```
apps/
├── shell/              # Host application (Port 4200)
│   ├── src/
│   │   ├── app/        # Main app component
│   │   ├── components/ # Shell components
│   │   └── types/      # TypeScript type declarations
│   └── vite.config.mts
├── hello-remote/       # Remote application (Port 4201)
│   ├── src/
│   │   ├── app/        # Main app component
│   │   └── components/ # Remote components
│   └── vite.config.mts
├── shell-e2e/          # E2E tests for shell
└── hello-remote-e2e/   # E2E tests for hello-remote

libs/
├── shared-utils/       # Shared utility functions
├── shared-ui/          # Shared UI components
└── shared-types/       # Shared TypeScript types
```

---

## Module Federation Configuration

### Shell (Host)

The shell app is configured to load the hello-remote app dynamically:

- **Remote Entry:** `http://localhost:4201/remoteEntry.js`
- **Remote Name:** `helloRemote`
- **Exposed Module:** `helloRemote/HelloRemote`

### Hello Remote

The hello-remote app exposes the HelloRemote component:

- **Exposed Module:** `./HelloRemote`
- **Component Path:** `./src/components/HelloRemote.tsx`

### Shared Dependencies

Both apps share React and React DOM as singletons:

- `react: 19.2.0` (singleton)
- `react-dom: 19.2.0` (singleton)

---

## Troubleshooting

### Port Already in Use

**Error:** `Port 4200 (or 4201) is already in use`

**Solution:**

1. Find and stop the process using the port:
   ```bash
   lsof -ti:4200 | xargs kill -9  # For port 4200
   lsof -ti:4201 | xargs kill -9  # For port 4201
   ```
2. Or use a different port by modifying `vite.config.mts`

### Module Federation Remote Not Loading

**Error:** `Failed to fetch dynamically imported module: http://localhost:4201/remoteEntry.js`

**Solutions:**

1. Ensure hello-remote is running on port 4201
2. Check CORS settings in `apps/hello-remote/vite.config.mts` (should have `cors: true`)
3. Verify the remote entry path in `apps/shell/vite.config.mts`
4. Check browser console for detailed error messages

### TypeScript Errors

**Error:** `Cannot find module 'shared-utils'` or similar

**Solution:**

1. Verify `tsconfig.base.json` has correct paths mapping
2. Ensure `baseUrl` is set in `tsconfig.base.json`
3. Restart TypeScript language server in your IDE

### Build Errors

**Error:** Build fails with module resolution errors

**Solution:**

1. Clear Nx cache: `pnpm reset`
2. Delete `node_modules` and reinstall: `rm -rf node_modules && pnpm install`
3. Rebuild: `pnpm build`

### Test Failures

**Error:** Tests fail with "Cannot find module" errors

**Solution:**

1. Ensure all dependencies are installed: `pnpm install`
2. Check that test files are in the correct location
3. Verify Vitest configuration in `vitest.config.ts`

### HMR (Hot Module Replacement) Not Working

**Solution:**

1. Ensure both dev servers are running
2. Check browser console for HMR connection errors
3. Try hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
4. Restart dev servers

---

## Common Workflows

### Starting Fresh Development Session

```bash
# 1. Install dependencies
pnpm install

# 2. Start both apps
pnpm dev

# 3. Access shell app
# Open http://localhost:4200
```

### Making Changes to Shared Libraries

1. Make changes in `libs/shared-utils/`, `libs/shared-ui/`, or `libs/shared-types/`
2. Changes are automatically picked up by apps using them
3. HMR will reload the apps

### Testing Changes

```bash
# Run tests after making changes
pnpm test

# Run type checking
pnpm typecheck

# Run linting
pnpm lint
```

### Building for Production

```bash
# Build all projects
pnpm build

# Preview production builds
pnpm preview
```

---

## Development Tips

1. **Use Nx Graph:** Run `pnpm graph` to visualize project dependencies
2. **Watch Mode:** Nx automatically caches builds - use `--skip-nx-cache` to force rebuild
3. **Parallel Execution:** Nx runs tasks in parallel when possible for faster builds
4. **Affected Commands:** Use `pnpm build:affected` to only build changed projects
5. **Type Safety:** Always run `pnpm typecheck` before committing

---

## Next Steps

- See [`implementation-plan.md`](./implementation-plan.md) for detailed implementation steps
- See [`task-list.md`](./task-list.md) for progress tracking
- See [`project-rules.md`](./project-rules.md) for coding standards

---

## Support

For issues or questions:

1. Check this troubleshooting section
2. Review the implementation plan
3. Check Nx documentation: https://nx.dev
