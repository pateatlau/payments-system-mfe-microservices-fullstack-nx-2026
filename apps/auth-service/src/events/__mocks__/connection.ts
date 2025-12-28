/**
 * Mock RabbitMQ Connection Manager for tests
 */

export const mockConnectionManager = {
  connect: jest.fn().mockResolvedValue(undefined),
  getChannel: jest.fn().mockResolvedValue({
    assertExchange: jest.fn().mockResolvedValue(undefined),
    publish: jest.fn().mockReturnValue(true),
    waitForConfirms: jest.fn().mockResolvedValue(undefined),
  }),
  close: jest.fn().mockResolvedValue(undefined),
  healthCheck: jest.fn().mockResolvedValue(true),
  isConnected: jest.fn().mockReturnValue(true),
};

export const getConnectionManager = jest.fn(() => mockConnectionManager);
export const closeConnection = jest.fn().mockResolvedValue(undefined);
export const checkConnectionHealth = jest.fn().mockResolvedValue(true);
