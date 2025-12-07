/**
 * Payments MFE Rspack Configuration
 *
 * Module Federation v2 Remote - exposes payments components
 *
 * Exposed components:
 * - ./PaymentsPage -> ./src/components/PaymentsPage.tsx
 *
 * PostCSS loader configured for Tailwind CSS v4
 */

const rspack = require('@rspack/core');
const path = require('path');
const { NxAppRspackPlugin } = require('@nx/rspack/app-plugin');
const ReactRefreshPlugin = require('@rspack/plugin-react-refresh');

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = !isProduction;

/**
 * Shared dependencies configuration for Module Federation
 * CRITICAL: Must match the shell's shared dependency configuration
 * to ensure singleton instances across federated modules
 */
const sharedDependencies = {
  react: {
    singleton: true,
    requiredVersion: '18.3.1',
    eager: false,
  },
  'react-dom': {
    singleton: true,
    requiredVersion: '18.3.1',
    eager: false,
  },
  '@tanstack/react-query': {
    singleton: true,
    eager: false,
  },
  zustand: {
    singleton: true,
    eager: false,
  },
  'react-hook-form': {
    singleton: true,
    eager: false,
  },
  // CRITICAL: Share the auth store to ensure same instance across MFEs
  // Without this, shell and payments-mfe have separate store instances
  // and state changes in one MFE don't trigger re-renders in others
  'shared-auth-store': {
    singleton: true,
    requiredVersion: false,
    eager: false,
  },
};

module.exports = {
  mode: isProduction ? 'production' : 'development',
  // Note: experiments.css defaults to false in Rspack v1.x
  // We don't set it explicitly to avoid conflicts with NxAppRspackPlugin
  entry: './src/main.tsx',
  // Suppress warnings from NxAppRspackPlugin's automatic CSS rules
  // NxAppRspackPlugin adds CSS rules that conflict with our custom CSS loader configuration
  ignoreWarnings: [
    /use type 'css' and `CssExtractRspackPlugin`/,
    /You can't use `experiments.css`/,
  ],
  output: {
    path: path.resolve(__dirname, '../../dist/apps/payments-mfe'),
    // CRITICAL: uniqueName is required for Module Federation HMR
    uniqueName: 'paymentsMfe',
    filename: isProduction ? '[name].[contenthash].js' : '[name].js',
    chunkFilename: isProduction
      ? '[name].[contenthash].chunk.js'
      : '[name].chunk.js',
    clean: true,
    // Public path for Module Federation - assets loaded from this origin
    publicPath: 'http://localhost:4202/',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  },
  module: {
    rules: [
      // React/TypeScript loader using builtin:swc-loader
      {
        test: /\.(tsx|ts|jsx|js)$/,
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
                  refresh: isDevelopment,
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
      // CSS/PostCSS loader for Tailwind CSS v4
      // NOTE: Loaders execute from RIGHT to LEFT (bottom to top in array)
      // NxAppRspackPlugin automatically adds CSS rules, but our rule should take precedence
      // Warnings about type 'css' and CssExtractRspackPlugin are expected and can be ignored
      {
        test: /\.css$/,
        use: [
          // style-loader injects CSS into DOM via <style> tags (dev mode only) - executes LAST
          ...(isDevelopment ? ['style-loader'] : []),
          // css-loader processes @import and url() in CSS - executes SECOND
          'css-loader',
          // postcss-loader processes PostCSS plugins (Tailwind, Autoprefixer) - executes FIRST
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                config: path.resolve(__dirname, 'postcss.config.js'),
              },
            },
          },
        ],
        type: 'javascript/auto', // Required when not using experiments.css
      },
    ],
  },
  plugins: [
    new rspack.ProgressPlugin(),
    new NxAppRspackPlugin({
      // NxAppRspackPlugin handles HTML automatically via project.json "index" option
    }),
    // Module Federation Plugin - Payments MFE acts as REMOTE exposing components
    new rspack.container.ModuleFederationPlugin({
      name: 'paymentsMfe',
      filename: 'remoteEntry.js',
      exposes: {
        // Expose payments page component for shell to consume
        './PaymentsPage': './src/components/PaymentsPage.tsx',
      },
      shared: sharedDependencies,
    }),
    // React Fast Refresh plugin - injects $RefreshReg$ runtime for HMR
    ...(isDevelopment ? [new ReactRefreshPlugin()] : []),
  ],
  // Dev server configuration
  devServer: {
    port: 4202,
    host: 'localhost',
    hot: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers':
        'X-Requested-With, content-type, Authorization',
    },
    // Suppress CSS-related warnings in browser console
    // These warnings are harmless - they indicate Nx's automatic CSS rules are being ignored
    // in favor of our custom CSS loader chain, which is working correctly
    client: {
      logging: 'error', // Only show errors, suppress warnings
      overlay: {
        errors: true,
        warnings: false, // Disable warning overlay
      },
    },
  },
  // Optimization settings
  optimization: {
    minimize: isProduction,
    splitChunks: false,
  },
  // Source maps for development
  devtool: isDevelopment ? 'eval-source-map' : 'source-map',
};
