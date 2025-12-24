/* eslint-disable */
export default {
  displayName: 'cache',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  testTimeout: 10000,
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/backend/cache',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/.nx/',
    '/__mocks__/',
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/**/index.ts',
    '!src/**/__mocks__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
