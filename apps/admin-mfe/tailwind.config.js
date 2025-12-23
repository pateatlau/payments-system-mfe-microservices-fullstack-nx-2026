/**
 * Tailwind CSS v4 Configuration
 * Admin MFE
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    './src/**/*.{html,tsx,ts,jsx,js}',
    // Scan shared libraries for classnames
    '../../libs/**/*.{html,tsx,ts,jsx,js}',
  ],
  theme: {
    extend: {
      colors: {
        // Semantic token colors mapped to CSS variables
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        'muted-foreground': 'rgb(var(--muted-foreground) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        'card-foreground': 'rgb(var(--card-foreground) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        input: 'rgb(var(--input) / <alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',
        primary: 'rgb(var(--primary) / <alpha-value>)',
        'primary-foreground': 'rgb(var(--primary-foreground) / <alpha-value>)',
        secondary: 'rgb(var(--secondary) / <alpha-value>)',
        'secondary-foreground':
          'rgb(var(--secondary-foreground) / <alpha-value>)',
        destructive: 'rgb(var(--destructive) / <alpha-value>)',
        'destructive-foreground':
          'rgb(var(--destructive-foreground) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-foreground': 'rgb(var(--accent-foreground) / <alpha-value>)',
        popover: 'rgb(var(--popover) / <alpha-value>)',
        'popover-foreground': 'rgb(var(--popover-foreground) / <alpha-value>)',
        primary: {
          DEFAULT: '#084683',
          50: '#e6f0f8',
          100: '#b3d1e8',
          200: '#80b2d8',
          300: '#4d93c8',
          400: '#1a74b8',
          500: '#0d5a9a',
          600: '#0a4a7a',
          700: '#084683', // Base primary brand color
          800: '#06325a',
          900: '#041e3a',
          950: '#02142a',
        },
      },
    },
  },
  plugins: [],
};
