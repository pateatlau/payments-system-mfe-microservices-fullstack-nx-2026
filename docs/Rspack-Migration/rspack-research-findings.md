# Rspack Migration Research Findings

**Status:** Research Complete  
**Version:** 1.0  
**Date:** 2026-01-XX  
**Branch:** poc-1-rspack

---

## Executive Summary

This document provides comprehensive research findings for migrating from Vite 6.x to Rspack in the POC-1 microfrontend architecture. The primary goal is to enable Hot Module Replacement (HMR) with Module Federation v2, which is currently unavailable in the Vite + Module Federation v2 setup (requires preview mode).

**Primary Goal:** Enable HMR with Module Federation v2  
**Secondary Goal:** Improve build performance  
**Current Limitation:** HMR not available (requires build → preview → refresh workflow)

---

## Research Summary

### Key Findings

✅ **HMR Support:** Rspack has native HMR support with Module Federation v2  
✅ **Nx Integration:** Official `@nx/rspack` plugin available (since Nx 20, Oct 2024)  
✅ **Module Federation v2:** Full support with enhanced features (v0.5.0+)  
✅ **React 19 Compatible:** Full support via builtin:swc-loader  
✅ **TypeScript 5.9 Compatible:** Supported via builtin:swc-loader  
✅ **Tailwind CSS v4:** Compatible via PostCSS integration  
⚠️ **Testing Framework:** Vitest not compatible; Jest chosen as replacement

---

## 1. Rspack Overview

### What is Rspack?

Rspack is a high-performance JavaScript bundler built with Rust, designed as a drop-in replacement for Webpack. It provides:

- **Rust-based architecture** - Significantly faster builds
- **Webpack-compatible API** - Easier migration path
- **Module Federation v2 support** - Native support with HMR
- **Modern tooling** - Built for modern JavaScript/TypeScript

### Performance Characteristics

**Build Speed:**

- Rspack: ~2.6s (no cache) / ~1.7s (with cache) for React app
- Vite: ~9.1s (consistent, no cache benefit)
- **~3-5x faster builds** with Rspack

**HMR Performance:**

- Rspack: ~82ms root updates, ~85ms leaf updates (1,000 components)
- Vite: ~114ms root updates, ~123ms leaf updates (1,000 components)
- **~20-30% faster HMR** with Rspack

---

## 2. Module Federation v2 Support

### Current State (Vite)

**Limitation:**

- Module Federation v2 requires preview mode (not dev mode)
- HMR not available in preview mode
- Development workflow: Build → Preview → Manual Refresh

**Configuration:**

- Using `@module-federation/vite` plugin
- Works correctly in preview mode
- No dev mode support

### Rspack Support

**Capabilities:**

- ✅ Native Module Federation v2 support (since v0.5.0)
- ✅ HMR works with Module Federation
- ✅ Dev mode fully supported
- ✅ Enhanced features: TypeScript type hints, Chrome DevTools integration, runtime plugins, preloading

**Key Requirement:**

- Must set `output.uniqueName` in Rspack config for proper HMR with Module Federation

**Resources:**

