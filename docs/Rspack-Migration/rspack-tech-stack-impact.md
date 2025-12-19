# Rspack Migration - Tech Stack Impact Analysis

**Status:** Analysis Complete  
**Version:** 1.0  
**Date:** 2026-01-XX  
**Branch:** poc-1-rspack

---

## Executive Summary

This document provides a comprehensive analysis of how migrating from Vite to Rspack will impact every technology in the POC-1 tech stack. Each technology is evaluated for positive impacts, negative impacts, migration considerations, and compatibility status.

---

## Impact Summary Matrix

| Category                           | Technology                 | Compatibility | Impact | Migration Complexity |
| ---------------------------------- | -------------------------- | ------------- | ------ | -------------------- |
| **Bundling & Build**               |
| Vite 6.x → Rspack                  | ⚠️ Replacement             | High          | High   | High                 |
| TypeScript 5.9.x                   | ✅ Compatible              | Neutral       | Low    | Low                  |
| **Module Federation**              |
| @module-federation/enhanced 0.21.6 | ✅ Compatible              | Positive      | Medium | Medium               |
| **Monorepo & Tooling**             |
| Nx                                 | ✅ Compatible (@nx/rspack) | Positive      | Low    | Low                  |
| pnpm 9.x                           | ✅ Compatible              | Neutral       | None   | None                 |
| Node.js 24.11.x LTS                | ✅ Compatible              | Neutral       | None   | None                 |
| **Core Framework**                 |
| React 19.2.0                       | ✅ Compatible              | Neutral       | Low    | Low                  |
| React DOM 19.2.0                   | ✅ Compatible              | Neutral       | Low    | Low                  |
| **Routing**                        |
| React Router 7.x                   | ✅ Compatible              | Neutral       | Low    | Low                  |
| **State Management**               |
| Zustand 4.5.x                      | ✅ Compatible              | Neutral       | Low    | Low                  |
| TanStack Query 5.x                 | ✅ Compatible              | Neutral       | Low    | Low                  |
| **Styling**                        |
| Tailwind CSS 4.0+                  | ✅ Compatible              | Neutral       | Medium | Medium               |
| **Forms & Validation**             |
| React Hook Form 7.52.x             | ✅ Compatible              | Neutral       | Low    | Low                  |
| Zod 3.23.x                         | ✅ Compatible              | Neutral       | Low    | Low                  |
| **HTTP & Storage**                 |
| Axios 1.7.x                        | ✅ Compatible              | Neutral       | Low    | Low                  |
| localStorage                       | ✅ Compatible              | Neutral       | None   | None                 |
| **Error Handling**                 |
| react-error-boundary 4.0.13        | ✅ Compatible              | Neutral       | Low    | Low                  |
| **Testing**                        |
| Vitest 2.0.x                       | ❌ Incompatible            | Negative      | High   | High                 |
| React Testing Library 16.1.x       | ✅ Compatible              | Neutral       | Medium | Medium               |
| Playwright                         | ✅ Compatible              | Neutral       | None   | None                 |
| **Code Quality**                   |
| ESLint 9.x                         | ✅ Compatible              | Neutral       | None   | None                 |
| Prettier 3.3.x                     | ✅ Compatible              | Neutral       | None   | None                 |
| TypeScript ESLint 8.x              | ✅ Compatible              | Neutral       | None   | None                 |

---

## Detailed Technology Analysis

### 1. Bundling & Build

#### 1.1 Vite 6.x → Rspack

**Compatibility:** ⚠️ Replacement (not compatible, must migrate)

**Positive Impacts:**

- ✅ **HMR with Module Federation:** Primary goal achieved - HMR works in dev mode with Module Federation v2
- ✅ **Faster Builds:** ~3-5x faster production builds (2.6s vs 9.1s)
- ✅ **Faster HMR:** ~20-30% faster HMR updates
- ✅ **Better Dev Experience:** Dev mode fully supported (not just preview mode)
- ✅ **Rust-based Performance:** Leverages Rust for better performance

**Negative Impacts:**

- ❌ **Migration Effort:** Complete configuration rewrite required
- ❌ **Different API:** Rspack uses Webpack-compatible API (not Vite API)
- ❌ **Plugin Ecosystem:** Vite plugins won't work; need Rspack equivalents
- ❌ **Learning Curve:** Team needs to learn Rspack configuration
- ❌ **Preview Mode Gone:** No equivalent to Vite's preview mode (dev mode replaces it)

**Migration Considerations:**

