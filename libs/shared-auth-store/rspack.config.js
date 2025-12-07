/**
 * Shared Auth Store Library Rspack Configuration
 *
 * Note: This library uses @nx/js:tsc for building (TypeScript compilation).
 * This Rspack config is a placeholder for future testing migration (Phase 5).
 * The library build itself continues to use TypeScript compiler.
 */

const rspack = require('@rspack/core');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  mode: isProduction ? 'production' : 'development',
  // Library builds are handled by @nx/js:tsc executor
  // This config is a placeholder for future testing setup
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true, // This library may have React components
                decorators: false,
                dynamicImport: true,
              },
              transform: {
                react: {
                  runtime: 'automatic',
                  development: !isProduction,
                },
              },
              target: 'es2022',
            },
            module: {
              type: 'es6',
            },
          },
        },
        type: 'javascript/auto',
      },
    ],
  },
  // Source maps for development
  devtool: isProduction ? 'source-map' : 'eval-source-map',
};
