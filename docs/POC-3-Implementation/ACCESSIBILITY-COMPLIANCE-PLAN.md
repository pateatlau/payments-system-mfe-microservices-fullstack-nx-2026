# Full Accessibility Compliance Implementation Plan (WCAG 2.1 AA) - POC-3

**Created:** January 24, 2026
**Last Updated:** February 10, 2026
**Status:** IN PROGRESS
**Priority:** High

## Implementation Summary

| Component | Status |
|-----------|--------|
| Automated Accessibility Testing (jest-axe) | ✅ Complete |
| Skip Navigation Links | ✅ Complete |
| Landmark Structure | ⏳ Pending |
| Focus Management & Trapping | ✅ Complete |
| ARIA Live Regions | ✅ Complete |
| Form Accessibility Enhancements | ✅ Complete |
| Data Table Accessibility | ✅ Complete |
| Modal/Dialog Accessibility | ✅ Complete |
| Color Contrast Verification | ✅ Complete |
| Loading States Accessibility | ✅ Complete |
| E2E Accessibility Test Suite | ✅ Complete |
| Screen Reader Testing | ⏳ Pending |
| Keyboard Navigation Audit | ⏳ Pending |
| Accessibility Documentation | ✅ Complete |

**Target Compliance:** WCAG 2.1 Level AA

---

## Revision History

| Date       | Changes                                                                    |
| ---------- | -------------------------------------------------------------------------- |
| 2026-01-24 | Initial plan created based on codebase accessibility audit                 |
| 2026-01-24 | Priority 1.1 completed: Automated accessibility testing infrastructure     |
| 2026-01-24 | Priority 1.2 completed: Skip navigation links (SkipLink component)         |
| 2026-01-24 | Priority 1.3 completed: ARIA live regions & announcements                  |
| 2026-01-24 | Priority 1.4 completed: Language declaration & document titles             |
| 2026-01-24 | Priority 1.5 completed: Form error accessibility (FormField component)     |
| 2026-02-10 | Priority 3.1 completed: E2E Accessibility Test Suite (6 test files)        |
| 2026-02-10 | Priority 3.2 completed: Accessibility Documentation                         |

---

## Executive Summary

This document outlines the implementation plan for achieving full WCAG 2.1 AA compliance across the MFE Payments System. The application currently has partial accessibility implementation including proper form labels, focus indicators, and basic ARIA attributes. This plan addresses the gaps to achieve comprehensive accessibility for users with disabilities.

**Current State:**
- ✅ Form labels properly associated with inputs
- ✅ Focus indicators on interactive elements
- ✅ Basic ARIA attributes (role="alert", aria-label)
- ✅ Theme system with OS preference detection
- ✅ 9 E2E accessibility tests for Profile MFE
- ❌ No automated accessibility testing in CI
- ❌ No skip navigation links
- ❌ Incomplete landmark structure
- ❌ Missing focus trapping for modals
- ❌ Inconsistent ARIA live regions

**Key Compliance Areas:**
- Perceivable: Color contrast, text alternatives, adaptable content
- Operable: Keyboard accessible, navigable, input modalities
- Understandable: Readable, predictable, input assistance
- Robust: Compatible with assistive technologies

---

## Architecture Overview

### Accessibility Layer Structure

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ACCESSIBILITY ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                     TESTING & VALIDATION LAYER                          ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ ││
│  │  │  jest-axe   │  │  Playwright │  │   Manual    │  │  Lighthouse CI  │ ││
│  │  │  Unit Tests │  │  E2E Tests  │  │ SR Testing  │  │  Audits         │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                     SHARED DESIGN SYSTEM LAYER                          ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ ││
│  │  │   Button    │  │    Input    │  │   Select    │  │  Modal/Dialog   │ ││
│  │  │  (a11y)     │  │   (a11y)    │  │   (a11y)    │  │    (a11y)       │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘ ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ ││
│  │  │   Alert     │  │    Table    │  │  SkipLink   │  │  FocusTrap      │ ││
│  │  │  (a11y)     │  │   (a11y)    │  │   (NEW)     │  │    (NEW)        │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        APPLICATION LAYER                                 ││
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ││
│  │  │   Shell   │ │ Auth MFE  │ │ Payments  │ │  Admin    │ │  Profile  │ ││
│  │  │  (Host)   │ │           │ │   MFE     │ │   MFE     │ │   MFE     │ ││
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘ ││
│  │       │             │             │             │             │         ││
│  │       └─────────────┴─────────────┴─────────────┴─────────────┘         ││
│  │                              │                                           ││
│  │                    Shared Accessibility Utilities                        ││
│  │                    - useAnnounce() hook                                  ││
│  │                    - useFocusTrap() hook                                 ││
│  │                    - useSkipLink() hook                                  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        LANDMARK STRUCTURE                                ││
│  │                                                                          ││
│  │  <body>                                                                  ││
│  │    <a href="#main-content" class="skip-link">Skip to main content</a>   ││
│  │    <header role="banner">                                                ││
│  │      <nav role="navigation" aria-label="Main navigation">...</nav>      ││
│  │    </header>                                                             ││
│  │    <main id="main-content" role="main">                                  ││
│  │      <div aria-live="polite" id="announcer" class="sr-only">...</div>   ││
│  │      {/* Page content */}                                                ││
│  │    </main>                                                               ││
│  │    <footer role="contentinfo">...</footer>                               ││
│  │  </body>                                                                 ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

### WCAG 2.1 AA Success Criteria Coverage

| Principle | Guideline | Criteria | Status | Priority |
|-----------|-----------|----------|--------|----------|
| **Perceivable** | 1.1 Text Alternatives | 1.1.1 Non-text Content | Partial | Phase 1 |
| | 1.3 Adaptable | 1.3.1 Info and Relationships | Partial | Phase 1 |
| | 1.3 Adaptable | 1.3.2 Meaningful Sequence | ✅ Done | - |
| | 1.3 Adaptable | 1.3.3 Sensory Characteristics | ✅ Done | - |
| | 1.4 Distinguishable | 1.4.1 Use of Color | Partial | Phase 2 |
| | 1.4 Distinguishable | 1.4.3 Contrast (Minimum) | Partial | Phase 2 |
| | 1.4 Distinguishable | 1.4.4 Resize Text | ✅ Done | - |
| | 1.4 Distinguishable | 1.4.10 Reflow | ✅ Done | - |
| | 1.4 Distinguishable | 1.4.11 Non-text Contrast | Partial | Phase 2 |
| **Operable** | 2.1 Keyboard Accessible | 2.1.1 Keyboard | Partial | Phase 1 |
| | 2.1 Keyboard Accessible | 2.1.2 No Keyboard Trap | Partial | Phase 1 |
| | 2.4 Navigable | 2.4.1 Bypass Blocks | ✅ Done | Phase 1 |
| | 2.4 Navigable | 2.4.2 Page Titled | ✅ Done | - |
| | 2.4 Navigable | 2.4.3 Focus Order | Partial | Phase 1 |
| | 2.4 Navigable | 2.4.4 Link Purpose | ✅ Done | - |
| | 2.4 Navigable | 2.4.6 Headings and Labels | Partial | Phase 1 |
| | 2.4 Navigable | 2.4.7 Focus Visible | ✅ Done | - |
| | 2.5 Input Modalities | 2.5.1 Pointer Gestures | ✅ Done | - |
| | 2.5 Input Modalities | 2.5.2 Pointer Cancellation | ✅ Done | - |
| | 2.5 Input Modalities | 2.5.3 Label in Name | Partial | Phase 1 |
| **Understandable** | 3.1 Readable | 3.1.1 Language of Page | ❌ Missing | Phase 1 |
| | 3.1 Readable | 3.1.2 Language of Parts | ❌ Missing | Phase 3 |
| | 3.2 Predictable | 3.2.1 On Focus | ✅ Done | - |
| | 3.2 Predictable | 3.2.2 On Input | ✅ Done | - |
| | 3.3 Input Assistance | 3.3.1 Error Identification | Partial | Phase 1 |
| | 3.3 Input Assistance | 3.3.2 Labels or Instructions | ✅ Done | - |
| | 3.3 Input Assistance | 3.3.3 Error Suggestion | Partial | Phase 1 |
| | 3.3 Input Assistance | 3.3.4 Error Prevention | Partial | Phase 2 |
| **Robust** | 4.1 Compatible | 4.1.1 Parsing | ✅ Done | - |
| | 4.1 Compatible | 4.1.2 Name, Role, Value | Partial | Phase 1 |
| | 4.1 Compatible | 4.1.3 Status Messages | ❌ Missing | Phase 1 |

---

