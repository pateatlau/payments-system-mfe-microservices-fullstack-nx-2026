# Rspack Migration Implementation Plan

**Status:** Ready for Implementation  
**Version:** 1.0  
**Date:** 2026-01-XX  
**Branch:** poc-1-rspack

---

## Executive Summary

This document provides a detailed step-by-step implementation plan for migrating from Vite 6.x to Rspack in the POC-1 microfrontend architecture. The migration is organized into phases with specific tasks, acceptance criteria, and rollback procedures.

**Primary Goal:** Enable HMR with Module Federation v2 in dev mode  
**Estimated Timeline:** 9-13 days (~2-3 weeks)  
**Complexity:** Medium-High

> **📋 Progress Tracking:** See [`task-list.md`](./task-list.md) for quick progress tracking with checkboxes. Use this document for detailed implementation instructions.

---

## Migration Overview

### Current State

- **Bundler:** Vite 6.4.1 with `@module-federation/vite`
- **Module Federation:** v2 working in preview mode only
- **HMR:** Not available (requires build → preview → refresh)
- **Apps:** shell (4200), auth-mfe (4201), payments-mfe (4202)
- **Testing:** Vitest 4.0.0

### Target State

- **Bundler:** Rspack with `@nx/rspack`
- **Module Federation:** v2 working in dev mode with HMR
- **HMR:** Fully functional in dev mode
- **Apps:** Same ports and functionality
- **Testing:** Jest (decided)

---

## Phase Structure

1. **Phase 1: Preparation & Setup** (1 day)
2. **Phase 2: Core Bundler Migration** (2-3 days)
3. **Phase 3: Module Federation Setup** (2-3 days)
4. **Phase 4: Styling Configuration** (1 day)
5. **Phase 5: Testing Framework Migration** (3-4 days)
6. **Phase 6: Verification & Documentation** (2-3 days)

---

## Phase 1: Preparation & Setup

**Goal:** Prepare workspace and install dependencies  
**Duration:** 1 day  
**Risk Level:** Low

### Tasks

#### Task 1.1: Create Migration Branch

- [ ] Create feature branch: `poc-1-rspack-migration`
- [ ] Ensure current branch is clean and committed
- [ ] Push branch to remote

**Acceptance Criteria:**

- Branch created and checked out
- Clean working directory

---

#### Task 1.2: Backup Current Configuration

- [ ] Copy all `vite.config.mts` files to `.backup` directory
- [ ] Document current package.json dependencies
- [ ] Create backup of nx.json if custom targets exist

**Files to Backup:**

- `apps/shell/vite.config.mts`
- `apps/auth-mfe/vite.config.mts`
- `apps/payments-mfe/vite.config.mts`
- `libs/*/vite.config.mts` (all libraries)
- `package.json`
- `nx.json` (if custom targets)

**Acceptance Criteria:**

- All Vite configs backed up
- Package.json documented

---

#### Task 1.3: Install Rspack Dependencies

- [ ] Install `@nx/rspack` plugin
- [ ] Install `@rspack/core` and `@rspack/dev-server`
- [ ] Install `postcss-loader` (for Tailwind)
- [ ] Install `@swc/core` (if not already installed)

**Commands:**

```bash
pnpm add -D -w @nx/rspack @rspack/core @rspack/dev-server
pnpm add -D -w postcss-loader
```

**Acceptance Criteria:**

- All packages installed successfully
- No dependency conflicts

---

#### Task 1.4: Install Jest Testing Framework

- [x] ~~Evaluate Rstest vs Jest~~ (Decision: Jest)
- [ ] Install Jest and related dependencies
- [ ] Install @types/jest for TypeScript support
- [ ] Install jest-environment-jsdom for React Testing Library

**Decision:** Jest

**Rationale:**

- Mature ecosystem with proven track record
- Extensive community support and documentation
- Lower risk for a critical migration
- Large plugin ecosystem
- Well-documented migration paths from Vitest

**Commands:**

```bash
pnpm add -D -w jest @jest/globals @types/jest jest-environment-jsdom ts-jest
```

**Acceptance Criteria:**

- Jest dependencies installed
- No dependency conflicts

---

### Phase 1 Deliverables

- ✅ Migration branch created
- ✅ Vite configurations backed up
- ✅ Rspack dependencies installed
- ✅ Jest dependencies installed

---

## Phase 2: Core Bundler Migration

