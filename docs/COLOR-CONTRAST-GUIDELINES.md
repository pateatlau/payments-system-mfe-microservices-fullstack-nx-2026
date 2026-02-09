# Color Contrast Guidelines - WCAG 2.1 AA Compliance

**Last Updated:** February 10, 2026

This document outlines the color contrast requirements and design system colors for the MFE Payments System to ensure WCAG 2.1 Level AA compliance.

## WCAG 2.1 AA Contrast Requirements

| Content Type | Minimum Ratio | Example |
|--------------|---------------|---------|
| Normal text (< 18pt) | 4.5:1 | Body text, labels, descriptions |
| Large text (18pt+ or 14pt bold) | 3:1 | Headings, large buttons |
| UI components | 3:1 | Borders, icons, form inputs |
| Graphical objects | 3:1 | Charts, diagrams, icons |

## Design System Color Palette

### Light Mode Colors

| Token | RGB | Hex | Usage | Contrast on White |
|-------|-----|-----|-------|-------------------|
| `--background` | 255 255 255 | #FFFFFF | Page background | - |
| `--foreground` | 17 24 39 | #111827 | Primary text | 17.74:1 |
| `--muted-foreground` | 75 85 99 | #4B5563 | Secondary text | 7.56:1 |
| `--border` | 107 114 128 | #6B7280 | Borders, inputs | 4.83:1 |
| `--primary` | 8 70 131 | #084683 | Primary actions | 9.48:1 |
| `--destructive` | 185 28 28 | #B91C1C | Destructive actions | 6.47:1 |

### Dark Mode Colors

| Token | RGB | Hex | Usage | Contrast on Gray-900 |
|-------|-----|-----|-------|----------------------|
| `--background` | 17 24 39 | #111827 | Page background | - |
| `--foreground` | 249 250 251 | #F9FAFB | Primary text | 16.98:1 |
| `--muted-foreground` | 156 163 175 | #9CA3AF | Secondary text | 6.99:1 |
| `--border` | 156 163 175 | #9CA3AF | Borders, inputs | 6.99:1 |
| `--primary` | 26 116 184 | #1A74B8 | Primary actions | 3.58:1 |
| `--destructive` | 220 38 38 | #DC2626 | Destructive actions | 3.67:1 |

### Button Text Contrast

| Button Type | Background | Text | Contrast Ratio |
|-------------|------------|------|----------------|
| Primary (Light) | #084683 | #FFFFFF | 9.48:1 |
| Primary (Dark) | #1A74B8 | #FFFFFF | 4.96:1 |
| Destructive (Light) | #B91C1C | #FFFFFF | 6.47:1 |
| Destructive (Dark) | #DC2626 | #FFFFFF | 4.83:1 |
| Secondary | #F3F4F6 | #111827 | 16.12:1 |

## Color Usage Guidelines

### Text Colors

1. **Primary Text (`text-foreground`)**
   - Use for all main content, headings, and important information
   - Provides maximum readability

2. **Muted Text (`text-muted-foreground`)**
   - Use for secondary information, descriptions, captions
   - Never use for critical information or errors

3. **Error Text (`text-destructive`)**
   - Use for error messages and validation feedback
   - Always pair with descriptive text, not just color

### Interactive Elements

1. **Primary Buttons**
   - Use `bg-primary text-primary-foreground`
   - White text on brand color background

2. **Destructive Buttons**
   - Use `bg-destructive text-destructive-foreground`
   - Reserved for irreversible actions

3. **Secondary Buttons**
   - Use `bg-secondary text-secondary-foreground`
   - For less prominent actions

### Borders and UI Elements

1. **Input Borders**
   - Use `border-input` for form field borders
   - Provides 4.83:1 contrast in light mode, 6.99:1 in dark mode

2. **Focus Rings**
   - Use `ring-ring` for focus indicators
   - High contrast for keyboard navigation visibility

## Do's and Don'ts

### Do

- Always use semantic color tokens from the design system
- Test both light and dark mode appearances
- Provide non-color indicators for status (icons, patterns)
- Use `text-foreground` for primary content
- Verify contrast with automated tools before committing

### Don't

- Don't use `text-muted-foreground` for error messages
- Don't rely solely on color to convey meaning
- Don't create custom colors without checking contrast
- Don't use decorative colors for text
- Don't mix light/dark mode tokens

## Implementation Examples

### Accessible Error Message

```tsx
// Good: Uses destructive color with icon
<p className="text-destructive flex items-center gap-2">
  <AlertCircle className="h-4 w-4" />
  <span>Please enter a valid email address</span>
</p>

// Bad: Color only
<p className="text-red-500">Invalid email</p>
```

### Accessible Button

```tsx
// Good: Uses design system tokens
<Button variant="destructive">
  Delete Account
</Button>

// Bad: Custom colors without contrast check
<button className="bg-red-400 text-white">Delete</button>
```

### Accessible Form Field

```tsx
// Good: Visible border and focus states
<Input
  className="border-input focus:ring-ring"
  aria-invalid={hasError}
/>

// Bad: Low contrast border
<input className="border-gray-200" />
```

## Automated Testing

### Running Contrast Audit

```bash
# Run the contrast audit script
npx ts-node scripts/contrast-audit.ts

# Run all accessibility tests
pnpm test:a11y
```

### CI Integration

The contrast audit runs automatically in CI. Any color changes that fail WCAG 2.1 AA requirements will cause the build to fail.

## Tools for Verification

1. **Chrome DevTools**: Inspect element > Accessibility tab shows contrast
2. **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
3. **axe DevTools**: Browser extension for accessibility audits
4. **Lighthouse**: Built-in accessibility audit in Chrome DevTools

## References

- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)
- [Understanding WCAG 1.4.3 Contrast](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [Understanding WCAG 1.4.11 Non-text Contrast](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html)
