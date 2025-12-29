import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

// For CI, you may want to set BASE_URL to the deployed application.
const baseURL = process.env['BASE_URL'] || 'http://localhost:4200';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './src' }),

  // Override Nx preset's workers:1 default for CI
  // Use 2 workers to balance speed vs stability (GitHub Actions has 2 CPU cores)
  workers: process.env.CI ? 2 : undefined,

  // In CI, only run critical path tests to stay within timeout limits
  // Full test suite runs locally; CI runs: auth-flow, payments-flow, logout-flow
  ...(process.env.CI && {
    testMatch: /\/(auth-flow|payments-flow|logout-flow)\.spec\.ts$/,
  }),

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },
  /* Run your local dev server before starting the tests */
  /* For Module Federation, we need all three apps running */
  /* Note: Remotes must be built first (run: pnpm build:remotes) */
  webServer: process.env.CI
    ? [
        // In CI, serve built files with http-server from dist/apps/*
        {
          command: 'npx http-server dist/apps/auth-mfe -p 4201 --silent',
          url: 'http://localhost:4201',
          reuseExistingServer: false,
          cwd: workspaceRoot,
          timeout: 30000,
        },
        {
          command: 'npx http-server dist/apps/payments-mfe -p 4202 --silent',
          url: 'http://localhost:4202',
          reuseExistingServer: false,
          cwd: workspaceRoot,
          timeout: 30000,
        },
        {
          command: 'npx http-server dist/apps/admin-mfe -p 4203 --silent',
          url: 'http://localhost:4203',
          reuseExistingServer: false,
          cwd: workspaceRoot,
          timeout: 30000,
        },
        {
          command: 'npx http-server dist/apps/profile-mfe -p 4204 --silent',
          url: 'http://localhost:4204',
          reuseExistingServer: false,
          cwd: workspaceRoot,
          timeout: 30000,
        },
        {
          command: 'npx http-server dist/apps/shell -p 4200 --silent',
          url: 'http://localhost:4200',
          reuseExistingServer: false,
          cwd: workspaceRoot,
          timeout: 30000,
        },
      ]
    : [
        // In local dev, use nx preview which handles dev builds
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
  // In CI, only run Chromium for speed. Locally, run all browsers.
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
