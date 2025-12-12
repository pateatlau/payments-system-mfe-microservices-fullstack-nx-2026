/**
 * Types Tests
 *
 * Validate type definitions and interfaces
 */

import { BaseEvent, EventContext, RetryStrategy } from './types';

describe('Types', () => {
  describe('BaseEvent', () => {
    it('should define a valid base event', () => {
      const event: BaseEvent<{ userId: string }> = {
        id: '123',
        type: 'user.created',
        version: '1.0',
        timestamp: new Date().toISOString(),
        source: 'auth-service',
        data: { userId: '456' },
      };

      expect(event.id).toBe('123');
      expect(event.type).toBe('user.created');
      expect(event.version).toBe('1.0');
      expect(event.source).toBe('auth-service');
      expect(event.data.userId).toBe('456');
    });

    it('should support optional fields', () => {
      const event: BaseEvent = {
        id: '123',
        type: 'test.event',
        version: '1.0',
        timestamp: new Date().toISOString(),
        source: 'test-service',
        correlationId: 'corr-123',
        causationId: 'cause-456',
        data: null,
        metadata: {
          userId: 'user-789',
          tags: ['important', 'urgent'],
        },
      };

      expect(event.correlationId).toBe('corr-123');
      expect(event.causationId).toBe('cause-456');
      expect(event.metadata?.userId).toBe('user-789');
      expect(event.metadata?.tags).toEqual(['important', 'urgent']);
    });
  });

  describe('EventContext', () => {
    it('should define context methods', () => {
      const context: EventContext = {
        ack: jest.fn(),
        nack: jest.fn(),
        reject: jest.fn(),
        exchange: 'test_exchange',
        routingKey: 'test.key',
        deliveryTag: 1,
        redelivered: false,
        properties: {
          contentType: 'application/json',
        },
      };

      context.ack();
      expect(context.ack).toHaveBeenCalled();

      context.nack(true);
      expect(context.nack).toHaveBeenCalledWith(true);

      context.reject();
      expect(context.reject).toHaveBeenCalled();
    });
  });

  describe('RetryStrategy', () => {
    it('should define retry configuration', () => {
      const strategy: RetryStrategy = {
        maxRetries: 5,
        initialDelay: 1000,
        maxDelay: 30000,
        multiplier: 2,
        jitter: true,
      };

      expect(strategy.maxRetries).toBe(5);
      expect(strategy.initialDelay).toBe(1000);
      expect(strategy.maxDelay).toBe(30000);
      expect(strategy.multiplier).toBe(2);
      expect(strategy.jitter).toBe(true);
    });
  });
});
