/**
 * Vitest setup file for shell app tests
 * This file runs before each test file
 */
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Module Federation remotes for tests
// These mocks are used when the actual remotes aren't available during testing
vi.mock('authMfe/SignIn', () => ({
  default: () => {
    const React = require('react');
    return React.createElement('div', null, 'Mocked SignIn Component');
  },
}));

vi.mock('authMfe/SignUp', () => ({
  default: () => {
    const React = require('react');
    return React.createElement('div', null, 'Mocked SignUp Component');
  },
}));

vi.mock('paymentsMfe/PaymentsPage', () => ({
  default: () => {
    const React = require('react');
    return React.createElement('div', null, 'Mocked PaymentsPage Component');
  },
}));
