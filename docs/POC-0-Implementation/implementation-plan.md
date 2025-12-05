# POC-0 Implementation Plan

**Status:** Ready for Implementation  
**Version:** 1.0  
**Date:** 2026-01-XX  
**Phase:** POC-0 - Foundation

> **📊 Progress Tracking:** See [`task-list.md`](./task-list.md) to track completion status and overall progress.

---

## Executive Summary

This document provides a detailed, step-by-step implementation plan for POC-0, establishing the foundation for the microfrontend platform. Each task is designed to be:

- **Clear and actionable** - Specific steps that can be executed
- **Small and testable** - Easy to verify completion
- **Production-ready** - No throw-away code
- **Incremental** - Builds on previous steps

**Timeline:** 1-2 weeks  
**Goal:** Working shell app + hello remote with Module Federation v2

---

## Phase 1: Workspace Setup & Configuration

### Task 1.1: Initialize Nx Workspace

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-11-initialize-nx-workspace)

**Objective:** Create Nx workspace with React preset

**Steps:**

1. Run: `npx create-nx-workspace@latest web-mfe-workspace --preset=react --packageManager=pnpm --nxCloud=skip`
2. Verify workspace structure is created
3. Verify `nx.json` exists
4. Verify `package.json` exists
5. Verify `pnpm-workspace.yaml` exists

**Verification:**

- [ ] Workspace directory created
- [ ] `nx.json` exists and is valid
- [ ] `package.json` exists with correct name
- [ ] `pnpm-workspace.yaml` exists

**Acceptance Criteria:**

- Nx workspace initialized successfully
- Can run `nx --version` and see version number
- Workspace structure matches expected layout

---

### Task 1.2: Install Core Dependencies

**Objective:** Install React 19, Vite, and Module Federation dependencies

**Steps:**

1. Install React 19.2.0: `pnpm add -w react@19.2.0 react-dom@19.2.0`
2. Install Vite and Nx plugins: `pnpm add -D -w @nx/vite @nx/react vite@6.x`
3. Install Module Federation: `pnpm add -D -w @module-federation/enhanced@0.21.6`
4. Install TypeScript: `pnpm add -D -w typescript@5.9.x`
5. Verify all dependencies installed correctly

**Verification:**

- [ ] React 19.2.0 in `package.json`
- [ ] React DOM 19.2.0 in `package.json`
- [ ] Vite 6.x in `package.json`
- [ ] Module Federation 0.21.6 in `package.json`
- [ ] TypeScript 5.9.x in `package.json`
- [ ] `pnpm-lock.yaml` updated

**Acceptance Criteria:**

- All dependencies installed without errors
- Version numbers match requirements
- `pnpm install` runs successfully

---

### Task 1.3: Configure TypeScript

**Objective:** Setup TypeScript with strict mode

**Steps:**

1. Verify root `tsconfig.json` exists
2. Ensure `strict: true` in compiler options
3. Verify path aliases are configured (if needed)
4. Test TypeScript compilation: `npx tsc --noEmit`

**Verification:**

- [ ] `tsconfig.json` exists at root
- [ ] `strict: true` in compiler options
- [ ] TypeScript compiles without errors
- [ ] No `any` types in generated code

**Acceptance Criteria:**

- TypeScript strict mode enabled
- No compilation errors
- Type checking works correctly

---

### Task 1.4: Setup ESLint and Prettier

**Objective:** Configure code quality tools

**Steps:**

1. Install ESLint 9.x: `pnpm add -D -w eslint@9.x`
2. Install Prettier: `pnpm add -D -w prettier@3.3.x`
3. Install TypeScript ESLint: `pnpm add -D -w @typescript-eslint/eslint-plugin@8.x @typescript-eslint/parser@8.x`
4. Create `.eslintrc.json` with flat config (ESLint 9)
5. Create `.prettierrc` configuration
6. Test linting: `nx lint`

**Verification:**

- [ ] ESLint 9.x installed
- [ ] Prettier 3.3.x installed
- [ ] TypeScript ESLint 8.x installed
- [ ] `.eslintrc.json` exists
- [ ] `.prettierrc` exists
- [ ] `nx lint` runs successfully

