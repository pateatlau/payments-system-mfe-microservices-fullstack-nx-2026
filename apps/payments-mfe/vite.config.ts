import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'shared-utils': path.resolve(
        __dirname,
        '../../libs/shared-utils/src/index.ts'
      ),
      'shared-ui': path.resolve(__dirname, '../../libs/shared-ui/src/index.ts'),
      'shared-types': path.resolve(
        __dirname,
        '../../libs/shared-types/src/index.ts'
      ),
      'shared-auth-store': path.resolve(
        __dirname,
        '../../libs/shared-auth-store/src/index.ts'
      ),
      'shared-header-ui': path.resolve(
        __dirname,
        '../../libs/shared-header-ui/src/index.ts'
      ),
      '@mfe/shared-design-system': path.resolve(
        __dirname,
        '../../libs/shared-design-system/src/index.ts'
      ),
      '@mfe/shared-api-client': path.resolve(
        __dirname,
        '../../libs/shared-api-client/src/index.ts'
      ),
      '@mfe/shared-event-bus': path.resolve(
        __dirname,
        '../../libs/shared-event-bus/src/index.ts'
      ),
      'shared-websocket': path.resolve(
        __dirname,
        '../../libs/shared-websocket/src/index.ts'
      ),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['src/app/app.spec.tsx'],
    coverage: {
      provider: 'v8',
      reportsDirectory: '../../coverage/apps/payments-mfe',
    },
  },
});
