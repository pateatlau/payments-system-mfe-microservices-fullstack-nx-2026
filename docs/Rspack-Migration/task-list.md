# Rspack Migration Task List - Progress Tracking

**Status:** 🟡 In Progress  
**Version:** 1.0  
**Date:** 2026-01-XX  
**Branch:** poc-1-rspack  
**Estimated Duration:** 9-13 days

> **📋 Related Document:** See [`rspack-migration-plan.md`](./rspack-migration-plan.md) for detailed step-by-step instructions for each task.

---

## How to Use This Checklist

- **For Progress Tracking:** Mark tasks as complete by checking the box: `- [x]`
- **For Detailed Instructions:** Refer to [`rspack-migration-plan.md`](./rspack-migration-plan.md) for step-by-step guidance
- **For Notes:** Add notes or blockers in the Notes section of each task
- **For Status:** Update status (⬜ Not Started | 🟡 In Progress | ✅ Complete) and completion percentage
- **For Cursor AI:** This file helps Cursor understand what's completed and what's next across sessions

**Sync Note:** This task list tracks high-level progress. Detailed implementation steps are in `rspack-migration-plan.md`. When completing a task, mark it here and optionally add notes about any deviations from the plan.

---

## Phase 1: Preparation & Setup

**Goal:** Prepare workspace and install dependencies  
**Duration:** 1 day  
**Status:** ✅ Complete

### Task 1.1: Create Migration Branch

- [x] Create feature branch: `poc-1-rspack`
- [x] Ensure current branch is clean and committed
- [x] Push branch to remote

**Status:** ✅ Complete  
**Notes:** Branch `poc-1-rspack` created before planning documentation. Planning docs committed to branch.  
**Completed Date:** 2026-01-XX

---

### Task 1.2: Backup Current Configuration

- [x] Copy all `vite.config.mts` files to `.backup` directory
- [x] Document current package.json dependencies
- [x] Create backup of nx.json if custom targets exist

**Status:** ✅ Complete  
**Notes:** All 8 vite.config.mts files backed up (3 apps + 5 libs). package.json and nx.json backed up. Dependencies documented in `.backup/vite-dependencies.md`.  
**Completed Date:** 2026-01-XX

---

### Task 1.3: Install Rspack Dependencies

- [x] Install `@nx/rspack` plugin
- [x] Install `@rspack/core` and `@rspack/dev-server`
- [x] Install `postcss-loader` (for Tailwind)
- [x] Install `@swc/core` (if not already installed)
- [x] Verify no dependency conflicts

**Status:** ✅ Complete  
**Notes:** All Rspack dependencies installed successfully. @swc/core already present (v1.5.29). Minor peer dependency warning with @swc-node/register (non-blocking). Installed: @nx/rspack@22.1.3, @rspack/core@1.6.6, @rspack/dev-server@1.1.4, postcss-loader@8.2.0.  
**Completed Date:** 2026-01-XX

---

### Task 1.4: Install Jest Testing Framework

- [x] ~~Evaluate Rstest vs Jest~~ (Decision: Jest)
- [x] Install Jest and related dependencies
- [x] Install @types/jest for TypeScript support
- [x] Install jest-environment-jsdom for React Testing Library
- [x] Install ts-jest for TypeScript support

**Status:** ✅ Complete  
**Notes:** Jest chosen as testing framework. Rationale: mature ecosystem, proven track record, extensive documentation, lower risk for migration. All dependencies installed: jest@30.2.0, @jest/globals@30.2.0, @types/jest@30.0.0, jest-environment-jsdom@30.2.0, ts-jest@29.4.6. @testing-library/jest-dom already present (v6.9.1).  
**Completed Date:** 2026-01-XX

---

**Phase 1 Completion:** **100% (4/4 tasks complete)** ✅

---

## Phase 2: Core Bundler Migration

**Goal:** Convert all Vite configurations to Rspack  
**Duration:** 2-3 days  
**Status:** 🟡 In Progress

### Task 2.1: Create Base Rspack Configuration Template

- [x] Create `rspack.config.js` template with common settings
- [x] Document configuration differences from Vite
- [x] Set up TypeScript config (if using TS config)

**Status:** ✅ Complete  
**Notes:** Created base template in `docs/Rspack-Migration/rspack-config-template.js` with helper function for creating configs. Comprehensive differences documented in `docs/Rspack-Migration/vite-to-rspack-config-differences.md`. Rspack uses JavaScript configs (not TypeScript), but TypeScript is processed via builtin:swc-loader.  
**Completed Date:** 2026-01-XX

---

### Task 2.2: Migrate Shell App Configuration

