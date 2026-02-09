/**
 * Accessibility Audit Tests - WCAG 2.1 AA Compliance
 *
 * These E2E tests verify WCAG 2.1 Level AA compliance across all MFE pages
 * using @axe-core/playwright for automated accessibility audits.
 *
 * Test Categories:
 * - Page-level accessibility audits
 * - Keyboard navigation verification
 * - Focus management
 * - ARIA attributes
 * - Screen reader compatibility
 *
 * @module shell-e2e/a11y-audit
 */

import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Helper to login for authenticated pages
async function loginAsCustomer(page: Page): Promise<void> {
  await page.goto('/signin');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', 'customer@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*payments/, { timeout: 15000 });
}

async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/signin');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', 'admin@example.com');
  await page.fill('input[type="password"]', 'Admin123!@#');
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*payments/, { timeout: 15000 });
}

test.describe('Accessibility Audit - Unauthenticated Pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('Sign In page should have no critical accessibility violations', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    // Log violations for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Sign In Page Violations:', JSON.stringify(accessibilityScanResults.violations, null, 2));
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Sign Up page should have no critical accessibility violations', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.log('Sign Up Page Violations:', JSON.stringify(accessibilityScanResults.violations, null, 2));
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.describe('Accessibility Audit - Authenticated Pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await loginAsCustomer(page);
  });

  test('Payments page should have no critical accessibility violations', async ({ page }) => {
    await page.goto('/payments');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.log('Payments Page Violations:', JSON.stringify(accessibilityScanResults.violations, null, 2));
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Profile page should have no critical accessibility violations', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.log('Profile Page Violations:', JSON.stringify(accessibilityScanResults.violations, null, 2));
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.describe('Accessibility Audit - Admin Pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await loginAsAdmin(page);
  });

  test('Admin page should have no critical accessibility violations', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.log('Admin Page Violations:', JSON.stringify(accessibilityScanResults.violations, null, 2));
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('Sign In form should be navigable by keyboard', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    // Start keyboard navigation
    await page.keyboard.press('Tab');

    // First focusable element should be the email input or a link
    let focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return { tagName: el?.tagName, type: (el as HTMLInputElement)?.type };
    });

    // Tab to email input with max iteration guard
    const maxTabs = 20;
    let tabCount = 0;
    while (focusedElement.type !== 'email' && tabCount < maxTabs) {
      await page.keyboard.press('Tab');
      focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return { tagName: el?.tagName, type: (el as HTMLInputElement)?.type };
      });
      tabCount++;
    }

    if (tabCount >= maxTabs) {
      throw new Error(`Could not reach email input after ${maxTabs} tab presses. Focus is on: ${focusedElement.tagName}[type=${focusedElement.type}]`);
    }

    expect(focusedElement.tagName).toBe('INPUT');
    expect(focusedElement.type).toBe('email');

    // Tab to password field
    await page.keyboard.press('Tab');
    focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return { tagName: el?.tagName, type: (el as HTMLInputElement)?.type };
    });
    expect(focusedElement.tagName).toBe('INPUT');
    expect(focusedElement.type).toBe('password');

    // Tab to submit button
    await page.keyboard.press('Tab');
    focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return { tagName: el?.tagName, type: (el as HTMLInputElement)?.type };
    });
    expect(focusedElement.tagName).toBe('BUTTON');
    expect(focusedElement.type).toBe('submit');
  });

  test('Sign In can be submitted using keyboard', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    // Type in email
    await page.fill('input[type="email"]', 'customer@example.com');

    // Tab to password and type
    await page.keyboard.press('Tab');
    await page.keyboard.type('password123');

    // Tab to submit and press Enter
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    // Should redirect to payments on successful login
    await expect(page).toHaveURL(/.*payments/, { timeout: 15000 });
  });
});

test.describe('Focus Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await loginAsCustomer(page);
  });

  test('Focus should be visible on all interactive elements', async ({ page }) => {
    await page.goto('/payments');
    await page.waitForLoadState('networkidle');

    // Get all interactive elements
    const interactiveElements = await page.locator(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ).all();

    // Check that at least some interactive elements exist
    expect(interactiveElements.length).toBeGreaterThan(0);

    // Tab through elements and verify focus is visible
    for (let i = 0; i < Math.min(5, interactiveElements.length); i++) {
      await page.keyboard.press('Tab');

      const hasFocusStyles = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return false;

        const styles = window.getComputedStyle(el);
        const pseudoStyles = window.getComputedStyle(el, ':focus');

        // Check for visible focus indicators
        return (
          styles.outlineWidth !== '0px' ||
          styles.boxShadow !== 'none' ||
          pseudoStyles.outlineWidth !== '0px' ||
          el.classList.contains('focus:ring') ||
          el.className.includes('focus')
        );
      });

      // Focus indicators should be present for accessibility
      // Note: This is a soft check - hard failures would be caught by axe-core
      expect(hasFocusStyles).toBe(true);
    }
  });

  test('Profile tabs should maintain focus management', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Tab to first tab button
    await page.keyboard.press('Tab');

    // Verify we've reached an interactive element (tab, button, or input)
    const firstFocusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tagName: el?.tagName,
        role: el?.getAttribute('role'),
        textContent: el?.textContent?.toLowerCase(),
      };
    });

    // First focused element should be a tab, button, or link
    expect(['BUTTON', 'A', 'INPUT']).toContain(firstFocusedElement.tagName);

    // Tab to next tab
    await page.keyboard.press('Tab');

    // Activate tab with Enter
    await page.keyboard.press('Enter');

    // Content should update
    await page.waitForTimeout(300);

    // Tab content should be visible
    await expect(page.locator('form, [role="tabpanel"]')).toBeVisible();
  });
});

