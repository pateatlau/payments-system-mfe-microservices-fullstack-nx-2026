import { test, expect } from '@playwright/test';

test.describe('Logout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'customer@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to payments page
    await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });
  });

  test('should logout and redirect to sign-in page', async ({ page }) => {
    // Find and click logout button
    const logoutButton = page.locator('button').filter({ hasText: /logout|sign out/i });
    await expect(logoutButton).toBeVisible({ timeout: 10000 });
    
    await logoutButton.click();

    // Should redirect to sign-in page
    await expect(page).toHaveURL(/.*signin/, { timeout: 10000 });

    // Verify sign-in form is visible
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
  });

  test('should clear authentication state after logout', async ({ page }) => {
    // Logout
    const logoutButton = page.locator('button').filter({ hasText: /logout|sign out/i });
    await logoutButton.click();
    
    await expect(page).toHaveURL(/.*signin/, { timeout: 10000 });

    // Try to access protected route
    await page.goto('/payments');

    // Should redirect back to sign-in
    await expect(page).toHaveURL(/.*signin/, { timeout: 10000 });
  });
});

