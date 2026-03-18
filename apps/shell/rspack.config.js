/**
 * Shell Rspack Configuration
 *
 * Module Federation v2 Host - consumes remote MFEs
 *
 * Remotes (HTTP mode - direct access):
 * - authMfe: http://localhost:4201/remoteEntry.js
 * - paymentsMfe: http://localhost:4202/remoteEntry.js
 *
 * Remotes (HTTPS mode - via nginx proxy for Safari compatibility):
 * - authMfe: https://localhost/mfe/auth/remoteEntry.js
 * - paymentsMfe: https://localhost/mfe/payments/remoteEntry.js
 *
 * Production Mode:
 * - All remotes MUST use HTTPS URLs
 * - URLs validated against allowlist at build time
 * - Configure NX_MFE_BASE_URL for custom CDN/server URLs
 *
 * PostCSS loader configured for Tailwind CSS v4
 *
 * NOTE: We use HtmlRspackPlugin instead of NxAppRspackPlugin to avoid
 * NxAppRspackPlugin's automatic CSS rules that conflict with our custom
 * Tailwind CSS v4 loader chain.
 *
 * @security Module Federation Security (Phase 6)
 * - SRI hashes generated post-build (scripts/security/generate-sri-hashes.js)
 * - URL validation enforced at build time
 * - HTTPS required in production mode
 */

const rspack = require('@rspack/core');
const path = require('path');
const ReactRefreshPlugin = require('@rspack/plugin-react-refresh');
const CspNoncePlugin = require('./plugins/csp-nonce-plugin');

// Check if running in HTTPS mode (via nginx proxy)
const isHttpsMode = process.env.NX_HTTPS_MODE === 'true';

// Debug: Log environment variables during config evaluation (gated by feature flag)
if (process.env.NX_ENABLE_CONFIG_DEBUG === 'true') {
  console.log(
    '[Shell rspack.config.js] NX_API_BASE_URL:',
    process.env.NX_API_BASE_URL
  );
  console.log('[Shell rspack.config.js] NODE_ENV:', process.env.NODE_ENV);
  console.log(
    '[Shell rspack.config.js] NX_HTTPS_MODE:',
    process.env.NX_HTTPS_MODE
  );
  console.log(
    '[Shell rspack.config.js] NX_AUTH_MFE_URL:',
    process.env.NX_AUTH_MFE_URL || '(not set)'
  );
  console.log(
    '[Shell rspack.config.js] NX_PAYMENTS_MFE_URL:',
    process.env.NX_PAYMENTS_MFE_URL || '(not set)'
  );
  console.log(
    '[Shell rspack.config.js] NX_ADMIN_MFE_URL:',
    process.env.NX_ADMIN_MFE_URL || '(not set)'
  );
  console.log(
    '[Shell rspack.config.js] NX_PROFILE_MFE_URL:',
    process.env.NX_PROFILE_MFE_URL || '(not set)'
  );
}

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = !isProduction;

/**
 * Allowed origins for remote MFE URLs
 * Production: Only HTTPS origins from trusted CDN/servers
 * Development: Localhost on any port
 *
 * @security Add your production CDN/server origins here
 */
const ALLOWED_REMOTE_ORIGINS = isProduction
  ? [
      // Production origins - HTTPS only
      'https://localhost',
      // Vercel domains (MFE deployments)
      'https://auth-mfe-one.vercel.app',
      'https://payments-mfe.vercel.app',
      'https://admin-mfe-theta.vercel.app',
      'https://profile-mfe-bice.vercel.app',
      // CI placeholder (build-time only, not used at runtime)
      ...(process.env.CI ? ['https://placeholder.vercel.app'] : []),
    ]
  : [
      // Development origins - HTTP allowed
      'http://localhost',
      'https://localhost',
    ];

/**
 * Get remote MFE URL based on mode
 * - Production: Use individual NX_<MFE>_URL env vars (e.g., NX_AUTH_MFE_URL)
 * - HTTPS mode: Use nginx proxy paths (Safari-compatible, no mixed content)
 * - HTTP mode: Direct access to MFE dev servers
 *
 * @security Production builds enforce HTTPS URLs
 */
