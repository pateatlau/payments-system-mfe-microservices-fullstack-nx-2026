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
**Status:** ⬜ Not Started

### Task 1.1: Create Migration Branch

- [x] Create feature branch: `poc-1-rspack`
- [x] Ensure current branch is clean and committed
- [x] Push branch to remote

**Status:** ✅ Complete  
**Notes:** Branch `poc-1-rspack` created before planning documentation. Planning docs committed to branch.  
**Completed Date:** 2026-01-XX

---

### Task 1.2: Backup Current Configuration

- [ ] Copy all `vite.config.mts` files to `.backup` directory
- [ ] Document current package.json dependencies
- [ ] Create backup of nx.json if custom targets exist

**Status:** ⬜ Not Started  
**Notes:**  
**Completed Date:**

---

### Task 1.3: Install Rspack Dependencies

- [ ] Install `@nx/rspack` plugin
- [ ] Install `@rspack/core` and `@rspack/dev-server`
- [ ] Install `postcss-loader` (for Tailwind)
- [ ] Install `@swc/core` (if not already installed)
- [ ] Verify no dependency conflicts

**Status:** ⬜ Not Started  
**Notes:**  
**Completed Date:**

---

### Task 1.4: Install Jest Testing Framework

- [x] ~~Evaluate Rstest vs Jest~~ (Decision: Jest)
- [ ] Install Jest and related dependencies
- [ ] Install @types/jest for TypeScript support
- [ ] Install jest-environment-jsdom for React Testing Library
- [ ] Install ts-jest for TypeScript support

**Status:** ⬜ Not Started  
**Notes:** Jest chosen as testing framework. Rationale: mature ecosystem, proven track record, extensive documentation, lower risk for migration.  
**Completed Date:**

---

**Phase 1 Completion:** **25% (1/4 tasks complete)** 🟡

---

## Phase 2: Core Bundler Migration

**Goal:** Convert all Vite configurations to Rspack  
**Duration:** 2-3 days  
**Status:** ⬜ Not Started

### Task 2.1: Create Base Rspack Configuration Template

- [ ] Create `rspack.config.js` template with common settings
- [ ] Document configuration differences from Vite
- [ ] Set up TypeScript config (if using TS config)

**Status:** ⬜ Not Started  
**Notes:**  
**Completed Date:**

---

### Task 2.2: Migrate Shell App Configuration

- [ ] Convert `apps/shell/vite.config.mts` → `apps/shell/rspack.config.js`
- [ ] Configure React/JSX via `builtin:swc-loader`
- [ ] Set up dev server configuration (port 4200)
- [ ] Configure build output
- [ ] Test basic build (without Module Federation)
- [ ] Verify React components render

**Status:** ⬜ Not Started  
**Notes:**  
**Completed Date:**

---

### Task 2.3: Migrate Auth MFE Configuration

- [ ] Convert `apps/auth-mfe/vite.config.mts` → `apps/auth-mfe/rspack.config.js`
- [ ] Configure React/JSX
- [ ] Set up dev server (port 4201)
- [ ] Configure build output
- [ ] Test basic build

**Status:** ⬜ Not Started  
**Notes:**  
**Completed Date:**

---

### Task 2.4: Migrate Payments MFE Configuration

- [ ] Convert `apps/payments-mfe/vite.config.mts` → `apps/payments-mfe/rspack.config.js`
- [ ] Configure React/JSX
- [ ] Set up dev server (port 4202)
- [ ] Configure build output
- [ ] Test basic build

**Status:** ⬜ Not Started  
**Notes:**  
**Completed Date:**

---

### Task 2.5: Migrate Library Configurations

- [ ] Convert `libs/shared-utils/vite.config.mts` → `rspack.config.js`
- [ ] Convert `libs/shared-ui/vite.config.mts` → `rspack.config.js`
- [ ] Convert `libs/shared-types/vite.config.mts` → `rspack.config.js`
- [ ] Convert `libs/shared-auth-store/vite.config.mts` → `rspack.config.js`
- [ ] Convert `libs/shared-header-ui/vite.config.mts` → `rspack.config.js`
- [ ] Test all library builds

**Status:** ⬜ Not Started  
**Notes:**  
**Completed Date:**

---

### Task 2.6: Update Nx Configuration

- [ ] Update `nx.json` to use `@nx/rspack` executors
- [ ] Update `project.json` files (if using)
- [ ] Update target definitions: `build`, `serve`, `preview`
- [ ] Remove Vite-specific targets
- [ ] Verify `nx build shell` works
- [ ] Verify `nx serve shell` works

**Status:** ⬜ Not Started  
**Notes:**  
**Completed Date:**

---

### Task 2.7: Update Package.json Scripts

- [ ] Update build scripts to use Rspack
- [ ] Update dev scripts
- [ ] Update preview scripts (if needed)
- [ ] Remove Vite-specific scripts
- [ ] Test all commands work correctly

**Status:** ⬜ Not Started  
**Notes:**  
**Completed Date:**

---

**Phase 2 Completion:** **0% (0/7 tasks complete)** ⬜

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
| Phase 1: Preparation & Setup          | 4      | 1         | 🟡 In Progress |
| Phase 2: Core Bundler Migration       | 7      | 0         | ⬜ Not Started |
| Phase 3: Module Federation Setup      | 6      | 0         | ⬜ Not Started |
| Phase 4: Styling Configuration        | 3      | 0         | ⬜ Not Started |
| Phase 5: Testing Framework Migration  | 8      | 0         | ⬜ Not Started |
| Phase 6: Verification & Documentation | 5      | 0         | ⬜ Not Started |
| **Total**                             | **33** | **1**     | **🟡 3%**      |

### Key Milestones

| Milestone                                 | Status | Date |
| ----------------------------------------- | ------ | ---- |
| Dependencies installed                    | ⬜     |      |
| All apps build with Rspack                | ⬜     |      |
| **HMR working with Module Federation** ⭐ | ⬜     |      |
| Tailwind CSS working                      | ⬜     |      |
| All tests passing (Jest)                  | ⬜     |      |
| Migration complete                        | ⬜     |      |

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
**Next Task:** Task 1.2 - Backup Current Configuration
