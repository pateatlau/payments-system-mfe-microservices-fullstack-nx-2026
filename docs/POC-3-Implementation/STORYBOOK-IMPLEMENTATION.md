# Storybook Implementation Plan - Design System Documentation

**Document Version:** 1.0  
**Date:** December 12, 2025  
**Status:** Planning Phase  
**Project:** MFE Payments System - Design System Documentation  
**Library:** `@mfe/shared-design-system`

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [NPM Package Analysis](#3-npm-package-analysis)
4. [Feasibility Assessment](#4-feasibility-assessment)
5. [Implementation Strategy](#5-implementation-strategy)
6. [Configuration Details](#6-configuration-details)
7. [Component Story Creation](#7-component-story-creation)
8. [Deployment Strategy](#8-deployment-strategy)
9. [Success Criteria](#9-success-criteria)
10. [Timeline & Phases](#10-timeline--phases)

---

## 1. Executive Summary

### Objective

Implement Storybook for the `@mfe/shared-design-system` library to provide:

- Interactive component documentation
- Component playground for testing variants and props
- Design system reference for developers and designers
- Visual regression testing capabilities
- Centralized design token documentation

### Key Decisions

- **Tool:** Storybook 8.x with Vite builder (via Nx)
- **Framework:** React 19 support
- **Styling:** Tailwind CSS 4.0 integration
- **Deployment:** Static site hosting (AWS S3 + CloudFront or GitHub Pages)
- **Library Distribution:** Keep local imports (Nx monorepo), no NPM packages needed

### Benefits

- Interactive component documentation
- Faster component development iteration
- Better collaboration between designers and developers
- Visual regression testing foundation
- Centralized design system reference
- Improved onboarding for new developers

---

## 2. Current State Analysis

### Design System Library

**Location:** `libs/shared-design-system`

**Current Setup:**

- Built on shadcn/ui component patterns
- Uses Tailwind CSS 4.0 for styling
- TypeScript-first with full type definitions
- Components are copy-paste style (not a dependency)
- Imported via path aliases: `@mfe/shared-design-system`

**Components Available:**

- Button, Input, Card, Dialog, Badge, Alert, Loading, etc.
- Design tokens (colors, spacing, typography)
- Utility functions (cn, etc.)

**Current Import Pattern:**

```typescript
import { Button, Input, Card } from '@mfe/shared-design-system';
```

### Module Federation Integration

The design system is configured as a shared dependency in Module Federation:

```javascript
'@mfe/shared-design-system': {
  singleton: true,
  requiredVersion: false,
  eager: false,
}
```

This ensures the design system is shared at runtime across all MFEs.

### Build Configuration

- **Build Tool:** Rspack (via Nx)
- **CSS:** Tailwind CSS 4.0 with PostCSS
- **TypeScript:** Strict mode enabled
- **Testing:** Jest with React Testing Library

---

## 3. NPM Package Analysis

### Question: Should We Publish Design System as NPM Package?

**Current Approach:** Local imports via path aliases in Nx monorepo

**Analysis:**

#### **Keep Local Imports (Recommended)**

**Reasons:**

1. **Monorepo Optimization:**
   - Nx is optimized for local imports with path aliases
   - Faster builds (no publish/install cycle)
   - Better caching and affected builds
   - Simpler dependency graph resolution

2. **Development Velocity:**
   - Instant feedback when design system changes
   - No publish → install → build cycles
   - Easier debugging (direct source access)
   - Better TypeScript tooling support

3. **Module Federation Alignment:**
   - Design system is already shared via Module Federation
   - Runtime sharing works with local imports
   - Singleton pattern ensures consistency
   - No version conflicts to manage

4. **Current Deployment Model:**
   - All MFEs share the same CI/CD pipeline
   - Deployed together (or at least versioned together)
   - No need for version pinning between packages
   - Simpler deployment process

5. **Build Performance:**
   - Nx can optimize builds using affected graph
   - Shared libraries rebuilt only when changed
   - Better incremental build support
   - Faster CI/CD pipeline

#### **NPM Packages Would Add:**

1. **Complexity:**
   - Publish step in CI/CD
   - Version management (semantic versioning)
   - Dependency update process
   - Potential version conflicts

2. **Development Friction:**
   - Publish → install → rebuild cycle
   - Cannot use latest code instantly
   - More steps to test changes
   - Slower iteration

3. **Lost Optimizations:**
   - Nx affected builds don't work as well
   - Build caching less effective
   - Dependency graph analysis harder
   - TypeScript path mapping complexity

#### **When NPM Packages Would Make Sense:**

Consider NPM packages if:

- **Multi-repo architecture:** If splitting monorepo into separate repos
- **External consumers:** Need to share design system with external projects
- **Independent teams:** Different teams own design system vs MFEs
- **Different release cadences:** Design system updates independently from MFEs
- **Strict versioning required:** Need explicit version control between packages

#### **Recommendation: Hybrid Approach (Optional)**

If you need NPM packages in the future:

1. **Keep local imports for monorepo development** (primary workflow)
2. **Optionally publish to NPM** (for external consumers or documentation)
3. **Use semantic versioning** for published packages
4. **Continue Module Federation** for runtime sharing

**Conclusion:** For the current Nx monorepo setup, **keep local imports**. NPM packages add overhead without clear benefits unless you need external distribution or plan to split repos.

---

## 4. Feasibility Assessment

### **Highly Feasible**

Storybook integration is **highly feasible** with your current stack:

#### Supported Technologies

1. **React 19:**
   - Storybook 8.x supports React 19
   - Latest Storybook React renderer compatible

2. **Tailwind CSS 4.0:**
   - Storybook supports Tailwind CSS via PostCSS
   - Tailwind 4.0 CSS-first approach works with Storybook
   - May need custom PostCSS configuration

3. **shadcn/ui Components:**
   - Works perfectly in Storybook (standard React components)
   - Copy-paste approach means no special handling needed
   - TypeScript types fully supported

4. **Nx Monorepo:**
   - Nx has built-in Storybook support (`@nx/storybook`)
   - Can generate Storybook config for libraries
   - Integrates with Nx build system

5. **TypeScript:**
   - Full TypeScript support in Storybook
   - Type definitions automatically included
   - Props documentation from TypeScript types

#### Potential Considerations

1. **Build Tool Compatibility:**
   - Your apps use **Rspack**, but Storybook typically uses **Webpack**
   - **Solution:** Use **Vite builder** for Storybook (Nx supports this)
   - Vite works well with Tailwind CSS 4.0 and React 19

2. **Tailwind CSS 4.0 Configuration:**
   - Tailwind 4.0 uses CSS-first approach (newer)
   - May need custom PostCSS setup in Storybook
   - **Solution:** Configure Storybook's PostCSS to match your Tailwind setup

3. **Module Federation:**
   - Storybook doesn't need Module Federation (standalone)
   - Components are imported directly
   - **No conflict** - Storybook is separate from MFE runtime

### Feasibility Score: **9/10**

Only minor configuration adjustments needed for Tailwind CSS 4.0 and Vite builder.

---

## 5. Implementation Strategy

### Phase 1: Storybook Setup

**Objective:** Install and configure Storybook in the Nx monorepo

**Steps:**

1. **Install Storybook:**

   ```bash
   nx g @nx/react:storybook-configuration shared-design-system
   ```

2. **Configure for Vite:**
   - Update `.storybook/main.ts` to use Vite builder
   - Configure Vite options for React 19

3. **Configure Tailwind CSS 4.0:**
   - Set up PostCSS in Storybook
   - Import Tailwind CSS styles
   - Configure content paths for component scanning
   - Match your existing Tailwind configuration

4. **Configure TypeScript:**
   - Ensure Storybook uses project TypeScript config
   - Verify path aliases work in Storybook

5. **Test Setup:**
   - Run `nx storybook shared-design-system`
   - Verify Storybook loads correctly
   - Check Tailwind CSS styles render

**Files to Create/Modify:**

- `.storybook/main.ts` - Storybook configuration
- `.storybook/preview.ts` - Global decorators and parameters
- `.storybook/preview.css` - Global styles (import Tailwind)
- `libs/shared-design-system/.storybook/` - Library-specific config (if needed)

### Phase 2: Component Stories

**Objective:** Create stories for all design system components

**Approach:**

1. **Story Structure:**
   - One story file per component
   - Location: `libs/shared-design-system/src/components/{ComponentName}.stories.tsx`
   - Use CSF 3.0 format (Component Story Format)

2. **Story Coverage:**
   - **Default story** - Basic usage
   - **Variants** - All component variants (default, destructive, outline, etc.)
   - **Sizes** - All size options (sm, md, lg, etc.)
   - **States** - Disabled, loading, error states
   - **Interactive** - User interactions (clicks, hovers, etc.)

3. **Documentation:**
   - Use JSDoc comments for component descriptions
   - Document all props with types
   - Include usage examples
   - Add accessibility notes

**Component Priority:**

1. **High Priority (Phase 2A):**
   - Button
   - Input
   - Card
   - Badge
   - Alert

2. **Medium Priority (Phase 2B):**
   - Dialog
   - Select
   - Checkbox
   - Radio
   - Switch

3. **Lower Priority (Phase 2C):**
   - All other components
   - Design tokens documentation
   - Utility functions

### Phase 3: Advanced Features

**Objective:** Add advanced Storybook features

**Features:**

1. **Controls:**
   - Interactive props editing
   - Real-time component updates
   - All props configurable

2. **Actions:**
   - Log user interactions
   - Track events (clicks, form submissions, etc.)

3. **Accessibility:**
   - Install `@storybook/addon-a11y`
   - Add accessibility checks to stories
   - Document accessibility features

4. **Design Tokens:**
   - Create stories for color palette
   - Typography examples
   - Spacing scale documentation
   - Shadow tokens

5. **Addons:**
   - `@storybook/addon-essentials` (already included)
   - `@storybook/addon-a11y` (accessibility)
   - `@storybook/addon-viewport` (responsive testing)
   - `@storybook/addon-docs` (documentation)

### Phase 4: Documentation

**Objective:** Comprehensive documentation

**Documentation:**

1. **Component Documentation:**
   - Usage guidelines
   - Props documentation (auto-generated from TypeScript)
   - Code examples
   - Best practices

2. **Design System Guide:**
   - Design principles
   - Color system
   - Typography
   - Spacing system
   - Component composition patterns

3. **Migration Guide:**
   - How to use components
   - Replacing inline components
   - Customization guidelines

### Phase 5: CI/CD Integration

**Objective:** Automate Storybook build and deployment

**Steps:**

1. **Build Script:**
   - Add `storybook:build` script to package.json
   - Integrate with Nx build system

2. **GitHub Actions:**
   - Build Storybook on design system changes
   - Deploy to static hosting
   - Version Storybook builds

3. **Deployment:**
   - Deploy to AWS S3 + CloudFront (or GitHub Pages)
   - Configure custom domain (optional)
   - Set up SSL/TLS

---

## 6. Configuration Details

### Storybook Configuration (`.storybook/main.ts`)

```typescript
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [
    '../libs/shared-design-system/src/**/*.stories.@(js|jsx|ts|tsx|mdx)',
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-viewport',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  core: {
    builder: '@storybook/builder-vite',
  },
  typescript: {
    check: true,
    reactDocgen: 'react-docgen-typescript',
  },
  viteFinal: async config => {
    // Tailwind CSS 4.0 configuration
    // PostCSS configuration
    return config;
  },
};

export default config;
```

### Tailwind CSS 4.0 Configuration

**PostCSS Setup:**

```javascript
// .storybook/postcss.config.js
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

**Preview CSS:**

```css
/* .storybook/preview.css */
@import 'tailwindcss';
```

**Content Paths:**

Ensure Storybook scans component files for Tailwind:

```typescript
// In main.ts
export default {
  // ... other config
  staticDirs: ['../libs/shared-design-system/src'],
};
```

### TypeScript Configuration

Storybook should use the project's TypeScript configuration:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@mfe/shared-design-system": ["libs/shared-design-system/src/index.ts"]
    }
  }
}
```

---

## 7. Component Story Creation

### Story Template

```typescript
// libs/shared-design-system/src/components/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Design System/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile button component with multiple variants and sizes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'Button style variant',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'Button size',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: 'Button',
  },
};

export const Primary: Story = {
  args: {
    variant: 'default',
    children: 'Primary Button',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small Button',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large Button',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};
```

### Story Organization

```
libs/shared-design-system/src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.stories.tsx
│   │   └── Button.test.tsx
│   ├── Input/
│   │   ├── Input.tsx
│   │   ├── Input.stories.tsx
│   │   └── Input.test.tsx
│   └── ...
├── tokens/
│   ├── colors.stories.tsx
│   ├── typography.stories.tsx
│   └── spacing.stories.tsx
└── index.ts
```

---

## 8. Deployment Strategy

### Deployment Options

#### Option A: AWS S3 + CloudFront (Recommended)

**Pros:**

- Professional hosting solution
- Custom domain support
- CDN for fast global access
- SSL/TLS via AWS Certificate Manager
- Cost-effective (~$5-10/month)

**Implementation:**

1. Build Storybook: `nx build-storybook shared-design-system`
2. Upload to S3 bucket
3. Configure CloudFront distribution
4. Set up custom domain (optional)
5. Configure SSL/TLS certificate

**URL Pattern:**

- `https://design-system.yourdomain.com`
- or `https://storybook.yourdomain.com`

#### Option B: GitHub Pages (Simple, Free)

**Pros:**

- Free for public repos
- Simple setup
- Automatic deployment from CI/CD
- Good for internal documentation

**Cons:**

- Limited customization
- Public repos only (or limited private repo features)
- Less control over hosting

**Implementation:**

1. Enable GitHub Pages in repo settings
2. Build Storybook in CI/CD
3. Deploy to `gh-pages` branch
4. Automatic hosting at `https://{username}.github.io/{repo-name}`

#### Option C: Vercel/Netlify (Free Tier)

**Pros:**

- Free tier available
- Simple setup
- Automatic deployments
- Good performance

**Cons:**

- Less control than self-hosted
- May require paid plan for advanced features

### CI/CD Integration

**GitHub Actions Workflow:**

```yaml
name: Deploy Storybook

on:
  push:
    branches: [main, develop]
    paths:
      - 'libs/shared-design-system/**'
      - '.storybook/**'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'pnpm'
      - run: pnpm install
      - run: nx build-storybook shared-design-system
      - name: Deploy to S3
        # ... S3 deployment steps
```

---

## 9. Success Criteria

### Setup Success

- [ ] Storybook installs and runs locally
- [ ] Tailwind CSS 4.0 styles render correctly
- [ ] TypeScript types work in stories
- [ ] Path aliases resolve correctly
- [ ] All shadcn/ui components can be imported

### Component Coverage

- [ ] Stories created for all high-priority components
- [ ] All component variants documented
- [ ] Interactive controls work for all props
- [ ] Accessibility addon integrated
- [ ] Design tokens documented

### Documentation Quality

- [ ] Component props auto-documented from TypeScript
- [ ] Usage examples provided
- [ ] Design principles documented
- [ ] Migration guide created
- [ ] Best practices documented

### Deployment Success

- [ ] Storybook builds successfully in CI/CD
- [ ] Deployed to static hosting
- [ ] Accessible via public URL
- [ ] SSL/TLS configured
- [ ] Automatic deployments working

### Developer Experience

- [ ] Fast Storybook startup (< 5 seconds)
- [ ] Hot reload works for component changes
- [ ] Easy to add new stories
- [ ] Good developer documentation
- [ ] Team can use Storybook effectively

---

## 10. Timeline & Phases

### Estimated Timeline

**Total Duration:** 2-3 weeks (assuming part-time work)

| Phase                                 | Duration | Dependencies |
| ------------------------------------- | -------- | ------------ |
| **Phase 1: Storybook Setup**          | 2-3 days | None         |
| **Phase 2A: High Priority Stories**   | 3-4 days | Phase 1      |
| **Phase 2B: Medium Priority Stories** | 2-3 days | Phase 2A     |
| **Phase 2C: Remaining Stories**       | 2-3 days | Phase 2B     |
| **Phase 3: Advanced Features**        | 2-3 days | Phase 2A     |
| **Phase 4: Documentation**            | 2-3 days | Phase 3      |
| **Phase 5: CI/CD Integration**        | 1-2 days | Phase 4      |

### Phase Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2A (High Priority Stories)
    ↓
Phase 2B (Medium Priority) ───┐
    ↓                         │
Phase 2C (Remaining)          │
    ↓                         │
Phase 3 (Advanced Features) ←─┘
    ↓
Phase 4 (Documentation)
    ↓
Phase 5 (CI/CD)
```

### Critical Path

1. Storybook Setup (foundation)
2. High Priority Stories (core components)
3. Documentation (enables team usage)
4. CI/CD Integration (enables deployment)

---

## Appendix A: Storybook Addons

### Essential Addons (Included)

- `@storybook/addon-essentials` - Core addons (controls, actions, docs, etc.)
- `@storybook/addon-links` - Link stories together
- `@storybook/addon-interactions` - Test user interactions

### Recommended Addons

- `@storybook/addon-a11y` - Accessibility testing
- `@storybook/addon-viewport` - Test responsive designs
- `@storybook/addon-backgrounds` - Change background colors
- `@storybook/addon-measure` - Measure elements
- `@storybook/addon-outline` - Visualize CSS outlines

---

## Appendix B: Resources

### Official Documentation

- [Storybook Documentation](https://storybook.js.org/docs)
- [Storybook for React](https://storybook.js.org/docs/react/get-started)
- [Storybook with Vite](https://storybook.js.org/docs/react/builders/vite)
- [Nx Storybook Plugin](https://nx.dev/nx-api/storybook)

### Tailwind CSS Integration

- [Storybook with Tailwind CSS](https://storybook.js.org/recipes/tailwindcss)
- [Tailwind CSS 4.0 Documentation](https://tailwindcss.com/docs)

### shadcn/ui with Storybook

- shadcn/ui components work seamlessly in Storybook
- No special configuration needed (standard React components)

---

## Document History

| Version | Date       | Author          | Changes                     |
| ------- | ---------- | --------------- | --------------------------- |
| 1.0     | 2025-12-12 | Laldingliana TV | Initial implementation plan |

---

**End of Document**
