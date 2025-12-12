const { nxPreset } = require('@nx/jest/preset');

module.exports = {
  ...nxPreset,
  displayName: 'payments-mfe',
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
  },
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
        isolatedModules: true,
      },
    ],
  },
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/main.tsx',
    '!src/bootstrap.tsx',
  ],
  coverageDirectory: '../../coverage/apps/payments-mfe',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
