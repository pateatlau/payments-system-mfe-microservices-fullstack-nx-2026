# Tailwind CSS v4 Setup Guide for Nx Monorepo

> **Document Purpose:** Document the issues encountered and solutions implemented for Tailwind CSS v4 in the POC-1 MFE monorepo architecture.

---

## Overview

This document describes the challenges faced when integrating Tailwind CSS v4 with:
- Nx monorepo structure
- Vite 7.x build tool
- Module Federation v2
- Shared libraries across workspace

---

## Problem Statement

### Initial Symptoms
1. Header component styles not being applied
2. Only base Tailwind reset styles were loading
3. Utility classes like `bg-slate-900`, `text-white`, `px-4` were not generated
4. Classes from shared libraries (`libs/shared-header-ui/`) were not detected

### Root Cause Analysis

**Issue 1: Tailwind v4 Plugin Architecture Change**
- Tailwind CSS v4 moved the PostCSS plugin to a separate package (`@tailwindcss/postcss`)
- The main `tailwindcss` package can no longer be used directly as a PostCSS plugin
- Error: "It looks like you're trying to use `tailwindcss` directly as a PostCSS plugin"

**Issue 2: Vite Plugin Content Detection Limitation**
- `@tailwindcss/vite` plugin auto-detects content only within the Vite root directory
- In Nx monorepo, shared libraries are **outside** the app's directory
- The Vite plugin couldn't scan `libs/shared-header-ui/` from `apps/shell/`

**Issue 3: Content Path Configuration**
- Tailwind v4 changed how content paths are configured
- Traditional `tailwind.config.js` wasn't being picked up automatically
- Relative paths in config files didn't resolve correctly in monorepo structure

---

## Solution Implemented

### Step 1: Install Required Packages

```bash
pnpm add -D -w @tailwindcss/postcss @tailwindcss/vite autoprefixer
```

**Packages Used:**
- `tailwindcss@4.1.17` - Core Tailwind CSS v4
- `@tailwindcss/postcss@4.1.17` - PostCSS plugin for Tailwind v4
- `autoprefixer@10.x` - Vendor prefix automation

### Step 2: Create Tailwind Configuration File

**File:** `apps/shell/tailwind.config.js`

```javascript
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    // Shell app files
    resolve(__dirname, 'src/**/*.{js,jsx,ts,tsx,html}'),
    resolve(__dirname, 'index.html'),
    // All shared libraries
    resolve(__dirname, '../../libs/shared-header-ui/src/**/*.{js,jsx,ts,tsx}'),
    resolve(__dirname, '../../libs/shared-ui/src/**/*.{js,jsx,ts,tsx}'),
    resolve(__dirname, '../../libs/shared-auth-store/src/**/*.{js,jsx,ts,tsx}'),
    resolve(__dirname, '../../libs/shared-utils/src/**/*.{js,jsx,ts,tsx}'),
    resolve(__dirname, '../../libs/shared-types/src/**/*.{js,jsx,ts,tsx}'),
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

**Key Points:**
- Use `resolve()` with `__dirname` to create **absolute paths**
- Include ALL directories containing Tailwind classes
- Use ESM syntax (`import`/`export`) for compatibility with Vite

### Step 3: Configure CSS with @config Directive

**File:** `apps/shell/src/styles.css`

```css
@import "tailwindcss";
@config "../tailwind.config.js";

/* You can add global styles to this file, and also import other style files */
```

**Key Points:**
- `@import "tailwindcss"` - Tailwind v4 simplified import (replaces `@tailwind base/components/utilities`)
- `@config "../tailwind.config.js"` - **Critical:** Points Tailwind to the config file with content paths

### Step 4: Configure Vite with PostCSS

**File:** `apps/shell/vite.config.mts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';
// ... other imports

