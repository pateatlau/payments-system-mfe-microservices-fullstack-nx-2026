module.exports = {
  displayName: 'auth-mfe',
  preset: '../../jest.preset.js',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
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
    '^@mfe/shared-api-client$':
      '<rootDir>/../../libs/shared-api-client/src/index.ts',
    // Handle asset imports
    '\\.(png|jpg|jpeg|gif|svg)$': '<rootDir>/src/test/__mocks__/fileMock.js',
  },
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
      // Note: Coverage is currently low (~26%) due to many untested components.
      // TODO: Increase thresholds as more tests are added.
      // Target: 70% for all metrics
      branches: 20,
      functions: 35,
      lines: 25,
      statements: 25,
    },
  },
};