- [x] Convert `apps/shell/vite.config.mts` → `apps/shell/rspack.config.js`
- [x] Configure React/JSX via `builtin:swc-loader`
- [x] Set up dev server configuration (port 4200)
- [x] Configure build output
- [x] Test basic build (without Module Federation)
- [x] Verify React components render

**Status:** ✅ Complete  
**Notes:** Created `apps/shell/rspack.config.js` with React/TypeScript via builtin:swc-loader, dev server on port 4200, and proper build output. Added temporary stub for Module Federation remotes (will be configured in Phase 3). Updated `apps/shell/project.json` to use Rspack executors. Build succeeds successfully. HTML handled via NxAppRspackPlugin with `index` option in project.json.  
**Completed Date:** 2026-01-XX

---

### Task 2.3: Migrate Auth MFE Configuration

- [x] Convert `apps/auth-mfe/vite.config.mts` → `apps/auth-mfe/rspack.config.js`
- [x] Configure React/JSX
- [x] Set up dev server (port 4201)
- [x] Configure build output
- [x] Test basic build

**Status:** ✅ Complete  
**Notes:** Created `apps/auth-mfe/rspack.config.js` with React/TypeScript via builtin:swc-loader, dev server on port 4201, and proper build output. Updated `apps/auth-mfe/project.json` to use Rspack executors. Added ReactRefreshPlugin for HMR. CSS import temporarily commented out (will be enabled in Phase 4). Build succeeds successfully.  
**Completed Date:** 2026-01-XX

---

### Task 2.4: Migrate Payments MFE Configuration

- [x] Convert `apps/payments-mfe/vite.config.mts` → `apps/payments-mfe/rspack.config.js`
- [x] Configure React/JSX
- [x] Set up dev server (port 4202)
- [x] Configure build output
- [x] Test basic build

**Status:** ✅ Complete  
**Notes:** Created `apps/payments-mfe/rspack.config.js` with React/TypeScript via builtin:swc-loader, dev server on port 4202, and proper build output. Updated `apps/payments-mfe/project.json` to use Rspack executors. Added ReactRefreshPlugin for HMR. CSS import temporarily commented out (will be enabled in Phase 4). Build succeeds successfully. This resolves the Vite Module Federation error that was occurring with `pnpm dev:payments-mfe` (documented in Known Issues).  
**Completed Date:** 2026-01-XX

---

### Task 2.5: Migrate Library Configurations

- [x] Convert `libs/shared-utils/vite.config.mts` → `rspack.config.js`
- [x] Convert `libs/shared-ui/vite.config.mts` → `rspack.config.js`
- [x] Convert `libs/shared-types/vite.config.mts` → `rspack.config.js`
- [x] Convert `libs/shared-auth-store/vite.config.mts` → `rspack.config.js`
- [x] Convert `libs/shared-header-ui/vite.config.mts` → `rspack.config.js`
- [x] Test all library builds

**Status:** ✅ Complete  
**Notes:** Created Rspack configs for all 5 libraries. TypeScript libraries (shared-utils, shared-types, shared-auth-store) use minimal configs as placeholders since they build with @nx/js:tsc. React libraries (shared-ui, shared-header-ui) have full library mode configs with externals for react/react-dom. All library builds via @nx/js:tsc succeed. Rspack configs are syntactically valid and ready for future testing migration (Phase 5).  
**Completed Date:** 2026-01-XX

---

### Task 2.6: Update Nx Configuration

- [x] Update `nx.json` to use `@nx/rspack` executors
- [x] Update `project.json` files (if using)
- [x] Update target definitions: `build`, `serve`, `preview`
- [x] Remove Vite-specific targets
- [x] Verify `nx build shell` works
- [x] Verify `nx serve shell` works

**Status:** ✅ Complete  
**Notes:** Updated `nx.json` to replace `@nx/vite/plugin` with `@nx/rspack/plugin`. Removed `@nx/vitest` plugin (testing migration to Jest in Phase 5). Updated generators to use "rspack" bundler and "jest" test runner. Added explicit `@nx/js:tsc` build targets to `shared-ui` and `shared-header-ui` libraries to prevent @nx/rspack plugin from auto-inferring Rspack targets (libraries should use TypeScript compiler, not Rspack). Verified `nx build shell` and `nx serve shell` work correctly.  
**Completed Date:** 2026-01-XX

---

### Task 2.7: Update Package.json Scripts

- [x] Update build scripts to use Rspack
- [x] Update dev scripts
- [x] Update preview scripts (if needed)
- [x] Remove Vite-specific scripts
- [x] Test all commands work correctly

