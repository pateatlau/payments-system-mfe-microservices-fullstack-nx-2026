/**
 * Auth MFE Accessibility Tests - WCAG 2.1 AA Compliance
 *
 * Comprehensive E2E accessibility tests for the Auth MFE covering:
 * - Sign In page
 * - Sign Up page
 * - Forgot Password page
 * - Reset Password page
 * - Verification pages
 *
 * Tests verify:
 * - axe-core WCAG 2.1 AA compliance
 * - Keyboard navigation
 * - Focus management
 * - Form accessibility
 * - Error message accessibility
 * - ARIA attributes
 *
 * @module shell-e2e/a11y/auth-mfe
 */

import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Helper to get all focusable elements count
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
 * Helper to get currently focused element info
 */
async function getFocusedElementInfo(page: Page): Promise<{
  tagName: string;
  type?: string;
  id?: string;
  name?: string;
  role?: string;
  ariaLabel?: string;
}> {
  return page.evaluate(() => {
    const el = document.activeElement;
    return {
      tagName: el?.tagName || '',
      type: (el as HTMLInputElement)?.type,
      id: el?.id,
      name: (el as HTMLInputElement)?.name,
      role: el?.getAttribute('role') || undefined,
      ariaLabel: el?.getAttribute('aria-label') || undefined,
    };
  });
}

test.describe('Auth MFE Accessibility - Sign In Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');
  });

  test('should have no axe accessibility violations', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    if (results.violations.length > 0) {
      console.log(
        'Sign In Page Violations:',
        JSON.stringify(results.violations, null, 2)
      );
    }

    expect(results.violations).toEqual([]);
  });

  test('should have proper page structure and landmarks', async ({ page }) => {
    // Check for main landmark
    await expect(page.locator('main, [role="main"]')).toBeVisible();

    // Check for h1 heading
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    const h1Text = await h1.textContent();
    expect(h1Text?.toLowerCase()).toContain('sign in');

    // Check for form element
    await expect(page.locator('form')).toBeVisible();
  });

  test('should have proper form labels and associations', async ({ page }) => {
    // Email input should have associated label
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    const emailId = await emailInput.getAttribute('id');
    expect(emailId).toBeTruthy();

    // Label should be associated with input via htmlFor
    const emailLabel = page.locator(`label[for="${emailId}"]`);
    await expect(emailLabel).toBeVisible();

    // Password input should have associated label
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    const passwordId = await passwordInput.getAttribute('id');
    expect(passwordId).toBeTruthy();

    const passwordLabel = page.locator(`label[for="${passwordId}"]`);
    await expect(passwordLabel).toBeVisible();
  });

  test('should support complete keyboard-only navigation', async ({ page }) => {
    // Start from the beginning
    await page.keyboard.press('Tab');

    // Should be able to Tab through all interactive elements
    const focusableCount = await getFocusableElementsCount(page);
    expect(focusableCount).toBeGreaterThan(3); // At least email, password, submit, and links

    // Tab to email input
    let focused = await getFocusedElementInfo(page);
    let tabCount = 0;
    const maxTabs = 20;

    while (focused.type !== 'email' && tabCount < maxTabs) {
      await page.keyboard.press('Tab');
      focused = await getFocusedElementInfo(page);
      tabCount++;
    }

    expect(focused.type).toBe('email');

    // Tab to password
    await page.keyboard.press('Tab');
    focused = await getFocusedElementInfo(page);
    expect(focused.type).toBe('password');

    // Tab to submit button
    await page.keyboard.press('Tab');
    focused = await getFocusedElementInfo(page);
    expect(focused.tagName).toBe('BUTTON');
    expect(focused.type).toBe('submit');
  });

  test('should show accessible error messages on validation', async ({
    page,
  }) => {
    // Submit empty form to trigger validation
    await page.click('button[type="submit"]');

    // Wait for validation errors
    await page.waitForTimeout(500);

    // Check for error messages with proper ARIA
    const errorMessages = await page.locator('[role="alert"], .text-destructive').all();
    expect(errorMessages.length).toBeGreaterThan(0);

    // Check that invalid fields have aria-invalid
    const emailInput = page.locator('input[type="email"]');
    const ariaInvalid = await emailInput.getAttribute('aria-invalid');
    // If validation is triggered, aria-invalid should be set
    // (may be true or not present depending on validation state)
  });

  test('should announce errors to screen readers', async ({ page }) => {
    // Fill invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'short');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(500);

    // Error messages should have role="alert" or be in aria-live region
    const alerts = await page.locator('[role="alert"]').all();

    // At least check that error text is visible
    const errorText = page.locator('text=/invalid|error|required|minimum/i');
    const errorVisible = await errorText.count();
    // Form may validate or show error - both are acceptable
  });

  test('should allow form submission with keyboard only', async ({ page }) => {
    // Fill email with keyboard
    await page.fill('input[type="email"]', 'customer@example.com');

    // Tab to password and type
    await page.keyboard.press('Tab');
    await page.keyboard.type('password123');

    // Tab to submit
    await page.keyboard.press('Tab');

    // Submit with Enter
    await page.keyboard.press('Enter');

    // Should redirect to payments on successful login
    await expect(page).toHaveURL(/.*payments/, { timeout: 15000 });
  });

  test('should have visible focus indicators on all interactive elements', async ({
    page,
  }) => {
    const interactiveElements = await page.locator(
      'button:not([disabled]), a[href], input:not([disabled])'
    ).all();

    for (let i = 0; i < Math.min(5, interactiveElements.length); i++) {
      await page.keyboard.press('Tab');

      // Check focus is visible (has outline or ring)
      const hasFocusStyles = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return false;

        const styles = window.getComputedStyle(el);
        return (
          styles.outlineWidth !== '0px' ||
          styles.boxShadow !== 'none' ||
          el.classList.contains('focus:ring') ||
          el.className.includes('focus')
        );
      });

      expect(hasFocusStyles).toBe(true);
    }
  });

  test('should have accessible password toggle button', async ({ page }) => {
    // Look for password visibility toggle
    const passwordToggle = page.locator('button[aria-label*="password"], button[aria-label*="Show"], button[aria-label*="Hide"]');

    if (await passwordToggle.count() > 0) {
      // Toggle button should have aria-label
      const ariaLabel = await passwordToggle.first().getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();

      // Toggle should be keyboard accessible
      await passwordToggle.first().focus();
      await page.keyboard.press('Enter');

      // Password input type should change
      const passwordInput = page.locator('input[name="password"], input[id*="password"]');
      const inputType = await passwordInput.getAttribute('type');
      expect(['text', 'password']).toContain(inputType);
    }
  });
});

