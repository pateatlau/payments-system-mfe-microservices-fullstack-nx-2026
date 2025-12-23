/**
 * Design Tokens - Colors
 *
 * Color tokens for the design system with dark mode support
 * Using Tailwind CSS v4 syntax
 *
 * Primary Color: #084683 (Light) / #1a74b8 (Dark)
 * - Professional financial services appearance
 * - Deep blue conveys trust and stability
 * - Excellent contrast with white text (WCAG AAA compliant)
 *
 * Dark Mode Strategy:
 * - Light mode uses darker primary shades (700-900) for better contrast on white
 * - Dark mode uses lighter primary shades (400-500) for better contrast on dark backgrounds
 * - Semantic tokens (background, foreground) swap light/dark values
 * - Status colors (success, danger, warning, info) use slightly lighter shades in dark mode
 */

export const colors = {
  // Brand colors
  primary: {
    light: {
      DEFAULT: '#084683', // Primary brand color - deep blue (700)
      50: '#e6f0f8',
      100: '#b3d1e8',
      200: '#80b2d8',
      300: '#4d93c8',
      400: '#1a74b8',
      500: '#0d5a9a',
      600: '#0a4a7a',
      700: '#084683', // Base primary color
      800: '#06325a',
      900: '#041e3a',
      950: '#02142a',
      hover: '#0a4a7a', // primary-600
      active: '#06325a', // primary-800
    },
    dark: {
      DEFAULT: '#1a74b8', // Lighter for dark backgrounds (400)
      50: '#e6f0f8',
      100: '#b3d1e8',
      200: '#80b2d8',
      300: '#4d93c8',
      400: '#1a74b8', // Base primary color for dark mode
      500: '#0d5a9a',
      600: '#0a4a7a',
      700: '#084683',
      800: '#06325a',
      900: '#041e3a',
      950: '#02142a',
      hover: '#4d93c8', // primary-300 (lighter hover)
      active: '#80b2d8', // primary-200 (lighter active)
    },
    // Legacy/default export for backwards compatibility
    DEFAULT: '#084683',
    50: '#e6f0f8',
    100: '#b3d1e8',
    200: '#80b2d8',
    300: '#4d93c8',
    400: '#1a74b8',
    500: '#0d5a9a',
    600: '#0a4a7a',
    700: '#084683',
    800: '#06325a',
    900: '#041e3a',
    950: '#02142a',
    hover: '#0a4a7a',
    active: '#06325a',
  },
  secondary: {
    light: {
      DEFAULT: '#6b7280', // gray-500
      hover: '#4b5563', // gray-600
      active: '#374151', // gray-700
    },
    dark: {
      DEFAULT: '#9ca3af', // gray-400 (lighter)
      hover: '#d1d5db', // gray-300 (lighter hover)
      active: '#e5e7eb', // gray-200 (lighter active)
    },
    // Legacy/default
    DEFAULT: '#6b7280',
    hover: '#4b5563',
    active: '#374151',
  },
  // Status colors
  success: {
    light: {
      DEFAULT: '#10b981', // green-500
      hover: '#059669', // green-600
      active: '#047857', // green-700
    },
    dark: {
      DEFAULT: '#34d399', // green-400 (lighter)
      hover: '#6ee7b7', // green-300 (lighter hover)
      active: '#a7f3d0', // green-200 (lighter active)
    },
    // Legacy/default
    DEFAULT: '#10b981',
    hover: '#059669',
    active: '#047857',
  },
  danger: {
    light: {
      DEFAULT: '#ef4444', // red-500
      hover: '#dc2626', // red-600
      active: '#b91c1c', // red-700
    },
    dark: {
      DEFAULT: '#f87171', // red-400 (lighter)
      hover: '#fca5a5', // red-300 (lighter hover)
      active: '#fecaca', // red-200 (lighter active)
    },
    // Legacy/default
    DEFAULT: '#ef4444',
    hover: '#dc2626',
    active: '#b91c1c',
  },
  warning: {
    light: {
      DEFAULT: '#f59e0b', // amber-500
      hover: '#d97706', // amber-600
      active: '#b45309', // amber-700
    },
    dark: {
      DEFAULT: '#fbbf24', // amber-400 (lighter)
      hover: '#fcd34d', // amber-300 (lighter hover)
      active: '#fde68a', // amber-200 (lighter active)
    },
    // Legacy/default
    DEFAULT: '#f59e0b',
    hover: '#d97706',
    active: '#b45309',
  },
  info: {
    light: {
      DEFAULT: '#06b6d4', // cyan-500
      hover: '#0891b2', // cyan-600
      active: '#0e7490', // cyan-700
    },
    dark: {
      DEFAULT: '#22d3ee', // cyan-400 (lighter)
      hover: '#67e8f9', // cyan-300 (lighter hover)
      active: '#a5f3fc', // cyan-200 (lighter active)
    },
    // Legacy/default
    DEFAULT: '#06b6d4',
    hover: '#0891b2',
    active: '#0e7490',
  },
  // Neutral colors (semantic tokens)
  background: {
    light: {
      DEFAULT: '#ffffff', // white
      muted: '#f9fafb', // gray-50
      subtle: '#f3f4f6', // gray-100
    },
    dark: {
      DEFAULT: '#111827', // gray-900 (dark background)
      muted: '#1f2937', // gray-800 (dark muted)
      subtle: '#374151', // gray-700 (dark subtle)
    },
    // Legacy/default
    DEFAULT: '#ffffff',
    muted: '#f9fafb',
    subtle: '#f3f4f6',
  },
  foreground: {
    light: {
      DEFAULT: '#111827', // gray-900 (dark text on light bg)
      muted: '#6b7280', // gray-500
      subtle: '#9ca3af', // gray-400
    },
    dark: {
      DEFAULT: '#f9fafb', // gray-50 (light text on dark bg)
      muted: '#9ca3af', // gray-400
      subtle: '#6b7280', // gray-500
    },
    // Legacy/default
    DEFAULT: '#111827',
    muted: '#6b7280',
    subtle: '#9ca3af',
  },
  border: {
    light: {
      DEFAULT: '#e5e7eb', // gray-200
      muted: '#f3f4f6', // gray-100
    },
    dark: {
      DEFAULT: '#374151', // gray-700 (visible on dark bg)
      muted: '#4b5563', // gray-600
    },
    // Legacy/default
    DEFAULT: '#e5e7eb',
    muted: '#f3f4f6',
  },
} as const;

