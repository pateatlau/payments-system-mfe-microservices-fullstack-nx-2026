/**
 * Test setup file for payments-mfe app (Vitest)
 * Runs before each test file.
 */
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Provide a minimal Jest compatibility layer for tests still using `jest.*`
// Map common Jest globals to Vitest equivalents.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).jest = {
  // core
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: vi.fn as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mock: vi.mock as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spyOn: vi.spyOn as any,
  // timers
  useFakeTimers: vi.useFakeTimers.bind(vi),
  useRealTimers: vi.useRealTimers.bind(vi),
  runOnlyPendingTimers: vi.runOnlyPendingTimers.bind(vi),
  runAllTimers: vi.runAllTimers.bind(vi),
  advanceTimersByTime: vi.advanceTimersByTime.bind(vi),
  setSystemTime: vi.setSystemTime.bind(vi),
  clearAllTimers: vi.clearAllTimers.bind(vi),
};
