/**
 * Jest setup file for shared-design-system library tests
 * This file runs before each test file
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});
