/**
 * Profile MFE Rspack Configuration
 *
 * Module Federation v2 Remote - exposes profile components
 *
 * Exposes:
 * - ./ProfilePage: Profile page component
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

// In production, NX_PUBLIC_PATH must be set to the MFE's Vercel URL (e.g.
// https://profile-mfe-bice.vercel.app/). Fail fast rather than silently falling
// back to 'auto', which would reproduce the double-slash chunk URL bug.
// CI builds (nx run-many --configuration=production) don't set NX_PUBLIC_PATH
// and don't serve assets cross-origin, so 'auto' is safe there.
if (isProduction && !process.env.NX_PUBLIC_PATH) {
  if (process.env.CI === 'true') {
    console.warn('[WARN] [profile-mfe] NX_PUBLIC_PATH not set in CI - falling back to auto');
  } else {
    throw new Error(
      '[profile-mfe] NX_PUBLIC_PATH is required in production.\n' +
        'Set it in Vercel project env vars, e.g.: https://profile-mfe-bice.vercel.app/'
    );
  }
}
const rawPublicPath = process.env.NX_PUBLIC_PATH;
const publicPath = isProduction && rawPublicPath
  ? rawPublicPath.endsWith('/')
    ? rawPublicPath
    : `${rawPublicPath}/`
  : 'auto';

/**
 * Shared dependencies configuration for Module Federation
 * CRITICAL: All MFEs must have matching shared dependency configurations
 * to ensure singleton instances across the federated modules
 */
