/**
 * Shell Application Entry Point
 *
 * Module Federation requires an async boundary to properly initialize
 * shared dependencies before the application code runs. This is achieved
 * by dynamically importing the bootstrap file.
 *
 * Without this async boundary, shared dependencies like React cannot be
 * properly negotiated between the host and remotes, resulting in:
 * "Invalid loadShareSync function call" errors
 *
 * @see https://module-federation.io/guide/troubleshooting/runtime/RUNTIME-006
 */

// Dynamic import creates the async boundary required by Module Federation
import('./bootstrap').catch(err => {
  console.error('Failed to load application:', err);
});

// Enable HMR for the bootstrap module
// This allows React Fast Refresh to work with the async boundary
if (module.hot) {
  module.hot.accept('./bootstrap', () => {
    // Re-import bootstrap on HMR update
    import('./bootstrap').catch(err => {
      console.error('HMR update failed:', err);
    });
  });
}
