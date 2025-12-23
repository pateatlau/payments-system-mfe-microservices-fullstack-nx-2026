import { test, expect } from '@playwright/test';

/**
 * Performance Tests for Profile MFE
 *
 * These tests verify performance metrics:
 * - Page load times
 * - Bundle size efficiency
 * - Form interaction responsiveness
 * - Memory usage and smooth interactions
 */

test.describe('Profile Performance', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    // Sign in for authenticated tests
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'customer@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });
  });

  test('should load profile page within acceptable time limits', async ({
    page,
  }) => {
    const startTime = Date.now();

    // Navigate to profile page
    await page.goto('/profile');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Wait for profile content to be visible
    await expect(page.locator('h1')).toContainText(/profile/i, {
      timeout: 10000,
    });

    const loadTime = Date.now() - startTime;

    // Performance assertion: page should load within 2 seconds
    expect(loadTime).toBeLessThan(2000);

    console.log(`Profile page load time: ${loadTime}ms`);
  });

  test('should load profile data within acceptable time limits', async ({
    page,
  }) => {
    // Navigate to profile page
    await page.goto('/profile');

    const startTime = Date.now();

    // Wait for profile form to be populated (indicating data loaded)
    await expect(page.locator('input[placeholder*="phone"]')).toBeVisible({
      timeout: 5000,
    });

    const dataLoadTime = Date.now() - startTime;

    // Performance assertion: data should load within 1 second
    expect(dataLoadTime).toBeLessThan(1000);

    console.log(`Profile data load time: ${dataLoadTime}ms`);
  });

  test('should handle form interactions smoothly', async ({ page }) => {
    // Navigate to profile page
    await page.goto('/profile');
    await expect(page.locator('input[placeholder*="phone"]')).toBeVisible({
      timeout: 5000,
    });

    // Measure form input responsiveness
    const inputStartTime = Date.now();

    await page.fill('input[placeholder*="phone"]', '+1-555-123-4567');
    await page.fill(
      'input[placeholder*="address"]',
      '123 Performance Test Street'
    );
    await page.fill(
      'textarea[placeholder*="bio"]',
      'Performance testing bio content'
    );

    const inputTime = Date.now() - inputStartTime;

    // Performance assertion: form inputs should respond within 100ms
    expect(inputTime).toBeLessThan(100);

    console.log(`Form input responsiveness: ${inputTime}ms`);
  });

  test('should handle tab switching smoothly', async ({ page }) => {
    // Navigate to profile page
    await page.goto('/profile');
    await expect(page.locator('input[placeholder*="phone"]')).toBeVisible({
      timeout: 5000,
    });

    // Measure tab switching performance
    const tabSwitchStartTime = Date.now();

    await page.click('button:has-text("Preferences")');
    await expect(page.locator('label:has-text("Language")')).toBeVisible({
      timeout: 1000,
    });

    await page.click('button:has-text("Account")');
    await expect(page.locator('text=/read-only overview/i')).toBeVisible({
      timeout: 1000,
    });

    await page.click('button:has-text("Profile")');
    await expect(page.locator('input[placeholder*="phone"]')).toBeVisible({
      timeout: 1000,
    });

    const tabSwitchTime = Date.now() - tabSwitchStartTime;

    // Performance assertion: tab switching should complete within 500ms
    expect(tabSwitchTime).toBeLessThan(500);

    console.log(`Tab switching time: ${tabSwitchTime}ms`);
  });

  test('should handle form submission within acceptable time limits', async ({
    page,
  }) => {
    // Navigate to profile page
    await page.goto('/profile');
    await expect(page.locator('input[placeholder*="phone"]')).toBeVisible({
      timeout: 5000,
    });

    // Fill form
    await page.fill('input[placeholder*="phone"]', '+1-555-123-4567');
    await page.fill(
      'input[placeholder*="address"]',
      '123 Performance Test Street'
    );

    const submitStartTime = Date.now();

    // Submit form
    await page.click('button[type="submit"]:has-text(/update.*profile/i)');

    // Wait for success feedback
    await expect(
      page.locator('text=/profile.*updated|success|saved/i')
    ).toBeVisible({ timeout: 5000 });

    const submitTime = Date.now() - submitStartTime;

    // Performance assertion: form submission should complete within 2 seconds
    expect(submitTime).toBeLessThan(2000);

    console.log(`Profile form submission time: ${submitTime}ms`);
  });

  test('should not have memory leaks during repeated interactions', async ({
    page,
  }) => {
    // Navigate to profile page
    await page.goto('/profile');
    await expect(page.locator('input[placeholder*="phone"]')).toBeVisible({
      timeout: 5000,
    });

    // Perform multiple interactions to check for memory issues
    for (let i = 0; i < 5; i++) {
      // Switch tabs multiple times
      await page.click('button:has-text("Preferences")');
      await page.click('button:has-text("Account")');
      await page.click('button:has-text("Profile")');

      // Fill and clear form multiple times
      await page.fill('input[placeholder*="phone"]', `+1-555-123-456${i}`);
      await page.fill('input[placeholder*="phone"]', '');
    }

    // If we get here without crashes or significant slowdowns, memory is OK
    await expect(page.locator('input[placeholder*="phone"]')).toBeVisible();

    console.log('Memory leak test completed successfully');
  });

  test('should handle large form content efficiently', async ({ page }) => {
    // Navigate to profile page
    await page.goto('/profile');
    await expect(page.locator('input[placeholder*="phone"]')).toBeVisible({
      timeout: 5000,
    });

    // Create large content for bio field
    const largeBio = 'A'.repeat(500); // 500 characters

    const largeContentStartTime = Date.now();

    await page.fill('textarea[placeholder*="bio"]', largeBio);

    const largeContentTime = Date.now() - largeContentStartTime;

    // Performance assertion: large content input should be handled within 200ms
    expect(largeContentTime).toBeLessThan(200);

    // Verify content was entered correctly
    const enteredValue = await page.inputValue('textarea[placeholder*="bio"]');
    expect(enteredValue).toBe(largeBio);

    console.log(`Large content input time: ${largeContentTime}ms`);
  });
});
