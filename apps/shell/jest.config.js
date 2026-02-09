const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { nxPreset } = require('@nx/jest/preset');

module.exports = {
  ...nxPreset,
  displayName: 'shell',
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  rootDir: '.',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Map shared libraries
    '^shared-utils$': '<rootDir>/../../libs/shared-utils/src/index.ts',
    '^shared-ui$': '<rootDir>/../../libs/shared-ui/src/index.ts',
    '^shared-types$': '<rootDir>/../../libs/shared-types/src/index.ts',
    '^shared-auth-store$':
      '<rootDir>/../../libs/shared-auth-store/src/index.ts',
    '^shared-header-ui$': '<rootDir>/../../libs/shared-header-ui/src/index.ts',
    // Mock static assets (images, styles, etc.)
    '\\.(jpg|jpeg|png|gif|svg|webp)$': '<rootDir>/src/test/__mocks__/fileMock.js',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        isolatedModules: true,
      },
    ],
  },
  // Override testMatch to ensure we find all test files
  testMatch: [
    '**/?(*.)+(spec|test).?([mc])[jt]s?(x)',
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/main.tsx',
    '!src/bootstrap.tsx',
  ],
  coverageDirectory: '../../coverage/apps/shell',
  // Reduce memory usage - shell app has many Module Federation dependencies
  // which can cause memory bloat during test runs
  maxWorkers: 1,
  // Use workerIdleMemoryLimit to restart workers that consume too much memory
  workerIdleMemoryLimit: '512MB',
};