const sharedDependencies = {
  react: {
    singleton: true,
    requiredVersion: '18.3.1',
    eager: true, // Must be eager for standalone app
  },
  'react-dom': {
    singleton: true,
    requiredVersion: '18.3.1',
    eager: true, // Must be eager for standalone app
  },
  '@tanstack/react-query': {
    singleton: true,
    eager: true, // Must be eager for standalone app
  },
  zustand: {
    singleton: true,
    eager: true, // Must be eager for standalone app (used by shared-auth-store)
  },
  'react-hook-form': {
    singleton: true,
    eager: true, // Must be eager for standalone app
  },
  // CRITICAL: Share the auth store to ensure same instance across MFEs
  'shared-auth-store': {
    singleton: true,
    requiredVersion: false,
    eager: true, // Must be eager for standalone app
  },
  // CRITICAL: Share the API client to ensure single token provider
  '@mfe/shared-api-client': {
    singleton: true,
    requiredVersion: false,
    eager: true, // Must be eager for standalone app
  },
  'shared-api-client': {
    singleton: true,
    requiredVersion: false,
    eager: true, // Must be eager for standalone app
  },
  '@mfe/shared-theme-store': {
    singleton: true,
    requiredVersion: false,
    eager: true, // Must be eager for standalone app
  },
  // Shared types for type consistency
  'shared-types': {
    singleton: true,
    requiredVersion: false,
    eager: true, // Must be eager for standalone app
  },
  '@mfe/shared-session-sync': {
    singleton: true,
    requiredVersion: false,
    eager: true, // Must be eager for standalone app
  },
  'shared-session-sync': {
    singleton: true,
    requiredVersion: false,
    eager: true, // Must be eager for standalone app
  },
  'shared-websocket': {
    singleton: true,
    requiredVersion: false,
    eager: true, // Must be eager for standalone app
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
    path: path.resolve(__dirname, '../../dist/apps/profile-mfe'),
    // CRITICAL: uniqueName is required for Module Federation HMR
    uniqueName: 'profileMfe',
    // In production, 'auto' can fail cross-origin (shell loads remoteEntry.js from a
    // different origin, making document.currentScript unreliable). Use NX_PUBLIC_PATH
    // (e.g. https://profile-mfe-bice.vercel.app/) set in the Vercel project env vars.
    publicPath,
    filename: isProduction ? '[name].[contenthash].js' : '[name].js',
    chunkFilename: isProduction
      ? '[name].[contenthash].chunk.js'
      : '[name].chunk.js',
    clean: true,
    // CRITICAL for Safari: Sets crossorigin="anonymous" on dynamically loaded scripts
    crossOriginLoading: 'anonymous',
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
      '@mfe/shared-utils': path.resolve(
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
      '@mfe/shared-theme-store': path.resolve(
        __dirname,
        '../../libs/shared-theme-store/src/index.ts'
      ),
      '@mfe/shared-session-sync': path.resolve(
        __dirname,
        '../../libs/shared-session-sync/src/index.ts'
      ),
      'shared-session-sync': path.resolve(
        __dirname,
        '../../libs/shared-session-sync/src/index.ts'
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
    // Define environment variables for browser (replaces process.env.* at build time)
    // IMPORTANT: Define each key individually with JSON.stringify for proper replacement
    // Using 'process.env': JSON.stringify({...}) creates a string, not an object!
    new rspack.DefinePlugin({
      // POC-3: API Gateway URL
      // Development & Production: Through nginx proxy (https://localhost/api)
      // Direct API Gateway access (http://localhost:3000/api) available via env var
      'process.env.NX_API_BASE_URL': JSON.stringify(
        process.env.NX_API_BASE_URL || 'https://localhost/api'
      ),
      // WebSocket URL (for real-time features)
      'process.env.NX_WS_URL': JSON.stringify(
        process.env.NX_WS_URL || 'ws://localhost:3000/ws'
      ),
      // GraphQL URL
      'process.env.NX_GRAPHQL_URL': JSON.stringify(
        process.env.NX_GRAPHQL_URL || 'http://localhost:3000/graphql'
      ),
      // Sentry (Frontend)
      'process.env.NX_SENTRY_DSN': JSON.stringify(
        process.env.NX_SENTRY_DSN || ''
      ),
      'process.env.NX_SENTRY_RELEASE': JSON.stringify(
        process.env.NX_SENTRY_RELEASE || ''
      ),
      'process.env.NX_APP_VERSION': JSON.stringify(
        process.env.NX_APP_VERSION || '0.0.1'
      ),
      'process.env.NODE_ENV': JSON.stringify(
        isProduction ? 'production' : 'development'
      ),
    }),
    // Copy public assets (health.json, favicon.ico, etc.) to output directory
    new rspack.CopyRspackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'public'),
          to: path.resolve(__dirname, '../../dist/apps/profile-mfe'),
          noErrorOnMissing: true,
        },
        {
          from: path.resolve(__dirname, 'src/assets'),
          to: path.resolve(__dirname, '../../dist/apps/profile-mfe/assets'),
          noErrorOnMissing: true,
        },
        {
          from: path.resolve(__dirname, 'src/favicon.ico'),
          to: path.resolve(__dirname, '../../dist/apps/profile-mfe'),
          noErrorOnMissing: true,
        },
      ],
    }),
    // HTML generation - using HtmlRspackPlugin instead of NxAppRspackPlugin
    new rspack.HtmlRspackPlugin({
      template: path.resolve(__dirname, 'src/index.html'),
      inject: 'body',
      scriptLoading: 'defer',
    }),
    // Module Federation Plugin - Profile MFE acts as REMOTE exposing components
    new rspack.container.ModuleFederationPlugin({
      name: 'profileMfe',
      filename: 'remoteEntry.js',
      exposes: {
        './ProfilePage': './src/components/ProfilePage.tsx',
      },
      shared: sharedDependencies,
    }),
    // React Fast Refresh plugin
    ...(isDevelopment ? [new ReactRefreshPlugin()] : []),
  ],
  // Dev server configuration
  devServer: {
    port: 4204,
    host: '0.0.0.0', // Bind to all interfaces for Docker nginx access
    hot: true, // HMR enabled - falls back to page refresh for changes that can't be hot-reloaded
    liveReload: false, // Disable live reload - prevents auto page refresh on HMR failure
    historyApiFallback: true,
    allowedHosts: 'all', // Allow nginx proxy requests
    // Serve static files from public directory (for health.json, etc.)
    static: [
      {
        directory: path.resolve(__dirname, 'public'),
        publicPath: '/',
      },
      {
        directory: path.resolve(__dirname, 'src/assets'),
        publicPath: '/assets',
      },
    ],
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers':
        'X-Requested-With, content-type, Authorization',
      // Cross-browser compatibility headers (Safari)
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    },
    client: {
      logging: 'warn',
      overlay: {
        errors: true,
        warnings: false,
      },
      reconnect: 5, // Limit reconnection attempts to prevent reload loops
      // HMR WebSocket configuration for HTTPS mode
      webSocketURL:
        process.env.NX_HTTPS_MODE === 'true'
          ? {
              protocol: 'wss',
              hostname: 'localhost',
              port: 443,
              pathname: '/hmr/profile',
            }
          : {
              protocol: 'ws',
              hostname: 'localhost',
              port: 4204,
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
  // Watch options - prevent unnecessary rebuilds from non-source files
  watchOptions: {
    ignored: [
      '**/node_modules/**',
      '**/.nx/**',
      '**/dist/**',
      '**/.git/**',
      '**/coverage/**',
      '**/*.tsbuildinfo',
      '**/tmp/**',
    ],
    aggregateTimeout: 300,
  },
};