**Acceptance Criteria:**

- ESLint configured with flat config
- Prettier configured
- Linting works without errors
- Code formatting works

---

## Phase 2: Shell Application

### Task 2.1: Create Shell Application

**Objective:** Generate shell app using Nx generator

**Steps:**

1. Run: `nx generate @nx/react:application shell --bundler=vite --style=css --routing=true`
2. Verify app structure created in `apps/shell/`
3. Verify `apps/shell/vite.config.ts` exists
4. Verify `apps/shell/src/main.tsx` exists
5. Verify `apps/shell/src/app/App.tsx` exists

**Verification:**

- [ ] `apps/shell/` directory exists
- [ ] `vite.config.ts` exists
- [ ] `main.tsx` exists
- [ ] `App.tsx` exists
- [ ] `package.json` in shell app

**Acceptance Criteria:**

- Shell app created successfully
- App structure matches Nx conventions
- Can see app in `nx.json` projects

---

### Task 2.2: Configure Vite for Shell

**Objective:** Setup Vite configuration for shell app

**Steps:**

1. Open `apps/shell/vite.config.ts`
2. Verify React plugin is configured
3. Set port to 4200: `server: { port: 4200 }`
4. Verify build configuration
5. Test dev server: `nx serve shell`

**Verification:**

- [ ] `vite.config.ts` has React plugin
- [ ] Port configured to 4200
- [ ] Dev server starts on http://localhost:4200
- [ ] App loads in browser
- [ ] HMR works (make a change, see it update)

**Acceptance Criteria:**

- Shell app runs on port 4200
- Dev server starts without errors
- HMR works correctly
- App displays default React content

---

### Task 2.3: Create Basic Shell Layout

**Objective:** Create basic shell app structure

**Steps:**

1. Create `apps/shell/src/components/Layout.tsx`
2. Create basic layout with header and main content area
3. Update `App.tsx` to use Layout component
4. Add basic styling (inline styles or CSS)
5. Verify layout renders correctly

**Verification:**

- [ ] `Layout.tsx` component created
- [ ] Layout has header and main content
- [ ] `App.tsx` uses Layout component
- [ ] Layout renders in browser
- [ ] Basic styling applied

**Acceptance Criteria:**

- Shell app has basic layout structure
- Layout component is reusable
- App displays correctly in browser

---

## Phase 3: Hello Remote Application

### Task 3.1: Create Hello Remote Application

**Objective:** Generate hello remote app using Nx generator

**Steps:**

1. Run: `nx generate @nx/react:application hello-remote --bundler=vite --style=css --routing=false`
2. Verify app structure created in `apps/hello-remote/`
3. Verify `apps/hello-remote/vite.config.ts` exists
4. Verify `apps/hello-remote/src/main.tsx` exists
5. Verify `apps/hello-remote/src/app/App.tsx` exists

**Verification:**

- [ ] `apps/hello-remote/` directory exists
- [ ] `vite.config.ts` exists
- [ ] `main.tsx` exists
- [ ] `App.tsx` exists
- [ ] `package.json` in hello-remote app

**Acceptance Criteria:**

- Hello remote app created successfully
- App structure matches Nx conventions
- Can see app in `nx.json` projects

---

### Task 3.2: Create HelloRemote Component

**Objective:** Create component to be exposed via Module Federation

**Steps:**

1. Create `apps/hello-remote/src/components/HelloRemote.tsx`
2. Create simple component that displays "Hello from Remote!"
3. Export component as default
4. Verify component renders correctly

**Verification:**

- [ ] `HelloRemote.tsx` component created
- [ ] Component displays "Hello from Remote!"
- [ ] Component is exported as default
- [ ] Component renders in browser (when app runs standalone)

**Acceptance Criteria:**

- HelloRemote component created
- Component is simple and testable
- Component can be imported

---

### Task 3.3: Configure Vite for Hello Remote

**Objective:** Setup Vite configuration for hello remote app

**Steps:**

