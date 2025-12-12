/**
 * Shared UI Library Rspack Configuration
 *
 * Library mode build for React components.
 * External dependencies (react, react-dom) are not bundled.
 */

const rspack = require('@rspack/core');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = !isProduction;

module.exports = {
  mode: isProduction ? 'production' : 'development',
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, '../../dist/libs/shared-ui'),
    filename: 'index.js',
    library: {
      type: 'module', // ES modules
    },
    clean: true,
  },
  externals: {
    // External dependencies that should not be bundled
    react: 'react',
    'react-dom': 'react-dom',
    'react/jsx-runtime': 'react/jsx-runtime',
  },
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
                tsx: true,
                decorators: false,
                dynamicImport: true,
              },
              transform: {
                react: {
                  runtime: 'automatic',
                  development: isDevelopment,
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
      // CSS module support (for shared-ui.module.css)
      {
        test: /\.css$/,
        use: [
          {
            loader: 'builtin:lightningcss-loader',
            options: {
              targets: 'defaults',
            },
          },
        ],
        type: 'asset/resource',
      },
    ],
  },
  // Source maps for development
  devtool: isProduction ? 'source-map' : 'eval-source-map',
  experiments: {
    outputModule: true, // Enable ES module output
  },
};
