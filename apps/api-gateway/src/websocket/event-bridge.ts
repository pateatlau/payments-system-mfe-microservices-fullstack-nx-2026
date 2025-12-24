/**
 * WebSocket Event Bridge
 *
 * Connects RabbitMQ event hub to WebSocket server:
 * - Subscribes to RabbitMQ events
 * - Forwards events to appropriate WebSocket rooms
 * - Routes events based on user ID and role
 * - Transforms event formats for WebSocket clients
 *
 * Event Routing:
 * - payments.* → user:{userId} + role:admin
 * - auth.* → user:{userId}
 * - admin.* → role:admin
 */

import {
  RabbitMQConnectionManager,
  RabbitMQSubscriber,
  type BaseEvent,
  type EventContext,
} from '@payments-system/rabbitmq-event-hub';
import type { RoomManager } from './room-manager';
import type { WebSocketMessage } from './types';
import { logger } from '../utils/logger';

export interface EventBridgeConfig {
  rabbitmqUrl?: string;
  consumerTag?: string;
}

export class WebSocketEventBridge {
  private paymentSubscriber: RabbitMQSubscriber | null = null;
  private authSubscriber: RabbitMQSubscriber | null = null;
  private adminSubscriber: RabbitMQSubscriber | null = null;
  private userSubscriber: RabbitMQSubscriber | null = null;
  private connectionManager: RabbitMQConnectionManager | null = null;
  private roomManager: RoomManager;
  private config: EventBridgeConfig;
  private isStarted = false;

  // Statistics
  private eventsReceived = 0;
  private eventsForwarded = 0;
  private eventsByType: Map<string, number> = new Map();

  constructor(roomManager: RoomManager, config: EventBridgeConfig = {}) {
    this.roomManager = roomManager;
    this.config = config;
  }

  /**
   * Start event bridge
   * Connects to RabbitMQ and starts forwarding events
   */
  async start(): Promise<void> {
    if (this.isStarted) {
      logger.warn('WebSocket Event Bridge already started');
      return;
    }

    try {
      logger.info('Starting WebSocket Event Bridge');

      // Create RabbitMQ connection
      // Default credentials: admin:admin (from docker-compose.yml)
      // Note: If RABBITMQ_URL is set in .env, it will be used. Otherwise defaults to admin:admin
      const rabbitmqUrl =
        this.config.rabbitmqUrl ||
        process.env['RABBITMQ_URL'] ||
        'amqp://admin:admin@localhost:5672';

      // Fix common credential issues:
      // 1. If URL has guest:guest (wrong credentials), replace with admin:admin
      // 2. If URL doesn't have credentials, add admin:admin
      let finalUrl = rabbitmqUrl;
      if (rabbitmqUrl.includes('guest:guest')) {
        // Replace guest:guest with admin:admin
        finalUrl = rabbitmqUrl.replace('guest:guest', 'admin:admin');
        logger.warn(
          'RabbitMQ URL had guest:guest credentials, replaced with admin:admin',
          {
            original: rabbitmqUrl,
            fixed: finalUrl,
          }
        );
      } else if (
        rabbitmqUrl.startsWith('amqp://localhost') ||
        rabbitmqUrl.startsWith('amqp://127.0.0.1')
      ) {
        // URL doesn't have credentials, add admin:admin
        finalUrl = rabbitmqUrl.replace('amqp://', 'amqp://admin:admin@');
        logger.warn('RabbitMQ URL missing credentials, added admin:admin', {
          original: rabbitmqUrl,
          fixed: finalUrl,
        });
      }

      this.connectionManager = new RabbitMQConnectionManager({
        url: finalUrl,
      });
      await this.connectionManager.connect();

      // Create subscribers for each event pattern
      await this.subscribeToPaymentEvents();
      await this.subscribeToAuthEvents();
      await this.subscribeToAdminEvents();
      await this.subscribeToUserEvents();

      this.isStarted = true;
      logger.info('WebSocket Event Bridge started successfully', {
        consumerTag: this.config.consumerTag || 'api-gateway-websocket',
      });
    } catch (error) {
      logger.error('Failed to start WebSocket Event Bridge', { error });
      throw error;
    }
  }