1. Open `apps/hello-remote/vite.config.ts`
2. Verify React plugin is configured
3. Set port to 4201: `server: { port: 4201, cors: true }`
4. Verify build configuration
5. Test dev server: `nx serve hello-remote`

**Verification:**

- [ ] `vite.config.ts` has React plugin
- [ ] Port configured to 4201
- [ ] CORS enabled
- [ ] Dev server starts on http://localhost:4201
- [ ] App loads in browser

**Acceptance Criteria:**

- Hello remote app runs on port 4201
- Dev server starts without errors
- CORS is enabled for Module Federation
- App displays HelloRemote component

---

## Phase 4: Module Federation v2 Configuration

### Task 4.1: Configure Module Federation for Hello Remote

**Objective:** Setup Module Federation v2 for remote app

**Steps:**

1. Install Vite plugin for Module Federation: `pnpm add -D -w @module-federation/vite`
2. Update `apps/hello-remote/vite.config.ts`
3. Add Module Federation plugin configuration:
   - `name: 'helloRemote'`
   - `filename: 'remoteEntry.js'`
   - `exposes: { './HelloRemote': './src/components/HelloRemote.tsx' }`
   - `shared: { react: { singleton: true }, 'react-dom': { singleton: true } }`
4. Verify configuration is correct
5. Test build: `nx build hello-remote`

**Verification:**

- [ ] Module Federation plugin installed
- [ ] `vite.config.ts` has Module Federation config
- [ ] Remote name is 'helloRemote'
- [ ] Exposes './HelloRemote'
- [ ] Shared dependencies configured
- [ ] Build generates `remoteEntry.js`

**Acceptance Criteria:**

- Module Federation v2 configured for remote
- Build generates remote entry file
- Remote entry file is accessible at expected path
- Shared dependencies configured correctly

---

### Task 4.2: Configure Module Federation for Shell

**Objective:** Setup Module Federation v2 for host app

**Steps:**

1. Update `apps/shell/vite.config.ts`
2. Add Module Federation plugin configuration:
   - `name: 'shell'`
   - `remotes: { helloRemote: 'http://localhost:4201/assets/remoteEntry.js' }`
   - `shared: { react: { singleton: true }, 'react-dom': { singleton: true } }`
3. Verify configuration is correct
4. Test build: `nx build shell`

**Verification:**

- [ ] `vite.config.ts` has Module Federation config
- [ ] Host name is 'shell'
- [ ] Remotes configured with correct URL
- [ ] Shared dependencies configured
- [ ] Build completes successfully

**Acceptance Criteria:**

- Module Federation v2 configured for host
- Shell can reference hello remote
- Build completes without errors
- Configuration matches remote setup

---

### Task 4.3: Integrate HelloRemote in Shell

**Objective:** Load and render HelloRemote component in shell

**Steps:**

1. Create `apps/shell/src/components/RemoteComponent.tsx` for dynamic loading
2. Use dynamic import to load HelloRemote: `const HelloRemote = React.lazy(() => import('helloRemote/HelloRemote'))`
3. Wrap in Suspense boundary
4. Add HelloRemote to shell layout
5. Test integration: Start both apps and verify HelloRemote loads

**Verification:**

- [ ] `RemoteComponent.tsx` created
- [ ] Dynamic import configured correctly
- [ ] Suspense boundary added
- [ ] HelloRemote added to shell layout
- [ ] Both apps running (shell on 4200, hello-remote on 4201)
- [ ] HelloRemote component loads and displays

**Acceptance Criteria:**

- Shell successfully loads HelloRemote from remote
- Component renders correctly
- No console errors
- Module Federation works end-to-end

---

## Phase 5: Shared Libraries

### Task 5.1: Create shared-utils Library

**Objective:** Create shared utilities library

**Steps:**

1. Run: `nx generate @nx/js:library shared-utils --bundler=tsc --unitTestRunner=vitest`
2. Verify library structure in `libs/shared-utils/`
3. Create simple utility function: `libs/shared-utils/src/lib/formatDate.ts`
4. Export from `libs/shared-utils/src/index.ts`
5. Test utility in shell app

**Verification:**

