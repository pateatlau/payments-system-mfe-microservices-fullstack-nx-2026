/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';
import { federation } from '@module-federation/vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

/**
 * Shell Vite Configuration
 * 
 * Module Federation v2 Host - consumes remote MFEs
 * 
 * Remotes:
 * - authMfe: http://localhost:4201/remoteEntry.js
 * - paymentsMfe: http://localhost:4202/remoteEntry.js
 * 
 * Testing Strategy:
 * - Page components and App use dependency injection pattern for testability
 * - Tests inject mock components via props instead of using Module Federation
 * - Remote components are only imported in main.tsx (not imported during tests)
 */

export default defineConfig(({ mode }) => {
  // Check if running in test mode
  const isTest = mode === 'test' || process.env.NODE_ENV === 'test' || !!process.env.VITEST;
  
  return {
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
      // Only include federation plugin when not testing
      ...(!isTest ? [federation({
        name: 'shell',
        remotes: {
          authMfe: {
            type: 'module',
            name: 'authMfe',
            entry: 'http://localhost:4201/remoteEntry.js',
          },
          paymentsMfe: {
            type: 'module',
            name: 'paymentsMfe',
            entry: 'http://localhost:4202/remoteEntry.js',
          },
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
          // CRITICAL: Share the auth store to ensure same instance across MFEs
          // Without this, shell and auth-mfe have separate store instances
          // and state changes in auth-mfe don't trigger re-renders in shell
          'shared-auth-store': {
            singleton: true,
            requiredVersion: false,
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
      outDir: '../../dist/apps/shell',
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
    },
  };
});
