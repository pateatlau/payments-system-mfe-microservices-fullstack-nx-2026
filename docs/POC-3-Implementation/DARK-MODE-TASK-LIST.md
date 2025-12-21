# Dark Mode / Light Mode Task List - Progress Tracking

**Status:** Not Started  
**Version:** 1.0  
**Date:** December 12, 2025  
**Phase:** Theme System Implementation

**Overall Progress:** 0% (0 of 5 phases complete)

- Phase 1: Theme Store & Core Infrastructure (0% - 0/3 sub-tasks complete)
- Phase 2: CSS Theme Variables & Design System (0% - 0/3 sub-tasks complete)
- Phase 3: Theme Toggle UI Components (0% - 0/3 sub-tasks complete)
- Phase 4: Cross-Tab Synchronization (0% - 0/1 sub-tasks complete)
- Phase 5: Profile MFE Integration (0% - 0/1 sub-tasks complete)

> **Related Document:** See [`DARK-MODE-IMPLEMENTATION-PLAN.md`](./DARK-MODE-IMPLEMENTATION-PLAN.md) for detailed step-by-step instructions for each task.

---

## How to Use This Checklist

- **For Progress Tracking:** Mark tasks as complete by checking the box: `- [x]`
- **For Detailed Instructions:** Refer to [`DARK-MODE-IMPLEMENTATION-PLAN.md`](./DARK-MODE-IMPLEMENTATION-PLAN.md) for step-by-step guidance
- **For Notes:** Add notes or blockers in the Notes section of each task
- **For Status:** Update status (Not Started | In Progress | Complete) and completion percentage
- **For Cursor AI:** This file helps Cursor understand what's completed and what's next across sessions

**Sync Note:** This task list tracks high-level progress. Detailed implementation steps are in `DARK-MODE-IMPLEMENTATION-PLAN.md`. When completing a task, mark it here and optionally add notes about any deviations from the plan.

---

## Phase 1: Theme Store & Core Infrastructure (Days 1-3)

### Task 1.1: Create Shared Theme Store Library

- [x] Directory structure created
- [x] theme-store.ts created with types
- [x] System preference detection implemented
- [x] Theme application to DOM implemented
- [x] Resolved theme calculation working
- [x] Hooks exported (useTheme, useResolvedTheme)
- [x] theme-store.spec.ts created
- [x] Tests written and passing (16/16 tests passing, 100% coverage target met)
- [x] package.json created
- [x] project.json created
- [x] tsconfig.json created
- [x] jest.config.js created

**Status:** Complete  
**Completed Date:** 2025-12-21  
**Notes:** Theme store created with Zustand, system preference detection via matchMedia, DOM class application, and comprehensive test coverage. Library builds successfully.

---

### Task 1.2: Integrate Theme Store with Profile Service API

- [x] shared-api-client dependency added
- [x] getThemePreference() function implemented
- [x] updateThemePreference() function implemented
- [x] initializeTheme() fetches from API
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

- [ ] shell/tailwind.config.js updated (darkMode: 'class')
- [ ] auth-mfe/tailwind.config.js updated
- [ ] payments-mfe/tailwind.config.js updated
- [ ] admin-mfe/tailwind.config.js updated
- [ ] Dark mode classes tested (dark:bg-gray-900, dark:text-white)
- [ ] Test component created and verified
- [ ] Dark mode compilation verified

**Status:** Not Started  
**Completed Date:**  
**Notes:**

---

**Phase 1 Completion:** **67% (2/3 sub-tasks complete)**

---

## Phase 2: CSS Theme Variables & Design System (Days 4-7)

### Task 2.1: Add Dark Mode CSS Variables

- [ ] shell/src/styles.css updated with dark mode variables
- [ ] Dark mode primary color variants added
- [ ] auth-mfe/src/styles.css updated
- [ ] payments-mfe/src/styles.css updated
- [ ] admin-mfe/src/styles.css updated
- [ ] CSS variables tested in light mode
- [ ] CSS variables tested in dark mode

**Status:** Not Started  
**Completed Date:**  
**Notes:**

---

