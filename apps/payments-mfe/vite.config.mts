/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';
import { federation } from '@module-federation/vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

/**
 * Payments MFE Vite Configuration
 * 
 * Module Federation v2 Remote - exposes payments components
 * 
 * Exposed components:
 * - ./PaymentsPage -> ./src/components/PaymentsPage.tsx
 */

// Check if running in test mode
const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST;

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/payments-mfe',
  // Set base URL for assets - required for Module Federation to load assets from correct origin
  base: 'http://localhost:4202/',
  server: {
    port: 4202,
    host: 'localhost',
    cors: true,
  },
  preview: {
    port: 4202,
    host: 'localhost',
    cors: true,
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss(),
        autoprefixer(),
      ],
    },
  },
  plugins: [
    react(),
    // Only include federation plugin when not testing
    ...(!isTest ? [federation({
      name: 'paymentsMfe',
      filename: 'remoteEntry.js',
      // Set the public path so assets are loaded from the correct origin
      getPublicPath: 'return "http://localhost:4202/"',
      exposes: {
        './PaymentsPage': './src/components/PaymentsPage.tsx',
      },
      shared: {
        react: {
          singleton: true,
          requiredVersion: '18.3.1',
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '18.3.1',
        },
        '@tanstack/react-query': {
          singleton: true,
        },
        zustand: {
          singleton: true,
        },
        'react-hook-form': {
          singleton: true,
        },
      },
    })] : []),
    nxViteTsPaths(),
    nxCopyAssetsPlugin(['*.md']),
  ],
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
    outDir: '../../dist/apps/payments-mfe',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  test: {
    name: 'payments-mfe',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      reportsDirectory: '../../coverage/apps/payments-mfe',
      provider: 'v8' as const,
    },
  },
}));
