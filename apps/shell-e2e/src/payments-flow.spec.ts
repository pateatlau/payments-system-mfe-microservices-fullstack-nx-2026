import { test, expect } from '@playwright/test';

test.describe('Payments Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in as a user before each test
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'customer@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Wait for redirect to payments page
    await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });
  });

  test('should display payments page for authenticated user', async ({
    page,
  }) => {
    // Verify payments page is loaded
    await expect(page.locator('h1, h2')).toContainText(/payment/i, {
      timeout: 10000,
    });
  });

  test('should display payments list', async ({ page }) => {
    // Wait for payments content to load
    // The page might show "No payments found" or a list of payments
    const paymentsContent = page.locator('text=/payment|no.*payment/i');
    await expect(paymentsContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('should create payment as VENDOR', async ({ page }) => {
    // Sign in as vendor
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'vendor@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Wait for redirect to payments page
    await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

    // Wait for create payment button (VENDOR only)
    const createButton = page
      .locator('button')
      .filter({ hasText: /create.*payment/i });
    await expect(createButton).toBeVisible({ timeout: 10000 });

    // Click create payment button
    await createButton.click();

    // Wait for create payment form
    await expect(page.locator('input[type="number"]')).toBeVisible({
      timeout: 5000,
    });

    // Fill in payment form
    await page.fill('input[type="number"]', '100');

    // Submit form
    const submitButton = page
      .locator('button[type="submit"]')
      .filter({ hasText: /create/i });
    await submitButton.click();

    // Wait for form to close or payment to appear
    // The payment should appear in the list or form should close
    await expect(page.locator('text=/100|payment.*created/i')).toBeVisible({
      timeout: 10000,
    });
  });

  test('should not show create payment button for CUSTOMER', async ({
    page,
  }) => {
    // Already signed in as customer from beforeEach
    // Verify create payment button is not visible
    const createButton = page
      .locator('button')
      .filter({ hasText: /create.*payment/i });
    await expect(createButton).not.toBeVisible({ timeout: 5000 });
  });
});