- All `vite.config.mts` files need conversion to `rspack.config.js`
- Update all build scripts in `package.json`
- Replace Vite plugins with Rspack equivalents:
  - `@vitejs/plugin-react` → `builtin:swc-loader` (React/JSX)
  - `@module-federation/vite` → Built-in Module Federation support
  - `@nx/vite/plugins/*` → `@nx/rspack` equivalents
- Update Nx executors: `@nx/vite:build` → `@nx/rspack:build`
- Dev server configuration changes
- Build output may differ slightly (same functionality)

**Files to Update:**

- `apps/shell/vite.config.mts` → `apps/shell/rspack.config.js`
- `apps/auth-mfe/vite.config.mts` → `apps/auth-mfe/rspack.config.js`
- `apps/payments-mfe/vite.config.mts` → `apps/payments-mfe/rspack.config.js`
- All library `vite.config.mts` files → `rspack.config.js`
- `package.json` scripts
- `nx.json` target configurations
- `project.json` files (if using Nx project.json)

**Estimated Effort:** 3-4 days (all apps + libraries)

---

#### 1.2 TypeScript 5.9.x

**Compatibility:** ✅ Fully Compatible

**Positive Impacts:**

- ✅ **Fast Transpilation:** `builtin:swc-loader` provides fast TypeScript transpilation
- ✅ **No Breaking Changes:** TypeScript config works as-is

**Negative Impacts:**

- ⚠️ **No Inline Type Checking:** Rspack loader only transpiles (no type checking)
- ⚠️ **Separate Type Checking Required:** Must run `tsc` separately (same as current setup)

**Migration Considerations:**

- Enable `isolatedModules: true` in `tsconfig.json` (recommended)
- Type checking workflow unchanged (already separate `tsc` command)
- Optional: Install `ts-checker-rspack-plugin` for build-time type checking
- All TypeScript features remain supported

**Files to Update:**

- `tsconfig.json` - Enable `isolatedModules` (if not already)
- May need to update `tsconfig.base.json` in monorepo

**Estimated Effort:** < 1 hour (configuration check)

---

### 2. Module Federation

#### 2.1 @module-federation/enhanced 0.21.6

**Compatibility:** ✅ Fully Compatible (Built-in Support)

**Positive Impacts:**

- ✅ **Native Support:** Module Federation v2 built into Rspack (no plugin needed)
- ✅ **HMR Enabled:** HMR works with Module Federation in dev mode
- ✅ **Enhanced Features:** TypeScript type hints, Chrome DevTools integration, runtime plugins
- ✅ **Better Dev Experience:** Dev mode fully supported (not just preview)

**Negative Impacts:**

- ⚠️ **Configuration Differences:** Different config structure than Vite plugin
- ⚠️ **Learning Curve:** Need to learn Rspack Module Federation API

**Migration Considerations:**

- Remove `@module-federation/vite` plugin dependency
- Configure Module Federation directly in `rspack.config.js` (no plugin needed)
- Must set `output.uniqueName` for proper HMR with Module Federation
- Shared dependencies configuration similar but in Rspack format
- Remote configuration similar (entry URLs)
- Exposes configuration similar

**Configuration Migration Example:**

**Before (Vite):**

```typescript
federation({
  name: 'shell',
  remotes: {
    authMfe: {
      type: 'module',
      name: 'authMfe',
      entry: 'http://localhost:4201/remoteEntry.js',
    },
  },
  shared: {
    react: { singleton: true, requiredVersion: '18.3.1' },
  },
});
```

**After (Rspack):**

```javascript
{
  plugins: [
    new rspack.container.ModuleFederationPlugin({
      name: 'shell',
      remotes: {
        authMfe: 'authMfe@http://localhost:4201/remoteEntry.js',
      },
      shared: {
        react: { singleton: true, requiredVersion: '18.3.1' },
      },
    }),
  ],
}
```

**Files to Update:**

- All `vite.config.mts` files (Module Federation config)
- `package.json` - Remove `@module-federation/vite`, may need `@module-federation/enhanced`

**Estimated Effort:** 2-3 days (configuration + testing)

---

### 3. Monorepo & Tooling

#### 3.1 Nx

**Compatibility:** ✅ Fully Compatible (@nx/rspack plugin)

**Positive Impacts:**

- ✅ **Official Plugin:** `@nx/rspack` available since Nx 20 (Oct 2024)
- ✅ **Build Caching:** Nx build cache works with Rspack
- ✅ **Task Execution:** Parallel execution supported
- ✅ **Dependency Graph:** Visualization works
- ✅ **Affected Projects:** Detection works

