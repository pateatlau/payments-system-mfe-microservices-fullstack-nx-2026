# Vite to Rspack Configuration Differences

**Date:** 2026-01-XX  
**Purpose:** Document key differences between Vite and Rspack configurations

---

## Overview

This document outlines the major differences when migrating from Vite to Rspack configurations. Understanding these differences is crucial for a successful migration.

---

## 1. Configuration File Format

### Vite

- **Format:** TypeScript/ES Modules (`.mts` files)
- **Syntax:** `export default defineConfig({ ... })`
- **Example:**
  ```typescript
  import { defineConfig } from 'vite';
  export default defineConfig({ ... });
  ```

### Rspack

- **Format:** CommonJS (`.js` files)
- **Syntax:** `module.exports = { ... }`
- **Example:**
  ```javascript
  const rspack = require('@rspack/core');
  module.exports = { ... };
  ```

**Migration Note:** Rspack configs use JavaScript, not TypeScript. Type checking can be done separately if needed.

---

## 2. React/TypeScript Processing

### Vite

- **Plugin:** `@vitejs/plugin-react`
- **Configuration:**
  ```typescript
  import react from '@vitejs/plugin-react';
  plugins: [react()];
  ```
- **Features:** Automatic JSX transform, Fast Refresh

### Rspack

- **Loader:** `builtin:swc-loader` (built-in, no plugin needed)
- **Configuration:**
  ```javascript
  module: {
    rules: [{
      test: /\.(tsx|ts|jsx|js)$/,
      use: {
        loader: 'builtin:swc-loader',
        options: {
          jsc: {
            parser: { syntax: 'typescript', tsx: true },
            transform: {
              react: {
                runtime: 'automatic',
                refresh: true, // Fast Refresh
              },
            },
          },
        },
      },
    }],
  }
  ```

**Key Differences:**

- Rspack uses loader-based approach (like Webpack) vs Vite's plugin system
- `builtin:swc-loader` is built-in (no separate package needed)
- React Fast Refresh is enabled via `refresh: true` option

---

## 3. CSS Processing

### Vite

- **Configuration:** Built-in CSS processing with PostCSS plugins
- **Example:**
  ```typescript
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
  }
  ```

### Rspack

- **Loader:** `postcss-loader` (must be installed)
- **Configuration:**
  ```javascript
  module: {
    rules: [{
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
    }],
  }
  ```

**Key Differences:**

- Rspack requires explicit PostCSS loader configuration
- Must specify `type: 'css'` for CSS modules support
- PostCSS plugins are configured in loader options

---

## 4. Module Federation

### Vite

- **Plugin:** `@module-federation/vite`
- **Configuration:**
  ```typescript
  import { federation } from '@module-federation/vite';
  federation({
    name: 'shell',
    remotes: {
      authMfe: {
        type: 'module',
        name: 'authMfe',
        entry: 'http://localhost:4201/remoteEntry.js',
      },
    },
    shared: { react: { singleton: true } },
  });
  ```

### Rspack

- **Plugin:** `rspack.container.ModuleFederationPlugin` (built-in)
- **Configuration:**
  ```javascript
  const { ModuleFederationPlugin } = rspack.container;
  new ModuleFederationPlugin({
    name: 'shell',
    remotes: {
      authMfe: 'authMfe@http://localhost:4201/remoteEntry.js',
    },
    shared: { react: { singleton: true } },
  });
  ```

**Key Differences:**

- Rspack uses Webpack-compatible Module Federation API
- Remotes use string format: `'name@url'` instead of object format
- Plugin is built-in (no separate package needed)
- **CRITICAL:** Must set `output.uniqueName` for HMR to work

---

## 5. Nx Integration

### Vite

- **Plugin:** `@nx/vite/plugins/nx-tsconfig-paths.plugin`
- **Configuration:**
  ```typescript
  import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
  plugins: [nxViteTsPaths()];
  ```

### Rspack

- **Plugin:** `@nx/rspack/plugins` - `NxAppRspackPlugin`
- **Configuration:**
  ```javascript
  const { NxAppRspackPlugin } = require('@nx/rspack/plugins');
  plugins: [new NxAppRspackPlugin()];
  ```

**Key Differences:**

- Different plugin package (`@nx/rspack` vs `@nx/vite`)
- Plugin is instantiated with `new` (class-based)
- Path resolution and other Nx features are handled automatically

---

## 6. Dev Server Configuration

### Vite

- **Configuration:**
  ```typescript
  server: {
    port: 4200,
    host: 'localhost',
  }
  ```

