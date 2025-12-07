/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';
import { federation } from '@module-federation/vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import alias from '@rollup/plugin-alias';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock component paths for testing
const mockSignIn = path.resolve(__dirname, 'src/components/__mocks__/SignIn.tsx');
const mockSignUp = path.resolve(__dirname, 'src/components/__mocks__/SignUp.tsx');
const mockPaymentsPage = path.resolve(__dirname, 'src/components/__mocks__/PaymentsPage.tsx');

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
 * - Page components use dependency injection pattern for testability
 * - Tests inject mock components via props instead of using Module Federation
 * - This avoids complex mocking of dynamic imports
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
    // Resolve aliases for Module Federation imports
    // Always set up - federation plugin will handle them in production
    resolve: {
      alias: {
        'authMfe/SignIn': mockSignIn,
        'authMfe/SignUp': mockSignUp,
        'paymentsMfe/PaymentsPage': mockPaymentsPage,
      },
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
      // Alias plugin for Module Federation imports
      // This runs before federation plugin and handles test mocking
      alias({
        entries: [
          { find: 'authMfe/SignIn', replacement: mockSignIn },
          { find: 'authMfe/SignUp', replacement: mockSignUp },
          { find: 'paymentsMfe/PaymentsPage', replacement: mockPaymentsPage },
        ],
      }),
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