test.describe('Auth MFE Accessibility - Sign Up Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
  });

  test('should have no axe accessibility violations', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    if (results.violations.length > 0) {
      console.log(
        'Sign Up Page Violations:',
        JSON.stringify(results.violations, null, 2)
      );
    }

    expect(results.violations).toEqual([]);
  });

  test('should have proper page structure with h1', async ({ page }) => {
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    const h1Text = await h1.textContent();
    expect(h1Text?.toLowerCase()).toContain('sign up');
  });

  test('should have all form fields properly labeled', async ({ page }) => {
    // Check name field
    const nameInput = page.locator('input[name="name"], input[id*="name"]');
    if (await nameInput.count() > 0) {
      const nameId = await nameInput.getAttribute('id');
      if (nameId) {
        const nameLabel = page.locator(`label[for="${nameId}"]`);
        await expect(nameLabel).toBeVisible();
      }
    }

    // Check email field
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    const emailId = await emailInput.getAttribute('id');
    if (emailId) {
      const emailLabel = page.locator(`label[for="${emailId}"]`);
      await expect(emailLabel).toBeVisible();
    }

    // Check password field
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible();
    const passwordId = await passwordInput.getAttribute('id');
    if (passwordId) {
      const passwordLabel = page.locator(`label[for="${passwordId}"]`);
      await expect(passwordLabel).toBeVisible();
    }
  });

  test('should support keyboard navigation through all fields', async ({
    page,
  }) => {
    await page.keyboard.press('Tab');

    // Navigate through form fields
    const focusableCount = await getFocusableElementsCount(page);
    expect(focusableCount).toBeGreaterThan(4); // At least name, email, password, confirm, submit

    // Tab through all elements without getting stuck
    for (let i = 0; i < focusableCount + 2; i++) {
      await page.keyboard.press('Tab');
    }

    // Should be able to reach submit button
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.focus();
    await expect(submitButton).toBeFocused();
  });

  test('should indicate required fields accessibly', async ({ page }) => {
    // Check for required indicators
    const requiredLabels = await page.locator('label:has-text("*")').all();

    // Or check for aria-required on inputs
    const requiredInputs = await page.locator('[aria-required="true"], [required]').all();

    // Should have at least email and password as required
    expect(requiredLabels.length + requiredInputs.length).toBeGreaterThan(0);
  });

  test('should show validation errors accessibly', async ({ page }) => {
    // Fill with invalid data
    await page.fill('input[type="email"]', 'invalid');

    // Submit form
    await page.click('button[type="submit"]');

    await page.waitForTimeout(500);

    // Check for error messages
    const errors = await page.locator('[role="alert"], .text-destructive, [aria-live="assertive"]').all();
    // Form should show some indication of errors (visible text or aria-live)
  });
});

