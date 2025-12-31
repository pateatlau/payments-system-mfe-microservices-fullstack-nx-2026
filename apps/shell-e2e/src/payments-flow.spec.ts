import { test, expect } from '@playwright/test';

test.describe('Payments Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in as a user before each test
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'customer@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');

    // Submit form and wait for navigation
    await Promise.all([
      page.waitForURL((url) => !url.pathname.includes('signin'), { timeout: 15000 }),
      page.click('button[type="submit"]'),
    ]);

    // Wait for redirect to payments page
    await expect(page).toHaveURL(/.*payments/, { timeout: 15000 });

    // Wait for the payments page to finish loading
    // The h1 "Payments" heading with subtitle indicates the page loaded successfully
    // (loading state shows "Loading payments...", error shows "Error Loading Payments")
    await expect(
      page.locator('h1:has-text("Payments")').first()
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.locator('text=/manage your payments|view your payment history/i').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('should display payments page for authenticated user', async ({
    page,
  }) => {
    // Verify payments page is loaded (use .first() as there may be multiple headings)
    await expect(page.locator('h1, h2').first()).toContainText(/payment/i, {
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
    // First logout the customer from beforeEach
    const logoutButton = page
      .locator('button')
      .filter({ hasText: /logout|sign out/i });
    await expect(logoutButton).toBeVisible({ timeout: 10000 });

    await Promise.all([
      page.waitForURL((url) => !url.pathname.includes('payments'), {
        timeout: 15000,
      }),
      logoutButton.click(),
    ]);

    // Wait for signin page to fully load after logout
    await expect(page).toHaveURL(/.*signin/, { timeout: 15000 });
    await expect(page.locator('input[type="email"]')).toBeVisible({
      timeout: 10000,
    });

    // Now sign in as vendor
    await page.fill('input[type="email"]', 'vendor@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');

    // Submit form and wait for navigation
    await Promise.all([
      page.waitForURL((url) => !url.pathname.includes('signin'), {
        timeout: 15000,
      }),
      page.click('button[type="submit"]'),
    ]);

    // Wait for redirect to payments page
    await expect(page).toHaveURL(/.*payments/, { timeout: 15000 });

    // Wait for the payments page to finish loading
    // The h1 "Payments" heading with subtitle indicates the page loaded successfully
    await expect(
      page.locator('h1:has-text("Payments")').first()
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.locator('text=/manage your payments|view your payment history/i').first()
    ).toBeVisible({ timeout: 15000 });

    // Wait for create payment button (use .first() as there may be multiple)
    const createButton = page
      .locator('button')
      .filter({ hasText: /create.*payment/i })
      .first();
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

  test('should show create payment button for CUSTOMER', async ({ page }) => {
    // Already signed in as customer from beforeEach
    // Verify create payment button IS visible (CUSTOMERs can create payments)
    // Use .first() as there may be multiple buttons matching
    const createButton = page
      .locator('button')
      .filter({ hasText: /create.*payment/i })
      .first();
    await expect(createButton).toBeVisible({ timeout: 10000 });
  });
});
