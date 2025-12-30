/**
 * Mock RabbitMQ Event Publisher for tests
 */

export const mockPublisher = {
  initialize: jest.fn().mockResolvedValue(undefined),
  publish: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
};

export const getEventPublisher = jest.fn(() => mockPublisher);
export const publishPaymentCreated = jest.fn().mockResolvedValue(undefined);
export const publishPaymentStatusChanged = jest.fn().mockResolvedValue(undefined);
export const publishPaymentRefunded = jest.fn().mockResolvedValue(undefined);
