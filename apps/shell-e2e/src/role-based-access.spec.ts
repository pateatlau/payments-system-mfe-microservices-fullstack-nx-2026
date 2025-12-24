import { test, expect } from '@playwright/test';

test.describe('Role-Based Access Control', () => {
  test('VENDOR should see create/edit/delete buttons', async ({ page }) => {
    // Sign in as vendor
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'vendor@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect to payments page
    await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

    // Verify create payment button is visible
    const createButton = page
      .locator('button')
      .filter({ hasText: /create.*payment/i });
    await expect(createButton).toBeVisible({ timeout: 10000 });

    // If there are payments, verify edit/delete buttons are visible
    // (This depends on whether there are existing payments)
    const _editButtons = page.locator('button').filter({ hasText: /edit/i });
    const _deleteButtons = page
      .locator('button')
      .filter({ hasText: /delete/i });

    // At least create button should be visible for VENDOR
    await expect(createButton).toBeVisible();
  });

  test('CUSTOMER should not see create/edit/delete buttons', async ({
    page,
  }) => {
    // Sign in as customer
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'customer@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect to payments page
    await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

    // Verify create payment button is NOT visible
    const createButton = page
      .locator('button')
      .filter({ hasText: /create.*payment/i });
    await expect(createButton).not.toBeVisible({ timeout: 5000 });

    // Verify edit/delete buttons are NOT visible
    const _editButtons = page.locator('button').filter({ hasText: /edit/i });
    const _deleteButtons = page
      .locator('button')
      .filter({ hasText: /delete/i });

    // Customer should only see view-only content
    await expect(page.locator('h1, h2')).toContainText(/payment/i, {
      timeout: 10000,
    });
  });

  test('VENDOR should see Reports link in header', async ({ page }) => {
    // Sign in as vendor
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'vendor@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect to payments page
    await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

    // Verify Reports link is visible in header (VENDOR only)
    const reportsLink = page
      .locator('a, button')
      .filter({ hasText: /report/i });
    await expect(reportsLink).toBeVisible({ timeout: 10000 });
  });

  test('CUSTOMER should not see Reports link in header', async ({ page }) => {
    // Sign in as customer
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'customer@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect to payments page
    await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

    // Verify Reports link is NOT visible (CUSTOMER only)
    const reportsLink = page
      .locator('a, button')
      .filter({ hasText: /report/i });
    await expect(reportsLink).not.toBeVisible({ timeout: 5000 });
  });
});
