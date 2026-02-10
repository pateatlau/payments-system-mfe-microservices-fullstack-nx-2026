/**
 * Color Contrast Test Utilities - Test Suite
 *
 * Tests for the contrast calculation and validation utilities.
 * Also serves as an automated check that all design system colors
 * meet WCAG 2.1 AA requirements.
 */

import {
  parseColor,
  calculateContrastRatio,
  passesNormalTextContrast,
  passesLargeTextContrast,
  passesUIComponentContrast,
  validateColorContrast,
  WCAG_AA_REQUIREMENTS,
  lightModeColors,
  darkModeColors,
} from './contrast-test-utils';

describe('Color Contrast Test Utilities', () => {
  describe('parseColor', () => {
    it('should parse hex colors correctly', () => {
      expect(parseColor('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
      expect(parseColor('#000000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(parseColor('#084683')).toEqual({ r: 8, g: 70, b: 131 });
    });

    it('should parse shorthand hex colors', () => {
      expect(parseColor('#fff')).toEqual({ r: 255, g: 255, b: 255 });
      expect(parseColor('#000')).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('should parse rgb() format', () => {
      expect(parseColor('rgb(255, 255, 255)')).toEqual({ r: 255, g: 255, b: 255 });
      expect(parseColor('rgb(8, 70, 131)')).toEqual({ r: 8, g: 70, b: 131 });
    });

    it('should parse space-separated RGB format', () => {
      expect(parseColor('255 255 255')).toEqual({ r: 255, g: 255, b: 255 });
      expect(parseColor('8 70 131')).toEqual({ r: 8, g: 70, b: 131 });
    });

    it('should throw on invalid formats', () => {
      expect(() => parseColor('invalid')).toThrow();
      expect(() => parseColor('#gggggg')).toThrow();
    });
  });

  describe('calculateContrastRatio', () => {
    it('should calculate maximum contrast for black on white', () => {
      const ratio = calculateContrastRatio('#000000', '#ffffff');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should calculate 1:1 for same colors', () => {
      const ratio = calculateContrastRatio('#ffffff', '#ffffff');
      expect(ratio).toBeCloseTo(1, 2);
    });

    it('should be symmetric', () => {
      const ratio1 = calculateContrastRatio('#084683', '#ffffff');
      const ratio2 = calculateContrastRatio('#ffffff', '#084683');
      expect(ratio1).toBeCloseTo(ratio2, 2);
    });

    it('should handle CSS variable format', () => {
      const ratio = calculateContrastRatio('255 255 255', '8 70 131');
      expect(ratio).toBeCloseTo(9.48, 1);
    });
  });

  describe('contrast pass checks', () => {
    it('should pass normal text contrast for primary on white', () => {
      expect(passesNormalTextContrast('255 255 255', '8 70 131')).toBe(true);
    });

    it('should fail normal text contrast for low contrast combinations', () => {
      expect(passesNormalTextContrast('#cccccc', '#ffffff')).toBe(false);
    });

    it('should pass large text contrast for 3:1 ratio', () => {
      expect(passesLargeTextContrast('107 114 128', '255 255 255')).toBe(true);
    });

    it('should pass UI component contrast for borders', () => {
      expect(passesUIComponentContrast('107 114 128', '255 255 255')).toBe(true);
    });
  });

  describe('WCAG 2.1 AA Requirements', () => {
    it('should define correct contrast ratios', () => {
      expect(WCAG_AA_REQUIREMENTS.normalText).toBe(4.5);
      expect(WCAG_AA_REQUIREMENTS.largeText).toBe(3);
      expect(WCAG_AA_REQUIREMENTS.uiComponents).toBe(3);
    });
  });
});

describe('Design System Color Compliance', () => {
  describe('Light Mode Colors', () => {
    const validation = validateColorContrast('light');

    it('should have all color pairs defined', () => {
      expect(validation.results.length).toBeGreaterThan(0);
    });

    it.each(validation.results.map((r) => [r.pair.name, r]))(
      '%s should meet WCAG 2.1 AA requirements',
      (_name, result) => {
        expect(result.passed).toBe(true);
        expect(result.ratio).toBeGreaterThanOrEqual(result.required);
      }
    );

    it('should pass all contrast checks', () => {
      expect(validation.failed).toBe(0);
      expect(validation.passed).toBe(validation.results.length);
    });
  });

  describe('Dark Mode Colors', () => {
    const validation = validateColorContrast('dark');

    it('should have all color pairs defined', () => {
      expect(validation.results.length).toBeGreaterThan(0);
    });

    it.each(validation.results.map((r) => [r.pair.name, r]))(
      '%s should meet WCAG 2.1 AA requirements',
      (_name, result) => {
        expect(result.passed).toBe(true);
        expect(result.ratio).toBeGreaterThanOrEqual(result.required);
      }
    );

    it('should pass all contrast checks', () => {
      expect(validation.failed).toBe(0);
      expect(validation.passed).toBe(validation.results.length);
    });
  });

  describe('Color Token Consistency', () => {
    it('should have same tokens in light and dark modes', () => {
      const lightKeys = Object.keys(lightModeColors).sort();
      const darkKeys = Object.keys(darkModeColors).sort();
      expect(lightKeys).toEqual(darkKeys);
    });

    it('should have valid RGB format for all light mode colors', () => {
      Object.entries(lightModeColors).forEach(([_key, value]) => {
        expect(() => parseColor(value)).not.toThrow();
      });
    });

    it('should have valid RGB format for all dark mode colors', () => {
      Object.entries(darkModeColors).forEach(([_key, value]) => {
        expect(() => parseColor(value)).not.toThrow();
      });
    });
  });
});