**Goal:** Convert all Vite configurations to Rspack  
**Duration:** 2-3 days  
**Risk Level:** Medium

### Tasks

#### Task 2.1: Create Base Rspack Configuration Template

- [ ] Create `rspack.config.js` template with common settings
- [ ] Document configuration differences from Vite
- [ ] Set up TypeScript config (if using TS config)

**Template Structure:**

```javascript
const rspack = require('@rspack/core');
const { NxAppRspackPlugin } = require('@nx/rspack/plugins');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './src/main.tsx',
  output: {
    path: require('path').resolve(__dirname, '../../dist/apps/shell'),
    uniqueName: 'shell', // Required for Module Federation HMR
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
  },
  module: {
    rules: [
      // React/TypeScript loader
      // CSS/PostCSS loader (Phase 4)
    ],
  },
  plugins: [
    new rspack.ProgressPlugin(),
    new NxAppRspackPlugin(),
    // Module Federation plugin (Phase 3)
  ],
  devServer: {
    port: 4200,
    host: 'localhost',
    hot: true,
  },
};
```

**Acceptance Criteria:**

- Template created and documented
- Common patterns identified

---

#### Task 2.2: Migrate Shell App Configuration

- [ ] Convert `apps/shell/vite.config.mts` → `apps/shell/rspack.config.js`
- [ ] Configure React/JSX via `builtin:swc-loader`
- [ ] Set up dev server configuration
- [ ] Configure build output
- [ ] Test basic build (without Module Federation)

**Key Configurations:**

- React loader: `builtin:swc-loader`
- Entry point: `src/main.tsx`
- Output: `dist/apps/shell`
- Dev server: Port 4200

**Acceptance Criteria:**

- Shell builds successfully
- Dev server starts (basic, no Module Federation yet)
- React components render

---

#### Task 2.3: Migrate Auth MFE Configuration

- [ ] Convert `apps/auth-mfe/vite.config.mts` → `apps/auth-mfe/rspack.config.js`
- [ ] Configure React/JSX
- [ ] Set up dev server (port 4201)
- [ ] Configure build output
- [ ] Test basic build

**Acceptance Criteria:**

- Auth MFE builds successfully
- Dev server starts on port 4201
- Components render

---

#### Task 2.4: Migrate Payments MFE Configuration

- [ ] Convert `apps/payments-mfe/vite.config.mts` → `apps/payments-mfe/rspack.config.js`
- [ ] Configure React/JSX
- [ ] Set up dev server (port 4202)
- [ ] Configure build output
- [ ] Test basic build

**Acceptance Criteria:**

- Payments MFE builds successfully
- Dev server starts on port 4202
- Components render

---

#### Task 2.5: Migrate Library Configurations

- [ ] Convert all library `vite.config.mts` files to `rspack.config.js`
- [ ] Libraries: shared-utils, shared-ui, shared-types, shared-auth-store, shared-header-ui
- [ ] Test library builds

**Acceptance Criteria:**

- All libraries build successfully
- No build errors

---

#### Task 2.6: Update Nx Configuration

- [ ] Update `nx.json` to use `@nx/rspack` executors
- [ ] Update `project.json` files (if using)
- [ ] Update target definitions: `build`, `serve`, `preview`
- [ ] Remove Vite-specific targets

**Executor Changes:**

- `@nx/vite:build` → `@nx/rspack:build`
- `@nx/vite:dev-server` → `@nx/rspack:dev-server`
- `@nx/vite:preview-server` → `@nx/rspack:preview-server` (or remove if not needed)

**Acceptance Criteria:**

- Nx targets updated
- `nx build shell` works
- `nx serve shell` works

---

#### Task 2.7: Update Package.json Scripts

- [ ] Update build scripts to use Rspack
- [ ] Update dev scripts
- [ ] Update preview scripts (if needed)
- [ ] Remove Vite-specific scripts

**Script Updates:**

```json
{
  "scripts": {
    "build": "nx run-many --target=build --all",
    "build:shell": "nx build shell",
    "dev:shell": "nx serve shell"
    // ... etc
  }
}
```

**Acceptance Criteria:**

- All scripts work correctly
- Build commands execute successfully

---

### Phase 2 Deliverables

- ✅ All apps have Rspack configuration
- ✅ All libraries have Rspack configuration
- ✅ Nx executors updated
- ✅ Package.json scripts updated
- ✅ All apps build successfully (without Module Federation)