export default defineConfig(() => ({
  // ... other config
  css: {
    postcss: {
      plugins: [
        tailwindcss(),
        autoprefixer(),
      ],
    },
  },
  plugins: [
    react(),
    // ... other plugins
  ],
}));
```

**Key Points:**
- Use `@tailwindcss/postcss` instead of `@tailwindcss/vite` for monorepo setups
- Configure PostCSS inline in Vite config (no separate `postcss.config.js` needed)
- The `@config` directive in CSS handles content path configuration

---

## Why This Solution Works

### Pattern: CSS-Based Configuration with PostCSS Plugin

1. **`@tailwindcss/postcss`** processes CSS files and respects the `@config` directive
2. **`@config` directive** in CSS points to the config file with absolute content paths
3. **Absolute paths** using `resolve(__dirname, '...')` ensure files are found regardless of working directory
4. **PostCSS inline config** in Vite avoids issues with separate config file resolution

### Comparison of Approaches

| Approach | Works in Monorepo? | Notes |
|----------|-------------------|-------|
| `@tailwindcss/vite` plugin | ❌ No | Only scans Vite root directory |
| `@tailwindcss/postcss` with inline content | ❌ No | Content option not properly supported |
| `@tailwindcss/postcss` + `@config` directive | ✅ Yes | Config file with absolute paths works |
| Separate `postcss.config.js` | ❌ No | Path resolution issues in Nx |

---

## Common Pitfalls to Avoid

### 1. Using Relative Paths in Config
```javascript
// ❌ BAD - Relative paths may not resolve correctly
content: [
  './src/**/*.tsx',
  '../../libs/shared-header-ui/src/**/*.tsx',
]

// ✅ GOOD - Absolute paths always work
content: [
  resolve(__dirname, 'src/**/*.{js,jsx,ts,tsx}'),
  resolve(__dirname, '../../libs/shared-header-ui/src/**/*.{js,jsx,ts,tsx}'),
]
```

### 2. Using @tailwindcss/vite for Monorepos
```typescript
// ❌ BAD - Vite plugin doesn't scan external directories
import tailwindcss from '@tailwindcss/vite';
plugins: [tailwindcss()]

// ✅ GOOD - PostCSS plugin with @config directive
import tailwindcss from '@tailwindcss/postcss';
css: { postcss: { plugins: [tailwindcss()] } }
```

### 3. Forgetting @config Directive
```css
/* ❌ BAD - Config file not loaded */
@import "tailwindcss";

/* ✅ GOOD - Config file loaded with content paths */
@import "tailwindcss";
@config "../tailwind.config.js";
```

### 4. Testing Classes in Browser DevTools
- Classes added via browser DevTools won't have CSS generated
- Tailwind only generates CSS for classes found in source files
- Always test by adding classes to actual source code

---

## Troubleshooting

### Styles Not Applied
1. Check if the file with Tailwind classes is in the `content` array
2. Verify absolute paths are correct: `console.log(resolve(__dirname, 'src/**/*.tsx'))`
3. Clear Vite cache: `rm -rf apps/shell/node_modules/.vite`
4. Restart dev server

### 500 Error on styles.css
- Ensure `@tailwindcss/postcss` is installed (not using `tailwindcss` directly)
- Check for syntax errors in `tailwind.config.js`

### Classes from Shared Library Not Working
- Add the library path to `content` array in `tailwind.config.js`
- Use absolute path with `resolve(__dirname, '../../libs/library-name/src/**/*.tsx')`

### Vite Cache Issues
```bash
# Clear all caches
rm -rf apps/shell/node_modules/.vite
rm -rf node_modules/.vite
pnpm nx reset
```

---

## Files Modified

| File | Purpose |
|------|---------|
| `apps/shell/tailwind.config.js` | Tailwind config with absolute content paths |
| `apps/shell/src/styles.css` | CSS entry with `@import` and `@config` directives |
| `apps/shell/vite.config.mts` | Vite config with PostCSS plugins |
| `package.json` | Added `@tailwindcss/postcss`, `@tailwindcss/vite`, `autoprefixer` |

---

## Adding New Apps/Libraries

When creating new MFE apps or shared libraries that use Tailwind:

### For New Apps (e.g., auth-mfe, payments-mfe)

1. Create `tailwind.config.js` with content paths
2. Create `styles.css` with `@import "tailwindcss"` and `@config` directive
3. Configure PostCSS in `vite.config.mts`
4. Import styles in `main.tsx`

### For New Shared Libraries

1. Add the library path to the consuming app's `tailwind.config.js`:
   ```javascript
   content: [
     // ... existing paths
     resolve(__dirname, '../../libs/new-library/src/**/*.{js,jsx,ts,tsx}'),
   ]
   ```

2. No separate Tailwind config needed in the library itself

---

## References

- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [Tailwind CSS v4 with Vite](https://tailwindcss.com/docs/installation/using-vite)
- [Tailwind CSS v4 with PostCSS](https://tailwindcss.com/docs/installation/using-postcss)

---

**Last Updated:** 2026-12-06  
**Status:** Resolved - Working Configuration  
**Applies To:** POC-1 Phase

