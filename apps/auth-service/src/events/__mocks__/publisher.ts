/**
 * Mock RabbitMQ Event Publisher for tests
 */

export const mockPublisher = {
  initialize: jest.fn().mockResolvedValue(undefined),
  publish: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
};

export const getEventPublisher = jest.fn(() => mockPublisher);
export const publishUserCreated = jest.fn().mockResolvedValue(undefined);
export const publishUserUpdated = jest.fn().mockResolvedValue(undefined);
export const publishUserDeleted = jest.fn().mockResolvedValue(undefined);
export const publishUserLogin = jest.fn().mockResolvedValue(undefined);
export const publishUserLogout = jest.fn().mockResolvedValue(undefined);