---

## Phase 3: Module Federation Setup

**Goal:** Configure Module Federation v2 with HMR support  
**Duration:** 2-3 days  
**Risk Level:** Medium-High

### Tasks

#### Task 3.1: Configure Shell as Host

- [ ] Add Module Federation plugin to shell config
- [ ] Configure remotes (authMfe, paymentsMfe)
- [ ] Configure shared dependencies
- [ ] Set `output.uniqueName: 'shell'` (required for HMR)

**Configuration:**

```javascript
const { ModuleFederationPlugin } = require('@rspack/core').container;

plugins: [
  new ModuleFederationPlugin({
    name: 'shell',
    remotes: {
      authMfe: 'authMfe@http://localhost:4201/remoteEntry.js',
      paymentsMfe: 'paymentsMfe@http://localhost:4202/remoteEntry.js',
    },
    shared: {
      react: { singleton: true, requiredVersion: '18.3.1' },
      'react-dom': { singleton: true, requiredVersion: '18.3.1' },
      '@tanstack/react-query': { singleton: true },
      zustand: { singleton: true },
      'react-hook-form': { singleton: true },
      'shared-auth-store': { singleton: true, requiredVersion: false },
    },
  }),
],
```

**Acceptance Criteria:**

- Shell config has Module Federation setup
- Shared dependencies configured

---

#### Task 3.2: Configure Auth MFE as Remote

- [ ] Add Module Federation plugin to auth-mfe config
- [ ] Configure exposes (SignIn, SignUp)
- [ ] Configure shared dependencies (must match shell)
- [ ] Set `output.uniqueName: 'authMfe'`
- [ ] Set public path for assets

**Configuration:**

```javascript
new ModuleFederationPlugin({
  name: 'authMfe',
  filename: 'remoteEntry.js',
  exposes: {
    './SignIn': './src/components/SignIn.tsx',
    './SignUp': './src/components/SignUp.tsx',
  },
  shared: {
    // Must match shell shared dependencies
  },
}),
```

**Acceptance Criteria:**

- Auth MFE exposes components correctly
- Shared dependencies match shell

---

#### Task 3.3: Configure Payments MFE as Remote

- [ ] Add Module Federation plugin to payments-mfe config
- [ ] Configure exposes (PaymentsPage)
- [ ] Configure shared dependencies
- [ ] Set `output.uniqueName: 'paymentsMfe'`
- [ ] Set public path for assets

**Acceptance Criteria:**

- Payments MFE exposes components correctly
- Shared dependencies match shell

---

#### Task 3.4: Test Remote Loading

- [ ] Build all remotes
- [ ] Start all dev servers
- [ ] Test shell loads remotes correctly
- [ ] Verify components render in shell
- [ ] Check browser console for errors

**Test Steps:**

1. `pnpm build:remotes` (or `nx build auth-mfe payments-mfe`)
2. `pnpm dev:all` (or start all servers)
3. Open shell in browser
4. Verify SignIn/SignUp load from auth-mfe
5. Verify PaymentsPage loads from payments-mfe

**Acceptance Criteria:**

- All remotes load successfully
- Components render correctly
- No console errors

---

#### Task 3.5: Test HMR with Module Federation

- [ ] Make change in auth-mfe component
- [ ] Verify HMR updates in shell
- [ ] Make change in payments-mfe component
- [ ] Verify HMR updates in shell
- [ ] Make change in shell component
- [ ] Verify HMR updates

**Test Scenarios:**

1. Change text in SignIn component → Should update in shell without refresh
2. Change text in PaymentsPage → Should update in shell without refresh
3. Change text in shell → Should update without refresh

**Acceptance Criteria:**

- ✅ HMR works for remote components
- ✅ HMR works for host components
- ✅ No page refresh required
- ✅ Updates appear instantly (< 100ms)

---

#### Task 3.6: Fix Asset Path Issues (If Needed)

- [ ] Verify assets load from correct origins
- [ ] Fix public path issues if needed
- [ ] Verify CORS is configured correctly
- [ ] Test with different network conditions

**Common Issues:**

- Assets 404 errors
- CORS errors
- Incorrect public paths

**Acceptance Criteria:**

- All assets load correctly
- No CORS errors
- Public paths correct

---

### Phase 3 Deliverables

