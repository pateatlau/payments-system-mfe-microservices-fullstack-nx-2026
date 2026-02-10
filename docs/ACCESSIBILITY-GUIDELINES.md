# Accessibility Guidelines

**Version:** 1.0
**Last Updated:** February 10, 2026
**Target Compliance:** WCAG 2.1 Level AA

## Overview

This document outlines accessibility requirements and best practices for the MFE Payments System. We target WCAG 2.1 Level AA compliance to ensure the application is usable by people with disabilities, including those using assistive technologies like screen readers, keyboard-only navigation, and screen magnification.

## Table of Contents

1. [Key Principles](#key-principles)
2. [Component Requirements](#component-requirements)
3. [Color & Contrast](#color--contrast)
4. [Keyboard Navigation](#keyboard-navigation)
5. [Screen Reader Support](#screen-reader-support)
6. [Testing Checklist](#testing-checklist)
7. [Development Workflow](#development-workflow)
8. [Resources](#resources)

---

## Key Principles

### 1. Perceivable

Information and user interface components must be presentable to users in ways they can perceive.

- **Text Alternatives**: All non-text content has text alternatives (alt text for images, aria-labels for icons)
- **Color Independence**: Color is never the only means of conveying information
- **Contrast**: Text has minimum 4.5:1 contrast ratio (3:1 for large text)
- **Resizable Text**: Content reflows at 400% zoom without loss of functionality

### 2. Operable

User interface components and navigation must be operable.

- **Keyboard Accessible**: All functionality is available via keyboard
- **No Keyboard Traps**: Users can navigate away from any component using keyboard
- **Focus Visible**: Focus indicators are always visible
- **Focus Order**: Tab order is logical and follows visual layout

### 3. Understandable

Information and operation of the user interface must be understandable.

- **Language**: Page language is declared (`lang="en"`)
- **Predictable**: Components behave predictably
- **Input Assistance**: Form inputs have labels, errors are clearly identified

### 4. Robust

Content must be robust enough to be interpreted by assistive technologies.

- **Valid HTML**: Use semantic HTML elements
- **ARIA Correct**: ARIA attributes used correctly and only when necessary
- **Compatible**: Works with current assistive technologies

---

## Component Requirements

### Buttons

```tsx
// Good - Uses semantic button element
<button type="button" onClick={handleClick}>
  Save Changes
</button>

// Good - Icon button with aria-label
<button type="button" aria-label="Close dialog" onClick={onClose}>
  <XIcon aria-hidden="true" />
</button>

// Bad - Don't use div for buttons
<div onClick={handleClick}>Save Changes</div>
```

**Requirements:**
- Use `<button>` element (not `<div>` or `<span>`)
- Have visible focus indicator (built into design system)
- Have accessible name (visible text or `aria-label`)
- Disabled state uses `disabled` attribute
- Loading state uses `aria-busy="true"` and `aria-disabled="true"`

### Forms

```tsx
// Good - Label associated with input
<FormField name="email" label="Email Address" required error={errors.email}>
  <Input type="email" />
</FormField>

// Good - Select with aria-label
<select aria-label="Select currency" value={currency} onChange={handleChange}>
  <option value="INR">INR</option>
  <option value="USD">USD</option>
</select>
```

**Requirements:**
- All inputs have associated labels (`htmlFor` or `aria-label`)
- Required fields marked with `aria-required="true"` or `required`
- Invalid fields marked with `aria-invalid="true"`
- Error messages linked via `aria-describedby`
- Error messages have `role="alert"`

### Modals/Dialogs

```tsx
// Good - Accessible dialog
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
>
  <h2 id="dialog-title">Confirm Payment</h2>
  <p id="dialog-description">Are you sure you want to send ₹1,000?</p>
  <button type="button" onClick={onClose}>Cancel</button>
  <button type="button" onClick={onConfirm}>Confirm</button>
</div>
```

**Requirements:**
- Use `role="dialog"` (or `role="alertdialog"` for confirmations)
- Set `aria-modal="true"`
- Use `aria-labelledby` pointing to title
- Use `aria-describedby` for description (optional)
- Focus trapped within modal (use `useFocusTrap` hook)
- Escape key closes modal
- Focus returns to trigger element on close
- Body scroll prevented when open

### Tables

```tsx
// Good - Accessible data table
<table aria-label="Recent payments" aria-describedby="table-desc">
  <caption id="table-desc" className="sr-only">
    List of recent payments showing date, amount, and status
  </caption>
  <thead>
    <tr>
      <th scope="col">Date</th>
      <th scope="col">Amount</th>
      <th scope="col">Status</th>
      <th scope="col">Actions</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>2026-02-10</td>
      <td>₹1,000.00</td>
      <td><StatusBadge status="completed">Completed</StatusBadge></td>
      <td>
        <button aria-label="View payment from 2026-02-10">View</button>
      </td>
    </tr>
  </tbody>
</table>
```

**Requirements:**
- Use proper table markup (`<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>`)
- Column headers use `scope="col"`
- Row headers (if any) use `scope="row"`
- Table has accessible caption via `<caption>` or `aria-label`
- Action buttons have descriptive `aria-label` (e.g., "Edit John Doe" not just "Edit")
- Sortable columns use `aria-sort="ascending|descending|none"`

### Navigation

```tsx
// Good - Accessible navigation
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/payments" aria-current="page">Payments</a></li>
    <li><a href="/profile">Profile</a></li>
    <li><a href="/admin">Admin</a></li>
  </ul>
</nav>
```

**Requirements:**
- Skip link present as first focusable element
- Navigation in `<nav>` element with `aria-label`
- Current page indicated with `aria-current="page"`
- Links have descriptive text (not "click here")

### Loading States

```tsx
// Good - Accessible loading spinner
<Loading
  label="Loading payments..."
  showLabel={true}
  announceOnMount={true}
/>

// Good - Skeleton with aria-label
<Skeleton aria-label="Loading user profile" />

// Good - Button loading state
<Button loading loadingText="Creating...">
  Create Payment
</Button>
```

**Requirements:**
- Loading indicators have `role="status"` and `aria-busy="true"`
- Include `aria-label` describing what is loading
- Consider `aria-live="polite"` for dynamic announcements
- Loading buttons show `aria-busy="true"` and `aria-disabled="true"`

---

## Color & Contrast

### Minimum Contrast Ratios (WCAG 2.1 AA)

| Element Type | Minimum Ratio | Notes |
|--------------|---------------|-------|
| Normal text | 4.5:1 | Text < 18pt or < 14pt bold |
| Large text | 3:1 | Text ≥ 18pt or ≥ 14pt bold |
| UI components | 3:1 | Buttons, inputs, icons |
| Focus indicators | 3:1 | Against adjacent colors |

### Approved Color Palette

| Token | Light Mode | Dark Mode | Use Case |
|-------|-----------|-----------|----------|
| `foreground` | #111827 | #F9FAFB | Primary text |
| `muted-foreground` | #4B5563 | #9CA3AF | Secondary text |
| `primary` | #084683 | #1A74B8 | Primary actions |
| `destructive` | #B91C1C | #DC2626 | Error/danger |
| `border` | #6B7280 | #9CA3AF | Input borders |

### Color Independence

Never rely on color alone to convey information:

```tsx
// Bad - Only uses color
<span className="text-red-500">Error occurred</span>

// Good - Uses icon and text
<span className="text-destructive flex items-center gap-1">
  <AlertCircle aria-hidden="true" />
  Error occurred
</span>

// Bad - Status by color only
<span className={status === 'success' ? 'bg-green-500' : 'bg-red-500'} />

// Good - Status with text
<StatusBadge variant={status}>{status}</StatusBadge>
```

---

## Keyboard Navigation

### Required Key Support

| Key | Action |
|-----|--------|
| Tab | Move to next focusable element |
| Shift + Tab | Move to previous focusable element |
| Enter | Activate buttons, submit forms, follow links |
| Space | Activate buttons, toggle checkboxes |
| Escape | Close modals, cancel operations |
| Arrow keys | Navigate within composite widgets (tabs, menus) |

### Focus Order

- Focus order follows visual layout (left-to-right, top-to-bottom)
- Skip link moves focus to main content
- Tab panels: Tab navigates between tabs, content is reached after tabs
- Modals: Focus trapped within, starts on first focusable element

### Focus Indicators

All interactive elements must have visible focus indicators:

```css
/* Design system provides focus styles */
:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

/* Or use Tailwind classes */
.focus-visible:ring-2 .focus-visible:ring-ring .focus-visible:ring-offset-2
```

---

## Screen Reader Support

### ARIA Live Regions

Use live regions to announce dynamic content:

```tsx
// For non-urgent updates (polite)
<div role="status" aria-live="polite" aria-atomic="true">
  Payment created successfully
</div>

// For urgent alerts (assertive)
<div role="alert" aria-live="assertive" aria-atomic="true">
  Error: Payment failed
</div>
```

**When to use:**
- Form submission results
- Loading completion
- Error messages
- Toast notifications
- Route changes (page title updates)

### useAnnounce Hook

```tsx
import { useAnnounce } from '@mfe/shared-utils';

function PaymentForm() {
  const announce = useAnnounce();

  const onSubmit = async (data) => {
    announce('Creating payment...');
    try {
      await createPayment(data);
      announce('Payment created successfully!', { politeness: 'assertive' });
    } catch (error) {
      announce('Failed to create payment', { politeness: 'assertive' });
    }
  };
}
```

### Heading Structure

- Each page has exactly one `<h1>` (page title)
- Headings follow sequential order (h1 → h2 → h3, no skipping)
- Use headings to create document outline, not for styling

```tsx
// Good - Proper hierarchy
<h1>Payment Dashboard</h1>
  <h2>Recent Transactions</h2>
    <h3>Transaction Details</h3>
  <h2>Payment Summary</h2>

// Bad - Skipped levels
<h1>Payment Dashboard</h1>
  <h3>Recent Transactions</h3>  {/* Skipped h2 */}
```

### Landmarks

Use HTML5 semantic elements for landmarks:

```html
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <header role="banner">
    <nav role="navigation" aria-label="Main navigation">...</nav>
  </header>
  <main id="main-content" role="main">
    {/* Page content */}
  </main>
  <footer role="contentinfo">...</footer>
</body>
```

---

## Testing Checklist

### Automated Testing

Run before every PR:

```bash
# Unit accessibility tests (jest-axe)
pnpm test:a11y

# E2E accessibility tests
pnpm test:e2e:a11y:all

# Color contrast audit
pnpm test:a11y:contrast
```

**Pass criteria:**
- [ ] jest-axe passes on all components
- [ ] No critical/serious axe violations in E2E
- [ ] All contrast ratios meet WCAG AA

### Manual Testing

Perform periodically and for new features:

**Keyboard Testing:**
- [ ] Can complete all flows with keyboard only
- [ ] No keyboard traps
- [ ] Focus order is logical
- [ ] Focus indicators visible on all elements
- [ ] Skip link works correctly

**Screen Reader Testing:**
- [ ] Page structure is announced correctly
- [ ] Form fields have accessible names
- [ ] Errors are announced
- [ ] Dynamic content is announced
- [ ] Tables are navigable

**Visual Testing:**
- [ ] Works at 200% zoom
- [ ] Works with high contrast mode
- [ ] Content visible in both light and dark modes

### Screen Reader Testing Guide

**VoiceOver (macOS):**
1. Enable: Cmd + F5
2. Navigate: VO + Arrow keys
3. Read all: VO + A
4. Disable: Cmd + F5

**NVDA (Windows):**
1. Enable: Ctrl + Alt + N
2. Navigate: Arrow keys
3. Read all: NVDA + Down Arrow
4. Disable: NVDA + Q

---

## Development Workflow

### When Adding New Components

1. **Use semantic HTML** - Prefer native elements over ARIA
2. **Add proper ARIA attributes** - Only when HTML semantics insufficient
3. **Ensure keyboard accessibility** - Test Tab, Enter, Space, Escape
4. **Test with screen reader** - At least VoiceOver or NVDA
5. **Add jest-axe test** - Include in component test file

### Code Review Checklist

- [ ] Interactive elements are keyboard accessible
- [ ] Form inputs have associated labels
- [ ] Images have alt text or are marked decorative
- [ ] Color is not the only way to convey information
- [ ] ARIA attributes are used correctly
- [ ] Focus management handled for modals/dialogs
- [ ] Loading states announce to screen readers

### Component Example

```tsx
// Full accessible component example
import { useAnnounce, useFocusTrap } from '@mfe/shared-utils';
import { Button, FormField, Input } from '@mfe/shared-design-system';

export function CreatePaymentForm({ onSuccess, onClose }) {
  const announce = useAnnounce();
  const dialogRef = useFocusTrap({ enabled: true, onEscape: onClose });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data) => {
    setIsSubmitting(true);
    announce('Creating payment...');

    try {
      await createPayment(data);
      announce('Payment created successfully!', { politeness: 'assertive' });
      onSuccess();
    } catch (error) {
      announce('Failed to create payment', { politeness: 'assertive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <h2 id="dialog-title">Create Payment</h2>

      <form onSubmit={handleSubmit}>
        <FormField name="amount" label="Amount" required error={errors.amount}>
          <Input type="number" min="0.01" step="0.01" />
        </FormField>

        <FormField name="recipient" label="Recipient Email" required>
          <Input type="email" />
        </FormField>

        <div className="flex gap-4 mt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting} loadingText="Creating...">
            Create Payment
          </Button>
        </div>
      </form>
    </div>
  );
}
```

---

## Resources

### Official Standards

- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)
- [WAI-ARIA Authoring Practices 1.2](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

### Testing Tools

- [axe DevTools](https://www.deque.com/axe/devtools/) - Browser extension
- [WAVE](https://wave.webaim.org/) - Web accessibility evaluator
- [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/) - Contrast checker

### Learning Resources

- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [Inclusive Components](https://inclusive-components.design/)
- [Deque University](https://dequeuniversity.com/)

### Project-Specific

- [Accessibility Compliance Plan](./POC-3-Implementation/ACCESSIBILITY-COMPLIANCE-PLAN.md)
- [Color Contrast Guidelines](./COLOR-CONTRAST-GUIDELINES.md)
- [Design System Components](../libs/shared-design-system/README.md)

---

## Appendix: ARIA Reference

### Common Roles

| Role | Use Case |
|------|----------|
| `button` | Clickable control (prefer `<button>`) |
| `dialog` | Modal dialog |
| `alertdialog` | Confirmation dialog requiring response |
| `alert` | Important message |
| `status` | Non-urgent status update |
| `navigation` | Navigation section |
| `tablist` | Container for tabs |
| `tab` | Tab button |
| `tabpanel` | Tab content panel |

### Common States & Properties

| Attribute | Values | Use Case |
|-----------|--------|----------|
| `aria-label` | String | Accessible name when no visible text |
| `aria-labelledby` | ID ref | Accessible name from another element |
| `aria-describedby` | ID ref | Additional description |
| `aria-required` | true/false | Required form field |
| `aria-invalid` | true/false | Invalid form field |
| `aria-selected` | true/false | Selected state (tabs, options) |
| `aria-expanded` | true/false | Expanded state (menus, accordions) |
| `aria-hidden` | true/false | Hide from assistive tech |
| `aria-live` | off/polite/assertive | Live region politeness |
| `aria-busy` | true/false | Loading state |
| `aria-current` | page/step/location | Current item indicator |
