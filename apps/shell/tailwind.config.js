import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    // Shell app files
    resolve(__dirname, 'src/**/*.{js,jsx,ts,tsx,html}'),
    resolve(__dirname, 'index.html'),
    // Remote MFE source files (for Module Federation - CSS is compiled in shell)
    resolve(__dirname, '../auth-mfe/src/**/*.{js,jsx,ts,tsx}'),
    resolve(__dirname, '../payments-mfe/src/**/*.{js,jsx,ts,tsx}'),
    // All shared libraries
    resolve(__dirname, '../../libs/shared-header-ui/src/**/*.{js,jsx,ts,tsx}'),
    resolve(__dirname, '../../libs/shared-ui/src/**/*.{js,jsx,ts,tsx}'),
    resolve(__dirname, '../../libs/shared-auth-store/src/**/*.{js,jsx,ts,tsx}'),
    resolve(__dirname, '../../libs/shared-utils/src/**/*.{js,jsx,ts,tsx}'),
    resolve(__dirname, '../../libs/shared-types/src/**/*.{js,jsx,ts,tsx}'),
  ],
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

