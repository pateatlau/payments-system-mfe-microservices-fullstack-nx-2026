/**
 * Shell Rspack Configuration
 *
 * Module Federation v2 Host - consumes remote MFEs
 *
 * Remotes (to be configured in Phase 3):
 * - authMfe: http://localhost:4201/remoteEntry.js
 * - paymentsMfe: http://localhost:4202/remoteEntry.js
 *
 * Note: Module Federation plugin will be added in Phase 3
 * Note: PostCSS loader for Tailwind CSS will be added in Phase 4
 */

const rspack = require('@rspack/core');
const path = require('path');
const { NxAppRspackPlugin } = require('@nx/rspack/app-plugin');
const ReactRefreshPlugin = require('@rspack/plugin-react-refresh');

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = !isProduction;

module.exports = {
  mode: isProduction ? 'production' : 'development',
  entry: './src/main.tsx',
  output: {
    path: path.resolve(__dirname, '../../dist/apps/shell'),
    // CRITICAL: uniqueName is required for Module Federation HMR
    uniqueName: 'shell',
    filename: isProduction ? '[name].[contenthash].js' : '[name].js',
    chunkFilename: isProduction
      ? '[name].[contenthash].chunk.js'
      : '[name].chunk.js',
    clean: true, // Equivalent to emptyOutDir: true in Vite
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    // Temporarily alias Module Federation remotes to empty modules for basic build test
    // These will be configured properly in Phase 3
    alias: {
      'authMfe/SignIn': path.resolve(__dirname, 'src/remotes/__stub__.tsx'),
      'authMfe/SignUp': path.resolve(__dirname, 'src/remotes/__stub__.tsx'),
      'paymentsMfe/PaymentsPage': path.resolve(
        __dirname,
        'src/remotes/__stub__.tsx'
      ),
    },
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
                  refresh: isDevelopment, // Enable Fast Refresh (HMR)
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
      // CSS/PostCSS loader (will be configured in Phase 4)
      // Temporarily disabled - CSS import commented out in main.tsx
      // Placeholder for Phase 4: PostCSS loader configuration for Tailwind CSS
    ],
  },
  plugins: [
    new rspack.ProgressPlugin(),
    new NxAppRspackPlugin({
      // NxAppRspackPlugin handles HTML automatically via project.json "index" option
    }),
    // React Fast Refresh plugin - injects $RefreshReg$ runtime for HMR
    ...(isDevelopment ? [new ReactRefreshPlugin()] : []),
    // Module Federation plugin will be added in Phase 3
    // Placeholder: new rspack.container.ModuleFederationPlugin({ ... })
  ],
  // Dev server configuration
  devServer: {
    port: 4200,
    host: 'localhost',
    hot: true, // Enable HMR
    // CORS headers for Module Federation (will be needed in Phase 3)
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  // Optimization settings
  optimization: {
    minimize: isProduction,
    // Equivalent to cssCodeSplit: false in Vite
    splitChunks: false,
  },
  // Source maps for development
  devtool: isDevelopment ? 'eval-source-map' : 'source-map',
};
