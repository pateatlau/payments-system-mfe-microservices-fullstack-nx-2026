# Comprehensive Testing Guide

**POC-1 Implementation**  
**Status:** ✅ Complete

---

## Overview

POC-1 implements a comprehensive testing strategy with unit tests, integration tests, and end-to-end (E2E) tests. All tests are production-ready and follow best practices.

**Testing Stack:**

- **Unit Tests:** Jest + React Testing Library
- **Integration Tests:** Jest + React Testing Library
- **E2E Tests:** Playwright

> **Note:** Testing framework migrated from Vitest to Jest as part of the Rspack migration. Jest provides better ecosystem compatibility with Rspack.

**Coverage Target:** 70%+ (achieved)

---

## Testing Strategy

### Test Pyramid

```
        ┌─────────────┐
        │   E2E Tests  │  (16 tests)
        │  Playwright │
        └─────────────┘
       ┌─────────────────┐
       │ Integration     │  (22 tests)
       │ Tests           │
       └─────────────────┘
      ┌─────────────────────┐
      │   Unit Tests        │  (73+ tests)
      │   Jest              │
      └─────────────────────┘
```

### Test Distribution

- **Unit Tests:** 73+ tests (components, hooks, stores, utilities)
- **Integration Tests:** 22 tests (user flows, component integration)
- **E2E Tests:** 16 tests (complete browser-based journeys)

**Total:** 111+ tests

---

## Unit Testing

### Framework

**Jest** - Industry-standard testing framework

**Why Jest:**

- ✅ Mature ecosystem with extensive plugin support
- ✅ Rspack-compatible (unlike Vitest which is Vite-native)
- ✅ TypeScript support via ts-jest
- ✅ Excellent coverage support
- ✅ Snapshot testing
- ✅ Parallel execution

### Setup

**Configuration:** `jest.config.js` (per project or root)

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['./src/test/setup.ts'],
  moduleNameMapper: {
    '^@web-mfe/(.*)$': '<rootDir>/libs/$1/src/index.ts',
  },
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

**Test Setup:** `src/test/setup.ts`

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
```

### Testing Patterns

#### Component Testing

**Pattern:** Test user interactions, not implementation details

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignIn } from './SignIn';

describe('SignIn', () => {
  it('should display error for invalid email', async () => {
    const user = userEvent.setup();
    render(<SignIn />);

    await user.type(screen.getByLabelText(/email/i), 'invalid');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
  });
});
```

#### Hook Testing

**Pattern:** Test hooks with `renderHook` utility

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { usePayments } from './usePayments';

describe('usePayments', () => {
  it('should fetch payments', async () => {
    const { result } = renderHook(() => usePayments());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
  });
});
```

#### Store Testing

**Pattern:** Test store actions and state changes

```typescript
import { useAuthStore } from 'shared-auth-store';

describe('useAuthStore', () => {
  it('should login user', async () => {
    await useAuthStore.getState().login('test@example.com', 'password');

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user).toBeDefined();
  });
});
```

### Module Federation Testing

**Pattern:** Dependency Injection for testability

**Why:** Module Federation remote imports cannot be resolved during test runs (applies to both Vitest and Jest).

**Solution:**

```typescript
// Component accepts optional injected component
export function PageComponent({ InjectedComponent }: Props = {}) {
  const Component = InjectedComponent || DefaultLazyComponent;
  return <Component />;
}

// Tests inject mock directly
render(<PageComponent InjectedComponent={MockComponent} />);
```

**Benefits:**

- ✅ Fast and reliable (no network calls)
- ✅ No complex bundler configuration
- ✅ Clear separation of concerns
- ✅ Follows "design for testability" principle

### Running Unit Tests

```bash
# Run all unit tests
pnpm test

# Run tests for specific project
pnpm test:shell
pnpm test:auth-mfe
pnpm test:payments-mfe

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test --coverage
```

---

## Integration Testing

### Framework

**Jest + React Testing Library** - Same as unit tests, but testing component integration

### Test Files

**Location:** `apps/shell/src/integration/`

1. **AppIntegration.test.tsx** (14 tests)
   - Unauthenticated user flow
   - Authenticated user flow
   - Route protection
   - State synchronization
   - Navigation flow

2. **PaymentsFlowIntegration.test.tsx** (7 tests)
   - View payments list
   - Create payment (VENDOR)
   - Update payment
   - Delete payment
   - Role-based access

### Testing Patterns

#### User Flow Testing

**Pattern:** Test complete user journeys across components

```typescript
describe('Authentication Flow', () => {
  it('should sign in and navigate to payments', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AppRoutes
          SignInComponent={MockSignIn}
          PaymentsComponent={MockPayments}
        />
      </MemoryRouter>
    );

    // Navigate to sign in
    await user.click(screen.getByText(/sign in/i));

    // Fill form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Should navigate to payments
    await waitFor(() => {
      expect(screen.getByText(/payments/i)).toBeInTheDocument();
    });
  });
});
```

#### State Synchronization Testing

**Pattern:** Test state changes across components

```typescript
describe('State Synchronization', () => {
  it('should update UI when auth state changes', () => {
    // Start unauthenticated
    setMockAuthState({ isAuthenticated: false });

    const { rerender } = render(<App />);
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();

    // Change to authenticated
    setMockAuthState({ isAuthenticated: true });
    rerender(<App />);

    expect(screen.getByText(/payments/i)).toBeInTheDocument();
  });
});
```

### Running Integration Tests

```bash
# Run integration tests
pnpm test:shell

