/**
 * Color Contrast Testing Utilities
 *
 * Provides helper functions for automated color contrast testing to ensure
 * WCAG 2.1 AA compliance. These utilities can be used in unit tests and CI.
 *
 * @module @mfe/shared-test-utils
 */

/**
 * WCAG 2.1 AA contrast requirements
 */
export const WCAG_AA_REQUIREMENTS = {
  /** Minimum contrast for normal text (< 18pt or < 14pt bold): 4.5:1 */
  normalText: 4.5,
  /** Minimum contrast for large text (>= 18pt or >= 14pt bold): 3:1 */
  largeText: 3,
  /** Minimum contrast for UI components and graphical objects: 3:1 */
  uiComponents: 3,
} as const;

/**
 * Parses a CSS RGB value string "R G B" to RGB components
 */
export function parseRgbString(rgb: string): { r: number; g: number; b: number } {
  const parts = rgb.trim().split(/\s+/).map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid RGB string format: "${rgb}". Expected "R G B" format.`);
  }
  return { r: parts[0], g: parts[1], b: parts[2] };
}

/**
 * Converts RGB components to hex color string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number): string => Math.round(n).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Parses various color formats to RGB components
 * Supports: hex (#RGB, #RRGGBB), rgb(r, g, b), and "R G B" strings
 */
export function parseColor(color: string): { r: number; g: number; b: number } {
  color = color.trim();

  // Hex format
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    // Validate hex characters
    if (!/^[0-9a-fA-F]+$/.test(hex)) {
      throw new Error(`Invalid hex color: ${color}`);
    }
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
      };
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
      };
    }
    throw new Error(`Invalid hex color: ${color}`);
  }

  // rgb() format
  if (color.startsWith('rgb(') && color.endsWith(')')) {
    const parts = color.slice(4, -1).split(',').map((s) => parseInt(s.trim(), 10));
    if (parts.length !== 3 || parts.some(isNaN)) {
      throw new Error(`Invalid rgb() color: ${color}`);
    }
    return { r: parts[0], g: parts[1], b: parts[2] };
  }

  // "R G B" string format (CSS variable format)
  return parseRgbString(color);
}

/**
 * Calculates relative luminance according to WCAG 2.1
 * @see https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export function calculateLuminance(r: number, g: number, b: number): number {
  const toLinear = (c: number): number => {
    const sRGB = c / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  };

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Calculates contrast ratio between two colors
 * @param foreground - Foreground color in any supported format
 * @param background - Background color in any supported format
 * @returns Contrast ratio (e.g., 4.5 for 4.5:1)
 */
export function calculateContrastRatio(foreground: string, background: string): number {
  const fg = parseColor(foreground);
  const bg = parseColor(background);

  const l1 = calculateLuminance(fg.r, fg.g, fg.b);
  const l2 = calculateLuminance(bg.r, bg.g, bg.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Checks if a color combination passes WCAG 2.1 AA for normal text
 */
export function passesNormalTextContrast(foreground: string, background: string): boolean {
  return calculateContrastRatio(foreground, background) >= WCAG_AA_REQUIREMENTS.normalText;
}

/**
 * Checks if a color combination passes WCAG 2.1 AA for large text
 */
export function passesLargeTextContrast(foreground: string, background: string): boolean {
  return calculateContrastRatio(foreground, background) >= WCAG_AA_REQUIREMENTS.largeText;
}

/**
 * Checks if a color combination passes WCAG 2.1 AA for UI components
 */
export function passesUIComponentContrast(foreground: string, background: string): boolean {
  return calculateContrastRatio(foreground, background) >= WCAG_AA_REQUIREMENTS.uiComponents;
}

/**
 * Design system color tokens for light mode
 */
export const lightModeColors = {
  background: '255 255 255',
  foreground: '17 24 39',
  muted: '249 250 251',
  'muted-foreground': '75 85 99',
  card: '255 255 255',
  'card-foreground': '17 24 39',
  popover: '255 255 255',
  'popover-foreground': '17 24 39',
  primary: '8 70 131',
  'primary-foreground': '255 255 255',
  secondary: '243 244 246',
  'secondary-foreground': '17 24 39',
  accent: '243 244 246',
  'accent-foreground': '17 24 39',
  destructive: '185 28 28',
  'destructive-foreground': '255 255 255',
  border: '107 114 128',
  input: '107 114 128',
  ring: '8 70 131',
} as const;

/**
 * Design system color tokens for dark mode
 */
export const darkModeColors = {
  background: '17 24 39',
  foreground: '249 250 251',
  muted: '31 41 55',
  'muted-foreground': '156 163 175',
  card: '31 41 55',
  'card-foreground': '249 250 251',
  popover: '31 41 55',
  'popover-foreground': '249 250 251',
  primary: '26 116 184',
  'primary-foreground': '255 255 255',
  secondary: '55 65 81',
  'secondary-foreground': '249 250 251',
  accent: '55 65 81',
  'accent-foreground': '249 250 251',
  destructive: '220 38 38',
  'destructive-foreground': '255 255 255',
  border: '156 163 175',
  input: '156 163 175',
  ring: '26 116 184',
} as const;

/**
 * Color pair definition for testing
 */
export interface ColorPair {
  name: string;
  foreground: string;
  background: string;
  type: 'text' | 'largeText' | 'ui';
}

/**
 * All required color pairs that must pass WCAG 2.1 AA
 */
export function getColorPairsToTest(mode: 'light' | 'dark'): ColorPair[] {
  const colors = mode === 'light' ? lightModeColors : darkModeColors;

  return [
    // Text colors
    { name: 'Main text on background', foreground: colors.foreground, background: colors.background, type: 'text' },
    { name: 'Muted text on background', foreground: colors['muted-foreground'], background: colors.background, type: 'text' },
    { name: 'Muted text on muted background', foreground: colors['muted-foreground'], background: colors.muted, type: 'text' },
    { name: 'Card text on card', foreground: colors['card-foreground'], background: colors.card, type: 'text' },
    { name: 'Popover text on popover', foreground: colors['popover-foreground'], background: colors.popover, type: 'text' },
    { name: 'Primary button text', foreground: colors['primary-foreground'], background: colors.primary, type: 'text' },
    { name: 'Secondary button text', foreground: colors['secondary-foreground'], background: colors.secondary, type: 'text' },
    { name: 'Accent text', foreground: colors['accent-foreground'], background: colors.accent, type: 'text' },
    { name: 'Destructive button text', foreground: colors['destructive-foreground'], background: colors.destructive, type: 'text' },

    // UI component colors
    { name: 'Border on background', foreground: colors.border, background: colors.background, type: 'ui' },
    { name: 'Input border on background', foreground: colors.input, background: colors.background, type: 'ui' },
    { name: 'Focus ring on background', foreground: colors.ring, background: colors.background, type: 'ui' },
    { name: 'Primary button on background', foreground: colors.primary, background: colors.background, type: 'ui' },
    { name: 'Destructive button on background', foreground: colors.destructive, background: colors.background, type: 'ui' },
  ];
}

/**
 * Validates all color pairs for a mode and returns results
 */
export function validateColorContrast(mode: 'light' | 'dark'): {
  passed: number;
  failed: number;
  results: Array<{ pair: ColorPair; ratio: number; required: number; passed: boolean }>;
} {
  const pairs = getColorPairsToTest(mode);
  const results = pairs.map((pair) => {
    const ratio = calculateContrastRatio(pair.foreground, pair.background);
    const required = pair.type === 'text'
      ? WCAG_AA_REQUIREMENTS.normalText
      : pair.type === 'largeText'
        ? WCAG_AA_REQUIREMENTS.largeText
        : WCAG_AA_REQUIREMENTS.uiComponents;
    return { pair, ratio, required, passed: ratio >= required };
  });

  return {
    passed: results.filter((r) => r.passed).length,
    failed: results.filter((r) => !r.passed).length,
    results,
  };
}
