/**
 * Shell Rspack Configuration
 *
 * Module Federation v2 Host - consumes remote MFEs
 *
 * Remotes:
 * - authMfe: http://localhost:4201/remoteEntry.js
 * - paymentsMfe: http://localhost:4202/remoteEntry.js
 * - adminMfe: http://localhost:4203/remoteEntry.js
 * - profileMfe: http://localhost:4204/remoteEntry.js
 *
 * PostCSS loader configured for Tailwind CSS v4
 *
 * NOTE: We use HtmlRspackPlugin instead of NxAppRspackPlugin to avoid
 * NxAppRspackPlugin's automatic CSS rules that conflict with our custom
 * Tailwind CSS v4 loader chain.
 */

const rspack = require('@rspack/core');
const path = require('path');
const ReactRefreshPlugin = require('@rspack/plugin-react-refresh');

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = !isProduction;

/**
 * Shared dependencies configuration for Module Federation
 * CRITICAL: All MFEs must have matching shared dependency configurations
 * to ensure singleton instances across the federated modules
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
  // Without this, shell and remote MFEs have separate store instances
  // and state changes in one MFE don't trigger re-renders in others
  'shared-auth-store': {
    singleton: true,
    requiredVersion: false,
    eager: false,
  },
  '@mfe/shared-api-client': {
    singleton: true,
    requiredVersion: false,
    eager: false,
  },
  'shared-api-client': {
    singleton: true,
    requiredVersion: false,
    eager: false,
  },
  '@mfe/shared-design-system': {
    singleton: true,
    requiredVersion: false,
    eager: false,
  },
  'shared-types': {
    singleton: true,
    requiredVersion: false,
    eager: false,
  },
  'shared-websocket': {
    singleton: true,
    requiredVersion: false,
    eager: false,
  },
};

module.exports = {
  // Context is the base directory for resolving entry points and loaders
  context: __dirname,
  mode: isProduction ? 'production' : 'development',
  // Disable Rspack's built-in CSS handling - we use our own loader chain
  experiments: {
    css: false,
  },
  entry: './src/main.tsx',
  output: {
    path: path.resolve(__dirname, '../../dist/apps/shell'),
    // CRITICAL: uniqueName is required for Module Federation HMR
    uniqueName: 'shell',
    publicPath: 'auto',
    filename: isProduction ? '[name].[contenthash].js' : '[name].js',
    chunkFilename: isProduction
      ? '[name].[contenthash].chunk.js'
      : '[name].chunk.js',
    clean: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    // Aliases for shared libraries - required since we removed NxAppRspackPlugin
    alias: {
      'shared-auth-store': path.resolve(
        __dirname,
        '../../libs/shared-auth-store/src/index.ts'
      ),
      'shared-header-ui': path.resolve(
        __dirname,
        '../../libs/shared-header-ui/src/index.ts'
      ),
      'shared-ui': path.resolve(__dirname, '../../libs/shared-ui/src/index.ts'),
      'shared-utils': path.resolve(
        __dirname,
        '../../libs/shared-utils/src/index.ts'
      ),
      'shared-types': path.resolve(
        __dirname,
        '../../libs/shared-types/src/index.ts'
      ),
      '@mfe/shared-api-client': path.resolve(
        __dirname,
        '../../libs/shared-api-client/src/index.ts'
      ),
      '@mfe/shared-event-bus': path.resolve(
        __dirname,
        '../../libs/shared-event-bus/src/index.ts'
      ),
      '@mfe/shared-design-system': path.resolve(
        __dirname,
        '../../libs/shared-design-system/src/index.ts'
      ),
      'shared-websocket': path.resolve(
        __dirname,
        '../../libs/shared-websocket/src/index.ts'
      ),
      '@mfe-poc/shared-observability': path.resolve(
        __dirname,
        '../../libs/shared-observability/src/index.ts'
      ),
    },
  },
  module: {
    rules: [
      // React/TypeScript loader using builtin:swc-loader
      {
        test: /\.(tsx|ts|jsx|js)$/,
        exclude: /node_modules/,
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
      // This is the ONLY CSS rule - no NxAppRspackPlugin CSS conflicts
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
        type: 'javascript/auto', // Required when experiments.css is false
      },
    ],
  },
  plugins: [
    new rspack.ProgressPlugin(),
    // Define environment variables for browser (replaces process.env at build time)
    new rspack.DefinePlugin({
      'process.env': JSON.stringify({
        // POC-3: API Gateway URL
        // Development & Production: Through nginx proxy (https://localhost/api)
        // Direct API Gateway access (http://localhost:3000/api) available via env var
        NX_API_BASE_URL: process.env.NX_API_BASE_URL || 'https://localhost/api',
        // WebSocket URL: Through nginx proxy (wss://localhost/ws)
        // Direct API Gateway access (ws://localhost:3000/ws) available via env var
        NX_WS_URL: process.env.NX_WS_URL || 'wss://localhost/ws',
        NODE_ENV: isProduction ? 'production' : 'development',
      }),
    }),
    // Copy public assets (favicon.ico, etc.) to output directory
    new rspack.CopyRspackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'public'),
          to: path.resolve(__dirname, '../../dist/apps/shell'),
          noErrorOnMissing: true,
        },
      ],
    }),
    // HTML generation - using HtmlRspackPlugin instead of NxAppRspackPlugin
    // to avoid NxAppRspackPlugin's automatic CSS rules
    new rspack.HtmlRspackPlugin({
      template: path.resolve(__dirname, 'index.html'),
      inject: 'body',
      scriptLoading: 'defer',
    }),
    // Module Federation Plugin - Shell acts as HOST consuming remote MFEs
    new rspack.container.ModuleFederationPlugin({
      name: 'shell',
      remotes: {
        // Remote MFE URLs - format: 'remoteName@http://host:port/remoteEntry.js'
        authMfe: 'authMfe@http://localhost:4201/remoteEntry.js',
        paymentsMfe: 'paymentsMfe@http://localhost:4202/remoteEntry.js',
        adminMfe: 'adminMfe@http://localhost:4203/remoteEntry.js',
        profileMfe: 'profileMfe@http://localhost:4204/remoteEntry.js',
      },
      shared: sharedDependencies,
    }),
    // React Fast Refresh plugin - injects $RefreshReg$ runtime for HMR
    ...(isDevelopment
      ? [
          new ReactRefreshPlugin({
            overlay: false, // Disable overlay to avoid conflicts with devServer overlay
          }),
        ]
      : []),
  ],
  // Dev server configuration
  devServer: {
    port: 4200,
    host: '0.0.0.0', // Bind to all interfaces for Docker nginx access
    hot: true,
    historyApiFallback: true, // Required for SPA routing
    allowedHosts: 'all', // Allow nginx proxy requests
    // Serve static files from public directory
    static: {
      directory: path.resolve(__dirname, 'public'),
      publicPath: '/',
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers':
        'X-Requested-With, content-type, Authorization',
    },
    client: {
      logging: 'warn',
      overlay: {
        errors: true,
        warnings: false,
      },
      // HMR WebSocket configuration:
      // - HTTP mode (localhost:4200): ws://localhost:4200/ws (direct to dev server)
      // - HTTPS mode (localhost via nginx): wss://localhost/hmr/shell (nginx proxies to dev server)
      webSocketURL:
        process.env.NX_HTTPS_MODE === 'true'
          ? {
              protocol: 'wss',
              hostname: 'localhost',
              port: 443,
              pathname: '/hmr/shell',
            }
          : {
              protocol: 'ws',
              hostname: 'localhost',
              port: 4200,
              pathname: '/ws',
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
