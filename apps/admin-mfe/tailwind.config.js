/**
 * Tailwind CSS v4 Configuration
 * Admin MFE
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  content: ['./src/**/*.{html,tsx,ts,jsx,js}'],
  theme: {
    extend: {
      colors: {
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
