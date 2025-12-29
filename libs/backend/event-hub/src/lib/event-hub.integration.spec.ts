/**
 * Event Hub - Integration Tests
 *
 * Tests Event Hub with real Redis connections
 * Note: Requires Redis to be running (use test Redis instance)
 */

import { EventPublisher, createEventPublisher } from './event-publisher';
import { EventSubscriber, createEventSubscriber } from './event-subscriber';
import { closeRedisConnections } from './redis-connection';
import { BaseEvent } from './types';

// TODO: Skip in CI where Redis is not available or mock Redis properly
describe.skip('Event Hub Integration', () => {
  let publisher: EventPublisher;
  let subscriber: EventSubscriber;

  beforeAll(() => {
    publisher = createEventPublisher('test-publisher');
    subscriber = createEventSubscriber('test-subscriber');
  });

  afterAll(async () => {
    await subscriber.unsubscribeAll();
    await closeRedisConnections();
  });

  describe('Event Publishing and Subscribing', () => {
    it('should publish and receive event successfully', async () => {
      const eventData = { userId: 'user-1', action: 'login' };
      const receivedEvents: BaseEvent[] = [];

      // Subscribe to event
      const subscription = await subscriber.subscribe(
        'test:event:integration',
        async (event: BaseEvent) => {
          receivedEvents.push(event);
        }
      );

      // Wait a bit for subscription to be ready
      await new Promise(resolve => setTimeout(resolve, 100));

      // Publish event
      await publisher.publish('test:event:integration', eventData);

      // Wait for event to be received
      await new Promise(resolve => setTimeout(resolve, 200));

      // Verify event was received
      expect(receivedEvents.length).toBeGreaterThan(0);
      const receivedEvent = receivedEvents[0];
      expect(receivedEvent.type).toBe('test:event:integration');
      expect(receivedEvent.data).toEqual(eventData);
      expect(receivedEvent.source).toBe('test-publisher');
      expect(receivedEvent.id).toBeDefined();
      expect(receivedEvent.timestamp).toBeDefined();

      // Cleanup
      await subscription.unsubscribe();
    });

    it('should handle multiple subscribers for same event', async () => {
      const eventData = { userId: 'user-2', action: 'logout' };
      const receivedEvents1: BaseEvent[] = [];
      const receivedEvents2: BaseEvent[] = [];

      // Subscribe with two handlers
      const subscription1 = await subscriber.subscribe(
        'test:event:multi',
        async (event: BaseEvent) => {
          receivedEvents1.push(event);
        }
      );

      const subscription2 = await subscriber.subscribe(
        'test:event:multi',
        async (event: BaseEvent) => {
          receivedEvents2.push(event);
        }
      );

      // Wait for subscriptions to be ready
      await new Promise(resolve => setTimeout(resolve, 100));

      // Publish event
      await publisher.publish('test:event:multi', eventData);

      // Wait for events to be received
      await new Promise(resolve => setTimeout(resolve, 200));

      // Verify both handlers received the event
      expect(receivedEvents1.length).toBeGreaterThan(0);
      expect(receivedEvents2.length).toBeGreaterThan(0);
      expect(receivedEvents1[0].data).toEqual(eventData);
      expect(receivedEvents2[0].data).toEqual(eventData);

      // Cleanup
      await subscription1.unsubscribe();
      await subscription2.unsubscribe();
    });

    it('should handle correlation IDs', async () => {
      const eventData = { userId: 'user-3' };
      const correlationId = 'correlation-123';
      const receivedEvents: BaseEvent[] = [];

      const subscription = await subscriber.subscribe(
        'test:event:correlation',
        async (event: BaseEvent) => {
          receivedEvents.push(event);
        }
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      await publisher.publish(
        'test:event:correlation',
        eventData,
        correlationId
      );

      await new Promise(resolve => setTimeout(resolve, 200));

      expect(receivedEvents.length).toBeGreaterThan(0);
      expect(receivedEvents[0].correlationId).toBe(correlationId);

      await subscription.unsubscribe();
    });

    it('should publish batch events successfully', async () => {
      const receivedEvents: BaseEvent[] = [];

      const subscription = await subscriber.subscribe(
        'test:event:batch',
        async (event: BaseEvent) => {
          receivedEvents.push(event);
        }
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      // Publish batch
      await publisher.publishBatch([
        {
          eventType: 'test:event:batch',
          data: { id: 1, action: 'create' },
        },
        {
          eventType: 'test:event:batch',
          data: { id: 2, action: 'update' },
        },
      ]);

      await new Promise(resolve => setTimeout(resolve, 300));

      // Verify both events were received
      expect(receivedEvents.length).toBeGreaterThanOrEqual(2);
      const eventTypes = receivedEvents.map(e => e.type);
      expect(eventTypes).toContain('test:event:batch');

      await subscription.unsubscribe();
    });

    it('should unsubscribe from events correctly', async () => {
      const receivedEvents: BaseEvent[] = [];

      const subscription = await subscriber.subscribe(
        'test:event:unsubscribe',
        async (event: BaseEvent) => {
          receivedEvents.push(event);
        }
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      // Publish event before unsubscribe
      await publisher.publish('test:event:unsubscribe', { test: 'before' });
      await new Promise(resolve => setTimeout(resolve, 200));

      const countBefore = receivedEvents.length;

      // Unsubscribe
      await subscription.unsubscribe();

      // Publish event after unsubscribe
      await publisher.publish('test:event:unsubscribe', { test: 'after' });
      await new Promise(resolve => setTimeout(resolve, 200));

      // Verify no new events received after unsubscribe
      expect(receivedEvents.length).toBe(countBefore);
    });
  });

  describe('Event Subscriber Methods', () => {
    it('should get active subscriptions', async () => {
      const subscription1 = await subscriber.subscribe(
        'test:active:1',
        jest.fn()
      );
      const subscription2 = await subscriber.subscribe(
        'test:active:2',
        jest.fn()
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      const active = subscriber.getActiveSubscriptions();

      expect(active).toContain('test:active:1');
      expect(active).toContain('test:active:2');

      await subscription1.unsubscribe();
      await subscription2.unsubscribe();
    });

    it('should unsubscribe from all events', async () => {
      const receivedEvents: BaseEvent[] = [];

      await subscriber.subscribe(
        'test:unsubscribe:all:1',
        async (event: BaseEvent) => {
          receivedEvents.push(event);
        }
      );
      await subscriber.subscribe(
        'test:unsubscribe:all:2',
        async (event: BaseEvent) => {
          receivedEvents.push(event);
        }
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      await subscriber.unsubscribeAll();

      await publisher.publish('test:unsubscribe:all:1', { test: '1' });
      await publisher.publish('test:unsubscribe:all:2', { test: '2' });
      await new Promise(resolve => setTimeout(resolve, 200));

      // Should not receive events after unsubscribeAll
      expect(receivedEvents.length).toBe(0);
    });

    it('should subscribe to multiple event types', async () => {
      const receivedEvents: BaseEvent[] = [];

      const subscriptions = await subscriber.subscribeToMany(
        ['test:many:1', 'test:many:2'],
        async (event: BaseEvent) => {
          receivedEvents.push(event);
        }
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      await publisher.publish('test:many:1', { id: 1 });
      await publisher.publish('test:many:2', { id: 2 });
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(receivedEvents.length).toBeGreaterThanOrEqual(2);

      // Cleanup
      for (const sub of subscriptions) {
        await sub.unsubscribe();
      }
    });
  });
});