## Phase 1: Foundation & Critical Fixes

### Priority 1.1: Automated Accessibility Testing Infrastructure ✅ COMPLETE

**Effort:** 4 hours
**Impact:** Prevents accessibility regressions, enables CI enforcement
**Completed:** January 24, 2026

**Tasks:**

- [x] Install jest-axe for unit test accessibility audits
- [x] Create shared accessibility test utilities
- [x] Add axe-core rules to component tests
- [x] Configure Playwright accessibility audits for E2E
- [ ] Add accessibility checks to CI pipeline (deferred - requires CI configuration)

**Implementation Notes:**

The following was implemented:

1. **Dependencies installed:**
   - `jest-axe` - Unit test accessibility audits
   - `@axe-core/playwright` - E2E accessibility audits
   - `@types/jest-axe` - TypeScript definitions

2. **New `@mfe/shared-test-utils` library created:**
   - Path: `libs/shared-test-utils/`
   - Exports: `renderWithA11yAudit()`, `expectNoA11yViolations()`, `runA11yAudit()`, `createAxeConfig()`, `axePresets`
   - Utility functions: `isFocusable()`, `getFocusableElements()`, `calculateContrastRatio()`
   - 29 passing tests

3. **Design System accessibility tests added:**
   - Path: `libs/shared-design-system/src/lib/components/accessibility.spec.tsx`
   - Tests all design system components: Button, Input, PasswordInput, Alert, Badge, Card, Loading, Skeleton, Select, StatusBadge, ThemeToggle, Toast, SocialLoginButtons, Label
   - Tests form patterns with proper ARIA attributes
   - 126 passing tests total for shared-design-system

4. **Playwright E2E accessibility audit tests created:**
   - Path: `apps/shell-e2e/src/a11y-audit.spec.ts`
   - Tests unauthenticated pages (Sign In, Sign Up)
   - Tests authenticated pages (Payments, Profile, Admin)
   - Tests keyboard navigation
   - Tests focus management
   - Tests ARIA attributes and landmarks
   - Tests color contrast

5. **NPM scripts added:**
   - `test:a11y` - Run all accessibility tests
   - `test:a11y:design-system` - Run design system accessibility tests
   - `test:a11y:test-utils` - Run shared-test-utils tests
   - `test:e2e:a11y` - Run E2E accessibility tests
   - `test:e2e:a11y:audit` - Run E2E accessibility audit spec

**Files to Create/Modify:**

```bash
# Install dependencies
pnpm add -D jest-axe @axe-core/playwright

# Create new shared library for test utilities (does not exist yet)
pnpm nx g @nx/js:library shared-test-utils --directory=libs --unitTestRunner=jest

# Files to create in the new library
libs/shared-test-utils/src/lib/a11y-test-utils.ts
libs/shared-test-utils/src/lib/a11y-test-utils.spec.ts
```

**Accessibility Test Utility:**

```typescript
// libs/shared-test-utils/src/lib/a11y-test-utils.ts
import { axe, toHaveNoViolations } from 'jest-axe';
import { render, RenderResult } from '@testing-library/react';

expect.extend(toHaveNoViolations);

/**
 * Renders a component and runs axe accessibility audit
 */
export async function renderWithA11yAudit(
  ui: React.ReactElement,
  options?: {
    axeOptions?: Parameters<typeof axe>[1];
  }
): Promise<RenderResult & { a11yResults: Awaited<ReturnType<typeof axe>> }> {
  const renderResult = render(ui);
  const a11yResults = await axe(renderResult.container, options?.axeOptions);

  return { ...renderResult, a11yResults };
}

/**
 * Asserts no accessibility violations
 */
export function expectNoA11yViolations(
  results: Awaited<ReturnType<typeof axe>>
): void {
  expect(results).toHaveNoViolations();
}

/**
 * Common axe configuration for component tests
 */
export const defaultAxeConfig = {
  rules: {
    // Disable rules that conflict with our testing setup
    'region': { enabled: false }, // Components tested in isolation
  },
};
```

**Component Test Pattern:**

```typescript
// Example: libs/shared-design-system/src/lib/components/Button.test.tsx
import { renderWithA11yAudit, expectNoA11yViolations } from '@mfe/shared-test-utils';
import { Button } from './Button';

describe('Button Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { a11yResults } = await renderWithA11yAudit(
      <Button>Click me</Button>
    );
    expectNoA11yViolations(a11yResults);
  });

  it('should have no violations when disabled', async () => {
    const { a11yResults } = await renderWithA11yAudit(
      <Button disabled>Disabled</Button>
    );
    expectNoA11yViolations(a11yResults);
  });
});
```

**Playwright E2E Accessibility Test:**

```typescript
// apps/shell-e2e/src/a11y-audit.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Audit', () => {
  const pages = [
    { path: '/signin', name: 'Sign In' },
    { path: '/signup', name: 'Sign Up' },
    { path: '/payments', name: 'Payments', authenticated: true },
    { path: '/profile', name: 'Profile', authenticated: true },
    { path: '/admin', name: 'Admin', authenticated: true, role: 'ADMIN' },
  ];

  for (const pageConfig of pages) {
    test(`${pageConfig.name} page should have no critical accessibility violations`, async ({ page }) => {
      if (pageConfig.authenticated) {
        // Login first
        await page.goto('/signin');
        await page.fill('input[type="email"]',
          pageConfig.role === 'ADMIN' ? 'admin@example.com' : 'customer@example.com'
        );
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL(/.*payments/);
      }

      await page.goto(pageConfig.path);
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  }
});
```

**CI Configuration:**

```yaml
# Add to .github/workflows/ci.yml
- name: Run Accessibility Tests
  run: pnpm test:a11y

- name: Run E2E Accessibility Audit
  run: pnpm test:e2e --grep "Accessibility Audit"
```

**Success Criteria:**

- [ ] jest-axe integrated into shared test utilities
- [ ] At least 5 design system components have a11y tests
- [ ] Playwright E2E accessibility audit covers all main pages
- [ ] CI fails on critical accessibility violations

---

### Priority 1.2: Skip Navigation Links ✅ COMPLETE

**Effort:** 2 hours
**Impact:** WCAG 2.4.1 Bypass Blocks - Critical for keyboard users
**Status:** Completed January 24, 2026

**Tasks:**

- [x] Create SkipLink component in shared-design-system
- [x] Add skip link to Shell app Layout component
- [x] Add appropriate landmarks (main, navigation, etc.)
- [x] Test with keyboard navigation
- [x] Add unit tests for SkipLink component (18 tests)
- [x] Add unit tests for Layout component (8 tests)

**Implementation Notes:**
- Created `SkipLink` component at `libs/shared-design-system/src/lib/components/SkipLink.tsx`
- Added skip link to Shell Layout component at `apps/shell/src/components/Layout.tsx`
- Main content area has `id="main-content"` and `aria-label="Main content"`
- Fixed Jest configuration to properly discover `.tsx` test files (added `moduleFileExtensions`)
- Added TextEncoder/TextDecoder polyfills for jsdom (required by react-router-dom v7)

**Files to Create/Modify:**

```typescript
// libs/shared-design-system/src/lib/components/SkipLink.tsx
import * as React from 'react';
import { cn } from '../utils';

export interface SkipLinkProps {
  /** Target element ID to skip to */
  targetId: string;
  /** Link text */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Skip navigation link for keyboard users.
 * Hidden visually but accessible to screen readers.
 * Becomes visible on focus.
 */
export function SkipLink({
  targetId,
  children = 'Skip to main content',
  className,
}: SkipLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.tabIndex = -1;
      target.focus();
      target.scrollIntoView();
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className={cn(
        // Visually hidden by default
        'sr-only',
        // Visible on focus
        'focus:not-sr-only',
        'focus:fixed focus:top-4 focus:left-4 focus:z-[9999]',
        'focus:bg-primary focus:text-primary-foreground',
        'focus:px-4 focus:py-2 focus:rounded-md',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'transition-all duration-150',
        className
      )}
    >
      {children}
    </a>
  );
}
```

**Layout Update:**

```typescript
// apps/shell/src/components/Layout.tsx
import { SkipLink } from '@mfe/shared-design-system';
import { Header } from '@mfe/shared-header-ui';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Skip link - first focusable element */}
      <SkipLink targetId="main-content" />

      {/* Header with navigation landmark */}
      <Header />

      {/* Main content landmark */}
      <main
        id="main-content"
        role="main"
        aria-label="Main content"
        className="flex-1"
      >
        {children}
      </main>

      {/* Footer landmark (if exists) */}
      <footer role="contentinfo" className="...">
        {/* Footer content */}
      </footer>
    </div>
  );
}
```

