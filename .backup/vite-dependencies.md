# Vite Dependencies Backup

**Date:** 2026-01-XX  
**Purpose:** Document current Vite-related dependencies before Rspack migration

## Vite Core Dependencies

- `vite`: `^6.4.1`
- `@nx/vite`: `^22.1.3`
- `@vitejs/plugin-react`: `^4.2.0`

## Module Federation (Vite)

- `@module-federation/vite`: `^1.9.2`
- `@module-federation/enhanced`: `0.21.6`

## Testing (Vitest)

- `vitest`: `^4.0.0`
- `@nx/vitest`: `22.1.3`
- `@vitest/ui`: `^4.0.0`
- `@vitest/coverage-v8`: `^4.0.0`

## Tailwind CSS (Vite Plugin)

- `@tailwindcss/vite`: `^4.1.17`

## Other Vite-Related

- `vite-plugin-dts`: `~4.5.0`

## Nx Configuration

- `nx.json` contains `@nx/vite/plugin` configuration
- `nx.json` contains `@nx/vitest` plugin configuration
- Generator defaults set to `bundler: "vite"` and `unitTestRunner: "vitest"`

## Files Backed Up

1. `apps/shell/vite.config.mts`
2. `apps/auth-mfe/vite.config.mts`
3. `apps/payments-mfe/vite.config.mts`
4. `libs/shared-utils/vite.config.mts`
5. `libs/shared-ui/vite.config.mts`
6. `libs/shared-types/vite.config.mts`
7. `libs/shared-auth-store/vite.config.mts`
8. `libs/shared-header-ui/vite.config.mts`
9. `package.json`
10. `nx.json`