const getRemoteUrl = (mfeName, port) => {
  // Production: Use individual MFE URL from environment variables
  if (isProduction) {
    // Map MFE name to env var (e.g., 'auth' -> 'NX_AUTH_MFE_URL')
    const envVarName = `NX_${mfeName.toUpperCase()}_MFE_URL`;
    const mfeBaseUrl = process.env[envVarName];

    if (!mfeBaseUrl) {
      // CI builds: Use placeholder URLs (won't be used at runtime)
      // Vercel builds: Must have actual MFE URLs set
      if (process.env.CI) {
        console.warn(
          `[WARN] ${envVarName} not set in CI - using placeholder URL`
        );
        return `https://placeholder.vercel.app/remoteEntry.js`;
      }

      console.error(`[ERROR] Missing environment variable: ${envVarName}`);
      throw new Error(`Production build requires ${envVarName} to be set`);
    }

    const normalizedBase = mfeBaseUrl
      .replace(/\/+$/, '')
      .replace(/\/remoteEntry\.js$/i, '');
    const url = `${normalizedBase}/remoteEntry.js`;

    // Validate URL uses HTTPS in production
    if (!url.startsWith('https://')) {
      console.error(
        `[SECURITY] Remote URL must use HTTPS in production: ${url}`
      );
      throw new Error(`Production remote URL must use HTTPS: ${url}`);
    }

    return url;
  }

  // Development: HTTPS mode uses nginx proxy
  if (isHttpsMode) {
    return `https://localhost/mfe/${mfeName}/remoteEntry.js`;
  }

  // Development: HTTP mode uses direct dev server access
  return `http://localhost:${port}/remoteEntry.js`;
};

/**
 * Check if a URL origin matches an allowed origin
 * @security Uses strict matching to prevent spoofing (e.g., localhost.evil.com)
 */
function isOriginAllowed(parsedUrl, allowedOrigins) {
  for (const allowed of allowedOrigins) {
    try {
      // Parse the allowed origin (add path if needed for URL parsing)
      const allowedUrl = new URL(
        allowed.includes('/') ? allowed : `${allowed}/`
      );

      // Protocol must match exactly
      if (parsedUrl.protocol !== allowedUrl.protocol) continue;

      // Hostname must match exactly (no prefix matching)
      if (parsedUrl.hostname !== allowedUrl.hostname) continue;

      // For development with localhost, allow any port
      if (parsedUrl.hostname === 'localhost') {
        return true;
      }

      // For non-localhost, port must match if specified in allowed origin
      if (allowedUrl.port && parsedUrl.port !== allowedUrl.port) continue;

      return true;
    } catch {
      // Invalid allowed origin, skip
      continue;
    }
  }
  return false;
}

/**
 * Validate all remote URLs at build time
 * @security Prevents loading remotes from unauthorized origins
 */
