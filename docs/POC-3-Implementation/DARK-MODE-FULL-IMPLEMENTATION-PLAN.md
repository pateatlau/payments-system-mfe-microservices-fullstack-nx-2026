# Dark Mode Full Implementation Plan (POC-3)

This plan makes dark mode complete, consistent, and accessible across the shell and all MFEs by standardizing theme tokens, removing hardcoded light-only colors, and ensuring contrast and propagation.

## Objectives

- Apply dark mode across the entire app (shell + admin/auth/payments/profile MFEs).
- Replace hardcoded light styles with semantic tokens.
- Meet WCAG AA contrast for text and interactive states.
- Ensure theme propagation through the shell to remotes.

## Non-Goals

- Brand redesign or entirely new color palette beyond tokenization and contrast tweaks.
- Component API changes unrelated to theming.

---

## Approach Summary

- Use CSS variables as semantic color tokens defined in `:root` (light) and `.dark` (dark).
- Map Tailwind theme colors to those CSS variables in each app’s Tailwind config.
- Set global body/base styles to token-driven utilities (`bg-background`, `text-foreground`, `border-border`).
- Refactor shared design system components to consume tokens (no hardcoded grays/whites).
- Replace hardcoded utilities across MFEs with token utilities;
- Verify contrast and add guardrails to prevent regressions.

---

## Task List (Granular)

### A) Tailwind + CSS Variables Foundation ✅ COMPLETE

**Status:** All tasks completed and verified with successful builds across 27 projects.

**Completed Tasks:**

- [x] Ensure `darkMode: 'class'` in Tailwind config for all apps
  - [x] apps/admin-mfe/tailwind.config.js
  - [x] apps/auth-mfe/tailwind.config.js
  - [x] apps/payments-mfe/tailwind.config.js
  - [x] apps/profile-mfe/tailwind.config.js
  - [x] apps/shell/tailwind.config.js
- [x] Expand `content` globs so dark variants are emitted for shared libs
  - Added: `'../../libs/**/*.{js,jsx,ts,tsx}'` to all MFE configs
- [x] Define semantic CSS variables in each app's global stylesheet
  - [x] apps/admin-mfe/src/styles.css
  - [x] apps/auth-mfe/src/styles.css
  - [x] apps/payments-mfe/src/styles.css
  - [x] apps/profile-mfe/src/styles.css
  - [x] apps/shell/src/styles.css
  - All tokens defined for both `:root` (light) and `.dark` (dark) themes
- [x] Map Tailwind theme colors to tokens in each Tailwind config
  - Using `rgb(var(--token) / <alpha-value>)` format for Tailwind v4
  - All semantic tokens mapped: background, foreground, muted, card, border, input, ring, primary, secondary, destructive, accent, popover
- [x] Base reset in each app's global CSS
  - `@layer base { * { border-color: rgb(var(--border)); } body { background-color: rgb(var(--background)); color: rgb(var(--foreground)); } }`

**Implementation Notes:**

1. **Module Resolution Fix:**
   - Changed `shared-session-sync` import from `@mfe/shared-session-sync` to `shared-session-sync` to match tsconfig.base.json path mapping
   - Updated in: `libs/shared-theme-store/src/lib/theme-store.ts`

2. **Rspack Configuration Updates:**
   - Added `shared-session-sync` (without `@mfe/` prefix) to shared dependencies in all MFE configs
   - Added `shared-session-sync` to resolve.alias in all MFE configs
   - Updated: shell, auth-mfe, payments-mfe, admin-mfe, profile-mfe

3. **TypeScript Error Fixes:**
   - Removed unused `ApiResponse` import from theme-store
   - Fixed payload type casting in theme-store event handler: `(data: unknown) => { const payload = data as ThemeChangePayload; }`
   - Added type assertion in colors.ts: `return (themeColors[variant || 'DEFAULT'] || themeColors.DEFAULT) as string;`
   - Removed unused imports: `useEffect`, `User`, `refreshToken`, `accessToken`
   - Fixed component props: Loading size changed from `"md"` to `"lg"`, removed invalid `title` prop from ThemeToggle

4. **Token Format:**
   - Used RGB space-separated format for Tailwind v4: `--background: 255 255 255;`
   - Tailwind mapping uses: `'rgb(var(--background) / <alpha-value>)'`

**Files Modified:**

- 5 Tailwind configs (shell, auth, payments, admin, profile)
- 5 global CSS files (styles.css in all apps)
- 5 rspack.config.js files (all MFEs)
- 3 shared library files:
  - `libs/shared-theme-store/src/lib/theme-store.ts`
  - `libs/shared-design-system/src/lib/tokens/colors.ts`
  - `libs/shared-session-sync/src/hooks/useSessionSync.ts`
  - `libs/shared-session-sync/src/hooks/useDeviceSessionSync.ts`
  - `libs/shared-header-ui/src/lib/shared-header-ui.tsx`
  - `apps/shell/src/components/DeviceManager.tsx`

**Build Verification:**

- All 27 projects build successfully
- No TypeScript errors
- No Rspack module resolution errors
- Theme infrastructure ready for Step B (component refactoring)

### B) Shared Design System Refactor (libs/shared-design-system) ✅

- [x] Replace hardcoded grays/whites with semantic utilities in:
  - [x] Alert.tsx
  - [x] Badge.tsx
  - [x] Button.tsx (+ Button.test.tsx visual snapshots as needed)
  - [x] Card.tsx
  - [x] Input.tsx
  - [x] Toast.tsx
  - [x] StatusBadge.tsx (+ .test.tsx)
  - [x] ThemeToggle.tsx
