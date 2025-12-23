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

### A) Tailwind + CSS Variables Foundation

- [ ] Ensure `darkMode: 'class'` in Tailwind config for all apps
  - [ ] apps/admin-mfe/tailwind.config.js
  - [ ] apps/auth-mfe/tailwind.config.js
  - [ ] apps/payments-mfe/tailwind.config.js
  - [ ] apps/profile-mfe/tailwind.config.js
  - [ ] apps/shell/tailwind.config.js
- [ ] Expand `content` globs so dark variants are emitted for shared libs
  - Include: `libs/**/*.{ts,tsx}`, shared design-system/header-ui/session-sync, etc.
- [ ] Define semantic CSS variables in each app’s global stylesheet
  - [ ] apps/admin-mfe/src/styles.css
  - [ ] apps/auth-mfe/src/styles.css
  - [ ] apps/payments-mfe/src/styles.css
  - [ ] apps/profile-mfe/src/styles.css
  - [ ] apps/shell/src/styles.css
  - Tokens (light `:root`):
    - `--background`, `--foreground`
    - `--muted`, `--muted-foreground`
    - `--card`, `--card-foreground`
    - `--border`, `--input`, `--ring`
    - `--primary`, `--primary-foreground`
    - `--secondary`, `--secondary-foreground`
    - `--destructive`, `--destructive-foreground`
    - `--accent`, `--accent-foreground`
    - `--popover`, `--popover-foreground`
  - Tokens (dark `.dark`): define darker hues with strong contrast vs foregrounds
- [ ] Map Tailwind theme colors to tokens in each Tailwind config (example):
  ```js
  extend: {
    colors: {
      background: 'hsl(var(--background))',
      foreground: 'hsl(var(--foreground))',
      muted: 'hsl(var(--muted))',
      'muted-foreground': 'hsl(var(--muted-foreground))',
      card: 'hsl(var(--card))',
      'card-foreground': 'hsl(var(--card-foreground))',
      border: 'hsl(var(--border))',
      input: 'hsl(var(--input))',
      ring: 'hsl(var(--ring))',
      primary: 'hsl(var(--primary))',
      'primary-foreground': 'hsl(var(--primary-foreground))',
      secondary: 'hsl(var(--secondary))',
      'secondary-foreground': 'hsl(var(--secondary-foreground))',
      destructive: 'hsl(var(--destructive))',
      'destructive-foreground': 'hsl(var(--destructive-foreground))',
      accent: 'hsl(var(--accent))',
      'accent-foreground': 'hsl(var(--accent-foreground))',
      popover: 'hsl(var(--popover))',
      'popover-foreground': 'hsl(var(--popover-foreground))',
    },
  }
  ```
- [ ] Base reset in each app’s global CSS
  - `* { @apply border-border; }`
  - `body { @apply bg-background text-foreground; }`

### B) Shared Design System Refactor (libs/shared-design-system)

- [ ] Replace hardcoded grays/whites with semantic utilities in:
  - [ ] Alert.tsx
  - [ ] Badge.tsx
  - [ ] Button.tsx (+ Button.test.tsx visual snapshots as needed)
  - [ ] Card.tsx
  - [ ] Input.tsx
  - [ ] Toast.tsx
  - [ ] StatusBadge.tsx (+ .test.tsx)
  - [ ] ThemeToggle.tsx
- [ ] Ensure exports aligned in `src/index.ts`
- [ ] Align with palette in `src/lib/tokens/colors.ts` (if used by design system)

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
