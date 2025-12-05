/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../node_modules/.vite/hello-remote',
  server: {
    port: 4201,
    host: 'localhost',
    cors: true,
  },
  preview: {
    port: 4201,
    host: 'localhost',
  },
  plugins: [
    react(),
    federation({
      name: 'helloRemote',
      filename: 'remoteEntry.js',
      exposes: {
        './HelloRemote': './src/components/HelloRemote.tsx',
      },
      shared: {
        react: {
          singleton: true,
          requiredVersion: '19.2.0',
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '19.2.0',
        },
      },
    }),
    nxViteTsPaths(),
    nxCopyAssetsPlugin(['*.md']),
  ],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  build: {
    outDir: '../dist/hello-remote',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
}));