**Negative Impacts:**

- ⚠️ **Plugin Migration:** Need to replace `@nx/vite` with `@nx/rspack`
- ⚠️ **Executor Changes:** All executors need update

**Migration Considerations:**

- Install `@nx/rspack` plugin
- Update executors: `@nx/vite:build` → `@nx/rspack:build`
- Update generators if used
- Build cache may need invalidation (clear and rebuild)
- `nx.json` may need updates for Rspack targets

**Files to Update:**

- `package.json` - Add `@nx/rspack`, remove `@nx/vite`
- `nx.json` - Update target definitions
- All `project.json` files - Update targets

**Estimated Effort:** 1 day (plugin installation + config updates)

---

#### 3.2 pnpm 9.x

**Compatibility:** ✅ Fully Compatible

**Positive Impacts:**

- ✅ **No Changes:** Package manager unaffected by bundler change

**Negative Impacts:**

- None

**Migration Considerations:**

- No changes required
- Works exactly the same

**Estimated Effort:** None

---

#### 3.3 Node.js 24.11.x LTS

**Compatibility:** ✅ Fully Compatible

**Positive Impacts:**

- ✅ **No Changes:** Node.js version unaffected by bundler change

**Negative Impacts:**

- None

**Migration Considerations:**

- No changes required
- Works exactly the same

**Estimated Effort:** None

---

### 4. Core Framework

#### 4.1 React 19.2.0

**Compatibility:** ✅ Fully Compatible

**Positive Impacts:**

- ✅ **No Breaking Changes:** React works identically
- ✅ **Fast Transpilation:** `builtin:swc-loader` optimizes React/JSX

**Negative Impacts:**

- None

**Migration Considerations:**

- React code unchanged
- JSX/TSX processing via `builtin:swc-loader` instead of `@vitejs/plugin-react`
- Same React features supported
- Bundle output functionally identical

**Files to Update:**

- None (code unchanged)

**Estimated Effort:** None (transparent change)

---

#### 4.2 React DOM 19.2.0

**Compatibility:** ✅ Fully Compatible

**Positive Impacts:**

- ✅ **No Changes:** React DOM works identically

**Negative Impacts:**

- None

**Migration Considerations:**

- No changes required
- Runtime behavior identical

**Estimated Effort:** None

---

### 5. Routing

#### 5.1 React Router 7.x

**Compatibility:** ✅ Fully Compatible

**Positive Impacts:**

- ✅ **No Breaking Changes:** React Router works identically
- ✅ **Code Splitting:** Works with Rspack (similar to Vite)
- ✅ **Lazy Loading:** `React.lazy()` works as expected

**Negative Impacts:**

- None

**Migration Considerations:**

- React Router code unchanged
- Lazy loading patterns work the same
- Code splitting works identically
- Route protection unchanged

**Files to Update:**

- None (code unchanged)

**Estimated Effort:** None

---

### 6. State Management

#### 6.1 Zustand 4.5.x

**Compatibility:** ✅ Fully Compatible

**Positive Impacts:**

- ✅ **No Changes:** Zustand works identically
- ✅ **Bundle Size:** Similar or slightly better with Rspack optimization

**Negative Impacts:**

- None

**Migration Considerations:**

- Zustand code unchanged
- Store patterns work identically
- Middleware (persist, devtools) work the same
- Shared stores across MFEs work the same

**Files to Update:**

- None (code unchanged)

**Estimated Effort:** None

---

#### 6.2 TanStack Query 5.x

**Compatibility:** ✅ Fully Compatible

**Positive Impacts:**

- ✅ **No Changes:** TanStack Query works identically
- ✅ **DevTools:** Still work (browser extension)

**Negative Impacts:**

- None

**Migration Considerations:**

- TanStack Query code unchanged
- Query hooks work identically
- Caching behavior unchanged
- DevTools unchanged

**Files to Update:**

- None (code unchanged)

**Estimated Effort:** None

---

### 7. Styling

#### 7.1 Tailwind CSS 4.0+

**Compatibility:** ✅ Fully Compatible (via PostCSS)

**Positive Impacts:**

- ✅ **Same Performance:** PostCSS integration similar to Vite
- ✅ **Same Configuration:** Tailwind config works as-is

**Negative Impacts:**

- ⚠️ **PostCSS Loader Setup:** Need to configure `postcss-loader` in Rspack

