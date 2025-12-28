import baseConfig from '../../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.json'],
    rules: {
      // '@nx/dependency-checks' rule removed - @nx eslint plugin not installed
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
];
