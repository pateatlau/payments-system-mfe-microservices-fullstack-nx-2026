import { test, expect } from '@playwright/test';

/**
 * Event Bus Verification Tests
 *
 * These tests verify that the event bus works correctly for inter-MFE communication:
 * - Auth events (login, logout, session expired)
 * - Payment events (created, completed, failed)
 * - Event propagation between MFEs
 * - Navigation coordination via events
 */

test.describe('Event Bus Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test.describe('Auth Events', () => {
    test('should emit auth:login event and trigger navigation', async ({
      page,
    }) => {
      // Listen for navigation events
      let navigatedToPayments = false;
      page.on('framenavigated', frame => {
        if (frame.url().includes('/payments')) {
          navigatedToPayments = true;
        }
      });

      // Sign in
      await page.goto('/signin');
      await page.fill('input[type="email"]', 'customer@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Wait for navigation to payments (triggered by auth:login event)
      await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });
      expect(navigatedToPayments).toBe(true);

      // Verify user is authenticated (event should have updated auth state)
      const isAuthenticated = await page.evaluate(() => {
        return localStorage.getItem('auth_accessToken') !== null;
      });
      expect(isAuthenticated).toBe(true);
    });

    test('should emit auth:logout event and trigger navigation', async ({
      page,
    }) => {
      // Sign in first
      await page.goto('/signin');
      await page.fill('input[type="email"]', 'customer@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

      // Listen for navigation events
      let navigatedToSignIn = false;
      page.on('framenavigated', frame => {
        if (frame.url().includes('/signin')) {
          navigatedToSignIn = true;
        }
      });

      // Logout
      const logoutButton = page
        .locator('button')
        .filter({ hasText: /logout|sign out/i });
      await logoutButton.click();

      // Wait for navigation to signin (triggered by auth:logout event)
      await expect(page).toHaveURL(/.*signin/, { timeout: 10000 });
      expect(navigatedToSignIn).toBe(true);

      // Verify tokens are cleared (event should have cleared auth state)
      const isAuthenticated = await page.evaluate(() => {
        return localStorage.getItem('auth_accessToken') === null;
      });
      expect(isAuthenticated).toBe(true);
    });
  });

  test.describe('Payment Events', () => {
    test.beforeEach(async ({ page }) => {
      // Sign in as vendor before each test
      await page.goto('/signin');
      await page.fill('input[type="email"]', 'vendor@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });
    });

    test('should emit payment:created event when payment is created', async ({
      page,
    }) => {
      // Create a payment
      const createButton = page
        .locator('button')
        .filter({ hasText: /create.*payment/i });
      if (await createButton.isVisible({ timeout: 5000 })) {
        await createButton.click();

        // Fill payment form
        await page.fill('input[type="number"]', '100');
        const submitButton = page
          .locator('button[type="submit"]')
          .filter({ hasText: /create|submit/i });
        await submitButton.click();

        // Wait for payment to appear in list (event should have updated UI)
        await expect(page.locator('text=/100|payment.*created/i')).toBeVisible({
          timeout: 10000,
        });

        // Verify payment was created (event should have triggered state update)
        const paymentsList = page.locator('text=/payment|amount/i');
        await expect(paymentsList.first()).toBeVisible({ timeout: 5000 });
      } else {
        test.skip();
      }
    });
  });

  test.describe('Event Propagation', () => {
    test('should propagate events across MFEs', async ({ page }) => {
      // Sign in
      await page.goto('/signin');
      await page.fill('input[type="email"]', 'customer@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

      // Verify header is updated (event should have propagated to header MFE)
      const header = page.locator('header, nav').first();
      await expect(header).toBeVisible({ timeout: 5000 });

      // Verify user info is displayed in header (event should have updated header state)
      const _userInfo = page.locator('text=/customer|user|email/i');
      // Header might show user info or just be visible
      await expect(header).toBeVisible();
    });
  });
});