  /**
   * Stop event bridge
   * Disconnects from RabbitMQ
   */
  async stop(): Promise<void> {
    if (!this.isStarted) {
      return;
    }

    logger.info('Stopping WebSocket Event Bridge', {
      eventsReceived: this.eventsReceived,
      eventsForwarded: this.eventsForwarded,
    });

    // Close all subscribers
    if (this.paymentSubscriber) {
      await this.paymentSubscriber.close();
      this.paymentSubscriber = null;
    }
    if (this.authSubscriber) {
      await this.authSubscriber.close();
      this.authSubscriber = null;
    }
    if (this.adminSubscriber) {
      await this.adminSubscriber.close();
      this.adminSubscriber = null;
    }
    if (this.userSubscriber) {
      await this.userSubscriber.close();
      this.userSubscriber = null;
    }

    // Close RabbitMQ connection
    if (this.connectionManager) {
      await this.connectionManager.close();
      this.connectionManager = null;
    }

    this.isStarted = false;
    logger.info('WebSocket Event Bridge stopped');
  }

  /**
   * Subscribe to payment events (payments.*)
   */
  private async subscribeToPaymentEvents(): Promise<void> {
    if (!this.connectionManager) return;

    // Create subscriber for payments.# pattern
    this.paymentSubscriber = new RabbitMQSubscriber(this.connectionManager, {
      exchange: 'events',
      routingKeyPattern: 'payments.#',
      queue: `api-gateway-websocket-payments-${this.config.consumerTag || 'default'}`,
    });

    await this.paymentSubscriber.subscribe(
      async (event: BaseEvent, context: EventContext) => {
        this.eventsReceived++;
        this.incrementEventType(event.type);

        try {
          // Extract user ID (support both senderId and userId)
          const eventData = event.data as
            | { senderId?: string; userId?: string }
            | undefined;
          const userId = eventData?.senderId || eventData?.userId;

          // Extract event subtype (e.g., payments.payment.created → created)
          const eventSubtype = event.type.split('.').pop() || 'unknown';

          // Create WebSocket message
          const wsMessage: WebSocketMessage = {
            type: 'event',
            payload: {
              eventType: `payment:${eventSubtype}`,
              data: event.data,
            },
            timestamp: event.timestamp,
          };

          const messageStr = JSON.stringify(wsMessage);

          // Forward to user-specific room
          if (userId) {
            this.roomManager.broadcast(`user:${userId}`, messageStr);
            this.eventsForwarded++;

            logger.debug('Payment event forwarded to user room', {
              eventType: event.type,
              userId,
              roomSize: this.roomManager.getRoomSize(`user:${userId}`),
            });
          }

          // Always forward to admin room
          this.roomManager.broadcast('role:admin', messageStr);
          this.eventsForwarded++;

          logger.debug('Payment event forwarded to admin room', {
            eventType: event.type,
            roomSize: this.roomManager.getRoomSize('role:admin'),
          });

          // Acknowledge the message
          context.ack();
        } catch (error) {
          logger.error('Failed to forward payment event', {
            error,
            eventType: event.type,
          });
          // Reject the message (will go to DLQ if configured)
          context.nack();
        }
      }
    );

    logger.info('Subscribed to payment events (payments.#)');
  }

  /**
   * Subscribe to auth events (auth.*)
   */
  private async subscribeToAuthEvents(): Promise<void> {
    if (!this.connectionManager) return;

    // Create subscriber for auth.# pattern
    this.authSubscriber = new RabbitMQSubscriber(this.connectionManager, {
      exchange: 'events',
      routingKeyPattern: 'auth.#',
      queue: `api-gateway-websocket-auth-${this.config.consumerTag || 'default'}`,
    });

    await this.authSubscriber.subscribe(
      async (event: BaseEvent, context: EventContext) => {
        this.eventsReceived++;
        this.incrementEventType(event.type);

        try {
          const eventData = event.data as { userId?: string } | undefined;
          const userId = eventData?.userId;

          if (!userId) {
            logger.warn('Auth event missing userId', { eventType: event.type });
            return;
          }

          // Extract event subtype (e.g., auth.user.login → login)
          const eventSubtype = event.type.split('.').pop() || 'unknown';

          // Create WebSocket message
          const wsMessage: WebSocketMessage = {
            type: 'event',
            payload: {
              eventType: `session:${eventSubtype}`,
              data: event.data,
            },
            timestamp: event.timestamp,
          };

          const messageStr = JSON.stringify(wsMessage);

          // Forward to user-specific room (for cross-tab/device sync)
          this.roomManager.broadcast(`user:${userId}`, messageStr);
          this.eventsForwarded++;

          logger.debug('Auth event forwarded to user room', {
            eventType: event.type,
            userId,
            roomSize: this.roomManager.getRoomSize(`user:${userId}`),
          });

          // Acknowledge the message
          context.ack();
        } catch (error) {
          logger.error('Failed to forward auth event', {
            error,
            eventType: event.type,
          });
          // Reject the message
          context.nack();
        }
      }
    );

    logger.info('Subscribed to auth events (auth.#)');
  }

