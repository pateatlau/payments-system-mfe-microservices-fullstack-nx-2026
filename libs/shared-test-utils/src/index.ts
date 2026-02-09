/**
 * Shared Test Utilities Library
 *
 * Provides common testing utilities for accessibility testing
 * across all MFE projects in the payments system.
 *
 * @packageDocumentation
 */

// Accessibility testing utilities
export {
  renderWithA11yAudit,
  expectNoA11yViolations,
  runA11yAudit,
  createAxeConfig,
  axePresets,
  defaultAxeConfig,
  isFocusable,
  getFocusableElements,
  calculateContrastRatio,
  contrastRequirements,
} from './lib/a11y-test-utils';

export type {
  A11yAuditResult,
  RenderWithA11yAuditOptions,
} from './lib/a11y-test-utils';

// Color contrast testing utilities
export {
  parseColor,
  calculateContrastRatio as calculateColorContrastRatio,
  passesNormalTextContrast,
  passesLargeTextContrast,
  passesUIComponentContrast,
  validateColorContrast,
  lightModeColors,
  darkModeColors,
  WCAG_AA_REQUIREMENTS,
} from './lib/contrast-test-utils';

export type { ColorPair } from './lib/contrast-test-utils';

// Re-export commonly used testing library utilities for convenience
export { axe, toHaveNoViolations } from 'jest-axe';
export type { JestAxeConfigureOptions } from 'jest-axe';