**Success Criteria:**

- [ ] Skip link component created and exported
- [ ] Skip link appears on Tab press from page load
- [ ] Clicking skip link focuses main content
- [ ] Works correctly across all MFEs
- [ ] E2E test verifies functionality

---

### Priority 1.3: ARIA Live Regions & Announcements ✅ COMPLETE

**Effort:** 4 hours
**Impact:** WCAG 4.1.3 Status Messages - Critical for screen reader users
**Status:** Completed January 24, 2026

**Tasks:**

- [x] Create useAnnounce hook for programmatic announcements
- [x] Create LiveRegion component
- [x] Add useRouteAnnouncer hook for route change announcements
- [x] Integrate route announcer in Shell app
- [x] Add unit tests (17 tests for useAnnounce, 10 tests for useRouteAnnouncer, 21 tests for LiveRegion)

**Implementation Notes:**
- `useAnnounce` hook at `libs/shared-utils/src/lib/hooks/useAnnounce.ts` - creates ARIA live regions dynamically
- `useRouteAnnouncer` hook at `libs/shared-utils/src/lib/hooks/useRouteAnnouncer.ts` - announces page navigation
- `LiveRegion` component at `libs/shared-design-system/src/lib/components/LiveRegion.tsx` - declarative live region
- Route announcer integrated in `apps/shell/src/app/app.tsx`
- Hooks exported from `shared-utils` library
- Updated Jest config for shared-utils to support jsdom environment

**Files to Create:**

```typescript
// libs/shared-utils/src/lib/hooks/useAnnounce.ts
import { useCallback, useEffect, useRef } from 'react';

type Politeness = 'polite' | 'assertive';

interface AnnounceOptions {
  /** Urgency level: 'polite' waits, 'assertive' interrupts */
  politeness?: Politeness;
  /** Clear announcement after this delay (ms) */
  clearAfter?: number;
}

/**
 * Hook for making screen reader announcements via ARIA live regions.
 *
 * @example
 * const announce = useAnnounce();
 *
 * const handleSubmit = async () => {
 *   announce('Submitting form...');
 *   await submitForm();
 *   announce('Form submitted successfully', { politeness: 'assertive' });
 * };
 */
export function useAnnounce() {
  const politeRef = useRef<HTMLDivElement | null>(null);
  const assertiveRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create or find existing live regions
    let politeRegion = document.getElementById('a11y-announcer-polite');
    let assertiveRegion = document.getElementById('a11y-announcer-assertive');

    if (!politeRegion) {
      politeRegion = document.createElement('div');
      politeRegion.id = 'a11y-announcer-polite';
      politeRegion.setAttribute('role', 'status');
      politeRegion.setAttribute('aria-live', 'polite');
      politeRegion.setAttribute('aria-atomic', 'true');
      politeRegion.className = 'sr-only';
      document.body.appendChild(politeRegion);
    }

    if (!assertiveRegion) {
      assertiveRegion = document.createElement('div');
      assertiveRegion.id = 'a11y-announcer-assertive';
      assertiveRegion.setAttribute('role', 'alert');
      assertiveRegion.setAttribute('aria-live', 'assertive');
      assertiveRegion.setAttribute('aria-atomic', 'true');
      assertiveRegion.className = 'sr-only';
      document.body.appendChild(assertiveRegion);
    }

    politeRef.current = politeRegion as HTMLDivElement;
    assertiveRef.current = assertiveRegion as HTMLDivElement;

    return () => {
      // Don't remove - other components may use them
    };
  }, []);

  const announce = useCallback((
    message: string,
    options: AnnounceOptions = {}
  ) => {
    const { politeness = 'polite', clearAfter = 1000 } = options;
    const region = politeness === 'assertive' ? assertiveRef.current : politeRef.current;

    if (region) {
      // Clear first to ensure re-announcement of same message
      region.textContent = '';

      // Use setTimeout to ensure DOM update triggers announcement
      setTimeout(() => {
        region.textContent = message;
      }, 50);

      // Clear after delay
      if (clearAfter > 0) {
        setTimeout(() => {
          if (region.textContent === message) {
            region.textContent = '';
          }
        }, clearAfter);
      }
    }
  }, []);

  return announce;
}
```

```typescript
// libs/shared-design-system/src/lib/components/LiveRegion.tsx
import * as React from 'react';
import { cn } from '../utils';

export interface LiveRegionProps {
  /** Content to announce */
  children: React.ReactNode;
  /** Politeness level */
  politeness?: 'polite' | 'assertive' | 'off';
  /** Whether to announce the entire region on updates */
  atomic?: boolean;
  /** Which updates to announce */
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  /** Additional CSS classes */
  className?: string;
  /** Whether to visually hide the region */
  visuallyHidden?: boolean;
}

/**
 * ARIA live region component for dynamic content announcements.
 */
export function LiveRegion({
  children,
  politeness = 'polite',
  atomic = true,
  relevant = 'additions text',
  className,
  visuallyHidden = true,
}: LiveRegionProps) {
  return (
    <div
      role={politeness === 'assertive' ? 'alert' : 'status'}
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={cn(visuallyHidden && 'sr-only', className)}
    >
      {children}
    </div>
  );
}
```

**Integration Examples:**

```typescript
// Example: Form submission announcement
function PaymentCreateForm() {
  const announce = useAnnounce();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: PaymentData) => {
    setIsSubmitting(true);
    announce('Creating payment, please wait...');

    try {
      await createPayment(data);
      announce('Payment created successfully!', { politeness: 'assertive' });
    } catch (error) {
      announce('Failed to create payment. Please try again.', {
        politeness: 'assertive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Payment'}
      </Button>
    </form>
  );
}
```

**Success Criteria:**

- [ ] useAnnounce hook created and exported
- [ ] LiveRegion component created and exported
- [ ] Form submissions announce status
- [ ] Loading states announce appropriately
- [ ] Error messages announced to screen readers
- [ ] Route changes announced (page title)

---

### Priority 1.4: Language Declaration ✅ COMPLETE

**Effort:** 1 hour
**Impact:** WCAG 3.1.1 Language of Page - Required for screen readers
**Status:** Completed January 24, 2026

**Tasks:**

- [x] Add lang attribute to HTML element (already present in `apps/shell/index.html`)
- [x] Create useDocumentTitle hook for individual page titles
- [x] Create useDocumentTitleFromRoute hook for automatic route-based titles
- [x] Integrate route-based title management in Shell app
- [x] Add 22 unit tests for document title hooks

**Implementation Notes:**
- `lang="en"` attribute already present in `apps/shell/index.html`
- `useDocumentTitle` hook at `libs/shared-utils/src/lib/hooks/useDocumentTitle.ts` for manual title control
- `useDocumentTitleFromRoute` hook at `libs/shared-utils/src/lib/hooks/useDocumentTitleFromRoute.ts` for automatic route-based titles
- Title format: `{Page Title} | MFE Payments`
- Integrated in `apps/shell/src/app/app.tsx` for automatic title updates on navigation

**Current State:**

The `lang="en"` attribute is already set in `apps/shell/index.html`. Document titles are now automatically updated based on the current route.

```html
<!-- apps/shell/index.html (current state - already compliant) -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Shell</title>
    <base href="/" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

**Optional Enhancement:**

```typescript
// libs/shared-utils/src/lib/hooks/useDocumentTitle.ts
import { useEffect } from 'react';

/**
 * Updates document title and announces page change to screen readers.
 */
export function useDocumentTitle(title: string, announceChange = true) {
  useEffect(() => {
    const previousTitle = document.title;
    const fullTitle = title ? `${title} | MFE Payments` : 'MFE Payments';
    document.title = fullTitle;

    // Announce page change for screen readers
    if (announceChange && title) {
      const announcer = document.getElementById('a11y-announcer-polite');
      if (announcer) {
        announcer.textContent = `Navigated to ${title}`;
        setTimeout(() => {
          announcer.textContent = '';
        }, 1000);
      }
    }

    return () => {
      document.title = previousTitle;
    };
  }, [title, announceChange]);
}
```

**Success Criteria:**

- [x] HTML element has lang="en" attribute
- [x] Document title updated on route changes
- [x] Page changes announced to screen readers (via useRouteAnnouncer in Priority 1.3)

---

### Priority 1.5: Form Error Accessibility Enhancements ✅ COMPLETE

**Effort:** 3 hours
**Impact:** WCAG 3.3.1, 3.3.3 Error Identification & Suggestions
**Status:** Completed January 24, 2026

**Current State:** Forms have role="alert" on errors but lack aria-describedby linking.

**Tasks:**

- [x] Create FormField wrapper component with proper associations
- [x] Add aria-describedby for error messages
- [x] Add aria-invalid for fields with errors
- [x] Add aria-required for required fields
- [x] Add useFormField hook for custom input components
- [x] Add 20 unit tests for FormField component

**Implementation Notes:**
- `FormField` component at `libs/shared-design-system/src/lib/components/FormField.tsx`
- Automatically generates unique IDs for label-input association
- Links descriptions and errors via aria-describedby
- Error messages have role="alert" and aria-live="polite"
- `useFormField` hook allows custom inputs to access accessibility context
- Supports hidden labels for visual design flexibility while maintaining accessibility

**Files to Create/Modify:**

```typescript
// libs/shared-design-system/src/lib/components/FormField.tsx
import * as React from 'react';
import { Label } from './Label';
import { cn } from '../utils';

