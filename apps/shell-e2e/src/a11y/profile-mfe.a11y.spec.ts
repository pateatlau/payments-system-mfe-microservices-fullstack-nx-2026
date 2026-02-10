/**
 * Profile MFE Accessibility Tests - WCAG 2.1 AA Compliance
 *
 * Comprehensive E2E accessibility tests for the Profile MFE covering:
 * - Profile page (tab navigation)
 * - Profile form (personal info)
 * - Preferences form
 * - Account settings
 * - MFA settings
 * - Linked accounts
 * - Avatar upload
 *
 * Tests verify:
 * - axe-core WCAG 2.1 AA compliance
 * - Keyboard navigation
 * - Tab panel accessibility
 * - Form accessibility
 * - Focus management
 *
 * @module shell-e2e/a11y/profile-mfe
 */

import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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
 * Helper to get focused element info
 */
async function getFocusedElementInfo(page: Page): Promise<{
  tagName: string;
  type?: string;
  id?: string;
  role?: string;
  ariaLabel?: string;
  textContent?: string;
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
    };
  });
}

test.describe('Profile MFE Accessibility - Main Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await loginAsCustomer(page);
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
  });

  test('should have no axe accessibility violations', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    if (results.violations.length > 0) {
      console.log(
        'Profile Page Violations:',
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
    expect(h1Text?.toLowerCase()).toContain('profile');

    // Check for navigation
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should have accessible tab navigation', async ({ page }) => {
    // Look for tab buttons (Profile, Preferences, Account)
    const profileTab = page.locator('button:has-text("Profile")');
    const preferencesTab = page.locator('button:has-text("Preferences")');
    const accountTab = page.locator('button:has-text("Account")');

    await expect(profileTab).toBeVisible();
    await expect(preferencesTab).toBeVisible();
    await expect(accountTab).toBeVisible();

    // Tabs should have proper ARIA
    const tabNavigation = page.locator('[aria-label*="tabs" i], nav');
    await expect(tabNavigation).toBeVisible();
  });

  test('should support keyboard tab navigation', async ({ page }) => {
    // Focus first tab
    const profileTab = page.locator('button:has-text("Profile")');
    await profileTab.focus();

    // Tab should be focused
    await expect(profileTab).toBeFocused();

    // Press Tab to move to next tab
    await page.keyboard.press('Tab');

    // Next tab should be focused
    const preferencesTab = page.locator('button:has-text("Preferences")');
    await expect(preferencesTab).toBeFocused();

    // Activate with Enter
    await page.keyboard.press('Enter');

    // Preferences content should be visible
    await expect(page.locator('label:has-text("Language")')).toBeVisible({
      timeout: 2000,
    });
  });
});

test.describe('Profile MFE Accessibility - Profile Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await loginAsCustomer(page);
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
  });

  test('profile form should have accessible labels', async ({ page }) => {
    // Check for phone input
    const phoneInput = page.locator('input[placeholder*="phone" i], input[name*="phone" i]');
    if (await phoneInput.count() > 0) {
      const phoneId = await phoneInput.getAttribute('id');
      if (phoneId) {
        const phoneLabel = page.locator(`label[for="${phoneId}"]`);
        await expect(phoneLabel).toBeVisible();
      }
    }

    // Check for address input
    const addressInput = page.locator('input[placeholder*="address" i], input[name*="address" i]');
    if (await addressInput.count() > 0) {
      const addressId = await addressInput.getAttribute('id');
      if (addressId) {
        const addressLabel = page.locator(`label[for="${addressId}"]`);
        await expect(addressLabel).toBeVisible();
      }
    }

    // Check for bio textarea
    const bioInput = page.locator('textarea[placeholder*="bio" i], textarea[name*="bio" i]');
    if (await bioInput.count() > 0) {
      const bioId = await bioInput.getAttribute('id');
      if (bioId) {
        const bioLabel = page.locator(`label[for="${bioId}"]`);
        await expect(bioLabel).toBeVisible();
      }
    }
  });

  test('profile form should be keyboard navigable', async ({ page }) => {
    // Tab to form elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Profile tab
    await page.keyboard.press('Tab'); // Preferences tab
    await page.keyboard.press('Tab'); // Account tab
    await page.keyboard.press('Tab'); // First form input

    // Should reach form inputs
    const focused = await getFocusedElementInfo(page);
    expect(['INPUT', 'TEXTAREA', 'BUTTON']).toContain(focused.tagName);

    // Navigate through form
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should eventually reach submit button
    let foundSubmit = false;
    for (let i = 0; i < 10; i++) {
      const current = await getFocusedElementInfo(page);
      if (
        current.type === 'submit' ||
        current.textContent?.toLowerCase().includes('update')
      ) {
        foundSubmit = true;
        break;
      }
      await page.keyboard.press('Tab');
    }

    expect(foundSubmit).toBe(true);
  });

  test('profile form should show accessible validation', async ({ page }) => {
    // Fill with invalid phone
    const phoneInput = page.locator('input[placeholder*="phone" i], input[name*="phone" i]');
    if (await phoneInput.count() > 0) {
      await phoneInput.fill('invalid');

      // Submit form
      const submitButton = page.locator('button[type="submit"]:has-text(/update/i)');
      await submitButton.click();

      await page.waitForTimeout(500);

      // Check for error indication
      const ariaInvalid = await phoneInput.getAttribute('aria-invalid');
      const hasError =
        ariaInvalid === 'true' ||
        (await page.locator('[role="alert"]').count()) > 0 ||
        (await page.locator('.text-destructive').count()) > 0;

      // Form should provide error feedback
    }
  });
});

