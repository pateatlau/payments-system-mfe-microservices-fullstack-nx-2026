# Screen Reader Testing Guide

**Version:** 1.0
**Last Updated:** February 10, 2026
**Target Compliance:** WCAG 2.1 Level AA

## Overview

This guide provides comprehensive instructions for manual screen reader testing of the MFE Payments System. While automated testing (via `@axe-core/playwright` and `jest-axe`) catches many accessibility issues, manual testing with actual screen readers is essential to verify real-world usability for people with visual impairments.

## Table of Contents

1. [Screen Readers Supported](#screen-readers-supported)
2. [VoiceOver Testing (macOS)](#voiceover-testing-macos)
3. [NVDA Testing (Windows)](#nvda-testing-windows)
4. [Testing Scenarios](#testing-scenarios)
5. [Common Issues & Solutions](#common-issues--solutions)
6. [Testing Checklist](#testing-checklist)

---

## Screen Readers Supported

We test with the following screen readers to ensure broad compatibility:

| Screen Reader | Platform | Version | Priority |
|---------------|----------|---------|----------|
| **VoiceOver** | macOS | Built-in | Primary |
| **NVDA** | Windows | Latest | Primary |
| **JAWS** | Windows | Latest | Secondary (if available) |

**Note:** VoiceOver and NVDA cover the majority of screen reader users and are sufficient for WCAG 2.1 AA compliance.

---

## VoiceOver Testing (macOS)

### Enabling VoiceOver

**Keyboard Shortcut:** `Cmd + F5`

**Or via System Preferences:**
1. Open System Settings
2. Go to Accessibility
3. Select VoiceOver
4. Click "Enable VoiceOver"

### Essential VoiceOver Commands

| Command | Action |
|---------|--------|
| `Cmd + F5` | Enable/disable VoiceOver |
| `VO` | VoiceOver modifier (Control + Option) |
| `VO + A` | Read all content from current position |
| `VO + →` | Move to next item |
| `VO + ←` | Move to previous item |
| `VO + Space` | Activate item (click button, follow link) |
| `VO + U` | Open Web Rotor (quick navigation) |
| `VO + H` | Move to next heading |
| `VO + Shift + H` | Move to previous heading |
| `VO + L` | Move to next link |
| `VO + T` | Move to next table |
| `VO + F` | Move to next form control |
| `VO + J` | Move to next list |
| `VO + I` | Read current item |
| `VO + Shift + I` | Read extended item description |

### Web Rotor Navigation

Press `VO + U` to open the Web Rotor, then:
- `←/→` arrows: Switch between navigation types (Headings, Links, Form Controls, etc.)
- `↑/↓` arrows: Navigate within the list
- `Enter`: Jump to selected item
- `Esc`: Close rotor

### VoiceOver Practice Mode

**Enable Practice Mode:** `VO + K`
- Practice VoiceOver gestures without affecting the system
- Press `Esc` to exit

---

## NVDA Testing (Windows)

### Installing NVDA

1. Download from https://www.nvaccess.org/download/
2. Run installer
3. Choose "Install NVDA on this computer"

### Enabling NVDA

**Keyboard Shortcut:** `Ctrl + Alt + N`

**Or via Desktop:**
- Double-click NVDA icon on desktop

### Essential NVDA Commands

| Command | Action |
|---------|--------|
| `Ctrl + Alt + N` | Start NVDA |
| `NVDA + Q` | Exit NVDA |
| `NVDA` | NVDA modifier key (Insert or Caps Lock) |
| `NVDA + Down Arrow` | Read all (Say All) |
| `Down Arrow` | Move to next item |
| `Up Arrow` | Move to previous item |
| `Enter` | Activate item |
| `NVDA + F7` | Elements List (quick navigation) |
| `H` | Next heading |
| `Shift + H` | Previous heading |
| `K` | Next link |
| `Shift + K` | Previous link |
| `F` | Next form field |
| `Shift + F` | Previous form field |
| `B` | Next button |
| `T` | Next table |
| `I` | Next list item |

### Browse Mode vs Focus Mode

- **Browse Mode** (default): Read content, navigate with quick keys
- **Focus Mode**: Interact with forms and inputs
- Switch: `NVDA + Space`

### Elements List

Press `NVDA + F7` to open Elements List:
- Tab between element types (Links, Headings, Form fields, etc.)
- Filter by typing
- `Enter` to jump to element

---

## Testing Scenarios

### Scenario 1: Sign In Flow (Auth MFE)

**Page:** `/signin`

**VoiceOver Test:**
1. Navigate to Sign In page
2. Press `VO + A` to read all content
3. Verify page announces as "Sign In | MFE Payments"
4. Press `VO + U`, navigate to Headings
5. Verify h1 "Sign In" is present
6. Press `VO + F` to navigate form controls
7. Verify email input announces: "Email Address, required, edit text"
8. Type invalid email, submit form
9. Verify error announces: "Invalid email address" or similar
10. Verify field announces as invalid

**NVDA Test:**
1. Navigate to Sign In page
2. Press `NVDA + Down Arrow` to read all
3. Verify page title announced
4. Press `H` to navigate headings
5. Verify h1 "Sign In" announced
6. Press `F` to navigate to email field
7. Verify "Email Address, required, edit" announced
8. Tab to password field, verify announced correctly
9. Submit empty form, verify errors announced
10. Verify `aria-invalid` announced on invalid fields

**Expected Announcements:**
- Page title: "Sign In | MFE Payments"
- Email field: "Email Address, required, edit text"
- Password field: "Password, required, protected edit text" (or "password")
- Submit button: "Sign In, button"
- Error message: "Please enter a valid email address, alert" (or similar)
- Invalid field: "Email Address, required, invalid, edit text"

**Pass Criteria:**
- [ ] All form labels announced correctly
- [ ] Required state announced
- [ ] Errors announced when validation fails
- [ ] Invalid state announced on fields
- [ ] Button purpose clear

---

### Scenario 2: Payments Table (Payments MFE)

**Page:** `/payments` (requires login)

**VoiceOver Test:**
1. Navigate to Payments page
2. Press `VO + T` to find table
3. Verify table caption or summary announced
4. Press `VO + →` through table headers
5. Verify "Date, column 1 of 4" (or similar) announced
6. Navigate to first data cell
7. Verify column header re-announced: "Date: 2026-02-10"
8. Navigate to action button in row
9. Verify button context: "View payment from 2026-02-10" or "View, button, row 1"

**NVDA Test:**
1. Navigate to Payments page
2. Press `T` to find table
3. Verify table name/caption announced
4. Press `Ctrl + Alt + Arrow Keys` to navigate table
5. Verify headers announced with cells
6. Navigate to action button
7. Verify button has descriptive label including row context

**Expected Announcements:**
- Table: "Recent payments, table with 4 columns and X rows"
- Header: "Date, column header, column 1 of 4"
- Data cell: "Date: 2026-02-10, row 1 column 1"
- Status cell: "Status: Completed, row 1 column 3"
- Action button: "View payment from 2026-02-10, button"

**Pass Criteria:**
- [ ] Table structure announced (rows, columns)
- [ ] Column headers announced with data cells
- [ ] Row context provided for action buttons
- [ ] Table caption/summary announces purpose

---

### Scenario 3: Modal Dialog (Payment Details)

**Page:** `/payments` → Click View button

**VoiceOver Test:**
1. Navigate to payments table, activate View button
2. Verify dialog opening announced: "Payment Details, dialog"
3. Verify focus moved into dialog
4. Navigate dialog content with `VO + →`
5. Press `Tab` repeatedly
6. Verify focus trapped within dialog (doesn't escape)
7. Press `Esc`
8. Verify dialog closed
9. Verify focus returned to View button

**NVDA Test:**
1. Navigate to View button, press `Enter`
2. Verify "Payment Details, dialog" announced
3. Verify focus in dialog
4. Press `Tab` through all controls
5. Verify cannot Tab out of dialog
6. Press `Esc`
7. Verify dialog closed and focus restored

**Expected Announcements:**
- Dialog opening: "Payment Details, dialog"
- Dialog content: Title, description, all fields
- Close button: "Close dialog, button" or "Close, button"
- Escape key: Dialog closes, focus returns

**Pass Criteria:**
- [ ] Dialog role announced
- [ ] Dialog title announced
- [ ] Focus trapped within dialog
- [ ] Escape closes dialog
- [ ] Focus restored to trigger element

---

### Scenario 4: Form Validation (Create Payment)

**Page:** `/payments` → Create Payment

**VoiceOver Test:**
1. Open Create Payment form
2. Navigate to Amount field: `VO + F`
3. Verify "Amount, required, edit text" announced
4. Skip filling, Tab to next field
5. Submit form
6. Verify error announced: "Amount is required" or similar
7. Verify field announced as invalid
8. Fill valid amount
9. Verify field no longer invalid

**NVDA Test:**
1. Navigate to Create Payment form
2. Press `F` to Amount field
3. Verify "Amount, required, edit" announced
4. Submit empty form
5. Verify error announced via alert
6. Verify field has "invalid" state
7. Correct error and verify state changes

**Expected Announcements:**
- Empty field: "Amount, required, edit text"
- After validation fails: "Amount, required, invalid, edit text, Amount is required"
- Error message: "Amount is required, alert"
- After correction: "Amount, required, edit text" (no "invalid")

**Pass Criteria:**
- [ ] Required state announced
- [ ] Validation errors announced
- [ ] Invalid state announced on fields
- [ ] Errors linked to fields (aria-describedby)
- [ ] Success feedback announced

---

### Scenario 5: Tab Navigation (Profile MFE)

**Page:** `/profile`

**VoiceOver Test:**
1. Navigate to Profile page
2. Press `VO + →` to tabs
3. Verify "Profile, tab, 1 of 3, selected"
4. Press `VO + →` to next tab
5. Verify "Preferences, tab, 2 of 3"
6. Press `VO + Space` to activate
7. Verify tab panel content announced
8. Verify focus moved to new tab panel

**NVDA Test:**
1. Navigate to Profile page
2. Press `Tab` to tab list
3. Verify "Profile, tab, selected, 1 of 3" announced
4. Press `Right Arrow` to next tab
5. Verify focus on Preferences tab
6. Press `Space` or `Enter` to activate
7. Verify panel change announced

**Expected Announcements:**
- Tab: "Profile, tab, 1 of 3, selected"
- Panel: "Profile panel, region" or tab panel content
- Switching tabs: "Preferences, tab, 2 of 3, selected"
- New panel: Content of Preferences panel

**Pass Criteria:**
- [ ] Tab role and position announced
- [ ] Selected state announced
- [ ] Arrow key navigation works
- [ ] Panel change announced
- [ ] Tab panel content accessible

---

### Scenario 6: Live Region Announcements (Form Submission)

**Page:** `/profile` → Update profile

**VoiceOver Test:**
1. Fill profile form with valid data
2. Submit form
3. Listen for announcement without navigating
4. Verify "Profile updated successfully" or similar announced
5. Verify announcement is polite (doesn't interrupt)

**NVDA Test:**
1. Fill and submit form
2. Wait for announcement
3. Verify success message announced automatically
4. Verify no need to navigate to message

**Expected Announcements:**
- During submission: "Updating profile..." (optional)
- On success: "Profile updated successfully" (polite)
- On error: "Failed to update profile" (assertive)

**Pass Criteria:**
- [ ] Success/error announced automatically
- [ ] Announcements don't interrupt user
- [ ] Messages clear and actionable

---

### Scenario 7: Navigation & Landmarks

**Page:** Any page

**VoiceOver Test:**
1. Press `VO + U`, navigate to Landmarks
2. Verify landmarks present:
   - Banner (header)
   - Navigation
   - Main
   - Contentinfo (footer)
3. Navigate with `VO + →` and verify regions announced

**NVDA Test:**
1. Press `D` to navigate landmarks
2. Verify regions announced with labels
3. Verify can navigate between main regions

**Expected Announcements:**
- "Banner, navigation"
- "Main navigation, navigation, Main navigation"
- "Main, main content"
- "Contentinfo, content information"

**Pass Criteria:**
- [ ] All major page regions have landmarks
- [ ] Landmarks have descriptive labels
- [ ] Skip link bypasses navigation

---

### Scenario 8: Loading States

**Page:** Any page with loading spinner

**VoiceOver Test:**
1. Trigger loading state (e.g., navigate to page)
2. Verify loading announced: "Loading..." or "Loading payments"
3. Wait for content to load
4. Verify completion (content now available)

**NVDA Test:**
1. Trigger loading state
2. Verify "Loading, status" or similar announced
3. Verify content announced when ready

**Expected Announcements:**
- Loading: "Loading payments, status" or "Loading"
- Loaded: Content becomes available (may auto-announce)

**Pass Criteria:**
- [ ] Loading state announced
- [ ] User knows content is loading
- [ ] Clear when loading complete

---

## Common Issues & Solutions

### Issue 1: Missing Form Labels

**Symptom:** Screen reader announces "edit text" without context

**Solution:**
- Ensure all `<input>` elements have associated `<label>` with `htmlFor`
- Or use `aria-label` attribute
- Use `FormField` component from design system

### Issue 2: Generic Button Text

**Symptom:** Multiple buttons announce as just "Edit" or "Delete"

**Solution:**
- Add descriptive `aria-label`: `aria-label="Edit John Doe"`
- Include context in visible text: "Edit Profile"
- Use `aria-labelledby` to reference heading

### Issue 3: Unlabeled Regions

**Symptom:** Navigation areas announced as "navigation" without context

**Solution:**
- Add `aria-label` to `<nav>`: `<nav aria-label="Main navigation">`
- Use distinct labels for multiple navigations

### Issue 4: No Error Announcements

**Symptom:** Form validation fails but user not notified

**Solution:**
- Use `role="alert"` or `aria-live="assertive"` on error messages
- Link errors to fields with `aria-describedby`
- Mark invalid fields with `aria-invalid="true"`

### Issue 5: Modal Focus Not Trapped

**Symptom:** Tab key escapes modal dialog

**Solution:**
- Use `useFocusTrap` hook from `@mfe/shared-utils`
- Ensure modal has `role="dialog"` and `aria-modal="true"`

### Issue 6: Table Navigation Confusion

**Symptom:** Table cells not announced with headers

**Solution:**
- Use `<th scope="col">` for column headers
- Use `<th scope="row">` for row headers
- Add table caption or `aria-label`

---

## Testing Checklist

### Pre-Test Setup

- [ ] VoiceOver or NVDA installed and enabled
- [ ] Browser: Chrome, Firefox, or Safari
- [ ] Application running locally or on test environment
- [ ] Test user accounts available (customer, admin)

### Per-Page Testing

- [ ] Page title announced correctly
- [ ] Heading structure logical (h1 → h2 → h3)
- [ ] All form inputs have labels
- [ ] Required fields announced as required
- [ ] Error messages announced on validation
- [ ] Invalid fields marked with aria-invalid
- [ ] Buttons have descriptive names
- [ ] Links have meaningful text
- [ ] Tables announce structure and headers
- [ ] Modals announce role and title
- [ ] Focus trapped in modals
- [ ] Escape closes modals
- [ ] Loading states announced
- [ ] Success/error messages announced
- [ ] Navigation landmarks present
- [ ] Skip link functional

### Cross-Page Testing

- [ ] Consistent navigation structure
- [ ] Route changes update page title
- [ ] Route changes announced (via live region)
- [ ] Theme toggle accessible and announces state
- [ ] All critical user flows completable

### Documentation

- [ ] Issues logged with severity (critical, major, minor)
- [ ] Screenshots or recordings of issues
- [ ] Steps to reproduce documented
- [ ] Tested screen reader and version noted

---

## Issue Severity Levels

| Severity | Description | Examples |
|----------|-------------|----------|
| **Critical** | Blocks core functionality | Cannot submit form, cannot login |
| **Major** | Significant usability issue | Missing labels, confusing announcements |
| **Minor** | Cosmetic or enhancement | Verbose announcements, minor label improvements |

---

## Testing Report Template

```markdown
## Screen Reader Testing Report

**Date:** YYYY-MM-DD
**Tester:** [Name]
**Screen Reader:** VoiceOver X.X / NVDA X.X
**Browser:** Chrome/Firefox/Safari
**Pages Tested:** [List]

### Summary
- Total Issues Found: X
- Critical: X
- Major: X
- Minor: X

### Issues

#### Issue 1: [Title]
- **Severity:** Critical/Major/Minor
- **Page:** /path/to/page
- **Steps to Reproduce:**
  1. ...
  2. ...
- **Expected:** ...
- **Actual:** ...
- **Screen Reader Output:** "..." (verbatim)
- **Fix Suggestion:** ...

[Repeat for each issue]

### Positive Findings
- [List things that work well]
```

---

## Resources

- [VoiceOver User Guide](https://support.apple.com/guide/voiceover/welcome/mac)
- [NVDA User Guide](https://www.nvaccess.org/files/nvda/documentation/userGuide.html)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [Deque Screen Reader Testing Guide](https://www.deque.com/blog/dont-screen-readers-work-testing-environment/)