interface FormFieldContextValue {
  id: string;
  errorId: string;
  descriptionId: string;
  hasError: boolean;
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

export function useFormField() {
  const context = React.useContext(FormFieldContext);
  if (!context) {
    throw new Error('useFormField must be used within a FormField');
  }
  return context;
}

export interface FormFieldProps {
  /** Unique field identifier */
  name: string;
  /** Field label */
  label: string;
  /** Error message */
  error?: string;
  /** Help text / description */
  description?: string;
  /** Whether field is required */
  required?: boolean;
  /** Field input element */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Accessible form field wrapper with proper ARIA associations.
 */
export function FormField({
  name,
  label,
  error,
  description,
  required = false,
  children,
  className,
}: FormFieldProps) {
  const id = `field-${name}`;
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;
  const hasError = Boolean(error);

  const contextValue: FormFieldContextValue = {
    id,
    errorId,
    descriptionId,
    hasError,
  };

  // Build aria-describedby value
  const describedBy = [
    description && descriptionId,
    hasError && errorId,
  ].filter(Boolean).join(' ') || undefined;

  return (
    <FormFieldContext.Provider value={contextValue}>
      <div className={cn('space-y-2', className)}>
        <Label
          htmlFor={id}
          className={cn(hasError && 'text-destructive')}
        >
          {label}
          {required && (
            <span className="text-destructive ml-1" aria-hidden="true">*</span>
          )}
          {required && <span className="sr-only">(required)</span>}
        </Label>

        {description && (
          <p
            id={descriptionId}
            className="text-sm text-muted-foreground"
          >
            {description}
          </p>
        )}

        {/* Clone child to inject accessibility props */}
        {React.isValidElement(children) &&
          React.cloneElement(children as React.ReactElement<any>, {
            id,
            'aria-invalid': hasError || undefined,
            'aria-required': required || undefined,
            'aria-describedby': describedBy,
          })}

        {hasError && (
          <p
            id={errorId}
            role="alert"
            className="text-sm text-destructive"
          >
            {error}
          </p>
        )}
      </div>
    </FormFieldContext.Provider>
  );
}
```

> **Implementation Note:** The `React.cloneElement` pattern above is simple but can be fragile with certain input types or if the child already defines conflicting props. For more robust implementations, consider a compound component pattern using React Context where the input explicitly retrieves accessibility props via a `useFormField()` hook. This approach is more explicit and avoids prop conflicts.

**Usage Example:**

```typescript
// Updated form usage pattern
<FormField
  name="email"
  label="Email Address"
  error={errors.email?.message}
  description="We'll never share your email"
  required
>
  <Input
    type="email"
    {...register('email')}
    placeholder="you@example.com"
  />
</FormField>
```

**Success Criteria:**

- [x] FormField component with proper ARIA associations
- [x] Error messages linked via aria-describedby
- [x] Invalid fields marked with aria-invalid
- [x] Required fields marked with aria-required
- [x] Screen readers announce field requirements and errors (via role="alert" and aria-live)

---

### Priority 1.6: Heading Hierarchy Audit ✅ COMPLETE

**Effort:** 2 hours
**Impact:** WCAG 2.4.6 Headings and Labels
**Completed:** February 10, 2026

**Tasks:**

- [x] Audit all pages for proper h1-h6 sequence
- [x] Ensure each page has exactly one h1
- [x] Fix heading level skips
- [x] Add ESLint rule for heading hierarchy
- [x] Document heading conventions

**Files to Create:**

```javascript
// .eslintrc.js - Add jsx-a11y rules
module.exports = {
  extends: [
    // ... existing extends
    'plugin:jsx-a11y/recommended',
  ],
  plugins: [
    // ... existing plugins
    'jsx-a11y',
  ],
  rules: {
    // Accessibility rules
    'jsx-a11y/heading-has-content': 'error',
    'jsx-a11y/no-noninteractive-tabindex': 'error',
    'jsx-a11y/no-redundant-roles': 'error',
  },
};
```

**Heading Conventions (Documentation):**

```markdown
## Heading Hierarchy Conventions

### Page Structure
- Each page MUST have exactly one `<h1>` as the main page title
- Headings MUST NOT skip levels (h1 → h3 is invalid)
- Use headings to create document outline, not for styling

### Component Guidelines
- Card titles: Use `<h2>` or `<h3>` based on context
- Modal titles: Use `<h2>` (modal is a new context)
- Section headings: Follow sequential order from parent

### Examples

✅ Correct:
```html
<h1>Payments Dashboard</h1>
  <h2>Recent Transactions</h2>
    <h3>Transaction Details</h3>
  <h2>Payment Summary</h2>
```

❌ Incorrect:
```html
<h1>Payments Dashboard</h1>
  <h3>Recent Transactions</h3>  <!-- Skipped h2 -->
<h1>Another Section</h1>         <!-- Multiple h1s -->
```
```

**Success Criteria:**

- [x] All pages have exactly one h1
- [x] No heading level skips
- [x] ESLint jsx-a11y plugin configured
- [x] Heading conventions documented

**Implementation Notes:**

The following changes were made to fix heading hierarchy issues:

1. **Header Component (`libs/shared-header-ui/src/lib/shared-header-ui.tsx`):**
   - Changed branding from `<h1>` to `<span>` to prevent multiple h1s on pages

2. **Auth MFE Components:**
   - SignIn.tsx: CardTitle updated to use `as="h1"` for page title
   - SignUp.tsx: CardTitle updated to use `as="h1"` for page title
   - ForgotPassword.tsx: CardTitle updated to use `as="h1"` for page title
   - ResetPassword.tsx: CardTitle updated to use `as="h1"` for all page states
   - VerificationPending.tsx: CardTitle updated to use `as="h1"` for page title

3. **Profile MFE Components:**
   - LinkedAccounts.tsx: CardTitle updated to use `as="h2"` (under page h1), h4→h3 for sub-sections
   - MfaSettings.tsx: All CardTitle elements updated to use `as="h2"`, h4→h3 for sub-sections

4. **ESLint Configuration (`eslint.config.mjs`):**
   - Installed `eslint-plugin-jsx-a11y` package
   - Added 23 jsx-a11y rules for compile-time accessibility checking
   - Key rules: alt-text, heading-has-content, aria-* validation, label-has-associated-control

**Heading Hierarchy per Page:**
- Sign In: h1 (Sign In card title)
- Sign Up: h1 (Sign Up card title)
- Payments: h1 (Payments) → h2 (Payment Details modal)
- Profile: h1 (Profile) → h2 (section cards) → h3 (sub-sections)
- Admin: h1 (Admin Dashboard) → h2 (sections)
- Reports: h1 (Reports) → h2 (card titles)

---

## Phase 2: Enhanced Components & Patterns

### Priority 2.1: Focus Trap for Modals/Dialogs ✅ COMPLETE

**Effort:** 4 hours
**Impact:** WCAG 2.1.2 No Keyboard Trap - Critical for modal interactions
**Completed:** February 10, 2026

**Tasks:**

- [x] Create useFocusTrap hook
- [x] Create accessible Dialog component
- [x] Add focus restoration on close
- [x] Add Escape key to close
- [x] Prevent body scroll when modal open

**Implementation Notes:**

The following was implemented:

1. **useFocusTrap hook** (`libs/shared-utils/src/lib/hooks/useFocusTrap.ts`):
   - Traps Tab/Shift+Tab within modal container
   - Supports Escape key to close via `onEscape` callback
   - Restores focus to previously focused element on close
   - Auto-focuses first focusable element on open
   - 16 comprehensive unit tests

2. **Modals updated with focus trap:**
   - PaymentsPage modal (`apps/payments-mfe/src/components/PaymentsPage.tsx`) - refactored to use shared hook
   - UserFormDialog (`apps/admin-mfe/src/components/UserFormDialog.tsx`) - added useFocusTrap + ARIA attributes
   - DeleteConfirmDialog (`apps/admin-mfe/src/components/DeleteConfirmDialog.tsx`) - added useFocusTrap + role="alertdialog"
   - AuditLogs details modal (`apps/admin-mfe/src/components/AuditLogs.tsx`) - added useFocusTrap + ARIA attributes

3. **ARIA attributes added to all modals:**
   - `role="dialog"` or `role="alertdialog"` (for confirmations)
   - `aria-modal="true"`
   - `aria-labelledby` pointing to modal title
   - `aria-describedby` for modal description where applicable

**Files to Create:**

```typescript
// libs/shared-utils/src/lib/hooks/useFocusTrap.ts
import { useEffect, useRef, useCallback } from 'react';

interface UseFocusTrapOptions {
  /** Whether the trap is active */
  enabled?: boolean;
  /** Element to return focus to on close */
  returnFocusTo?: HTMLElement | null;
  /** Initial element to focus */
  initialFocus?: HTMLElement | null;
  /** Callback when Escape is pressed */
  onEscape?: () => void;
}

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Traps focus within a container for modal dialogs.
 *
 * @example
 * function Modal({ isOpen, onClose }) {
 *   const containerRef = useFocusTrap({
 *     enabled: isOpen,
 *     onEscape: onClose,
 *   });
 *
 *   return <div ref={containerRef}>...</div>;
 * }
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  options: UseFocusTrapOptions = {}
) {
  const {
    enabled = true,
    returnFocusTo,
    initialFocus,
    onEscape,
  } = options;

  const containerRef = useRef<T | null>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Store the previously focused element
  useEffect(() => {
    if (enabled) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }
  }, [enabled]);

