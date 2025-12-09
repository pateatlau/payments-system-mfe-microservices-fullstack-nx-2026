/**
 * Design Tokens - Colors
 *
 * Color tokens for the design system
 * Using Tailwind CSS v4 syntax
 *
 * Primary Color: #084683
 * - Professional financial services appearance
 * - Deep blue conveys trust and stability
 * - Excellent contrast with white text (WCAG AAA compliant)
 */

export const colors = {
  // Brand colors
  primary: {
    DEFAULT: '#084683', // Primary brand color - deep blue
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
  secondary: {
    DEFAULT: '#6b7280', // gray-500
    hover: '#4b5563', // gray-600
    active: '#374151', // gray-700
  },
  // Status colors
  success: {
    DEFAULT: '#10b981', // green-500
    hover: '#059669', // green-600
    active: '#047857', // green-700
  },
  danger: {
    DEFAULT: '#ef4444', // red-500
    hover: '#dc2626', // red-600
    active: '#b91c1c', // red-700
  },
  warning: {
    DEFAULT: '#f59e0b', // amber-500
    hover: '#d97706', // amber-600
    active: '#b45309', // amber-700
  },
  info: {
    DEFAULT: '#06b6d4', // cyan-500
    hover: '#0891b2', // cyan-600
    active: '#0e7490', // cyan-700
  },
  // Neutral colors
  background: {
    DEFAULT: '#ffffff',
    muted: '#f9fafb', // gray-50
    subtle: '#f3f4f6', // gray-100
  },
  foreground: {
    DEFAULT: '#111827', // gray-900
    muted: '#6b7280', // gray-500
    subtle: '#9ca3af', // gray-400
  },
  border: {
    DEFAULT: '#e5e7eb', // gray-200
    muted: '#f3f4f6', // gray-100
  },
} as const;

export type ColorToken = keyof typeof colors;