- [ ] `libs/shared-utils/` directory exists
- [ ] Library structure created
- [ ] Utility function created
- [ ] Exported from index.ts
- [ ] Can import in shell app
- [ ] Utility function works

**Acceptance Criteria:**

- Shared utils library created
- Can import and use utilities
- Library is properly configured in Nx

---

### Task 5.2: Create shared-ui Library

**Objective:** Create shared UI components library

**Steps:**

1. Run: `nx generate @nx/react:library shared-ui --bundler=vite --unitTestRunner=vitest`
2. Verify library structure in `libs/shared-ui/`
3. Create simple Button component: `libs/shared-ui/src/lib/Button.tsx`
4. Export from `libs/shared-ui/src/index.ts`
5. Test component in shell app

**Verification:**

- [ ] `libs/shared-ui/` directory exists
- [ ] Library structure created
- [ ] Button component created
- [ ] Exported from index.ts
- [ ] Can import in shell app
- [ ] Button component renders

**Acceptance Criteria:**

- Shared UI library created
- Can import and use components
- Library is properly configured in Nx

---

### Task 5.3: Create shared-types Library

**Objective:** Create shared TypeScript types library

**Steps:**

1. Run: `nx generate @nx/js:library shared-types --bundler=tsc`
2. Verify library structure in `libs/shared-types/`
3. Create simple type: `libs/shared-types/src/lib/types.ts` with `User` interface
4. Export from `libs/shared-types/src/index.ts`
5. Test type in shell app

**Verification:**

- [ ] `libs/shared-types/` directory exists
- [ ] Library structure created
- [ ] Types file created
- [ ] Types exported from index.ts
- [ ] Can import types in shell app
- [ ] TypeScript recognizes types

**Acceptance Criteria:**

- Shared types library created
- Can import and use types
- Library is properly configured in Nx

---

## Phase 6: Testing Setup

### Task 6.1: Configure Vitest for Shell

**Objective:** Setup Vitest for shell app testing

**Steps:**

1. Verify Vitest is installed (from Task 1.2)
2. Create `apps/shell/vitest.config.ts`
3. Configure Vitest with React Testing Library
4. Create test file: `apps/shell/src/app/App.test.tsx`
5. Write basic test: "renders shell app"
6. Run test: `nx test shell`

**Verification:**

- [ ] `vitest.config.ts` exists
- [ ] Vitest configured correctly
- [ ] Test file created
- [ ] Test written
- [ ] `nx test shell` runs successfully
- [ ] Test passes

**Acceptance Criteria:**

- Vitest configured for shell
- Can write and run tests
- Test passes successfully

---

### Task 6.2: Configure Vitest for Hello Remote

**Objective:** Setup Vitest for hello remote app testing

**Steps:**

1. Create `apps/hello-remote/vitest.config.ts`
2. Configure Vitest with React Testing Library
3. Create test file: `apps/hello-remote/src/components/HelloRemote.test.tsx`
4. Write test: "renders HelloRemote component"
5. Run test: `nx test hello-remote`

**Verification:**

- [ ] `vitest.config.ts` exists
- [ ] Vitest configured correctly
- [ ] Test file created
- [ ] Test written
- [ ] `nx test hello-remote` runs successfully
- [ ] Test passes

**Acceptance Criteria:**

- Vitest configured for hello remote
- Can write and run tests
- Test passes successfully

---

### Task 6.3: Configure Vitest for Shared Libraries

**Objective:** Setup Vitest for shared libraries

**Steps:**

1. Verify shared-utils has Vitest configured (from Task 5.1)
2. Create test for formatDate utility
3. Verify shared-ui has Vitest configured (from Task 5.2)
4. Create test for Button component
5. Run all tests: `nx run-many --target=test --all`

**Verification:**

- [ ] Shared libraries have Vitest config
- [ ] Tests created for utilities
- [ ] Tests created for components
- [ ] All tests run successfully
- [ ] All tests pass

**Acceptance Criteria:**

- Vitest configured for shared libraries
- Tests written and passing
- Can run all tests together

---

## Phase 7: Production Builds

### Task 7.1: Test Production Build for Hello Remote

**Objective:** Verify production build works for remote

