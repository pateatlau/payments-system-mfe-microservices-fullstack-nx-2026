/**
 * Jest setup file for shell app tests
 * This file runs before each test file
 */
import '@testing-library/jest-dom';

/**
 * Testing Strategy for Module Federation:
 *
 * Instead of trying to mock Module Federation imports at the bundler level,
 * we use a dependency injection pattern in page components:
 *
 * 1. Page components (SignInPage, SignUpPage, PaymentsPage) accept an optional
 *    component prop that overrides the default Module Federation import
 *
 * 2. Tests inject mock components via these props:
 *    <SignInPage SignInComponent={MockSignIn} />
 *
 * 3. AppRoutes tests mock entire page components at the module level using jest.mock()
 *
 * This approach is more reliable and maintainable than trying to intercept
 * dynamic imports at the bundler level.
 *
 * Note: Module Federation imports are resolved via moduleNameMapper in jest.config.js
 */
