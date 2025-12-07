/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';
import federation from '@originjs/vite-plugin-federation';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

/**
 * Auth MFE Vite Configuration
 * 
 * Module Federation Remote - exposes authentication components
 * 
 * IMPORTANT: @originjs/vite-plugin-federation requires:
 * 1. Build the remote first: pnpm build:auth-mfe
 * 2. Run in preview mode: pnpm preview:auth-mfe
 * 
 * Exposed components:
 * - ./SignIn -> ./src/components/SignIn.tsx
 * - ./SignUp -> ./src/components/SignUp.tsx
 */
export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/auth-mfe',
  server: {
    port: 4201,
    host: 'localhost',
    cors: true,
  },
  preview: {
    port: 4201,
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
      name: 'authMfe',
      filename: 'remoteEntry.js',
      exposes: {
        './SignIn': './src/components/SignIn.tsx',
        './SignUp': './src/components/SignUp.tsx',
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
    outDir: '../../dist/apps/auth-mfe',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  test: {
    name: 'auth-mfe',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      reportsDirectory: '../../coverage/apps/auth-mfe',
      provider: 'v8' as const,
    },
  },
}));