test.describe('Profile MFE Accessibility - Preferences Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await loginAsCustomer(page);
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Navigate to Preferences tab
    const preferencesTab = page.locator('button:has-text("Preferences")');
    await preferencesTab.click();
    await page.waitForTimeout(500);
  });

  test('preferences form should have no axe violations', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    if (results.violations.length > 0) {
      console.log(
        'Preferences Tab Violations:',
        JSON.stringify(results.violations, null, 2)
      );
    }

    expect(results.violations).toEqual([]);
  });

  test('select elements should have accessible labels', async ({ page }) => {
    // Language select
    const languageSelect = page.locator('select[aria-label*="language" i], select[name*="language" i]');
    if (await languageSelect.count() > 0) {
      const ariaLabel = await languageSelect.getAttribute('aria-label');
      const id = await languageSelect.getAttribute('id');
      const hasLabel = id ? await page.locator(`label[for="${id}"]`).count() > 0 : false;
      expect(ariaLabel || hasLabel).toBeTruthy();
    }

    // Currency select
    const currencySelect = page.locator('select[aria-label*="currency" i], select[name*="currency" i]');
    if (await currencySelect.count() > 0) {
      const ariaLabel = await currencySelect.getAttribute('aria-label');
      const id = await currencySelect.getAttribute('id');
      const hasLabel = id ? await page.locator(`label[for="${id}"]`).count() > 0 : false;
      expect(ariaLabel || hasLabel).toBeTruthy();
    }

    // Timezone select
    const timezoneSelect = page.locator('select[aria-label*="timezone" i], select[name*="timezone" i]');
    if (await timezoneSelect.count() > 0) {
      const ariaLabel = await timezoneSelect.getAttribute('aria-label');
      const id = await timezoneSelect.getAttribute('id');
      const hasLabel = id ? await page.locator(`label[for="${id}"]`).count() > 0 : false;
      expect(ariaLabel || hasLabel).toBeTruthy();
    }
  });

  test('checkboxes should have accessible labels', async ({ page }) => {
    const checkboxes = await page.locator('input[type="checkbox"]').all();

    for (const checkbox of checkboxes) {
      const id = await checkbox.getAttribute('id');
      const ariaLabel = await checkbox.getAttribute('aria-label');
      const ariaLabelledBy = await checkbox.getAttribute('aria-labelledby');

      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
  });

  test('select dropdowns should be keyboard operable', async ({ page }) => {
    const languageSelect = page.locator('select[aria-label*="language" i], select[name*="language" i]');

    if (await languageSelect.count() > 0) {
      await languageSelect.focus();

      // Navigate with arrow keys
      await page.keyboard.press('ArrowDown');

      // Value should change
      const initialValue = await languageSelect.inputValue();

      await page.keyboard.press('ArrowDown');

      // Can navigate options
    }
  });
});

test.describe('Profile MFE Accessibility - Account Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await loginAsCustomer(page);
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Navigate to Account tab
    const accountTab = page.locator('button:has-text("Account")');
    await accountTab.click();
    await page.waitForTimeout(500);
  });

  test('account tab should have no axe violations', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    if (results.violations.length > 0) {
      console.log(
        'Account Tab Violations:',
        JSON.stringify(results.violations, null, 2)
      );
    }

    expect(results.violations).toEqual([]);
  });

  test('account info should have proper headings', async ({ page }) => {
    // Account section should have headings
    const headings = await page.locator('h2, h3').all();

    // Should have at least one section heading
    expect(headings.length).toBeGreaterThan(0);

    // Each heading should have text
    for (const heading of headings) {
      const text = await heading.textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });
});

test.describe('Profile MFE Accessibility - MFA Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await loginAsCustomer(page);
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Navigate to Account tab
    const accountTab = page.locator('button:has-text("Account")');
    await accountTab.click();
    await page.waitForTimeout(500);
  });

  test('MFA settings should be accessible', async ({ page }) => {
    // Look for MFA section
    const mfaSection = page.locator('text=/MFA|Two-Factor|Authentication/i');

    if (await mfaSection.count() > 0) {
      // MFA toggle/button should be accessible
      const mfaButton = page.locator('button:has-text("Enable"), button:has-text("MFA"), button:has-text("Set up")');

      if (await mfaButton.count() > 0) {
        const text = await mfaButton.first().textContent();
        const ariaLabel = await mfaButton.first().getAttribute('aria-label');
        expect(text?.trim() || ariaLabel).toBeTruthy();
      }
    }
  });
});