### Rspack

- **Configuration:**
  ```javascript
  devServer: {
    port: 4200,
    host: 'localhost',
    hot: true, // Enable HMR
    headers: {
      'Access-Control-Allow-Origin': '*', // For Module Federation
    },
  }
  ```

**Key Differences:**

- Rspack requires explicit `hot: true` for HMR
- CORS headers may be needed for Module Federation
- Similar API overall (Webpack-compatible)

---

## 7. Build Output Configuration

### Vite

- **Configuration:**
  ```typescript
  build: {
    outDir: '../../dist/apps/shell',
    target: 'esnext',
    minify: false,
  }
  ```

### Rspack

- **Configuration:**
  ```javascript
  output: {
    path: path.resolve(__dirname, '../../dist/apps/shell'),
    filename: '[name].[contenthash].js',
    uniqueName: 'shell', // Required for Module Federation HMR
  },
  optimization: {
    minimize: false, // or true for production
  }
  ```

**Key Differences:**

- Output path uses `path.resolve()` instead of relative string
- Filename patterns use Webpack-style placeholders
- `uniqueName` is required for Module Federation HMR
- Minification is in `optimization` section

---

## 8. Testing Configuration

### Vite

- **Framework:** Vitest (configured in `vite.config.mts`)
- **Configuration:**
  ```typescript
  test: {
    name: 'shell',
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
  }
  ```

### Rspack

- **Framework:** Jest (separate configuration)
- **Configuration:** `jest.config.js` (separate file)
- **Note:** Testing configuration is completely separate from bundler config

**Key Differences:**

- No test configuration in Rspack config
- Jest uses separate `jest.config.js` file
- This is handled in Phase 5 (Testing Framework Migration)

---

## 9. Environment Variables

### Vite

- **Access:** `import.meta.env.VITE_*`
- **Example:** `import.meta.env.VITE_API_URL`

### Rspack

- **Access:** `process.env.*`
- **Example:** `process.env.API_URL`
- **Plugin:** `rspack.DefinePlugin` for build-time replacement

**Key Differences:**

- Rspack uses Node.js `process.env`
- Must use `DefinePlugin` to replace variables at build time
- No `VITE_` prefix requirement

---

## 10. Path Aliases

### Vite

- **Configuration:** Handled by `nxViteTsPaths()` plugin
- **Usage:** Automatically resolves `@web-mfe/*` paths

### Rspack

- **Configuration:** Handled by `NxAppRspackPlugin` automatically
- **Manual:** Can also use `resolve.alias` if needed

**Key Differences:**

- Nx plugin handles path resolution automatically
- Similar behavior, different implementation

---

## Summary Table

| Feature           | Vite                      | Rspack                                    |
| ----------------- | ------------------------- | ----------------------------------------- |
| Config Format     | TypeScript (`.mts`)       | JavaScript (`.js`)                        |
| React Processing  | `@vitejs/plugin-react`    | `builtin:swc-loader`                      |
| CSS Processing    | Built-in PostCSS          | `postcss-loader`                          |
| Module Federation | `@module-federation/vite` | `rspack.container.ModuleFederationPlugin` |
| Nx Integration    | `@nx/vite/plugins`        | `@nx/rspack/plugins`                      |
| Dev Server        | `server` option           | `devServer` option                        |
| Build Output      | `build.outDir`            | `output.path`                             |
| Testing           | Vitest (in config)        | Jest (separate file)                      |
| Environment Vars  | `import.meta.env`         | `process.env` + `DefinePlugin`            |
| HMR               | Built-in                  | Requires `hot: true` + `uniqueName`       |

---

## Migration Checklist

When converting a Vite config to Rspack:

- [ ] Change file extension from `.mts` to `.js`
- [ ] Convert ES modules to CommonJS (`require`/`module.exports`)
- [ ] Replace `@vitejs/plugin-react` with `builtin:swc-loader` rule
- [ ] Replace CSS PostCSS config with `postcss-loader` rule
- [ ] Replace `@module-federation/vite` with `rspack.container.ModuleFederationPlugin`
- [ ] Replace `@nx/vite` plugins with `@nx/rspack` plugins
- [ ] Convert `server` config to `devServer` config
- [ ] Convert `build.outDir` to `output.path`
- [ ] Add `output.uniqueName` for Module Federation HMR
- [ ] Remove test configuration (moved to Jest)
- [ ] Update environment variable access patterns

---

**Last Updated:** 2026-01-XX