**Status:** ✅ Complete  
**Notes:** All scripts in package.json already use `nx` commands (e.g., `nx build`, `nx serve`), which automatically use the Rspack executors configured in project.json files. No script changes were needed. Verified that `pnpm build:shell`, `pnpm build:verify`, and `pnpm dev:mf` work correctly with Rspack. Kill scripts already handle both Vite and Rspack processes (useful during transition). Vite dependencies remain in package.json but will be removed in a later cleanup phase.  
**Completed Date:** 2026-01-XX

---

**Phase 2 Completion:** **100% (7/7 tasks complete)** ✅

---

## Phase 3: Module Federation Setup

**Goal:** Configure Module Federation v2 with HMR support  
**Duration:** 2-3 days  
**Status:** ⬜ Not Started

### Task 3.1: Configure Shell as Host

- [ ] Add Module Federation plugin to shell config
- [ ] Configure remotes (authMfe, paymentsMfe)
- [ ] Configure shared dependencies
- [ ] Set `output.uniqueName: 'shell'` (required for HMR)

**Status:** ⬜ Not Started  
**Notes:**  
**Completed Date:**

---

### Task 3.2: Configure Auth MFE as Remote

- [ ] Add Module Federation plugin to auth-mfe config
- [ ] Configure exposes (SignIn, SignUp)
- [ ] Configure shared dependencies (must match shell)
- [ ] Set `output.uniqueName: 'authMfe'`
- [ ] Set public path for assets

**Status:** ⬜ Not Started  
**Notes:**  
**Completed Date:**

---

### Task 3.3: Configure Payments MFE as Remote

- [ ] Add Module Federation plugin to payments-mfe config
- [ ] Configure exposes (PaymentsPage)
- [ ] Configure shared dependencies (must match shell)
- [ ] Set `output.uniqueName: 'paymentsMfe'`
- [ ] Set public path for assets

**Status:** ⬜ Not Started  
**Notes:**  
**Completed Date:**

---

### Task 3.4: Test Remote Loading

- [ ] Build all remotes
- [ ] Start all dev servers
- [ ] Test shell loads remotes correctly
- [ ] Verify components render in shell
- [ ] Check browser console for errors

**Status:** ⬜ Not Started  
**Notes:**  
**Completed Date:**

---

### Task 3.5: Test HMR with Module Federation ⭐ (PRIMARY GOAL)

- [ ] Make change in auth-mfe component
- [ ] Verify HMR updates in shell (no page refresh)
- [ ] Make change in payments-mfe component
- [ ] Verify HMR updates in shell (no page refresh)
- [ ] Make change in shell component
- [ ] Verify HMR updates (no page refresh)
- [ ] Measure HMR update time (target: < 100ms)

**Status:** ⬜ Not Started  
**Notes:** This is the primary goal of the migration. HMR must work for the migration to be considered successful.  
**Completed Date:**

---

### Task 3.6: Fix Asset Path Issues (If Needed)

- [ ] Verify assets load from correct origins
- [ ] Fix public path issues if needed
- [ ] Verify CORS is configured correctly
- [ ] Test with different network conditions

**Status:** ⬜ Not Started  
**Notes:**  
**Completed Date:**

---

**Phase 3 Completion:** **0% (0/6 tasks complete)** ⬜

---

## Phase 4: Styling Configuration

**Goal:** Configure Tailwind CSS v4 with PostCSS in Rspack  
**Duration:** 1 day  
**Status:** ⬜ Not Started

### Task 4.1: Configure PostCSS Loader

- [ ] Add PostCSS loader rule to shell Rspack config
- [ ] Add PostCSS loader rule to auth-mfe Rspack config
- [ ] Add PostCSS loader rule to payments-mfe Rspack config
- [ ] Configure `@tailwindcss/postcss` plugin
- [ ] Configure `autoprefixer` plugin
- [ ] Test CSS processing

**Status:** ⬜ Not Started  
**Notes:**  
**Completed Date:**

---

### Task 4.2: Verify Tailwind Configuration

- [ ] Verify `tailwind.config.js` is compatible
- [ ] Verify `@config` directive works in CSS files
- [ ] Verify content paths work correctly
- [ ] Test Tailwind classes in components

**Status:** ⬜ Not Started  
**Notes:**  
**Completed Date:**

---

### Task 4.3: Test Styling Across All Apps

- [ ] Test styling in shell
- [ ] Test styling in auth-mfe (loaded in shell)
- [ ] Test styling in payments-mfe (loaded in shell)
- [ ] Verify responsive design works
- [ ] Verify HMR for CSS changes

**Status:** ⬜ Not Started  
**Notes:**  
**Completed Date:**

---