test.describe('ARIA Attributes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('Sign In page should have proper ARIA landmarks', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    // Check for main landmark
    const hasMain = await page.locator('main, [role="main"]').count();
    expect(hasMain).toBeGreaterThan(0);

    // Navigation landmark is optional on signin page (unauthenticated state)
    // No assertion needed - just documenting that nav may or may not be present

    // Check for form elements have labels
    const emailInput = page.locator('input[type="email"]');
    const emailId = await emailInput.getAttribute('id');

    if (emailId) {
      const hasLabel = await page.locator(`label[for="${emailId}"]`).count();
      expect(hasLabel).toBeGreaterThan(0);
    }
  });

  test('Form error messages should have proper ARIA', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    // Submit empty form to trigger validation
    await page.click('button[type="submit"]');

    // Wait for validation messages
    await page.waitForTimeout(500);

    // Check if error messages have proper roles
    const errorMessages = await page.locator('[role="alert"], .text-destructive, .text-red-500').all();

    // Collect assertion failures for better error reporting
    const failedElements: string[] = [];

    // Each error message should be announced to screen readers
    for (const error of errorMessages) {
      const role = await error.getAttribute('role');
      const ariaLive = await error.getAttribute('aria-live');
      const text = await error.textContent();

      // Check if element or parent has role="alert" or aria-live
      const hasParentAlert = await error.evaluate((el) =>
        el.closest('[role="alert"]') !== null
      );

      const isProperlyAnnounced =
        role === 'alert' ||
        ariaLive === 'assertive' ||
        ariaLive === 'polite' ||
        hasParentAlert;

      if (!isProperlyAnnounced && text?.trim()) {
        failedElements.push(`Error message "${text?.substring(0, 50)}" lacks role="alert" or aria-live attribute`);
      }
    }

    // Assert all error messages are properly announced
    expect(failedElements).toEqual([]);
  });

  test('Buttons should have accessible names', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    const buttons = await page.locator('button').all();

    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaLabelledby = await button.getAttribute('aria-labelledby');

      // Button should have text, aria-label, or aria-labelledby
      expect(text?.trim() || ariaLabel || ariaLabelledby).toBeTruthy();
    }
  });
});

test.describe('Color Contrast', () => {
  test('Should capture screenshots for manual contrast verification', async ({ page }, testInfo) => {
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    // Helper to run contrast check
    async function runContrastCheck(): Promise<{ id: string; description: string; nodes: unknown[] }[]> {
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .options({
          rules: {
            'color-contrast': { enabled: true },
          },
        })
        .analyze();
      return results.violations.filter((v) => v.id === 'color-contrast');
    }

    // Run contrast check on light mode
    const lightModeViolations = await runContrastCheck();

    // Take screenshot of light mode - use testInfo.outputPath for unique paths
    await page.screenshot({
      path: testInfo.outputPath('a11y-audit-signin-light.png'),
      fullPage: true,
    });

    // Toggle to dark mode if available
    const themeToggle = page.locator('[aria-label*="theme"], [aria-label*="dark"], [aria-label*="light"]');
    let darkModeViolations: { id: string; description: string; nodes: unknown[] }[] = [];
    if (await themeToggle.count() > 0) {
      await themeToggle.first().click();
      await page.waitForTimeout(500);

      // Run contrast check on dark mode
      darkModeViolations = await runContrastCheck();

      await page.screenshot({
        path: testInfo.outputPath('a11y-audit-signin-dark.png'),
        fullPage: true,
      });
    }

    // Combine violations from both modes
    const allContrastViolations = [...lightModeViolations, ...darkModeViolations];

    if (allContrastViolations.length > 0) {
      console.log('Light Mode Contrast Issues:', JSON.stringify(lightModeViolations, null, 2));
      console.log('Dark Mode Contrast Issues:', JSON.stringify(darkModeViolations, null, 2));
    }

    // Contrast violations should be zero for WCAG 2.1 AA in both modes
    expect(allContrastViolations).toEqual([]);
  });
});

test.describe('Page Title and Language', () => {
  test('Pages should have proper titles', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('HTML should have lang attribute', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    const lang = await page.getAttribute('html', 'lang');
    expect(lang).toBeTruthy();
    expect(lang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/); // e.g., "en" or "en-US"
  });
});
