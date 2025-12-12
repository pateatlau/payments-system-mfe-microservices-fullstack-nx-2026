/**
 * WebSocket Client Types
 *
 * Type definitions for WebSocket client library
 */

/**
 * WebSocket message types (matching server)
 */
export type WebSocketMessageType =
  // Client → Server
  | 'ping'
  | 'subscribe'
  | 'unsubscribe'
  | 'message'
  // Server → Client
  | 'pong'
  | 'subscribed'
  | 'unsubscribed'
  | 'event'
  | 'error'
  | 'connected';

/**
 * WebSocket message structure
 */
export interface WebSocketMessage<T = unknown> {
  type: WebSocketMessageType;
  payload?: T;
  timestamp: string;
  id?: string;
}

/**
 * WebSocket connection status
 */
export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

/**
 * WebSocket event payload (from server)
 */
export interface WebSocketEventPayload {
  eventType: string;
  data: unknown;
}

/**
 * WebSocket client configuration
 */
export interface WebSocketClientConfig {
  /** WebSocket URL */
  url: string;

  /** JWT token for authentication */
  token?: string;

  /** Enable auto-reconnect (default: true) */
  autoReconnect?: boolean;

  /** Maximum reconnect attempts (default: 10) */
  maxReconnectAttempts?: number;

  /** Initial reconnect delay in ms (default: 1000) */
  reconnectDelay?: number;

  /** Maximum reconnect delay in ms (default: 30000) */
  maxReconnectDelay?: number;

  /** Ping interval in ms (default: 30000) */
  pingInterval?: number;

  /** Debug mode (default: false) */
  debug?: boolean;
}

/**
 * Event listener callback
 */
export type EventListener<T = unknown> = (payload: T) => void;

/**
 * WebSocket client interface
 */
export interface IWebSocketClient {
  connect(): void;
  disconnect(): void;
  send(message: WebSocketMessage): void;
  subscribe(eventType: string): void;
  unsubscribe(eventType: string): void;
  on<T = unknown>(event: string, callback: EventListener<T>): void;
  off<T = unknown>(event: string, callback: EventListener<T>): void;
  getStatus(): ConnectionStatus;
  isConnected(): boolean;
}