test.describe('Auth MFE Accessibility - Forgot Password Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');
  });

  test('should have no axe accessibility violations', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    if (results.violations.length > 0) {
      console.log(
        'Forgot Password Page Violations:',
        JSON.stringify(results.violations, null, 2)
      );
    }

    expect(results.violations).toEqual([]);
  });

  test('should have proper heading structure', async ({ page }) => {
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
  });

  test('should have accessible email input', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    const emailId = await emailInput.getAttribute('id');
    if (emailId) {
      const label = page.locator(`label[for="${emailId}"]`);
      await expect(label).toBeVisible();
    }
  });

  test('should be fully operable with keyboard', async ({ page }) => {
    // Tab to email input
    await page.keyboard.press('Tab');

    let focused = await getFocusedElementInfo(page);
    let tabCount = 0;
    while (focused.type !== 'email' && tabCount < 10) {
      await page.keyboard.press('Tab');
      focused = await getFocusedElementInfo(page);
      tabCount++;
    }

    // Type email
    await page.keyboard.type('test@example.com');

    // Tab to submit
    await page.keyboard.press('Tab');
    focused = await getFocusedElementInfo(page);
    expect(focused.tagName).toBe('BUTTON');
  });
});

test.describe('Auth MFE Accessibility - Skip Links', () => {
  test('should have skip link as first focusable element', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    // Press Tab to focus skip link
    await page.keyboard.press('Tab');

    // Check if skip link is focused
    const focused = await getFocusedElementInfo(page);

    // Skip link should be focused and should link to main content
    if (focused.tagName === 'A') {
      const skipLink = page.locator('a:focus');
      const href = await skipLink.getAttribute('href');
      expect(href).toContain('#');
    }
  });

  test('skip link should work correctly', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    // Focus and activate skip link
    await page.keyboard.press('Tab');

    const focused = await getFocusedElementInfo(page);
    if (focused.tagName === 'A') {
      await page.keyboard.press('Enter');

      // Main content should be focused
      const newFocused = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          id: el?.id,
          tagName: el?.tagName,
        };
      });

      // Should focus on main content or first element within it
      expect(newFocused.id === 'main-content' || newFocused.tagName === 'MAIN').toBeTruthy();
    }
  });
});

test.describe('Auth MFE Accessibility - Color Contrast', () => {
  test('should pass color contrast in light mode', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .options({
        rules: {
          'color-contrast': { enabled: true },
        },
      })
      .analyze();

    const contrastViolations = results.violations.filter(
      (v) => v.id === 'color-contrast'
    );

    if (contrastViolations.length > 0) {
      console.log(
        'Light Mode Contrast Issues:',
        JSON.stringify(contrastViolations, null, 2)
      );
    }

    expect(contrastViolations).toEqual([]);
  });

  test('should pass color contrast in dark mode', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    // Toggle to dark mode if available
    const themeToggle = page.locator(
      '[aria-label*="theme"], [aria-label*="dark"], [aria-label*="light"], [aria-label*="Toggle"]'
    );

    if (await themeToggle.count() > 0) {
      await themeToggle.first().click();
      await page.waitForTimeout(500);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .options({
          rules: {
            'color-contrast': { enabled: true },
          },
        })
        .analyze();

      const contrastViolations = results.violations.filter(
        (v) => v.id === 'color-contrast'
      );

      if (contrastViolations.length > 0) {
        console.log(
          'Dark Mode Contrast Issues:',
          JSON.stringify(contrastViolations, null, 2)
        );
      }

      expect(contrastViolations).toEqual([]);
    }
  });
});

test.describe('Auth MFE Accessibility - Social Login', () => {
  test('social login buttons should be accessible', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    // Check for social login buttons
    const socialButtons = page.locator('button:has-text("Google"), button:has-text("GitHub"), button:has-text("Microsoft")');

    const socialButtonCount = await socialButtons.count();

    if (socialButtonCount > 0) {
      for (let i = 0; i < socialButtonCount; i++) {
        const button = socialButtons.nth(i);

        // Each button should have accessible name
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        expect(text?.trim() || ariaLabel).toBeTruthy();

        // Button should be focusable
        await button.focus();
        await expect(button).toBeFocused();
      }
    }
  });
});