# Integration tests are part of the shell test suite
```

---

## End-to-End (E2E) Testing

### Framework

**Playwright** - Cross-browser E2E testing

**Why Playwright:**

- ✅ Cross-browser (Chromium, Firefox, WebKit)
- ✅ Auto-waiting
- ✅ Network interception
- ✅ Screenshot support
- ✅ Reliable and fast

### Setup

**Configuration:** `apps/shell-e2e/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: [
    {
      command: 'pnpm preview:auth-mfe',
      port: 4201,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm preview:payments-mfe',
      port: 4202,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm preview:shell',
      port: 4200,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
```

### Test Files

**Location:** `apps/shell-e2e/src/`

1. **auth-flow.spec.ts** (6 tests)
   - Sign-in flow
   - Sign-up flow
   - Form validation
   - Navigation

2. **payments-flow.spec.ts** (4 tests)
   - Payments page
   - Payments list
   - Create payment
   - Role-based UI

3. **logout-flow.spec.ts** (2 tests)
   - Logout and redirect
   - State clearing

4. **role-based-access.spec.ts** (4 tests)
   - VENDOR features
   - CUSTOMER features

### Testing Patterns

#### Page Object Model (Future)

**Pattern:** Create page objects for reusable test code

```typescript
class SignInPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/signin');
  }

  async signIn(email: string, password: string) {
    await this.page.fill('[name="email"]', email);
    await this.page.fill('[name="password"]', password);
    await this.page.click('button[type="submit"]');
  }
}
```

#### Test Isolation

**Pattern:** Clear state between tests

```typescript
test.beforeEach(async ({ page }) => {
  // Clear localStorage
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
});
```

### Running E2E Tests

```bash
# Run all E2E tests (automatically builds remotes)
pnpm e2e

# Run E2E tests for shell
pnpm e2e:shell

# Run E2E tests in UI mode
pnpm e2e --ui

# Run E2E tests in headed mode
pnpm e2e --headed
```

**Prerequisites:**

- Remotes must be built: `pnpm build:remotes`
- All servers must be running (handled automatically by Playwright)

---

## Test Coverage

### Coverage Target

**70%+ coverage** (achieved)

### Coverage Reports

```bash
# Generate coverage report
pnpm test --coverage

# View HTML coverage report
open coverage/index.html
```

### Coverage Areas

- ✅ Components (70%+)
- ✅ Hooks (70%+)
- ✅ Stores (70%+)
- ✅ Utilities (70%+)
- ✅ API functions (70%+)

---

## Best Practices

### 1. Test User Behavior, Not Implementation

**✅ Good:**

```typescript
it('should display error when email is invalid', async () => {
  const user = userEvent.setup();
  render(<SignIn />);

  await user.type(screen.getByLabelText(/email/i), 'invalid');
  await user.click(screen.getByRole('button', { name: /sign in/i }));

  expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
});
```

**❌ Bad:**

```typescript
it('should call validateEmail', () => {
  const validateEmail = jest.fn();
  render(<SignIn validateEmail={validateEmail} />);

  expect(validateEmail).toHaveBeenCalled();
});
```

### 2. Use Descriptive Test Names

**✅ Good:**

```typescript
it('should redirect to /payments after successful sign-in', async () => {
  // ...
});
```

**❌ Bad:**

```typescript
it('should work', async () => {
  // ...
});
```

### 3. Test Edge Cases

**✅ Good:**

```typescript
it('should handle network error gracefully', async () => {
  // Mock network error
  // Test error handling
});
```

### 4. Keep Tests Isolated

**✅ Good:**

```typescript
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});
```

### 5. Use Appropriate Test Types

- **Unit Tests:** Fast, isolated, test single units
- **Integration Tests:** Test component integration
- **E2E Tests:** Test complete user journeys

---

## Troubleshooting

### Tests Failing Due to Module Federation

**Issue:** Tests fail because Module Federation imports don't resolve.

**Solution:** Use Dependency Injection pattern (see Module Federation Testing section).

### Tests Failing Due to localStorage

**Issue:** Tests fail because localStorage is not available.

**Solution:** Use `jsdom` environment in Jest config and mock localStorage if needed.

### E2E Tests Timing Out

**Issue:** E2E tests timeout waiting for servers.

**Solution:**

1. Ensure dev servers are running: `pnpm dev`
2. Check server ports (4200, 4201, 4202)
3. Increase timeout in Playwright config

### Coverage Not Generating

**Issue:** Coverage report not generated.

**Solution:**

1. Ensure Jest coverage is configured in `jest.config.js`
2. Run with `--coverage` flag: `pnpm test --coverage`

---

## Related Documentation

- [`unit-testing-summary.md`](./unit-testing-summary.md) - Unit testing details
- [`integration-test-results.md`](./integration-test-results.md) - Integration test results
- [`e2e-testing-summary.md`](./e2e-testing-summary.md) - E2E testing details
- [`poc-1-completion-summary.md`](./poc-1-completion-summary.md) - Overall summary

---

**Status:** ✅ Complete  
**Last Updated:** 2026-01-XX
