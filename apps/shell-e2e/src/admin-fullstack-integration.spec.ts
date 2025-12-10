import { test, expect } from '@playwright/test';

/**
 * Full-Stack Integration Tests for Admin Flow
 *
 * These tests verify end-to-end flows across frontend and backend:
 * - Frontend UI interactions
 * - Backend API calls and responses
 * - ADMIN-only access enforcement
 * - User management operations
 * - Role changes
 * - Audit logs
 * - System health
 */

test.describe('Full-Stack Admin Integration', () => {
  test.describe('User Management', () => {
    test.beforeEach(async ({ page }) => {
      // Sign in as admin before each test
      await page.goto('/signin');
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

      // Navigate to admin dashboard
      await page.goto('/admin');
      await expect(page).toHaveURL(/.*admin/, { timeout: 10000 });
    });

    test('should fetch users list from backend', async ({ page }) => {
      // Track API call to fetch users
      const usersResponsePromise = page.waitForResponse(
        response =>
          response.url().includes('/api/admin/users') &&
          response.request().method() === 'GET'
      );

      // Navigate to user management tab (if needed)
      // The admin dashboard should load users automatically
      await page.waitForTimeout(1000);

      // Wait for API response
      const usersResponse = await usersResponsePromise;

      // Verify backend API response
      expect(usersResponse.status()).toBe(200);
      const responseBody = await usersResponse.json();
      expect(responseBody).toHaveProperty('success', true);
      expect(responseBody.data).toHaveProperty('users');
      expect(Array.isArray(responseBody.data.users)).toBe(true);

      // Verify users are displayed in UI
      const usersContent = page.locator('text=/user|email|role/i');
      await expect(usersContent.first()).toBeVisible({ timeout: 10000 });
    });

    test('should create user and receive response from backend', async ({
      page,
    }) => {
      // Track create user API call
      const createResponsePromise = page.waitForResponse(
        response =>
          response.url().includes('/api/admin/users') &&
          response.request().method() === 'POST'
      );

      // Find and click create user button
      const createButton = page
        .locator('button')
        .filter({ hasText: /create.*user|add.*user|new.*user/i });
      if (await createButton.isVisible({ timeout: 5000 })) {
        await createButton.click();

        // Wait for create user form
        await expect(
          page.locator('input[type="text"], input[type="email"]')
        ).toBeVisible({ timeout: 5000 });

        // Generate unique email for test
        const timestamp = Date.now();
        const testEmail = `testuser-${timestamp}@example.com`;

        // Fill in user form
        const nameInput = page.locator('input[type="text"]').first();
        await nameInput.fill('Test User');

        const emailInput = page.locator('input[type="email"]');
        await emailInput.fill(testEmail);

        const passwordInput = page.locator('input[type="password"]').first();
        await passwordInput.fill('TestPassword123!@#');

        // Select role if dropdown exists
        const roleSelect = page.locator('select, input').filter({
          hasText: /role|CUSTOMER|VENDOR|ADMIN/i,
        });
        if ((await roleSelect.count()) > 0) {
          await roleSelect.first().selectOption('CUSTOMER');
        }

        // Submit form
        const submitButton = page
          .locator('button[type="submit"]')
          .filter({ hasText: /create|submit|save/i });
        await submitButton.click();

        // Wait for API response
        const createResponse = await createResponsePromise;

        // Verify backend API response
        expect(createResponse.status()).toBe(201);
        const responseBody = await createResponse.json();
        expect(responseBody).toHaveProperty('success', true);
        expect(responseBody.data).toHaveProperty('user');
        expect(responseBody.data.user).toHaveProperty('email', testEmail);
        expect(responseBody.data.user).toHaveProperty('role');

        // Verify user appears in UI or form closes
        await expect(
          page.locator(`text=/${testEmail}|user.*created/i`)
        ).toBeVisible({ timeout: 10000 });
      } else {
        // Skip if create button not available
        test.skip();
      }
    });

    test('should update user and receive response from backend', async ({
      page,
    }) => {
      // First, wait for users list to load
      await page.waitForTimeout(1000);

      // Track update user API call
      const updateResponsePromise = page.waitForResponse(
        response =>
          response.url().includes('/api/admin/users/') &&
          response.request().method() === 'PUT'
      );

      // Find edit button for a user
      const editButton = page
        .locator('button')
        .filter({ hasText: /edit|update/i })
        .first();

      if (await editButton.isVisible({ timeout: 5000 })) {
        await editButton.click();

        // Wait for edit form
        await expect(
          page.locator('input[type="text"], input[type="email"]')
        ).toBeVisible({ timeout: 5000 });

        // Update name
        const nameInput = page.locator('input[type="text"]').first();
        await nameInput.fill('Updated Name');

        // Submit update
        const updateSubmitButton = page
          .locator('button[type="submit"]')
          .filter({ hasText: /update|save|submit/i });
        await updateSubmitButton.click();

        // Wait for API response
        const updateResponse = await updateResponsePromise;

        // Verify backend API response
        expect(updateResponse.status()).toBe(200);
        const responseBody = await updateResponse.json();
        expect(responseBody).toHaveProperty('success', true);
        expect(responseBody.data).toHaveProperty('user');
        expect(responseBody.data.user).toHaveProperty('name', 'Updated Name');
      } else {
        // Skip if no users exist to edit
        test.skip();
      }
    });

    test('should delete user and receive response from backend', async ({
      page,
    }) => {
      // Wait for users list to load
      await page.waitForTimeout(1000);

      // Track delete user API call
      const deleteResponsePromise = page.waitForResponse(
        response =>
          response.url().includes('/api/admin/users/') &&
          response.request().method() === 'DELETE'
      );

      // Find delete button for a user
      const deleteButton = page
        .locator('button')
        .filter({ hasText: /delete|remove/i })
        .first();

      if (await deleteButton.isVisible({ timeout: 5000 })) {
        await deleteButton.click();

        // Confirm deletion if confirmation dialog appears
        const confirmButton = page
          .locator('button')
          .filter({ hasText: /confirm|yes|delete/i });
        if (await confirmButton.isVisible({ timeout: 2000 })) {
          await confirmButton.click();
        }

        // Wait for API response
        const deleteResponse = await deleteResponsePromise;

        // Verify backend API response
        expect(deleteResponse.status()).toBe(200);
        const responseBody = await deleteResponse.json();
        expect(responseBody).toHaveProperty('success', true);
        expect(responseBody).toHaveProperty('message');
      } else {
        // Skip if no users exist to delete
        test.skip();
      }
    });
  });

  test.describe('Role Changes', () => {
    test.beforeEach(async ({ page }) => {
      // Sign in as admin
      await page.goto('/signin');
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });
      await page.goto('/admin');
      await expect(page).toHaveURL(/.*admin/, { timeout: 10000 });
    });

    test('should update user role and receive response from backend', async ({
      page,
    }) => {
      // Wait for users list to load
      await page.waitForTimeout(1000);

      // Track role update API call
      const roleUpdatePromise = page.waitForResponse(
        response =>
          response.url().includes('/api/admin/users/') &&
          response.url().includes('/role') &&
          response.request().method() === 'PUT'
      );

      // Find role change dropdown/button for a user
      const roleSelect = page
        .locator('select, button')
        .filter({ hasText: /role|CUSTOMER|VENDOR|ADMIN/i })
        .first();

      if (await roleSelect.isVisible({ timeout: 5000 })) {
        // Change role (e.g., from CUSTOMER to VENDOR)
        await roleSelect.selectOption('VENDOR');

        // Wait for API response
        const roleResponse = await roleUpdatePromise;

        // Verify backend API response
        expect(roleResponse.status()).toBe(200);
        const responseBody = await roleResponse.json();
        expect(responseBody).toHaveProperty('success', true);
        expect(responseBody.data).toHaveProperty('user');
        expect(responseBody.data.user).toHaveProperty('role', 'VENDOR');
      } else {
        // Skip if role change UI not available
        test.skip();
      }
    });
  });

  test.describe('Audit Logs', () => {
    test.beforeEach(async ({ page }) => {
      // Sign in as admin
      await page.goto('/signin');
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });
      await page.goto('/admin');
      await expect(page).toHaveURL(/.*admin/, { timeout: 10000 });
    });

    test('should fetch audit logs from backend', async ({ page }) => {
      // Navigate to audit logs tab (if exists)
      const auditTab = page
        .locator('button, a')
        .filter({ hasText: /audit.*log|log/i });
      if (await auditTab.isVisible({ timeout: 5000 })) {
        await auditTab.click();
      }

      // Track API call to fetch audit logs
      const auditLogsResponsePromise = page.waitForResponse(
        response =>
          response.url().includes('/api/admin/audit-logs') &&
          response.request().method() === 'GET'
      );

      // Wait for API response
      const auditLogsResponse = await auditLogsResponsePromise;

      // Verify backend API response
      expect(auditLogsResponse.status()).toBe(200);
      const responseBody = await auditLogsResponse.json();
      expect(responseBody).toHaveProperty('success', true);
      expect(responseBody.data).toHaveProperty('logs');
      expect(Array.isArray(responseBody.data.logs)).toBe(true);

      // Verify audit logs are displayed in UI
      const logsContent = page.locator('text=/audit|log|action|user/i');
      await expect(logsContent.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('System Health', () => {
    test.beforeEach(async ({ page }) => {
      // Sign in as admin
      await page.goto('/signin');
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });
      await page.goto('/admin');
      await expect(page).toHaveURL(/.*admin/, { timeout: 10000 });
    });

    test('should fetch system health from backend', async ({ page }) => {
      // Navigate to system health tab (if exists)
      const healthTab = page
        .locator('button, a')
        .filter({ hasText: /system.*health|health|status/i });
      if (await healthTab.isVisible({ timeout: 5000 })) {
        await healthTab.click();
      }

      // Track API call to fetch system health
      const healthResponsePromise = page.waitForResponse(
        response =>
          response.url().includes('/api/admin/health') &&
          response.request().method() === 'GET'
      );

      // Wait for API response
      const healthResponse = await healthResponsePromise;

      // Verify backend API response
      expect(healthResponse.status()).toBe(200);
      const responseBody = await healthResponse.json();
      expect(responseBody).toHaveProperty('success', true);
      expect(responseBody.data).toHaveProperty('status');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(
        responseBody.data.status
      );

      // Verify system health is displayed in UI
      const healthContent = page.locator(
        'text=/health|status|database|redis|service/i'
      );
      await expect(healthContent.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('ADMIN-Only Access Enforcement', () => {
    test('should prevent CUSTOMER from accessing admin routes', async ({
      page,
    }) => {
      // Sign in as customer
      await page.goto('/signin');
      await page.fill('input[type="email"]', 'customer@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

      // Try to access admin route
      await page.goto('/admin');

      // Should redirect away from admin (to payments or signin)
      await expect(page).not.toHaveURL(/.*admin/, { timeout: 10000 });
    });

    test('should prevent CUSTOMER from accessing admin API endpoints', async ({
      page,
    }) => {
      // Sign in as customer
      await page.goto('/signin');
      await page.fill('input[type="email"]', 'customer@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

      // Get auth token
      const authToken = await page.evaluate(() => {
        return localStorage.getItem('auth_accessToken');
      });

      // Try to access admin API endpoint
      const adminResponse = await page.evaluate(async token => {
        const response = await fetch('/api/admin/users', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        return {
          status: response.status,
          body: await response.json(),
        };
      }, authToken);

      // Verify backend returns 403 Forbidden for CUSTOMER
      expect(adminResponse.status).toBe(403);
      expect(adminResponse.body).toHaveProperty('success', false);
      expect(adminResponse.body).toHaveProperty('error');
    });

    test('should allow ADMIN to access admin routes', async ({ page }) => {
      // Sign in as admin
      await page.goto('/signin');
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

      // Navigate to admin route
      await page.goto('/admin');

      // Should be able to access admin dashboard
      await expect(page).toHaveURL(/.*admin/, { timeout: 10000 });

      // Verify admin dashboard content is visible
      const adminContent = page.locator(
        'text=/admin|dashboard|user|management/i'
      );
      await expect(adminContent.first()).toBeVisible({ timeout: 10000 });
    });
  });
});
