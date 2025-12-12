/**
 * Payments MFE Entry Point
 *
 * Module Federation requires an async boundary to properly initialize
 * shared dependencies before the application code runs.
 *
 * @see https://module-federation.io/guide/troubleshooting/runtime/RUNTIME-006
 */

// Dynamic import creates the async boundary required by Module Federation
import('./bootstrap').catch(err => {
  console.error('Failed to load application:', err);
});
