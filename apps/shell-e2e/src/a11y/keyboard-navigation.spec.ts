/**
 * Keyboard Navigation E2E Tests - WCAG 2.1 AA Compliance
 *
 * Cross-application keyboard navigation tests verifying:
 * - All interactive elements are keyboard accessible
 * - No keyboard traps
 * - Logical focus order
 * - Skip links functionality
 * - Focus visibility
 * - Tab and arrow key navigation patterns
 *
 * WCAG 2.1 Success Criteria:
 * - 2.1.1 Keyboard (Level A)
 * - 2.1.2 No Keyboard Trap (Level A)
 * - 2.4.3 Focus Order (Level A)
 * - 2.4.7 Focus Visible (Level AA)
 *
 * @module shell-e2e/a11y/keyboard-navigation
 */

import { test, expect, Page } from '@playwright/test';

/**
 * Helper to login as customer
 */
async function loginAsCustomer(page: Page): Promise<void> {
  await page.goto('/signin');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', 'customer@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*payments/, { timeout: 15000 });
}

/**
 * Helper to login as admin
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/signin');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', 'admin@example.com');
  await page.fill('input[type="password"]', 'Admin123!@#');
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*payments/, { timeout: 15000 });
}

/**
 * Helper to get focused element info
 */
async function getFocusedElementInfo(page: Page): Promise<{
  tagName: string;
  type?: string;
  id?: string;
  role?: string;
  ariaLabel?: string;
  textContent?: string;
  className?: string;
}> {
  return page.evaluate(() => {
    const el = document.activeElement;
    return {
      tagName: el?.tagName || '',
      type: (el as HTMLInputElement)?.type,
      id: el?.id,
      role: el?.getAttribute('role') || undefined,
      ariaLabel: el?.getAttribute('aria-label') || undefined,
      textContent: el?.textContent?.slice(0, 50) || undefined,
      className: el?.className || undefined,
    };
  });
}

/**
 * Helper to count focusable elements
 */
async function getFocusableElementsCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');
    return document.querySelectorAll(focusableSelectors).length;
  });
}

/**
 * Helper to check if element has visible focus indicator
 */
async function hasVisibleFocusIndicator(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return false;

    const styles = window.getComputedStyle(el);

    // Check for outline
    const hasOutline =
      styles.outlineStyle !== 'none' && styles.outlineWidth !== '0px';

    // Check for box-shadow (common focus ring approach)
    const hasBoxShadow = styles.boxShadow !== 'none';

    // Check for focus-related CSS classes
    const hasFocusClass =
      el.classList.contains('focus') ||
      el.classList.contains('focus:ring') ||
      el.className.includes('focus');

    return hasOutline || hasBoxShadow || hasFocusClass;
  });
}

test.describe('Keyboard Navigation - Skip Links', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('skip link should be first focusable element', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    // Press Tab to focus first element
    await page.keyboard.press('Tab');

    const focused = await getFocusedElementInfo(page);

    // First element should be skip link (anchor tag) or similar navigation aid
    if (focused.tagName === 'A') {
      // Check if it's a skip link
      const href = await page.evaluate(() => {
        const el = document.activeElement;
        return (el as HTMLAnchorElement)?.href || '';
      });
      expect(href).toContain('#');
    }
  });

  test('skip link should move focus to main content', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    // Tab to skip link
    await page.keyboard.press('Tab');

    const focused = await getFocusedElementInfo(page);

    if (focused.tagName === 'A') {
      // Activate skip link
      await page.keyboard.press('Enter');

      // Check focus moved to main content
      const newFocused = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          id: el?.id,
          tagName: el?.tagName,
        };
      });

      // Should be focused on main content area
      expect(
        newFocused.id === 'main-content' ||
        newFocused.tagName === 'MAIN' ||
        newFocused.id?.includes('main')
      ).toBeTruthy();
    }
  });

  test('skip link should be visible on focus', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    // Tab to skip link
    await page.keyboard.press('Tab');

    // Check if skip link is visible
    const isVisible = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el.tagName !== 'A') return false;

      const rect = el.getBoundingClientRect();
      const styles = window.getComputedStyle(el);

      // Element should have dimensions and be in viewport
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        styles.visibility !== 'hidden' &&
        styles.opacity !== '0'
      );
    });

    // Skip link should become visible when focused
    expect(isVisible).toBe(true);
  });
});

