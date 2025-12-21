# Dark Mode / Light Mode Task List - Progress Tracking

**Status:** In Progress  
**Version:** 1.0  
**Date:** December 12, 2025  
**Last Updated:** December 21, 2025

## How to Use This Checklist

- **For Progress Tracking:** Mark tasks as complete by checking the box: `- [x]`
- **For Detailed Instructions:** Refer to [`DARK-MODE-IMPLEMENTATION-PLAN.md`](./DARK-MODE-IMPLEMENTATION-PLAN.md) for step-by-step guidance
- **For Status:** Update status (Not Started | In Progress | Complete) and completion percentage
- **For Cursor AI:** This file helps Cursor understand what's completed and what's next across sessions

- [x] Directory structure created
- [x] theme-store.ts created with types
- [x] System preference detection implemented
- [x] Theme application to DOM implemented
- [x] Resolved theme calculation working
- [x] theme-store.spec.ts created
- [x] Tests written and passing (16/16 tests passing, 100% coverage target met)
- [x] package.json created
      **Notes:** Theme store created with Zustand, system preference detection via matchMedia, DOM class application, and comprehensive test coverage. Library builds successfully.

---

### Task 1.2: Integrate Theme Store with Profile Service API

- [x] shared-api-client dependency added
- [x] getThemePreference() function implemented
- [x] updateThemePreference() function implemented
- [x] setTheme() updates API
- [x] Error handling implemented
- [x] Fallback behavior works when API fails
- [x] Tests updated with mocked API calls
- [x] Tests passing (19/19 tests passing)

**Status:** Complete  
**Completed Date:** 2025-12-21  
**Notes:** API integration complete with graceful fallbacks. Local state updates immediately even if API fails. 3 new API-related tests added covering fetch, fallback, and error scenarios.

---

### Task 1.3: Configure Tailwind v4 Dark Mode

- [x] shell/tailwind.config.js updated (darkMode: 'class')
- [x] auth-mfe/tailwind.config.js updated
- [x] admin-mfe/tailwind.config.js updated
- [x] profile-mfe/tailwind.config.js updated
- [x] Dark mode classes tested (dark:bg-gray-900, dark:text-white)

**Status:** Complete  
**Notes:** All 5 MFE Tailwind configs updated with darkMode: 'class' strategy.

---

## Phase 2: CSS Theme Variables & Design System (Days 3-6)

### Task 2.1: Add Dark Mode CSS Variables

- [x] shell/src/styles.css updated with semantic tokens
- [x] auth-mfe/src/styles.css updated with semantic tokens
- [x] payments-mfe/src/styles.css updated with semantic tokens

---

- [x] Card.tsx updated with dark mode
- [x] Card.test.tsx updated with dark mode tests
- [x] Badge.tsx updated with dark mode
- [x] Semantic color tokens used

**Status:** Complete  
**Completed Date:** 2025-12-21  
**Notes:** All five core design system components (Button, Input, Card, Badge, Alert) updated with dark mode support using CSS custom properties. Replaced hardcoded Tailwind colors with rgb(var(--token)) syntax for semantic tokens. Added explicit dark: variants for all color utilities. Updated Button tests to check for new CSS custom property classes. All 34 tests passing.

---

### Task 2.3: Update Design System Color Tokens

- [x] colors.ts updated with dark mode variants
- [x] Light and dark variants for all color categories
- [x] Helper functions added (getThemeColor, hasDarkModeVariant)
- [x] Dark mode tokens documented
- [x] Backwards compatibility maintained
- [x] Tests written and passing (13 new tests, 47 total)

**Status:** Complete  
**Completed Date:** 2025-12-21  
**Notes:** All color categories (primary, secondary, success, danger, warning, info, background, foreground, border) now have light and dark variants. Added helper functions for programmatic access. 13 comprehensive tests covering all variants and helper functions. Maintains backwards compatibility with legacy DEFAULT values.

---

**Phase 2 Completion:** **100% ✅ (3/3 sub-tasks complete)**

---

## Phase 3: Theme Toggle UI Components (Days 8-10)

### Task 3.1: Create Theme Toggle Component

- [x] ThemeToggle.tsx created
- [x] useTheme() hook integrated
- [x] Sun icon implemented (light mode)
- [x] Moon icon implemented (dark mode)
- [x] System icon implemented (system preference)
- [x] All three states supported (light, dark, system)
- [x] State cycling works (light → dark → system → light)
- [x] Accessibility attributes added (aria-label, keyboard navigation)
- [x] Focus states implemented
- [x] ThemeToggle.test.tsx created
- [x] Tests written and passing (18 tests)
- [x] Component exported from design system
- [x] shared-theme-store dependency added

