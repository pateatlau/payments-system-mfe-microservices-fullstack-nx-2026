const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  // Global Jest configuration for all projects
  // Individual projects can override these settings in their jest.config.js
  // Increase timeout for CI environments which can be slower
  testTimeout: 10000,
};
