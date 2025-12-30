module.exports = {
  displayName: 'shared-websocket',
  preset: '../../jest.preset.js',
  // jsdom is required for browser APIs: WebSocket, Event, CloseEvent, MessageEvent
  testEnvironment: 'jsdom',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/libs/shared-websocket',
};
