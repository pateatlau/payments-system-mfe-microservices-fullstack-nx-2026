module.exports = {
  displayName: 'admin-mfe',
  preset: '../../jest.preset.js',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  moduleNameMapper: {
    '^shared-auth-store$':
      '<rootDir>/../../libs/shared-auth-store/src/index.ts',
    '^shared-types$': '<rootDir>/../../libs/shared-types/src/index.ts',
    '^@mfe/shared-api-client$':
      '<rootDir>/../../libs/shared-api-client/src/index.ts',
    '^@mfe/shared-event-bus$':
      '<rootDir>/../../libs/shared-event-bus/src/index.ts',
    '^@mfe/shared-design-system$':
      '<rootDir>/../../libs/shared-design-system/src/index.ts',
    // Mock remote Module Federation modules
    '^paymentsMfe/PaymentReports$':
      '<rootDir>/src/__mocks__/paymentsMfe/PaymentReports.tsx',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  coverageDirectory: '../../coverage/apps/admin-mfe',
};
