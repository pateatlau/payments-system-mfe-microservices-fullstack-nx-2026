/**
 * Accessibility Test Utilities
 *
 * Provides helper functions for automated accessibility testing using jest-axe.
 * These utilities can be used across all MFE projects to ensure WCAG 2.1 AA compliance.
 *
 * @module @mfe/shared-test-utils
 */

import { axe, toHaveNoViolations, JestAxeConfigureOptions } from 'jest-axe';
import { render, RenderResult, RenderOptions } from '@testing-library/react';
import * as React from 'react';

// Ensure jest-axe matchers are available
expect.extend(toHaveNoViolations);

/**
 * Result of an accessibility audit
 */
export interface A11yAuditResult {
  /** The render result from React Testing Library */
  renderResult: RenderResult;
  /** The axe accessibility audit results */
  a11yResults: Awaited<ReturnType<typeof axe>>;
}

/**
 * Options for renderWithA11yAudit
 */
export interface RenderWithA11yAuditOptions {
  /** Additional axe configuration options */
  axeOptions?: JestAxeConfigureOptions;
  /** React Testing Library render options */
  renderOptions?: RenderOptions;
}

/**
 * Default axe configuration for component tests.
 * Disables rules that don't apply to isolated component testing.
 */
export const defaultAxeConfig: JestAxeConfigureOptions = {
  rules: {
    // Disable region rule - components are tested in isolation without landmarks
    region: { enabled: false },
    // Disable color-contrast for unit tests - should be tested in E2E with actual styles
    // Re-enable if your test setup loads full CSS
    // 'color-contrast': { enabled: false },
  },
};

/**
 * Renders a React component and runs axe accessibility audit.
 *
 * This is the primary function for testing component accessibility.
 * It combines React Testing Library's render with axe-core's accessibility audit.
 *
 * @param ui - The React element to render
 * @param options - Optional configuration for axe and render
 * @returns Promise containing render result and accessibility audit results
 *
 * @example
 * ```tsx
 * import { renderWithA11yAudit, expectNoA11yViolations } from '@mfe/shared-test-utils';
 * import { Button } from './Button';
 *
 * describe('Button Accessibility', () => {
 *   it('should have no accessibility violations', async () => {
 *     const { a11yResults } = await renderWithA11yAudit(
 *       <Button>Click me</Button>
 *     );
 *     expectNoA11yViolations(a11yResults);
 *   });
 * });
 * ```
 */
export async function renderWithA11yAudit(
  ui: React.ReactElement,
  options?: RenderWithA11yAuditOptions
): Promise<A11yAuditResult> {
  const { axeOptions, renderOptions } = options ?? {};
  const mergedAxeOptions = { ...defaultAxeConfig, ...axeOptions };

  const renderResult = render(ui, renderOptions);
  const a11yResults = await axe(renderResult.container, mergedAxeOptions);

  return { renderResult, a11yResults };
}

/**
 * Asserts that there are no accessibility violations in the audit results.
 *
 * @param results - The axe audit results to check
 * @throws Will throw if there are any accessibility violations
 *
 * @example
 * ```tsx
 * const { a11yResults } = await renderWithA11yAudit(<MyComponent />);
 * expectNoA11yViolations(a11yResults);
 * ```
 */
export function expectNoA11yViolations(
  results: Awaited<ReturnType<typeof axe>>
): void {
  expect(results).toHaveNoViolations();
}

/**
 * Runs an accessibility audit on an existing rendered container.
 * Useful when you need to run the audit after user interactions.
 *
 * @param container - The DOM element to audit
 * @param axeOptions - Optional axe configuration
 * @returns Promise containing the accessibility audit results
 *
 * @example
 * ```tsx
 * const { container } = render(<Form />);
 * await user.click(submitButton);
 *
 * // Check accessibility after form error state is shown
 * const results = await runA11yAudit(container);
 * expectNoA11yViolations(results);
 * ```
 */
export async function runA11yAudit(
  container: Element,
  axeOptions?: JestAxeConfigureOptions
): Promise<Awaited<ReturnType<typeof axe>>> {
  const mergedOptions = { ...defaultAxeConfig, ...axeOptions };
  return axe(container, mergedOptions);
}

