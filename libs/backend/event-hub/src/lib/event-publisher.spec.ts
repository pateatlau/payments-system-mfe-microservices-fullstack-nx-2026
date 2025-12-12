/**
 * Event Publisher - Unit Tests
 */

import { EventPublisher, createEventPublisher } from './event-publisher';
import { getPublisherClient } from './redis-connection';
import { v4 as uuidv4 } from 'uuid';

// Mock dependencies
jest.mock('./redis-connection', () => ({
  getPublisherClient: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid'),
}));

describe('EventPublisher', () => {
  let mockPublisher: {
    publish: jest.Mock;
    pipeline: jest.Mock;
  };

  beforeEach(() => {
    mockPublisher = {
      publish: jest.fn().mockResolvedValue(1),
      pipeline: jest.fn().mockReturnValue({
        publish: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([[null, 1]]),
      }),
    };
    (getPublisherClient as jest.Mock).mockReturnValue(mockPublisher);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create EventPublisher with service name', () => {
      const publisher = new EventPublisher('test-service');
      expect(publisher).toBeInstanceOf(EventPublisher);
    });
  });

  describe('publish', () => {
    it('should publish event successfully', async () => {
      const publisher = new EventPublisher('test-service');
      const eventData = { userId: 'user-1', action: 'login' };

      await publisher.publish('auth:user:login', eventData);

      expect(mockPublisher.publish).toHaveBeenCalledWith(
        'auth:user:login',
        expect.stringContaining('"type":"auth:user:login"')
      );

      const publishedData = JSON.parse(mockPublisher.publish.mock.calls[0][1]);
      expect(publishedData).toMatchObject({
        type: 'auth:user:login',
        source: 'test-service',
        data: eventData,
      });
      expect(publishedData.id).toBe('test-uuid');
      expect(publishedData.timestamp).toBeDefined();
    });

    it('should include correlation ID when provided', async () => {
      const publisher = new EventPublisher('test-service');
      const eventData = { userId: 'user-1' };
      const correlationId = 'correlation-123';

      await publisher.publish('auth:user:login', eventData, correlationId);

      const publishedData = JSON.parse(mockPublisher.publish.mock.calls[0][1]);
      expect(publishedData.correlationId).toBe(correlationId);
    });

    it('should generate unique event ID for each event', async () => {
      const publisher = new EventPublisher('test-service');
      (uuidv4 as jest.Mock)
        .mockReturnValueOnce('uuid-1')
        .mockReturnValueOnce('uuid-2');

      await publisher.publish('event:1', {});
      await publisher.publish('event:2', {});

      const event1 = JSON.parse(mockPublisher.publish.mock.calls[0][1]);
      const event2 = JSON.parse(mockPublisher.publish.mock.calls[1][1]);

      expect(event1.id).toBe('uuid-1');
      expect(event2.id).toBe('uuid-2');
    });
  });

  describe('publishBatch', () => {
    it('should publish multiple events in batch', async () => {
      const publisher = new EventPublisher('test-service');
      const events = [
        { eventType: 'event:1', data: { data1: 'value1' } },
        { eventType: 'event:2', data: { data2: 'value2' } },
      ];

      await publisher.publishBatch(events);

      expect(mockPublisher.pipeline).toHaveBeenCalled();
      const pipeline = mockPublisher.pipeline();
      expect(pipeline.publish).toHaveBeenCalledTimes(2);
      expect(pipeline.exec).toHaveBeenCalled();
    });

    it('should include correlation IDs in batch events', async () => {
      const publisher = new EventPublisher('test-service');
      const events = [
        {
          eventType: 'event:1',
          data: { data1: 'value1' },
          correlationId: 'corr-1',
        },
        {
          eventType: 'event:2',
          data: { data2: 'value2' },
          correlationId: 'corr-2',
        },
      ];

      await publisher.publishBatch(events);

      const pipeline = mockPublisher.pipeline();
      expect(pipeline.publish).toHaveBeenCalledTimes(2);
    });
  });

  describe('createEventPublisher', () => {
    it('should create EventPublisher instance', () => {
      const publisher = createEventPublisher('test-service');
      expect(publisher).toBeInstanceOf(EventPublisher);
    });
  });
});
