# Dark Mode Manual Smoke Test Checklist

This document provides a comprehensive manual testing checklist for validating dark mode functionality across all MFEs and the shell.

## Test Environment Setup

**Prerequisites:**

- All remotes built: `pnpm build:remotes`
- All apps running: `pnpm dev:mf` or `pnpm preview:all`
- Browser console open (check for theme-related errors)
- Clear browser cache or use incognito mode

**Test Browsers:**

- Chrome/Chromium (primary)
- Firefox (secondary)
- Safari (if available)

---

## Shell App Tests

### Theme Toggle Visibility & Functionality

- [ ] **Light mode default:** App loads in light mode by default (or system preference)
- [ ] **Theme toggle visible:** Theme toggle button visible in header (sun/moon icon)
- [ ] **Toggle to dark:** Clicking toggle applies `.dark` class to `<html>` element
- [ ] **Toggle to light:** Clicking toggle again removes `.dark` class
- [ ] **Smooth transition:** Color change is smooth, no flashing or jarring transitions
- [ ] **No console errors:** Browser console has no theme-related errors

### Main Content Area

- [ ] **Background color:** Main area uses semantic background (white in light, dark gray in dark)
- [ ] **Text readability:** All text is readable in both light and dark modes
- [ ] **No hardcoded whites/grays:** No visible hardcoded `bg-white` or `text-slate-*` classes
- [ ] **Borders visible:** Borders and dividers visible in both themes

### Header Styling

- [ ] **Light mode:** Header background is primary color with white text in light mode
- [ ] **Dark mode:** Header maintains good contrast in dark mode
- [ ] **Links readable:** Nav links visible and readable in both themes
- [ ] **Theme toggle positioned:** Toggle button is well-positioned and doesn't overlap content

---

## Payments MFE Tests

### Page Load & Structure

- [ ] **Loads in light mode:** Page renders with light theme on initial load
- [ ] **Theme inherited from shell:** `.dark` class on shell propagates to payments content
- [ ] **No console errors:** No errors related to theme or styling

### Payments Table

- [ ] **Light mode table:** Table header and rows visible with good contrast in light mode
- [ ] **Dark mode table:** Table header and rows visible with good contrast in dark mode
- [ ] **Borders visible:** Table borders (divide-border) visible in both themes
- [ ] **Row hover:** Hover state (`hover:bg-muted`) visible in both themes

### Payment Filters

- [ ] **Input fields light:** Input fields have correct background in light mode (white)
- [ ] **Input fields dark:** Input fields have correct background in dark mode (gray)
- [ ] **Focus state:** Focus ring visible in both modes (`focus:ring-ring`)
- [ ] **Labels readable:** All labels use semantic foreground color

### Payment Details Dialog

- [ ] **Dialog background:** Dialog uses semantic card background in both modes
- [ ] **Dialog text:** All text in dialog is readable in both modes
- [ ] **Buttons visible:** Action buttons have good contrast
- [ ] **Borders:** Dialog borders visible in both themes

### Payment Filters & Forms

- [ ] **Select dropdowns:** Dropdowns have proper background and text color
- [ ] **Checkboxes:** Checkbox inputs have proper focus ring in both modes
- [ ] **Button states:** Primary, secondary buttons have good contrast and readability
- [ ] **Form labels:** Labels use semantic muted-foreground for secondary text

---

## Admin MFE Tests

### Dashboard Layout

- [ ] **Light mode:** Dashboard layout visible with proper contrast in light mode
- [ ] **Dark mode:** Dashboard maintains readability in dark mode
- [ ] **Stats cards:** Stats cards use semantic card background
- [ ] **No hardcoded colors:** No visible hardcoded light-only colors

### User Management Table

- [ ] **Table headers:** Headers have good contrast in both modes
- [ ] **Table rows:** Rows are readable and hover state is visible
- [ ] **Delete dialog:** Delete confirmation dialog is readable in both modes
- [ ] **Status indicators:** Status badges (green/red/yellow) visible in both modes

### Audit Logs

- [ ] **Log entries visible:** Log table entries readable in both modes
- [ ] **Timestamps:** Timestamp text uses semantic muted-foreground color
- [ ] **Severity colors:** Error/warning colors are visible in both themes

### System Health