- [Rspack Module Federation Guide](https://rspack.dev/guide/features/module-federation)
- [Mastering Micro-Frontends With Rspack](https://www.youtube.com/watch?v=32_EikGKESk)

---

## 3. Nx Integration

### Availability

**Status:** ✅ Officially Supported

**Timeline:**

- **Nx 20 (Oct 2024):** Introduced `@nx/rspack` plugin
- **May 2025:** Angular support added (`@nx/angular-rspack`)

### Capabilities

**Plugin Features:**

- Executors for building/serving
- Generators for creating Rspack apps
- Module Federation support (`NxModuleFederationPlugin`)
- Consistent DX within Nx workspaces

**Usage:**

```bash
# Create new Rspack workspace
npx create-nx-workspace myrspackapp --preset=@nx/rspack

# Add Rspack to existing workspace
npm install --save-dev @nx/rspack
npx nx g @nx/rspack:app myrspackapp
```

### Compatibility

- ✅ Works with existing Nx workspace
- ✅ Build caching supported
- ✅ Task execution parallelization
- ✅ Dependency graph visualization
- ✅ Affected projects detection

**Resources:**

- [Nx Rspack Plugin](https://nx.dev/packages/rspack)
- [Nx 20 Announcement](https://nx.dev/blog/announcing-nx-20)

---

## 4. Tailwind CSS v4 Compatibility

### Current Setup (Vite)

**Configuration:**

- Using `@tailwindcss/postcss` plugin
- PostCSS configured in `vite.config.mts`
- Absolute content paths for monorepo
- `@config` directive in CSS files

### Rspack Compatibility

**Status:** ✅ Fully Compatible

**Setup Requirements:**

1. Install dependencies:

   ```bash
   npm install tailwindcss postcss postcss-loader @tailwindcss/postcss -D
   ```

2. Configure Rspack to use PostCSS:
   ```javascript
   module.exports = {
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
     },
   };
   ```

**Migration Notes:**

- PostCSS configuration similar to Vite
- Same `@tailwindcss/postcss` plugin can be used
- Content paths configuration should work similarly
- No breaking changes expected for Tailwind v4

**Resources:**

- [Tailwind CSS with Rspack](https://tailwindcss.com/docs/installation/framework-guides/rspack/react)

---

## 5. React & TypeScript Compatibility

### React 19 Support

**Status:** ✅ Fully Supported

**Configuration:**

- Use `builtin:swc-loader` for JSX/TSX processing
- React 19 features fully supported
- Fast transpilation via SWC

### TypeScript 5.9 Support

**Status:** ✅ Fully Supported

**Configuration:**

- `builtin:swc-loader` handles transpilation
- No type checking in loader (transpilation only)
- Recommended: Use `tsc` separately for type checking
- Enable `isolatedModules` in `tsconfig.json`

**Enhanced Type Checking:**

- Optional: `ts-checker-rspack-plugin` for build-time type checking
- Runs TypeScript type checker in separate process
- Better build performance than inline checking

**Migration Notes:**

- TypeScript config should work as-is
- May need to enable `isolatedModules` option
- Type checking workflow unchanged (separate `tsc` command)

**Resources:**

- [Rspack React Guide](https://rspack.dev/guide/tech/react)
- [Rspack TypeScript Guide](https://rspack.dev/guide/tech/typescript)
- [ts-checker-rspack-plugin](https://github.com/rspack-contrib/ts-checker-rspack-plugin)

---

## 6. Testing Framework Compatibility

### Current Setup (Vitest)

**Configuration:**

- Vitest 4.0.0 (Vite-native testing)
- React Testing Library 16.3.0
- jsdom environment
- Coverage with v8 provider

### Rspack Compatibility

**Status:** ⚠️ Vitest Not Compatible

**Problem:**

- Vitest is Vite-native and won't work with Rspack
- Need alternative testing framework

### Alternatives

#### Option 1: Rstest (Recommended for Rspack)

**Status:** ✅ Purpose-built for Rspack ecosystem

**Features:**

- Jest-compatible API (easy migration)
- Native TypeScript support
- ESM support
- Part of Rstack suite (Rsbuild, Rslib, Rslint)

**Pros:**

- Optimized for Rspack
- Familiar Jest API
- Modern tooling

**Cons:**

- Newer project (less community support)
- Migration required from Vitest

**Resources:**

- [Rstest Documentation](https://rstest.rs/)

#### Option 2: Jest (Traditional Alternative)

**Status:** ✅ Fully Compatible

**Features:**

- Mature, widely adopted
- Large ecosystem
- Well-documented

**Pros:**

- Proven track record
- Extensive community support
- Many plugins available

**Cons:**

- Slower than Vitest/Rstest
- More configuration required
- Older API patterns

#### Option 3: Keep Vitest for Unit Tests Only

**Status:** ⚠️ Possible but not recommended

**Approach:**

- Run Vitest separately (not integrated with build)
- Use for unit tests only
- Rspack for builds, Vitest for tests

**Pros:**

- No migration needed for tests
- Keep existing test setup

**Cons:**

- Two separate tools (confusion)
- Vitest still uses Vite internally (inconsistent)
- Not recommended architecture

### Recommendation

**Decision: Jest**

Jest has been chosen for this migration due to:

- Mature ecosystem with proven track record
- Extensive community support and documentation
- Lower risk for a critical migration
- Large plugin ecosystem
- Well-documented migration paths from Vitest

**Migration Impact:**

- Test configuration changes required
- API differences between Vitest and Rstest/Jest
- Coverage setup may need changes
- Test scripts in package.json need updates

---

## 7. Build Performance Comparison

### Benchmark Results

**Test Scenario:** React application with UI components

#### Production Build Time

| Bundler | No Cache | With Cache | Improvement |
| ------- | -------- | ---------- | ----------- |
| Rspack  | ~2.6s    | ~1.7s      | Baseline    |
| Vite    | ~9.1s    | ~9.1s      | 3.5x slower |

**Rspack Advantage:** ~3-5x faster production builds

#### HMR Performance

**Test Scenario:** React application with 1,000 components

| Update Type | Rspack | Vite   | Improvement |
| ----------- | ------ | ------ | ----------- |
| Root HMR    | ~82ms  | ~114ms | 28% faster  |
| Leaf HMR    | ~85ms  | ~123ms | 31% faster  |

**Rspack Advantage:** ~20-30% faster HMR updates

### Development Experience

**Current (Vite + Preview Mode):**

- ❌ No HMR (requires rebuild + refresh)
- ❌ Slower iteration cycle
- ✅ Fast preview server

**Target (Rspack + Dev Mode):**

- ✅ HMR with Module Federation
- ✅ Instant updates during development
- ✅ Faster iteration cycle
- ✅ Better developer experience

---

## 8. Migration Effort Estimation

### Complexity Assessment

**Overall Complexity:** Medium-High

**Factors:**

1. ✅ Nx integration available (official plugin)
2. ✅ Module Federation v2 supported (with HMR)
3. ✅ Most tech stack compatible (React, TypeScript, Tailwind)
4. ⚠️ Testing framework migration required
5. ⚠️ Configuration changes needed (all apps/libraries)
6. ⚠️ Plugin ecosystem differences (Vite → Rspack)
7. ⚠️ Build scripts need updates

### Estimated Timeline

**Phase 1: Setup & Configuration** (2-3 days)

- Install Rspack and Nx plugin
- Configure Rspack for all apps (shell, auth-mfe, payments-mfe)
- Configure Rspack for libraries
- Update build scripts

**Phase 2: Module Federation Setup** (2-3 days)

- Configure Module Federation v2 with Rspack
- Test remote loading
- Verify HMR with Module Federation
- Fix any asset path issues

**Phase 3: Testing Framework Migration** (3-4 days)

- Choose testing framework (Rstest or Jest)
- Migrate test configurations
- Update test utilities
- Run and fix tests

**Phase 4: Verification & Testing** (2-3 days)

- Verify all features work
- Test HMR in development
- Performance comparison
- Documentation updates

**Total Estimate:** 9-13 days (~2-3 weeks)

---

## 9. Risks & Concerns

### Technical Risks

#### 1. Testing Framework Migration

**Risk:** Medium  
**Impact:** All tests need migration/updates  
**Mitigation:** Jest chosen (proven), allocate extra time, document API changes (`vi.*` → `jest.*`)

#### 2. Plugin Compatibility

**Risk:** Low-Medium  
**Impact:** Some Vite plugins may not work with Rspack  
**Mitigation:** Review plugin usage, find Rspack alternatives

#### 3. Module Federation Configuration

**Risk:** Low  
**Impact:** Configuration differences may cause issues  
**Mitigation:** Follow Rspack Module Federation documentation closely

#### 4. Build Cache Compatibility

**Risk:** Low  
**Impact:** Nx build cache may need invalidation  
**Mitigation:** Clear cache, rebuild from scratch after migration

### Operational Risks

#### 1. Developer Learning Curve

**Risk:** Low  
**Impact:** Team needs to learn Rspack configuration  
**Mitigation:** Rspack uses Webpack-compatible API (familiar)

#### 2. CI/CD Pipeline Updates

**Risk:** Low  
**Impact:** Build scripts need updates  
**Mitigation:** Update pipeline scripts as part of migration

#### 3. Third-Party Tool Compatibility

**Risk:** Low  
**Impact:** Tools expecting Vite may not work  
**Mitigation:** Review tooling, update or replace as needed

---

## 10. Recommendations

### Go/No-Go Decision

**Recommendation:** ✅ **GO** - Proceed with Migration

**Rationale:**

1. ✅ Primary goal achievable (HMR with Module Federation)
2. ✅ Official Nx integration available
3. ✅ Most tech stack compatible
4. ✅ Performance benefits (faster builds, faster HMR)
5. ⚠️ Testing migration required (manageable)
6. ⚠️ Medium effort (2-3 weeks) but high value

### Migration Strategy

**Approach:** Phased Migration

1. **Phase 1:** Setup and configure Rspack (all apps/libraries)
2. **Phase 2:** Module Federation v2 setup with HMR verification
3. **Phase 3:** Testing framework migration
4. **Phase 4:** Full verification and documentation

**Rollback Plan:**

- Keep Vite configuration files as backup
- Use feature branch for migration
- Can revert to Vite if issues arise
- Gradual migration (migrate one app at a time if needed)

### Success Criteria

**Must Have:**

- ✅ HMR works with Module Federation v2 in dev mode
- ✅ All apps (shell, auth-mfe, payments-mfe) build successfully
- ✅ All tests pass (after migration)
- ✅ Module Federation remotes load correctly

**Nice to Have:**

- ✅ Faster build times (verified benchmarks)
- ✅ Faster HMR times (verified benchmarks)
- ✅ Better developer experience

---

## 11. Resources & References

### Official Documentation

- [Rspack Documentation](https://rspack.dev/)
- [Rspack Module Federation](https://rspack.dev/guide/features/module-federation)
- [Rspack Dev Server](https://rspack.dev/guide/features/dev-server)
- [Nx Rspack Plugin](https://nx.dev/packages/rspack)
- [Tailwind CSS with Rspack](https://tailwindcss.com/docs/installation/framework-guides/rspack/react)

### Community Resources

- [Mastering Micro-Frontends With Rspack](https://www.youtube.com/watch?v=32_EikGKESk) - Video tutorial
- [Rstest Documentation](https://rstest.rs/) - Testing framework
- [Rspack Performance Benchmarks](https://github.com/rspack-contrib/build-tools-performance)

### Migration Guides

- [Webpack to Rspack Migration](https://rspack.dev/guide/migrate-from-webpack) - Similar concepts apply
- [Vite to Rspack Migration](https://rspack.dev/guide/migrate-from-vite) - If available

---

## Conclusion

Rspack offers significant benefits for the microfrontend architecture:

- ✅ **Primary Goal Achievable:** HMR with Module Federation v2
- ✅ **Performance Benefits:** Faster builds and HMR
- ✅ **Official Support:** Nx integration available
- ✅ **Compatibility:** Most tech stack works with Rspack
- ⚠️ **Migration Required:** Testing framework and configuration changes needed

**Next Steps:**

1. ✅ Review this research with team
2. ✅ Testing framework decision: Jest
3. ✅ Implementation plan created
4. Begin migration in feature branch

---

**Last Updated:** 2026-01-XX  
**Status:** Research Complete  
**Next Document:** [Tech Stack Impact Analysis](./rspack-tech-stack-impact.md)