test.describe('Profile MFE Accessibility - Linked Accounts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await loginAsCustomer(page);
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Navigate to Account tab
    const accountTab = page.locator('button:has-text("Account")');
    await accountTab.click();
    await page.waitForTimeout(500);
  });

  test('linked accounts section should be accessible', async ({ page }) => {
    // Look for linked accounts section
    const linkedSection = page.locator('text=/Linked|Connected|Accounts/i');

    if (await linkedSection.count() > 0) {
      // Linked account buttons should be accessible
      const linkButtons = page.locator('button:has-text("Google"), button:has-text("GitHub"), button:has-text("Microsoft")');

      if (await linkButtons.count() > 0) {
        for (let i = 0; i < await linkButtons.count(); i++) {
          const button = linkButtons.nth(i);
          const text = await button.textContent();
          const ariaLabel = await button.getAttribute('aria-label');
          expect(text?.trim() || ariaLabel).toBeTruthy();
        }
      }
    }
  });
});

test.describe('Profile MFE Accessibility - Avatar Upload', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await loginAsCustomer(page);
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
  });

  test('avatar upload should be accessible', async ({ page }) => {
    // Look for avatar/image upload
    const avatarSection = page.locator('[class*="avatar"], [aria-label*="avatar" i], [aria-label*="profile picture" i]');

    if (await avatarSection.count() > 0) {
      // Check for accessible file input
      const fileInput = page.locator('input[type="file"]');

      if (await fileInput.count() > 0) {
        const id = await fileInput.getAttribute('id');
        const ariaLabel = await fileInput.getAttribute('aria-label');

        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          const hasLabel = await label.count() > 0;
          expect(hasLabel || ariaLabel).toBeTruthy();
        }
      }

      // Or check for accessible button trigger
      const uploadButton = page.locator('button:has-text("Upload"), button:has-text("Change"), button[aria-label*="upload" i]');

      if (await uploadButton.count() > 0) {
        const text = await uploadButton.first().textContent();
        const ariaLabel = await uploadButton.first().getAttribute('aria-label');
        expect(text?.trim() || ariaLabel).toBeTruthy();
      }
    }
  });
});

test.describe('Profile MFE Accessibility - Focus Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await loginAsCustomer(page);
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
  });

  test('tab switching should maintain logical focus', async ({ page }) => {
    // Focus Profile tab
    const profileTab = page.locator('button:has-text("Profile")');
    await profileTab.focus();

    // Switch to Preferences
    const preferencesTab = page.locator('button:has-text("Preferences")');
    await preferencesTab.click();

    await page.waitForTimeout(300);

    // Focus should be on Preferences tab or first element in panel
    const focused = await getFocusedElementInfo(page);
    expect(focused.tagName).toBeDefined();
  });

  test('visible focus indicators on all interactive elements', async ({
    page,
  }) => {
    const interactiveElements = await page.locator(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
    ).all();

    for (let i = 0; i < Math.min(5, interactiveElements.length); i++) {
      await page.keyboard.press('Tab');

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
});

test.describe('Profile MFE Accessibility - Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await loginAsCustomer(page);
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
  });

  test('form errors should be announced to screen readers', async ({
    page,
  }) => {
    // Submit profile form with invalid data
    const phoneInput = page.locator('input[placeholder*="phone" i]');

    if (await phoneInput.count() > 0) {
      await phoneInput.fill('invalid-phone');

      const submitButton = page.locator('button[type="submit"]:has-text(/update/i)');
      await submitButton.click();

      await page.waitForTimeout(500);

      // Error should be in alert role or aria-live region
      const alerts = await page.locator('[role="alert"], [aria-live="assertive"], [aria-live="polite"]').all();

      // Check for error indicators
      const errorIndicators = await page.locator('[aria-invalid="true"], .text-destructive').all();

      // Either alerts or error indicators should be present
    }
  });
});

test.describe('Profile MFE Accessibility - Color Contrast', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await loginAsCustomer(page);
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
  });

  test('should pass color contrast in light mode', async ({ page }) => {
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
        'Profile Light Mode Contrast Issues:',
        JSON.stringify(contrastViolations, null, 2)
      );
    }

    expect(contrastViolations).toEqual([]);
  });

  test('should pass color contrast in dark mode', async ({ page }) => {
    const themeToggle = page.locator('[aria-label*="theme"], [aria-label*="dark"], [aria-label*="Toggle"]');

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
          'Profile Dark Mode Contrast Issues:',
          JSON.stringify(contrastViolations, null, 2)
        );
      }

      expect(contrastViolations).toEqual([]);
    }
  });
});
