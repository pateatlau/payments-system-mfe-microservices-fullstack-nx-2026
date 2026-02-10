/**
 * Admin MFE Accessibility Tests - WCAG 2.1 AA Compliance
 *
 * Comprehensive E2E accessibility tests for the Admin MFE covering:
 * - Admin Dashboard
 * - User Management (table with CRUD)
 * - Audit Logs
 * - System Health
 * - Modal dialogs (UserFormDialog, DeleteConfirmDialog)
 *
 * Tests verify:
 * - axe-core WCAG 2.1 AA compliance
 * - Keyboard navigation
 * - Focus management (including modal focus trap)
 * - Table accessibility
 * - Form accessibility
 * - Dialog accessibility (role="dialog", role="alertdialog")
 *
 * @module shell-e2e/a11y/admin-mfe
 */

import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Helper to login as admin
 */
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

test.describe('Admin MFE Accessibility - Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await loginAsAdmin(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
  });

  test('should have no axe accessibility violations', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    if (results.violations.length > 0) {
      console.log(
        'Admin Dashboard Violations:',
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
    expect(h1Text?.toLowerCase()).toContain('admin');

    // Check for navigation
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should have accessible tab navigation', async ({ page }) => {
    // Look for dashboard tabs
    const tablist = page.locator('[role="tablist"]');

    if (await tablist.count() > 0) {
      // Tablist should have proper ARIA
      await expect(tablist).toBeVisible();

      // Each tab should have role="tab"
      const tabs = await tablist.locator('[role="tab"]').all();
      expect(tabs.length).toBeGreaterThan(0);

      // Active tab should have aria-selected="true"
      const selectedTab = tablist.locator('[aria-selected="true"]');
      await expect(selectedTab).toBeVisible();

      // Tab panels should exist
      const tabpanels = page.locator('[role="tabpanel"]');
      if (await tabpanels.count() > 0) {
        await expect(tabpanels.first()).toBeVisible();
      }
    }
  });

  test('should support keyboard tab navigation', async ({ page }) => {
    const tablist = page.locator('[role="tablist"]');

    if (await tablist.count() > 0) {
      // Focus first tab
      const firstTab = tablist.locator('[role="tab"]').first();
      await firstTab.focus();

      // Navigate with arrow keys
      await page.keyboard.press('ArrowRight');

      // Check that another tab is focused
      const focused = await getFocusedElementInfo(page);
      expect(focused.role).toBe('tab');
    }
  });
});