**Status:** Complete  
**Completed Date:** 2025-12-21  
**Notes:** Created reusable ThemeToggle button component with sun/moon/monitor icons. Cycles through light → dark → system → light. Includes comprehensive accessibility support (aria-label, title, keyboard navigation, focus states). 18 tests covering rendering, theme cycling, accessibility, and variants. All 65 tests passing in shared-design-system. **Fixed:** Added @mfe/shared-theme-store to Module Federation shared dependencies and resolve aliases in all 5 MFE rspack configs to resolve import errors.

---

### Task 3.2: Add Theme Toggle to Header

- [x] useTheme() hook imported in header
- [x] ThemeToggle component imported
- [x] Toggle added to header (right side, next to user info)
- [x] Toggle visible when authenticated
- [x] Toggle styled to match header design
- [x] Toggle functionality tested
- [x] Theme applies immediately on toggle
- [x] Header styling updates correctly

**Status:** Complete  
**Completed Date:** 2025-12-21  
**Notes:** ThemeToggle renders in the shared header for authenticated users next to user info and logout. Styled with white icon treatment, subtle hover, and focus-visible ring to match the header; uses shared-theme-store for immediate theme application.

---

### Task 3.3: Initialize Theme on App Load

- [x] Theme store imported in bootstrap.tsx
- [x] initializeTheme() called before React renders
- [x] Theme applied to <html> element immediately
- [x] No flash of wrong theme
- [x] Theme persists across page reloads
- [x] Loading state handled appropriately

**Status:** Complete  
**Completed Date:** 2025-12-21  
**Notes:** bootstrap now awaits initializeTheme() from shared-theme-store before React render to apply the resolved theme class on <html>, minimizing flash of wrong theme. Logs warning and continues on failure.

---

**Phase 3 Completion:** **100% ✅ (3/3 sub-tasks complete)**

---

## Phase 4: Cross-Tab Synchronization (Days 11-12)

### Task 4.1: Integrate Theme with Session Sync

- [ ] shared-session-sync dependency added
- [ ] Session sync imported in theme store
- [ ] Theme change listener implemented
- [ ] Theme change publisher implemented
- [ ] publishThemeChange() called on theme change
- [ ] Cross-tab sync tested (multiple tabs)
- [ ] Theme syncs correctly across tabs
- [ ] No race conditions observed
- [ ] Tests written and passing

**Status:** Not Started  
**Completed Date:**  
**Notes:**

---

**Phase 4 Completion:** **0% (0/1 sub-tasks complete)**

---

## Phase 5: Profile MFE Integration (Days 13-14)

### Task 5.1: Add Theme Preference to Profile MFE

- [ ] Theme selector added to PreferencesForm component
- [ ] useTheme() hook imported and integrated
- [ ] Three theme options available (light, dark, system)
- [ ] Theme change syncs with Profile Service API
- [ ] Theme change reflects in header toggle immediately
- [ ] Success/error feedback implemented
- [ ] Tests written and passing
- [ ] Theme preference persists after reload
- [ ] Component styled consistently with preferences design

**Status:** Not Started  
**Completed Date:**  
**Notes:**

---

**Phase 5 Completion:** **0% (0/1 sub-tasks complete)**

---

## Overall Progress Summary

**Total Tasks:** 10 sub-tasks across 4 phases (Phase 5 deferred)

**Completion Status:**

| Phase                                        | Sub-tasks Complete | Total  | Percentage |
| -------------------------------------------- | ------------------ | ------ | ---------- |
| Phase 1: Theme Store & Core Infrastructure   | 3                  | 3      | 100%       |
| Phase 2: CSS Theme Variables & Design System | 3                  | 3      | 100%       |
| Phase 3: Theme Toggle UI Components          | 3                  | 3      | 100%       |
| Phase 4: Cross-Tab Synchronization           | 0                  | 1      | 0%         |
| Phase 5: Profile MFE Integration             | 0                  | 1      | 0%         |
| **Total**                                    | **9**              | **11** | **82%**    |

---

## Blockers & Issues

_No blockers or issues yet._

---

## Lessons Learned

_Lessons learned will be added as implementation progresses._

---

## Success Criteria Checklist

### Functional Requirements

- [x] Theme store implemented and tested
- [x] Theme syncs with Profile Service API
- [x] Theme toggle visible and functional in header
- [x] All design system components support dark mode
- [x] Dark mode CSS variables defined and working
- [x] Tailwind v4 dark mode configured
- [ ] Cross-tab synchronization works
- [x] System preference detection works
- [x] Theme persists across page reloads
- [x] No flash of wrong theme on page load

### Technical Requirements

- [x] Zustand store pattern followed
- [ ] TypeScript strict mode passing
- [ ] All tests passing (70%+ coverage)
- [ ] Linting passes
- [ ] No `any` types used
- [ ] Error handling comprehensive

### Quality Requirements

- [ ] Production-ready code
- [ ] Accessibility standards met
- [ ] Performance acceptable
- [ ] Code follows project patterns

---

**Last Updated:** 2025-12-21  
**Status:** Phase 1 Complete ✅ | Phase 2 Complete ✅ | Phase 3.3 Complete ✅ (incl. rspack fix)

---
