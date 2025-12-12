const { nxPreset } = require('@nx/jest/preset');

module.exports = {
  ...nxPreset,
  displayName: 'auth-mfe',
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  rootDir: '.',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Map shared libraries
    '^shared-utils$': '<rootDir>/../../libs/shared-utils/src/index.ts',
    '^shared-ui$': '<rootDir>/../../libs/shared-ui/src/index.ts',
    '^shared-types$': '<rootDir>/../../libs/shared-types/src/index.ts',
    '^shared-auth-store$':
      '<rootDir>/../../libs/shared-auth-store/src/index.ts',
    '^shared-header-ui$': '<rootDir>/../../libs/shared-header-ui/src/index.ts',
    '^@mfe/shared-design-system$':
      '<rootDir>/../../libs/shared-design-system/src/index.ts',
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
  coverageDirectory: '../../coverage/apps/auth-mfe',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
