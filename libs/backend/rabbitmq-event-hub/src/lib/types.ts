/**
 * RabbitMQ Event Hub Types
 *
 * Purpose: Define event types and interfaces for RabbitMQ-based event-driven architecture
 * Features: BaseEvent, EventHandler, EventMetadata, EventContext
 *
 * Zero-Coupling Pattern:
 * - Services communicate ONLY via events
 * - No direct API calls between services
 * - Eventual consistency via event synchronization
 */

/**
 * Base Event Interface
 *
 * All events published through the event hub must implement this interface
 */
export interface BaseEvent<T = unknown> {
  /** Unique event identifier (UUID) */
  id: string;

  /** Event type (e.g., 'user.created', 'payment.completed') */
  type: string;

  /** Event schema version (for backward compatibility) */
  version: string;

  /** ISO 8601 timestamp of when the event occurred */
  timestamp: string;

  /** Source service that published the event (e.g., 'auth-service') */
  source: string;

  /** Optional correlation ID for tracing related events */
  correlationId?: string;

  /** Optional causation ID (ID of the event that caused this event) */
  causationId?: string;

  /** Event-specific payload data */
  data: T;

  /** Optional metadata (tags, priority, etc.) */
  metadata?: EventMetadata;
}

/**
 * Event Metadata
 *
 * Additional information about the event
 */
export interface EventMetadata {
  /** User ID who triggered the event (if applicable) */
  userId?: string;

  /** IP address of the requester */
  ipAddress?: string;

  /** User agent string */
  userAgent?: string;

  /** Custom tags for filtering/routing */
  tags?: string[];

  /** Priority level (1-10, higher = more important) */
  priority?: number;

  /** Time-to-live in milliseconds (for expiring events) */
  ttl?: number;

  /** Retry count (for failed event processing) */
  retryCount?: number;

  /** Additional custom metadata */
  [key: string]: unknown;
}

/**
 * Event Handler Function
 *
 * Callback function invoked when an event is received
 */
export type EventHandler<T = unknown> = (
  event: BaseEvent<T>,
  context: EventContext
) => Promise<void>;

/**
 * Event Context
 *
 * Context information provided to event handlers
 */
export interface EventContext {
  /** Acknowledge the message (mark as successfully processed) */
  ack: () => void;

  /** Negative acknowledge - requeue the message */
  nack: (requeue?: boolean) => void;

  /** Reject the message without requeue */
  reject: () => void;

  /** Exchange name */
  exchange: string;

  /** Routing key */
  routingKey: string;

  /** Delivery tag (for manual acknowledgment) */
  deliveryTag: number;

  /** Whether the message was redelivered */
  redelivered: boolean;

  /** Message properties */
  properties: MessageProperties;
}

/**
 * Message Properties
 *
 * AMQP message properties
 */
export interface MessageProperties {
  /** Content type (e.g., 'application/json') */
  contentType?: string;

  /** Content encoding (e.g., 'utf-8') */
  contentEncoding?: string;

  /** Message ID */
  messageId?: string;

  /** Correlation ID */
  correlationId?: string;

  /** Reply-to queue */
  replyTo?: string;

  /** Expiration time */
  expiration?: string;

  /** Message priority (0-9) */
  priority?: number;

  /** Timestamp */
  timestamp?: number;

  /** Message type */
  type?: string;

  /** App ID */
  appId?: string;

  /** Custom headers */
  headers?: Record<string, unknown>;
}

/**
 * RabbitMQ Connection Options
 */
export interface RabbitMQConnectionOptions {
  /** RabbitMQ connection URL */
  url: string;

  /** Connection timeout in milliseconds */
  connectionTimeout?: number;

  /** Heartbeat interval in seconds */
  heartbeat?: number;

  /** Reconnection options */
  reconnection?: {
    /** Enable automatic reconnection */
    enabled: boolean;

    /** Maximum retry attempts (0 = infinite) */
    maxRetries: number;

    /** Initial retry delay in milliseconds */
    initialDelay: number;

    /** Maximum retry delay in milliseconds */
    maxDelay: number;

    /** Backoff multiplier */
    multiplier: number;
  };

  /** Prefetch count (number of messages to fetch at once) */
  prefetch?: number;
}

/**
 * Publisher Options
 */
export interface PublisherOptions {
  /** Exchange name */
  exchange: string;

  /** Exchange type (topic, direct, fanout, headers) */
  exchangeType?: 'topic' | 'direct' | 'fanout' | 'headers';

  /** Make the exchange durable (survives broker restart) */
  durable?: boolean;

  /** Auto-delete the exchange when no longer used */
  autoDelete?: boolean;

  /** Default message properties */
  defaultProperties?: Partial<MessageProperties>;

  /** Enable publisher confirms */
  confirm?: boolean;

  /** Publish timeout in milliseconds */
  timeout?: number;
}

/**
 * Subscriber Options
 */
export interface SubscriberOptions {
  /** Exchange name */
  exchange: string;

  /** Queue name (if not provided, generates a unique name) */
  queue?: string;

  /** Routing key pattern (e.g., 'user.*', 'payment.completed') */
  routingKeyPattern: string;

  /** Make the queue durable (survives broker restart) */
  durable?: boolean;

  /** Auto-delete the queue when no longer used */
  autoDelete?: boolean;

  /** Exclusive queue (only accessible by this connection) */
  exclusive?: boolean;

  /** Enable manual acknowledgment (recommended) */
  manualAck?: boolean;

  /** Prefetch count */
  prefetch?: number;

  /** Dead letter exchange (for failed messages) */
  deadLetterExchange?: string;

  /** Dead letter routing key */
  deadLetterRoutingKey?: string;

  /** Message TTL in milliseconds */
  messageTtl?: number;

  /** Queue arguments */
  arguments?: Record<string, unknown>;
}

/**
 * Retry Strategy
 */
export interface RetryStrategy {
  /** Maximum retry attempts */
  maxRetries: number;

  /** Initial retry delay in milliseconds */
  initialDelay: number;

  /** Maximum retry delay in milliseconds */
  maxDelay: number;

  /** Backoff multiplier */
  multiplier: number;

  /** Enable jitter (randomness) to prevent thundering herd */
  jitter?: boolean;
}

/**
 * Event Hub Statistics
 */
export interface EventHubStats {
  /** Total messages published */
  published: number;

  /** Total messages consumed */
  consumed: number;

  /** Total messages acknowledged */
  acknowledged: number;

  /** Total messages rejected */
  rejected: number;

  /** Total messages nacked */
  nacked: number;

  /** Total errors */
  errors: number;

  /** Connection status */
  connected: boolean;

  /** Uptime in milliseconds */
  uptime: number;

  /** Last publish timestamp */
  lastPublish?: string;

  /** Last consume timestamp */
  lastConsume?: string;
}