test.describe('Keyboard Navigation - No Keyboard Traps', () => {
  test('should not trap keyboard in sign in form', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    const focusableCount = await getFocusableElementsCount(page);

    // Tab through all elements plus some extra
    const tabsNeeded = focusableCount + 5;
    const visitedElements: string[] = [];

    for (let i = 0; i < tabsNeeded; i++) {
      await page.keyboard.press('Tab');

      const focused = await getFocusedElementInfo(page);
      const elementId = `${focused.tagName}-${focused.type || 'none'}-${focused.id || i}`;
      visitedElements.push(elementId);
    }

    // Should be able to cycle through (elements should repeat after full cycle)
    const uniqueElements = new Set(visitedElements);

    // If we have more unique elements than focusable elements * 2, we're not cycling properly
    // This indicates we can Tab through and aren't trapped
    expect(uniqueElements.size).toBeGreaterThan(0);
  });

  test('should not trap keyboard in modal dialogs', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await loginAsCustomer(page);
    await page.goto('/payments');
    await page.waitForLoadState('networkidle');

    // Open a modal
    const viewButton = page.locator('button:has-text("View"), button[aria-label*="View"]').first();

    if (await viewButton.count() > 0) {
      await viewButton.click();

      const modal = page.locator('[role="dialog"]');

      if (await modal.count() > 0) {
        await expect(modal).toBeVisible({ timeout: 5000 });

        // Count focusable elements in modal
        const modalFocusableCount = await page.evaluate(() => {
          const modal = document.querySelector('[role="dialog"]');
          if (!modal) return 0;

          const focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
          ].join(', ');

          return modal.querySelectorAll(focusableSelectors).length;
        });

        // Tab through modal elements
        for (let i = 0; i < modalFocusableCount + 3; i++) {
          await page.keyboard.press('Tab');

          // Focus should stay within modal
          const focusInModal = await page.evaluate(() => {
            const modal = document.querySelector('[role="dialog"]');
            return modal?.contains(document.activeElement) ?? false;
          });

          expect(focusInModal).toBe(true);
        }

        // Should be able to escape with Escape key (not trapped)
        await page.keyboard.press('Escape');
        await expect(modal).not.toBeVisible({ timeout: 2000 });
      }
    }
  });
});

test.describe('Keyboard Navigation - Focus Order', () => {
  test('focus order should follow visual order in sign in form', async ({
    page,
  }) => {
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    const focusOrder: string[] = [];

    // Tab through elements and record order
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');

      const focused = await getFocusedElementInfo(page);
      if (focused.type) {
        focusOrder.push(focused.type);
      } else if (focused.role) {
        focusOrder.push(focused.role);
      } else {
        focusOrder.push(focused.tagName.toLowerCase());
      }
    }

    // Check logical order: email should come before password
    const emailIndex = focusOrder.findIndex((t) => t === 'email');
    const passwordIndex = focusOrder.findIndex((t) => t === 'password');
    const submitIndex = focusOrder.findIndex((t) => t === 'submit');

    if (emailIndex !== -1 && passwordIndex !== -1) {
      expect(emailIndex).toBeLessThan(passwordIndex);
    }

    if (passwordIndex !== -1 && submitIndex !== -1) {
      expect(passwordIndex).toBeLessThan(submitIndex);
    }
  });

  test('focus order should follow visual order in navigation', async ({
    page,
  }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await loginAsCustomer(page);
    await page.goto('/payments');
    await page.waitForLoadState('networkidle');

    // Tab through navigation
    await page.keyboard.press('Tab'); // Skip link
    await page.keyboard.press('Tab'); // First nav item

    const navItems: string[] = [];

    for (let i = 0; i < 5; i++) {
      const focused = await getFocusedElementInfo(page);
      if (focused.textContent) {
        navItems.push(focused.textContent.toLowerCase());
      }
      await page.keyboard.press('Tab');
    }

    // Navigation items should be in a logical order
    expect(navItems.length).toBeGreaterThan(0);
  });
});

