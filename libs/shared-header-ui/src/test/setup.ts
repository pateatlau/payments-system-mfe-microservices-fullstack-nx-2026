/**
 * Vitest setup file for shared-header-ui library tests
 * This file runs before each test file
 */

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

