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
    // All shared libraries
    resolve(__dirname, '../../libs/shared-header-ui/src/**/*.{js,jsx,ts,tsx}'),
    resolve(__dirname, '../../libs/shared-ui/src/**/*.{js,jsx,ts,tsx}'),
    resolve(__dirname, '../../libs/shared-auth-store/src/**/*.{js,jsx,ts,tsx}'),
    resolve(__dirname, '../../libs/shared-utils/src/**/*.{js,jsx,ts,tsx}'),
    resolve(__dirname, '../../libs/shared-types/src/**/*.{js,jsx,ts,tsx}'),
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