test.describe('Admin MFE Accessibility - User Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await loginAsAdmin(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
  });

  test('user management table should be accessible', async ({ page }) => {
    // Navigate to User Management tab if needed
    const usersTab = page.locator('button:has-text("Users"), [role="tab"]:has-text("Users")');
    if (await usersTab.count() > 0) {
      await usersTab.click();
      await page.waitForTimeout(500);
    }

    // Check for users table
    const table = page.locator('table');

    if (await table.count() > 0) {
      // Table should have accessible name
      const ariaLabel = await table.getAttribute('aria-label');
      const ariaDescribedBy = await table.getAttribute('aria-describedby');
      const caption = await page.locator('table caption').count();
      expect(ariaLabel || ariaDescribedBy || caption > 0).toBeTruthy();

      // Headers should have scope="col"
      const headers = await page.locator('th[scope="col"]').all();
      expect(headers.length).toBeGreaterThan(0);

      // Action buttons should have accessible names
      const actionButtons = await page.locator('table button').all();
      for (const button of actionButtons) {
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        expect(text?.trim() || ariaLabel).toBeTruthy();
      }
    }
  });

  test('edit user form should be accessible', async ({ page }) => {
    // Navigate to Users tab
    const usersTab = page.locator('button:has-text("Users"), [role="tab"]:has-text("Users")');
    if (await usersTab.count() > 0) {
      await usersTab.click();
      await page.waitForTimeout(500);
    }

    // Click Edit button
    const editButton = page.locator('button[aria-label*="Edit"], button:has-text("Edit")').first();

    if (await editButton.count() > 0) {
      await editButton.click();

      // Wait for dialog
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Dialog should have proper ARIA
      const ariaModal = await dialog.getAttribute('aria-modal');
      expect(ariaModal).toBe('true');

      const ariaLabelledBy = await dialog.getAttribute('aria-labelledby');
      const ariaLabel = await dialog.getAttribute('aria-label');
      expect(ariaLabelledBy || ariaLabel).toBeTruthy();

      // Check form fields have labels
      const inputs = await dialog.locator('input, select, textarea').all();
      for (const input of inputs) {
        const id = await input.getAttribute('id');
        const inputAriaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');

        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          const labelExists = await label.count() > 0;
          expect(labelExists || inputAriaLabel || ariaLabelledBy).toBeTruthy();
        }
      }
    }
  });

  test('delete confirmation dialog should be accessible', async ({ page }) => {
    // Navigate to Users tab
    const usersTab = page.locator('button:has-text("Users"), [role="tab"]:has-text("Users")');
    if (await usersTab.count() > 0) {
      await usersTab.click();
      await page.waitForTimeout(500);
    }

    // Click Delete button
    const deleteButton = page.locator('button[aria-label*="Delete"], button:has-text("Delete")').first();

    if (await deleteButton.count() > 0) {
      await deleteButton.click();

      // Wait for alert dialog
      const alertDialog = page.locator('[role="alertdialog"], [role="dialog"]');
      await expect(alertDialog).toBeVisible({ timeout: 5000 });

      // Should be role="alertdialog" for confirmations
      const role = await alertDialog.getAttribute('role');
      // Accept either dialog or alertdialog
      expect(['dialog', 'alertdialog']).toContain(role);

      // Should have aria-modal
      const ariaModal = await alertDialog.getAttribute('aria-modal');
      expect(ariaModal).toBe('true');

      // Should have accessible name
      const ariaLabelledBy = await alertDialog.getAttribute('aria-labelledby');
      const ariaLabel = await alertDialog.getAttribute('aria-label');
      expect(ariaLabelledBy || ariaLabel).toBeTruthy();

      // Cancel and confirm buttons should be present
      const cancelButton = alertDialog.locator('button:has-text("Cancel")');
      const confirmButton = alertDialog.locator('button:has-text("Delete"), button:has-text("Confirm")');

      await expect(cancelButton).toBeVisible();
      await expect(confirmButton).toBeVisible();
    }
  });

  test('dialogs should trap focus', async ({ page }) => {
    // Navigate to Users tab
    const usersTab = page.locator('button:has-text("Users"), [role="tab"]:has-text("Users")');
    if (await usersTab.count() > 0) {
      await usersTab.click();
      await page.waitForTimeout(500);
    }

    const editButton = page.locator('button[aria-label*="Edit"], button:has-text("Edit")').first();

    if (await editButton.count() > 0) {
      await editButton.click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Tab multiple times and check focus stays in dialog
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');

        const isInDialog = await page.evaluate(() => {
          const dialog = document.querySelector('[role="dialog"]');
          const activeEl = document.activeElement;
          return dialog?.contains(activeEl) ?? false;
        });

        expect(isInDialog).toBe(true);
      }
    }
  });

  test('dialogs should close with Escape', async ({ page }) => {
    // Navigate to Users tab
    const usersTab = page.locator('button:has-text("Users"), [role="tab"]:has-text("Users")');
    if (await usersTab.count() > 0) {
      await usersTab.click();
      await page.waitForTimeout(500);
    }

    const editButton = page.locator('button[aria-label*="Edit"], button:has-text("Edit")').first();

    if (await editButton.count() > 0) {
      await editButton.click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Press Escape
      await page.keyboard.press('Escape');

      // Dialog should close
      await expect(dialog).not.toBeVisible({ timeout: 2000 });
    }
  });
});

test.describe('Admin MFE Accessibility - Audit Logs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await loginAsAdmin(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
  });

  test('audit logs table should be accessible', async ({ page }) => {
    // Navigate to Audit Logs tab
    const auditTab = page.locator('button:has-text("Audit"), [role="tab"]:has-text("Audit")');
    if (await auditTab.count() > 0) {
      await auditTab.click();
      await page.waitForTimeout(500);
    }

    // Run accessibility check
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    if (results.violations.length > 0) {
      console.log(
        'Audit Logs Violations:',
        JSON.stringify(results.violations, null, 2)
      );
    }

    expect(results.violations).toEqual([]);
  });

  test('audit logs pagination should be accessible', async ({ page }) => {
    // Navigate to Audit Logs tab
    const auditTab = page.locator('button:has-text("Audit"), [role="tab"]:has-text("Audit")');
    if (await auditTab.count() > 0) {
      await auditTab.click();
      await page.waitForTimeout(500);
    }

    // Check pagination
    const pagination = page.locator('nav[aria-label*="pagination" i], [aria-label*="page" i]');

    if (await pagination.count() > 0) {
      await expect(pagination).toBeVisible();

      // Pagination should have live region for page count
      const liveRegion = page.locator('[aria-live="polite"]');
      if (await liveRegion.count() > 0) {
        await expect(liveRegion).toBeVisible();
      }
    }
  });

  test('audit log details modal should be accessible', async ({ page }) => {
    // Navigate to Audit Logs tab
    const auditTab = page.locator('button:has-text("Audit"), [role="tab"]:has-text("Audit")');
    if (await auditTab.count() > 0) {
      await auditTab.click();
      await page.waitForTimeout(500);
    }

    // Click on View button for audit log
    const viewButton = page.locator('button:has-text("View"), button[aria-label*="View"]').first();

    if (await viewButton.count() > 0) {
      await viewButton.click();

      // Wait for modal
      const modal = page.locator('[role="dialog"]');

      if (await modal.count() > 0) {
        await expect(modal).toBeVisible({ timeout: 5000 });

        // Check ARIA attributes
        const ariaModal = await modal.getAttribute('aria-modal');
        expect(ariaModal).toBe('true');

        // Should have close button
        const closeButton = modal.locator('button[aria-label*="Close"], button:has-text("Close")');
        await expect(closeButton).toBeVisible();
      }
    }
  });
});

