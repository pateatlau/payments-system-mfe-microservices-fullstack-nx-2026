import { test, expect } from '@playwright/test';

/**
 * Full-Stack Integration Tests for Payments Flow
 *
 * These tests verify end-to-end flows across frontend and backend:
 * - Frontend UI interactions
 * - Backend API calls and responses
 * - Role-based access control
 * - Payment status changes
 */

test.describe('Full-Stack Payments Integration', () => {
  test.describe('View Payments', () => {
    test('should fetch and display payments list from backend', async ({
      page,
    }) => {
      // Sign in as customer
      await page.goto('/signin');
      await page.fill('input[type="email"]', 'customer@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

      // Track API call to fetch payments
      const paymentsResponsePromise = page.waitForResponse(
        response =>
          response.url().includes('/api/payments') &&
          response.request().method() === 'GET'
      );

      // Navigate to payments page (if not already there)
      await page.goto('/payments');

      // Wait for API response
      const paymentsResponse = await paymentsResponsePromise;

      // Verify backend API response
      expect(paymentsResponse.status()).toBe(200);
      const responseBody = await paymentsResponse.json();
      expect(responseBody).toHaveProperty('success', true);
      expect(responseBody.data).toHaveProperty('payments');
      expect(Array.isArray(responseBody.data.payments)).toBe(true);

      // Verify payments are displayed in UI
      // The page might show "No payments found" or a list of payments
      const paymentsContent = page.locator('text=/payment|no.*payment/i');
      await expect(paymentsContent.first()).toBeVisible({ timeout: 10000 });
    });

    test('should handle empty payments list from backend', async ({ page }) => {
      // Sign in
      await page.goto('/signin');
      await page.fill('input[type="email"]', 'customer@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

      // Track API call
      const paymentsResponsePromise = page.waitForResponse(
        response =>
          response.url().includes('/api/payments') &&
          response.request().method() === 'GET'
      );

      await page.goto('/payments');

      // Wait for API response
      const paymentsResponse = await paymentsResponsePromise;
      expect(paymentsResponse.status()).toBe(200);

      const responseBody = await paymentsResponse.json();
      if (responseBody.data.payments.length === 0) {
        // Verify empty state is displayed
        await expect(page.locator('text=/no.*payment|empty/i')).toBeVisible({
          timeout: 10000,
        });
      }
    });
  });

  test.describe('Create Payment (VENDOR)', () => {
    test.beforeEach(async ({ page }) => {
      // Sign in as vendor before each test
      await page.goto('/signin');
      await page.fill('input[type="email"]', 'vendor@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });
    });

    test('should create payment and receive response from backend', async ({
      page,
    }) => {
      // Track create payment API call
      const createResponsePromise = page.waitForResponse(
        response =>
          response.url().includes('/api/payments') &&
          response.request().method() === 'POST'
      );

      // Wait for create payment button (VENDOR only)
      const createButton = page
        .locator('button')
        .filter({ hasText: /create.*payment/i });
      await expect(createButton).toBeVisible({ timeout: 10000 });
      await createButton.click();

      // Wait for create payment form
      await expect(page.locator('input[type="number"]')).toBeVisible({
        timeout: 5000,
      });

      // Fill in payment form
      const testAmount = '150.50';
      await page.fill('input[type="number"]', testAmount);

      // Find currency and description fields if they exist
      const currencySelect = page.locator('select, input').filter({
        hasText: /currency|USD|EUR/i,
      });
      if ((await currencySelect.count()) > 0) {
        await currencySelect.first().fill('USD');
      }

      const descriptionInput = page
        .locator('input[type="text"], textarea')
        .filter({ hasText: /description/i });
      if ((await descriptionInput.count()) > 0) {
        await descriptionInput.first().fill('Test payment from E2E');
      }

      // Submit form
      const submitButton = page
        .locator('button[type="submit"]')
        .filter({ hasText: /create|submit/i });
      await submitButton.click();

      // Wait for API response
      const createResponse = await createResponsePromise;

      // Verify backend API response
      expect(createResponse.status()).toBe(201);
      const responseBody = await createResponse.json();
      expect(responseBody).toHaveProperty('success', true);
      expect(responseBody.data).toHaveProperty('payment');
      expect(responseBody.data.payment).toHaveProperty('id');
      expect(responseBody.data.payment).toHaveProperty('amount');
      expect(responseBody.data.payment).toHaveProperty('status');

      // Verify payment appears in UI or form closes
      await expect(
        page.locator(`text=/150|${testAmount}|payment.*created/i`)
      ).toBeVisible({ timeout: 10000 });
    });

    test('should handle create payment validation errors from backend', async ({
      page,
    }) => {
      // Track create payment API call
      const createResponsePromise = page.waitForResponse(
        response =>
          response.url().includes('/api/payments') &&
          response.request().method() === 'POST'
      );

      // Open create payment form
      const createButton = page
        .locator('button')
        .filter({ hasText: /create.*payment/i });
      await createButton.click();

      // Try to create payment with invalid data (e.g., negative amount)
      await page.fill('input[type="number"]', '-100');

      const submitButton = page
        .locator('button[type="submit"]')
        .filter({ hasText: /create|submit/i });
      await submitButton.click();

      // Wait for API response
      const createResponse = await createResponsePromise;

      // Verify backend returns validation error (400)
      expect(createResponse.status()).toBe(400);
      const errorBody = await createResponse.json();
      expect(errorBody).toHaveProperty('success', false);
      expect(errorBody).toHaveProperty('error');

      // Verify error message is displayed in UI
      await expect(
        page.locator('text=/invalid|error|validation/i')
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Update Payment (VENDOR)', () => {
    test.beforeEach(async ({ page }) => {
      // Sign in as vendor
      await page.goto('/signin');
      await page.fill('input[type="email"]', 'vendor@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });
    });

    test('should update payment and receive response from backend', async ({
      page,
    }) => {
      // First, create a payment to update
      const createResponsePromise = page.waitForResponse(
        response =>
          response.url().includes('/api/payments') &&
          response.request().method() === 'POST'
      );

      const createButton = page
        .locator('button')
        .filter({ hasText: /create.*payment/i });
      if (await createButton.isVisible({ timeout: 5000 })) {
        await createButton.click();
        await page.fill('input[type="number"]', '100');
        const submitButton = page
          .locator('button[type="submit"]')
          .filter({ hasText: /create|submit/i });
        await submitButton.click();
        await createResponsePromise;
      }

      // Wait for payments list to load
      await page.waitForTimeout(1000);

      // Track update payment API call
      const updateResponsePromise = page.waitForResponse(
        response =>
          response.url().includes('/api/payments/') &&
          response.request().method() === 'PUT'
      );

      // Find edit button for a payment
      const editButton = page
        .locator('button')
        .filter({ hasText: /edit|update/i })
        .first();
      if (await editButton.isVisible({ timeout: 5000 })) {
        await editButton.click();

        // Wait for edit form
        await expect(page.locator('input[type="number"]')).toBeVisible({
          timeout: 5000,
        });

        // Update amount
        await page.fill('input[type="number"]', '200');

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
        expect(responseBody.data).toHaveProperty('payment');
        expect(responseBody.data.payment).toHaveProperty('amount', 200);
      } else {
        // Skip if no payments exist to edit
        test.skip();
      }
    });
  });

  test.describe('Payment Status Changes', () => {
    test.beforeEach(async ({ page }) => {
      // Sign in as vendor
      await page.goto('/signin');
      await page.fill('input[type="email"]', 'vendor@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });
    });

    test('should update payment status and receive response from backend', async ({
      page,
    }) => {
      // First, create a payment
      const createResponsePromise = page.waitForResponse(
        response =>
          response.url().includes('/api/payments') &&
          response.request().method() === 'POST'
      );

      const createButton = page
        .locator('button')
        .filter({ hasText: /create.*payment/i });
      if (await createButton.isVisible({ timeout: 5000 })) {
        await createButton.click();
        await page.fill('input[type="number"]', '100');
        const submitButton = page
          .locator('button[type="submit"]')
          .filter({ hasText: /create|submit/i });
        await submitButton.click();
        await createResponsePromise;
      }

      // Wait for payments list
      await page.waitForTimeout(1000);

      // Track status update API call
      const statusUpdatePromise = page.waitForResponse(
        response =>
          response.url().includes('/api/payments/') &&
          (response.request().method() === 'PUT' ||
            response.request().method() === 'PATCH')
      );

      // Find status change button/dropdown
      const statusButton = page
        .locator('button, select')
        .filter({ hasText: /status|complete|pending|failed/i })
        .first();

      if (await statusButton.isVisible({ timeout: 5000 })) {
        await statusButton.click();

        // Select new status (if dropdown) or click status button
        const completeOption = page
          .locator('option, button')
          .filter({ hasText: /complete|completed/i })
          .first();
        if (await completeOption.isVisible({ timeout: 2000 })) {
          await completeOption.click();
        }

        // Wait for API response
        const statusResponse = await statusUpdatePromise;

        // Verify backend API response
        expect([200, 201]).toContain(statusResponse.status());
        const responseBody = await statusResponse.json();
        expect(responseBody).toHaveProperty('success', true);
        expect(responseBody.data).toHaveProperty('payment');
        expect(responseBody.data.payment).toHaveProperty('status');
      } else {
        // Skip if status change UI not available
        test.skip();
      }
    });
  });

  test.describe('Role-Based Access', () => {
    test('should allow VENDOR to create payments', async ({ page }) => {
      // Sign in as vendor
      await page.goto('/signin');
      await page.fill('input[type="email"]', 'vendor@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

      // Verify create payment button is visible (VENDOR only)
      const createButton = page
        .locator('button')
        .filter({ hasText: /create.*payment/i });
      await expect(createButton).toBeVisible({ timeout: 10000 });

      // Verify API call includes proper authorization
      const paymentsResponsePromise = page.waitForResponse(
        response =>
          response.url().includes('/api/payments') &&
          response.request().method() === 'GET'
      );

      await page.goto('/payments');
      const paymentsResponse = await paymentsResponsePromise;

      // Verify backend accepts request (200)
      expect(paymentsResponse.status()).toBe(200);
    });

    test('should prevent CUSTOMER from creating payments', async ({ page }) => {
      // Sign in as customer
      await page.goto('/signin');
      await page.fill('input[type="email"]', 'customer@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

      // Verify create payment button is NOT visible
      const createButton = page
        .locator('button')
        .filter({ hasText: /create.*payment/i });
      await expect(createButton).not.toBeVisible({ timeout: 5000 });

      // Try to access create endpoint directly (should fail)
      const _createResponsePromise = page.waitForResponse(
        response =>
          response.url().includes('/api/payments') &&
          response.request().method() === 'POST'
      );

      // Try to create payment via API (if possible through UI manipulation)
      // In practice, the button won't exist, so this test verifies UI-level RBAC
      // Backend RBAC is tested in backend integration tests

      // Verify customer can still view payments
      const paymentsResponsePromise = page.waitForResponse(
        response =>
          response.url().includes('/api/payments') &&
          response.request().method() === 'GET'
      );

      await page.goto('/payments');
      const paymentsResponse = await paymentsResponsePromise;
      expect(paymentsResponse.status()).toBe(200);
    });

    test('should enforce role-based access on backend API', async ({
      page,
    }) => {
      // Sign in as customer
      await page.goto('/signin');
      await page.fill('input[type="email"]', 'customer@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

      // Try to create payment via direct API call (simulated)
      // Get auth token
      const authToken = await page.evaluate(() => {
        return localStorage.getItem('auth_accessToken');
      });

      // Make direct API call to create payment (should fail for CUSTOMER)
      const createResponse = await page.evaluate(async token => {
        const response = await fetch('/api/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: 100,
            currency: 'USD',
            description: 'Test payment',
          }),
        });
        return {
          status: response.status,
          body: await response.json(),
        };
      }, authToken);

      // Verify backend returns 403 Forbidden for CUSTOMER
      expect(createResponse.status).toBe(403);
      expect(createResponse.body).toHaveProperty('success', false);
      expect(createResponse.body).toHaveProperty('error');
    });
  });
});