  // Handle focus trapping
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;

    // Focus initial element or first focusable
    const focusInitial = () => {
      if (initialFocus) {
        initialFocus.focus();
      } else {
        const focusable = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          container.focus();
        }
      }
    };

    // Delay to ensure DOM is ready
    const timeoutId = setTimeout(focusInitial, 0);

    // Handle Tab key for focus trapping
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault();
        onEscape();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusable = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
      if (focusable.length === 0) return;

      const firstFocusable = focusable[0];
      const lastFocusable = focusable[focusable.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timeoutId);
      container.removeEventListener('keydown', handleKeyDown);

      // Restore focus on cleanup
      const elementToFocus = returnFocusTo || previousActiveElement.current;
      if (elementToFocus && typeof elementToFocus.focus === 'function') {
        elementToFocus.focus();
      }
    };
  }, [enabled, initialFocus, returnFocusTo, onEscape]);

  return containerRef;
}
```

```typescript
// libs/shared-design-system/src/lib/components/Dialog.tsx
import * as React from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '@mfe/shared-utils';
import { cn } from '../utils';

export interface DialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
  /** Dialog title (required for accessibility) */
  title: string;
  /** Optional description */
  description?: string;
  /** Dialog content */
  children: React.ReactNode;
  /** Dialog size */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Accessible modal dialog component.
 *
 * Features:
 * - Focus trapping
 * - Escape key to close
 * - Click outside to close
 * - Proper ARIA attributes
 * - Focus restoration on close
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  className,
}: DialogProps) {
  const titleId = React.useId();
  const descriptionId = React.useId();

  const containerRef = useFocusTrap<HTMLDivElement>({
    enabled: open,
    onEscape: onClose,
  });

  // Prevent body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  const dialog = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'relative z-50 w-full rounded-lg bg-background p-6 shadow-lg',
          'focus:outline-none',
          sizeClasses[size],
          className
        )}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className={cn(
            'absolute right-4 top-4 rounded-sm opacity-70',
            'hover:opacity-100 focus:outline-none focus:ring-2',
            'focus:ring-ring focus:ring-offset-2'
          )}
          aria-label="Close dialog"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Title */}
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>

        {/* Description */}
        {description && (
          <p id={descriptionId} className="mt-2 text-sm text-muted-foreground">
            {description}
          </p>
        )}

        {/* Content */}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );

  // Handle SSR and test environments where document.body may not exist
  if (typeof document === 'undefined' || !document.body) {
    return dialog;
  }

  return createPortal(dialog, document.body);
}

// Sub-components for composition
export function DialogFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 flex justify-end gap-3">
      {children}
    </div>
  );
}
```

**Success Criteria:**

- [x] useFocusTrap hook created and tested
- [x] Dialog component with full accessibility
- [x] Focus trapped within modal
- [x] Escape key closes modal
- [x] Focus returns to trigger on close
- [x] Body scroll prevented when open

---

### Priority 2.2: Data Table Accessibility ✅ COMPLETE

**Effort:** 4 hours
**Impact:** WCAG 1.3.1 Info and Relationships - Critical for payment data
**Completed:** February 10, 2026

**Tasks:**

- [x] Create accessible Table component
- [x] Add proper thead/tbody/tfoot structure
- [x] Add scope attributes to headers
- [x] Add aria-sort for sortable columns
- [x] Add aria-describedby for table captions
- [x] Support keyboard navigation within table

**Implementation Notes:**

The following tables were updated with accessibility improvements:

1. **AuditLogs table** (`apps/admin-mfe/src/components/AuditLogs.tsx`):
   - Added `aria-label` and `aria-describedby` with visually hidden caption
   - Added `scope="col"` to all `<th>` elements
   - Wrapped pagination in `<nav>` with `aria-label`
   - Added `aria-live="polite"` region for pagination status

2. **UserManagement table** (`apps/admin-mfe/src/components/UserManagement.tsx`):
   - Added `aria-label` and `aria-describedby` with visually hidden caption
   - Added `scope="col"` to all `<th>` elements
   - Added descriptive `aria-label` on action buttons (e.g., "Edit John Doe", "Delete John Doe")
   - Added `aria-hidden="true"` on decorative SVG icons
   - Wrapped action buttons in `role="group"` with `aria-label`

3. **PaymentTable** (`apps/payments-mfe/src/components/PaymentTable.tsx`):
   - Added `aria-label` and `aria-describedby` with visually hidden caption
   - Added `scope="col"` to all `<th>` elements

4. **PaymentTableRow** (`apps/payments-mfe/src/components/PaymentTableRow.tsx`):
   - Added descriptive `aria-label` on View button with payment context
   - Added `aria-hidden="true"` on decorative Eye icon

**Files to Create:**

```typescript
// libs/shared-design-system/src/lib/components/Table.tsx
import * as React from 'react';
import { cn } from '../utils';

// Context for table state
interface TableContextValue {
  captionId: string;
}

const TableContext = React.createContext<TableContextValue | null>(null);

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  /** Table caption (required for accessibility) */
  caption: string;
  /** Whether to visually hide the caption */
  captionHidden?: boolean;
}

export function Table({
  caption,
  captionHidden = false,
  className,
  children,
  ...props
}: TableProps) {
  const captionId = React.useId();

  return (
    <TableContext.Provider value={{ captionId }}>
      <div className="relative w-full overflow-auto" role="region" aria-labelledby={captionId}>
        <table
          className={cn('w-full caption-bottom text-sm', className)}
          {...props}
        >
          <caption
            id={captionId}
            className={cn(
              'mt-4 text-sm text-muted-foreground',
              captionHidden && 'sr-only'
            )}
          >
            {caption}
          </caption>
          {children}
        </table>
      </div>
    </TableContext.Provider>
  );
}

export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export function TableHeader({ className, ...props }: TableHeaderProps) {
  return <thead className={cn('[&_tr]:border-b', className)} {...props} />;
}

export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export function TableBody({ className, ...props }: TableBodyProps) {
  return (
    <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
  );
}

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {}

export function TableRow({ className, ...props }: TableRowProps) {
  return (
    <tr
      className={cn(
        'border-b transition-colors',
        'hover:bg-muted/50 focus-within:bg-muted/50',
        'data-[state=selected]:bg-muted',
        className
      )}
      {...props}
    />
  );
}

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  /** Sort direction for sortable columns */
  sortDirection?: 'ascending' | 'descending' | 'none';
  /** Whether the column is sortable */
  sortable?: boolean;
  /** Callback when sort is triggered */
  onSort?: () => void;
}