**Steps:**

1. Run: `nx build hello-remote`
2. Verify build output in `dist/apps/hello-remote/`
3. Verify `remoteEntry.js` is generated
4. Verify build is optimized
5. Check bundle size

**Verification:**

- [ ] Build completes successfully
- [ ] Build output exists
- [ ] `remoteEntry.js` generated
- [ ] Build is optimized (minified)
- [ ] Bundle size is reasonable

**Acceptance Criteria:**

- Production build works
- Remote entry file generated
- Build is optimized

---

### Task 7.2: Test Production Build for Shell

**Objective:** Verify production build works for shell

**Steps:**

1. Run: `nx build shell`
2. Verify build output in `dist/apps/shell/`
3. Verify build references remote correctly
4. Verify build is optimized
5. Check bundle size

**Verification:**

- [ ] Build completes successfully
- [ ] Build output exists
- [ ] Build references remote
- [ ] Build is optimized (minified)
- [ ] Bundle size is reasonable

**Acceptance Criteria:**

- Production build works
- Shell build references remote
- Build is optimized

---

### Task 7.3: Test Production Build Together

**Objective:** Verify both apps build together correctly

**Steps:**

1. Build all: `nx run-many --target=build --all`
2. Verify both builds complete
3. Verify remote entry is accessible
4. Test production build locally (serve static files)
5. Verify Module Federation works in production build

**Verification:**

- [ ] Both builds complete
- [ ] Remote entry accessible
- [ ] Production build serves correctly
- [ ] Module Federation works in production
- [ ] No console errors

**Acceptance Criteria:**

- Both apps build successfully
- Production builds work together
- Module Federation works in production

---

## Phase 8: Documentation & Validation

### Task 8.1: Create Development Guide

**Objective:** Document how to run and develop the project

**Steps:**

1. Create `docs/POC-0-Implementation/development-guide.md`
2. Document how to start shell app
3. Document how to start hello remote
4. Document how to run both together
5. Document common commands
6. Document troubleshooting tips

**Verification:**

- [ ] Development guide created
- [ ] Instructions are clear
- [ ] Commands are accurate
- [ ] Troubleshooting section included

**Acceptance Criteria:**

- Development guide is complete
- Instructions are accurate
- Can follow guide to run project

---

### Task 8.2: Validate POC-0 Success Criteria

**Objective:** Verify all POC-0 deliverables are complete

**Steps:**

1. Review success criteria from architecture doc
2. Verify shell loads on http://localhost:4200
3. Verify remote loads on http://localhost:4201
4. Verify Module Federation v2 works
5. Verify shared dependencies work (no duplicates)
6. Verify HMR works
7. Verify production builds work
8. Verify TypeScript types work across boundaries
9. Verify tests pass

**Verification:**

- [ ] All success criteria met
- [ ] Shell app works
- [ ] Remote app works
- [ ] Module Federation works
- [ ] Shared dependencies work
- [ ] HMR works
- [ ] Production builds work
- [ ] TypeScript works
- [ ] Tests pass

**Acceptance Criteria:**

- All POC-0 deliverables complete
- All success criteria met
- Ready for POC-1

---

## Summary

### Deliverables Checklist

- [ ] Nx workspace setup
- [ ] Shell app running
- [ ] Hello remote app running
- [ ] Module Federation v2 configured
- [ ] Dynamic remote loading working
- [ ] Shared libraries created
- [ ] Testing setup complete
- [ ] Production builds working
- [ ] Documentation complete

### Success Criteria

- ✅ Shell loads and runs on http://localhost:4200
- ✅ Remote loads dynamically from http://localhost:4201
- ✅ Module Federation v2 works correctly
- ✅ Shared dependencies work (no duplicates)
- ✅ HMR works (fast updates)
- ✅ Production builds work (optimized)
- ✅ TypeScript types work across boundaries
- ✅ Tests pass

### Next Steps

1. **POC-1:** Add auth and payments MFEs
2. **POC-2:** Backend integration
3. **POC-3:** Infrastructure and performance

---

**Last Updated:** 2026-01-XX  
**Status:** Ready for Implementation