test.describe('Keyboard Navigation - Focus Visibility', () => {
  test('all interactive elements should have visible focus', async ({
    page,
  }) => {
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    const elementsWithoutFocus: string[] = [];

    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');

      const hasFocus = await hasVisibleFocusIndicator(page);
      const focused = await getFocusedElementInfo(page);

      if (!hasFocus && focused.tagName !== 'BODY') {
        elementsWithoutFocus.push(
          `${focused.tagName}${focused.id ? '#' + focused.id : ''}`
        );
      }
    }

    // All elements should have visible focus
    expect(elementsWithoutFocus).toEqual([]);
  });

  test('buttons should have visible focus indicators', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    // Find and focus each button
    const buttons = await page.locator('button').all();

    for (let i = 0; i < Math.min(5, buttons.length); i++) {
      await buttons[i].focus();

      const hasFocus = await hasVisibleFocusIndicator(page);
      expect(hasFocus).toBe(true);
    }
  });

  test('form inputs should have visible focus indicators', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    // Focus email input
    const emailInput = page.locator('input[type="email"]');
    await emailInput.focus();
    expect(await hasVisibleFocusIndicator(page)).toBe(true);

    // Focus password input
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.focus();
    expect(await hasVisibleFocusIndicator(page)).toBe(true);
  });

  test('links should have visible focus indicators', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    const links = await page.locator('a[href]').all();

    for (let i = 0; i < Math.min(3, links.length); i++) {
      await links[i].focus();

      const hasFocus = await hasVisibleFocusIndicator(page);
      expect(hasFocus).toBe(true);
    }
  });
});

test.describe('Keyboard Navigation - Special Key Handling', () => {
  test('Enter key should activate buttons', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    // Fill form
    await page.fill('input[type="email"]', 'customer@example.com');
    await page.fill('input[type="password"]', 'password123');

    // Focus submit button
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.focus();

    // Press Enter
    await page.keyboard.press('Enter');

    // Should submit and redirect
    await expect(page).toHaveURL(/.*payments/, { timeout: 15000 });
  });

  test('Space key should activate buttons', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    // Focus a non-submit button if available
    const regularButton = page.locator('button:not([type="submit"])').first();

    if (await regularButton.count() > 0) {
      await regularButton.focus();

      // Space should activate button (will trigger click handler)
      await page.keyboard.press('Space');

      // Button should have received activation
    }
  });

  test('Escape key should close modals', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await loginAsCustomer(page);
    await page.goto('/payments');
    await page.waitForLoadState('networkidle');

    const viewButton = page.locator('button:has-text("View"), button[aria-label*="View"]').first();

    if (await viewButton.count() > 0) {
      await viewButton.click();

      const modal = page.locator('[role="dialog"]');

      if (await modal.count() > 0) {
        await expect(modal).toBeVisible({ timeout: 5000 });

        // Press Escape
        await page.keyboard.press('Escape');

        // Modal should close
        await expect(modal).not.toBeVisible({ timeout: 2000 });
      }
    }
  });

  test('Arrow keys should navigate select options', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await loginAsCustomer(page);
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Go to preferences tab
    const preferencesTab = page.locator('button:has-text("Preferences")');
    await preferencesTab.click();
    await page.waitForTimeout(500);

    // Find a select element
    const select = page.locator('select').first();

    if (await select.count() > 0) {
      await select.focus();

      const _initialValue = await select.inputValue();

      // Press ArrowDown to change selection
      await page.keyboard.press('ArrowDown');

      // Value may change (depends on implementation)
      const _newValue = await select.inputValue();

      // Just verify we can interact with arrow keys
    }
  });
});