function validateRemoteUrls(remotes) {
  const errors = [];

  for (const [name, remoteSpec] of Object.entries(remotes)) {
    // Parse remote spec: "remoteName@url"
    const url = remoteSpec.split('@').slice(1).join('@');

    try {
      const parsedUrl = new URL(url);

      // Check if origin is allowed using strict matching
      const isAllowed = isOriginAllowed(parsedUrl, ALLOWED_REMOTE_ORIGINS);

      if (!isAllowed) {
        errors.push(`${name}: Origin not allowed - ${parsedUrl.origin}`);
      }

      // Production must use HTTPS
      if (isProduction && parsedUrl.protocol !== 'https:') {
        errors.push(`${name}: HTTPS required in production - ${url}`);
      }
    } catch (e) {
      errors.push(`${name}: Invalid URL - ${url}`);
    }
  }

  if (errors.length > 0) {
    console.error('\n[SECURITY] Remote URL validation failed:');
    errors.forEach(err => console.error(`  - ${err}`));
    console.error(`\nAllowed origins: ${ALLOWED_REMOTE_ORIGINS.join(', ')}\n`);

    if (isProduction) {
      throw new Error('Remote URL validation failed in production build');
    } else {
      console.warn('[SECURITY] Continuing with warnings in development mode\n');
    }
  } else {
    console.log('[SECURITY] All remote URLs validated successfully');
  }
}

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
  '@mfe/shared-theme-store': {
    singleton: true,
    requiredVersion: false,
    eager: false,
  },
  '@mfe/shared-session-sync': {
    singleton: true,
    requiredVersion: false,
    eager: false,
  },
  'shared-session-sync': {
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
    // CRITICAL for Safari: Sets crossorigin="anonymous" on dynamically loaded scripts
    // This allows Module Federation to load remote entries with proper CORS handling
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
      // NOTE: Loaders execute from RIGHT to LEFT (bottom to top in array)
      // This is the ONLY CSS rule - no NxAppRspackPlugin CSS conflicts
      {
        test: /\.css$/,
        use: [
          // Production: extract CSS to separate files; Development: inject via <style> tags
          isDevelopment ? 'style-loader' : rspack.CssExtractRspackPlugin.loader,
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
      // Image assets (PNG, JPG, SVG, etc.)
      {
        test: /\.(png|jpg|jpeg|gif|svg|webp)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[name].[hash][ext]',
        },
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
      // WebSocket URL: Through nginx proxy (wss://localhost/ws)
      // Direct API Gateway access (ws://localhost:3000/ws) available via env var
      'process.env.NX_WS_URL': JSON.stringify(
        process.env.NX_WS_URL || 'wss://localhost/ws'
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
      'process.env.NX_SESSION_TIMEOUT_MS': JSON.stringify(
        process.env.NX_SESSION_TIMEOUT_MS || ''
      ),
      'process.env.NODE_ENV': JSON.stringify(
        isProduction ? 'production' : 'development'
      ),
      // MFE base URLs - used at runtime for health checks and other MFE interactions
      'process.env.NX_AUTH_MFE_URL': JSON.stringify(
        process.env.NX_AUTH_MFE_URL || ''
      ),
      'process.env.NX_PAYMENTS_MFE_URL': JSON.stringify(
        process.env.NX_PAYMENTS_MFE_URL || ''
      ),
      'process.env.NX_ADMIN_MFE_URL': JSON.stringify(
        process.env.NX_ADMIN_MFE_URL || ''
      ),
      'process.env.NX_PROFILE_MFE_URL': JSON.stringify(
        process.env.NX_PROFILE_MFE_URL || ''
      ),
      'process.env.NX_ENABLE_SW': JSON.stringify(
        process.env.NX_ENABLE_SW || ''
      ),
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
    // CSP Nonce injection - adds nonce="__CSP_NONCE__" to script/style tags
    // nginx's sub_filter replaces placeholder with unique per-request value
    new CspNoncePlugin({
      placeholder: '__CSP_NONCE__',
    }),
    // Module Federation Plugin - Shell acts as HOST consuming remote MFEs
    // @security Remote URLs validated at build time (see validateRemoteUrls)
    (() => {
      const remotes = {
        // Remote MFE URLs - dynamically set based on environment
        // Production: HTTPS required, uses NX_MFE_BASE_URL or https://localhost
        // Development HTTPS mode: proxied through nginx (Safari-compatible)
        // Development HTTP mode: direct access to dev servers
        authMfe: `authMfe@${getRemoteUrl('auth', 4201)}`,
        paymentsMfe: `paymentsMfe@${getRemoteUrl('payments', 4202)}`,
        adminMfe: `adminMfe@${getRemoteUrl('admin', 4203)}`,
        profileMfe: `profileMfe@${getRemoteUrl('profile', 4204)}`,
      };

      // Validate remote URLs at build time
      validateRemoteUrls(remotes);

      return new rspack.container.ModuleFederationPlugin({
        name: 'shell',
        remotes,
        shared: sharedDependencies,
      });
    })(),
    // React Fast Refresh plugin - injects $RefreshReg$ runtime for HMR
    ...(isDevelopment
      ? [
          new ReactRefreshPlugin({
            overlay: false, // Disable overlay to avoid conflicts with devServer overlay
          }),
        ]
      : []),
    // CSS extraction plugin - extracts CSS into separate files in production
    ...(isProduction
      ? [
          new rspack.CssExtractRspackPlugin({
            filename: '[name].[contenthash].css',
            chunkFilename: '[name].[contenthash].chunk.css',
          }),
        ]
      : []),
  ],
  // Dev server configuration
  devServer: {
    port: 4200,
    host: '0.0.0.0', // Bind to all interfaces for Docker nginx access
    hot: true, // HMR enabled - falls back to page refresh for changes that can't be hot-reloaded
    liveReload: false, // Disable live reload - prevents auto page refresh on HMR failure
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
      // Prevent page reload on HMR errors - just log them
      // This stops the reload loop when hot-update.json fails
      reconnect: 5, // Limit reconnection attempts (default is infinite)
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
    // Aggregate multiple changes into single rebuild (reduces rebuild frequency)
    aggregateTimeout: 300,
  },
};