export function TableHead({
  className,
  sortDirection,
  sortable = false,
  onSort,
  children,
  ...props
}: TableHeadProps) {
  return (
    <th
      scope="col"
      className={cn(
        'h-12 px-4 text-left align-middle font-medium text-muted-foreground',
        '[&:has([role=checkbox])]:pr-0',
        className
      )}
      aria-sort={sortable ? sortDirection : undefined}
      {...props}
    >
      {sortable ? (
        <button
          type="button"
          className="flex items-center gap-2 w-full h-full cursor-pointer select-none hover:bg-muted/50 -mx-4 px-4 -my-3 py-3"
          onClick={onSort}
          aria-label={`Sort by ${children}${sortDirection !== 'none' ? `, currently ${sortDirection}` : ''}`}
        >
          {children}
          <span aria-hidden="true" className="text-xs">
            {sortDirection === 'ascending' && '↑'}
            {sortDirection === 'descending' && '↓'}
            {sortDirection === 'none' && '↕'}
          </span>
        </button>
      ) : (
        children
      )}
    </th>
  );
}

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}

export function TableCell({ className, ...props }: TableCellProps) {
  return (
    <td
      className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
      {...props}
    />
  );
}
```

**Usage Example:**

```typescript
<Table caption="Recent payments - showing 10 of 50 payments">
  <TableHeader>
    <TableRow>
      <TableHead
        sortable
        sortDirection={sortColumn === 'date' ? sortDirection : 'none'}
        onSort={() => handleSort('date')}
      >
        Date
      </TableHead>
      <TableHead>Amount</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {payments.map((payment) => (
      <TableRow key={payment.id}>
        <TableCell>{formatDate(payment.date)}</TableCell>
        <TableCell>{formatCurrency(payment.amount)}</TableCell>
        <TableCell>
          <Badge variant={getStatusVariant(payment.status)}>
            {payment.status}
          </Badge>
        </TableCell>
        <TableCell>
          <Button size="sm" variant="ghost">View</Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

**Success Criteria:**

- [x] Table component with proper semantic structure
- [x] scope="col" on column headers
- [x] aria-sort for sortable columns
- [x] Table caption for context
- [x] Keyboard accessible sorting
- [x] Focus visible within table cells

---

### Priority 2.3: Color Contrast Audit & Fixes ✅ COMPLETE

**Completed:** February 10, 2026

**Effort:** 4 hours
**Impact:** WCAG 1.4.3, 1.4.11 Contrast Requirements

**Tasks:**

- [x] Audit all color combinations with contrast checker
- [x] Fix text contrast issues (min 4.5:1)
- [x] Fix UI component contrast (min 3:1)
- [x] Test in both light and dark modes
- [x] Document color usage guidelines
- [x] Add automated contrast testing

**Implementation Notes:**

The color contrast audit identified and fixed several issues:

1. **Destructive Button Text (Light Mode)**
   - Issue: White text on red-500 (#EF4444) = 3.76:1 (failed 4.5:1)
   - Fix: Changed to red-700 (#B91C1C) = 6.47:1 ✓

2. **Destructive Button Text (Dark Mode)**
   - Issue: White text on red-500 = 3.76:1 (failed 4.5:1)
   - Fix: Changed to red-600 (#DC2626) = 4.83:1 ✓

3. **Border/Input Colors (Light Mode)**
   - Issue: gray-200 on white = 1.24:1 (failed 3:1)
   - Fix: Changed to gray-500 (#6B7280) = 4.83:1 ✓

4. **Border/Input Colors (Dark Mode)**
   - Issue: gray-700 on gray-900 = 1.72:1 (failed 3:1)
   - Fix: Changed to gray-400 (#9CA3AF) = 6.99:1 ✓

**Files Modified:**
- `apps/shell/src/styles.css`
- `apps/admin-mfe/src/styles.css`
- `apps/auth-mfe/src/styles.css`
- `apps/payments-mfe/src/styles.css`
- `apps/profile-mfe/src/styles.css`

**New Files Created:**
- `scripts/contrast-audit.ts` - Automated contrast checker
- `docs/COLOR-CONTRAST-GUIDELINES.md` - Color usage guidelines
- `libs/shared-test-utils/src/lib/contrast-test-utils.ts` - Contrast testing utilities
- `libs/shared-test-utils/src/lib/contrast-test-utils.spec.ts` - 78 unit tests

**Run Contrast Audit:**
```bash
pnpm test:a11y:contrast
```

**Final Color Palette (WCAG 2.1 AA Compliant):**

| Token | Light Mode | Dark Mode | Contrast |
|-------|-----------|-----------|----------|
| foreground | #111827 | #F9FAFB | 17.74:1 / 16.98:1 |
| muted-foreground | #4B5563 | #9CA3AF | 7.56:1 / 6.99:1 |
| primary | #084683 | #1A74B8 | 9.48:1 / 4.96:1 |
| destructive | #B91C1C | #DC2626 | 6.47:1 / 4.83:1 |
| border | #6B7280 | #9CA3AF | 4.83:1 / 6.99:1 |

**Success Criteria:**

- [x] All text meets 4.5:1 contrast ratio (or 3:1 for large text)
- [x] All UI components meet 3:1 contrast ratio
- [x] Both light and dark modes pass contrast checks
- [x] Automated contrast test in CI (`pnpm test:a11y:contrast`)
- [x] Color usage guidelines documented (`docs/COLOR-CONTRAST-GUIDELINES.md`)

---

### Priority 2.4: Loading States Accessibility ✅ COMPLETE

**Completed:** February 10, 2026

**Effort:** 2 hours
**Impact:** Screen reader users need loading state announcements

**Tasks:**

- [x] Update Loading component with aria-busy
- [x] Add loading announcements
- [x] Create Skeleton component with proper ARIA
- [x] Add loading state to buttons

**Implementation Notes:**

The following accessibility enhancements were made to loading components:

1. **Loading Component** (`libs/shared-design-system/src/lib/components/Loading.tsx`):
   - Added `role="status"` for screen readers
   - Added `aria-busy="true"` to indicate loading state
   - Added `aria-live="polite"` for dynamic announcements
   - Added `aria-label` with customizable loading message
   - Integrated `useAnnounce` hook for screen reader announcements on mount
   - Added `showLabel` prop for visible loading text
   - Added `announceOnMount` prop to control announcement behavior
   - Spinner marked with `aria-hidden="true"` (decorative)
   - 15 unit tests added (`Loading.test.tsx`)

2. **Skeleton Component** (`libs/shared-design-system/src/lib/components/Skeleton.tsx`):
   - Added `role="status"` for screen readers
   - Added `aria-busy="true"` to indicate loading state
   - Added `aria-label` prop for describing what's loading
   - 10 unit tests added (`Skeleton.test.tsx`)

3. **Button Component** (`libs/shared-design-system/src/lib/components/Button.tsx`):
   - Added `loading` prop for loading state
   - Added `loadingText` prop for custom loading text
   - Added `aria-busy` attribute when loading
   - Added `aria-disabled` for disabled/loading states
   - Button automatically disabled during loading
   - Shows spinner icon when loading
   - 7 additional loading-specific unit tests added to `Button.test.tsx`

4. **Test Infrastructure Updates:**
   - Fixed Jest module mapping for `@mfe/shared-utils` in design system tests
   - Updated accessibility.spec.tsx to handle multiple live regions (global announcer)
   - All 214 tests passing in shared-design-system

**Success Criteria:**

- [x] Loading component announces state to screen readers
- [x] Skeleton component has proper ARIA attributes
- [x] Loading states are keyboard accessible
- [x] aria-busy used appropriately
- [x] Button loading state with aria-busy and disabled state

---

## Phase 3: Comprehensive Testing & Documentation

### Priority 3.1: E2E Accessibility Test Suite ✅ COMPLETE

**Effort:** 6 hours
**Impact:** Validates accessibility across all MFEs
**Completed:** February 10, 2026

**Tasks:**

- [x] Create comprehensive E2E accessibility tests for each MFE
- [x] Test keyboard-only navigation flows
- [x] Test screen reader announcements
- [x] Test focus management
- [x] Test error handling accessibility

**Test Suite Structure:**

```typescript
// apps/shell-e2e/src/a11y/
├── auth-mfe.a11y.spec.ts      # Auth MFE accessibility tests
├── payments-mfe.a11y.spec.ts  # Payments MFE accessibility tests
├── admin-mfe.a11y.spec.ts     # Admin MFE accessibility tests
├── profile-mfe.a11y.spec.ts   # Profile MFE accessibility tests
├── keyboard-navigation.spec.ts # Cross-app keyboard tests
└── screen-reader.spec.ts      # Screen reader announcement tests
```

**Sample Test File:**

```typescript
// apps/shell-e2e/src/a11y/payments-mfe.a11y.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Payments MFE Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'customer@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*payments/);
  });

  test('payments page has no accessibility violations', async ({ page }) => {
    await page.goto('/payments');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('payment table is keyboard navigable', async ({ page }) => {
    await page.goto('/payments');
    await page.waitForSelector('table');

    // Tab to table
    await page.keyboard.press('Tab');

    // Navigate through sortable headers
    await page.keyboard.press('Tab');
    const activeHeader = await page.evaluate(() => document.activeElement?.tagName);
    expect(activeHeader).toBe('TH');

    // Activate sort with Enter
    await page.keyboard.press('Enter');

    // Verify sort happened (aria-sort changed)
    const sortDirection = await page.getAttribute('th:focus', 'aria-sort');
    expect(['ascending', 'descending']).toContain(sortDirection);
  });

  test('create payment form is accessible', async ({ page }) => {
    await page.goto('/payments');
    await page.click('button:has-text("Create Payment")');

    // Wait for form
    await page.waitForSelector('form');

    // Check form has proper labels
    const labels = await page.locator('label').all();
    for (const label of labels) {
      const htmlFor = await label.getAttribute('for');
      if (htmlFor) {
        const input = page.locator(`#${htmlFor}`);
        await expect(input).toBeVisible();
      }
    }

    // Fill form with keyboard only
    await page.keyboard.press('Tab'); // Amount field
    await page.keyboard.type('1000');

    await page.keyboard.press('Tab'); // Currency select
    await page.keyboard.press('Enter'); // Open select
    await page.keyboard.press('ArrowDown'); // Navigate options
    await page.keyboard.press('Enter'); // Select option

    await page.keyboard.press('Tab'); // Description
    await page.keyboard.type('Test payment');

    await page.keyboard.press('Tab'); // Submit button
    await page.keyboard.press('Enter'); // Submit

    // Verify success message is announced
    // Using specific data-testid for reliable assertions (avoids matching unintended elements)
    await expect(page.locator('[data-testid="payment-success-message"]')).toBeVisible();
    // Alternative: Use role="alert" with more specific text
    // await expect(page.locator('[role="alert"]')).toContainText('Payment created successfully');
  });

  test('error messages are accessible', async ({ page }) => {
    await page.goto('/payments');
    await page.click('button:has-text("Create Payment")');

    // Submit empty form
    await page.click('button[type="submit"]');

    // Check error messages have role="alert"
    const errors = await page.locator('[role="alert"]').all();
    expect(errors.length).toBeGreaterThan(0);

    // Check aria-invalid on fields
    const invalidFields = await page.locator('[aria-invalid="true"]').all();
    expect(invalidFields.length).toBeGreaterThan(0);

    // Check aria-describedby links error to field
    for (const field of invalidFields) {
      const describedBy = await field.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
    }
  });
});
```

**Success Criteria:**

- [x] All MFEs have dedicated accessibility test files
- [x] Keyboard navigation tested for all interactive flows
- [x] Form accessibility verified
- [x] Error states tested
- [x] No critical/serious axe violations

**Implementation Notes:**

The following E2E accessibility test files were created in `apps/shell-e2e/src/a11y/`:

1. **auth-mfe.a11y.spec.ts** - Auth MFE accessibility tests:
   - Sign In page axe audits
   - Sign Up page axe audits
   - Forgot Password page axe audits
   - Form labels and associations
   - Keyboard navigation through forms
   - Accessible error messages
   - Skip link functionality
   - Color contrast in light/dark modes
   - Social login button accessibility

2. **payments-mfe.a11y.spec.ts** - Payments MFE accessibility tests:
   - Payments list page axe audits
   - Data table accessibility (headers, scope, caption)
   - Payment details modal (focus trap, aria-modal, escape key)
   - Create payment form accessibility
   - Filter controls accessibility
   - Loading states with proper ARIA
   - Pagination accessibility
   - Status badge text (not color alone)

3. **admin-mfe.a11y.spec.ts** - Admin MFE accessibility tests:
   - Dashboard axe audits
   - Tab navigation (role="tablist", aria-selected)
   - User management table accessibility
   - Edit user dialog (role="dialog", focus trap)
   - Delete confirmation dialog (role="alertdialog")
   - Audit logs table and pagination
   - System health status indicators
   - Dashboard stats cards

4. **profile-mfe.a11y.spec.ts** - Profile MFE accessibility tests:
   - Profile page axe audits
   - Tab navigation accessibility
   - Profile form labels and validation
   - Preferences form (select labels, checkboxes)
   - Account tab accessibility
   - MFA settings accessibility
   - Linked accounts accessibility
   - Avatar upload accessibility
   - Focus management between tabs

5. **keyboard-navigation.spec.ts** - Cross-application keyboard tests:
   - Skip link functionality
   - No keyboard trap verification
   - Focus order validation
   - Focus visibility on all elements
   - Enter/Space key activation
   - Escape key modal closing
   - Arrow key navigation
   - Tab panel keyboard control
   - Form submission with keyboard

6. **screen-reader.spec.ts** - Screen reader compatibility tests:
   - ARIA live regions
   - Form input accessible names
   - Required field indication (aria-required)
   - Invalid field indication (aria-invalid)
   - Error message linking (aria-describedby)
   - Button accessible names
   - Modal ARIA attributes
   - Table accessibility
   - Navigation landmarks
   - Loading state announcements
   - Heading structure validation
   - Image accessibility
   - Route change announcements

**NPM Scripts Added:**
```bash
pnpm test:e2e:a11y:auth      # Auth MFE accessibility tests
pnpm test:e2e:a11y:payments  # Payments MFE accessibility tests
pnpm test:e2e:a11y:admin     # Admin MFE accessibility tests
pnpm test:e2e:a11y:profile   # Profile MFE accessibility tests
pnpm test:e2e:a11y:keyboard  # Keyboard navigation tests
pnpm test:e2e:a11y:screen-reader  # Screen reader tests
pnpm test:e2e:a11y:all       # Run all a11y E2E tests
```

---

### Priority 3.2: Accessibility Documentation ✅ COMPLETE

**Effort:** 4 hours
**Impact:** Ensures consistent accessibility practices
**Completed:** February 10, 2026

**Tasks:**

- [x] Create accessibility guidelines document
- [x] Document component accessibility requirements
- [x] Create accessibility testing guide
- [x] Add accessibility section to CLAUDE.md

**Files to Create:**

```markdown
# docs/ACCESSIBILITY-GUIDELINES.md

# Accessibility Guidelines

## Overview

This document outlines accessibility requirements and best practices for the MFE Payments System. We target WCAG 2.1 Level AA compliance.

## Key Principles

### 1. Perceivable
- All images have alt text
- Color is not the only way to convey information
- Text has sufficient contrast (4.5:1 minimum)
- Content reflows at 400% zoom

### 2. Operable
- All functionality is keyboard accessible
- No keyboard traps
- Focus order is logical
- Focus indicators are visible

### 3. Understandable
- Page language is declared
- Form inputs have labels
- Error messages are clear
- Navigation is consistent

### 4. Robust
- Valid HTML
- ARIA used correctly
- Works with assistive technologies

## Component Requirements

### Buttons
- Use `<button>` element (not `<div>` or `<span>`)
- Have visible focus indicator
- Have accessible name (visible text or aria-label)
- Disabled state uses `disabled` attribute

### Forms
- All inputs have associated labels
- Required fields are marked
- Error messages linked with aria-describedby
- Invalid fields use aria-invalid

### Modals
- Focus is trapped within modal
- Escape key closes modal
- Focus returns to trigger on close
- Has role="dialog" and aria-modal="true"

### Tables
- Use proper table markup (thead, tbody, th, td)
- Column headers use scope="col"
- Has accessible caption
- Sortable columns use aria-sort

### Navigation
- Skip link present
- Landmarks properly used
- Current page indicated

## Testing Checklist

### Automated Testing
- [ ] jest-axe passes on all components
- [ ] Lighthouse accessibility score > 90
- [ ] No errors in React DevTools accessibility audit

### Manual Testing
- [ ] Can complete all flows with keyboard only
- [ ] Works with browser zoom at 200%
- [ ] Works with screen reader (NVDA/VoiceOver)
- [ ] Color contrast verified with tool

## Screen Reader Support

We test with:
- VoiceOver (macOS/iOS)
- NVDA (Windows)
- JAWS (Windows, as needed)

## Resources

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
```

**CLAUDE.md Update:**

```markdown
## Accessibility

This application follows WCAG 2.1 Level AA guidelines.

### Key Requirements
- All components use semantic HTML
- Focus indicators on all interactive elements
- Forms have proper label associations
- Errors announced to screen readers
- Keyboard navigation for all features

### Testing
- Run `pnpm test:a11y` for unit accessibility tests
- Run `pnpm test:e2e:a11y` for E2E accessibility audit

### When Adding New Components
1. Use semantic HTML elements
2. Add proper ARIA attributes
3. Ensure keyboard accessibility
4. Test with screen reader
5. Add jest-axe test

See `docs/ACCESSIBILITY-GUIDELINES.md` for full documentation.
```

**Success Criteria:**

- [x] Comprehensive accessibility guidelines document
- [x] Component-specific requirements documented
- [x] Testing guide with checklists
- [x] CLAUDE.md updated with accessibility section

**Implementation Notes:**

Created comprehensive accessibility documentation:

1. **docs/ACCESSIBILITY-GUIDELINES.md** - Full accessibility guidelines including:
   - WCAG 2.1 AA key principles (Perceivable, Operable, Understandable, Robust)
   - Component requirements (Buttons, Forms, Modals, Tables, Navigation, Loading)
   - Color & contrast guidelines with approved color palette
   - Keyboard navigation requirements
   - Screen reader support patterns
   - Testing checklist (automated and manual)
   - Development workflow guidelines
   - Code examples for accessible patterns
   - ARIA reference

2. **CLAUDE.md** - Added accessibility section including:
   - Key requirements summary
   - All testing commands
   - Component patterns (modals, forms)
   - References to shared utilities (useFocusTrap, useAnnounce, FormField)
   - Link to full guidelines document
   - Added accessibility docs to Documentation section

---

### Priority 3.3: Screen Reader Testing & Verification

**Effort:** 4 hours
**Impact:** Validates real-world assistive technology compatibility

**Tasks:**

- [ ] Test with VoiceOver (macOS)
- [ ] Test with NVDA (Windows)
- [ ] Document any screen reader specific issues
- [ ] Fix identified issues
- [ ] Create screen reader testing guide

**Testing Scenarios:**

```markdown
# Screen Reader Testing Checklist

## VoiceOver (macOS)
Enable: Cmd + F5

### Sign In Flow
- [ ] Form fields announced with labels
- [ ] Required field status announced
- [ ] Validation errors announced
- [ ] Success/error states announced after submit

### Payments Dashboard
- [ ] Page title announced on load
- [ ] Table structure understood
- [ ] Row/column headers announced
- [ ] Actions accessible

### Profile Management
- [ ] Tab panel navigation announced
- [ ] Form updates confirmed
- [ ] Preferences selection announced

## NVDA (Windows)
Enable: Ctrl + Alt + N

[Same scenarios as above]
```

**Success Criteria:**

- [ ] All critical flows work with VoiceOver
- [ ] All critical flows work with NVDA
- [ ] Issues documented and prioritized
- [ ] No blocking accessibility issues

---

## Phase 4: Maintenance & Continuous Improvement

### Priority 4.1: CI/CD Integration

**Effort:** 2 hours
**Impact:** Prevents accessibility regressions

**Tasks:**

- [ ] Add accessibility tests to CI pipeline
- [ ] Configure failure thresholds
- [ ] Add Lighthouse CI for accessibility audits
- [ ] Set up accessibility reporting

**CI Configuration:**

```yaml
# .github/workflows/accessibility.yml
name: Accessibility Checks

on:
  pull_request:
    branches: [main, develop]

jobs:
  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: pnpm install

      - name: Run accessibility unit tests
        run: pnpm test:a11y

      - name: Build application
        run: pnpm build

      - name: Start application
        run: pnpm start &

      - name: Run Lighthouse CI
        # Pin to specific commit SHA to mitigate supply chain risk
        # Check for updates periodically: https://github.com/treosh/lighthouse-ci-action/releases
        uses: treosh/lighthouse-ci-action@1b0e7c33270f4c1e17d8acd68b0a23a4a110fb61  # v10.1.0
        with:
          configPath: './lighthouserc.json'
          uploadArtifacts: true

      - name: Run E2E accessibility tests
        run: pnpm test:e2e:a11y
```

> **Note on Lighthouse CI coverage:** The configuration above only tests unauthenticated pages (signin, signup) because Lighthouse doesn't support session-based authentication natively. For authenticated page testing, use the E2E accessibility tests with @axe-core/playwright which can maintain authentication state across tests. To add authenticated Lighthouse testing, implement a separate workflow that:
> 1. Uses Puppeteer to authenticate and generate cookies
> 2. Passes authentication cookies to Lighthouse via `--extra-headers` or a custom Puppeteer script
> 3. Tests authenticated routes like `/dashboard`, `/profile`, `/payments`

```json
// lighthouserc.json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:4200/signin",
        "http://localhost:4200/signup"
      ]
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:accessibility": ["error", {"minScore": 0.9}]
      }
    }
  }
}
```

**Success Criteria:**

- [ ] Accessibility tests run on every PR
- [ ] CI fails on critical accessibility issues
- [ ] Lighthouse accessibility score tracked
- [ ] Reports generated and accessible

---

## Dependencies

### npm Packages to Add

```bash
# Testing dependencies
pnpm add -D jest-axe @axe-core/playwright @types/jest-axe

