# Design System Color Palette

**Status:** In Progress  
**Date:** 2026-12-09

## Primary Colors

### Primary Background

**Color:** `#084683`  
**Usage:** Header, primary navigation, key CTAs  
**Applied:** ✅ Universal Header (shared-header-ui)  
**Pending:** Design system theme configuration

**Properties:**

- Professional financial services appearance
- Deep blue conveys trust and stability
- Excellent contrast with white text (WCAG AAA compliant)
- Distinguishes from generic slate/gray themes

### Button States

- **Base:** `rgba(255, 255, 255, 0.15)` - Semi-transparent white
- **Hover:** `rgba(255, 255, 255, 0.10)` - Slightly more transparent

## Next Steps for Design System Integration

When implementing Task 4.5 (Design System Migration):

1. **Add to Tailwind Config**

   ```typescript
   theme: {
     extend: {
       colors: {
         primary: {
           DEFAULT: '#084683',
           // Add shades as needed
         }
       }
     }
   }
   ```

2. **Update shadcn/ui Theme**
   - Add as primary color in CSS variables
   - Apply to relevant components

3. **Replace Inline Styles**
   - Convert `style={{ backgroundColor: '#084683' }}` to `bg-primary`
   - Use Tailwind classes consistently

4. **Document Usage**
   - Add to design system documentation
   - Create usage guidelines
   - Provide examples

## Current Implementation

**File:** `libs/shared-header-ui/src/lib/shared-header-ui.tsx`

```tsx
<header className="text-white shadow-lg" style={{ backgroundColor: '#084683' }}>
```

**Temporary:** Using inline style until design system theme is configured.  
**Future:** Will use `bg-primary` class from Tailwind config.
