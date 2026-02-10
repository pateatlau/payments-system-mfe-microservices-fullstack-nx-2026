# Keyboard Shortcuts Reference

**MFE Payments System**
**Version:** 1.0
**Last Updated:** February 10, 2026

## Overview

This document provides a comprehensive list of keyboard shortcuts for the MFE Payments System. All functionality in the application is accessible via keyboard, following WCAG 2.1 Level AA guidelines.

## Table of Contents

1. [Global Navigation](#global-navigation)
2. [Page-Specific Shortcuts](#page-specific-shortcuts)
3. [Form Controls](#form-controls)
4. [Modals and Dialogs](#modals-and-dialogs)
5. [Tables and Data Grids](#tables-and-data-grids)
6. [Theme and Settings](#theme-and-settings)
7. [Screen Reader Shortcuts](#screen-reader-shortcuts)

---

## Global Navigation

These shortcuts work throughout the entire application:

| Shortcut | Action | Notes |
|----------|--------|-------|
| `Tab` | Move focus to next interactive element | Standard browser behavior |
| `Shift + Tab` | Move focus to previous interactive element | Standard browser behavior |
| `Enter` | Activate focused element (button, link, etc.) | Standard browser behavior |
| `Space` | Activate focused button or toggle checkbox | Standard browser behavior |
| `Escape` | Close modal/dialog or cancel current action | Context-dependent |

### Skip Navigation

| Shortcut | Action | Notes |
|----------|--------|-------|
| `Tab` (from page load) | Focus skip link "Skip to main content" | First focusable element |
| `Enter` (on skip link) | Jump directly to main content area | Bypasses navigation |

### Main Navigation

| Shortcut | Action | Notes |
|----------|--------|-------|
| `Tab` | Navigate through menu items | After skip link |
| `Enter` or `Space` | Select menu item and navigate to page | - |
| `Arrow Down` | Open dropdown menu (if applicable) | Future enhancement |
| `Escape` | Close dropdown menu (if applicable) | Future enhancement |

---

## Page-Specific Shortcuts

### Sign In / Sign Up Pages

| Shortcut | Action | Notes |
|----------|--------|-------|
| `Tab` | Move through form fields (Email → Password → Remember Me → Submit) | - |
| `Enter` (on Submit) | Submit form | Also works when focus is on any form field |
| `Space` (on checkbox) | Toggle "Remember me" checkbox | - |
| `Tab` | Navigate to "Forgot password?" or "Sign up" links | - |

### Payments Page

| Shortcut | Action | Notes |
|----------|--------|-------|
| `Tab` | Navigate through filters, table, and action buttons | - |
| `Enter` or `Space` | Activate filters (Date, Status, Amount) | Opens dropdown |
| `Arrow Up/Down` | Navigate filter options | When dropdown is open |
| `Enter` | Select filter option | - |
| `Escape` | Close filter dropdown | - |
| `Tab` | Navigate through table rows | - |
| `Enter` (on View button) | Open payment details modal | - |
| `Escape` (in modal) | Close payment details modal | - |

### Profile Page

| Shortcut | Action | Notes |
|----------|--------|-------|
| `Tab` | Navigate through tabs (Profile, Preferences, Account) | - |
| `Arrow Left/Right` | Switch between tabs | When tablist has focus |
| `Enter` or `Space` | Activate selected tab | - |
| `Tab` | Navigate within active tab panel | - |
| `Enter` (on Save) | Save changes to profile/preferences | - |

### Admin Page

| Shortcut | Action | Notes |
|----------|--------|-------|
| `Tab` | Navigate through tabs (Dashboard, Users, Audit Logs) | - |
| `Arrow Left/Right` | Switch between tabs | When tablist has focus |
| `Enter` or `Space` | Activate selected tab | - |
| `Tab` | Navigate through user table rows | - |
| `Enter` (on Edit) | Open edit user dialog | - |
| `Enter` (on Delete) | Open delete confirmation dialog | - |
| `Escape` (in dialog) | Close dialog | - |

---

## Form Controls

### Text Inputs

| Shortcut | Action | Notes |
|----------|--------|-------|
| `Tab` | Move to next field | - |
| `Shift + Tab` | Move to previous field | - |
| `Ctrl + A` (Windows) / `Cmd + A` (macOS) | Select all text | Standard browser behavior |
| `Ctrl + C` / `Cmd + C` | Copy selected text | Standard browser behavior |
| `Ctrl + V` / `Cmd + V` | Paste text | Standard browser behavior |

### Select Dropdowns

| Shortcut | Action | Notes |
|----------|--------|-------|
| `Enter` or `Space` | Open dropdown | When select has focus |
| `Arrow Up/Down` | Navigate options | When dropdown is open |
| `Enter` | Select current option | - |
| `Escape` | Close dropdown without selecting | - |
| `Home` | Jump to first option | - |
| `End` | Jump to last option | - |

### Checkboxes and Radio Buttons

| Shortcut | Action | Notes |
|----------|--------|-------|
| `Space` | Toggle checkbox | Standard browser behavior |
| `Arrow Up/Down` | Navigate radio button group | Standard browser behavior |
| `Space` | Select radio button | Standard browser behavior |

### Password Input

| Shortcut | Action | Notes |
|----------|--------|-------|
| `Tab` | Focus password toggle button | After entering password |
| `Enter` or `Space` | Toggle password visibility | Shows/hides password text |

---

## Modals and Dialogs

All modals and dialogs implement focus trapping to ensure keyboard users don't accidentally navigate outside the modal.

### Opening Modals

| Shortcut | Action | Notes |
|----------|--------|-------|
| `Enter` (on trigger button) | Open modal | E.g., "Create Payment", "Edit User" |

### Within Modals

| Shortcut | Action | Notes |
|----------|--------|-------|
| `Tab` | Navigate through modal controls | Focus is trapped within modal |
| `Shift + Tab` | Navigate backward through modal controls | Wraps from first to last element |
| `Escape` | Close modal and return focus to trigger button | Works in all modals |
| `Enter` (on submit button) | Submit form and close modal | Context-dependent |
| `Enter` (on cancel button) | Close modal without saving | - |

### Dialog Types

#### Confirmation Dialogs (role="alertdialog")

Used for: Delete user, Cancel payment, Logout

| Shortcut | Action | Notes |
|----------|--------|-------|
| `Tab` | Move between "Confirm" and "Cancel" | Only 2 focusable elements |
| `Enter` (on Confirm) | Perform destructive action | - |
| `Enter` (on Cancel) or `Escape` | Cancel action and close dialog | - |

#### Form Dialogs (role="dialog")

Used for: Create payment, Edit user, Edit profile

| Shortcut | Action | Notes |
|----------|--------|-------|
| `Tab` | Navigate through form fields and buttons | Focus trapped |
| `Enter` (on Save) | Submit form | - |
| `Escape` | Cancel and close dialog | Prompts if unsaved changes |

---

## Tables and Data Grids

### Payment Table, User Table, Audit Logs Table

| Shortcut | Action | Notes |
|----------|--------|-------|
| `Tab` | Navigate to table | - |
| `Tab` | Navigate through table cells and action buttons | Row by row |
| `Enter` (on sortable header) | Sort by that column | Toggles ascending/descending |
| `Enter` (on View/Edit button) | Open details modal | - |
| `Enter` (on Delete button) | Open confirmation dialog | - |

### Pagination

| Shortcut | Action | Notes |
|----------|--------|-------|
| `Tab` | Navigate to pagination controls | - |
| `Enter` (on Previous/Next) | Navigate to previous/next page | - |
| `Enter` (on page number) | Jump to specific page | - |

---

## Theme and Settings

### Theme Toggle

| Shortcut | Action | Notes |
|----------|--------|-------|
| `Tab` (to theme toggle) | Focus theme toggle button | In header |
| `Enter` or `Space` | Toggle between light and dark mode | Announces change to screen readers |

### User Menu (Future Enhancement)

| Shortcut | Action | Notes |
|----------|--------|-------|
| `Tab` | Focus user menu button | In header |
| `Enter` or `Space` | Open user menu | - |
| `Arrow Up/Down` | Navigate menu items | When open |
| `Enter` | Select menu item | E.g., "Profile", "Logout" |
| `Escape` | Close menu | - |

---

## Screen Reader Shortcuts

The following are common screen reader shortcuts for navigating the MFE Payments System. These are screen reader-specific and may vary.

### VoiceOver (macOS)

**Enable VoiceOver:** `Cmd + F5`

| Shortcut | Action |
|----------|--------|
| `VO + A` | Read all content from current position |
| `VO + →` | Move to next item |
| `VO + ←` | Move to previous item |
| `VO + Space` | Activate item (click button, follow link) |
| `VO + U` | Open Web Rotor (navigate by headings, links, form controls, etc.) |
| `VO + H` | Move to next heading |
| `VO + Shift + H` | Move to previous heading |
| `VO + L` | Move to next link |
| `VO + F` | Move to next form control |
| `VO + T` | Move to next table |

**Note:** `VO` = VoiceOver modifier (`Control + Option`)

### NVDA (Windows)

**Enable NVDA:** `Ctrl + Alt + N`

| Shortcut | Action |
|----------|--------|
| `Insert + ↓` | Read all content from current position |
| `↓` | Move to next item |
| `↑` | Move to previous item |
| `Enter` | Activate item (click button, follow link) |
| `Insert + F7` | Elements List (navigate by headings, links, form controls, etc.) |
| `H` | Move to next heading |
| `Shift + H` | Move to previous heading |
| `K` | Move to next link |
| `Shift + K` | Move to previous link |
| `F` | Move to next form control |
| `T` | Move to next table |
| `D` | Move to next landmark |

**Note:** `Insert` = NVDA modifier (can be configured to `CapsLock`)

### JAWS (Windows)

**Enable JAWS:** Automatically starts on system boot (if installed)

| Shortcut | Action |
|----------|--------|
| `Insert + ↓` | Read all content from current position |
| `↓` | Move to next item |
| `↑` | Move to previous item |
| `Enter` | Activate item (click button, follow link) |
| `Insert + F6` | Headings List |
| `Insert + F7` | Links List |
| `Insert + F5` | Forms List |
| `H` | Move to next heading |
| `Shift + H` | Move to previous heading |
| `F` | Move to next form control |
| `T` | Move to next table |
| `R` | Move to next landmark |

**Note:** `Insert` = JAWS modifier (can be configured to `CapsLock`)

---

## Focus Management

### Focus Indicators

All interactive elements have visible focus indicators:
- **Default:** 2px blue outline with offset
- **Buttons:** Blue outline with offset
- **Form inputs:** Blue border
- **Links:** Blue outline

### Focus Order

Focus order follows the visual layout:
1. Skip link (visible on focus)
2. Header navigation
3. Main content area
4. Footer (if present)

Within forms and modals, focus order is top-to-bottom, left-to-right.

### Focus Restoration

When closing modals or dialogs:
- Focus automatically returns to the element that triggered the modal
- E.g., closing "Edit User" dialog returns focus to "Edit" button

---

## Tips for Keyboard-Only Navigation

1. **Use Tab liberally** - Don't try to memorize shortcuts; Tab will get you everywhere
2. **Look for focus indicators** - The blue outline shows where you are
3. **Use Escape to back out** - Escape closes modals, dropdowns, and cancels actions
4. **Enter is your friend** - Enter activates most buttons and links
5. **Space for toggles** - Space toggles checkboxes, radio buttons, and some buttons
6. **Skip links save time** - Press Tab once from page load, then Enter to skip to main content

---

## Customizing Keyboard Shortcuts (Future Enhancement)

Currently, the application uses standard browser keyboard shortcuts. In future versions, we plan to add:

- User-customizable keyboard shortcuts
- Keyboard shortcut cheat sheet accessible via `?` key
- Vim-style keybindings (optional)

---

## Accessibility Support

If you encounter any keyboard accessibility issues, please:

- **Email:** accessibility@example.com
- **GitHub Issues:** https://github.com/your-org/payments-system/issues

Include:
- The page or feature affected
- The keyboard shortcut or interaction that didn't work
- Your operating system and browser version
- Whether you were using a screen reader (and which one)

---

## Related Documentation

- [Accessibility Statement](./ACCESSIBILITY-STATEMENT.md) - Our commitment to accessibility
- [Accessibility Guidelines](./ACCESSIBILITY-GUIDELINES.md) - Developer guidelines
- [Screen Reader Testing Guide](./SCREEN-READER-TESTING-GUIDE.md) - Manual testing procedures

---

**Last Updated:** February 10, 2026
**Applies To:** MFE Payments System v1.0
**Compliance:** WCAG 2.1 Level AA