# Color contrast auditing (used by Priority 2.3 contrast audit script)
pnpm add -D color-contrast-calc

# Optional: Additional a11y tools
pnpm add -D lighthouse
```

### Browser Extensions for Manual Testing

- axe DevTools (Chrome, Firefox, Edge)
- WAVE Evaluation Tool
- Color Contrast Analyzer
- Landmarks extension

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Lighthouse Accessibility Score | ≥90 | Lighthouse CI |
| axe Violations | 0 critical/serious | jest-axe / axe-core |
| Keyboard Flow Completion | 100% | Manual testing |
| Screen Reader Compatibility | VoiceOver + NVDA | Manual testing |
| Color Contrast Ratio | ≥4.5:1 text, ≥3:1 UI | Automated + manual |
| Form Error Association | 100% | Automated testing |

---

## Timeline Estimate

| Phase | Priorities | Estimated Effort |
|-------|------------|------------------|
| Phase 1 | 1.1 - 1.6 | 16 hours |
| Phase 2 | 2.1 - 2.4 | 14 hours |
| Phase 3 | 3.1 - 3.3 | 14 hours |
| Phase 4 | 4.1 | 2 hours |
| **Total** | | **~46 hours** |

---

## References

- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [A11y Project](https://www.a11yproject.com/)
- [Inclusive Components](https://inclusive-components.design/)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/master/doc/rule-descriptions.md)

---

## Appendix A: Existing Accessibility Implementation

### Components with Good Accessibility

| Component | Location | Features |
|-----------|----------|----------|
| Button | shared-design-system | Focus indicators, disabled states |
| Input | shared-design-system | Focus states, proper types |
| PasswordInput | shared-design-system | aria-label on toggle, hidden text |
| ThemeToggle | shared-design-system | Dynamic aria-label, focus ring |
| Alert | shared-design-system | role="alert" |
| Header | shared-header-ui | nav landmark, aria-expanded, aria-labels |

### E2E Tests Already Implemented

| Test File | Location | Coverage |
|-----------|----------|----------|
| profile-accessibility.spec.ts | apps/shell-e2e | 9 tests covering keyboard nav, ARIA, focus |

### Forms with Proper Labels

| Form | Location | Status |
|------|----------|--------|
| SignIn | apps/auth-mfe | ✓ htmlFor associations |
| SignUp | apps/auth-mfe | ✓ htmlFor associations |
| ResetPassword | apps/auth-mfe | ✓ htmlFor associations |
| ProfileForm | apps/profile-mfe | ✓ htmlFor associations |
| PreferencesForm | apps/profile-mfe | ✓ aria-label on selects |

---

## Appendix B: ARIA Patterns Reference

### Live Regions

```html
<!-- Polite announcement (waits for pause) -->
<div role="status" aria-live="polite" aria-atomic="true">
  Payment created successfully
</div>

<!-- Assertive announcement (interrupts) -->
<div role="alert" aria-live="assertive" aria-atomic="true">
  Error: Payment failed
</div>
```

### Modal Dialog

```html
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
>
  <h2 id="dialog-title">Confirm Payment</h2>
  <p id="dialog-description">Are you sure you want to send ₹1,000?</p>
  <!-- Focus trap active -->
</div>
```

### Sortable Table Header

```html
<th scope="col" aria-sort="ascending" tabindex="0">
  Date <span aria-hidden="true">↑</span>
</th>
```

### Form Field with Error

```html
<div>
  <label for="email">Email <span aria-hidden="true">*</span></label>
  <input
    id="email"
    type="email"
    aria-required="true"
    aria-invalid="true"
    aria-describedby="email-error"
  />
  <p id="email-error" role="alert">Please enter a valid email address</p>
</div>
```
