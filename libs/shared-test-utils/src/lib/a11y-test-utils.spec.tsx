/**
 * Tests for Accessibility Test Utilities
 */

import * as React from 'react';
import { render } from '@testing-library/react';
import {
  renderWithA11yAudit,
  expectNoA11yViolations,
  runA11yAudit,
  createAxeConfig,
  axePresets,
  isFocusable,
  getFocusableElements,
  calculateContrastRatio,
  contrastRequirements,
  defaultAxeConfig,
} from './a11y-test-utils';

// Test components
const AccessibleButton = () => (
  <button type="button">Click me</button>
);

const AccessibleForm = () => (
  <form>
    <label htmlFor="email">Email</label>
    <input id="email" type="email" />
    <button type="submit">Submit</button>
  </form>
);

const InaccessibleImage = () => (
  // eslint-disable-next-line jsx-a11y/alt-text
  <img src="test.jpg" />
);

describe('a11y-test-utils', () => {
  describe('renderWithA11yAudit', () => {
    it('should render component and return accessibility results', async () => {
      const { renderResult, a11yResults } = await renderWithA11yAudit(
        <AccessibleButton />
      );

      expect(renderResult.container).toBeTruthy();
      expect(a11yResults).toBeDefined();
      expect(a11yResults.violations).toBeDefined();
    });

    it('should have no violations for accessible button', async () => {
      const { a11yResults } = await renderWithA11yAudit(<AccessibleButton />);
      expectNoA11yViolations(a11yResults);
    });

    it('should have no violations for accessible form', async () => {
      const { a11yResults } = await renderWithA11yAudit(<AccessibleForm />);
      expectNoA11yViolations(a11yResults);
    });

    it('should detect violations for inaccessible image', async () => {
      const { a11yResults } = await renderWithA11yAudit(<InaccessibleImage />);
      expect(a11yResults.violations.length).toBeGreaterThan(0);
      expect(a11yResults.violations.some((v) => v.id === 'image-alt')).toBe(true);
    });

    it('should accept custom axe options', async () => {
      const { a11yResults } = await renderWithA11yAudit(
        <InaccessibleImage />,
        {
          axeOptions: {
            rules: {
              'image-alt': { enabled: false },
            },
          },
        }
      );
      // With image-alt disabled, should have no violations
      expect(a11yResults.violations.filter((v) => v.id === 'image-alt')).toHaveLength(0);
    });

    it('should accept render options', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <div data-testid="wrapper">{children}</div>
      );

      const { renderResult } = await renderWithA11yAudit(
        <AccessibleButton />,
        { renderOptions: { wrapper } }
      );

      expect(renderResult.getByTestId('wrapper')).toBeTruthy();
    });
  });

  describe('runA11yAudit', () => {
    it('should audit an existing container', async () => {
      const { container } = render(<AccessibleButton />);
      const results = await runA11yAudit(container);
      expectNoA11yViolations(results);
    });

    it('should accept custom options', async () => {
      const { container } = render(<InaccessibleImage />);
      const results = await runA11yAudit(container, {
        rules: { 'image-alt': { enabled: false } },
      });
      expect(results.violations.filter((v) => v.id === 'image-alt')).toHaveLength(0);
    });
  });

  describe('createAxeConfig', () => {
    it('should merge with default config', () => {
      const config = createAxeConfig({
        rules: {
          'color-contrast': { enabled: true },
        },
      });

      expect(config.rules).toBeDefined();
      expect(config.rules?.['region']).toEqual({ enabled: false }); // From default
      expect(config.rules?.['color-contrast']).toEqual({ enabled: true }); // Custom
    });

    it('should override default rules', () => {
      const config = createAxeConfig({
        rules: {
          region: { enabled: true },
        },
      });

      expect(config.rules?.['region']).toEqual({ enabled: true });
    });
  });

  describe('axePresets', () => {
    it('should have component preset', () => {
      expect(axePresets.component).toEqual(defaultAxeConfig);
    });

    it('should have strict preset with region enabled', () => {
      expect(axePresets.strict.rules?.['region']).toEqual({ enabled: true });
    });

    it('should have form preset', () => {
      expect(axePresets.form.rules?.['label']).toEqual({ enabled: true });
      expect(axePresets.form.rules?.['aria-required-attr']).toEqual({ enabled: true });
    });

    it('should have interactive preset', () => {
      expect(axePresets.interactive.rules?.['tabindex']).toEqual({ enabled: true });
    });
  });

  describe('isFocusable', () => {
    it('should return true for button', () => {
      const button = document.createElement('button');
      expect(isFocusable(button)).toBe(true);
    });

    it('should return true for link with href', () => {
      const link = document.createElement('a');
      link.setAttribute('href', '/test');
      expect(isFocusable(link)).toBe(true);
    });

    it('should return false for link without href', () => {
      const link = document.createElement('a');
      expect(isFocusable(link)).toBe(false);
    });

    it('should return false for disabled button', () => {
      const button = document.createElement('button');
      button.disabled = true;
      expect(isFocusable(button)).toBe(false);
    });

    it('should return true for div with tabindex 0', () => {
      const div = document.createElement('div');
      div.setAttribute('tabindex', '0');
      expect(isFocusable(div)).toBe(true);
    });

    it('should return false for div with tabindex -1', () => {
      const div = document.createElement('div');
      div.setAttribute('tabindex', '-1');
      expect(isFocusable(div)).toBe(false);
    });

    it('should return false for non-HTMLElement', () => {
      const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      expect(isFocusable(svgElement)).toBe(false);
    });
  });

  describe('getFocusableElements', () => {
    it('should return all focusable elements', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button>Button</button>
        <a href="/link">Link</a>
        <input type="text" />
        <div tabindex="0">Custom</div>
        <span>Not focusable</span>
      `;
      document.body.appendChild(container);

      const focusable = getFocusableElements(container);
      expect(focusable).toHaveLength(4);

      document.body.removeChild(container);
    });

    it('should exclude disabled elements', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button>Enabled</button>
        <button disabled>Disabled</button>
      `;
      document.body.appendChild(container);

      const focusable = getFocusableElements(container);
      expect(focusable).toHaveLength(1);
      expect(focusable[0]?.textContent).toBe('Enabled');

      document.body.removeChild(container);
    });

    it('should exclude elements with tabindex -1', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button tabindex="-1">Not reachable</button>
        <button>Reachable</button>
      `;
      document.body.appendChild(container);

      const focusable = getFocusableElements(container);
      expect(focusable).toHaveLength(1);
      expect(focusable[0]?.textContent).toBe('Reachable');

      document.body.removeChild(container);
    });
  });

  describe('calculateContrastRatio', () => {
    it('should calculate contrast ratio for black on white', () => {
      const ratio = calculateContrastRatio('#000000', '#ffffff');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should calculate contrast ratio for white on black', () => {
      const ratio = calculateContrastRatio('#ffffff', '#000000');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should calculate same color as 1:1 ratio', () => {
      const ratio = calculateContrastRatio('#ffffff', '#ffffff');
      expect(ratio).toBeCloseTo(1, 0);
    });

    it('should calculate mid-gray contrast ratios', () => {
      // Gray on white has lower contrast
      const ratio = calculateContrastRatio('#808080', '#ffffff');
      expect(ratio).toBeGreaterThan(3);
      expect(ratio).toBeLessThan(5);
    });
  });

  describe('contrastRequirements', () => {
    it('should have correct WCAG AA requirements', () => {
      expect(contrastRequirements.normalText).toBe(4.5);
      expect(contrastRequirements.largeText).toBe(3);
      expect(contrastRequirements.uiComponents).toBe(3);
    });
  });
});