test.describe('Admin MFE Accessibility - System Health', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await loginAsAdmin(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
  });

  test('system health section should be accessible', async ({ page }) => {
    // Navigate to System Health tab
    const healthTab = page.locator('button:has-text("Health"), button:has-text("System"), [role="tab"]:has-text("Health")');
    if (await healthTab.count() > 0) {
      await healthTab.click();
      await page.waitForTimeout(500);
    }

    // Run accessibility check
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    if (results.violations.length > 0) {
      console.log(
        'System Health Violations:',
        JSON.stringify(results.violations, null, 2)
      );
    }

    expect(results.violations).toEqual([]);
  });

  test('status indicators should convey meaning accessibly', async ({
    page,
  }) => {
    const healthTab = page.locator('button:has-text("Health"), button:has-text("System"), [role="tab"]:has-text("Health")');
    if (await healthTab.count() > 0) {
      await healthTab.click();
      await page.waitForTimeout(500);
    }

    // Status indicators should have text labels (not rely on color alone)
    const statusIndicators = page.locator('[class*="status"], [class*="badge"], [class*="health"]');

    if (await statusIndicators.count() > 0) {
      for (let i = 0; i < Math.min(5, await statusIndicators.count()); i++) {
        const indicator = statusIndicators.nth(i);
        const text = await indicator.textContent();
        const ariaLabel = await indicator.getAttribute('aria-label');

        // Should have visible text or aria-label
        expect(text?.trim() || ariaLabel).toBeTruthy();
      }
    }
  });
});

test.describe('Admin MFE Accessibility - Quick Actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await loginAsAdmin(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
  });

  test('quick action buttons should be accessible', async ({ page }) => {
    // Look for quick action buttons
    const actionButtons = page.locator('button:has-text("Add User"), button:has-text("Export"), button:has-text("Refresh")');

    if (await actionButtons.count() > 0) {
      for (let i = 0; i < await actionButtons.count(); i++) {
        const button = actionButtons.nth(i);

        // Button should be focusable
        await button.focus();
        await expect(button).toBeFocused();

        // Button should have accessible name
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        expect(text?.trim() || ariaLabel).toBeTruthy();
      }
    }
  });
});

test.describe('Admin MFE Accessibility - Dashboard Stats', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await loginAsAdmin(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
  });

  test('dashboard stats cards should be accessible', async ({ page }) => {
    // Stats cards should have proper headings
    const statsCards = page.locator('[class*="card"], [class*="stat"]');

    if (await statsCards.count() > 0) {
      // Each card with a value should have an accessible label
      for (let i = 0; i < Math.min(4, await statsCards.count()); i++) {
        const card = statsCards.nth(i);

        // Card should have heading or label
        const heading = card.locator('h2, h3, h4, [role="heading"]');
        const hasHeading = await heading.count() > 0;

        const ariaLabel = await card.getAttribute('aria-label');
        const ariaLabelledBy = await card.getAttribute('aria-labelledby');

        // Card should be identifiable
        expect(hasHeading || ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
  });
});

test.describe('Admin MFE Accessibility - Color Contrast', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await loginAsAdmin(page);
    await page.goto('/admin');
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
        'Admin Light Mode Contrast Issues:',
        JSON.stringify(contrastViolations, null, 2)
      );
    }

    expect(contrastViolations).toEqual([]);
  });

  test('should pass color contrast in dark mode', async ({ page }) => {
    // Toggle to dark mode
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
          'Admin Dark Mode Contrast Issues:',
          JSON.stringify(contrastViolations, null, 2)
        );
      }

      expect(contrastViolations).toEqual([]);
    }
  });
});
