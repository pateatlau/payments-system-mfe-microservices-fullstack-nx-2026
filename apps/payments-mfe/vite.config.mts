/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';
import federation from '@originjs/vite-plugin-federation';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

/**
 * Payments MFE Vite Configuration
 * 
 * Module Federation Remote - exposes payments components
 * 
 * IMPORTANT: @originjs/vite-plugin-federation requires:
 * 1. Build the remote first: pnpm build:payments-mfe
 * 2. Run in preview mode: pnpm preview:payments-mfe
 * 
 * Exposed components:
 * - ./PaymentsPage -> ./src/components/PaymentsPage.tsx
 */
export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/payments-mfe',
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
    federation({
      name: 'paymentsMfe',
      filename: 'remoteEntry.js',
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
    }),
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
