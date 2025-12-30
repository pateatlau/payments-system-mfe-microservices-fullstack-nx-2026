import { test, expect } from '@playwright/test';

test.describe('Logout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in before each test
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
  });

  test('should logout and redirect to sign-in page', async ({ page }) => {
    // Find logout button
    const logoutButton = page
      .locator('button')
      .filter({ hasText: /logout|sign out/i });
    await expect(logoutButton).toBeVisible({ timeout: 10000 });

    // Click logout and wait for navigation away from payments
    await Promise.all([
      page.waitForURL((url) => !url.pathname.includes('payments'), {
        timeout: 15000,
      }),
      logoutButton.click(),
    ]);

    // Should redirect to sign-in page
    await expect(page).toHaveURL(/.*signin/, { timeout: 15000 });

    // Verify sign-in form is visible
    await expect(page.locator('input[type="email"]')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should clear authentication state after logout', async ({ page }) => {
    // Logout
    const logoutButton = page
      .locator('button')
      .filter({ hasText: /logout|sign out/i });

    // Click logout and wait for navigation
    await Promise.all([
      page.waitForURL((url) => !url.pathname.includes('payments'), {
        timeout: 15000,
      }),
      logoutButton.click(),
    ]);

    await expect(page).toHaveURL(/.*signin/, { timeout: 15000 });

    // Wait for signin form to confirm we're fully on the signin page
    await expect(page.locator('input[type="email"]')).toBeVisible({
      timeout: 5000,
    });

    // Try to access protected route - use waitForURL to handle the redirect
    await Promise.all([
      page.waitForURL((url) => url.pathname.includes('signin'), {
        timeout: 15000,
      }),
      page.goto('/payments'),
    ]);

    // Should have redirected back to sign-in (protected route redirects unauthenticated users)
    await expect(page).toHaveURL(/.*signin/, { timeout: 15000 });
  });
});
