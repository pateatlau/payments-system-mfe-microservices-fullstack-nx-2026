/**
 * WebSocket Client
 *
 * Production-ready WebSocket client with:
 * - Automatic reconnection with exponential backoff
 * - Message queuing for offline messages
 * - Event-based API
 * - Heartbeat (ping/pong)
 * - JWT authentication
 */

import { ReconnectionManager } from './reconnection';
import type {
  WebSocketClientConfig,
  WebSocketMessage,
  ConnectionStatus,
  EventListener,
  IWebSocketClient,
} from './types';

const DEFAULT_CONFIG: Partial<WebSocketClientConfig> = {
  autoReconnect: true,
  maxReconnectAttempts: 10,
  reconnectDelay: 1000,
  maxReconnectDelay: 30000,
  pingInterval: 30000,
  debug: false,
};

export class WebSocketClient implements IWebSocketClient {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketClientConfig>;
  private status: ConnectionStatus = 'disconnected';
  private reconnectionManager: ReconnectionManager;
  private listeners: Map<string, Set<EventListener>> = new Map();
  private messageQueue: WebSocketMessage[] = [];
  private pingTimer: NodeJS.Timeout | null = null;
  private subscriptions: Set<string> = new Set();

  constructor(config: WebSocketClientConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config } as Required<WebSocketClientConfig>;
    this.reconnectionManager = new ReconnectionManager({
      maxAttempts: this.config.maxReconnectAttempts,
      initialDelay: this.config.reconnectDelay,
      maxDelay: this.config.maxReconnectDelay,
    });
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      this.log('Already connected or connecting');
      return;
    }

    this.setStatus('connecting');

    try {
      // Build URL with token in query parameter
      const url = this.buildUrl();
      this.ws = new WebSocket(url);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);

      this.log('Connecting to WebSocket server', url);
    } catch (error) {
      this.log('Failed to connect', error);
      this.setStatus('error');
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.log('Disconnecting');

    // Cancel reconnection
    this.reconnectionManager.cancelReconnect();

    // Stop ping timer
    this.stopPing();

    // Close WebSocket
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.setStatus('disconnected');
  }

  /**
   * Send message to server
   */
  send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      this.log('Sent message', message);
    } else {
      // Queue message for later
      this.messageQueue.push(message);
      this.log('Message queued (offline)', message);
    }
  }

  /**
   * Subscribe to an event type
   */
  subscribe(eventType: string): void {
    if (this.subscriptions.has(eventType)) {
      this.log('Already subscribed to', eventType);
      return;
    }

    this.subscriptions.add(eventType);

    this.send({
      type: 'subscribe',
      payload: { eventType },
      timestamp: new Date().toISOString(),
    });

    this.log('Subscribed to', eventType);
  }

  /**
   * Unsubscribe from an event type
   */
  unsubscribe(eventType: string): void {
    if (!this.subscriptions.has(eventType)) {
      this.log('Not subscribed to', eventType);
      return;
    }

    this.subscriptions.delete(eventType);

    this.send({
      type: 'unsubscribe',
      payload: { eventType },
      timestamp: new Date().toISOString(),
    });

    this.log('Unsubscribed from', eventType);
  }

  /**
   * Register event listener
   */
  on<T = unknown>(event: string, callback: EventListener<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as EventListener);
    this.log('Registered listener for', event);
  }

  /**
   * Unregister event listener
   */
  off<T = unknown>(event: string, callback: EventListener<T>): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback as EventListener);
      if (callbacks.size === 0) {
        this.listeners.delete(event);
      }
      this.log('Unregistered listener for', event);
    }
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.status === 'connected';
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    this.log('Connected');
    this.setStatus('connected');
    this.reconnectionManager.reset();

    // Flush message queue
    this.flushMessageQueue();

    // Re-subscribe to events
    this.resubscribe();

    // Start ping timer
    this.startPing();

    // Emit connected event
    this.emit('connected', {});
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    this.log('Disconnected', event.code, event.reason);
    this.stopPing();

    // Clean close (1000 = normal closure)
    if (event.code === 1000) {
      this.setStatus('disconnected');
      this.emit('disconnected', { code: event.code, reason: event.reason });
      return;
    }

    // Unexpected close - schedule reconnect
    this.setStatus('reconnecting');
    this.emit('disconnected', { code: event.code, reason: event.reason });
    this.scheduleReconnect();
  }

  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      this.log('Received message', message);

      // Handle pong
      if (message.type === 'pong') {
        this.log('Pong received');
        return;
      }

      // Handle event messages
      if (message.type === 'event' && message.payload) {
        const payload = message.payload as { eventType: string; data: unknown };
        this.emit(payload.eventType, payload.data);
      }

      // Emit raw message
      this.emit('message', message);
    } catch (error) {
      this.log('Failed to parse message', error);
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    this.log('WebSocket error', event);
    this.setStatus('error');
    this.emit('error', { error: event });
  }

  /**
   * Build WebSocket URL with token
   */
  private buildUrl(): string {
    const url = new URL(this.config.url);

    if (this.config.token) {
      url.searchParams.set('token', this.config.token);
    }

    return url.toString();
  }

  /**
   * Set connection status and emit event
   */
  private setStatus(status: ConnectionStatus): void {
    const oldStatus = this.status;
    this.status = status;

    if (oldStatus !== status) {
      this.emit('status', { status, oldStatus });
      this.log('Status changed', oldStatus, '→', status);
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (!this.config.autoReconnect) {
      this.log('Auto-reconnect disabled');
      return;
    }

    const scheduled = this.reconnectionManager.scheduleReconnect(() => {
      this.log('Reconnecting...', this.reconnectionManager.getAttempts());
      this.connect();
    });

    if (!scheduled) {
      this.log('Max reconnect attempts reached');
      this.setStatus('error');
      this.emit('max_reconnect_attempts', {
        attempts: this.reconnectionManager.getAttempts(),
      });
    }
  }

  /**
   * Flush queued messages
   */
  private flushMessageQueue(): void {
    if (this.messageQueue.length === 0) return;

    this.log('Flushing message queue', this.messageQueue.length);

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      this.send(message);
    }
  }

  /**
   * Re-subscribe to events after reconnection
   */
  private resubscribe(): void {
    if (this.subscriptions.size === 0) return;

    this.log('Re-subscribing to events', this.subscriptions.size);

    this.subscriptions.forEach((eventType) => {
      this.send({
        type: 'subscribe',
        payload: { eventType },
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Start ping timer
   */
  private startPing(): void {
    this.stopPing();

    this.pingTimer = setInterval(() => {
      this.send({
        type: 'ping',
        timestamp: new Date().toISOString(),
      });
      this.log('Ping sent');
    }, this.config.pingInterval);
  }

  /**
   * Stop ping timer
   */
  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, payload: unknown): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(payload);
        } catch (error) {
          this.log('Error in event listener', event, error);
        }
      });
    }
  }

  /**
   * Log debug message
   */
  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[WebSocketClient]', ...args);
    }
  }
}
