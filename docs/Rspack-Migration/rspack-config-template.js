/**
 * Base Rspack Configuration Template
 *
 * This template serves as a reference for creating Rspack configurations
 * for apps and libraries in the migration from Vite to Rspack.
 *
 * Key Differences from Vite:
 * - Uses CommonJS (require/module.exports) instead of ES modules
 * - Uses builtin:swc-loader for React/TypeScript instead of @vitejs/plugin-react
 * - Uses PostCSS loader for CSS processing (configured in Phase 4)
 * - Module Federation uses rspack.container.ModuleFederationPlugin
 * - Requires output.uniqueName for HMR with Module Federation
 *
 * Note: This file uses CommonJS (require/module.exports) because Rspack
 * configuration files run in Node.js context and must use CommonJS syntax.
 */

const rspack = require('@rspack/core');
const path = require('path');
const { NxAppRspackPlugin } = require('@nx/rspack/plugins');

/**
 * Base configuration for Rspack apps
 *
 * @param {Object} options - Configuration options
 * @param {string} options.name - App name (e.g., 'shell', 'auth-mfe')
 * @param {string} options.entry - Entry point (e.g., './src/main.tsx')
 * @param {string} options.outputPath - Output directory (e.g., '../../dist/apps/shell')
 * @param {number} options.port - Dev server port
 * @param {boolean} options.isLibrary - Whether this is a library (default: false)
 * @returns {Object} Rspack configuration
 */
function createRspackConfig({
  name,
  entry,
  outputPath,
  port,
  isLibrary = false,
}) {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = !isProduction;

  const config = {
    mode: isProduction ? 'production' : 'development',
    entry: entry || './src/main.tsx',
    output: {
      path: path.resolve(__dirname, outputPath),
      // CRITICAL: uniqueName is required for Module Federation HMR
      uniqueName: name,
      // For libraries, we might not need these
      ...(isLibrary
        ? {}
        : {
            filename: isProduction ? '[name].[contenthash].js' : '[name].js',
            chunkFilename: isProduction
              ? '[name].[contenthash].chunk.js'
              : '[name].chunk.js',
          }),
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
        // Placeholder for Phase 4: PostCSS loader configuration
      ],
    },
    plugins: [
      new rspack.ProgressPlugin(),
      new NxAppRspackPlugin(),
      // Module Federation plugin will be added in Phase 3
      // Placeholder: new rspack.container.ModuleFederationPlugin({ ... })
    ],
    // Dev server configuration
    devServer: isLibrary
      ? undefined
      : {
          port: port || 4200,
          host: 'localhost',
          hot: true, // Enable HMR
          // CORS may be needed for Module Federation
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        },
    // Optimization settings
    optimization: {
      minimize: isProduction,
    },
    // Source maps for development
    devtool: isDevelopment ? 'eval-source-map' : 'source-map',
  };

  return config;
}

// Example usage for shell app:
// module.exports = createRspackConfig({
//   name: 'shell',
//   entry: './src/main.tsx',
//   outputPath: '../../dist/apps/shell',
//   port: 4200,
// });

// Example usage for library:
// module.exports = createRspackConfig({
//   name: 'shared-utils',
//   entry: './src/index.ts',
//   outputPath: '../../dist/libs/shared-utils',
//   isLibrary: true,
// });

module.exports = createRspackConfig;