### Task 2.2: Update Design System Components for Dark Mode

- [ ] Button.tsx updated with dark mode
- [ ] Button.test.tsx updated with dark mode tests
- [ ] Input.tsx updated with dark mode
- [ ] Input.test.tsx updated with dark mode tests
- [ ] Card.tsx updated with dark mode
- [ ] Card.test.tsx updated with dark mode tests
- [ ] Badge.tsx updated with dark mode
- [ ] Badge.test.tsx updated with dark mode tests
- [ ] Alert.tsx updated with dark mode
- [ ] Alert.test.tsx updated with dark mode tests
- [ ] All components tested in both themes
- [ ] Semantic color tokens used
- [ ] All tests passing

**Status:** Not Started  
**Completed Date:**  
**Notes:**

---

### Task 2.3: Update Design System Color Tokens

- [ ] colors.ts updated with dark mode variants
- [ ] Dark mode tokens documented
- [ ] Token helpers exported (if needed)

**Status:** Not Started  
**Completed Date:**  
**Notes:**

---

**Phase 2 Completion:** **0% (0/3 sub-tasks complete)**

---

## Phase 3: Theme Toggle UI Components (Days 8-10)

### Task 3.1: Create Theme Toggle Component

- [ ] ThemeToggle.tsx created
- [ ] useTheme() hook integrated
- [ ] Sun icon implemented (light mode)
- [ ] Moon icon implemented (dark mode)
- [ ] System icon implemented (system preference)
- [ ] All three states supported (light, dark, system)
- [ ] State cycling works (light → dark → system → light)
- [ ] Accessibility attributes added (aria-label, keyboard navigation)
- [ ] Focus states implemented
- [ ] ThemeToggle.test.tsx created
- [ ] Tests written and passing
- [ ] Component exported from design system

**Status:** Not Started  
**Completed Date:**  
**Notes:**

---

### Task 3.2: Add Theme Toggle to Header

- [ ] useTheme() hook imported in header
- [ ] ThemeToggle component imported
- [ ] Toggle added to header (right side, next to user info)
- [ ] Toggle visible when authenticated
- [ ] Toggle styled to match header design
- [ ] Toggle functionality tested
- [ ] Theme applies immediately on toggle
- [ ] Header styling updates correctly

**Status:** Not Started  
**Completed Date:**  
**Notes:**

---

### Task 3.3: Initialize Theme on App Load

- [ ] Theme store imported in bootstrap.tsx
- [ ] initializeTheme() called before React renders
- [ ] Theme applied to <html> element immediately
- [ ] No flash of wrong theme
- [ ] Theme persists across page reloads
- [ ] Loading state handled appropriately

**Status:** Not Started  
**Completed Date:**  
**Notes:**

---

**Phase 3 Completion:** **0% (0/3 sub-tasks complete)**

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
| Phase 1: Theme Store & Core Infrastructure   | 2                  | 3      | 67%        |
| Phase 2: CSS Theme Variables & Design System | 0                  | 3      | 0%         |
| Phase 3: Theme Toggle UI Components          | 0                  | 3      | 0%         |
| Phase 4: Cross-Tab Synchronization           | 0                  | 1      | 0%         |
| Phase 5: Profile MFE Integration             | 0                  | 1      | 0%         |
| **Total**                                    | **2**              | **11** | **18%**    |

---

## Blockers & Issues

_No blockers or issues yet._

---

## Lessons Learned

_Lessons learned will be added as implementation progresses._

---

## Success Criteria Checklist

### Functional Requirements

- [ ] Theme store implemented and tested
- [ ] Theme syncs with Profile Service API
- [ ] Theme toggle visible and functional in header
- [ ] All design system components support dark mode
- [ ] Dark mode CSS variables defined and working
- [ ] Tailwind v4 dark mode configured
- [ ] Cross-tab synchronization works
- [ ] System preference detection works
- [ ] Theme persists across page reloads
- [ ] No flash of wrong theme on page load

### Technical Requirements

- [ ] Zustand store pattern followed
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
**Status:** Phase 1.2 Complete - Ready for Phase 1.3

---