- [ ] **Cards visible:** All health metric cards visible in both modes
- [ ] **Icons readable:** Icons and indicators have good contrast
- [ ] **Charts (if any):** Charts are readable in both themes

---

## Profile MFE Tests

### Profile Form

- [ ] **Form background:** Form uses semantic background in both modes
- [ ] **Input fields:** All input fields have proper background color
- [ ] **Focus state:** Focus rings visible on all inputs (`focus:ring-ring`)
- [ ] **Placeholder text:** Placeholder text visible in both modes
- [ ] **Error messages:** Error messages readable in both modes

### Profile Avatar

- [ ] **Avatar container:** Avatar has proper background in both modes
- [ ] **Upload button:** Upload button visible and readable in both modes
- [ ] **Border around avatar:** Border visible in both themes

### Preferences Form

- [ ] **Checkboxes:** Checkboxes have proper styling in both modes
- [ ] **Toggle switches (if any):** Toggles are visible and operable in both modes
- [ ] **Radio buttons:** Radio buttons have proper focus state in both modes
- [ ] **Submit button:** Submit button has good contrast in both modes

---

## Auth MFE Tests (Unauthenticated State)

### Sign In Page

- [ ] **Light mode layout:** Page is readable in light mode
- [ ] **Dark mode layout:** Page is readable in dark mode
- [ ] **Form styling:** Form inputs have proper background in both modes
- [ ] **Theme toggle visible:** Theme toggle is visible in unauthenticated header
- [ ] **Focus rings:** Focus rings visible on form inputs
- [ ] **Submit button:** Submit button has good contrast in both modes

### Sign Up Page

- [ ] **Form fields:** All form fields use semantic tokens
- [ ] **Password input:** Password input has proper styling
- [ ] **Terms checkbox:** Checkbox has proper styling and focus state
- [ ] **Submit button:** Uses semantic token button styling (not hardcoded primary-600)
- [ ] **Links:** Sign in link visible and readable in both modes

### Unauthenticated Header

- [ ] **Theme toggle visible:** Theme toggle is visible in unauthenticated header
- [ ] **Sign in link:** Sign in link readable in both modes
- [ ] **Sign up link:** Sign up link readable in both modes
- [ ] **Theme changes affect page:** Theme toggle changes the page theme correctly

---

## Cross-MFE Theme Consistency

### Theme Propagation

- [ ] **Navigate to Auth:** Navigate to sign in, toggle theme, verify all content updates
- [ ] **Navigate to Payments:** Navigate to payments, toggle theme, verify colors update
- [ ] **Navigate to Admin:** Navigate to admin, toggle theme, verify colors update
- [ ] **Navigate to Profile:** Navigate to profile, toggle theme, verify colors update
- [ ] **Back to Shell:** Return to shell home, verify theme is consistent

### Theme Persistence

- [ ] **Set light mode:** Set to light mode in any MFE
- [ ] **Navigate away:** Navigate to a different MFE
- [ ] **Verify persistence:** Light mode is still active
- [ ] **Set dark mode:** Set to dark mode
- [ ] **Reload page:** Reload page, verify dark mode persists
- [ ] **Close and reopen:** Close browser tab and reopen app, verify theme persists

---

## Visual Consistency Checks

### Colors & Contrast (Light Mode)

- [ ] **Background (white):** All page backgrounds are white or off-white
- [ ] **Foreground (gray-900):** All primary text is dark gray/black
- [ ] **Muted text (gray-700):** Secondary text has adequate contrast
- [ ] **Borders (gray-200):** Borders are visible but not intrusive
- [ ] **Cards (white):** Card backgrounds are white or very light

### Colors & Contrast (Dark Mode)

- [ ] **Background (gray-900):** All page backgrounds are dark gray
- [ ] **Foreground (gray-50):** All primary text is light/white
- [ ] **Muted text (gray-400):** Secondary text readable on dark background
- [ ] **Borders (gray-700):** Borders visible on dark background
- [ ] **Cards (gray-800):** Card backgrounds are dark but distinct from page background

### Accessibility

- [ ] **Text contrast:** All text has at least WCAG AA contrast (4.5:1)
- [ ] **Focus rings:** Focus rings are visible on all interactive elements
- [ ] **No color-only indication:** Information is not conveyed by color alone (buttons should have text or icons)
- [ ] **Keyboard navigation:** Tab through all interactive elements, verify focus rings visible

---

