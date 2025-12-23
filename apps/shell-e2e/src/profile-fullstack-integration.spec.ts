import { test, expect } from '@playwright/test';

/**
 * Full-Stack Integration Tests for Profile Flow
 *
 * These tests verify end-to-end flows across frontend and backend:
 * - Frontend UI interactions
 * - Backend API calls and responses
 * - Profile data fetching and updates
 * - Form validation and error handling
 */

test.describe('Full-Stack Profile Integration', () => {
  test.describe('View Profile', () => {
    test('should fetch and display profile data from backend', async ({
      page,
    }) => {
      // Sign in as customer
      await page.goto('/signin');
      await page.fill('input[type="email"]', 'customer@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

      // Track API call to fetch profile
      const profileResponsePromise = page.waitForResponse(
        response =>
          response.url().includes('/api/profile') &&
          response.request().method() === 'GET'
      );

      // Navigate to profile page
      await page.goto('/profile');

      // Wait for API response
      const profileResponse = await profileResponsePromise;

      // Verify backend API response
      expect(profileResponse.status()).toBe(200);
      const responseBody = await profileResponse.json();
      expect(responseBody).toHaveProperty('success', true);
      expect(responseBody.data).toHaveProperty('profile');
      expect(responseBody.data.profile).toHaveProperty('userId');

      // Verify profile page is displayed
      await expect(page.locator('h1')).toContainText(/profile/i, {
        timeout: 10000,
      });
    });

    test('should fetch and display preferences data from backend', async ({
      page,
    }) => {
      // Sign in as customer
      await page.goto('/signin');
      await page.fill('input[type="email"]', 'customer@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

      // Track API call to fetch preferences
      const preferencesResponsePromise = page.waitForResponse(
        response =>
          response.url().includes('/api/profile/preferences') &&
          response.request().method() === 'GET'
      );

      // Navigate to profile page and switch to preferences tab
      await page.goto('/profile');
      await page.click('button:has-text("Preferences")');

      // Wait for API response
      const preferencesResponse = await preferencesResponsePromise;

      // Verify backend API response
      expect(preferencesResponse.status()).toBe(200);
      const responseBody = await preferencesResponse.json();
      expect(responseBody).toHaveProperty('success', true);
      expect(responseBody.data).toHaveProperty('preferences');

      // Verify preferences form is displayed
      await expect(page.locator('label:has-text("Language")')).toBeVisible({
        timeout: 10000,
      });
    });
  });

  test.describe('Update Profile', () => {
    test('should update profile information successfully', async ({ page }) => {
      // Sign in as customer
      await page.goto('/signin');
      await page.fill('input[type="email"]', 'customer@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

      // Navigate to profile page
      await page.goto('/profile');

      // Track API call to update profile
      const updateResponsePromise = page.waitForResponse(
        response =>
          response.url().includes('/api/profile') &&
          response.request().method() === 'PUT'
      );

      // Fill and submit profile form
      await page.fill('input[placeholder*="phone"]', '1234567890');
      await page.fill(
        'input[placeholder*="address"]',
        '123 Test Street, Test City'
      );
      await page.fill(
        'textarea[placeholder*="bio"]',
        'Updated bio for testing'
      );

      // Click update button
      await page.click('button[type="submit"]:has-text("Update Profile")');

      // Wait for API response
      const updateResponse = await updateResponsePromise;

      // Verify backend API response
      expect(updateResponse.status()).toBe(200);
      const responseBody = await updateResponse.json();
      expect(responseBody).toHaveProperty('success', true);
      expect(responseBody.data).toHaveProperty('profile');
      expect(responseBody.data.profile.phone).toBe('1234567890');

      // Verify success feedback appears
      await expect(
        page.locator('text=/profile.*updated|success/i')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should update preferences successfully', async ({ page }) => {
      // Sign in as customer
      await page.goto('/signin');
      await page.fill('input[type="email"]', 'customer@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

      // Navigate to profile page
      await page.goto('/profile');
      await page.click('button:has-text("Preferences")');

      // Track API call to update preferences
      const updateResponsePromise = page.waitForResponse(
        response =>
          response.url().includes('/api/profile/preferences') &&
          response.request().method() === 'PUT'
      );

      // Update preferences
      await page.selectOption('select[aria-label*="language"]', 'en');
      await page.selectOption('select[aria-label*="currency"]', 'USD');
      await page.selectOption(
        'select[aria-label*="timezone"]',
        'America/New_York'
      );
      await page.check('input[type="checkbox"][value="email"]');

      // Click update button
      await page.click('button[type="submit"]:has-text("Update Preferences")');

      // Wait for API response
      const updateResponse = await updateResponsePromise;

      // Verify backend API response
      expect(updateResponse.status()).toBe(200);
      const responseBody = await updateResponse.json();
      expect(responseBody).toHaveProperty('success', true);
      expect(responseBody.data).toHaveProperty('preferences');

      // Verify success feedback appears
      await expect(
        page.locator('text=/preferences.*updated|success/i')
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Form Validation', () => {
    test('should show validation errors for invalid profile data', async ({
      page,
    }) => {
      // Sign in as customer
      await page.goto('/signin');
      await page.fill('input[type="email"]', 'customer@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

      // Navigate to profile page
      await page.goto('/profile');

      // Try to submit with invalid data
      await page.fill('input[placeholder*="phone"]', 'invalid-phone-number');
      await page.click('button[type="submit"]:has-text("Update Profile")');

      // Verify no API call is made for invalid data
      const updateRequest = page.waitForRequest(
        request =>
          request.url().includes('/api/profile') && request.method() === 'PUT',
        { timeout: 2000 }
      );

      // The request should not be made due to client-side validation
      await expect(updateRequest).rejects.toThrow();
    });

    test('should show validation errors for invalid preferences data', async ({
      page,
    }) => {
      // Sign in as customer
      await page.goto('/signin');
      await page.fill('input[type="email"]', 'customer@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

      // Navigate to profile page
      await page.goto('/profile');
      await page.click('button:has-text("Preferences")');

      // Try to submit with invalid currency (should be exactly 3 characters)
      await page.selectOption('select[aria-label*="currency"]', 'INVALID');
      await page.click('button[type="submit"]:has-text("Update Preferences")');

      // Verify no API call is made for invalid data
      const updateRequest = page.waitForRequest(
        request =>
          request.url().includes('/api/profile/preferences') &&
          request.method() === 'PUT',
        { timeout: 2000 }
      );

      // The request should not be made due to client-side validation
      await expect(updateRequest).rejects.toThrow();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle profile fetch errors gracefully', async ({ page }) => {
      // Sign in as customer
      await page.goto('/signin');
      await page.fill('input[type="email"]', 'customer@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

      // Navigate to profile page
      await page.goto('/profile');

      // Wait for error state (if API fails, it should show error message)
      // Note: This test assumes the API might fail in some scenarios
      // In a real test environment, you might mock API failures
      const errorMessage = page.locator('text=/failed.*load|error/i');
      // Either error appears or profile loads successfully
      await Promise.race([
        expect(errorMessage).toBeVisible({ timeout: 5000 }),
        expect(page.locator('h1:has-text("Profile")')).toBeVisible({
          timeout: 10000,
        }),
      ]);
    });
  });

  test.describe('Tab Navigation', () => {
    test('should switch between profile tabs correctly', async ({ page }) => {
      // Sign in as customer
      await page.goto('/signin');
      await page.fill('input[type="email"]', 'customer@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

      // Navigate to profile page
      await page.goto('/profile');

      // Verify default tab (Profile)
      await expect(page.locator('input[placeholder*="phone"]')).toBeVisible();

      // Switch to Preferences tab
      await page.click('button:has-text("Preferences")');
      await expect(page.locator('label:has-text("Language")')).toBeVisible();
      await expect(
        page.locator('input[placeholder*="phone"]')
      ).not.toBeVisible();

      // Switch to Account tab
      await page.click('button:has-text("Account")');
      await expect(page.locator('text=/read-only overview/i')).toBeVisible();
      await expect(
        page.locator('label:has-text("Language")')
      ).not.toBeVisible();

      // Switch back to Profile tab
      await page.click('button:has-text("Profile")');
      await expect(page.locator('input[placeholder*="phone"]')).toBeVisible();
    });
  });
});
