const { nxPreset } = require('@nx/jest/preset');

module.exports = {
  ...nxPreset,
  displayName: 'shared-header-ui',
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  rootDir: '.',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
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
  ],
  coverageDirectory: '../../coverage/libs/shared-header-ui',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