**Phase 4 Completion:** **0% (0/3 tasks complete)** ⬜

---

## Phase 5: Testing Framework Migration

**Goal:** Migrate from Vitest to Jest  
**Duration:** 3-4 days  
**Status:** ⬜ Not Started

### Task 5.1: Install Jest Testing Framework

- [ ] Install Jest and related dependencies (if not done in Phase 1)
- [ ] Install React Testing Library integration
- [ ] Install ts-jest for TypeScript support
- [ ] Install @testing-library/jest-dom
- [ ] Remove Vitest dependencies

**Status:** ⬜ Not Started  
**Notes:**  
**Completed Date:**

---

### Task 5.2: Create Base Jest Configuration

- [ ] Create `jest.config.js` in workspace root
- [ ] Configure React Testing Library setup
- [ ] Configure jsdom environment
- [ ] Configure test file patterns
- [ ] Configure TypeScript support with ts-jest
- [ ] Configure coverage threshold (70%)

**Status:** ⬜ Not Started  
**Notes:**  
**Completed Date:**

---

### Task 5.3: Update Test Setup Files

- [ ] Update `src/test/setup.ts` for Jest
- [ ] Update imports if needed
- [ ] Configure test utilities
- [ ] Test basic test runs

**Status:** ⬜ Not Started  
**Notes:**  
**Completed Date:**

---

### Task 5.4: Migrate Shell Tests

- [ ] Update test imports (Vitest → Jest)
- [ ] Update mock setup (`vi.fn()` → `jest.fn()`)
- [ ] Update spy setup (`vi.spyOn()` → `jest.spyOn()`)
- [ ] Update mock clearing (`vi.clearAllMocks()` → `jest.clearAllMocks()`)
- [ ] Run tests and fix failures
- [ ] Verify test coverage

**Status:** ⬜ Not Started  
**Notes:**  
**Completed Date:**

---

### Task 5.5: Migrate Auth MFE Tests

- [ ] Update test imports
- [ ] Update mock/spy setup
- [ ] Run tests and fix failures
- [ ] Verify test coverage

**Status:** ⬜ Not Started  
**Notes:**  
**Completed Date:**

---

### Task 5.6: Migrate Payments MFE Tests

- [ ] Update test imports
- [ ] Update mock/spy setup
- [ ] Run tests and fix failures
- [ ] Verify test coverage

**Status:** ⬜ Not Started  
**Notes:**  
**Completed Date:**

---

### Task 5.7: Migrate Library Tests

- [ ] Migrate shared-utils tests
- [ ] Migrate shared-ui tests
- [ ] Migrate shared-types tests
- [ ] Migrate shared-auth-store tests
- [ ] Migrate shared-header-ui tests
- [ ] Verify all tests pass

**Status:** ⬜ Not Started  
**Notes:**  
**Completed Date:**

---

### Task 5.8: Update Test Scripts

- [ ] Update `package.json` test scripts
- [ ] Update coverage configuration
- [ ] Update Nx test targets if needed
- [ ] Verify all test commands work
- [ ] Verify coverage reports generate

**Status:** ⬜ Not Started  
**Notes:**  
**Completed Date:**

---

**Phase 5 Completion:** **0% (0/8 tasks complete)** ⬜

---

## Phase 6: Verification & Documentation

**Goal:** Verify migration success and document changes  
**Duration:** 2-3 days  
**Status:** ⬜ Not Started

### Task 6.1: Full Feature Verification

- [ ] Test authentication flow (sign-in, sign-up)
- [ ] Test payments flow (view, create, update, delete)
- [ ] Test routing and navigation
- [ ] Test role-based access control (VENDOR vs CUSTOMER)
- [ ] Test state management (Zustand, TanStack Query)
- [ ] Test form validation
- [ ] Test error boundaries
- [ ] Verify no feature regressions

**Status:** ⬜ Not Started  
**Notes:**  
**Completed Date:**

---

### Task 6.2: Performance Verification

- [ ] Measure production build time (compare to Vite)
- [ ] Measure dev server startup time
- [ ] Measure HMR update time
- [ ] Verify bundle sizes (compare to Vite)
- [ ] Document performance improvements

**Status:** ⬜ Not Started  
**Notes:**  
**Completed Date:**

---

### Task 6.3: Developer Workflow Verification

- [ ] Test `pnpm dev` workflow
- [ ] Test `pnpm build` workflow
- [ ] Test `pnpm test` workflow
- [ ] Verify all commands work as expected

**Status:** ⬜ Not Started  
**Notes:**  
**Completed Date:**

---

### Task 6.4: Update Documentation

