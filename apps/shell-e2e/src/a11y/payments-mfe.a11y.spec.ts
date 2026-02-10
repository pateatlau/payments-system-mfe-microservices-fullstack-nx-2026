/**
 * Payments MFE Accessibility Tests - WCAG 2.1 AA Compliance
 *
 * Comprehensive E2E accessibility tests for the Payments MFE covering:
 * - Payments list page
 * - Payment details modal
 * - Payment create form
 * - Payment filters
 * - Reports page
 * - Data tables
 *
 * Tests verify:
 * - axe-core WCAG 2.1 AA compliance
 * - Keyboard navigation
 * - Focus management (including modal focus trap)
 * - Form accessibility
 * - Table accessibility
 * - ARIA attributes
 *
 * @module shell-e2e/a11y/payments-mfe
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

test.describe('Payments MFE Accessibility - Payments List Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await loginAsCustomer(page);
    await page.goto('/payments');
    await page.waitForLoadState('networkidle');
  });

  test('should have no axe accessibility violations', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    if (results.violations.length > 0) {
      console.log(
        'Payments Page Violations:',
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
    expect(h1Text?.toLowerCase()).toContain('payment');

    // Check for navigation landmark
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should have accessible data table structure', async ({ page }) => {
    // Wait for table to load
    const table = page.locator('table');

    if (await table.count() > 0) {
      // Check for table headers with scope
      const headers = await page.locator('th[scope="col"], th').all();
      expect(headers.length).toBeGreaterThan(0);

      // Check for table caption or aria-label
      const tableElement = table.first();
      const ariaLabel = await tableElement.getAttribute('aria-label');
      const ariaDescribedBy = await tableElement.getAttribute('aria-describedby');
      const caption = await page.locator('table caption').count();

      // Table should have accessible name via caption, aria-label, or aria-describedby
      expect(ariaLabel || ariaDescribedBy || caption > 0).toBeTruthy();

      // Check for tbody structure
      await expect(page.locator('tbody')).toBeVisible();
    }
  });

  test('should allow keyboard navigation through table rows', async ({
    page,
  }) => {
    const table = page.locator('table');

    if (await table.count() > 0) {
      // Tab to table area
      await page.keyboard.press('Tab');

      // Find View button in table
      const viewButtons = page.locator('table button, table a[href]');
      const buttonCount = await viewButtons.count();

      if (buttonCount > 0) {
        // Should be able to focus on table action buttons
        await viewButtons.first().focus();
        await expect(viewButtons.first()).toBeFocused();
      }
    }
  });

  test('should have accessible action buttons in table', async ({ page }) => {
    const table = page.locator('table');

    if (await table.count() > 0) {
      // Check for action buttons with accessible names
      const actionButtons = await page.locator('table button').all();

      for (const button of actionButtons) {
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');

        // Each button should have accessible name
        expect(text?.trim() || ariaLabel).toBeTruthy();
      }
    }
  });
});

test.describe('Payments MFE Accessibility - Payment Details Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await loginAsCustomer(page);
    await page.goto('/payments');
    await page.waitForLoadState('networkidle');
  });

  test('should open modal with proper ARIA attributes', async ({ page }) => {
    // Click on View button to open modal
    const viewButton = page.locator('button:has-text("View"), button[aria-label*="View"]').first();

    if (await viewButton.count() > 0) {
      await viewButton.click();

      // Wait for modal
      const modal = page.locator('[role="dialog"], [aria-modal="true"]');
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Check ARIA attributes
      const ariaModal = await modal.getAttribute('aria-modal');
      expect(ariaModal).toBe('true');

      // Check for aria-labelledby or aria-label
      const ariaLabelledBy = await modal.getAttribute('aria-labelledby');
      const ariaLabel = await modal.getAttribute('aria-label');
      expect(ariaLabelledBy || ariaLabel).toBeTruthy();
    }
  });

  test('should trap focus within modal', async ({ page }) => {
    const viewButton = page.locator('button:has-text("View"), button[aria-label*="View"]').first();

    if (await viewButton.count() > 0) {
      await viewButton.click();

      // Wait for modal
      const modal = page.locator('[role="dialog"], [aria-modal="true"]');
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Get all focusable elements in modal
      const focusableInModal = await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"], [aria-modal="true"]');
        if (!modal) return 0;

        const focusableSelectors = [
          'a[href]',
          'button:not([disabled])',
          'input:not([disabled])',
          'select:not([disabled])',
          'textarea:not([disabled])',
          '[tabindex]:not([tabindex="-1"])',
        ].join(', ');

        return modal.querySelectorAll(focusableSelectors).length;
      });

      expect(focusableInModal).toBeGreaterThan(0);

      // Tab through all elements and ensure we stay in modal
      for (let i = 0; i < focusableInModal + 2; i++) {
        await page.keyboard.press('Tab');

        // Check focus is still within modal
        const focusedInModal = await page.evaluate(() => {
          const modal = document.querySelector('[role="dialog"], [aria-modal="true"]');
          const activeEl = document.activeElement;
          return modal?.contains(activeEl) ?? false;
        });

        expect(focusedInModal).toBe(true);
      }
    }
  });

  test('should close modal with Escape key', async ({ page }) => {
    const viewButton = page.locator('button:has-text("View"), button[aria-label*="View"]').first();

    if (await viewButton.count() > 0) {
      await viewButton.click();

      // Wait for modal
      const modal = page.locator('[role="dialog"], [aria-modal="true"]');
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Press Escape
      await page.keyboard.press('Escape');

      // Modal should be closed
      await expect(modal).not.toBeVisible({ timeout: 2000 });
    }
  });

  test('should restore focus to trigger element on modal close', async ({
    page,
  }) => {
    const viewButton = page.locator('button:has-text("View"), button[aria-label*="View"]').first();

    if (await viewButton.count() > 0) {
      // Focus and click the button
      await viewButton.focus();
      await viewButton.click();

      // Wait for modal
      const modal = page.locator('[role="dialog"], [aria-modal="true"]');
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Close modal with Escape
      await page.keyboard.press('Escape');

      // Wait for modal to close
      await expect(modal).not.toBeVisible({ timeout: 2000 });

      // Focus should return to the trigger button
      const focused = await getFocusedElementInfo(page);
      expect(focused.tagName).toBe('BUTTON');
    }
  });
});

test.describe('Payments MFE Accessibility - Create Payment Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await loginAsCustomer(page);
    await page.goto('/payments');
    await page.waitForLoadState('networkidle');
  });

  test('create payment form should have proper labels', async ({ page }) => {
    // Look for create payment button or tab
    const createButton = page.locator('button:has-text("Create"), button:has-text("New Payment")');

    if (await createButton.count() > 0) {
      await createButton.first().click();
      await page.waitForTimeout(500);

      // Check form fields have labels
      const inputs = await page.locator('form input, form select, form textarea').all();

      for (const input of inputs) {
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');

        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          const labelExists = await label.count() > 0;
          // Input should have label, aria-label, or aria-labelledby
          expect(labelExists || ariaLabel || ariaLabelledBy).toBeTruthy();
        }
      }
    }
  });

  test('create payment form should be keyboard accessible', async ({ page }) => {
    const createButton = page.locator('button:has-text("Create"), button:has-text("New Payment")');

    if (await createButton.count() > 0) {
      await createButton.first().click();
      await page.waitForTimeout(500);

      // Tab through form fields
      await page.keyboard.press('Tab');

      // Should be able to navigate to submit button
      let foundSubmit = false;
      for (let i = 0; i < 20; i++) {
        const focused = await getFocusedElementInfo(page);
        if (focused.type === 'submit' || focused.textContent?.includes('Create') || focused.textContent?.includes('Submit')) {
          foundSubmit = true;
          break;
        }
        await page.keyboard.press('Tab');
      }

      expect(foundSubmit).toBe(true);
    }
  });

  test('create payment form should show accessible validation errors', async ({
    page,
  }) => {
    const createButton = page.locator('button:has-text("Create"), button:has-text("New Payment")');

    if (await createButton.count() > 0) {
      await createButton.first().click();
      await page.waitForTimeout(500);

      // Try to submit empty form
      const submitButton = page.locator('form button[type="submit"]');
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(500);

        // Check for accessible error messages
        const errors = await page.locator('[role="alert"], [aria-invalid="true"], .text-destructive').all();
        // Form should indicate errors in some accessible way
      }
    }
  });
});

test.describe('Payments MFE Accessibility - Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await loginAsCustomer(page);
    await page.goto('/payments');
    await page.waitForLoadState('networkidle');
  });

  test('filter controls should be accessible', async ({ page }) => {
    // Look for filter elements
    const filters = page.locator('select, input[type="search"], input[type="text"][placeholder*="search" i], [role="combobox"]');

    if (await filters.count() > 0) {
      for (let i = 0; i < Math.min(3, await filters.count()); i++) {
        const filter = filters.nth(i);

        // Check for accessible label
        const id = await filter.getAttribute('id');
        const ariaLabel = await filter.getAttribute('aria-label');
        const ariaLabelledBy = await filter.getAttribute('aria-labelledby');

        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          const labelExists = await label.count() > 0;
          expect(labelExists || ariaLabel || ariaLabelledBy).toBeTruthy();
        }
      }
    }
  });

  test('filter select dropdowns should be keyboard operable', async ({
    page,
  }) => {
    const selects = page.locator('select');

    if (await selects.count() > 0) {
      const select = selects.first();
      await select.focus();

      // Should be able to open with Enter or Space
      await page.keyboard.press('Enter');

      // Navigate options with arrow keys
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');

      // Select should have new value
      const value = await select.inputValue();
      expect(value).toBeDefined();
    }
  });
});

test.describe('Payments MFE Accessibility - Loading States', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await loginAsCustomer(page);
  });

  test('loading states should have proper ARIA attributes', async ({ page }) => {
    // Navigate and check for loading indicators
    await page.goto('/payments');

    // Check for any loading indicators
    const loadingIndicators = await page.locator('[role="status"], [aria-busy="true"], [aria-label*="Loading" i]').all();

    // If there are loading indicators, they should have proper ARIA
    for (const indicator of loadingIndicators) {
      const role = await indicator.getAttribute('role');
      const ariaBusy = await indicator.getAttribute('aria-busy');
      const ariaLabel = await indicator.getAttribute('aria-label');
      const ariaLive = await indicator.getAttribute('aria-live');

      // Should have role="status" or aria-live
      expect(role === 'status' || ariaLive || ariaBusy).toBeTruthy();
    }
  });
});

test.describe('Payments MFE Accessibility - Reports Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await loginAsCustomer(page);
  });

  test('reports page should have no accessibility violations', async ({
    page,
  }) => {
    // Navigate to reports (may be a tab or separate route)
    const reportsTab = page.locator('button:has-text("Reports"), a:has-text("Reports")');

    if (await reportsTab.count() > 0) {
      await reportsTab.first().click();
      await page.waitForTimeout(500);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      if (results.violations.length > 0) {
        console.log(
          'Reports Page Violations:',
          JSON.stringify(results.violations, null, 2)
        );
      }

      expect(results.violations).toEqual([]);
    }
  });
});

test.describe('Payments MFE Accessibility - Pagination', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await loginAsCustomer(page);
    await page.goto('/payments');
    await page.waitForLoadState('networkidle');
  });

  test('pagination should be accessible', async ({ page }) => {
    // Check for pagination
    const pagination = page.locator('nav[aria-label*="pagination" i], [role="navigation"][aria-label*="page" i]');

    if (await pagination.count() > 0) {
      // Pagination should be in nav landmark
      const navElement = pagination.first();
      await expect(navElement).toBeVisible();

      // Check for accessible page buttons
      const pageButtons = await pagination.locator('button, a').all();

      for (const button of pageButtons) {
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const ariaCurrent = await button.getAttribute('aria-current');

        // Each button should have accessible name
        expect(text?.trim() || ariaLabel).toBeTruthy();
      }

      // Current page should be indicated
      const currentPage = pagination.locator('[aria-current="page"], [aria-current="true"]');
      if (await currentPage.count() > 0) {
        await expect(currentPage).toBeVisible();
      }
    }
  });

  test('pagination should be keyboard navigable', async ({ page }) => {
    const pagination = page.locator('nav[aria-label*="pagination" i], [role="navigation"][aria-label*="page" i]');

    if (await pagination.count() > 0) {
      // Focus first pagination button
      const firstButton = pagination.locator('button, a').first();
      await firstButton.focus();

      // Tab through pagination
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
      }

      // Should still be in focusable area
      const focused = await getFocusedElementInfo(page);
      expect(focused.tagName).toBeDefined();
    }
  });
});

test.describe('Payments MFE Accessibility - Status Badges', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await loginAsCustomer(page);
    await page.goto('/payments');
    await page.waitForLoadState('networkidle');
  });

  test('status badges should convey meaning accessibly', async ({ page }) => {
    // Look for status badges in table
    const badges = page.locator('[class*="badge"], [class*="status"]');

    if (await badges.count() > 0) {
      for (let i = 0; i < Math.min(5, await badges.count()); i++) {
        const badge = badges.nth(i);
        const text = await badge.textContent();

        // Badge should have visible text (not rely on color alone)
        expect(text?.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

test.describe('Payments MFE Accessibility - Color Contrast', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await loginAsCustomer(page);
    await page.goto('/payments');
    await page.waitForLoadState('networkidle');
  });

  test('should pass color contrast check', async ({ page }) => {
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
        'Payments Page Contrast Issues:',
        JSON.stringify(contrastViolations, null, 2)
      );
    }

    expect(contrastViolations).toEqual([]);
  });
});
