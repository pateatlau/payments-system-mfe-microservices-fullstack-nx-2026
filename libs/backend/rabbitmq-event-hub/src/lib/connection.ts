/**
 * RabbitMQ Connection Manager
 *
 * Purpose: Manage RabbitMQ connections and channels with automatic reconnection
 * Features: Connection pooling, reconnection logic, health checks, graceful shutdown
 */

import * as amqp from 'amqplib';
import { RabbitMQConnectionOptions, EventHubStats } from './types';
import { withRetry, isRetryableError } from './retry';

/**
 * Default connection options
 */
const defaultConnectionOptions: Partial<RabbitMQConnectionOptions> = {
  connectionTimeout: 10000, // 10 seconds
  heartbeat: 60, // 60 seconds
  reconnection: {
    enabled: true,
    maxRetries: 0, // Infinite retries
    initialDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    multiplier: 2,
  },
  prefetch: 10,
};

/**
 * RabbitMQ Connection Manager
 *
 * Manages a single connection to RabbitMQ with automatic reconnection
 */
export class RabbitMQConnectionManager {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private readonly options: RabbitMQConnectionOptions;
  private reconnecting = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private stats: EventHubStats;
  private startTime: number;
  private closed = false;

  constructor(options: RabbitMQConnectionOptions) {
    this.options = {
      ...defaultConnectionOptions,
      ...options,
    } as RabbitMQConnectionOptions;
    this.startTime = Date.now();
    this.stats = {
      published: 0,
      consumed: 0,
      acknowledged: 0,
      rejected: 0,
      nacked: 0,
      errors: 0,
      connected: false,
      uptime: 0,
    };
  }

  /**
   * Connect to RabbitMQ
   */
  async connect(): Promise<void> {
    if (this.closed) {
      throw new Error('Connection manager is closed');
    }

    if (this.connection && this.channel) {
      return; // Already connected
    }

    try {
      console.log('[RabbitMQ] Connecting to:', this.options.url);

      // Create connection
      this.connection = await amqp.connect(this.options.url, {
        timeout: this.options.connectionTimeout,
        heartbeat: this.options.heartbeat,
      });

      // Set up connection event handlers
      this.connection.on('error', (err: Error) => {
        console.error('[RabbitMQ] Connection error:', err);
        this.stats.errors++;
        this.handleConnectionError(err);
      });

      this.connection.on('close', () => {
        console.log('[RabbitMQ] Connection closed');
        this.stats.connected = false;
        this.connection = null;
        this.channel = null;
        this.scheduleReconnect();
      });

      // Create channel (confirm channel for publisher confirms)
      if (!this.connection) {
        throw new Error('Connection not established');
      }
      this.channel = await this.connection.createConfirmChannel();

      // Set prefetch
      if (this.options.prefetch) {
        await this.channel.prefetch(this.options.prefetch);
      }

      // Set up channel event handlers
      this.channel.on('error', (err: Error) => {
        console.error('[RabbitMQ] Channel error:', err);
        this.stats.errors++;
      });

      this.channel.on('close', () => {
        console.log('[RabbitMQ] Channel closed');
        this.channel = null;
      });

      this.stats.connected = true;
      this.reconnecting = false;
      console.log('[RabbitMQ] Connected successfully');
    } catch (error) {
      const err = error as Error;
      console.error('[RabbitMQ] Connection failed:', err.message);
      this.stats.errors++;
      this.stats.connected = false;
      this.connection = null;
      this.channel = null;

      // Schedule reconnect if enabled
      if (this.options.reconnection?.enabled && isRetryableError(err)) {
        this.scheduleReconnect();
      } else {
        throw error;
      }
    }
  }

  /**
   * Get the current channel
   */
  async getChannel(): Promise<amqp.Channel> {
    if (!this.channel) {
      await this.connect();
    }

    if (!this.channel) {
      throw new Error('Failed to get channel');
    }

    return this.channel;
  }

  /**
   * Get the current connection
   */
  async getConnection(): Promise<amqp.Connection> {
    if (!this.connection) {
      await this.connect();
    }

    if (!this.connection) {
      throw new Error('Failed to get connection');
    }

    return this.connection;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return (
      this.stats.connected && this.connection !== null && this.channel !== null
    );
  }

  /**
   * Handle connection error
   */
  private handleConnectionError(error: Error): void {
    if (!isRetryableError(error)) {
      console.error('[RabbitMQ] Non-retryable error:', error.message);
      return;
    }

    this.scheduleReconnect();
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (
      this.closed ||
      this.reconnecting ||
      !this.options.reconnection?.enabled
    ) {
      return;
    }

    this.reconnecting = true;
    this.stats.connected = false;

    const delay = this.options.reconnection.initialDelay;
    console.log(`[RabbitMQ] Reconnecting in ${delay}ms...`);

    this.reconnectTimer = setTimeout(async () => {
      try {
        await withRetry(
          () => this.connect(),
          {
            maxRetries: this.options.reconnection!.maxRetries,
            initialDelay: this.options.reconnection!.initialDelay,
            maxDelay: this.options.reconnection!.maxDelay,
            multiplier: this.options.reconnection!.multiplier,
            jitter: true,
          },
          (attempt, error, delay) => {
            console.log(
              `[RabbitMQ] Reconnection attempt ${attempt} failed: ${error.message}. Retrying in ${delay}ms...`
            );
          }
        );
      } catch (error) {
        console.error('[RabbitMQ] Reconnection failed:', error);
        this.reconnecting = false;
        this.stats.errors++;
      }
    }, delay);
  }

  /**
   * Close the connection
   */
  async close(): Promise<void> {
    this.closed = true;

    // Clear reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      // Close channel
      if (this.channel) {
        try {
          await this.channel.close();
        } catch (err) {
          console.warn('[RabbitMQ] Error closing channel:', err);
        }
        this.channel = null;
      }

      // Close connection
      if (this.connection) {
        try {
          await this.connection.close();
        } catch (err) {
          console.warn('[RabbitMQ] Error closing connection:', err);
        }
        this.connection = null;
      }

      this.stats.connected = false;
      console.log('[RabbitMQ] Connection closed gracefully');
    } catch (error) {
      console.error('[RabbitMQ] Error closing connection:', error);
      throw error;
    }
  }

  /**
   * Get connection statistics
   */
  getStats(): EventHubStats {
    return {
      ...this.stats,
      uptime: Date.now() - this.startTime,
    };
  }

  /**
   * Update stats
   */
  incrementStat(stat: keyof EventHubStats): void {
    if (typeof this.stats[stat] === 'number') {
      (this.stats[stat] as number)++;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected() || !this.connection) {
        return false;
      }

      // Try to create a temporary channel to verify connection
      const tempChannel = await this.connection.createChannel();
      await tempChannel.close();

      return true;
    } catch (error) {
      console.error('[RabbitMQ] Health check failed:', error);
      return false;
    }
  }
}