**Migration Considerations:**

- Install `postcss-loader` (if not already)
- Configure PostCSS in Rspack config (similar to Vite)
- Tailwind config file unchanged
- Content paths configuration unchanged
- `@config` directive in CSS files unchanged
- Same PostCSS plugins: `@tailwindcss/postcss`, `autoprefixer`

**Configuration Migration Example:**

**Before (Vite):**

```typescript
css: {
  postcss: {
    plugins: [
      tailwindcss(),
      autoprefixer(),
    ],
  },
}
```

**After (Rspack):**

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

**Files to Update:**

- All `rspack.config.js` files - Add PostCSS loader rule
- `package.json` - Ensure `postcss-loader` is installed

**Estimated Effort:** 1 day (configuration + verification)

---

### 8. Forms & Validation

#### 8.1 React Hook Form 7.52.x

**Compatibility:** ✅ Fully Compatible

**Positive Impacts:**

- ✅ **No Changes:** React Hook Form works identically
- ✅ **Bundle Size:** Similar or slightly better

**Negative Impacts:**

- None

**Migration Considerations:**

- React Hook Form code unchanged
- Validation patterns work identically
- Zod resolver works the same

**Files to Update:**

- None (code unchanged)

**Estimated Effort:** None

---

#### 8.2 Zod 3.23.x

**Compatibility:** ✅ Fully Compatible

**Positive Impacts:**

- ✅ **No Changes:** Zod works identically
- ✅ **Runtime Validation:** Unchanged

**Negative Impacts:**

- None

**Migration Considerations:**

- Zod schemas unchanged
- Validation logic unchanged
- Type inference unchanged

**Files to Update:**

- None (code unchanged)

**Estimated Effort:** None

---

### 9. HTTP & Storage

#### 9.1 Axios 1.7.x

**Compatibility:** ✅ Fully Compatible

**Positive Impacts:**

- ✅ **No Changes:** Axios works identically

**Negative Impacts:**

- None

**Migration Considerations:**

- Axios code unchanged
- Interceptors work identically
- Request/response handling unchanged

**Files to Update:**

- None (code unchanged)

**Estimated Effort:** None

---

#### 9.2 localStorage

**Compatibility:** ✅ Fully Compatible (Browser API)

**Positive Impacts:**

- ✅ **No Changes:** Browser API unaffected

**Negative Impacts:**

- None

**Migration Considerations:**

- No changes required

**Estimated Effort:** None

---

### 10. Error Handling

#### 10.1 react-error-boundary 4.0.13

**Compatibility:** ✅ Fully Compatible

**Positive Impacts:**

- ✅ **No Changes:** Error boundaries work identically

**Negative Impacts:**

- None

**Migration Considerations:**

- Error boundary code unchanged
- Error handling patterns unchanged

**Files to Update:**

- None (code unchanged)

**Estimated Effort:** None

---

### 11. Testing

#### 11.1 Vitest 2.0.x

**Compatibility:** ❌ Incompatible

**Positive Impacts:**

- None (incompatible)

**Negative Impacts:**

- ❌ **Complete Migration Required:** Vitest won't work with Rspack
- ❌ **Test Framework Change:** Need to migrate to Rstest or Jest
- ❌ **API Differences:** Different APIs between Vitest and alternatives
- ❌ **Configuration Rewrite:** All test configs need updates

**Migration Considerations:**

**Decision: Jest** (chosen for this migration)

Rationale:

- Mature, widely adopted
- Large ecosystem with extensive plugins
- Well-documented migration paths
- Lower risk for critical migration
- Proven track record

**Migration Steps:**

1. Install Jest and related dependencies
2. Update test configurations (`vitest.config.ts` → `jest.config.js`)
3. Migrate test utilities (`vi.*` → `jest.*`)
4. Update test scripts
5. Run and fix tests

**Key API Changes:**

- `vi.fn()` → `jest.fn()`
- `vi.mock()` → `jest.mock()`
- `vi.spyOn()` → `jest.spyOn()`
- `vi.clearAllMocks()` → `jest.clearAllMocks()`

**Files to Update:**

- All `vitest.config.ts` files → `jest.config.js`
- All test setup files
- `package.json` - Remove Vitest, add Jest
- Test scripts in `package.json`
- Coverage configuration

**Estimated Effort:** 3-4 days (framework choice + migration + test fixes)

---

#### 11.2 React Testing Library 16.1.x

**Compatibility:** ✅ Fully Compatible

**Positive Impacts:**

