// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import noHardcodedColors from './scripts/eslint-rules/no-hardcoded-colors.js';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    ignores: ['docs/**'],
    plugins: {
      'theme-colors': { rules: { 'no-hardcoded-colors': noHardcodedColors } },
      'react-hooks': reactHooks,
    },
    rules: {
      // TypeScript-specific rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      // General rules
      'no-console': 'warn',
      // Theme guardrail: prevent hardcoded colors
      'theme-colors/no-hardcoded-colors': 'warn',
      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    files: ['docs/**/*.js'],
    languageOptions: {
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        console: 'readonly',
      },
      ecmaVersion: 'latest',
      sourceType: 'script', // CommonJS
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'off', // Node.js globals are defined above
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.nx/**',
      'coverage/**',
      '**/*.config.js',
      '**/*.config.mjs',
      'pnpm-lock.yaml',
      '**/.__mf__temp/**',
    ],
  }
);