- [x] Ensure exports aligned in `src/index.ts`
- [x] Align with palette in `src/lib/tokens/colors.ts` (if used by design system)

**Step B Completion Notes:**

- Removed all redundant `dark:` classes from components since CSS variables automatically adapt to dark mode
- Replaced hardcoded colors in Toast.tsx with semantic tokens (card, border, destructive)
- Badge success/warning variants still use hardcoded green/amber but removed dark: duplicates
- Fixed Tailwind CSS deprecation: `flex-shrink-0` → `shrink-0`
- All 27 projects build successfully with no TypeScript errors
- All component exports verified in src/index.ts

### C) Shell (host) Wiring

- [ ] Use token classes on root/wrappers
  - [ ] apps/shell/src/styles.css — ensure body/base applied
  - [ ] apps/shell/src/bootstrap.tsx — toggle `.dark` on `document.documentElement`
- [ ] Verify remotes inherit `.dark` class and CSS variables (no iframe isolation). If isolated, propagate theme via shared store and set `.dark` at remote root.

### D) MFEs: Payments / Admin / Profile / Auth

- Payments MFE
  - [ ] Replace hardcoded utilities in high-traffic views:
    - [ ] src/components/PaymentsPage.tsx (tables, cards, filters, dialogs)
    - [ ] src/components/PaymentReports.tsx
    - [ ] src/components/PaymentFilters.tsx
    - [ ] src/components/PaymentDetails.tsx
- Admin MFE
  - [ ] Update pages/dialogs/tables:
    - [ ] AdminDashboard.tsx, AuditLogs.tsx, UserManagement.tsx
    - [ ] Dialogs (DeleteConfirmDialog.tsx, UserFormDialog.tsx)
- Profile MFE
  - [ ] Update pages/forms/avatars:
    - [ ] ProfilePage.tsx, ProfileForm.tsx, AvatarUpload.tsx, AccountInfo.tsx
- Auth MFE
  - [ ] Update screens/forms to token utilities

### E) Interaction & Focus States

- [ ] Replace `focus:ring-*` with semantic `focus:ring-ring` and ensure `--ring` works in both themes
- [ ] Normalise `focus:ring-offset-*` against token background

### F) Migration Sweep (Remove Hardcoded Colors)

- [ ] Search for patterns and replace with tokens:
  - bg-white → bg-card or bg-background (context)
  - bg-slate-50/200 → bg-muted
  - text-slate-900 → text-foreground
  - text-slate-600/500/400 → text-muted-foreground
  - border-gray-200/300 → border-border
  - divide-slate-200 → divide-border
  - focus:ring-blue-500 → focus:ring-ring
- [ ] Validate hover/active states for adequate contrast in both themes

### G) Contrast & Accessibility

- [ ] WCAG AA checks:
  - Body text vs background ≥ 4.5:1
  - Muted text vs muted background ≥ 4.5:1 where used for legible copy
  - Buttons/links states readable in both themes
- [ ] Tweak CSS variable values for `--foreground`, `--muted-foreground`, and `--border` until AA is met

### H) Theme Propagation & Guardrails

- [ ] Confirm `.dark` propagation from shell to remotes on initial load and toggle
- [ ] Add guardrails to prevent regressions:
  - [ ] ESLint rule or pre-commit check to block new hardcoded colors:
    - Disallow: `bg-white`, `text-slate-*`, `border-gray-*`, `bg-slate-*` (except in whitelisted legacy)
  - [ ] Optional codemod script to accelerate replacements

### I) Validation & Tests

- [ ] Manual smoke tests (dark/light/system) across MFEs
  - Payments tables, filters, dialogs; Admin tables/dialogs; Profile forms; Auth screens
- [ ] Basic E2E check to toggle `.dark` and assert color changes (Playwright/Cypress)
- [ ] Visual spot checks for toasts/skeletons/badges

---

## Mapping Cheat Sheet (Examples)

- Surfaces:
  - `bg-white` → `bg-card` (card/dialog) or `bg-background` (page)
  - `bg-slate-50/200` → `bg-muted`
- Text:
  - `text-slate-900` → `text-foreground`
  - `text-slate-600/500/400` → `text-muted-foreground`
- Borders/dividers:
  - `border-gray-200/300` → `border-border`
  - `divide-slate-200` → `divide-border`
- Focus:
  - `focus:ring-blue-500` → `focus:ring-ring`

---

## Effort Estimate

- Foundation (Tailwind + CSS vars + base styles): 0.5 day
- Design system refactor (Alert/Badge/Button/Card/Input/Toast/StatusBadge/ThemeToggle): 1 day
- MFEs (shell + payments + admin + profile + auth): 1–1.5 days
- Contrast QA, tweaks, guardrails: 0.5 day
- Total: ~2.5–3.5 days focused

## Risks & Mitigations

- Inconsistent content globs → missing dark classes. Mitigate by adding libs/\*\* globs in all apps.
- Low contrast in specific combinations → iterate token values, prioritize readability.
- Remotes not inheriting `.dark` → subscribe to shared theme store and set `.dark` on remote root if needed.

## Acceptance Criteria

- [ ] All pages use token-driven background/text/border; no large white sections in dark mode
- [ ] Shared design-system components render correctly in both themes
- [ ] Payments/Admin/Profile/Auth primary screens readable with AA contrast
- [ ] Theme toggle updates all MFEs without refresh; no FOUC
- [ ] Lint or pre-commit prevents new hardcoded color utilities

## Rollout

1. Implement foundation + design-system tokens on a feature branch.
2. Migrate shell + one MFE (payments) and validate.
3. Migrate remaining MFEs; run QA pass and E2E toggle checks.
4. Enable guardrails; merge to develop → main.