- ✅ **Works with Any Test Framework:** Compatible with Rstest, Jest, etc.
- ✅ **No Changes:** API unchanged

**Negative Impacts:**

- ⚠️ **Test Framework Dependency:** Works with new test framework

**Migration Considerations:**

- React Testing Library code unchanged
- Testing patterns unchanged
- Need to ensure compatibility with chosen test framework (Rstest/Jest)

**Files to Update:**

- None (code unchanged, but verify compatibility)

**Estimated Effort:** < 1 day (verification)

---

#### 11.3 Playwright

**Compatibility:** ✅ Fully Compatible

**Positive Impacts:**

- ✅ **No Changes:** E2E testing unaffected by bundler
- ✅ **Same Workflow:** Runs in browser, no bundler dependency

**Negative Impacts:**

- None

**Migration Considerations:**

- Playwright tests unchanged
- E2E workflow unchanged
- May need to update dev server URLs if changed

**Files to Update:**

- E2E test configs (if dev server URLs change)

**Estimated Effort:** < 1 hour (if needed)

---

### 12. Code Quality

#### 12.1 ESLint 9.x

**Compatibility:** ✅ Fully Compatible

**Positive Impacts:**

- ✅ **No Changes:** Runs separately, unaffected by bundler

**Negative Impacts:**

- None

**Migration Considerations:**

- No changes required
- ESLint config unchanged

**Estimated Effort:** None

---

#### 12.2 Prettier 3.3.x

**Compatibility:** ✅ Fully Compatible

**Positive Impacts:**

- ✅ **No Changes:** Runs separately, unaffected by bundler

**Negative Impacts:**

- None

**Migration Considerations:**

- No changes required

**Estimated Effort:** None

---

#### 12.3 TypeScript ESLint 8.x

**Compatibility:** ✅ Fully Compatible

**Positive Impacts:**

- ✅ **No Changes:** Runs separately, unaffected by bundler

**Negative Impacts:**

- None

**Migration Considerations:**

- No changes required

**Estimated Effort:** None

---

## Summary by Impact Level

### High Impact (Requires Migration)

1. **Vite → Rspack:** Complete bundler replacement
2. **Vitest → Jest:** Complete testing framework migration
3. **Module Federation Config:** Configuration structure changes

### Medium Impact (Configuration Changes)

1. **Nx Plugin:** `@nx/vite` → `@nx/rspack`
2. **Tailwind CSS:** PostCSS loader configuration
3. **TypeScript:** Enable `isolatedModules` (if needed)

### Low Impact (Code Verification)

1. **React Testing Library:** Verify compatibility with new test framework
2. **Playwright:** Update URLs if dev server changes

### No Impact (Unchanged)

1. React, React DOM
2. React Router
3. Zustand
4. TanStack Query
5. React Hook Form, Zod
6. Axios
7. localStorage
8. react-error-boundary
9. ESLint, Prettier, TypeScript ESLint
10. pnpm, Node.js

---

## Migration Priority

### Phase 1: Core Bundler Migration (Highest Priority)

1. Install Rspack and Nx plugin
2. Convert all Vite configs to Rspack
3. Update build scripts
4. Verify basic builds work

### Phase 2: Module Federation (High Priority)

1. Configure Module Federation v2 in Rspack
2. Test remote loading
3. Verify HMR with Module Federation

### Phase 3: Styling (Medium Priority)

1. Configure PostCSS loader for Tailwind
2. Verify styling works correctly

### Phase 4: Testing (High Priority but After Core)

1. Install Jest dependencies
2. Migrate test configurations (`vitest.config.ts` → `jest.config.js`)
3. Update tests (`vi.*` → `jest.*`)
4. Run and fix tests

### Phase 5: Verification (Ongoing)

1. Test all features
2. Performance comparison
3. Documentation updates

---

## Conclusion

**Overall Impact:** Medium-High complexity migration with high value

**Key Findings:**

- ✅ Most technologies unaffected (React, routing, state management, etc.)
- ✅ Core bundler migration required (Vite → Rspack)
- ✅ Testing framework migration required (Vitest → Jest)
- ✅ Configuration changes for Module Federation, Tailwind, Nx
- ✅ Primary goal achievable (HMR with Module Federation)

**Estimated Total Effort:** 9-13 days (~2-3 weeks)

---

**Last Updated:** 2026-01-XX  
**Status:** Analysis Complete  
**Next Document:** [Migration Implementation Plan](./rspack-migration-plan.md)
