import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import path from 'path';

export default defineConfig({
  root: __dirname,
  plugins: [react(), nxViteTsPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/apps/shell',
      provider: 'v8',
    },
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      'helloRemote/HelloRemote': path.resolve(
        __dirname,
        './src/components/__mocks__/HelloRemote.tsx'
      ),
    },
  },
});
