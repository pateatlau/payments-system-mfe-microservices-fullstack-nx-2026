/**
 * Vitest setup file for shell app tests
 * This file runs before each test file
 */
import { vi } from 'vitest';

// Mock Module Federation remote if needed
// The alias in vitest.config.ts handles the import resolution
