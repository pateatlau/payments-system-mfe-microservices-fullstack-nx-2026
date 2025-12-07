/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';
import federation from '@originjs/vite-plugin-federation';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Shell Vite Configuration
 * 
 * Module Federation Host - consumes remote MFEs
 * 
 * IMPORTANT: @originjs/vite-plugin-federation workflow:
 * 1. Build remotes first: pnpm build:remotes
 * 2. Start remotes in preview: pnpm preview:auth-mfe & pnpm preview:payments-mfe
 * 3. Build shell: pnpm build:shell
 * 4. Start shell in preview: pnpm preview:shell
 * 
 * Or use: pnpm dev (builds all and runs in preview mode)
 * 
 * Remotes:
 * - authMfe: http://localhost:4201/assets/remoteEntry.js
 * - paymentsMfe: http://localhost:4202/assets/remoteEntry.js
 */
export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../node_modules/.vite/shell',
  server: {
    port: 4200,
    host: 'localhost',
  },
  preview: {
    port: 4200,
    host: 'localhost',
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
      name: 'shell',
      remotes: {
        authMfe: 'http://localhost:4201/assets/remoteEntry.js',
        paymentsMfe: 'http://localhost:4202/assets/remoteEntry.js',
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
    outDir: '../dist/shell',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  test: {
    name: 'shell',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      reportsDirectory: '../../coverage/apps/shell',
      provider: 'v8' as const,
    },
    resolve: {
      alias: {
        'authMfe/SignIn': path.resolve(__dirname, 'src/components/__mocks__/SignIn.tsx'),
        'authMfe/SignUp': path.resolve(__dirname, 'src/components/__mocks__/SignUp.tsx'),
        'paymentsMfe/PaymentsPage': path.resolve(__dirname, 'src/components/__mocks__/PaymentsPage.tsx'),
      },
    },
  },
}));