/**
 * Creates a custom axe configuration by merging with defaults.
 * Useful for project-specific accessibility rules.
 *
 * @param customOptions - Custom axe options to merge
 * @returns Merged axe configuration
 *
 * @example
 * ```tsx
 * const strictConfig = createAxeConfig({
 *   rules: {
 *     'color-contrast': { enabled: true },
 *     'aria-allowed-attr': { enabled: true },
 *   },
 * });
 *
 * const { a11yResults } = await renderWithA11yAudit(
 *   <MyComponent />,
 *   { axeOptions: strictConfig }
 * );
 * ```
 */
export function createAxeConfig(
  customOptions: JestAxeConfigureOptions
): JestAxeConfigureOptions {
  return {
    ...defaultAxeConfig,
    ...customOptions,
    rules: {
      ...defaultAxeConfig.rules,
      ...customOptions.rules,
    },
  };
}

/**
 * Preset axe configurations for different testing scenarios
 */
export const axePresets = {
  /**
   * Default configuration for component testing.
   * Suitable for testing isolated components.
   */
  component: defaultAxeConfig,

  /**
   * Strict configuration that enables all rules.
   * Use for final validation before deployment.
   */
  strict: createAxeConfig({
    rules: {
      region: { enabled: true },
    },
  }),

  /**
   * Configuration for form components.
   * Focuses on form-related accessibility rules.
   */
  form: createAxeConfig({
    rules: {
      'label': { enabled: true },
      'aria-required-attr': { enabled: true },
      'aria-valid-attr': { enabled: true },
      'aria-valid-attr-value': { enabled: true },
    },
  }),

  /**
   * Configuration for interactive components.
   * Focuses on keyboard and focus-related rules.
   */
  interactive: createAxeConfig({
    rules: {
      'focus-order-semantics': { enabled: true },
      'tabindex': { enabled: true },
      'nested-interactive': { enabled: true },
    },
  }),
} as const;

/**
 * Type guard to check if an element is focusable
 *
 * @param element - The element to check
 * @returns True if the element can receive focus
 */
export function isFocusable(element: Element): boolean {
  if (!(element instanceof HTMLElement)) return false;

  // Check if element is disabled
  if ((element as HTMLInputElement).disabled) return false;

  // Check if element has negative tabindex
  const tabindex = element.getAttribute('tabindex');
  if (tabindex === '-1') return false;

  // Check if element is naturally focusable
  const focusableTags = [
    'A',
    'BUTTON',
    'INPUT',
    'SELECT',
    'TEXTAREA',
    'AREA',
  ];
  if (focusableTags.includes(element.tagName)) {
    // Links need href to be focusable
    if (element.tagName === 'A' && !element.hasAttribute('href')) {
      return false;
    }
    return true;
  }

  // Check if element has explicit tabindex >= 0
  if (tabindex !== null && parseInt(tabindex, 10) >= 0) {
    return true;
  }

  return false;
}

/**
 * Gets all focusable elements within a container
 *
 * @param container - The container element to search within
 * @returns Array of focusable elements in DOM order
 */
export function getFocusableElements(container: Element): HTMLElement[] {
  const selector = [
    'a[href]:not([tabindex="-1"])',
    'button:not([disabled]):not([tabindex="-1"])',
    'input:not([disabled]):not([tabindex="-1"])',
    'select:not([disabled]):not([tabindex="-1"])',
    'textarea:not([disabled]):not([tabindex="-1"])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  const elements = Array.from(container.querySelectorAll<HTMLElement>(selector));

  // Filter out hidden elements
  return elements.filter((el) => {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
}

/**
 * Checks if an element has sufficient color contrast
 * Note: This is a simplified check. Use axe-core for comprehensive contrast testing.
 *
 * @param foreground - Foreground color in hex format (e.g., '#000000')
 * @param background - Background color in hex format (e.g., '#ffffff')
 * @returns The contrast ratio
 */
export function calculateContrastRatio(
  foreground: string,
  background: string
): number {
  const getLuminance = (hex: string): number => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = ((rgb >> 16) & 0xff) / 255;
    const g = ((rgb >> 8) & 0xff) / 255;
    const b = (rgb & 0xff) / 255;

    const toLinear = (c: number): number =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * WCAG 2.1 AA contrast requirements
 */
export const contrastRequirements = {
  /** Minimum contrast for normal text (4.5:1) */
  normalText: 4.5,
  /** Minimum contrast for large text (3:1) */
  largeText: 3,
  /** Minimum contrast for UI components (3:1) */
  uiComponents: 3,
} as const;
