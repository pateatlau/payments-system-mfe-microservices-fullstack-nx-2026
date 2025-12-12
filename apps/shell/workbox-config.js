/* eslint-disable no-undef */
/* eslint-env node */
module.exports = {
  globDirectory: 'dist/apps/shell/',
  globPatterns: [
    '**/*.{js,css,html,png,jpg,jpeg,gif,svg,ico,woff,woff2,ttf,eot}',
  ],
  swDest: 'dist/apps/shell/sw.js',
  swSrc: 'apps/shell/src/sw.ts',
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,

  // Module Federation support
  ignoreURLParametersMatching: [/^v$/, /^_/],

  // Navigation fallback
  navigateFallback: '/index.html',
  navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],

  // Runtime caching
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'gstatic-fonts-cache',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
};