- ✅ Module Federation configured for all apps
- ✅ Remotes load correctly in shell
- ✅ HMR works with Module Federation (PRIMARY GOAL ACHIEVED)
- ✅ All shared dependencies work
- ✅ No asset loading issues

---

## Phase 4: Styling Configuration

**Goal:** Configure Tailwind CSS v4 with PostCSS in Rspack  
**Duration:** 1 day  
**Risk Level:** Low

### Tasks

#### Task 4.1: Configure PostCSS Loader

- [ ] Add PostCSS loader rule to all Rspack configs
- [ ] Configure `@tailwindcss/postcss` plugin
- [ ] Configure `autoprefixer` plugin
- [ ] Test CSS processing

**Configuration:**

```javascript
module: {
  rules: [
    {
      test: /\.css$/,
      use: [
        {
          loader: 'postcss-loader',
          options: {
            postcssOptions: {
              plugins: [
                require('@tailwindcss/postcss'),
                require('autoprefixer'),
              ],
            },
          },
        },
      ],
      type: 'css',
    },
  ],
}
```

**Acceptance Criteria:**

- PostCSS loader configured
- Tailwind CSS processes correctly

---

#### Task 4.2: Verify Tailwind Configuration

- [ ] Verify `tailwind.config.js` is compatible
- [ ] Verify `@config` directive works in CSS files
- [ ] Verify content paths work correctly
- [ ] Test Tailwind classes in components

**Acceptance Criteria:**

- Tailwind classes apply correctly
- Content paths scan correctly
- No styling regressions

---

#### Task 4.3: Test Styling Across All Apps

- [ ] Test styling in shell
- [ ] Test styling in auth-mfe (loaded in shell)
- [ ] Test styling in payments-mfe (loaded in shell)
- [ ] Verify responsive design works
- [ ] Verify HMR for CSS changes

**Acceptance Criteria:**

- All apps styled correctly
- CSS HMR works
- No styling regressions

---

### Phase 4 Deliverables

- ✅ Tailwind CSS v4 working with Rspack
- ✅ PostCSS configured correctly
- ✅ All styling works as expected
- ✅ CSS HMR functional

---

## Phase 5: Testing Framework Migration

**Goal:** Migrate from Vitest to Jest  
**Duration:** 3-4 days  
**Risk Level:** Medium-High

### Tasks

#### Task 5.1: Install Jest Testing Framework

- [ ] Install Jest and related dependencies (if not done in Phase 1)
- [ ] Install React Testing Library integration
- [ ] Install ts-jest for TypeScript support
- [ ] Remove Vitest dependencies

**Commands:**

```bash
pnpm add -D -w jest @jest/globals @types/jest jest-environment-jsdom ts-jest
pnpm add -D -w @testing-library/jest-dom
pnpm remove -D vitest @vitest/ui @vitest/coverage-v8
```

**Acceptance Criteria:**

- Jest installed
- Vitest removed

---

#### Task 5.2: Create Base Jest Configuration

- [ ] Create `jest.config.js` in workspace root
- [ ] Configure React Testing Library setup
- [ ] Configure jsdom environment
- [ ] Configure test file patterns
- [ ] Configure TypeScript support with ts-jest

**Jest Configuration:**

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    '^@web-mfe/(.*)$': '<rootDir>/libs/$1/src/index.ts',
  },
  testMatch: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

**Acceptance Criteria:**

- Jest configuration created
- Base setup works

---

#### Task 5.3: Update Test Setup Files

- [ ] Update `src/test/setup.ts` for new framework
- [ ] Update imports if needed
- [ ] Configure test utilities
- [ ] Test basic test runs

**Acceptance Criteria:**

- Setup files updated
- Basic test runs successfully

---

#### Task 5.4: Migrate Shell Tests

- [ ] Update test imports (Vitest → Jest)
- [ ] Update test APIs if different
- [ ] Update mock setup (vi.fn() → jest.fn())
- [ ] Run tests and fix failures
- [ ] Verify test coverage

**Key Changes:**

- `import { describe, it, expect, vi } from 'vitest'` → `import { describe, it, expect } from '@jest/globals'` (or use globals)
- `vi.fn()` → `jest.fn()`
- `vi.mock()` → `jest.mock()`
- `vi.spyOn()` → `jest.spyOn()`
- `beforeEach(() => { vi.clearAllMocks() })` → `beforeEach(() => { jest.clearAllMocks() })`

