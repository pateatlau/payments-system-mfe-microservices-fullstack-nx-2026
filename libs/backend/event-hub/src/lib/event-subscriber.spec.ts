/**
 * Event Subscriber - Unit Tests
 */

import { EventSubscriber, createEventSubscriber } from './event-subscriber';
import { getSubscriberClient } from './redis-connection';
import { BaseEvent } from './types';

// Mock dependencies
jest.mock('./redis-connection', () => ({
  getSubscriberClient: jest.fn(),
}));

describe('EventSubscriber', () => {
  let mockSubscriber: {
    on: jest.Mock;
    subscribe: jest.Mock;
    unsubscribe: jest.Mock;
  };
  let messageHandler: (channel: string, message: string) => void;

  beforeEach(() => {
    messageHandler = jest.fn();
    mockSubscriber = {
      on: jest.fn((event, handler) => {
        if (event === 'message') {
          messageHandler = handler;
        }
      }),
      subscribe: jest.fn().mockResolvedValue(undefined),
      unsubscribe: jest.fn().mockResolvedValue(undefined),
    };
    (getSubscriberClient as jest.Mock).mockReturnValue(mockSubscriber);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create EventSubscriber with service name', () => {
      const subscriber = new EventSubscriber('test-service');
      expect(subscriber).toBeInstanceOf(EventSubscriber);
      expect(mockSubscriber.on).toHaveBeenCalledWith(
        'message',
        expect.any(Function)
      );
    });
  });

  describe('subscribe', () => {
    it('should subscribe to event type', async () => {
      const subscriber = new EventSubscriber('test-service');
      const handler = jest.fn();

      const subscription = await subscriber.subscribe(
        'auth:user:login',
        handler
      );

      expect(mockSubscriber.subscribe).toHaveBeenCalledWith('auth:user:login');
      expect(subscription.eventType).toBe('auth:user:login');
      expect(subscription.handler).toBe(handler);
      expect(subscription.unsubscribe).toBeDefined();
    });

    it('should call handler when event is received', async () => {
      const subscriber = new EventSubscriber('test-service');
      const handler = jest.fn();

      await subscriber.subscribe('auth:user:login', handler);

      const event: BaseEvent = {
        id: 'event-1',
        type: 'auth:user:login',
        timestamp: new Date().toISOString(),
        source: 'auth-service',
        data: { userId: 'user-1' },
      };

      messageHandler('auth:user:login', JSON.stringify(event));

      expect(handler).toHaveBeenCalledWith(event);
    });

    it('should handle multiple handlers for same event type', async () => {
      const subscriber = new EventSubscriber('test-service');
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      await subscriber.subscribe('auth:user:login', handler1);
      await subscriber.subscribe('auth:user:login', handler2);

      const event: BaseEvent = {
        id: 'event-1',
        type: 'auth:user:login',
        timestamp: new Date().toISOString(),
        source: 'auth-service',
        data: { userId: 'user-1' },
      };

      messageHandler('auth:user:login', JSON.stringify(event));

      expect(handler1).toHaveBeenCalledWith(event);
      expect(handler2).toHaveBeenCalledWith(event);
    });

    it('should not subscribe to Redis again if already subscribed', async () => {
      const subscriber = new EventSubscriber('test-service');
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      await subscriber.subscribe('auth:user:login', handler1);
      mockSubscriber.subscribe.mockClear();
      await subscriber.subscribe('auth:user:login', handler2);

      // Should not call subscribe again for same event type
      expect(mockSubscriber.subscribe).not.toHaveBeenCalled();
    });
  });

  describe('unsubscribe', () => {
    it('should unsubscribe handler from event type', async () => {
      const subscriber = new EventSubscriber('test-service');
      const handler = jest.fn();

      await subscriber.subscribe('auth:user:login', handler);
      await subscriber.unsubscribe('auth:user:login', handler);

      const event: BaseEvent = {
        id: 'event-1',
        type: 'auth:user:login',
        timestamp: new Date().toISOString(),
        source: 'auth-service',
        data: {},
      };

      messageHandler('auth:user:login', JSON.stringify(event));

      expect(handler).not.toHaveBeenCalled();
    });

    it('should unsubscribe from Redis when no handlers remain', async () => {
      const subscriber = new EventSubscriber('test-service');
      const handler = jest.fn();

      await subscriber.subscribe('auth:user:login', handler);
      await subscriber.unsubscribe('auth:user:login', handler);

      expect(mockSubscriber.unsubscribe).toHaveBeenCalledWith(
        'auth:user:login'
      );
    });

    it('should not unsubscribe from Redis if handlers remain', async () => {
      const subscriber = new EventSubscriber('test-service');
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      await subscriber.subscribe('auth:user:login', handler1);
      await subscriber.subscribe('auth:user:login', handler2);
      mockSubscriber.unsubscribe.mockClear();

      await subscriber.unsubscribe('auth:user:login', handler1);

      expect(mockSubscriber.unsubscribe).not.toHaveBeenCalled();
    });
  });

  describe('subscribeToMany', () => {
    it('should subscribe to multiple event types with single handler', async () => {
      const subscriber = new EventSubscriber('test-service');
      const handler = jest.fn();

      const subscriptions = await subscriber.subscribeToMany(
        ['event:1', 'event:2'],
        handler
      );

      expect(subscriptions).toHaveLength(2);
      expect(mockSubscriber.subscribe).toHaveBeenCalledWith('event:1');
      expect(mockSubscriber.subscribe).toHaveBeenCalledWith('event:2');
    });
  });

  describe('unsubscribeAll', () => {
    it('should unsubscribe from all event types', async () => {
      const subscriber = new EventSubscriber('test-service');
      const handler = jest.fn();

      await subscriber.subscribe('event:1', handler);
      await subscriber.subscribe('event:2', handler);
      mockSubscriber.unsubscribe.mockClear();

      await subscriber.unsubscribeAll();

      expect(mockSubscriber.unsubscribe).toHaveBeenCalledWith('event:1');
      expect(mockSubscriber.unsubscribe).toHaveBeenCalledWith('event:2');
    });
  });

  describe('getActiveSubscriptions', () => {
    it('should return list of active subscription event types', async () => {
      const subscriber = new EventSubscriber('test-service');
      const handler = jest.fn();

      await subscriber.subscribe('event:1', handler);
      await subscriber.subscribe('event:2', handler);

      const active = subscriber.getActiveSubscriptions();

      expect(active).toContain('event:1');
      expect(active).toContain('event:2');
      expect(active.length).toBe(2);
    });

    it('should return empty array when no subscriptions', () => {
      const subscriber = new EventSubscriber('test-service');

      const active = subscriber.getActiveSubscriptions();

      expect(active).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should handle JSON parse errors gracefully', () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const subscriber = new EventSubscriber('test-service');
      const handler = jest.fn();

      subscriber.subscribe('event:1', handler);
      messageHandler('event:1', 'invalid-json');

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(handler).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle handler errors gracefully', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const subscriber = new EventSubscriber('test-service');
      const handler = jest.fn().mockRejectedValue(new Error('Handler error'));

      await subscriber.subscribe('event:1', handler);

      const event: BaseEvent = {
        id: 'event-1',
        type: 'event:1',
        timestamp: new Date().toISOString(),
        source: 'test-service',
        data: {},
      };

      messageHandler('event:1', JSON.stringify(event));

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('createEventSubscriber', () => {
    it('should create EventSubscriber instance', () => {
      const subscriber = createEventSubscriber('test-service');
      expect(subscriber).toBeInstanceOf(EventSubscriber);
    });
  });
});
