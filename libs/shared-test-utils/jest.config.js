module.exports = {
  displayName: 'shared-test-utils',
  preset: '../../jest.preset.js',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/libs/shared-test-utils',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
};