**Acceptance Criteria:**

- All shell tests pass
- No test functionality lost

---

#### Task 5.5: Migrate Auth MFE Tests

- [ ] Update test imports
- [ ] Run tests and fix failures
- [ ] Verify test coverage

**Acceptance Criteria:**

- All auth-mfe tests pass
- No test functionality lost

---

#### Task 5.6: Migrate Payments MFE Tests

- [ ] Update test imports
- [ ] Run tests and fix failures
- [ ] Verify test coverage

**Acceptance Criteria:**

- All payments-mfe tests pass
- No test functionality lost

---

#### Task 5.7: Migrate Library Tests

- [ ] Migrate all library tests
- [ ] Update shared test utilities if needed
- [ ] Verify all tests pass

**Acceptance Criteria:**

- All library tests pass
- Shared utilities work

---

#### Task 5.8: Update Test Scripts

- [ ] Update `package.json` test scripts
- [ ] Update coverage configuration
- [ ] Update Nx test targets if needed

**Script Updates:**

```json
{
  "scripts": {
    "test": "nx run-many --target=test --all",
    "test:shell": "nx test shell"
    // ... etc
  }
}
```

**Acceptance Criteria:**

- All test scripts work
- Coverage reports generate

---

### Phase 5 Deliverables

- ✅ Testing framework migrated
- ✅ All tests pass
- ✅ Test coverage maintained (70%+)
- ✅ Test scripts updated

---

## Phase 6: Verification & Documentation

**Goal:** Verify migration success and document changes  
**Duration:** 2-3 days  
**Risk Level:** Low

### Tasks

#### Task 6.1: Full Feature Verification

- [ ] Test authentication flow (sign-in, sign-up)
- [ ] Test payments flow (view, create, update, delete)
- [ ] Test routing and navigation
- [ ] Test role-based access control
- [ ] Test state management (Zustand, TanStack Query)
- [ ] Test form validation
- [ ] Test error boundaries

**Test Checklist:**

- [ ] Sign-in works
- [ ] Sign-up works
- [ ] Payments page loads
- [ ] Create payment works
- [ ] Update payment works
- [ ] Delete payment works
- [ ] Navigation works
- [ ] Route protection works
- [ ] RBAC works (VENDOR vs CUSTOMER)
- [ ] State persists across MFEs
- [ ] Forms validate correctly
- [ ] Errors handled gracefully

**Acceptance Criteria:**

- All features work as before
- No regressions

---

#### Task 6.2: Performance Verification

- [ ] Measure build times (compare to Vite)
- [ ] Measure HMR times (compare to Vite if possible)
- [ ] Verify bundle sizes (compare to Vite)
- [ ] Document performance improvements

**Metrics to Capture:**

- Production build time (shell, auth-mfe, payments-mfe)
- Dev server startup time
- HMR update time
- Bundle sizes

**Acceptance Criteria:**

- Build times faster (or acceptable)
- HMR times fast (< 100ms)
- Bundle sizes similar or better

---

#### Task 6.3: Developer Workflow Verification

- [ ] Test `pnpm dev` workflow
- [ ] Test `pnpm build` workflow
- [ ] Test `pnpm test` workflow
- [ ] Verify all commands work as expected
- [ ] Update developer workflow documentation

**Workflow Tests:**

- `pnpm dev` - Starts all servers with HMR
- `pnpm build` - Builds all apps
- `pnpm test` - Runs all tests
- `pnpm build:remotes` - Builds remotes
- `pnpm preview:all` - Preview mode (if needed)

**Acceptance Criteria:**

- All workflows work correctly
- Documentation updated

---

#### Task 6.4: Update Documentation

- [ ] Update `developer-workflow.md` with Rspack workflow
- [ ] Update build instructions
- [ ] Update testing instructions
- [ ] Create migration summary document
- [ ] Update README if needed

**Documents to Update:**

- `docs/POC-1-Implementation/developer-workflow.md`
- `docs/POC-1-Implementation/testing-guide.md`
- Migration summary in `docs/Rspack-Migration/`

**Acceptance Criteria:**

- All documentation updated
- Migration summary created

---

#### Task 6.5: Cleanup

- [ ] Remove Vite dependencies from package.json
- [ ] Remove backup files (or archive)
- [ ] Clean up unused configurations
- [ ] Update .gitignore if needed

**Acceptance Criteria:**

