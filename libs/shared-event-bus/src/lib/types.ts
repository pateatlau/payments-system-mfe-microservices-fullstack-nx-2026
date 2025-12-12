/**
 * Event Bus Base Types
 *
 * Defines the base event interface and metadata structure
 * All events in the system extend these base types
 */

/**
 * Event source identifiers
 * Identifies which MFE emitted the event
 */
export type EventSource = 'shell' | 'auth-mfe' | 'payments-mfe' | 'admin-mfe';

/**
 * Event metadata
 * Contains information about when and where the event was created
 */
export interface EventMeta {
  /** Timestamp when event was created (ISO 8601) */
  timestamp: string;
  /** Source MFE that emitted the event */
  source: EventSource;
  /** Event version for schema evolution */
  version: number;
  /** Optional correlation ID for tracing related events */
  correlationId?: string;
}

/**
 * Base event interface
 * All events extend this base interface
 */
export interface BaseEvent<T = unknown> {
  /** Event type identifier (e.g., 'auth:login', 'payments:created') */
  type: string;
  /** Event payload with type-specific data */
  payload: T;
  /** Event metadata */
  meta: EventMeta;
}