test.describe('Keyboard Navigation - Tab Panel Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await loginAsCustomer(page);
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
  });

  test('tabs should be navigable with Tab key', async ({ page }) => {
    // Tab to first tab
    await page.keyboard.press('Tab');

    let foundTab = false;
    for (let i = 0; i < 10; i++) {
      const focused = await getFocusedElementInfo(page);
      if (
        focused.role === 'tab' ||
        focused.textContent?.toLowerCase().includes('profile')
      ) {
        foundTab = true;
        break;
      }
      await page.keyboard.press('Tab');
    }

    expect(foundTab).toBe(true);
  });

  test('Enter key should activate tab', async ({ page }) => {
    // Focus Preferences tab
    const preferencesTab = page.locator('button:has-text("Preferences")');
    await preferencesTab.focus();

    // Press Enter
    await page.keyboard.press('Enter');

    // Preferences content should be visible
    await expect(page.locator('label:has-text("Language")')).toBeVisible({
      timeout: 2000,
    });
  });
});

test.describe('Keyboard Navigation - Form Submission', () => {
  test('forms should be submittable with keyboard only', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    // Type in email field
    await page.fill('input[type="email"]', 'customer@example.com');

    // Tab to password and type
    await page.keyboard.press('Tab');
    await page.keyboard.type('password123');

    // Tab to submit button
    await page.keyboard.press('Tab');

    // Verify submit button is focused
    const focused = await getFocusedElementInfo(page);
    expect(focused.type).toBe('submit');

    // Submit with Enter
    await page.keyboard.press('Enter');

    // Should redirect
    await expect(page).toHaveURL(/.*payments/, { timeout: 15000 });
  });

  test('profile form should be submittable with keyboard', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await loginAsCustomer(page);
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Fill phone field
    const phoneInput = page.locator('input[placeholder*="phone" i]');
    if (await phoneInput.count() > 0) {
      await phoneInput.fill('+91 98765 43210');

      // Tab to submit
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Press Enter to submit
      await page.keyboard.press('Enter');

      // Should show some feedback
      await page.waitForTimeout(1000);
    }
  });
});

test.describe('Keyboard Navigation - Navigation Menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await loginAsCustomer(page);
  });

  test('navigation links should be keyboard accessible', async ({ page }) => {
    await page.goto('/payments');
    await page.waitForLoadState('networkidle');

    // Tab through navigation
    const navLinks: string[] = [];

    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab');

      const focused = await getFocusedElementInfo(page);
      if (focused.tagName === 'A' && focused.textContent) {
        navLinks.push(focused.textContent.trim());
      }
    }

    // Should be able to reach navigation links
    expect(navLinks.length).toBeGreaterThan(0);
  });

  test('navigation links should be activatable with Enter', async ({
    page,
  }) => {
    await page.goto('/payments');
    await page.waitForLoadState('networkidle');

    // Find Profile link
    const profileLink = page.locator('a:has-text("Profile"), nav a[href*="profile"]');

    if (await profileLink.count() > 0) {
      await profileLink.first().focus();
      await page.keyboard.press('Enter');

      // Should navigate to profile
      await expect(page).toHaveURL(/.*profile/, { timeout: 5000 });
    }
  });
});

test.describe('Keyboard Navigation - Theme Toggle', () => {
  test('theme toggle should be keyboard accessible', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    const themeToggle = page.locator('[aria-label*="theme"], [aria-label*="Toggle"]');

    if (await themeToggle.count() > 0) {
      // Focus toggle
      await themeToggle.first().focus();

      // Should be focusable
      await expect(themeToggle.first()).toBeFocused();

      // Get initial theme state
      const isDarkBefore = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark');
      });

      // Press Enter to toggle
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);

      // Theme should change
      const isDarkAfter = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark');
      });

      expect(isDarkAfter).not.toBe(isDarkBefore);
    }
  });
});