  /**
   * Subscribe to admin events (admin.*)
   */
  private async subscribeToAdminEvents(): Promise<void> {
    if (!this.connectionManager) return;

    // Create subscriber for admin.# pattern
    this.adminSubscriber = new RabbitMQSubscriber(this.connectionManager, {
      exchange: 'events',
      routingKeyPattern: 'admin.#',
      queue: `api-gateway-websocket-admin-${this.config.consumerTag || 'default'}`,
    });

    await this.adminSubscriber.subscribe(
      async (event: BaseEvent, context: EventContext) => {
        this.eventsReceived++;
        this.incrementEventType(event.type);

        try {
          // Extract event subtype (e.g., admin.audit.created → audit-created)
          const eventParts = event.type.split('.');
          const eventSubtype = eventParts.slice(1).join('-');

          // Create WebSocket message
          const wsMessage: WebSocketMessage = {
            type: 'event',
            payload: {
              eventType: `admin:${eventSubtype}`,
              data: event.data,
            },
            timestamp: event.timestamp,
          };

          const messageStr = JSON.stringify(wsMessage);

          // Forward to admin room only
          this.roomManager.broadcast('role:admin', messageStr);
          this.eventsForwarded++;

          logger.debug('Admin event forwarded to admin room', {
            eventType: event.type,
            roomSize: this.roomManager.getRoomSize('role:admin'),
          });

          // Acknowledge the message
          context.ack();
        } catch (error) {
          logger.error('Failed to forward admin event', {
            error,
            eventType: event.type,
          });
          // Reject the message
          context.nack();
        }
      }
    );

    logger.info('Subscribed to admin events (admin.#)');
  }

  /**
   * Subscribe to user events (user.*)
   */
  private async subscribeToUserEvents(): Promise<void> {
    if (!this.connectionManager) return;

    // Create subscriber for user.# pattern
    this.userSubscriber = new RabbitMQSubscriber(this.connectionManager, {
      exchange: 'events',
      routingKeyPattern: 'user.#',
      queue: `api-gateway-websocket-user-${this.config.consumerTag || 'default'}`,
    });

    await this.userSubscriber.subscribe(
      async (event: BaseEvent, context: EventContext) => {
        this.eventsReceived++;
        this.incrementEventType(event.type);

        try {
          const eventData = event.data as { userId?: string } | undefined;
          const userId = eventData?.userId;

          if (!userId) {
            logger.warn('User event missing userId', { eventType: event.type });
            return;
          }

          // Extract event subtype
          const eventSubtype = event.type.split('.').pop() || 'unknown';

          // Create WebSocket message
          const wsMessage: WebSocketMessage = {
            type: 'event',
            payload: {
              eventType: `user:${eventSubtype}`,
              data: event.data,
            },
            timestamp: event.timestamp,
          };

          const messageStr = JSON.stringify(wsMessage);

          // Forward to user-specific room
          this.roomManager.broadcast(`user:${userId}`, messageStr);
          this.eventsForwarded++;

          logger.debug('User event forwarded to user room', {
            eventType: event.type,
            userId,
            roomSize: this.roomManager.getRoomSize(`user:${userId}`),
          });

          // Acknowledge the message
          context.ack();
        } catch (error) {
          logger.error('Failed to forward user event', {
            error,
            eventType: event.type,
          });
          // Reject the message
          context.nack();
        }
      }
    );

    logger.info('Subscribed to user events (user.#)');
  }

  /**
   * Increment event type counter
   */
  private incrementEventType(eventType: string): void {
    const count = this.eventsByType.get(eventType) || 0;
    this.eventsByType.set(eventType, count + 1);
  }

  /**
   * Get statistics
   */
  getStats(): {
    eventsReceived: number;
    eventsForwarded: number;
    eventsByType: Record<string, number>;
    isStarted: boolean;
  } {
    return {
      eventsReceived: this.eventsReceived,
      eventsForwarded: this.eventsForwarded,
      eventsByType: Object.fromEntries(this.eventsByType),
      isStarted: this.isStarted,
    };
  }
}