- Clean workspace
- No unused dependencies

---

### Phase 6 Deliverables

- ✅ All features verified working
- ✅ Performance metrics documented
- ✅ Developer workflow updated
- ✅ Documentation updated
- ✅ Workspace cleaned up

---

## Rollback Plan

### When to Rollback

Rollback if:

- Critical bugs that block development
- HMR not working after all attempts
- Significant performance degradation
- Test migration fails completely
- Timeline exceeds acceptable threshold

### Rollback Steps

1. **Stash Current Changes:**

   ```bash
   git stash push -m "Rspack migration attempt"
   ```

2. **Restore Vite Configuration:**
   - Restore `vite.config.mts` files from backup
   - Restore `package.json` dependencies
   - Restore `nx.json` if changed

3. **Reinstall Vite Dependencies:**

   ```bash
   pnpm install
   ```

4. **Verify Vite Works:**

   ```bash
   pnpm build
   pnpm preview:all
   ```

5. **Document Rollback:**
   - Document what didn't work
   - Document lessons learned
   - Plan next attempt if needed

### Rollback Acceptance Criteria

- ✅ Vite builds work
- ✅ Module Federation works (preview mode)
- ✅ All tests pass
- ✅ No regressions

---

## Success Criteria

### Must Have (Blocking)

- ✅ HMR works with Module Federation v2 in dev mode
- ✅ All apps build successfully
- ✅ All remotes load correctly in shell
- ✅ All tests pass (70%+ coverage maintained)
- ✅ All features work (no regressions)

### Nice to Have (Non-Blocking)

- ✅ Faster build times (verified benchmarks)
- ✅ Faster HMR times (verified benchmarks)
- ✅ Better developer experience
- ✅ Smaller bundle sizes

---

## Risk Mitigation

### Technical Risks

| Risk                               | Mitigation                                                       |
| ---------------------------------- | ---------------------------------------------------------------- |
| Module Federation HMR doesn't work | Follow Rspack docs closely, set `uniqueName`, test incrementally |
| Testing migration fails            | Jest chosen (proven), allocate extra time, document API changes  |
| Configuration complexity           | Use template configs, document patterns                          |
| Asset path issues                  | Test early, fix incrementally                                    |

### Schedule Risks

| Risk                      | Mitigation                                         |
| ------------------------- | -------------------------------------------------- |
| Timeline exceeds estimate | Weekly checkpoints, adjust scope if needed         |
| Unexpected issues         | Allocate buffer time, rollback plan ready          |
| Team learning curve       | Pair programming, documentation, knowledge sharing |

---

## Timeline Summary

| Phase                      | Duration      | Risk Level      |
| -------------------------- | ------------- | --------------- |
| Phase 1: Preparation       | 1 day         | Low             |
| Phase 2: Core Migration    | 2-3 days      | Medium          |
| Phase 3: Module Federation | 2-3 days      | Medium-High     |
| Phase 4: Styling           | 1 day         | Low             |
| Phase 5: Testing           | 3-4 days      | Medium-High     |
| Phase 6: Verification      | 2-3 days      | Low             |
| **Total**                  | **9-13 days** | **Medium-High** |

---

## Next Steps

1. ✅ **Review Plan:** Team review and approval
2. ✅ **Testing Framework Decision:** Jest (decided)
3. ✅ **Create Branch:** `poc-1-rspack` branch created
4. 🟡 **Phase 1 In Progress:** Install dependencies and backup configs
5. **Daily Standups:** Track progress, identify blockers
6. **Weekly Checkpoints:** Review progress, adjust if needed

---

## References

### Related Documents

- [Task List](./task-list.md) - Progress tracking with checkboxes
- [Research Findings](./rspack-research-findings.md) - Research and compatibility analysis
- [Tech Stack Impact](./rspack-tech-stack-impact.md) - Tech stack impact analysis
- [Risks & Mitigations](./rspack-risks-mitigations.md) - Risk analysis and mitigations
- [README](./README.md) - Migration documentation overview

### External Resources

- [Rspack Documentation](https://rspack.dev/)
- [Nx Rspack Plugin](https://nx.dev/packages/rspack)
- [Module Federation v2](https://module-federation.io/)
- [Jest Documentation](https://jestjs.io/)

---

**Last Updated:** 2026-01-XX  
**Status:** Ready for Implementation  
**Next:** Begin Phase 1 - Preparation & Setup
