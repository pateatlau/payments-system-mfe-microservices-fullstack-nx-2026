/**
 * Payments MFE Rspack Configuration
 *
 * Module Federation v2 Remote - exposes payment components
 *
 * Exposes:
 * - ./PaymentsPage: PaymentsPage component
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
  'shared-auth-store': {
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
    path: path.resolve(__dirname, '../../dist/apps/payments-mfe'),
    // CRITICAL: uniqueName is required for Module Federation HMR
    uniqueName: 'paymentsMfe',
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
      // This is the ONLY CSS rule - no NxAppRspackPlugin CSS conflicts
      {
        test: /\.css$/,
        use: [
          ...(isDevelopment ? ['style-loader'] : []),
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                config: path.resolve(__dirname, 'postcss.config.js'),
              },
            },
          },
        ],
        type: 'javascript/auto',
      },
    ],
  },
  plugins: [
    new rspack.ProgressPlugin(),
    // Define environment variables for browser (replaces process.env at build time)
    new rspack.DefinePlugin({
      'process.env': JSON.stringify({
        NX_API_BASE_URL:
          process.env.NX_API_BASE_URL || 'http://localhost:3000/api',
        NODE_ENV: isProduction ? 'production' : 'development',
      }),
    }),
    // Copy public assets (favicon.ico, etc.) to output directory
    new rspack.CopyRspackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'public'),
          to: path.resolve(__dirname, '../../dist/apps/payments-mfe'),
          noErrorOnMissing: true,
        },
      ],
    }),
    // HTML generation - using HtmlRspackPlugin instead of NxAppRspackPlugin
    new rspack.HtmlRspackPlugin({
      template: path.resolve(__dirname, 'index.html'),
      inject: 'body',
      scriptLoading: 'defer',
    }),
    // Module Federation Plugin - Payments MFE acts as REMOTE exposing components
    new rspack.container.ModuleFederationPlugin({
      name: 'paymentsMfe',
      filename: 'remoteEntry.js',
      exposes: {
        './PaymentsPage': './src/components/PaymentsPage.tsx',
      },
      shared: sharedDependencies,
    }),
    // React Fast Refresh plugin
    ...(isDevelopment ? [new ReactRefreshPlugin()] : []),
  ],
  // Dev server configuration
  devServer: {
    port: 4202,
    host: 'localhost',
    hot: true,
    historyApiFallback: true,
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
