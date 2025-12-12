# Design System Color Palette

**Status:** ✅ Complete  
**Date:** 2026-12-09  
**Task:** 4.5.1 - Formalize Design System Color Palette

## Primary Colors

### Primary Brand Color

**Color:** `#084683` (RGB: 8, 70, 131)  
**Usage:** Header, primary navigation, key CTAs, primary buttons  
**Applied:** ✅ Universal Header (shared-header-ui), Tailwind configs, CSS variables, design tokens

**Properties:**

- Professional financial services appearance
- Deep blue conveys trust and stability
- Excellent contrast with white text (WCAG AAA compliant)
- Distinguishes from generic slate/gray themes

### Color Scale

The primary color `#084683` has been formalized with a complete 10-shade scale (50-950) for consistent usage across the design system:

- **50:** `#e6f0f8` - Lightest tint
- **100:** `#b3d1e8` - Very light
- **200:** `#80b2d8` - Light
- **300:** `#4d93c8` - Medium-light
- **400:** `#1a74b8` - Medium
- **500:** `#0d5a9a` - Base-medium
- **600:** `#0a4a7a` - Medium-dark (hover state)
- **700:** `#084683` - **Base primary brand color**
- **800:** `#06325a` - Dark (active state)
- **900:** `#041e3a` - Very dark
- **950:** `#02142a` - Darkest shade

### Button States

- **Base:** `rgba(255, 255, 255, 0.15)` - Semi-transparent white overlay
- **Hover:** `rgba(255, 255, 255, 0.10)` - Slightly more transparent
- **Primary Hover:** `#0a4a7a` (primary-600)
- **Primary Active:** `#06325a` (primary-800)

## Implementation

### ✅ Tailwind CSS v4 Configuration

All MFE Tailwind configs have been updated with the primary color palette:

**Files Updated:**

- `apps/shell/tailwind.config.js`
- `apps/auth-mfe/tailwind.config.js`
- `apps/payments-mfe/tailwind.config.js`
- `apps/admin-mfe/tailwind.config.js`

**Configuration:**

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: '#084683',
        50: '#e6f0f8',
        100: '#b3d1e8',
        200: '#80b2d8',
        300: '#4d93c8',
        400: '#1a74b8',
        500: '#0d5a9a',
        600: '#0a4a7a',
        700: '#084683', // Base primary brand color
        800: '#06325a',
        900: '#041e3a',
        950: '#02142a',
      },
    },
  },
}
```

### ✅ CSS Custom Properties (shadcn/ui Theme)

All MFE styles.css files have been updated with CSS custom properties for shadcn/ui theme integration:

**Files Updated:**

- `apps/shell/src/styles.css`
- `apps/auth-mfe/src/styles.css`
- `apps/payments-mfe/src/styles.css`
- `apps/admin-mfe/src/styles.css`

**CSS Variables:**

```css
:root {
  --primary: 8 70 131; /* #084683 - RGB values for Tailwind v4 */
  --primary-foreground: 255 255 255; /* White text on primary */
  --primary-50: 230 240 248;
  --primary-100: 179 209 232;
  --primary-200: 128 178 216;
  --primary-300: 77 147 200;
  --primary-400: 26 116 184;
  --primary-500: 13 90 154;
  --primary-600: 10 74 122;
  --primary-700: 8 70 131; /* Base primary brand color */
  --primary-800: 6 50 90;
  --primary-900: 4 30 58;
  --primary-950: 2 20 42;
  --primary-hover: 10 74 122; /* primary-600 */
  --primary-active: 6 50 90; /* primary-800 */
}
```

### ✅ Design System Tokens

Design system color tokens have been updated:

**File:** `libs/shared-design-system/src/lib/tokens/colors.ts`

**Token Structure:**

```typescript
primary: {
  DEFAULT: '#084683',
  50: '#e6f0f8',
  // ... full scale
  700: '#084683', // Base primary brand color
  hover: '#0a4a7a', // primary-600
  active: '#06325a', // primary-800
}
```

## Usage Guidelines

### Tailwind Classes

Use Tailwind utility classes for consistent styling:

```tsx
// Primary background
<div className="bg-primary">...</div>
<div className="bg-primary-700">...</div>

// Primary text
<p className="text-primary">...</p>

// Primary borders
<div className="border-primary">...</div>

// Hover states
<button className="bg-primary hover:bg-primary-600">...</button>
```

### CSS Variables (shadcn/ui)

Use CSS variables for shadcn/ui component theming:

```css
.button-primary {
  background-color: rgb(var(--primary));
  color: rgb(var(--primary-foreground));
}

.button-primary:hover {
  background-color: rgb(var(--primary-hover));
}
```

### Design Tokens (TypeScript)

Import and use design tokens in TypeScript/React:

```typescript
import { colors } from '@mfe/shared-design-system';

const primaryColor = colors.primary.DEFAULT; // '#084683'
const hoverColor = colors.primary.hover; // '#0a4a7a'
```

## Next Steps

1. ✅ **Color Palette Formalized** - Complete
2. ⬜ **Replace Inline Styles** - Update Header component to use `bg-primary` instead of inline style
3. ⬜ **Update Design System Components** - Ensure Button, Card, and other components use primary color
4. ⬜ **Component Migration** - Migrate all components to use design system colors

## Files Modified

- `libs/shared-design-system/src/lib/tokens/colors.ts` - Updated primary color tokens
- `apps/shell/tailwind.config.js` - Added primary color scale
- `apps/auth-mfe/tailwind.config.js` - Added primary color scale
- `apps/payments-mfe/tailwind.config.js` - Added primary color scale
- `apps/admin-mfe/tailwind.config.js` - Added primary color scale
- `apps/shell/src/styles.css` - Added CSS custom properties
- `apps/auth-mfe/src/styles.css` - Added CSS custom properties
- `apps/payments-mfe/src/styles.css` - Added CSS custom properties
- `apps/admin-mfe/src/styles.css` - Added CSS custom properties
