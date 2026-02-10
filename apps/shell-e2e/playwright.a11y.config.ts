import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

/**
 * Playwright configuration specifically for Accessibility E2E tests.
 *
 * This config differs from the main playwright.config.ts:
 * 1. testDir is set to './src/a11y' to only run accessibility tests
 * 2. No testMatch filter - runs ALL tests in the a11y directory
 * 3. Uses same webServer config as main config for consistency
 *
 * Usage: npx playwright test --config=apps/shell-e2e/playwright.a11y.config.ts
 */

const baseURL = process.env['BASE_URL'] || 'http://localhost:4200';

export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './src/a11y' }),

  // Use 2 workers in CI to balance speed vs stability
  workers: process.env.CI ? 2 : undefined,

  // No testMatch filter - run ALL accessibility tests
  // (Unlike main config which filters to critical path tests in CI)

  use: {
    baseURL,
    trace: 'on-first-retry',
  },

  // In CI, serve built files with 'serve' package
  webServer: process.env.CI
    ? [
        {
          command: 'npx serve dist/apps/auth-mfe -l 4201 --cors --single',
          url: 'http://localhost:4201',
          reuseExistingServer: true, // Reuse servers started by main E2E tests
          cwd: workspaceRoot,
          timeout: 30000,
        },
        {
          command: 'npx serve dist/apps/payments-mfe -l 4202 --cors --single',
          url: 'http://localhost:4202',
          reuseExistingServer: true,
          cwd: workspaceRoot,
          timeout: 30000,
        },
        {
          command: 'npx serve dist/apps/admin-mfe -l 4203 --cors --single',
          url: 'http://localhost:4203',
          reuseExistingServer: true,
          cwd: workspaceRoot,
          timeout: 30000,
        },
        {
          command: 'npx serve dist/apps/profile-mfe -l 4204 --cors --single',
          url: 'http://localhost:4204',
          reuseExistingServer: true,
          cwd: workspaceRoot,
          timeout: 30000,
        },
        {
          command: 'npx serve dist/apps/shell -l 4200 --cors --single',
          url: 'http://localhost:4200',
          reuseExistingServer: true,
          cwd: workspaceRoot,
          timeout: 30000,
        },
      ]
    : [
        // Local dev - use nx preview
        {
          command: 'pnpm exec nx preview auth-mfe',
          url: 'http://localhost:4201',
          reuseExistingServer: true,
          cwd: workspaceRoot,
          timeout: 120000,
        },
        {
          command: 'pnpm exec nx preview payments-mfe',
          url: 'http://localhost:4202',
          reuseExistingServer: true,
          cwd: workspaceRoot,
          timeout: 120000,
        },
        {
          command: 'pnpm exec nx preview admin-mfe',
          url: 'http://localhost:4203',
          reuseExistingServer: true,
          cwd: workspaceRoot,
          timeout: 120000,
        },
        {
          command: 'pnpm exec nx preview profile-mfe',
          url: 'http://localhost:4204',
          reuseExistingServer: true,
          cwd: workspaceRoot,
          timeout: 120000,
        },
        {
          command: 'pnpm exec nx preview shell',
          url: 'http://localhost:4200',
          reuseExistingServer: true,
          cwd: workspaceRoot,
          timeout: 120000,
        },
      ],

  // Only run Chromium in CI for speed
  projects: process.env.CI
    ? [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
      ]
    : [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
        {
          name: 'firefox',
          use: { ...devices['Desktop Firefox'] },
        },
        {
          name: 'webkit',
          use: { ...devices['Desktop Safari'] },
        },
      ],
});