## Component-Specific Tests

### Buttons

- [ ] **Primary button (light):** Primary button visible with good contrast in light mode
- [ ] **Primary button (dark):** Primary button visible with good contrast in dark mode
- [ ] **Secondary button (light):** Secondary button visible in light mode
- [ ] **Secondary button (dark):** Secondary button visible in dark mode
- [ ] **Destructive button (light):** Destructive button (red) visible in light mode
- [ ] **Destructive button (dark):** Destructive button visible in dark mode
- [ ] **Focus state:** Focus ring visible on all button states

### Forms & Inputs

- [ ] **Text input (light):** Input field visible with proper border and background
- [ ] **Text input (dark):** Input field visible and readable in dark mode
- [ ] **Focus state (light):** Focus ring visible in light mode
- [ ] **Focus state (dark):** Focus ring visible in dark mode
- [ ] **Error state:** Error messages and states visible in both modes
- [ ] **Disabled state:** Disabled inputs clearly disabled in both modes

### Cards & Sections

- [ ] **Card background (light):** Cards use white background in light mode
- [ ] **Card background (dark):** Cards use gray-800 background in dark mode
- [ ] **Card border:** Card borders visible in both modes
- [ ] **Card shadow:** Shadow visible appropriately in both modes (if used)

### Badges & Status Indicators

- [ ] **Success badge (light):** Green status visible in light mode
- [ ] **Success badge (dark):** Green status visible in dark mode
- [ ] **Warning badge (light):** Yellow status visible in light mode
- [ ] **Warning badge (dark):** Yellow status visible in dark mode
- [ ] **Error badge (light):** Red status visible in light mode
- [ ] **Error badge (dark):** Red status visible in dark mode

### Skeleton Loaders

- [ ] **Light mode:** Skeleton loaders visible with pulsing animation in light mode
- [ ] **Dark mode:** Skeleton loaders visible with pulsing animation in dark mode
- [ ] **Contrast:** Skeleton placeholder has enough contrast to be visible

---

## Performance & Stability

### Initial Load

- [ ] **No FOUC:** No flash of unstyled content on initial load
- [ ] **Theme loads before content:** Theme is applied before page content renders
- [ ] **No reflow:** Theme application doesn't cause visible reflow or layout shift
- [ ] **Fast toggle:** Theme toggle is responsive (< 200ms)

### Responsiveness

- [ ] **Mobile light:** App displays correctly in light mode on mobile
- [ ] **Mobile dark:** App displays correctly in dark mode on mobile
- [ ] **Tablet light:** App displays correctly in light mode on tablet
- [ ] **Tablet dark:** App displays correctly in dark mode on tablet
- [ ] **Desktop light:** App displays correctly in light mode on desktop
- [ ] **Desktop dark:** App displays correctly in dark mode on desktop

### Memory & Resources

- [ ] **No memory leaks:** Theme store doesn't leak memory on repeated toggles
- [ ] **No excessive rerenders:** Theme toggle doesn't cause excessive component rerenders
- [ ] **No CSS file bloat:** No unused CSS variables or styles

---

## Browser-Specific Tests

### Chrome/Chromium

- [ ] **Light mode:** All checks pass in Chrome light mode
- [ ] **Dark mode:** All checks pass in Chrome dark mode
- [ ] **DevTools:** CSS variables visible in DevTools when inspecting elements

### Firefox

- [ ] **Light mode:** All checks pass in Firefox light mode
- [ ] **Dark mode:** All checks pass in Firefox dark mode
- [ ] **CSS variables:** Variables visible in Firefox inspector

### Safari (if available)

- [ ] **Light mode:** All checks pass in Safari light mode
- [ ] **Dark mode:** All checks pass in Safari dark mode
- [ ] **Gradient rendering:** Gradients render correctly if used

---

## Sign-Off

**Tester Name:** ******\_\_\_\_******  
**Date:** ******\_\_\_\_******  
**Browser(s) Tested:** ******\_\_\_\_******  
**Environment:** ☐ Local Dev ☐ Staging ☐ Production

**Overall Status:**

- ☐ All tests passed ✅
- ☐ Minor issues (document and create issues)
- ☐ Major issues (fix before release)

**Issues Found (if any):**

1. ***
2. ***
3. ***

**Approved for Release:** ☐ Yes ☐ No

**Notes:**

---

---

---