export type ColorToken = keyof typeof colors;

/**
 * Helper function to get color value based on theme
 * @param colorPath - Dot-notation path to color (e.g., 'primary.DEFAULT', 'success.hover')
 * @param theme - 'light' or 'dark'
 * @returns Color hex value
 *
 * @example
 * getThemeColor('primary.DEFAULT', 'dark') // returns '#1a74b8'
 * getThemeColor('success.hover', 'light') // returns '#059669'
 */
export function getThemeColor(
  colorPath: string,
  theme: 'light' | 'dark' = 'light'
): string {
  const [category, variant] = colorPath.split('.');
  const colorCategory = colors[category as ColorToken];

  if (!colorCategory) {
    console.warn(`Color category "${category}" not found`);
    return '#000000';
  }

  // Check if category has light/dark variants
  if ('light' in colorCategory && 'dark' in colorCategory) {
    const themeColors = colorCategory[theme] as Record<string, string>;
    return (themeColors[variant || 'DEFAULT'] || themeColors.DEFAULT) as string;
  }

  // Fallback to direct access for legacy tokens
  if (typeof colorCategory === 'object') {
    return (
      (colorCategory as Record<string, string>)[variant || 'DEFAULT'] ||
      '#000000'
    );
  }

  return colorCategory as string;
}

/**
 * Helper to check if a color token has dark mode variants
 * @param category - Color category (e.g., 'primary', 'success')
 * @returns true if category has light/dark variants
 */
export function hasDarkModeVariant(category: ColorToken): boolean {
  const colorCategory = colors[category];
  return (
    typeof colorCategory === 'object' &&
    'light' in colorCategory &&
    'dark' in colorCategory
  );
}