- [ ] Update `developer-workflow.md` with Rspack workflow
- [ ] Update build instructions
- [ ] Update testing instructions
- [ ] Create migration summary document
- [ ] Update README if needed

**Status:** ⬜ Not Started  
**Notes:**  
**Completed Date:**

---

### Task 6.5: Cleanup

- [ ] Remove Vite dependencies from package.json
- [ ] Remove backup files (or archive)
- [ ] Clean up unused configurations
- [ ] Update .gitignore if needed
- [ ] Final code review

**Status:** ⬜ Not Started  
**Notes:**  
**Completed Date:**

---

**Phase 6 Completion:** **0% (0/5 tasks complete)** ⬜

---

## Overall Progress Summary

> **Last Updated:** 2026-01-XX  
> **Status:** 🟡 In Progress

### Phase Completion Status

| Phase                                 | Tasks  | Completed | Status         |
| ------------------------------------- | ------ | --------- | -------------- |
| Phase 1: Preparation & Setup          | 4      | 4         | ✅ Complete    |
| Phase 2: Core Bundler Migration       | 7      | 7         | ✅ Complete    |
| Phase 3: Module Federation Setup      | 6      | 0         | ⬜ Not Started |
| Phase 4: Styling Configuration        | 3      | 0         | ⬜ Not Started |
| Phase 5: Testing Framework Migration  | 8      | 0         | ⬜ Not Started |
| Phase 6: Verification & Documentation | 5      | 0         | ⬜ Not Started |
| **Total**                             | **33** | **11**    | **🟡 33%**     |

### Key Milestones

| Milestone                                 | Status | Date       |
| ----------------------------------------- | ------ | ---------- |
| Dependencies installed                    | ✅     | 2026-01-XX |
| All apps build with Rspack                | ⬜     |            |
| **HMR working with Module Federation** ⭐ | ⬜     |            |
| Tailwind CSS working                      | ⬜     |            |
| All tests passing (Jest)                  | ⬜     |            |
| Migration complete                        | ⬜     |            |

---

## Success Criteria Checklist

### Must Have (Blocking)

- [ ] HMR works with Module Federation v2 in dev mode
- [ ] All apps (shell, auth-mfe, payments-mfe) build successfully
- [ ] All remotes load correctly in shell
- [ ] All tests pass (70%+ coverage maintained)
- [ ] All features work (no regressions)

### Nice to Have (Non-Blocking)

- [ ] Faster build times (verified benchmarks)
- [ ] Faster HMR times (verified benchmarks)
- [ ] Smaller bundle sizes

---

## Blockers & Issues

### Current Blockers

_No blockers at this time_

### Known Issues

**Issue: payments-mfe Vite Module Federation Error**

- **Status:** ✅ Resolved (Task 2.4 completed)
- **Error:** `Cannot read properties of null (reading 'id')` in `@module-federation/vite` plugin
- **Affected:** `pnpm dev:payments-mfe` (Vite-based, before migration)
- **Root Cause:** Module Federation plugin issue when resolving local shared package `shared-auth-store`
- **Resolution:** Fixed by migrating payments-mfe to Rspack in Task 2.4. The Rspack build succeeds successfully.
- **Date Reported:** 2026-01-XX

### Resolved Issues

_Add resolved issues here as they occur_

---

## Lessons Learned

### Technical Notes

_Add technical notes here as work progresses_

### Architecture Decisions

_Add architecture decisions here as they are made_

### Rspack-Specific Learnings

_Add Rspack-specific learnings here (configuration patterns, gotchas, etc.)_

---

## Rollback Checkpoint

### Rollback Triggers

If any of the following occur, consider rollback:

- [ ] HMR not working after all attempts in Phase 3
- [ ] Critical bugs blocking development
- [ ] Significant performance degradation
- [ ] Test migration fails completely
- [ ] Timeline exceeds acceptable threshold

### Rollback Status

**Rollback Needed:** No  
**Rollback Date:** N/A  
**Rollback Reason:** N/A

---

## Related Documents

- [`rspack-migration-plan.md`](./rspack-migration-plan.md) - Detailed implementation plan
- [`rspack-research-findings.md`](./rspack-research-findings.md) - Research and compatibility analysis
- [`rspack-tech-stack-impact.md`](./rspack-tech-stack-impact.md) - Tech stack impact analysis
- [`rspack-risks-mitigations.md`](./rspack-risks-mitigations.md) - Risk analysis and mitigations
- [`README.md`](./README.md) - Migration documentation overview

---

**Last Updated:** 2026-01-XX  
**Status:** 🟡 In Progress  
**Next Task:** Phase 3 - Module Federation Setup (Task 3.1: Configure Module Federation Plugin)
